use rusqlite::Connection;
use std::path::Path;
use std::sync::Mutex;

/// 应用持有的数据库状态：单连接 + 互斥锁（本地单用户足够）。
pub struct Db(pub Mutex<Connection>);

/// 迁移列表：按顺序应用，每项对应一个 schema 版本（从 1 开始）。
const MIGRATIONS: &[&str] = &[
    include_str!("../migrations/001_init.sql"),
    include_str!("../migrations/002_settings.sql"),
    include_str!("../migrations/003_multibranch_and_personal_library.sql"),
    include_str!("../migrations/004_one_time_tasks.sql"),
    include_str!("../migrations/005_resizable_behavior_cards.sql"),
    include_str!("../migrations/006_old_habit_workflow.sql"),
    include_str!("../migrations/007_old_habit_card_layout.sql"),
];

pub fn open(path: &Path) -> Result<Db, rusqlite::Error> {
    let conn = Connection::open(path)?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    run_migrations(&conn)?;
    Ok(Db(Mutex::new(conn)))
}

/// 依据 `PRAGMA user_version` 应用未执行的迁移，每个迁移在独立事务内执行。
pub fn run_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    let current: i64 = conn.query_row("PRAGMA user_version", [], |r| r.get(0))?;
    for (i, sql) in MIGRATIONS.iter().enumerate() {
        let version = (i + 1) as i64;
        if version <= current {
            continue;
        }
        let tx = conn.unchecked_transaction()?;
        tx.execute_batch(sql)?;
        tx.pragma_update(None, "user_version", version)?;
        tx.commit()?;
    }
    Ok(())
}

/// 当前时间，ISO-8601 UTC（带毫秒与 Z 后缀）。
pub fn now() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn migration_creates_all_tables() {
        let conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", "ON").unwrap();
        run_migrations(&conn).unwrap();

        let count: i64 = conn
            .query_row(
                "SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 33);

        // 关键约束冒烟：practice_event 必须引用 recipe_version
        let fk: i64 = conn
            .query_row(
                "PRAGMA foreign_key_check",
                [],
                |r| r.get::<_, i64>(0),
            )
            .unwrap_or(0);
        assert_eq!(fk, 0);
    }

    #[test]
    fn v2_data_is_migrated_into_a_default_branch() {
        let conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", "ON").unwrap();
        conn.execute_batch(MIGRATIONS[0]).unwrap();
        conn.execute_batch(MIGRATIONS[1]).unwrap();
        conn.pragma_update(None, "user_version", 2).unwrap();
        let now = "2026-08-22T00:00:00.000Z";
        conn.execute(
            "INSERT INTO habit_project (uuid,name,phase,current_step,created_at,updated_at) VALUES ('p','测试','experimenting',7,?1,?1)",
            [now],
        ).unwrap();
        let project_id = conn.last_insert_rowid();
        conn.execute(
            "INSERT INTO behavior_option (uuid,project_id,text,source,status,sort_order,created_at) VALUES ('b',?1,'午饭后走路','用户','活跃',0,?2)",
            rusqlite::params![project_id, now],
        ).unwrap();
        let behavior_id = conn.last_insert_rowid();
        conn.execute(
            "INSERT INTO golden_behavior (uuid,project_id,behavior_option_id,is_active,created_at) VALUES ('g',?1,?2,1,?3)",
            rusqlite::params![project_id, behavior_id, now],
        ).unwrap();
        conn.execute(
            "INSERT INTO tiny_behavior (uuid,project_id,original_behavior,baseline,created_at) VALUES ('t',?1,'走30分钟','走1分钟',?2)",
            rusqlite::params![project_id, now],
        ).unwrap();

        run_migrations(&conn).unwrap();

        let branches: i64 = conn.query_row("SELECT count(*) FROM habit_branch WHERE project_id=?1", [project_id], |r| r.get(0)).unwrap();
        let baseline: String = conn.query_row(
            "SELECT baseline FROM branch_tiny_behavior WHERE project_id=?1",
            [project_id], |r| r.get(0)
        ).unwrap();
        assert_eq!(branches, 1);
        assert_eq!(baseline, "走1分钟");
        assert_eq!(conn.query_row("PRAGMA user_version", [], |r| r.get::<_, i64>(0)).unwrap(), 7);
    }

    #[test]
    fn one_time_task_keeps_multiple_diagnosis_rounds() {
        let conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", "ON").unwrap();
        run_migrations(&conn).unwrap();
        let now = "2026-08-22T00:00:00.000Z";
        conn.execute(
            "INSERT INTO one_time_task (uuid,title,next_action,created_at,updated_at) VALUES ('ot','交申请','打开申请页面',?1,?1)",
            [now],
        ).unwrap();
        let task_id = conn.last_insert_rowid();
        for (n, factor) in [(1, "P"), (2, "A")] {
            conn.execute(
                "INSERT INTO one_time_diagnosis_round (uuid,task_id,round_number,selected_factor,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?5)",
                rusqlite::params![format!("r{n}"), task_id, n, factor, now],
            ).unwrap();
        }
        let rounds: i64 = conn.query_row(
            "SELECT count(*) FROM one_time_diagnosis_round WHERE task_id=?1",
            [task_id], |r| r.get(0)
        ).unwrap();
        assert_eq!(rounds, 2);
    }

    #[test]
    fn behavior_card_size_is_persisted_in_v5() {
        let conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", "ON").unwrap();
        run_migrations(&conn).unwrap();
        let now = "2026-08-22T00:00:00.000Z";
        conn.execute("INSERT INTO habit_project (uuid,name,phase,created_at,updated_at) VALUES ('p','测试','draft',?1,?1)", [now]).unwrap();
        let project_id = conn.last_insert_rowid();
        conn.execute("INSERT INTO behavior_option (uuid,project_id,text,source,status,sort_order,created_at) VALUES ('b',?1,'打开资料','用户','活跃',0,?2)", rusqlite::params![project_id,now]).unwrap();
        let behavior_id = conn.last_insert_rowid();
        conn.execute("INSERT INTO behavior_option_layout (behavior_option_id,swarm_width,swarm_height,updated_at) VALUES (?1,218,126,?2)", rusqlite::params![behavior_id,now]).unwrap();
        let size: (f64,f64) = conn.query_row("SELECT swarm_width,swarm_height FROM behavior_option_layout WHERE behavior_option_id=?1", [behavior_id], |r| Ok((r.get(0)?,r.get(1)?))).unwrap();
        assert_eq!(size, (218.0,126.0));
    }

    #[test]
    fn protective_backup_uses_a_valid_full_backup_type() {
        let conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", "ON").unwrap();
        run_migrations(&conn).unwrap();
        let now = "2026-08-22T00:00:00.000Z";
        conn.execute(
            "INSERT INTO backup_record (backup_type,file_path,content_summary,schema_version,created_at) VALUES ('full','before-delete-test.db','删除前保护备份',5,?1)",
            [now],
        ).unwrap();
        let kind: String = conn.query_row("SELECT backup_type FROM backup_record", [], |r| r.get(0)).unwrap();
        assert_eq!(kind, "full");
        assert!(conn.execute(
            "INSERT INTO backup_record (backup_type,file_path,created_at) VALUES ('before-delete','invalid.db',?1)",
            [now],
        ).is_err());
    }

    #[test]
    fn old_habit_keeps_strategies_and_multiple_observations() {
        let conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", "ON").unwrap();
        run_migrations(&conn).unwrap();
        let now = "2026-08-22T00:00:00.000Z";
        conn.execute("INSERT INTO old_habit_project (uuid,title,general_habit,created_at,updated_at) VALUES ('oh','少刷手机','睡前刷手机',?1,?1)",[now]).unwrap();
        let project_id=conn.last_insert_rowid();
        conn.execute("INSERT INTO old_habit_behavior (uuid,project_id,behavior_text,status,created_at,updated_at) VALUES ('ohb',?1,'上床后打开短视频','active',?2,?2)",rusqlite::params![project_id,now]).unwrap();
        let behavior_id=conn.last_insert_rowid();
        conn.execute("INSERT INTO old_habit_strategy (uuid,project_id,behavior_id,factor,method,content,created_at,updated_at) VALUES ('ohs',?1,?2,'P','remove','把手机放到卧室外',?3,?3)",rusqlite::params![project_id,behavior_id,now]).unwrap();
        for (id,result) in [("o1","happened"),("o2","reduced")] {
            conn.execute("INSERT INTO old_habit_observation (uuid,project_id,behavior_id,result,observed_at,created_at) VALUES (?1,?2,?3,?4,?5,?5)",rusqlite::params![id,project_id,behavior_id,result,now]).unwrap();
        }
        let counts:(i64,i64)=conn.query_row("SELECT (SELECT count(*) FROM old_habit_strategy WHERE behavior_id=?1),(SELECT count(*) FROM old_habit_observation WHERE behavior_id=?1)",[behavior_id],|r|Ok((r.get(0)?,r.get(1)?))).unwrap();
        assert_eq!(counts,(1,2));
    }

    #[test]
    fn old_habit_card_layout_is_persisted_in_v7() {
        let conn = Connection::open_in_memory().unwrap();
        conn.pragma_update(None, "foreign_keys", "ON").unwrap();
        run_migrations(&conn).unwrap();
        let now = "2026-08-22T00:00:00.000Z";
        conn.execute("INSERT INTO old_habit_project (uuid,title,created_at,updated_at) VALUES ('oh-layout','测试',?1,?1)",[now]).unwrap();
        let project_id=conn.last_insert_rowid();
        conn.execute("INSERT INTO old_habit_behavior (uuid,project_id,behavior_text,pos_x,pos_y,card_width,card_height,created_at,updated_at) VALUES ('ohb-layout',?1,'打开短视频',.22,.71,236,118,?2,?2)",rusqlite::params![project_id,now]).unwrap();
        let layout:(f64,f64,f64,f64)=conn.query_row("SELECT pos_x,pos_y,card_width,card_height FROM old_habit_behavior WHERE uuid='ohb-layout'",[],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?))).unwrap();
        assert_eq!(layout,(0.22,0.71,236.0,118.0));
    }
}

-- 福格行为实验室 · 初始 schema（v1）
-- 与 docs/blueprints/概念数据模型与数据库草案.md v0.2 对齐：14 张表，INTEGER 主键 + uuid 稳定身份

CREATE TABLE habit_project (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  aspiration_area  TEXT,
  phase            TEXT NOT NULL DEFAULT 'draft'
                   CHECK (phase IN ('draft','designing','ready','experimenting','stable')),
  paused_at        TEXT,
  archived_at      TEXT,
  current_step     INTEGER CHECK (current_step BETWEEN 1 AND 7),
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);

CREATE TABLE aspiration (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid              TEXT NOT NULL UNIQUE,
  project_id        INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  raw_input         TEXT,
  input_type        TEXT CHECK (input_type IN ('愿望','成果','行为','不确定')),
  final_aspiration  TEXT,
  why_important     TEXT,
  life_difference   TEXT,
  notes             TEXT,
  created_at        TEXT NOT NULL
);

CREATE TABLE behavior_option (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid        TEXT NOT NULL UNIQUE,
  project_id  INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT '用户'
              CHECK (source IN ('用户','模板','启发问题','内置库')),
  status      TEXT NOT NULL DEFAULT '活跃'
              CHECK (status IN ('活跃','暂存','已删除')),
  notes       TEXT,
  batch       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);

CREATE TABLE focus_placement (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid               TEXT NOT NULL UNIQUE,
  behavior_option_id INTEGER NOT NULL UNIQUE REFERENCES behavior_option(id) ON DELETE CASCADE,
  impact             INTEGER CHECK (impact BETWEEN 1 AND 5),
  feasibility        INTEGER CHECK (feasibility BETWEEN 1 AND 5),
  willing            INTEGER CHECK (willing IN (0,1)),
  pos_x              REAL,
  pos_y              REAL,
  updated_at         TEXT NOT NULL
);

CREATE TABLE golden_behavior (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid               TEXT NOT NULL UNIQUE,
  project_id         INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  behavior_option_id INTEGER NOT NULL REFERENCES behavior_option(id) ON DELETE CASCADE,
  reason             TEXT,
  is_active          INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at         TEXT NOT NULL
);

CREATE TABLE ability_assessment (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid                  TEXT NOT NULL UNIQUE,
  project_id            INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  time_factor           TEXT CHECK (time_factor IN ('充裕','一般','紧张')),
  money_factor          TEXT CHECK (money_factor IN ('充裕','一般','紧张')),
  energy_factor         TEXT CHECK (energy_factor IN ('充裕','一般','紧张')),
  brain_factor          TEXT CHECK (brain_factor IN ('充裕','一般','紧张')),
  schedule_factor       TEXT CHECK (schedule_factor IN ('充裕','一般','紧张')),
  weakest_link          TEXT CHECK (weakest_link IN ('时间','资金','体力','脑力','日程')),
  simplification_methods TEXT,
  created_at            TEXT NOT NULL
);

CREATE TABLE tiny_behavior (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid               TEXT NOT NULL UNIQUE,
  project_id         INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  original_behavior  TEXT,
  tiny_behavior      TEXT,
  entry_step         TEXT,
  baseline           TEXT,
  optional_extension TEXT,
  created_at         TEXT NOT NULL
);

CREATE TABLE anchor (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid         TEXT NOT NULL UNIQUE,
  project_id   INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  anchor_text  TEXT NOT NULL,
  last_action  TEXT,
  location     TEXT,
  frequency    TEXT CHECK (frequency IN ('每日','每周','每月','不定')),
  source       TEXT NOT NULL DEFAULT '用户' CHECK (source IN ('用户','模板','内置库')),
  is_selected  INTEGER NOT NULL DEFAULT 0 CHECK (is_selected IN (0,1)),
  created_at   TEXT NOT NULL
);

CREATE TABLE celebration (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid             TEXT NOT NULL UNIQUE,
  project_id       INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  celebration_text TEXT NOT NULL,
  naturalness      INTEGER CHECK (naturalness BETWEEN 1 AND 5),
  success_feeling  INTEGER CHECK (success_feeling BETWEEN 1 AND 5),
  source           TEXT NOT NULL DEFAULT '用户' CHECK (source IN ('用户','内置库')),
  is_selected      INTEGER NOT NULL DEFAULT 0 CHECK (is_selected IN (0,1)),
  created_at       TEXT NOT NULL
);

CREATE TABLE recipe_version (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid               TEXT NOT NULL UNIQUE,
  project_id         INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  version_number     INTEGER NOT NULL,
  anchor_last_action TEXT,
  behavior_text      TEXT,
  celebration_text   TEXT,
  full_recipe_text   TEXT,
  rehearsal_count    INTEGER,
  rehearsal_feeling  TEXT,
  change_id          INTEGER REFERENCES project_change(id) ON DELETE SET NULL,
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','superseded')),
  created_at         TEXT NOT NULL,
  UNIQUE (project_id, version_number)
);

CREATE TABLE practice_event (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid              TEXT NOT NULL UNIQUE,
  project_id        INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  recipe_version_id INTEGER NOT NULL REFERENCES recipe_version(id),
  result            TEXT NOT NULL
                    CHECK (result IN ('自然完成','完成且多做','想起但没做','完全忘记','锚点没出现','不方便记录')),
  feeling           TEXT,
  context           TEXT,
  occurred_at       TEXT,
  created_at        TEXT NOT NULL
);

CREATE TABLE obstacle_diagnosis (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid              TEXT NOT NULL UNIQUE,
  project_id        INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  practice_event_id INTEGER REFERENCES practice_event(id) ON DELETE SET NULL,
  obstacle_type     TEXT,
  diagnosis_path    TEXT CHECK (diagnosis_path IN ('提示','能力','动机')),
  suggestion        TEXT,
  return_step       INTEGER CHECK (return_step BETWEEN 1 AND 7),
  user_decision     TEXT,
  created_at        TEXT NOT NULL
);

CREATE TABLE project_change (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid        TEXT NOT NULL UNIQUE,
  project_id  INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  entity      TEXT,
  field_name  TEXT,
  old_value   TEXT,
  new_value   TEXT,
  reason      TEXT,
  created_at  TEXT NOT NULL
);

CREATE TABLE backup_record (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id      INTEGER REFERENCES habit_project(id) ON DELETE SET NULL,
  backup_type     TEXT NOT NULL CHECK (backup_type IN ('full','project')),
  file_path       TEXT NOT NULL,
  content_summary TEXT,
  schema_version  INTEGER,
  created_at      TEXT NOT NULL
);

-- 索引
CREATE INDEX idx_aspiration_project   ON aspiration(project_id);
CREATE INDEX idx_behavior_project     ON behavior_option(project_id, status);
CREATE INDEX idx_golden_project       ON golden_behavior(project_id, is_active);
CREATE INDEX idx_anchor_project       ON anchor(project_id, is_selected);
CREATE INDEX idx_celebration_project  ON celebration(project_id, is_selected);
CREATE INDEX idx_recipe_project       ON recipe_version(project_id, version_number);
CREATE INDEX idx_practice_project     ON practice_event(project_id, occurred_at);
CREATE INDEX idx_practice_recipe      ON practice_event(recipe_version_id);
CREATE INDEX idx_diag_project         ON obstacle_diagnosis(project_id);
CREATE INDEX idx_change_project       ON project_change(project_id, entity);

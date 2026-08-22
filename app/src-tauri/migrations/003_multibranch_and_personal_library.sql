-- 多黄金行为、微习惯分支、九级画布与个人参考库（v3）

CREATE TABLE behavior_option_layout (
  behavior_option_id INTEGER PRIMARY KEY REFERENCES behavior_option(id) ON DELETE CASCADE,
  swarm_pos_x        REAL,
  swarm_pos_y        REAL,
  focus_pos_x        REAL,
  focus_pos_y        REAL,
  impact_score       INTEGER CHECK (impact_score BETWEEN 1 AND 9),
  feasibility_score  INTEGER CHECK (feasibility_score BETWEEN 1 AND 9),
  updated_at         TEXT NOT NULL
);

INSERT INTO behavior_option_layout (
  behavior_option_id, focus_pos_x, focus_pos_y, impact_score, feasibility_score, updated_at
)
SELECT
  behavior_option_id,
  pos_x,
  pos_y,
  CASE WHEN impact IS NULL THEN NULL ELSE MIN(9, MAX(1, impact * 2 - 1)) END,
  CASE WHEN feasibility IS NULL THEN NULL ELSE MIN(9, MAX(1, feasibility * 2 - 1)) END,
  updated_at
FROM focus_placement;

CREATE TABLE habit_branch (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid               TEXT NOT NULL UNIQUE,
  project_id         INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  golden_behavior_id INTEGER REFERENCES golden_behavior(id) ON DELETE SET NULL,
  name               TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'designing'
                     CHECK (status IN ('designing','practicing','stable','paused','archived')),
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE INDEX idx_branch_project ON habit_branch(project_id, status);
CREATE INDEX idx_branch_golden ON habit_branch(golden_behavior_id);

-- 为旧项目中已选黄金行为创建默认分支。
INSERT INTO habit_branch (uuid, project_id, golden_behavior_id, name, status, created_at, updated_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-7' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  gb.project_id,
  gb.id,
  bo.text,
  CASE WHEN hp.phase IN ('ready','experimenting','stable') THEN
    CASE hp.phase WHEN 'stable' THEN 'stable' ELSE 'practicing' END
  ELSE 'designing' END,
  gb.created_at,
  hp.updated_at
FROM golden_behavior gb
JOIN behavior_option bo ON bo.id = gb.behavior_option_id
JOIN habit_project hp ON hp.id = gb.project_id
WHERE gb.is_active = 1;

-- 旧项目已有后续设计但没有黄金行为时，也建立一个可继续编辑的默认分支。
INSERT INTO habit_branch (uuid, project_id, golden_behavior_id, name, status, created_at, updated_at)
SELECT
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-7' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  hp.id,
  NULL,
  '原有微习惯',
  CASE WHEN hp.phase IN ('ready','experimenting','stable') THEN
    CASE hp.phase WHEN 'stable' THEN 'stable' ELSE 'practicing' END
  ELSE 'designing' END,
  hp.created_at,
  hp.updated_at
FROM habit_project hp
WHERE NOT EXISTS (SELECT 1 FROM habit_branch hb WHERE hb.project_id = hp.id)
  AND (
    EXISTS (SELECT 1 FROM ability_assessment x WHERE x.project_id = hp.id) OR
    EXISTS (SELECT 1 FROM tiny_behavior x WHERE x.project_id = hp.id) OR
    EXISTS (SELECT 1 FROM anchor x WHERE x.project_id = hp.id) OR
    EXISTS (SELECT 1 FROM celebration x WHERE x.project_id = hp.id) OR
    EXISTS (SELECT 1 FROM recipe_version x WHERE x.project_id = hp.id)
  );

CREATE TABLE branch_ability (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid                   TEXT NOT NULL UNIQUE,
  project_id             INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  branch_id              INTEGER NOT NULL UNIQUE REFERENCES habit_branch(id) ON DELETE CASCADE,
  weakest_link           TEXT CHECK (weakest_link IN ('时间','资金','体力','脑力','日程')),
  weakest_details        TEXT,
  simplification_methods TEXT,
  skill_target           TEXT,
  skill_plan             TEXT,
  tools_needed           TEXT,
  resources_available    TEXT,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL
);

CREATE TABLE branch_tiny_behavior (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid               TEXT NOT NULL UNIQUE,
  project_id         INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  branch_id          INTEGER NOT NULL UNIQUE REFERENCES habit_branch(id) ON DELETE CASCADE,
  original_behavior  TEXT,
  tiny_behavior      TEXT,
  entry_step         TEXT,
  baseline           TEXT,
  optional_extension TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE TABLE branch_anchor (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid        TEXT NOT NULL UNIQUE,
  project_id  INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  branch_id   INTEGER NOT NULL REFERENCES habit_branch(id) ON DELETE CASCADE,
  anchor_text TEXT NOT NULL,
  last_action TEXT,
  location    TEXT,
  frequency   TEXT CHECK (frequency IN ('每日','每周','每月','不定')),
  source      TEXT NOT NULL DEFAULT '用户',
  is_selected INTEGER NOT NULL DEFAULT 0 CHECK (is_selected IN (0,1)),
  created_at  TEXT NOT NULL
);

CREATE INDEX idx_branch_anchor ON branch_anchor(branch_id, is_selected);

CREATE TABLE branch_celebration (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid             TEXT NOT NULL UNIQUE,
  project_id       INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  branch_id        INTEGER NOT NULL REFERENCES habit_branch(id) ON DELETE CASCADE,
  celebration_text TEXT NOT NULL,
  naturalness      INTEGER CHECK (naturalness BETWEEN 1 AND 5),
  success_feeling  INTEGER CHECK (success_feeling BETWEEN 1 AND 5),
  source           TEXT NOT NULL DEFAULT '用户',
  is_selected      INTEGER NOT NULL DEFAULT 0 CHECK (is_selected IN (0,1)),
  created_at       TEXT NOT NULL
);

CREATE INDEX idx_branch_celebration ON branch_celebration(branch_id, is_selected);

CREATE TABLE branch_recipe_version (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid               TEXT NOT NULL UNIQUE,
  project_id         INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  branch_id          INTEGER NOT NULL REFERENCES habit_branch(id) ON DELETE CASCADE,
  version_number     INTEGER NOT NULL,
  anchor_last_action TEXT,
  behavior_text      TEXT,
  celebration_text   TEXT,
  full_recipe_text   TEXT,
  rehearsal_count    INTEGER,
  rehearsal_feeling  TEXT,
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','superseded')),
  legacy_recipe_id   INTEGER UNIQUE,
  created_at         TEXT NOT NULL,
  UNIQUE (branch_id, version_number)
);

CREATE INDEX idx_branch_recipe ON branch_recipe_version(branch_id, version_number);

CREATE TABLE branch_practice_event (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid              TEXT NOT NULL UNIQUE,
  project_id        INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  branch_id         INTEGER NOT NULL REFERENCES habit_branch(id) ON DELETE CASCADE,
  recipe_version_id INTEGER NOT NULL REFERENCES branch_recipe_version(id),
  result            TEXT NOT NULL
                    CHECK (result IN ('自然完成','完成且多做','想起但没做','完全忘记','锚点没出现','不方便记录')),
  feeling           TEXT,
  context           TEXT,
  occurred_at       TEXT,
  legacy_practice_id INTEGER UNIQUE,
  created_at        TEXT NOT NULL
);

CREATE INDEX idx_branch_practice ON branch_practice_event(branch_id, occurred_at);

CREATE TABLE branch_obstacle_diagnosis (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid              TEXT NOT NULL UNIQUE,
  project_id        INTEGER NOT NULL REFERENCES habit_project(id) ON DELETE CASCADE,
  branch_id         INTEGER NOT NULL REFERENCES habit_branch(id) ON DELETE CASCADE,
  practice_event_id INTEGER REFERENCES branch_practice_event(id) ON DELETE SET NULL,
  obstacle_type     TEXT,
  diagnosis_path    TEXT CHECK (diagnosis_path IN ('提示','能力','动机')),
  suggestion        TEXT,
  return_step       INTEGER CHECK (return_step BETWEEN 1 AND 7),
  user_decision     TEXT,
  created_at        TEXT NOT NULL
);

CREATE INDEX idx_branch_diagnosis ON branch_obstacle_diagnosis(branch_id);

CREATE TABLE personal_reference_item (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid               TEXT NOT NULL UNIQUE,
  kind               TEXT NOT NULL CHECK (kind IN ('behavior','recipe','anchor','celebration','affirmation')),
  title              TEXT,
  content            TEXT NOT NULL,
  structured_content TEXT,
  category           TEXT,
  tags               TEXT,
  source             TEXT NOT NULL DEFAULT '用户',
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE INDEX idx_personal_reference_kind ON personal_reference_item(kind, updated_at);

-- 将旧版步骤四至七数据复制到每个项目的首个默认分支中。
INSERT INTO branch_ability (
  uuid, project_id, branch_id, weakest_link, simplification_methods, created_at, updated_at
)
SELECT aa.uuid, aa.project_id, hb.id, aa.weakest_link, aa.simplification_methods, aa.created_at, aa.created_at
FROM ability_assessment aa
JOIN habit_branch hb ON hb.id = (SELECT MIN(h2.id) FROM habit_branch h2 WHERE h2.project_id = aa.project_id);

INSERT INTO branch_tiny_behavior (
  uuid, project_id, branch_id, original_behavior, tiny_behavior, entry_step, baseline, optional_extension, created_at, updated_at
)
SELECT tb.uuid, tb.project_id, hb.id, tb.original_behavior, tb.tiny_behavior, tb.entry_step, tb.baseline, tb.optional_extension, tb.created_at, tb.created_at
FROM tiny_behavior tb
JOIN habit_branch hb ON hb.id = (SELECT MIN(h2.id) FROM habit_branch h2 WHERE h2.project_id = tb.project_id);

INSERT INTO branch_anchor (
  uuid, project_id, branch_id, anchor_text, last_action, location, frequency, source, is_selected, created_at
)
SELECT a.uuid, a.project_id, hb.id, a.anchor_text, a.last_action, a.location, a.frequency, a.source, a.is_selected, a.created_at
FROM anchor a
JOIN habit_branch hb ON hb.id = (SELECT MIN(h2.id) FROM habit_branch h2 WHERE h2.project_id = a.project_id);

INSERT INTO branch_celebration (
  uuid, project_id, branch_id, celebration_text, naturalness, success_feeling, source, is_selected, created_at
)
SELECT c.uuid, c.project_id, hb.id, c.celebration_text, c.naturalness, c.success_feeling, c.source, c.is_selected, c.created_at
FROM celebration c
JOIN habit_branch hb ON hb.id = (SELECT MIN(h2.id) FROM habit_branch h2 WHERE h2.project_id = c.project_id);

INSERT INTO branch_recipe_version (
  uuid, project_id, branch_id, version_number, anchor_last_action, behavior_text, celebration_text,
  full_recipe_text, rehearsal_count, rehearsal_feeling, status, legacy_recipe_id, created_at
)
SELECT rv.uuid, rv.project_id, hb.id, rv.version_number, rv.anchor_last_action, rv.behavior_text, rv.celebration_text,
       rv.full_recipe_text, rv.rehearsal_count, rv.rehearsal_feeling, rv.status, rv.id, rv.created_at
FROM recipe_version rv
JOIN habit_branch hb ON hb.id = (SELECT MIN(h2.id) FROM habit_branch h2 WHERE h2.project_id = rv.project_id);

INSERT INTO branch_practice_event (
  uuid, project_id, branch_id, recipe_version_id, result, feeling, context, occurred_at, legacy_practice_id, created_at
)
SELECT pe.uuid, pe.project_id, br.branch_id, br.id, pe.result, pe.feeling, pe.context, pe.occurred_at, pe.id, pe.created_at
FROM practice_event pe
JOIN branch_recipe_version br ON br.legacy_recipe_id = pe.recipe_version_id;

INSERT INTO branch_obstacle_diagnosis (
  uuid, project_id, branch_id, practice_event_id, obstacle_type, diagnosis_path, suggestion, return_step, user_decision, created_at
)
SELECT od.uuid, od.project_id, bp.branch_id, bp.id, od.obstacle_type, od.diagnosis_path, od.suggestion,
       od.return_step, od.user_decision, od.created_at
FROM obstacle_diagnosis od
JOIN branch_practice_event bp ON bp.legacy_practice_id = od.practice_event_id;

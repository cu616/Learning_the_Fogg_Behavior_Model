CREATE TABLE old_habit_project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    general_habit TEXT NOT NULL DEFAULT '',
    preparation_mode TEXT NOT NULL DEFAULT 'undecided',
    preparation_note TEXT,
    linked_habit_project_id INTEGER REFERENCES habit_project(id) ON DELETE SET NULL,
    current_stage TEXT NOT NULL DEFAULT 'prepare',
    status TEXT NOT NULL DEFAULT 'draft',
    archived_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_old_habit_project_status ON old_habit_project(status, updated_at DESC);

CREATE TABLE old_habit_behavior (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    project_id INTEGER NOT NULL REFERENCES old_habit_project(id) ON DELETE CASCADE,
    behavior_text TEXT NOT NULL,
    typical_time TEXT,
    typical_place TEXT,
    people TEXT,
    context TEXT,
    selection_reason TEXT,
    goal_type TEXT NOT NULL DEFAULT 'stop',
    goal_value TEXT,
    review_at TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_old_habit_behavior_project ON old_habit_behavior(project_id, sort_order, id);

CREATE TABLE old_habit_strategy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    project_id INTEGER NOT NULL REFERENCES old_habit_project(id) ON DELETE CASCADE,
    behavior_id INTEGER NOT NULL REFERENCES old_habit_behavior(id) ON DELETE CASCADE,
    factor TEXT NOT NULL CHECK (factor IN ('P','A','M')),
    method TEXT NOT NULL,
    content TEXT NOT NULL,
    situation TEXT,
    status TEXT NOT NULL DEFAULT 'idea',
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_old_habit_strategy_behavior ON old_habit_strategy(behavior_id, factor, id);

CREATE TABLE old_habit_observation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    project_id INTEGER NOT NULL REFERENCES old_habit_project(id) ON DELETE CASCADE,
    behavior_id INTEGER NOT NULL REFERENCES old_habit_behavior(id) ON DELETE CASCADE,
    result TEXT NOT NULL,
    prompt TEXT,
    is_new_prompt INTEGER,
    uncovered_situation TEXT,
    adjustment TEXT,
    feeling TEXT,
    observed_at TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_old_habit_observation_behavior ON old_habit_observation(behavior_id, observed_at DESC, id DESC);

CREATE TABLE old_habit_replacement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    project_id INTEGER NOT NULL REFERENCES old_habit_project(id) ON DELETE CASCADE,
    behavior_id INTEGER NOT NULL REFERENCES old_habit_behavior(id) ON DELETE CASCADE,
    old_prompt TEXT,
    new_behavior TEXT NOT NULL DEFAULT '',
    celebration TEXT,
    rehearsal_count INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    lower_old_motivation TEXT,
    harder_old_behavior TEXT,
    raise_new_motivation TEXT,
    easier_new_behavior TEXT,
    linked_habit_project_id INTEGER REFERENCES habit_project(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'designing',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(behavior_id)
);

CREATE INDEX idx_old_habit_replacement_project ON old_habit_replacement(project_id, behavior_id);

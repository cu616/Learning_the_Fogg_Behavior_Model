CREATE TABLE one_time_task (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    completion_standard TEXT,
    next_action TEXT NOT NULL DEFAULT '',
    deadline TEXT,
    completion_evidence TEXT,
    current_intent TEXT,
    current_route TEXT NOT NULL DEFAULT 'capture',
    status TEXT NOT NULL DEFAULT 'draft',
    decision_note TEXT,
    celebration TEXT,
    converted_project_id INTEGER REFERENCES habit_project(id) ON DELETE SET NULL,
    started_at TEXT,
    completed_at TEXT,
    archived_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX idx_one_time_task_status ON one_time_task(status, updated_at DESC);

CREATE TABLE one_time_diagnosis_round (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    task_id INTEGER NOT NULL REFERENCES one_time_task(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    entry_mode TEXT NOT NULL DEFAULT 'guided',
    symptom TEXT,
    recommended_factor TEXT,
    selected_factor TEXT NOT NULL,
    target_side TEXT,
    problem_type TEXT,
    method TEXT,
    weakest_link TEXT,
    details TEXT,
    adjustment TEXT,
    updated_next_action TEXT,
    prompt_time TEXT,
    prompt_place TEXT,
    minimum_motivation_easy INTEGER,
    task_decision TEXT,
    motivation_conflict TEXT,
    outcome TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(task_id, round_number)
);

CREATE INDEX idx_one_time_round_task ON one_time_diagnosis_round(task_id, round_number DESC);

CREATE TABLE one_time_task_event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    task_id INTEGER NOT NULL REFERENCES one_time_task(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_one_time_event_task ON one_time_task_event(task_id, created_at DESC);

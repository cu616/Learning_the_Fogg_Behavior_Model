ALTER TABLE behavior_option_layout ADD COLUMN swarm_width REAL CHECK (swarm_width BETWEEN 140 AND 420);
ALTER TABLE behavior_option_layout ADD COLUMN swarm_height REAL CHECK (swarm_height BETWEEN 72 AND 280);

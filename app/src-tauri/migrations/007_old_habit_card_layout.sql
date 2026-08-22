ALTER TABLE old_habit_behavior ADD COLUMN pos_x REAL CHECK(pos_x IS NULL OR pos_x BETWEEN 0 AND 1);
ALTER TABLE old_habit_behavior ADD COLUMN pos_y REAL CHECK(pos_y IS NULL OR pos_y BETWEEN 0 AND 1);
ALTER TABLE old_habit_behavior ADD COLUMN card_width REAL CHECK(card_width IS NULL OR card_width BETWEEN 140 AND 420);
ALTER TABLE old_habit_behavior ADD COLUMN card_height REAL CHECK(card_height IS NULL OR card_height BETWEEN 72 AND 280);

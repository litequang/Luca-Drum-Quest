CREATE TABLE installation_state (id TINYINT PRIMARY KEY CHECK (id=1), initialized_at DATETIME NULL);
INSERT INTO installation_state (id,initialized_at) SELECT 1,CASE WHEN EXISTS (SELECT 1 FROM users WHERE role='PARENT_ADMIN') THEN UTC_TIMESTAMP() ELSE NULL END;

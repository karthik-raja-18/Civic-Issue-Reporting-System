-- Run before restarting backend

-- Add resolved proof photo URL
ALTER TABLE issues ADD COLUMN resolved_image_url TEXT;

-- Add reporter's reopen note
ALTER TABLE issues ADD COLUMN reopen_note TEXT;

-- Extend status column for new values (CLOSED, REOPENED)
ALTER TABLE issues MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
-- ── Run before restarting backend ───────────────────────────────────────────

-- Issue upvotes table
CREATE TABLE IF NOT EXISTS issue_upvotes (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    issue_id   BIGINT NOT NULL,
    user_id    BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_upvote (issue_id, user_id),
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
);

-- Add upvote count + priority score to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS upvote_count  INT     DEFAULT 0;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS priority_score DOUBLE  DEFAULT 0.0;

-- Add phone number to users (for SMS notifications)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- WhatsApp bot sessions (tracks pending bot conversations)
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone        VARCHAR(30) NOT NULL UNIQUE,
    state        VARCHAR(30) NOT NULL DEFAULT 'IDLE',
    -- IDLE | AWAITING_LOCATION | AWAITING_DESCRIPTION
    temp_image_url TEXT,
    temp_latitude  DOUBLE,
    temp_longitude DOUBLE,
    temp_category  VARCHAR(100),
    temp_title     TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- ── Run before restarting backend ───────────────────────────────────────────

-- Issue upvotes table
CREATE TABLE IF NOT EXISTS issue_upvotes (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    issue_id   BIGINT NOT NULL,
    user_id    BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_upvote (issue_id, user_id),
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
);

-- Add upvote count + priority score to issues table
ALTER TABLE issues ADD COLUMN IF NOT EXISTS upvote_count  INT     DEFAULT 0;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS priority_score DOUBLE  DEFAULT 0.0;

-- Add phone number to users (for SMS notifications)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- WhatsApp bot sessions (tracks pending bot conversations)
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone        VARCHAR(30) NOT NULL UNIQUE,
    state        VARCHAR(30) NOT NULL DEFAULT 'IDLE',
    -- IDLE | AWAITING_LOCATION | AWAITING_DESCRIPTION
    temp_image_url TEXT,
    temp_latitude  DOUBLE,
    temp_longitude DOUBLE,
    temp_category  VARCHAR(100),
    temp_title     TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

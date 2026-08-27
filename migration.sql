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
-- ── Run before restarting backend ───────────────────────────────────────────

-- Store embedding vector as JSON array text on issues
-- (768-dim float array from Gemini text-embedding-004)
ALTER TABLE issues ADD COLUMN IF NOT EXISTS embedding         LONGTEXT;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS embedding_updated_at DATETIME;

-- Chat history for the RAG assistant (per user conversation)
CREATE TABLE IF NOT EXISTS chat_messages (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    role        VARCHAR(10) NOT NULL,      -- USER | ASSISTANT
    content     TEXT NOT NULL,
    retrieved_issue_ids TEXT,              -- JSON array of issue IDs used as context
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Category feedback — logs when admin corrects an AI-suggested category.
-- This becomes a labeled dataset you can use to fine-tune / few-shot improve
-- the classifier later (or train a lightweight custom classifier).
CREATE TABLE IF NOT EXISTS category_feedback (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    issue_id         BIGINT NOT NULL,
    ai_suggested     VARCHAR(100) NOT NULL,
    ai_confidence    INT,
    admin_corrected  VARCHAR(100) NOT NULL,
    description_snapshot TEXT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
);

-- Index to speed up zone+category scans used during semantic duplicate search
CREATE INDEX IF NOT EXISTS idx_issues_zone_category ON issues(zone, category);



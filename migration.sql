-- Run before restarting backend

-- Add resolved proof photo URL
ALTER TABLE issues ADD COLUMN resolved_image_url TEXT;

-- Add reporter's reopen note
ALTER TABLE issues ADD COLUMN reopen_note TEXT;

-- Extend status column for new values (CLOSED, REOPENED)
ALTER TABLE issues MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

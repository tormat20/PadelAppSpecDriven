ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS setup_status TEXT DEFAULT 'planned';
ALTER TABLE events ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

UPDATE events
SET setup_status = 'ready'
WHERE setup_status IS NULL;

UPDATE events
SET version = 1
WHERE version IS NULL;

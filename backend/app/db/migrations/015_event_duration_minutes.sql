ALTER TABLE events
ADD COLUMN IF NOT EXISTS event_duration_minutes INTEGER DEFAULT 90;

UPDATE events
SET event_duration_minutes = 90
WHERE event_duration_minutes IS NULL;

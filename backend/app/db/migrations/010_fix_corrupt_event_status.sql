-- Migration 010: fix corrupt event status
-- Events in Lobby status that already have rounds are corrupt (they were
-- started but the status was never updated to Running). Set them to Running
-- so that start_event() can recover gracefully instead of raising
-- EVENT_ALREADY_STARTED.
UPDATE events
SET status = 'Running'
WHERE status = 'Lobby'
  AND id IN (SELECT DISTINCT event_id FROM rounds);

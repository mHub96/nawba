-- Fewer rows read: denormalised "last seizure" per patient, and an index so expired-session cleanup doesn't scan the table.
ALTER TABLE patients ADD COLUMN last_event_at INTEGER;
UPDATE patients SET last_event_at = (SELECT MAX(started_at) FROM events e WHERE e.patient_id = patients.id);
CREATE INDEX IF NOT EXISTS sessions_expires ON sessions(expires);

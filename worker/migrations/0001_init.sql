-- Nawba schema (Cloudflare D1)
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL COLLATE NOCASE, name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','doctor','nurse')),
  pass TEXT NOT NULL, lang TEXT NOT NULL DEFAULT 'ar', active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL, created_by INTEGER
);
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL, pass TEXT NOT NULL, qr_token TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, data TEXT NOT NULL DEFAULT '{}', overrides TEXT NOT NULL DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, created_by INTEGER
);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, kind TEXT NOT NULL, subject_id INTEGER NOT NULL, expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_subject ON sessions(kind, subject_id);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY, client_id TEXT UNIQUE, patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  started_at INTEGER NOT NULL, duration_sec INTEGER, source TEXT NOT NULL, data TEXT NOT NULL DEFAULT '{}',
  video TEXT, created_at INTEGER NOT NULL, created_by INTEGER
);
CREATE INDEX IF NOT EXISTS events_patient ON events(patient_id, started_at DESC);
CREATE INDEX IF NOT EXISTS events_started ON events(started_at DESC);
CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, at INTEGER NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT, detail TEXT);
CREATE TABLE IF NOT EXISTS fails (key TEXT PRIMARY KEY, n INTEGER NOT NULL, t INTEGER NOT NULL);

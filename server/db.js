// SQLite storage (Node's built-in node:sqlite — no native build, tiny footprint).
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(path.join(DATA_DIR, 'videos'), { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'nawba.db'));
db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
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
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, kind TEXT NOT NULL, subject_id INTEGER NOT NULL, expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY, client_id TEXT UNIQUE, patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  started_at INTEGER NOT NULL, duration_sec INTEGER, source TEXT NOT NULL, data TEXT NOT NULL DEFAULT '{}',
  video TEXT, created_at INTEGER NOT NULL, created_by INTEGER
);
CREATE INDEX IF NOT EXISTS events_patient ON events(patient_id, started_at DESC);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY, at INTEGER NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT, detail TEXT
);
`);

// ---- password hashing (scrypt) ----
function hashPass(pw) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const h = crypto.scryptSync(String(pw), salt, 32).toString('base64url');
  return `s1$${salt}$${h}`;
}
function checkPass(pw, stored) {
  const [, salt, h] = String(stored).split('$');
  if (!salt || !h) return false;
  const a = crypto.scryptSync(String(pw), salt, 32);
  const b = Buffer.from(h, 'base64url');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const randToken = (n = 32) => crypto.randomBytes(n).toString('base64url');

// ---- sessions ----
function createSession(kind, subjectId, ttlMs) {
  const token = randToken();
  db.prepare('INSERT INTO sessions VALUES (?,?,?,?)').run(sha(token), kind, subjectId, Date.now() + ttlMs);
  return token;
}
function readSession(token) {
  if (!token) return null;
  const s = db.prepare('SELECT * FROM sessions WHERE token_hash = ?').get(sha(token));
  if (!s || s.expires < Date.now()) return null;
  return s;
}
function dropSession(token) { db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token)); }
function dropSessionsFor(kind, id) { db.prepare('DELETE FROM sessions WHERE kind = ? AND subject_id = ?').run(kind, id); }
setInterval(() => db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now()), 3600e3).unref();

// ---- settings ----
const DEFAULT_SETTINGS = {
  features: { ambulance: false, video: false, videoUpload: false, videoMaxMb: 25, emergencyNumber: '911', rescueAlertMin: 5 },
  visibility: {},           // catalog item id -> boolean (falls back to catalog default)
  publicUrl: '',            // base URL used inside QR codes; blank = derived from request
  centerName: { ar: 'مركز الصرع', en: 'Epilepsy Center' }
};
function getSetting(key) {
  const r = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  if (!r) return structuredClone(DEFAULT_SETTINGS[key]);
  const v = JSON.parse(r.value);
  return (v && typeof v === 'object' && !Array.isArray(v)) ? { ...DEFAULT_SETTINGS[key], ...v } : v;
}
function setSetting(key, value) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, JSON.stringify(value));
}

function audit(actor, action, target, detail) {
  db.prepare('INSERT INTO audit (at, actor, action, target, detail) VALUES (?,?,?,?,?)')
    .run(Date.now(), actor, action, target == null ? null : String(target), detail ? JSON.stringify(detail) : null);
}

module.exports = { db, DATA_DIR, hashPass, checkPass, randToken, createSession, readSession, dropSession, dropSessionsFor, getSetting, setSetting, audit };

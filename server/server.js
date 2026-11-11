// Nawba (نوبة) — API + static server.
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const QRCode = require('qrcode');
const D = require('./db');
const { db } = D;

const ROOT = path.join(__dirname, '..');
const CONTENT = path.join(ROOT, 'content');
const PORT = Number(process.env.PORT || 8080);

// ---------- content ----------
function loadContent() {
  const catalog = JSON.parse(fs.readFileSync(path.join(CONTENT, 'catalog.json'), 'utf8'));
  const edu = JSON.parse(fs.readFileSync(path.join(CONTENT, 'education.json'), 'utf8'));
  const items = [...catalog.items, ...edu.map(m => ({ id: m.id, cat: 'edu', en: m.en, ar: m.ar, lay: m.ar, def: m.def, lvl: m.lvl, icon: m.icon }))];
  return { categories: catalog.categories, items, byId: Object.fromEntries(items.map(i => [i.id, i])), edu, source: catalog._source };
}
let C = loadContent();

function globalVisible(id) {
  const vis = D.getSetting('visibility');
  return id in vis ? !!vis[id] : !!(C.byId[id] && C.byId[id].def);
}
function visibleFor(patient, id) {
  const ov = JSON.parse(patient.overrides || '{}')[id];
  if (ov === 'show') return true;
  if (ov === 'hide') return false;
  return globalVisible(id);
}

// ---------- roles ----------
const LEVEL = { nurse: 1, doctor: 2, admin: 3, owner: 4 };
const atLeast = (role) => (req, res, next) => (LEVEL[req.staff.role] >= LEVEL[role] ? next() : res.status(403).json({ error: 'forbidden' }));

// ---------- helpers ----------
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'no-referrer');
  next();
});

const bearer = (req) => (req.get('authorization') || '').replace(/^Bearer\s+/i, '') || req.query.t || '';
function staffAuth(req, res, next) {
  const s = D.readSession(bearer(req));
  if (!s || s.kind !== 'staff') return res.status(401).json({ error: 'auth' });
  const u = db.prepare('SELECT id, username, name, role, lang, active FROM staff WHERE id = ?').get(s.subject_id);
  if (!u || !u.active) return res.status(401).json({ error: 'auth' });
  req.staff = u; next();
}
function patientAuth(req, res, next) {
  const s = D.readSession(bearer(req));
  if (!s || s.kind !== 'patient') return res.status(401).json({ error: 'auth' });
  const p = db.prepare('SELECT * FROM patients WHERE id = ?').get(s.subject_id);
  if (!p || !p.active) return res.status(401).json({ error: 'auth' });
  req.patient = p; next();
}
const actor = (req) => req.staff ? `${req.staff.role}:${req.staff.username}` : req.patient ? `family:${req.patient.code}` : 'system';

// basic brute-force throttle: 10 failures / 15 min per ip+id
const fails = new Map();
function throttled(key) { const f = fails.get(key); return f && f.n >= 10 && Date.now() - f.t < 15 * 60e3; }
function fail(key) { const f = fails.get(key) || { n: 0, t: Date.now() }; if (Date.now() - f.t > 15 * 60e3) { f.n = 0; f.t = Date.now(); } f.n++; fails.set(key, f); }

function newPatientCode() {
  for (;;) {
    const code = 'NW-' + String(crypto.randomInt(10000, 99999));
    if (!db.prepare('SELECT 1 FROM patients WHERE code = ?').get(code)) return code;
  }
}
const newPin = () => String(crypto.randomInt(100000, 999999));
function baseUrl(req) {
  const s = D.getSetting('publicUrl');
  return (s && s.trim()) ? s.trim().replace(/\/+$/, '') : `${req.protocol}://${req.get('host')}`;
}
const qrLink = (req, p) => `${baseUrl(req)}/app/#k=${p.qr_token}`;

function patientRow(p, full = true) {
  const out = { id: p.id, code: p.code, name: p.name, active: !!p.active, created_at: p.created_at, updated_at: p.updated_at, data: JSON.parse(p.data) };
  if (full) out.overrides = JSON.parse(p.overrides);
  return out;
}

// ---------- setup & auth ----------
app.get('/api/setup', (req, res) => res.json({ needsOwner: !db.prepare('SELECT 1 FROM staff LIMIT 1').get() }));
app.post('/api/setup', (req, res) => {
  if (db.prepare('SELECT 1 FROM staff LIMIT 1').get()) return res.status(409).json({ error: 'exists' });
  const { username, name, password, lang } = req.body || {};
  if (!username || !name || !password || String(password).length < 8) return res.status(400).json({ error: 'invalid' });
  db.prepare('INSERT INTO staff (username, name, role, pass, lang, created_at) VALUES (?,?,?,?,?,?)')
    .run(String(username).trim(), String(name).trim(), 'owner', D.hashPass(password), lang === 'en' ? 'en' : 'ar', Date.now());
  D.audit(`owner:${username}`, 'setup.owner', username);
  res.json({ ok: true });
});

app.post('/api/staff/login', (req, res) => {
  const { username, password } = req.body || {};
  const key = `s:${req.ip}:${String(username).toLowerCase()}`;
  if (throttled(key)) return res.status(429).json({ error: 'throttled' });
  const u = db.prepare('SELECT * FROM staff WHERE username = ?').get(String(username || '').trim());
  if (!u || !u.active || !D.checkPass(password || '', u.pass)) { fail(key); return res.status(401).json({ error: 'bad_login' }); }
  fails.delete(key);
  const token = D.createSession('staff', u.id, 12 * 3600e3);
  D.audit(`${u.role}:${u.username}`, 'staff.login', u.id);
  res.json({ token, user: { id: u.id, username: u.username, name: u.name, role: u.role, lang: u.lang } });
});

app.post('/api/patient/login', (req, res) => {
  const { code, password, qr } = req.body || {};
  let p;
  if (qr) {
    const key = `q:${req.ip}`;
    if (throttled(key)) return res.status(429).json({ error: 'throttled' });
    p = db.prepare('SELECT * FROM patients WHERE qr_token = ?').get(String(qr));
    if (!p) { fail(key); return res.status(401).json({ error: 'bad_qr' }); }
  } else {
    const c = String(code || '').trim().toUpperCase().replace(/^NW-?/, 'NW-');
    const key = `p:${req.ip}:${c}`;
    if (throttled(key)) return res.status(429).json({ error: 'throttled' });
    p = db.prepare('SELECT * FROM patients WHERE code = ?').get(c);
    if (!p || !D.checkPass(password || '', p.pass)) { fail(key); return res.status(401).json({ error: 'bad_login' }); }
  }
  if (!p.active) return res.status(403).json({ error: 'inactive' });
  const token = D.createSession('patient', p.id, 365 * 24 * 3600e3);
  D.audit(`family:${p.code}`, qr ? 'family.login.qr' : 'family.login', p.id);
  res.json({ token });
});

// ---------- staff: self ----------
app.get('/api/staff/me', staffAuth, (req, res) => res.json({ user: req.staff, centerName: D.getSetting('centerName') }));
app.post('/api/staff/logout', staffAuth, (req, res) => { D.dropSession(bearer(req)); res.json({ ok: true }); });
app.post('/api/staff/me', staffAuth, (req, res) => {
  const { lang, oldPassword, newPassword, name } = req.body || {};
  if (lang) db.prepare('UPDATE staff SET lang = ? WHERE id = ?').run(lang === 'en' ? 'en' : 'ar', req.staff.id);
  if (name) db.prepare('UPDATE staff SET name = ? WHERE id = ?').run(String(name).trim(), req.staff.id);
  if (newPassword) {
    const u = db.prepare('SELECT pass FROM staff WHERE id = ?').get(req.staff.id);
    if (!D.checkPass(oldPassword || '', u.pass)) return res.status(400).json({ error: 'bad_old_password' });
    if (String(newPassword).length < 8) return res.status(400).json({ error: 'weak_password' });
    db.prepare('UPDATE staff SET pass = ? WHERE id = ?').run(D.hashPass(newPassword), req.staff.id);
    D.audit(actor(req), 'staff.password', req.staff.id);
  }
  res.json({ ok: true });
});

// ---------- staff management ----------
app.get('/api/staff', staffAuth, atLeast('admin'), (req, res) => {
  res.json(db.prepare('SELECT id, username, name, role, lang, active, created_at FROM staff ORDER BY active DESC, role, name').all());
});
app.post('/api/staff', staffAuth, atLeast('admin'), (req, res) => {
  const { username, name, role, password } = req.body || {};
  if (!LEVEL[role] || role === 'owner' || LEVEL[role] >= LEVEL[req.staff.role]) return res.status(403).json({ error: 'role_not_allowed' });
  if (!username || !name || !password || String(password).length < 8) return res.status(400).json({ error: 'invalid' });
  try {
    const r = db.prepare('INSERT INTO staff (username, name, role, pass, created_at, created_by) VALUES (?,?,?,?,?,?)')
      .run(String(username).trim(), String(name).trim(), role, D.hashPass(password), Date.now(), req.staff.id);
    D.audit(actor(req), 'staff.create', r.lastInsertRowid, { username, role });
    res.json({ id: Number(r.lastInsertRowid) });
  } catch { res.status(409).json({ error: 'username_taken' }); }
});
app.patch('/api/staff/:id', staffAuth, atLeast('admin'), (req, res) => {
  const t = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'not_found' });
  if (LEVEL[t.role] >= LEVEL[req.staff.role]) return res.status(403).json({ error: 'role_not_allowed' });
  const { name, role, active, password } = req.body || {};
  if (role) {
    if (!LEVEL[role] || LEVEL[role] >= LEVEL[req.staff.role]) return res.status(403).json({ error: 'role_not_allowed' });
    db.prepare('UPDATE staff SET role = ? WHERE id = ?').run(role, t.id);
  }
  if (name) db.prepare('UPDATE staff SET name = ? WHERE id = ?').run(String(name).trim(), t.id);
  if (active !== undefined) { db.prepare('UPDATE staff SET active = ? WHERE id = ?').run(active ? 1 : 0, t.id); if (!active) D.dropSessionsFor('staff', t.id); }
  if (password) {
    if (String(password).length < 8) return res.status(400).json({ error: 'weak_password' });
    db.prepare('UPDATE staff SET pass = ? WHERE id = ?').run(D.hashPass(password), t.id); D.dropSessionsFor('staff', t.id);
  }
  D.audit(actor(req), 'staff.update', t.id, { name, role, active, password: password ? 'reset' : undefined });
  res.json({ ok: true });
});

// ---------- catalog & settings ----------
app.get('/api/catalog', staffAuth, (req, res) => {
  res.json({ categories: C.categories, items: C.items.map(i => ({ ...i, visible: globalVisible(i.id) })), source: C.source });
});
app.put('/api/catalog/visibility', staffAuth, atLeast('admin'), (req, res) => {
  const vis = D.getSetting('visibility');
  for (const [id, v] of Object.entries(req.body || {})) if (C.byId[id]) vis[id] = !!v;
  D.setSetting('visibility', vis);
  D.audit(actor(req), 'catalog.visibility', null, req.body);
  res.json({ ok: true });
});
app.get('/api/settings', staffAuth, (req, res) => res.json({ features: D.getSetting('features'), publicUrl: D.getSetting('publicUrl'), centerName: D.getSetting('centerName') }));
app.put('/api/settings', staffAuth, atLeast('admin'), (req, res) => {
  const { features, publicUrl, centerName } = req.body || {};
  if (features) {
    const f = D.getSetting('features');
    for (const k of ['ambulance', 'video', 'videoUpload']) if (k in features) f[k] = !!features[k];
    if ('videoMaxMb' in features) f.videoMaxMb = Math.max(1, Math.min(200, Number(features.videoMaxMb) || 25));
    if ('rescueAlertMin' in features) f.rescueAlertMin = Math.max(1, Math.min(30, Number(features.rescueAlertMin) || 5));
    if ('emergencyNumber' in features) f.emergencyNumber = String(features.emergencyNumber).replace(/[^\d+]/g, '').slice(0, 15) || '911';
    D.setSetting('features', f);
  }
  if (publicUrl !== undefined && req.staff.role === 'owner') D.setSetting('publicUrl', String(publicUrl).trim());
  if (centerName) D.setSetting('centerName', { ar: String(centerName.ar || ''), en: String(centerName.en || '') });
  D.audit(actor(req), 'settings.update', null, req.body);
  res.json({ ok: true });
});

// ---------- patients ----------
app.get('/api/patients', staffAuth, (req, res) => {
  const q = `%${String(req.query.q || '').trim()}%`;
  const rows = db.prepare(`
    SELECT p.*, (SELECT COUNT(*) FROM events e WHERE e.patient_id = p.id AND e.started_at > ?) AS ev30,
           (SELECT MAX(started_at) FROM events e WHERE e.patient_id = p.id) AS last_event
    FROM patients p WHERE p.name LIKE ? OR p.code LIKE ? ORDER BY p.active DESC, p.updated_at DESC LIMIT 500`)
    .all(Date.now() - 30 * 864e5, q, q);
  res.json(rows.map(p => ({ ...patientRow(p, false), ev30: p.ev30, last_event: p.last_event })));
});
app.post('/api/patients', staffAuth, atLeast('doctor'), (req, res) => {
  const { name, data } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'invalid' });
  const code = newPatientCode(), pin = newPin(), now = Date.now();
  const r = db.prepare('INSERT INTO patients (code, pass, qr_token, name, data, created_at, updated_at, created_by) VALUES (?,?,?,?,?,?,?,?)')
    .run(code, D.hashPass(pin), D.randToken(24), String(name).trim(), JSON.stringify(data || {}), now, now, req.staff.id);
  D.audit(actor(req), 'patient.create', r.lastInsertRowid, { code });
  res.json({ id: Number(r.lastInsertRowid), code, password: pin });
});
function getPatient(req, res) {
  const p = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
  if (!p) { res.status(404).json({ error: 'not_found' }); return null; }
  return p;
}
app.get('/api/patients/:id', staffAuth, (req, res) => {
  const p = getPatient(req, res); if (!p) return;
  res.json({ ...patientRow(p), link: qrLink(req, p) });
});
const NURSE_FIELDS = ['guardian', 'phone', 'phone2', 'governorate', 'address', 'contacts'];
app.put('/api/patients/:id', staffAuth, (req, res) => {
  const p = getPatient(req, res); if (!p) return;
  const { name, data, active } = req.body || {};
  const cur = JSON.parse(p.data);
  let next;
  if (LEVEL[req.staff.role] >= LEVEL.doctor) next = { ...cur, ...(data || {}) };
  else { next = { ...cur }; for (const k of NURSE_FIELDS) if (data && k in data) next[k] = data[k]; }
  const nm = (LEVEL[req.staff.role] >= LEVEL.doctor && name) ? String(name).trim() : p.name;
  db.prepare('UPDATE patients SET name = ?, data = ?, updated_at = ? WHERE id = ?').run(nm, JSON.stringify(next), Date.now(), p.id);
  if (active !== undefined && LEVEL[req.staff.role] >= LEVEL.admin) {
    db.prepare('UPDATE patients SET active = ? WHERE id = ?').run(active ? 1 : 0, p.id);
    if (!active) D.dropSessionsFor('patient', p.id);
  }
  D.audit(actor(req), 'patient.update', p.id, { fields: Object.keys(data || {}), active });
  res.json({ ok: true });
});
app.put('/api/patients/:id/overrides', staffAuth, atLeast('doctor'), (req, res) => {
  const p = getPatient(req, res); if (!p) return;
  const ov = JSON.parse(p.overrides);
  for (const [id, v] of Object.entries(req.body || {})) {
    if (!C.byId[id]) continue;
    if (v === 'show' || v === 'hide') ov[id] = v; else delete ov[id];
  }
  db.prepare('UPDATE patients SET overrides = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(ov), Date.now(), p.id);
  D.audit(actor(req), 'patient.overrides', p.id, req.body);
  res.json({ ok: true, overrides: ov });
});
app.post('/api/patients/:id/reset-password', staffAuth, (req, res) => {
  const p = getPatient(req, res); if (!p) return;
  const pin = newPin();
  db.prepare('UPDATE patients SET pass = ? WHERE id = ?').run(D.hashPass(pin), p.id);
  D.audit(actor(req), 'patient.reset_password', p.id);
  res.json({ password: pin });
});
app.post('/api/patients/:id/regen-qr', staffAuth, atLeast('doctor'), (req, res) => {
  const p = getPatient(req, res); if (!p) return;
  db.prepare('UPDATE patients SET qr_token = ? WHERE id = ?').run(D.randToken(24), p.id);
  D.dropSessionsFor('patient', p.id);   // phones logged in with the old QR are signed out
  D.audit(actor(req), 'patient.regen_qr', p.id);
  res.json({ ok: true });
});
app.get('/api/patients/:id/qr.svg', staffAuth, async (req, res) => {
  const p = getPatient(req, res); if (!p) return;
  const svg = await QRCode.toString(qrLink(req, p), { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#14232b', light: '#ffffff' } });
  res.type('image/svg+xml').set('Cache-Control', 'no-store').send(svg);
});

// ---------- events (seizure diary) ----------
function eventRow(e) { return { id: e.id, started_at: e.started_at, duration_sec: e.duration_sec, source: e.source, data: JSON.parse(e.data), video: !!e.video, created_at: e.created_at }; }
app.get('/api/patients/:id/events', staffAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM events WHERE patient_id = ? ORDER BY started_at DESC LIMIT 1000').all(req.params.id).map(eventRow));
});
app.post('/api/patients/:id/events', staffAuth, (req, res) => {
  const p = getPatient(req, res); if (!p) return;
  const { started_at, duration_sec, data } = req.body || {};
  const r = db.prepare('INSERT INTO events (patient_id, started_at, duration_sec, source, data, created_at, created_by) VALUES (?,?,?,?,?,?,?)')
    .run(p.id, Number(started_at) || Date.now(), duration_sec == null ? null : Number(duration_sec), 'staff', JSON.stringify(data || {}), Date.now(), req.staff.id);
  D.audit(actor(req), 'event.create', r.lastInsertRowid, { patient: p.id });
  res.json({ id: Number(r.lastInsertRowid) });
});
app.delete('/api/events/:id', staffAuth, atLeast('doctor'), (req, res) => {
  const e = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!e) return res.status(404).json({ error: 'not_found' });
  if (e.video) fs.rm(path.join(D.DATA_DIR, 'videos', e.video), () => {});
  db.prepare('DELETE FROM events WHERE id = ?').run(e.id);
  D.audit(actor(req), 'event.delete', e.id, { patient: e.patient_id });
  res.json({ ok: true });
});
app.get('/api/events/:id/video', staffAuth, (req, res) => {
  const e = db.prepare('SELECT video FROM events WHERE id = ?').get(req.params.id);
  if (!e || !e.video) return res.status(404).end();
  D.audit(actor(req), 'event.video.view', req.params.id);
  res.sendFile(path.join(D.DATA_DIR, 'videos', e.video));
});

app.get('/api/stats', staffAuth, (req, res) => {
  const now = Date.now();
  res.json({
    patients: db.prepare('SELECT COUNT(*) n FROM patients WHERE active = 1').get().n,
    events7: db.prepare('SELECT COUNT(*) n FROM events WHERE started_at > ?').get(now - 7 * 864e5).n,
    events30: db.prepare('SELECT COUNT(*) n FROM events WHERE started_at > ?').get(now - 30 * 864e5).n,
    long30: db.prepare("SELECT COUNT(*) n FROM events WHERE started_at > ? AND duration_sec >= 300").get(now - 30 * 864e5).n,
    staff: db.prepare('SELECT COUNT(*) n FROM staff WHERE active = 1').get().n,
    recent: db.prepare(`SELECT e.id, e.started_at, e.duration_sec, e.data, p.id pid, p.name, p.code FROM events e JOIN patients p ON p.id = e.patient_id ORDER BY e.started_at DESC LIMIT 12`).all()
      .map(r => ({ ...r, data: JSON.parse(r.data) }))
  });
});
app.get('/api/audit', staffAuth, atLeast('admin'), (req, res) => {
  res.json(db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT 300').all());
});

// ---------- family (patient) API ----------
app.get('/api/me', patientAuth, (req, res) => {
  const p = req.patient, d = JSON.parse(p.data);
  const feats = D.getSetting('features');
  const familyCats = C.categories.filter(c => c.family).map(c => c.id);
  const typical = new Set((d.seizures || []).flatMap(s => [...(s.aura || []), ...(s.ictal || []), ...(s.postictal || []), ...(s.triggers || [])]));
  const items = C.items.filter(i => familyCats.includes(i.cat) && visibleFor(p, i.id))
    .map(i => ({ id: i.id, cat: i.cat, lay: i.lay, urgent: !!i.urgent, typical: typical.has(i.id), icon: i.icon }));
  const visEdu = new Set(items.filter(i => i.cat === 'edu').map(i => i.id));
  res.json({
    patient: {
      code: p.code, name: p.name, dob: d.dob || '', sex: d.sex || '', guardian: d.guardian || '', doctor: d.doctor || '',
      seizures: (d.seizures || []).map(s => ({
        type: s.typeId ? { id: s.typeId, lay: C.byId[s.typeId]?.lay || '', ar: C.byId[s.typeId]?.ar || '' } : null,
        nickname: s.nickname || '', freqCount: s.freqCount || '', freqPer: s.freqPer || '', duration: s.duration || '',
        signs: [...(s.aura || []), ...(s.ictal || []), ...(s.postictal || [])].filter(id => C.byId[id]).map(id => ({ id, cat: C.byId[id].cat, lay: C.byId[id].lay }))
      })),
      meds: d.meds || [], rescue: d.rescue && d.rescue.enabled ? d.rescue : null,
      contacts: d.contacts || [], familyNote: d.familyNote || ''
    },
    items,
    edu: C.edu.filter(m => visEdu.has(m.id)),
    features: { ambulance: feats.ambulance, video: feats.video, videoUpload: feats.video && feats.videoUpload, videoMaxMb: feats.videoMaxMb, emergencyNumber: feats.emergencyNumber, rescueAlertMin: feats.rescueAlertMin },
    centerName: D.getSetting('centerName')
  });
});
app.get('/api/me/events', patientAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM events WHERE patient_id = ? ORDER BY started_at DESC LIMIT 60').all(req.patient.id).map(eventRow));
});
app.post('/api/me/events', patientAuth, (req, res) => {
  const { client_id, started_at, duration_sec, data } = req.body || {};
  if (client_id) {
    const ex = db.prepare('SELECT id FROM events WHERE client_id = ?').get(String(client_id));
    if (ex) return res.json({ id: ex.id, dup: true });
  }
  const r = db.prepare('INSERT INTO events (client_id, patient_id, started_at, duration_sec, source, data, created_at) VALUES (?,?,?,?,?,?,?)')
    .run(client_id ? String(client_id) : null, req.patient.id, Number(started_at) || Date.now(), duration_sec == null ? null : Number(duration_sec), 'family', JSON.stringify(data || {}), Date.now());
  res.json({ id: Number(r.lastInsertRowid) });
});
app.post('/api/me/events/:id/video', patientAuth, (req, res, next) => {
  const f = D.getSetting('features');
  if (!f.video || !f.videoUpload) return res.status(403).json({ error: 'disabled' });
  express.raw({ type: () => true, limit: `${f.videoMaxMb}mb` })(req, res, next);
}, (req, res) => {
  const e = db.prepare('SELECT * FROM events WHERE id = ? AND patient_id = ?').get(req.params.id, req.patient.id);
  if (!e) return res.status(404).json({ error: 'not_found' });
  if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: 'empty' });
  const ext = /mp4/.test(req.get('content-type') || '') ? 'mp4' : /quicktime/.test(req.get('content-type') || '') ? 'mov' : 'webm';
  const file = `${e.patient_id}-${e.id}-${D.randToken(6)}.${ext}`;
  fs.writeFileSync(path.join(D.DATA_DIR, 'videos', file), req.body);
  if (e.video) fs.rm(path.join(D.DATA_DIR, 'videos', e.video), () => {});
  db.prepare('UPDATE events SET video = ? WHERE id = ?').run(file, e.id);
  res.json({ ok: true });
});
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') return res.status(413).json({ error: 'too_large' });
  console.error(err); res.status(500).json({ error: 'server' });
});

// ---------- static ----------
const PUB = path.join(ROOT, 'public');
app.get('/content/narration.json', (req, res) => res.sendFile(path.join(CONTENT, 'narration.json')));
app.use('/app', express.static(path.join(PUB, 'app'), { setHeaders: (res, f) => { if (/sw\.js$|\.html$|\.webmanifest$/.test(f)) res.set('Cache-Control', 'no-cache'); } }));
app.use('/admin', express.static(path.join(PUB, 'admin'), { setHeaders: (res, f) => { if (/\.(html|js|css)$/.test(f)) res.set('Cache-Control', 'no-cache'); } }));
app.use(express.static(PUB, { maxAge: '7d', index: false }));
app.get('/', (req, res) => res.redirect('/app/'));

app.listen(PORT, () => console.log(`Nawba running on http://localhost:${PORT}  (family app /app/, staff panel /admin/)`));

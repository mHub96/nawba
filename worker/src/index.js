// Nawba API on Cloudflare Workers — D1 (database) + optional R2 (seizure videos).
// Mirrors server/server.js (the local Node server) route for route.
import catalog from '../../content/catalog.json';
import education from '../../content/education.json';

// ---------- content ----------
const ITEMS = [...catalog.items, ...education.map(m => ({ id: m.id, cat: 'edu', en: m.en, ar: m.ar, lay: m.ar, def: m.def, lvl: m.lvl, icon: m.icon }))];
const BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const LEVEL = { nurse: 1, doctor: 2, admin: 3, owner: 4 };
const DEFAULTS = {
  features: { ambulance: false, video: false, videoUpload: false, videoMaxMb: 25, emergencyNumber: '911', rescueAlertMin: 5 },
  visibility: {}, publicUrl: '', centerName: { ar: 'مركز الصرع', en: 'Epilepsy Center' }
};
const NURSE_FIELDS = ['guardian', 'phone', 'phone2', 'governorate', 'address', 'contacts'];

// ---------- crypto ----------
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const randToken = (n = 32) => b64u(crypto.getRandomValues(new Uint8Array(n)));
const randInt = (min, max) => min + (crypto.getRandomValues(new Uint32Array(1))[0] % (max - min));
async function sha256(s) { return b64u(await crypto.subtle.digest('SHA-256', enc.encode(s))); }
const PBKDF2_ITER = 50000;
async function pbkdf2(pw, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(String(pw)), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
}
async function hashPass(pw) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `p1$${PBKDF2_ITER}$${b64u(salt)}$${b64u(await pbkdf2(pw, salt, PBKDF2_ITER))}`;
}
async function checkPass(pw, stored) {
  const [v, iter, salt, h] = String(stored || '').split('$');
  if (v !== 'p1' || !salt || !h) return false;
  const a = await pbkdf2(pw, unb64u(salt), Number(iter)), b = unb64u(h);
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

// ---------- http helpers ----------
class HttpError extends Error { constructor(status, code) { super(code); this.status = status; } }
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
function cors(req, env, res) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
  const h = new Headers(res.headers);
  if (allowed.includes('*')) h.set('Access-Control-Allow-Origin', '*');
  else if (allowed.includes(origin)) { h.set('Access-Control-Allow-Origin', origin); h.set('Vary', 'Origin'); }
  h.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  h.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  h.set('Access-Control-Max-Age', '86400');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'no-referrer');
  return new Response(res.body, { status: res.status, headers: h });
}

// ---------- db helpers ----------
const one = (env, sql, ...b) => env.DB.prepare(sql).bind(...b).first();
const all = async (env, sql, ...b) => (await env.DB.prepare(sql).bind(...b).all()).results;
const run = (env, sql, ...b) => env.DB.prepare(sql).bind(...b).run();

async function getSetting(env, key) {
  const r = await one(env, 'SELECT value FROM settings WHERE key = ?', key);
  if (!r) return structuredClone(DEFAULTS[key]);
  const v = JSON.parse(r.value);
  return (v && typeof v === 'object' && !Array.isArray(v)) ? { ...DEFAULTS[key], ...v } : v;
}
const setSetting = (env, key, value) => run(env, 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, JSON.stringify(value));
const audit = (env, actor, action, target, detail) => run(env, 'INSERT INTO audit (at, actor, action, target, detail) VALUES (?,?,?,?,?)', Date.now(), actor, action, target == null ? null : String(target), detail ? JSON.stringify(detail) : null);

async function createSession(env, kind, id, ttl) {
  const token = randToken();
  await run(env, 'INSERT INTO sessions VALUES (?,?,?,?)', await sha256(token), kind, id, Date.now() + ttl);
  return token;
}
async function readSession(env, token) {
  if (!token) return null;
  const s = await one(env, 'SELECT * FROM sessions WHERE token_hash = ?', await sha256(token));
  return s && s.expires > Date.now() ? s : null;
}
const dropSessionsFor = (env, kind, id) => run(env, 'DELETE FROM sessions WHERE kind = ? AND subject_id = ?', kind, id);

// login throttle (10 failures / 15 min), stored in D1 so it holds across Worker instances
async function throttled(env, key) { const f = await one(env, 'SELECT n, t FROM fails WHERE key = ?', key); return !!(f && f.n >= 10 && Date.now() - f.t < 15 * 60e3); }
async function fail(env, key) {
  const f = await one(env, 'SELECT n, t FROM fails WHERE key = ?', key);
  if (!f || Date.now() - f.t > 15 * 60e3) await run(env, 'INSERT INTO fails (key, n, t) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET n = 1, t = excluded.t', key, Date.now());
  else await run(env, 'UPDATE fails SET n = n + 1 WHERE key = ?', key);
}
const clearFail = (env, key) => run(env, 'DELETE FROM fails WHERE key = ?', key);

async function globalVisible(env, id, vis) {
  vis ||= await getSetting(env, 'visibility');
  return id in vis ? !!vis[id] : !!(BY_ID[id] && BY_ID[id].def);
}
function visibleFor(p, id, vis) {
  const ov = JSON.parse(p.overrides || '{}')[id];
  if (ov === 'show') return true;
  if (ov === 'hide') return false;
  return id in vis ? !!vis[id] : !!(BY_ID[id] && BY_ID[id].def);
}
async function baseUrl(env) {
  const s = await getSetting(env, 'publicUrl');
  return String((s && s.trim()) || env.PUBLIC_URL || '').replace(/\/+$/, '');
}
const patientRow = (p, full = true) => {
  const o = { id: p.id, code: p.code, name: p.name, active: !!p.active, created_at: p.created_at, updated_at: p.updated_at, data: JSON.parse(p.data) };
  if (full) o.overrides = JSON.parse(p.overrides);
  return o;
};
const eventRow = (e) => ({ id: e.id, started_at: e.started_at, duration_sec: e.duration_sec, source: e.source, data: JSON.parse(e.data), video: !!e.video, created_at: e.created_at });
async function newPatientCode(env) {
  for (;;) { const c = 'NW-' + randInt(10000, 99999); if (!(await one(env, 'SELECT 1 AS x FROM patients WHERE code = ?', c))) return c; }
}
const newPin = () => String(randInt(100000, 999999));

// ---------- router ----------
const routes = [];
const on = (method, pattern, ...handlers) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), handlers });

const staffAuth = async (c) => {
  const s = await readSession(c.env, c.token);
  if (!s || s.kind !== 'staff') throw new HttpError(401, 'auth');
  const u = await one(c.env, 'SELECT id, username, name, role, lang, active FROM staff WHERE id = ?', s.subject_id);
  if (!u || !u.active) throw new HttpError(401, 'auth');
  c.staff = u;
};
const patientAuth = async (c) => {
  const s = await readSession(c.env, c.token);
  if (!s || s.kind !== 'patient') throw new HttpError(401, 'auth');
  const p = await one(c.env, 'SELECT * FROM patients WHERE id = ?', s.subject_id);
  if (!p || !p.active) throw new HttpError(401, 'auth');
  c.patient = p;
};
const atLeast = (role) => async (c) => { if (LEVEL[c.staff.role] < LEVEL[role]) throw new HttpError(403, 'forbidden'); };
const actor = (c) => c.staff ? `${c.staff.role}:${c.staff.username}` : c.patient ? `family:${c.patient.code}` : 'system';
async function getPatient(c) {
  const p = await one(c.env, 'SELECT * FROM patients WHERE id = ?', c.params.id);
  if (!p) throw new HttpError(404, 'not_found');
  return p;
}

// ----- setup & auth -----
on('GET', '/api/setup', async (c) => json({ needsOwner: !(await one(c.env, 'SELECT 1 AS x FROM staff LIMIT 1')) }));
on('POST', '/api/setup', async (c) => {
  if (await one(c.env, 'SELECT 1 AS x FROM staff LIMIT 1')) throw new HttpError(409, 'exists');
  const { username, name, password, lang } = c.body;
  if (!username || !name || !password || String(password).length < 8) throw new HttpError(400, 'invalid');
  await run(c.env, 'INSERT INTO staff (username, name, role, pass, lang, created_at) VALUES (?,?,?,?,?,?)', String(username).trim(), String(name).trim(), 'owner', await hashPass(password), lang === 'en' ? 'en' : 'ar', Date.now());
  await audit(c.env, `owner:${username}`, 'setup.owner', username);
  return json({ ok: true });
});
on('POST', '/api/staff/login', async (c) => {
  const { username, password } = c.body;
  const key = `s:${c.ip}:${String(username).toLowerCase()}`;
  if (await throttled(c.env, key)) throw new HttpError(429, 'throttled');
  const u = await one(c.env, 'SELECT * FROM staff WHERE username = ? COLLATE NOCASE', String(username || '').trim());
  if (!u || !u.active || !(await checkPass(password || '', u.pass))) { await fail(c.env, key); throw new HttpError(401, 'bad_login'); }
  await clearFail(c.env, key);
  await run(c.env, 'DELETE FROM sessions WHERE expires < ?', Date.now());
  const token = await createSession(c.env, 'staff', u.id, 12 * 3600e3);
  await audit(c.env, `${u.role}:${u.username}`, 'staff.login', u.id);
  return json({ token, user: { id: u.id, username: u.username, name: u.name, role: u.role, lang: u.lang } });
});
on('POST', '/api/patient/login', async (c) => {
  const { code, password, qr } = c.body;
  let p;
  if (qr) {
    const key = `q:${c.ip}`;
    if (await throttled(c.env, key)) throw new HttpError(429, 'throttled');
    p = await one(c.env, 'SELECT * FROM patients WHERE qr_token = ?', String(qr));
    if (!p) { await fail(c.env, key); throw new HttpError(401, 'bad_qr'); }
  } else {
    const cd = String(code || '').trim().toUpperCase().replace(/^NW-?/, 'NW-');
    const key = `p:${c.ip}:${cd}`;
    if (await throttled(c.env, key)) throw new HttpError(429, 'throttled');
    p = await one(c.env, 'SELECT * FROM patients WHERE code = ?', cd);
    if (!p || !(await checkPass(password || '', p.pass))) { await fail(c.env, key); throw new HttpError(401, 'bad_login'); }
  }
  if (!p.active) throw new HttpError(403, 'inactive');
  const token = await createSession(c.env, 'patient', p.id, 365 * 24 * 3600e3);
  await audit(c.env, `family:${p.code}`, qr ? 'family.login.qr' : 'family.login', p.id);
  return json({ token });
});

// ----- staff self -----
on('GET', '/api/staff/me', staffAuth, async (c) => json({ user: c.staff, centerName: await getSetting(c.env, 'centerName') }));
on('POST', '/api/staff/logout', staffAuth, async (c) => { await run(c.env, 'DELETE FROM sessions WHERE token_hash = ?', await sha256(c.token)); return json({ ok: true }); });
on('POST', '/api/staff/me', staffAuth, async (c) => {
  const { lang, oldPassword, newPassword, name } = c.body;
  if (lang) await run(c.env, 'UPDATE staff SET lang = ? WHERE id = ?', lang === 'en' ? 'en' : 'ar', c.staff.id);
  if (name) await run(c.env, 'UPDATE staff SET name = ? WHERE id = ?', String(name).trim(), c.staff.id);
  if (newPassword) {
    const u = await one(c.env, 'SELECT pass FROM staff WHERE id = ?', c.staff.id);
    if (!(await checkPass(oldPassword || '', u.pass))) throw new HttpError(400, 'bad_old_password');
    if (String(newPassword).length < 8) throw new HttpError(400, 'weak_password');
    await run(c.env, 'UPDATE staff SET pass = ? WHERE id = ?', await hashPass(newPassword), c.staff.id);
    await audit(c.env, actor(c), 'staff.password', c.staff.id);
  }
  return json({ ok: true });
});

// ----- staff management -----
on('GET', '/api/staff', staffAuth, atLeast('admin'), async (c) => json(await all(c.env, 'SELECT id, username, name, role, lang, active, created_at FROM staff ORDER BY active DESC, role, name')));
on('POST', '/api/staff', staffAuth, atLeast('admin'), async (c) => {
  const { username, name, role, password } = c.body;
  if (!LEVEL[role] || role === 'owner' || LEVEL[role] >= LEVEL[c.staff.role]) throw new HttpError(403, 'role_not_allowed');
  if (!username || !name || !password || String(password).length < 8) throw new HttpError(400, 'invalid');
  if (await one(c.env, 'SELECT 1 AS x FROM staff WHERE username = ? COLLATE NOCASE', String(username).trim())) throw new HttpError(409, 'username_taken');
  const r = await run(c.env, 'INSERT INTO staff (username, name, role, pass, created_at, created_by) VALUES (?,?,?,?,?,?)', String(username).trim(), String(name).trim(), role, await hashPass(password), Date.now(), c.staff.id);
  await audit(c.env, actor(c), 'staff.create', r.meta.last_row_id, { username, role });
  return json({ id: r.meta.last_row_id });
});
on('PATCH', '/api/staff/:id', staffAuth, atLeast('admin'), async (c) => {
  const t = await one(c.env, 'SELECT * FROM staff WHERE id = ?', c.params.id);
  if (!t) throw new HttpError(404, 'not_found');
  if (LEVEL[t.role] >= LEVEL[c.staff.role]) throw new HttpError(403, 'role_not_allowed');
  const { name, role, active, password } = c.body;
  if (role) {
    if (!LEVEL[role] || LEVEL[role] >= LEVEL[c.staff.role]) throw new HttpError(403, 'role_not_allowed');
    await run(c.env, 'UPDATE staff SET role = ? WHERE id = ?', role, t.id);
  }
  if (name) await run(c.env, 'UPDATE staff SET name = ? WHERE id = ?', String(name).trim(), t.id);
  if (active !== undefined) { await run(c.env, 'UPDATE staff SET active = ? WHERE id = ?', active ? 1 : 0, t.id); if (!active) await dropSessionsFor(c.env, 'staff', t.id); }
  if (password) {
    if (String(password).length < 8) throw new HttpError(400, 'weak_password');
    await run(c.env, 'UPDATE staff SET pass = ? WHERE id = ?', await hashPass(password), t.id); await dropSessionsFor(c.env, 'staff', t.id);
  }
  await audit(c.env, actor(c), 'staff.update', t.id, { name, role, active, password: password ? 'reset' : undefined });
  return json({ ok: true });
});

// ----- catalog & settings -----
on('GET', '/api/catalog', staffAuth, async (c) => {
  const vis = await getSetting(c.env, 'visibility');
  return json({ categories: catalog.categories, items: ITEMS.map(i => ({ ...i, visible: i.id in vis ? !!vis[i.id] : !!i.def })), source: catalog._source });
});
on('PUT', '/api/catalog/visibility', staffAuth, atLeast('admin'), async (c) => {
  const vis = await getSetting(c.env, 'visibility');
  for (const [id, v] of Object.entries(c.body)) if (BY_ID[id]) vis[id] = !!v;
  await setSetting(c.env, 'visibility', vis);
  await audit(c.env, actor(c), 'catalog.visibility', null, c.body);
  return json({ ok: true });
});
on('GET', '/api/settings', staffAuth, async (c) => json({ features: await getSetting(c.env, 'features'), publicUrl: await getSetting(c.env, 'publicUrl'), centerName: await getSetting(c.env, 'centerName'), videoStorage: !!c.env.VIDEOS }));
on('PUT', '/api/settings', staffAuth, atLeast('admin'), async (c) => {
  const { features, publicUrl, centerName } = c.body;
  if (features) {
    const f = await getSetting(c.env, 'features');
    for (const k of ['ambulance', 'video', 'videoUpload']) if (k in features) f[k] = !!features[k];
    if ('videoMaxMb' in features) f.videoMaxMb = Math.max(1, Math.min(90, Number(features.videoMaxMb) || 25));
    if ('rescueAlertMin' in features) f.rescueAlertMin = Math.max(1, Math.min(30, Number(features.rescueAlertMin) || 5));
    if ('emergencyNumber' in features) f.emergencyNumber = String(features.emergencyNumber).replace(/[^\d+]/g, '').slice(0, 15) || '911';
    await setSetting(c.env, 'features', f);
  }
  if (publicUrl !== undefined && c.staff.role === 'owner') await setSetting(c.env, 'publicUrl', String(publicUrl).trim());
  if (centerName) await setSetting(c.env, 'centerName', { ar: String(centerName.ar || ''), en: String(centerName.en || '') });
  await audit(c.env, actor(c), 'settings.update', null, c.body);
  return json({ ok: true });
});

// ----- patients -----
on('GET', '/api/patients', staffAuth, async (c) => {
  const q = `%${String(c.url.searchParams.get('q') || '').trim()}%`;
  const rows = await all(c.env, `SELECT p.*, (SELECT COUNT(*) FROM events e WHERE e.patient_id = p.id AND e.started_at > ?) AS ev30,
      (SELECT MAX(started_at) FROM events e WHERE e.patient_id = p.id) AS last_event
    FROM patients p WHERE p.name LIKE ? OR p.code LIKE ? ORDER BY p.active DESC, p.updated_at DESC LIMIT 500`, Date.now() - 30 * 864e5, q, q);
  return json(rows.map(p => ({ ...patientRow(p, false), ev30: p.ev30, last_event: p.last_event })));
});
on('POST', '/api/patients', staffAuth, atLeast('doctor'), async (c) => {
  const { name, data } = c.body;
  if (!name || !String(name).trim()) throw new HttpError(400, 'invalid');
  const code = await newPatientCode(c.env), pin = newPin(), now = Date.now();
  const r = await run(c.env, 'INSERT INTO patients (code, pass, qr_token, name, data, created_at, updated_at, created_by) VALUES (?,?,?,?,?,?,?,?)',
    code, await hashPass(pin), randToken(24), String(name).trim(), JSON.stringify(data || {}), now, now, c.staff.id);
  await audit(c.env, actor(c), 'patient.create', r.meta.last_row_id, { code });
  return json({ id: r.meta.last_row_id, code, password: pin });
});
on('GET', '/api/patients/:id', staffAuth, async (c) => {
  const p = await getPatient(c);
  return json({ ...patientRow(p), link: `${await baseUrl(c.env)}/app/#k=${p.qr_token}` });
});
on('PUT', '/api/patients/:id', staffAuth, async (c) => {
  const p = await getPatient(c);
  const { name, data, active } = c.body;
  const cur = JSON.parse(p.data);
  const full = LEVEL[c.staff.role] >= LEVEL.doctor;
  let next;
  if (full) next = { ...cur, ...(data || {}) };
  else { next = { ...cur }; for (const k of NURSE_FIELDS) if (data && k in data) next[k] = data[k]; }
  await run(c.env, 'UPDATE patients SET name = ?, data = ?, updated_at = ? WHERE id = ?', (full && name) ? String(name).trim() : p.name, JSON.stringify(next), Date.now(), p.id);
  if (active !== undefined && LEVEL[c.staff.role] >= LEVEL.admin) {
    await run(c.env, 'UPDATE patients SET active = ? WHERE id = ?', active ? 1 : 0, p.id);
    if (!active) await dropSessionsFor(c.env, 'patient', p.id);
  }
  await audit(c.env, actor(c), 'patient.update', p.id, { fields: Object.keys(data || {}), active });
  return json({ ok: true });
});
on('PUT', '/api/patients/:id/overrides', staffAuth, atLeast('doctor'), async (c) => {
  const p = await getPatient(c);
  const ov = JSON.parse(p.overrides);
  for (const [id, v] of Object.entries(c.body)) { if (!BY_ID[id]) continue; if (v === 'show' || v === 'hide') ov[id] = v; else delete ov[id]; }
  await run(c.env, 'UPDATE patients SET overrides = ?, updated_at = ? WHERE id = ?', JSON.stringify(ov), Date.now(), p.id);
  await audit(c.env, actor(c), 'patient.overrides', p.id, c.body);
  return json({ ok: true, overrides: ov });
});
on('POST', '/api/patients/:id/reset-password', staffAuth, async (c) => {
  const p = await getPatient(c), pin = newPin();
  await run(c.env, 'UPDATE patients SET pass = ? WHERE id = ?', await hashPass(pin), p.id);
  await audit(c.env, actor(c), 'patient.reset_password', p.id);
  return json({ password: pin });
});
on('POST', '/api/patients/:id/regen-qr', staffAuth, atLeast('doctor'), async (c) => {
  const p = await getPatient(c);
  await run(c.env, 'UPDATE patients SET qr_token = ? WHERE id = ?', randToken(24), p.id);
  await dropSessionsFor(c.env, 'patient', p.id);
  await audit(c.env, actor(c), 'patient.regen_qr', p.id);
  return json({ ok: true });
});

// ----- events -----
on('GET', '/api/patients/:id/events', staffAuth, async (c) => json((await all(c.env, 'SELECT * FROM events WHERE patient_id = ? ORDER BY started_at DESC LIMIT 1000', c.params.id)).map(eventRow)));
on('POST', '/api/patients/:id/events', staffAuth, async (c) => {
  const p = await getPatient(c);
  const { started_at, duration_sec, data } = c.body;
  const r = await run(c.env, 'INSERT INTO events (patient_id, started_at, duration_sec, source, data, created_at, created_by) VALUES (?,?,?,?,?,?,?)',
    p.id, Number(started_at) || Date.now(), duration_sec == null ? null : Number(duration_sec), 'staff', JSON.stringify(data || {}), Date.now(), c.staff.id);
  await audit(c.env, actor(c), 'event.create', r.meta.last_row_id, { patient: p.id });
  return json({ id: r.meta.last_row_id });
});
on('DELETE', '/api/events/:id', staffAuth, atLeast('doctor'), async (c) => {
  const e = await one(c.env, 'SELECT * FROM events WHERE id = ?', c.params.id);
  if (!e) throw new HttpError(404, 'not_found');
  if (e.video && c.env.VIDEOS) await c.env.VIDEOS.delete(e.video);
  await run(c.env, 'DELETE FROM events WHERE id = ?', e.id);
  await audit(c.env, actor(c), 'event.delete', e.id, { patient: e.patient_id });
  return json({ ok: true });
});
on('GET', '/api/events/:id/video', staffAuth, async (c) => {
  const e = await one(c.env, 'SELECT video FROM events WHERE id = ?', c.params.id);
  if (!e || !e.video || !c.env.VIDEOS) throw new HttpError(404, 'not_found');
  const obj = await c.env.VIDEOS.get(e.video);
  if (!obj) throw new HttpError(404, 'not_found');
  await audit(c.env, actor(c), 'event.video.view', c.params.id);
  return new Response(obj.body, { headers: { 'Content-Type': obj.httpMetadata?.contentType || 'video/mp4', 'Cache-Control': 'private, no-store' } });
});
on('GET', '/api/stats', staffAuth, async (c) => {
  const now = Date.now(), n = async (sql, ...b) => (await one(c.env, sql, ...b)).n;
  return json({
    patients: await n('SELECT COUNT(*) AS n FROM patients WHERE active = 1'),
    events7: await n('SELECT COUNT(*) AS n FROM events WHERE started_at > ?', now - 7 * 864e5),
    events30: await n('SELECT COUNT(*) AS n FROM events WHERE started_at > ?', now - 30 * 864e5),
    long30: await n('SELECT COUNT(*) AS n FROM events WHERE started_at > ? AND duration_sec >= 300', now - 30 * 864e5),
    staff: await n('SELECT COUNT(*) AS n FROM staff WHERE active = 1'),
    recent: (await all(c.env, 'SELECT e.id, e.started_at, e.duration_sec, e.data, p.id AS pid, p.name, p.code FROM events e JOIN patients p ON p.id = e.patient_id ORDER BY e.started_at DESC LIMIT 12'))
      .map(r => ({ ...r, data: JSON.parse(r.data) }))
  });
});
on('GET', '/api/audit', staffAuth, atLeast('admin'), async (c) => json(await all(c.env, 'SELECT * FROM audit ORDER BY id DESC LIMIT 300')));

// ----- family -----
on('GET', '/api/me', patientAuth, async (c) => {
  const p = c.patient, d = JSON.parse(p.data);
  const [feats, vis, centerName] = await Promise.all([getSetting(c.env, 'features'), getSetting(c.env, 'visibility'), getSetting(c.env, 'centerName')]);
  const familyCats = catalog.categories.filter(x => x.family).map(x => x.id);
  const typical = new Set((d.seizures || []).flatMap(s => [...(s.aura || []), ...(s.ictal || []), ...(s.postictal || []), ...(s.triggers || [])]));
  const items = ITEMS.filter(i => familyCats.includes(i.cat) && visibleFor(p, i.id, vis))
    .map(i => ({ id: i.id, cat: i.cat, lay: i.lay, urgent: !!i.urgent, typical: typical.has(i.id), icon: i.icon }));
  const visEdu = new Set(items.filter(i => i.cat === 'edu').map(i => i.id));
  const videoOk = feats.video && feats.videoUpload && !!c.env.VIDEOS;
  return json({
    patient: {
      code: p.code, name: p.name, dob: d.dob || '', sex: d.sex || '', guardian: d.guardian || '', doctor: d.doctor || '',
      seizures: (d.seizures || []).map(s => ({
        type: s.typeId ? { id: s.typeId, lay: BY_ID[s.typeId]?.lay || '', ar: BY_ID[s.typeId]?.ar || '' } : null,
        nickname: s.nickname || '', freqCount: s.freqCount || '', freqPer: s.freqPer || '', duration: s.duration || '',
        signs: [...(s.aura || []), ...(s.ictal || []), ...(s.postictal || [])].filter(id => BY_ID[id]).map(id => ({ id, cat: BY_ID[id].cat, lay: BY_ID[id].lay }))
      })),
      meds: d.meds || [], rescue: d.rescue && d.rescue.enabled ? d.rescue : null, contacts: d.contacts || [], familyNote: d.familyNote || ''
    },
    items, edu: education.filter(m => visEdu.has(m.id)),
    features: { ambulance: feats.ambulance, video: feats.video, videoUpload: videoOk, videoMaxMb: feats.videoMaxMb, emergencyNumber: feats.emergencyNumber, rescueAlertMin: feats.rescueAlertMin },
    centerName
  });
});
on('GET', '/api/me/events', patientAuth, async (c) => json((await all(c.env, 'SELECT * FROM events WHERE patient_id = ? ORDER BY started_at DESC LIMIT 60', c.patient.id)).map(eventRow)));
on('POST', '/api/me/events', patientAuth, async (c) => {
  const { client_id, started_at, duration_sec, data } = c.body;
  if (client_id) { const ex = await one(c.env, 'SELECT id FROM events WHERE client_id = ?', String(client_id)); if (ex) return json({ id: ex.id, dup: true }); }
  const r = await run(c.env, 'INSERT INTO events (client_id, patient_id, started_at, duration_sec, source, data, created_at) VALUES (?,?,?,?,?,?,?)',
    client_id ? String(client_id) : null, c.patient.id, Number(started_at) || Date.now(), duration_sec == null ? null : Number(duration_sec), 'family', JSON.stringify(data || {}), Date.now());
  return json({ id: r.meta.last_row_id });
});
on('POST', '/api/me/events/:id/video', patientAuth, async (c) => {
  const f = await getSetting(c.env, 'features');
  if (!f.video || !f.videoUpload || !c.env.VIDEOS) throw new HttpError(403, 'disabled');
  const len = Number(c.req.headers.get('content-length') || 0);
  if (len > f.videoMaxMb * 1048576) throw new HttpError(413, 'too_large');
  const e = await one(c.env, 'SELECT * FROM events WHERE id = ? AND patient_id = ?', c.params.id, c.patient.id);
  if (!e) throw new HttpError(404, 'not_found');
  const body = await c.req.arrayBuffer();
  if (!body.byteLength) throw new HttpError(400, 'empty');
  if (body.byteLength > f.videoMaxMb * 1048576) throw new HttpError(413, 'too_large');
  const ct = c.req.headers.get('content-type') || 'video/mp4';
  const ext = /mp4/.test(ct) ? 'mp4' : /quicktime/.test(ct) ? 'mov' : 'webm';
  const key = `${e.patient_id}/${e.id}-${randToken(6)}.${ext}`;
  await c.env.VIDEOS.put(key, body, { httpMetadata: { contentType: ct } });
  if (e.video) await c.env.VIDEOS.delete(e.video);
  await run(c.env, 'UPDATE events SET video = ? WHERE id = ?', key, e.id);
  return json({ ok: true });
});

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return cors(req, env, new Response(null, { status: 204 }));
    const url = new URL(req.url);
    let res;
    try {
      const route = routes.find(r => r.method === req.method && r.re.test(url.pathname));
      if (!route) throw new HttpError(404, 'not_found');
      const auth = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '') || url.searchParams.get('t') || '';
      const c = { req, env, url, params: url.pathname.match(route.re).groups || {}, token: auth, ip: req.headers.get('CF-Connecting-IP') || 'x', body: {} };
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && (req.headers.get('content-type') || '').includes('application/json')) {
        c.body = await req.json().catch(() => ({})) || {};
      }
      for (const h of route.handlers) { const out = await h(c); if (out instanceof Response) { res = out; break; } }
      res ||= json({ ok: true });
    } catch (e) {
      if (e instanceof HttpError) res = json({ error: e.message }, e.status);
      else { console.error(e); res = json({ error: 'server' }, 500); }
    }
    return cors(req, env, res);
  }
};

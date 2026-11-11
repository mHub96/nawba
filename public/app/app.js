/* نوبة — family app (RTL, Iraqi Arabic, voice-first, offline-first). */
(() => {
  'use strict';
  const I = window.ICONS;
  const $app = document.getElementById('app');
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('nawba.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('nawba.' + k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem('nawba.' + k); } catch {} }
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const arNum = (n) => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const mmss = (s) => arNum(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`);
  const fmtDate = (t) => new Date(t).toLocaleString('ar-IQ', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

  const API = (window.NAWBA_API || '').replace(/\/+$/, '');
  let token = LS.get('token', '');
  let ME = LS.get('me', null);
  let NARR = {};
  let AUDIO_V = {};
  let voiceOn = LS.get('voice', true);

  // ---------------- network ----------------
  async function api(path, opts = {}) {
    const res = await fetch(API + path, {
      method: opts.method || 'GET',
      headers: { ...(opts.body && !(opts.body instanceof Blob) ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}), Authorization: 'Bearer ' + token },
      body: opts.body instanceof Blob ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (res.status === 401 && !opts.noLogout) { logout(); throw new Error('auth'); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(data.error || 'http'); e.status = res.status; throw e; }
    return data;
  }
  async function refreshMe() {
    try { ME = await api('/api/me'); LS.set('me', ME); } catch (e) { if (e.message === 'auth') return; }
    return ME;
  }
  async function flushOutbox() {
    const box = LS.get('outbox', []);
    if (!box.length || !navigator.onLine || !token) return;
    const keep = [];
    for (const ev of box) {
      try {
        const r = await api('/api/me/events', { method: 'POST', body: ev });
        if (ev._video && pendingVideo && pendingVideo.id === ev.client_id) await uploadVideo(r.id);
      } catch { keep.push(ev); }
    }
    LS.set('outbox', keep);
  }
  function setOnline() { document.getElementById('offline').hidden = navigator.onLine; if (navigator.onLine) flushOutbox(); }
  addEventListener('online', setOnline); addEventListener('offline', setOnline);

  // ---------------- voice ----------------
  const player = new Audio();
  player.preload = 'auto';
  let queue = [], forced = false;
  // say(...keys) plays only when voice is on; sayForce plays a clip the user explicitly tapped.
  function say(...keys) { queue = keys.flat().filter(Boolean); forced = false; player.pause(); playNext(); }
  function sayForce(...keys) { queue = keys.flat().filter(Boolean); forced = true; player.pause(); playNext(); }
  function playNext() {
    if ((!voiceOn && !forced) || !queue.length) return;
    const k = queue.shift();
    player.src = `../audio/${k}.mp3${AUDIO_V[k] ? '?v=' + AUDIO_V[k] : ''}`;
    player.play().catch(() => {});
  }
  player.addEventListener('ended', () => setTimeout(playNext, 350));
  function stopVoice() { queue = []; player.pause(); }
  function toggleVoice(btn) {
    voiceOn = !voiceOn; LS.set('voice', voiceOn);
    if (!voiceOn) stopVoice();
    document.querySelectorAll('[data-voice]').forEach(b => { b.classList.toggle('on', voiceOn); b.innerHTML = voiceOn ? I.speaker : I.mute; b.setAttribute('aria-label', voiceOn ? 'إيقاف الصوت' : 'تشغيل الصوت'); });
  }
  const voiceBtn = () => `<button class="icon-btn ${voiceOn ? 'on' : ''}" data-voice aria-label="${voiceOn ? 'إيقاف الصوت' : 'تشغيل الصوت'}">${voiceOn ? I.speaker : I.mute}</button>`;
  const sayBtn = (key, label = 'اسمع') => `<button class="replay" data-say="${key}">${I.speaker}<span>${label}</span></button>`;

  // ---------------- wake lock ----------------
  let wake = null;
  async function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => (wake = null)); }
      if (!on && wake) { await wake.release(); wake = null; }
    } catch {}
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && FLOW && FLOW.phase === 'ictal') keepAwake(true); });

  // ---------------- toast ----------------
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  // ---------------- routing ----------------
  function go(hash) { if (location.hash !== hash) location.hash = hash; else route(); }
  addEventListener('hashchange', route);
  function render(html, { flow = false, after = false } = {}) {
    document.body.classList.toggle('flow', flow);
    document.body.classList.toggle('after', after);
    $app.innerHTML = `<section class="screen">${html}</section>`;
    window.scrollTo(0, 0);
  }
  $app.addEventListener('click', (e) => {
    const v = e.target.closest('[data-voice]'); if (v) { toggleVoice(v); return; }
    const s = e.target.closest('[data-say]'); if (s) { sayForce(s.dataset.say); return; }
    const g = e.target.closest('[data-go]'); if (g) { stopVoice(); go(g.dataset.go); }
  });

  async function route() {
    const h = location.hash || '#home';
    if (h.startsWith('#k=')) return qrLogin(h.slice(3));
    if (!token) return loginScreen();
    if (!ME) { render(`<div class="step"><p>…جاري التحميل</p></div>`); await refreshMe(); if (!ME) return loginScreen('ما كدرنا نحمّل الملف. تأكد من الإنترنت.'); }
    if (FLOW && !h.startsWith('#flow')) { /* leaving flow via back button */ endFlow(false); }
    if (h === '#home') return home();
    if (h === '#profile') return profile();
    if (h === '#learn') return learn();
    if (h.startsWith('#learn/')) return lesson(h.slice(7));
    if (h === '#history') return historyScreen();
    if (h === '#flow') return FLOW ? renderFlow() : startFlow();
    if (h === '#log') return startLog();
    home();
  }

  // ---------------- auth ----------------
  function logout() { token = ''; ME = null; LS.del('token'); LS.del('me'); go('#home'); }
  async function qrLogin(k) {
    render(`<div class="step"><div class="picto">${I.p_shield}</div><h2>…دنفتح ملف المريض</h2></div>`);
    try {
      const r = await fetch(API + '/api/patient/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ qr: k }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      token = d.token; LS.set('token', token); ME = null;
      history.replaceState(null, '', location.pathname + '#home');
      await refreshMe(); route(); setTimeout(() => say('welcome'), 300);
    } catch { history.replaceState(null, '', location.pathname + '#home'); loginScreen('رمز QR هذا ما يشتغل. اطلب رمز جديد من المركز، أو ادخل الرقم والرمز السري.'); }
  }
  function loginScreen(err = '') {
    render(`
      <div class="chevrons"></div>
      <div style="text-align:center;margin:28px 0 22px">
        <div class="brand" style="justify-content:center"><span class="brand-mark">${I.logo}</span><span class="wordmark">نوبة</span></div>
        <p class="label" style="margin-top:6px">دليل العائلة وقت نوبة الصرع</p>
      </div>
      <div class="card">
        <p style="margin:0 0 6px"><b>أسهل طريقة:</b> افتح كاميرا الموبايل ووجّهها على رمز QR اللي انطاك ياه المركز.</p>
      </div>
      <p class="section-title">أو ادخل الرقم والرمز السري</p>
      ${err ? `<div class="error">${esc(err)}</div>` : ''}
      <form id="login">
        <label class="field"><span>رقم المريض</span><input name="code" autocomplete="username" inputmode="text" placeholder="NW-12345" required></label>
        <label class="field"><span>الرمز السري</span><input name="password" type="password" autocomplete="current-password" inputmode="numeric" required></label>
        <button class="btn" type="submit">دخول</button>
      </form>`);
    document.getElementById('login').onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      try {
        const r = await fetch(API + '/api/patient/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: f.get('code'), password: f.get('password') }) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        token = d.token; LS.set('token', token); ME = null; await refreshMe(); go('#home'); setTimeout(() => say('welcome'), 300);
      } catch (er) { loginScreen(er.message === 'throttled' ? 'محاولات كثيرة. انتظر ربع ساعة وجرّب.' : 'الرقم أو الرمز السري غلط.'); }
    };
  }

  // ---------------- home ----------------
  function home() {
    const p = ME.patient;
    const pending = LS.get('outbox', []).length;
    render(`
      <div class="topbar">
        <span class="brand-mark">${I.logo}</span>
        <h1>${esc(p.name)}<small>${esc(ME.centerName?.ar || '')}</small></h1>
        ${voiceBtn()}
      </div>
      <div class="chevrons clay" style="opacity:.25"></div>
      <button class="nawba-now" id="go-flow" aria-label="نوبة الآن — ابدأ الإرشاد">
        <div>${I.bolt}<b>نوبة الآن</b><span>اضغط هنا وقت النوبة</span></div>
      </button>
      <p class="hint">التطبيق راح يحسب الوقت ويحجي وياك خطوة بخطوة</p>
      <div class="tiles">
        <button class="tile" data-go="#profile">${I.user}<div><b>ملف المريض</b><br><small>النوبات، الأدوية، خطة الإسعاف</small></div></button>
        <button class="tile" data-go="#learn">${I.book}<div><b>تعلّم</b><br><small>${arNum(ME.edu.length)} دروس مفتوحة</small></div></button>
        <button class="tile" data-go="#log">${I.plus}<div><b>سجّل نوبة صارت</b><br><small>نوبة خلصت قبل شوية</small></div></button>
        <button class="tile" data-go="#history">${I.list}<div><b>سجل النوبات</b><br><small>${pending ? arNum(pending) + ' تنتظر الإرسال' : 'كل النوبات المسجلة'}</small></div></button>
      </div>
      ${ME.features.ambulance ? `<a class="btn ghost" style="margin-top:14px;text-decoration:none" href="tel:${esc(ME.features.emergencyNumber)}">${I.phone} الإسعاف ${arNum(ME.features.emergencyNumber)}</a>` : ''}
      <div class="spacer"></div>
      <button class="btn ghost" style="margin-top:22px;min-height:48px;font-size:15px" id="logout">${I.logout} خروج من الحساب</button>
    `);
    document.getElementById('go-flow').onclick = () => go('#flow');
    document.getElementById('logout').onclick = () => { if (confirm('متأكد تريد تطلع؟ راح تحتاج رمز QR أو الرمز السري حتى ترجع.')) logout(); };
  }

  // ---------------- profile ----------------
  const PER = { day: 'باليوم', week: 'بالأسبوع', month: 'بالشهر', year: 'بالسنة' };
  function profile() {
    const p = ME.patient;
    const sz = p.seizures.map((s, i) => `
      <div class="card">
        <span class="label">نوبة ${arNum(i + 1)}${s.nickname ? ` — "${esc(s.nickname)}"` : ''}</span>
        <h3>${esc(s.type?.lay || 'نوع النوبة')}</h3>
        ${s.freqCount ? `<span class="pill saffron">${I.clock} ${arNum(s.freqCount)} مرات ${PER[s.freqPer] || ''}</span>` : ''}
        ${s.duration ? `<span class="pill">تطوّل ${esc(s.duration)}</span>` : ''}
        ${s.signs.length ? `<p class="label" style="margin-top:8px">شنو يصير عادةً:</p><div>${s.signs.map(x => `<span class="pill ${x.cat === 'aura' ? 'saffron' : x.cat === 'postictal' ? '' : 'clay'}">${esc(x.lay)}</span>`).join('')}</div>` : ''}
        ${s.type ? sayBtn('item_' + s.type.id) : ''}
      </div>`).join('');
    render(`
      <div class="topbar"><button class="icon-btn" data-go="#home" aria-label="رجوع">${I.back}</button><h1>ملف المريض</h1>${voiceBtn()}</div>
      <div class="card"><h3>${esc(p.name)}</h3><p class="label num" dir="ltr" style="text-align:end">${esc(p.code)}</p>
        ${p.doctor ? `<p>الطبيب المعالج: ${esc(p.doctor)}</p>` : ''}${sayBtn('home_profile', 'شنو هالصفحة؟')}</div>
      ${p.familyNote ? `<div class="card" style="border-color:var(--tigris)"><span class="label">ملاحظة من الدكتور</span><p>${esc(p.familyNote)}</p></div>` : ''}
      ${p.rescue ? `<div class="card rescue"><span class="label">خطة الإسعاف</span><h3>${esc(p.rescue.drug)} — ${esc(p.rescue.dose)}</h3>
        <p>${esc(p.rescue.route || '')}</p><p>انطيه إذا النوبة طوّلت <b>${arNum(p.rescue.afterMin || ME.features.rescueAlertMin)} دقايق</b></p>${p.rescue.notes ? `<p class="label">${esc(p.rescue.notes)}</p>` : ''}</div>` : ''}
      ${sz ? `<p class="section-title">النوبات اللي تصير عنده</p>${sz}` : ''}
      ${p.meds.length ? `<p class="section-title">الأدوية اليومية</p><div class="card">${p.meds.map(m => `<p>${I.pill.replace('<svg', '<svg style="width:20px;height:20px;vertical-align:-4px;color:var(--tigris)"')} <b>${esc(m.name)}</b> ${esc(m.dose || '')} <span class="label">${esc(m.schedule || '')}</span></p>`).join('')}</div>` : ''}
      ${p.contacts.length ? `<p class="section-title">أرقام مهمة</p>${p.contacts.map(c => `<a class="card" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit" href="tel:${esc(c.phone)}"><span class="mi" style="color:var(--tigris)">${I.phone}</span><span style="flex:1"><b>${esc(c.name)}</b><br><span class="label">${esc(c.relation || '')}</span></span><span class="num" dir="ltr">${esc(c.phone)}</span></a>`).join('')}` : ''}
    `);
  }

  // ---------------- learn ----------------
  function learn() {
    render(`
      <div class="topbar"><button class="icon-btn" data-go="#home" aria-label="رجوع">${I.back}</button><h1>تعلّم</h1>${voiceBtn()}</div>
      <div class="card" style="background:var(--tigris-soft);border:0"><p style="margin:0">كل ما تتعلم أكثر، الدكتور يفتح لك دروس جديدة.</p>${sayBtn('home_learn')}</div>
      ${ME.edu.map(m => `<button class="card mod" style="width:100%;text-align:start" data-go="#learn/${m.id}"><span class="mi">${I[m.icon] || I.book}</span><span><b>${esc(m.ar)}</b><br><span class="label">${arNum(m.paras.length)} فقرات · اسمع أو اقرأ</span></span></button>`).join('')}
    `);
  }
  function lesson(id) {
    const m = ME.edu.find(x => x.id === id);
    if (!m) return go('#learn');
    render(`
      <div class="topbar"><button class="icon-btn" data-go="#learn" aria-label="رجوع">${I.back}</button><h1>${esc(m.ar)}</h1>${voiceBtn()}</div>
      ${m.image ? `<a href="../${esc(m.image)}" target="_blank" rel="noopener"><img class="guide-img" src="../${esc(m.image)}" alt="${esc(m.ar)}"></a>` : ''}
      <button class="btn" id="play-all" style="margin-bottom:14px">${I.speaker} اسمع الدرس كله</button>
      ${m.paras.map((p, i) => `<div class="card para"><p>${esc(p)}</p><button class="say icon-btn" data-say="edu_${m.id}_${i}" aria-label="اسمع">${I.speaker}</button></div>`).join('')}
    `);
    document.getElementById('play-all').onclick = () => sayForce(`edu_${m.id}_t`, ...m.paras.map((_, i) => `edu_${m.id}_${i}`));
  }

  // ---------------- history ----------------
  async function historyScreen() {
    render(`<div class="topbar"><button class="icon-btn" data-go="#home" aria-label="رجوع">${I.back}</button><h1>سجل النوبات</h1></div><div id="hist"><p class="label">…جاري التحميل</p></div>`);
    const pending = LS.get('outbox', []);
    let list = [];
    try { list = await api('/api/me/events'); LS.set('events', list); } catch { list = LS.get('events', []); }
    const row = (e, wait) => `<div class="card"><div style="display:flex;justify-content:space-between;gap:10px"><b>${fmtDate(e.started_at)}</b>${e.duration_sec != null ? `<span class="pill ${e.duration_sec >= 300 ? 'clay' : ''}">${mmss(e.duration_sec)}</span>` : ''}</div>
      ${e.data?.urgent ? '<span class="pill clay">علامات خطر</span>' : ''}${wait ? '<span class="pill saffron">تنتظر الإنترنت</span>' : ''}${e.data?.rescueGiven ? '<span class="pill clay">انطى دوا الإسعاف</span>' : ''}</div>`;
    document.getElementById('hist').innerHTML = (pending.map(e => row(e, true)).join('') + list.map(e => row(e)).join('')) || `<div class="step"><div class="picto" style="background:var(--tigris-soft)">${I.p_diary}</div><p>ماكو نوبات مسجلة بعد.</p></div>`;
  }

  // ================= CRISIS FLOW =================
  const STEPS = {
    c_calm: ['اهدأ وخذ نفَس', 'p_calm'], c_space: ['احمي راسه', 'p_space'], c_clothes: ['فك الملابس الضيقة', 'p_clothes'],
    c_side: ['على جنبه إذا تكدر', 'p_side'], c_donts: ['لا تخلي شي بحلكه', 'p_donts'], c_watch: ['ابقى يمّه وراقب', 'p_watch'],
    n_calm: ['ابقى يمّه', 'p_hold'], n_guide: ['بعّده عن الخطر', 'p_guide'], n_talk: ['احجي وياه بهدوء', 'p_talk'],
    rec1: ['وضعية الإفاقة ١ — الإيد', 'p_rec1'], rec2: ['وضعية الإفاقة ٢ — الركبة', 'p_rec2'], rec3: ['وضعية الإفاقة ٣ — على جنبه', 'p_rec3'],
    rec4: ['وضعية الإفاقة ٤ — افتح النفَس', 'p_rec4'], breathe: ['تأكد من نفَسه', 'p_breathe'], stay: ['ابقى وياه لحد ما يصحى', 'p_stay'],
    no_food: ['لا أكل ولا مي هسه', 'p_nofood']
  };
  const ICTAL = { convulsive: ['c_calm', 'c_space', 'c_clothes', 'c_side', 'c_donts', 'c_watch'], nonconvulsive: ['n_calm', 'n_guide', 'n_talk'] };
  const POST = { convulsive: ['rec1', 'rec2', 'rec3', 'rec4', 'breathe', 'stay', 'no_food'], nonconvulsive: ['stay', 'no_food'] };
  const DIARY_CATS = ['aura', 'ictal', 'postictal', 'trigger'];

  let FLOW = null, tick = null, pendingVideo = null;
  const alertMin = () => (ME.patient.rescue?.afterMin ? Number(ME.patient.rescue.afterMin) : ME.features.rescueAlertMin) || 5;
  const elapsed = () => Math.max(0, ((FLOW.stoppedAt || Date.now()) - FLOW.start) / 1000);
  const saveFlow = () => LS.set('flow', { ...FLOW, selected: [...FLOW.selected] });

  function newFlow(mode) {
    return { id: uid(), mode, start: Date.now(), stoppedAt: null, kind: null, phase: mode === 'log' ? 'logmeta' : 'choose', i: 0, alerted: false,
      redflags: {}, selected: new Set(), notes: '', rescueGiven: false, video: false, urgent: false, diaryIdx: 0 };
  }
  function startFlow() {
    const saved = LS.get('flow', null);
    // resume a flow interrupted by a reload within the last hour
    if (saved && saved.mode === 'live' && Date.now() - saved.start < 3600e3 && saved.phase !== 'done') { FLOW = { ...saved, selected: new Set(saved.selected) }; }
    else { FLOW = newFlow('live'); }
    saveFlow(); keepAwake(true);
    clearInterval(tick); tick = setInterval(onTick, 1000);
    renderFlow();
  }
  function startLog() {
    FLOW = newFlow('log'); FLOW.stoppedAt = FLOW.start; saveFlow();
    go('#flow');
  }
  function endFlow(clear = true) {
    clearInterval(tick); tick = null; keepAwake(false); stopVoice();
    if (clear) LS.del('flow');
    FLOW = null; document.body.classList.remove('flow', 'after');
  }

  function flowHead({ timer = true } = {}) {
    const s = elapsed(), lim = alertMin() * 60, C = 2 * Math.PI * 28;
    const frac = Math.min(1, s / lim);
    const cls = s >= lim ? 'over' : s >= lim * 0.6 ? 'warn' : '';
    return `<div class="flow-head">
      ${timer && FLOW.mode === 'live' ? `<div class="timer ${cls}" id="timer">
        <svg class="ring" viewBox="0 0 64 64"><circle class="track" cx="32" cy="32" r="28"/><circle class="prog" id="ring" cx="32" cy="32" r="28" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - frac)}"/></svg>
        <div class="timer-text"><b class="num" id="clock" dir="ltr">${mmss(s)}</b><small>${FLOW.stoppedAt ? 'مدة النوبة' : 'مدة النوبة لحد هسه'}</small></div></div>` : '<div class="spacer"></div>'}
      ${voiceBtn()}
      <button class="icon-btn" id="exit" aria-label="إنهاء">${I.close}</button>
    </div>`;
  }
  function onTick() {
    if (!FLOW || FLOW.stoppedAt) return;
    const s = elapsed(), lim = alertMin() * 60, C = 2 * Math.PI * 28;
    const clock = document.getElementById('clock'); if (clock) clock.textContent = mmss(s);
    const ring = document.getElementById('ring'); if (ring) ring.setAttribute('stroke-dashoffset', C * (1 - Math.min(1, s / lim)));
    const tm = document.getElementById('timer'); if (tm) { tm.classList.toggle('warn', s >= lim * .6 && s < lim); tm.classList.toggle('over', s >= lim); }
    if (s >= lim && !FLOW.alerted) { FLOW.alerted = true; saveFlow(); showAlert(); }
  }
  function bindHead() {
    const x = document.getElementById('exit');
    if (x) x.onclick = () => {
      if (FLOW.phase === 'diary' || FLOW.phase === 'triage' || FLOW.phase === 'post' || FLOW.phase === 'logmeta') {
        if (!confirm('تريد تطلع بدون ما تسجل النوبة؟')) return;
      } else if (FLOW.mode === 'live' && !confirm('النوبة بعدها مستمرة؟ إذا وكفت اضغط "وكفت النوبة". تريد تطلع؟')) return;
      endFlow(); go('#home');
    };
  }

  function renderFlow() {
    if (!FLOW) return go('#home');
    const ph = FLOW.phase;
    if (ph === 'choose') return flowChoose();
    if (ph === 'ictal') return flowStep(ICTAL[FLOW.kind], true);
    if (ph === 'post') return flowStep(POST[FLOW.kind], false);
    if (ph === 'triage') return flowTriage();
    if (ph === 'verdict') return flowVerdict();
    if (ph === 'logmeta') return flowLogMeta();
    if (ph === 'diary') return flowDiary();
    if (ph === 'notes') return flowNotes();
    if (ph === 'done') return flowDone();
  }

  function flowChoose() {
    render(`${flowHead()}
      <div class="step">
        <h2>شنو دتشوف هسه؟</h2><p style="margin-bottom:18px">اختار الصورة اللي تشبه حالته</p>
        <div class="choices">
          <button class="choice" data-kind="convulsive">${I.p_convulsive}<span><b>جسمه يرجف أو متخشّب</b><small>وكع، تشنج، رجفة</small></span></button>
          <button class="choice" data-kind="nonconvulsive">${I.p_nonconvulsive}<span><b>سرحان أو يتصرف غريب</b><small>ما يرد عليك، يمضغ، يمشي بلا هدف</small></span></button>
        </div>
        ${sayBtn('choose_type', 'اسمع مرة ثانية')}
      </div>`, { flow: true });
    bindHead();
    $app.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => { FLOW.kind = b.dataset.kind; FLOW.phase = 'ictal'; FLOW.i = 0; saveFlow(); renderFlow(); });
    say('choose_type');
  }

  function flowStep(list, ictal) {
    const key = list[Math.min(FLOW.i, list.length - 1)];
    const last = FLOW.i >= list.length - 1;
    const [title, pic] = STEPS[key];
    const f = ME.features;
    render(`${flowHead()}
      <div class="dots">${list.map((_, j) => `<i class="${j === FLOW.i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="step">
        <div class="picto">${I[pic]}</div>
        <div class="step-num">${ictal ? 'أثناء النوبة' : 'بعد النوبة'} — الخطوة ${arNum(FLOW.i + 1)} من ${arNum(list.length)}</div>
        <h2>${esc(title)}</h2>
        <p>${esc(NARR[key] || '')}</p>
        ${sayBtn(key, 'اسمع مرة ثانية')}
      </div>
      <div class="flow-actions">
        ${ictal && (f.video || f.ambulance) ? `<div class="flow-tools">
          ${f.video ? `<label class="btn outline-light" style="cursor:pointer">${I.camera} صوّر النوبة<input type="file" accept="video/*" capture="environment" id="vid" hidden></label>` : ''}
          ${f.ambulance ? `<a class="btn outline-light" style="text-decoration:none" href="tel:${esc(f.emergencyNumber)}">${I.phone} ${arNum(f.emergencyNumber)}</a>` : ''}</div>` : ''}
        ${ictal ? `<div class="btn-row">${FLOW.i > 0 ? `<button class="btn outline-light" id="prev" style="flex:.45">${I.back}</button>` : ''}${!last ? `<button class="btn outline-light" id="next">التالي ${I.next}</button>` : ''}</div>
          <button class="btn stopped" id="stopped">${I.check} وكفت النوبة</button>`
        : `<div class="btn-row">${FLOW.i > 0 ? `<button class="btn ghost" id="prev" style="flex:.45">${I.back}</button>` : ''}<button class="btn" id="next">${last ? 'خلصت، كمّل' : 'التالي'} ${I.next}</button></div>`}
      </div>`, { flow: true, after: !ictal });
    bindHead();
    const nx = document.getElementById('next'), pv = document.getElementById('prev'), st = document.getElementById('stopped');
    if (nx) nx.onclick = () => {
      if (!last) { FLOW.i++; saveFlow(); return renderFlow(); }
      FLOW.phase = 'triage'; FLOW.i = 0; saveFlow(); renderFlow();
    };
    if (pv) pv.onclick = () => { FLOW.i = Math.max(0, FLOW.i - 1); saveFlow(); renderFlow(); };
    if (st) st.onclick = () => {
      FLOW.stoppedAt = Date.now(); FLOW.phase = 'post'; FLOW.i = 0; saveFlow();
      renderFlow(); say(FLOW.kind === 'convulsive' ? 'after_intro' : null, POST[FLOW.kind][0]);
      return;
    };
    const vid = document.getElementById('vid');
    if (vid) vid.onchange = () => { const file = vid.files[0]; if (file) { pendingVideo = { id: FLOW.id, file }; FLOW.video = true; saveFlow(); toast('انحفظ الفيديو. كمّل الخطوات.'); } };
    if (!(FLOW.i === 0 && !ictal && FLOW._introPlayed !== FLOW.phase)) say(key);
    FLOW._introPlayed = FLOW.phase;
  }

  function showAlert() {
    const f = ME.features, rx = ME.patient.rescue, min = alertMin();
    if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
    const el = document.createElement('div');
    el.className = 'alert'; el.setAttribute('role', 'alertdialog');
    el.innerHTML = `<div class="inner">
      <div style="width:110px;margin:0 auto">${I.p_calm}</div>
      <h2>صارت ${arNum(min)} دقايق والنوبة بعدها مستمرة</h2>
      <p>هاي حالة طارئة</p>
      ${rx ? `<div class="rx"><b>دوا الإسعاف:</b> ${esc(rx.drug)} — ${esc(rx.dose)}<br>${esc(rx.route || '')}${rx.notes ? `<br><small>${esc(rx.notes)}</small>` : ''}</div>
        <button class="btn light" id="rx-given">${I.check} انطيته الدوا</button>` : ''}
      ${f.ambulance ? `<a class="btn light" style="text-decoration:none" href="tel:${esc(f.emergencyNumber)}">${I.phone} اتصل بالإسعاف ${arNum(f.emergencyNumber)}</a>`
        : `<p style="font-size:22px;font-weight:700">خذوه لأقرب طوارئ بأسرع وقت</p>`}
      <button class="btn outline-light" id="al-close" style="border-color:rgba(255,255,255,.6);color:#fff">رجوع للخطوات</button></div>`;
    document.body.appendChild(el);
    say(min === 5 ? 'alert_5min' : null, rx ? 'alert_rescue' : null, f.ambulance ? 'alert_call' : 'alert_er');
    const g = el.querySelector('#rx-given');
    if (g) g.onclick = () => { FLOW.rescueGiven = true; FLOW.rescueAt = Date.now(); saveFlow(); g.textContent = '✓ تم التسجيل'; g.disabled = true; };
    el.querySelector('#al-close').onclick = () => { el.remove(); stopVoice(); };
  }

  // ----- triage (red flags) -----
  function triageList() {
    const all = ME.items.filter(i => i.cat === 'redflag');
    return all.filter(i => !(FLOW.mode === 'live' && i.id === 'R_long'));
  }
  function flowTriage() {
    if (FLOW.mode === 'live' && ME.items.some(i => i.id === 'R_long')) FLOW.redflags.R_long = elapsed() >= 300;
    const list = triageList();
    if (!list.length || FLOW.i >= list.length) { FLOW.phase = 'verdict'; saveFlow(); return renderFlow(); }
    const q = list[FLOW.i];
    render(`${flowHead({ timer: FLOW.mode === 'live' })}
      <div class="dots">${list.map((_, j) => `<i class="${j === FLOW.i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="step">
        <div class="step-num">أسئلة الأمان — السؤال ${arNum(FLOW.i + 1)} من ${arNum(list.length)}</div>
        <h2>${esc(q.lay)}</h2>
        ${sayBtn('item_' + q.id, 'اسمع السؤال')}
        <div class="yn" style="margin-top:22px">
          <button class="yes" data-a="1">${I.yes}إي</button>
          <button class="no" data-a="0">${I.no}لا</button>
        </div>
      </div>
      ${FLOW.i > 0 ? `<button class="btn ghost" id="prev">${I.back} السؤال السابق</button>` : ''}`, { flow: true, after: true });
    bindHead();
    $app.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { FLOW.redflags[q.id] = b.dataset.a === '1'; FLOW.i++; saveFlow(); renderFlow(); });
    const pv = document.getElementById('prev'); if (pv) pv.onclick = () => { FLOW.i--; saveFlow(); renderFlow(); };
    if (FLOW.i === 0) say('triage_intro', 'item_' + q.id); else say('item_' + q.id);
  }
  function flowVerdict() {
    const urgent = Object.values(FLOW.redflags).some(Boolean);
    FLOW.urgent = urgent; saveFlow();
    const f = ME.features;
    render(`${flowHead({ timer: FLOW.mode === 'live' })}
      <div class="step">
        <div class="verdict ${urgent ? 'urgent' : 'ok'}">
          <div style="width:96px;margin:0 auto">${urgent ? I.p_doctor : I.p_shield}</div>
          <h2>${urgent ? 'لازم يشوفه طبيب هسه' : 'ماكو علامات خطر'}</h2>
          <p>${urgent ? 'لا تتأخر. خلي واحد يبقى يمّه.' : 'خليه يرتاح، وكمّل دواه بوقته.'}</p>
          ${urgent ? (f.ambulance ? `<a class="btn light" style="text-decoration:none;color:var(--clay-deep);margin-top:10px" href="tel:${esc(f.emergencyNumber)}">${I.phone} اتصل ${arNum(f.emergencyNumber)}</a>` : `<p style="font-weight:700;font-size:20px">خذوه لأقرب طوارئ</p>`) : ''}
        </div>
      </div>
      <button class="btn" id="next">سجّل النوبة للدكتور ${I.next}</button>`, { flow: true, after: true });
    bindHead();
    document.getElementById('next').onclick = () => { FLOW.phase = 'diary'; FLOW.diaryIdx = 0; saveFlow(); renderFlow(); };
    say(urgent ? 'triage_urgent' : 'triage_ok', urgent && !f.ambulance ? 'alert_er' : null);
  }

  // ----- quick log metadata -----
  function flowLogMeta() {
    const d = new Date(FLOW.start - new Date().getTimezoneOffset() * 60e3).toISOString().slice(0, 16);
    const durs = [[30, 'أقل من دقيقة'], [90, 'دقيقة لدقيقتين'], [210, '٢ – ٥ دقايق'], [360, 'أكثر من ٥ دقايق']];
    render(`${flowHead({ timer: false })}
      <div class="step" style="justify-content:flex-start;text-align:start;align-items:stretch">
        <h2>سجّل نوبة صارت</h2>
        <label class="field"><span>وكت النوبة</span><input type="datetime-local" id="when" value="${d}" style="direction:ltr"></label>
        <p class="label">كد طوّلت؟</p>
        <div class="chips">${durs.map(([v, t]) => `<button class="chip ${FLOW.logDur === v ? 'on' : ''}" data-dur="${v}"><span class="tick">${I.check}</span><span class="txt">${t}</span></button>`).join('')}</div>
        <p class="label" style="margin-top:14px">شلون كانت؟</p>
        <div class="chips">
          <button class="chip ${FLOW.kind === 'convulsive' ? 'on' : ''}" data-k="convulsive"><span class="tick">${I.check}</span><span class="txt">جسمه يرجف أو متخشّب</span></button>
          <button class="chip ${FLOW.kind === 'nonconvulsive' ? 'on' : ''}" data-k="nonconvulsive"><span class="tick">${I.check}</span><span class="txt">سرحان أو يتصرف غريب</span></button>
        </div>
      </div>
      <button class="btn" id="next">التالي ${I.next}</button>`, { flow: true, after: true });
    bindHead();
    $app.querySelectorAll('[data-dur]').forEach(b => b.onclick = () => { FLOW.logDur = Number(b.dataset.dur); saveFlow(); flowLogMeta(); });
    $app.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { FLOW.kind = b.dataset.k; saveFlow(); flowLogMeta(); });
    document.getElementById('when').onchange = (e) => { const t = new Date(e.target.value).getTime(); if (t) { FLOW.start = t; FLOW.stoppedAt = t + (FLOW.logDur || 0) * 1000; saveFlow(); } };
    document.getElementById('next').onclick = () => {
      FLOW.stoppedAt = FLOW.start + (FLOW.logDur || 0) * 1000;
      FLOW.phase = 'triage'; FLOW.i = 0; saveFlow(); renderFlow();
    };
  }

  // ----- diary (symptom questionnaire) -----
  function diaryCats() { return DIARY_CATS.filter(c => ME.items.some(i => i.cat === c)); }
  function flowDiary() {
    const cats = diaryCats();
    if (FLOW.diaryIdx >= cats.length) { FLOW.phase = 'notes'; saveFlow(); return renderFlow(); }
    const cat = cats[FLOW.diaryIdx];
    const items = ME.items.filter(i => i.cat === cat).sort((a, b) => (b.typical - a.typical));
    const titles = { aura: 'شنو صار قبل النوبة؟', ictal: 'شنو شفت أثناء النوبة؟', postictal: 'شنو صار بعد النوبة؟', trigger: 'تتوقع شنو سبّب النوبة؟' };
    render(`${flowHead({ timer: false })}
      <div class="dots">${cats.map((_, j) => `<i class="${j === FLOW.diaryIdx ? 'on' : ''}"></i>`).join('')}</div>
      <div style="padding:4px 2px 12px"><h2 style="margin:0;font-size:24px">${titles[cat]}</h2><p class="label" style="margin:2px 0 0">اختار كل اللي شفته · تكدر تختار أكثر من شي</p></div>
      <div class="chips">${items.map(i => `
        <div class="chip ${FLOW.selected.has(i.id) ? 'on' : ''}" data-id="${i.id}" role="checkbox" aria-checked="${FLOW.selected.has(i.id)}" tabindex="0">
          <span class="tick">${I.check}</span><span class="txt">${esc(i.lay)}${i.typical ? '<span class="usual">عادةً يصير</span>' : ''}</span>
          <button class="say" data-say="item_${i.id}" aria-label="اسمع">${I.speaker}</button></div>`).join('')}</div>
      <div style="height:14px"></div>
      <div class="btn-row">${FLOW.diaryIdx > 0 ? `<button class="btn ghost" id="prev" style="flex:.45">${I.back}</button>` : ''}<button class="btn" id="next">التالي ${I.next}</button></div>`, { flow: true, after: true });
    bindHead();
    $app.querySelectorAll('.chip[data-id]').forEach(c => {
      const toggle = (e) => {
        if (e.target.closest('[data-say]')) return;
        const id = c.dataset.id;
        FLOW.selected.has(id) ? FLOW.selected.delete(id) : FLOW.selected.add(id);
        c.classList.toggle('on'); c.setAttribute('aria-checked', FLOW.selected.has(id)); saveFlow();
      };
      c.onclick = toggle; c.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(e); } };
    });
    document.getElementById('next').onclick = () => { FLOW.diaryIdx++; saveFlow(); renderFlow(); };
    const pv = document.getElementById('prev'); if (pv) pv.onclick = () => { FLOW.diaryIdx--; saveFlow(); renderFlow(); };
    say(FLOW.diaryIdx === 0 ? 'diary_intro' : null, 'diary_' + cat);
  }
  function flowNotes() {
    render(`${flowHead({ timer: false })}
      <div class="step" style="justify-content:flex-start;align-items:stretch;text-align:start">
        <h2>تريد تضيف شي؟</h2>
        <p class="label" style="margin-bottom:10px">اختياري: اكتب أي شي تحب الدكتور يعرفه</p>
        <textarea id="notes" placeholder="مثلاً: صارت بالنوم…">${esc(FLOW.notes)}</textarea>
        ${FLOW.video && pendingVideo ? `<div class="card" style="margin-top:12px"><b>${I.camera.replace('<svg', '<svg style="width:20px;height:20px;vertical-align:-4px"')} عندك فيديو للنوبة</b>
          <p class="label">${ME.features.videoUpload ? 'راح ينرسل للدكتور ويا التسجيل.' : 'احفظه بالموبايل وراويه للدكتور بالمراجعة.'}</p>
          <a class="btn ghost" id="save-vid" style="text-decoration:none">حفظ الفيديو بالموبايل</a></div>` : ''}
      </div>
      <button class="btn" id="save">${I.check} احفظ وأرسل للدكتور</button>`, { flow: true, after: true });
    bindHead();
    const sv = document.getElementById('save-vid');
    if (sv) { sv.href = URL.createObjectURL(pendingVideo.file); sv.download = `nawba-${new Date(FLOW.start).toISOString().slice(0, 16).replace(':', '-')}.${(pendingVideo.file.name.split('.').pop() || 'mp4')}`; }
    document.getElementById('notes').oninput = (e) => { FLOW.notes = e.target.value; saveFlow(); };
    document.getElementById('save').onclick = saveEvent;
  }
  async function saveEvent() {
    const sel = [...FLOW.selected], byCat = (c) => sel.filter(id => ME.items.find(i => i.id === id && i.cat === c));
    const ev = {
      client_id: FLOW.id, started_at: FLOW.start,
      duration_sec: FLOW.stoppedAt ? Math.round((FLOW.stoppedAt - FLOW.start) / 1000) : null,
      data: { mode: FLOW.mode, kind: FLOW.kind, redflags: FLOW.redflags, urgent: FLOW.urgent, aura: byCat('aura'), ictal: byCat('ictal'), postictal: byCat('postictal'), trigger: byCat('trigger'), notes: FLOW.notes.trim(), rescueGiven: FLOW.rescueGiven, rescueAfterSec: FLOW.rescueAt ? Math.round((FLOW.rescueAt - FLOW.start) / 1000) : null, videoTaken: FLOW.video },
      _video: !!(FLOW.video && ME.features.videoUpload)
    };
    const box = LS.get('outbox', []); box.push(ev); LS.set('outbox', box);
    FLOW.phase = 'done'; saveFlow();
    renderFlow();
    await flushOutbox();
    const left = LS.get('outbox', []).some(e => e.client_id === ev.client_id);
    const st = document.getElementById('sync');
    if (st) st.textContent = left ? 'انحفظ بالموبايل، وراح ينرسل أول ما يرجع الإنترنت.' : 'انرسل للدكتور ✓';
  }
  async function uploadVideo(eventId) {
    const f = pendingVideo.file;
    if (f.size > ME.features.videoMaxMb * 1048576) { toast(`الفيديو كبير (أكثر من ${arNum(ME.features.videoMaxMb)} ميغا). احفظه بالموبايل.`); return; }
    try { await api(`/api/me/events/${eventId}/video`, { method: 'POST', body: f, headers: { 'Content-Type': f.type || 'video/mp4' } }); toast('انرسل الفيديو للدكتور ✓'); }
    catch { toast('ما انرسل الفيديو. احفظه بالموبايل.'); }
    pendingVideo = null;
  }
  function flowDone() {
    render(`
      <div class="step">
        <div class="picto">${I.p_diary}</div>
        <h2>تم الحفظ</h2>
        <p id="sync">…دنرسل للدكتور</p>
        <p class="label" style="margin-top:12px">الله يحفظه. إذا عندك سؤال، راجع الدكتور.</p>
      </div>
      <button class="btn" id="home">رجوع للرئيسية</button>`, { flow: true, after: true });
    document.getElementById('home').onclick = () => { endFlow(); go('#home'); };
    say('saved');
    LS.del('flow');
  }

  // ---------------- boot ----------------
  async function boot() {
    setOnline();
    try { NARR = await (await fetch('../content/narration.json')).json(); } catch {}
    try { AUDIO_V = (await (await fetch('../audio/index.json')).json()).hashes || {}; } catch {}
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {});
    if (token && navigator.onLine) refreshMe().then(() => { if (!FLOW && (location.hash === '#home' || !location.hash)) route(); });
    flushOutbox();
    route();
  }
  boot();
})();

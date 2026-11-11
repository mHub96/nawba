/* نوبة — staff console (Owner › Admin › Doctor › Nurse), bilingual AR/EN. */
(() => {
  'use strict';
  const I = window.ICONS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get: (k, d) => { try { return JSON.parse(localStorage.getItem('nawba.admin.' + k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem('nawba.admin.' + k, JSON.stringify(v)); } catch {} } };

  // ---------------- i18n ----------------
  const T = {
    appName: ['Nawba', 'نوبة'], console: ['Staff console', 'لوحة الكادر'],
    login: ['Sign in', 'تسجيل الدخول'], username: ['Username', 'اسم المستخدم'], password: ['Password', 'كلمة المرور'], badLogin: ['Wrong username or password.', 'اسم المستخدم أو كلمة المرور غير صحيحة.'], throttled: ['Too many attempts. Try again in 15 minutes.', 'محاولات كثيرة. حاول بعد ١٥ دقيقة.'],
    setupTitle: ['Create the owner account', 'إنشاء حساب المالك'], setupHint: ['First run: this account has full control of the app. Password: at least 8 characters.', 'التشغيل الأول: هذا الحساب يملك الصلاحيات الكاملة. كلمة المرور ٨ أحرف على الأقل.'], fullName: ['Full name', 'الاسم الكامل'], create: ['Create', 'إنشاء'],
    dashboard: ['Overview', 'نظرة عامة'], patients: ['Patients', 'المرضى'], content: ['Questions & education', 'الأسئلة والتثقيف'], settings: ['App settings', 'إعدادات التطبيق'], staff: ['Staff & roles', 'الكادر والصلاحيات'], audit: ['Activity log', 'سجل النشاط'], account: ['My account', 'حسابي'], logout: ['Sign out', 'خروج'],
    owner: ['Owner', 'المالك'], admin: ['Admin', 'مدير'], doctor: ['Doctor', 'طبيب'], nurse: ['Nurse', 'ممرض'],
    activePatients: ['Active patients', 'المرضى النشطون'], ev7: ['Seizures · 7 days', 'نوبات · ٧ أيام'], ev30: ['Seizures · 30 days', 'نوبات · ٣٠ يوماً'], long30: ['≥5 min · 30 days', '≥٥ دقائق · ٣٠ يوماً'], activeStaff: ['Active staff', 'الكادر النشط'],
    recentEvents: ['Latest reported seizures', 'آخر النوبات المسجّلة'], noEvents: ['No seizures recorded yet.', 'لا توجد نوبات مسجّلة بعد.'],
    newPatient: ['New patient', 'مريض جديد'], search: ['Search name or ID…', 'ابحث بالاسم أو الرقم…'], name: ['Name', 'الاسم'], id: ['ID', 'الرقم'], last30: ['Last 30 d', 'آخر ٣٠ يوماً'], lastEvent: ['Last seizure', 'آخر نوبة'], status: ['Status', 'الحالة'], active: ['Active', 'نشط'], inactive: ['Inactive', 'معطّل'], noPatients: ['No patients yet.', 'لا يوجد مرضى بعد.'],
    dossier: ['Dossier', 'الملف'], diary: ['Seizure diary', 'سجل النوبات'], familyView: ['Family view', 'ما تراه العائلة'], access: ['Access & QR', 'الدخول و QR'],
    identity: ['Patient identity', 'هوية المريض'], dob: ['Date of birth', 'تاريخ الميلاد'], sex: ['Sex', 'الجنس'], male: ['Male', 'ذكر'], female: ['Female', 'أنثى'], guardian: ['Guardian / caregiver', 'ولي الأمر / المرافق'], phone: ['Phone', 'الهاتف'], governorate: ['Governorate', 'المحافظة'], mrn: ['Hospital file no.', 'رقم الملف بالمستشفى'], treatingDoctor: ['Treating doctor', 'الطبيب المعالج'],
    diagnosis: ['Diagnosis (ILAE)', 'التشخيص (ILAE)'], epilepsyType: ['Epilepsy type', 'نوع الصرع'], focal: ['Focal', 'بؤري'], generalized: ['Generalized', 'معمّم'], combined: ['Combined generalized & focal', 'مشترك معمّم وبؤري'], unknown: ['Unknown', 'غير معروف'], etiology: ['Etiology', 'المسبّب'], syndrome: ['Epilepsy syndrome', 'المتلازمة الصرعية'], comorbid: ['Comorbidities', 'الأمراض المصاحبة'], allergies: ['Allergies', 'الحساسية'],
    structural: ['Structural', 'بنيوي'], genetic: ['Genetic', 'وراثي'], infectious: ['Infectious', 'عدوائي'], metabolic: ['Metabolic', 'استقلابي'], immune: ['Immune', 'مناعي'],
    seizureTypes: ['Seizure types', 'أنواع النوبات'], addSeizure: ['Add seizure type', 'إضافة نوع نوبة'], seizureN: ['Seizure type', 'نوع النوبة'], ilaeType: ['ILAE 2025 type', 'النوع حسب ILAE 2025'], nickname: ['Family\'s name for it', 'اسمها عند العائلة'], frequency: ['Frequency', 'التكرار'], per: ['per', 'في'], day: ['day', 'اليوم'], week: ['week', 'الأسبوع'], month: ['month', 'الشهر'], year: ['year', 'السنة'], typDuration: ['Typical duration', 'المدة المعتادة'], notes: ['Notes', 'ملاحظات'], remove: ['Remove', 'حذف'], choose: ['— choose —', '— اختر —'],
    meds: ['Daily medications', 'الأدوية اليومية'], drug: ['Drug', 'الدواء'], dose: ['Dose', 'الجرعة'], schedule: ['Schedule', 'المواعيد'], add: ['Add', 'إضافة'],
    rescue: ['Rescue medication plan', 'خطة دواء الإسعاف'], rescueOn: ['Patient has a rescue medication', 'لدى المريض دواء إسعاف'], route: ['Route', 'طريقة الإعطاء'], buccal: ['Buccal', 'بين الخد واللثة'], nasal: ['Intranasal', 'بالأنف'], rectal: ['Rectal', 'شرجي'], giveAfter: ['Give after (min)', 'يُعطى بعد (دقيقة)'],
    contacts: ['Emergency contacts', 'أرقام الطوارئ'], relation: ['Relation', 'صلة القرابة'],
    familyNote: ['Note shown to the family', 'ملاحظة تظهر للعائلة'], clinicalNotes: ['Clinical notes (staff only)', 'ملاحظات سريرية (للكادر فقط)'],
    save: ['Save', 'حفظ'], saved: ['Saved', 'تم الحفظ'], unsaved: ['Unsaved changes', 'تغييرات غير محفوظة'], readOnlyNurse: ['Nurses can edit contact details only.', 'الممرض يعدّل بيانات التواصل فقط.'],
    aura: ['Before', 'قبل'], ictal: ['During', 'أثناء'], postictal: ['After', 'بعد'], trigger: ['Triggers', 'المحفزات'], redflag: ['Red flags', 'علامات الخطر'],
    total: ['Total recorded', 'المجموع'], avgDur: ['Median duration', 'وسيط المدة'], withFlags: ['With red flags', 'مع علامات خطر'], weekly: ['Seizures per week (last 16 weeks)', 'النوبات أسبوعياً (آخر ١٦ أسبوعاً)'], longLegend: ['contains a seizure ≥5 min', 'تتضمن نوبة ≥٥ دقائق'],
    addEvent: ['Record a seizure', 'تسجيل نوبة'], when: ['When', 'الوقت'], durationMin: ['Duration (min)', 'المدة (دقيقة)'], kind: ['Kind', 'الشكل'], convulsive: ['Convulsive', 'تشنجية'], nonconvulsive: ['Non-convulsive', 'غير تشنجية'], family: ['Family', 'العائلة'], staffSrc: ['Staff', 'الكادر'], live: ['live guide', 'مرشد مباشر'], rescueGiven: ['Rescue med given', 'أُعطي دواء الإسعاف'], urgent: ['Red flags', 'علامات خطر'], video: ['Video', 'فيديو'], del: ['Delete', 'حذف'], confirmDel: ['Delete this entry?', 'حذف هذا السجل؟'], videoTaken: ['Video recorded on phone', 'فيديو محفوظ بالموبايل'],
    fvHint: ['Fine-tune what THIS family sees. "Default" follows the centre-wide setting shown in brackets.', 'تحكّم بما تراه هذه العائلة. "افتراضي" يتبع إعداد المركز الموضح بين القوسين.'], def: ['Default', 'افتراضي'], show: ['Show', 'إظهار'], hide: ['Hide', 'إخفاء'], shown: ['shown', 'ظاهر'], hidden: ['hidden', 'مخفي'],
    patientId: ['Patient ID', 'رقم المريض'], resetPw: ['Generate new password', 'توليد كلمة مرور جديدة'], newPw: ['New password', 'كلمة المرور الجديدة'], pwOnce: ['Write it down now — it is shown only once.', 'اكتبها الآن — تظهر مرة واحدة فقط.'], regenQr: ['Replace QR code', 'استبدال رمز QR'], regenConfirm: ['The old QR stops working and phones signed in with it are signed out. Continue?', 'الرمز القديم سيتوقف وستُسجَّل الأجهزة المرتبطة به خروجاً. متابعة؟'], printCard: ['Print family card', 'طباعة بطاقة العائلة'], copyLink: ['Copy sign-in link', 'نسخ رابط الدخول'], copied: ['Copied', 'تم النسخ'], qrHint: ['The family scans this with the phone camera: it opens نوبة already signed in. Keep it in the patient\'s file.', 'تمسحه العائلة بكاميرا الهاتف فيفتح تطبيق نوبة مسجّل الدخول مباشرة. يبقى في ملف المريض.'], deactivate: ['Deactivate patient', 'تعطيل المريض'], activate: ['Re-activate patient', 'إعادة تفعيل المريض'],
    created: ['Patient created', 'تم إنشاء المريض'], createdHint: ['Give the family these credentials, or let them scan the QR code.', 'أعطِ العائلة هذه البيانات أو دعهم يمسحون رمز QR.'], openPatient: ['Open patient file', 'فتح ملف المريض'],
    contentHint: ['Everything the app can ask families or teach them. Hide what your families are not yet trained to recognise, and unlock it after education. Changes apply to all patients (doctors can override per patient).', 'كل ما يمكن أن يسأله التطبيق للعائلات أو يعلّمه لهم. أخفِ ما لم تتدرّب عليه العائلات بعد، وافتحه بعد التثقيف. التغيير يشمل كل المرضى (ويمكن للطبيب التخصيص لكل مريض).'],
    staffOnlyCat: ['Clinician-only: used in the dossier, never asked to families. Families see the plain-language description.', 'للكادر فقط: يُستخدم في الملف ولا يُسأل للعائلة. تظهر للعائلة الصياغة المبسّطة.'],
    showBasic: ['Show basic only', 'إظهار الأساسي فقط'], showAll: ['Show all', 'إظهار الكل'], basic: ['basic', 'أساسي'], advanced: ['advanced', 'متقدم'], filterAll: ['All levels', 'كل المستويات'], source: ['Source', 'المصدر'], visibleCount: ['visible', 'ظاهر'],
    features: ['Features shown to families', 'الميزات الظاهرة للعائلات'], ambulance: ['Ambulance call button', 'زر الاتصال بالإسعاف'], ambulanceHint: ['When hidden, the app tells families to go to the nearest emergency department instead.', 'عند الإخفاء، يطلب التطبيق من العائلة الذهاب لأقرب طوارئ بدلاً من الاتصال.'], emergencyNumber: ['Emergency number', 'رقم الطوارئ'],
    videoRec: ['Video recording option', 'خيار تصوير النوبة'], videoHint: ['Families can film the seizure. By default the video stays on their phone.', 'تستطيع العائلة تصوير النوبة. افتراضياً يبقى الفيديو على هاتفهم.'], videoUpload: ['Upload videos to the server', 'رفع الفيديو إلى الخادم'], videoUploadHint: ['Uses server storage. Leave off while storage is limited.', 'يستهلك مساحة الخادم. اتركه مطفأً ما دامت المساحة محدودة.'], maxMb: ['Max video size (MB)', 'أقصى حجم للفيديو (ميغابايت)'], rescueAlert: ['Long-seizure alert after (min)', 'تنبيه النوبة الطويلة بعد (دقيقة)'], rescueAlertHint: ['ILAE status-epilepticus time point t1 = 5 min for tonic–clonic seizures. A patient\'s own rescue plan time overrides this.', 'نقطة ILAE الزمنية t1 = ٥ دقائق للنوبات التوترية-الرمعية. وقت خطة الإسعاف الخاصة بالمريض يتقدّم على هذا.'],
    centre: ['Centre', 'المركز'], centreAr: ['Centre name (Arabic)', 'اسم المركز (عربي)'], centreEn: ['Centre name (English)', 'اسم المركز (إنجليزي)'], publicUrl: ['Public address used in QR codes', 'العنوان العام المستخدم في رموز QR'], publicUrlHint: ['e.g. https://nawba.example.iq — leave blank to use the address you are browsing on. Owner only.', 'مثال: https://nawba.example.iq — اتركه فارغاً لاستخدام العنوان الحالي. للمالك فقط.'],
    addStaff: ['Add staff member', 'إضافة عضو كادر'], role: ['Role', 'الصلاحية'], tempPw: ['Temporary password (min 8)', 'كلمة مرور مؤقتة (٨ على الأقل)'], enable: ['Enable', 'تفعيل'], disable: ['Disable', 'تعطيل'], resetStaffPw: ['Reset password', 'إعادة تعيين كلمة المرور'], promptPw: ['New password (min 8 characters):', 'كلمة المرور الجديدة (٨ أحرف على الأقل):'], usernameTaken: ['Username already taken.', 'اسم المستخدم مستخدم مسبقاً.'],
    rolesTitle: ['What each role can do', 'صلاحيات كل دور'],
    rolesHelp: [
      '<b>Owner</b> — everything, including creating admins and the QR public address.<br><b>Admin</b> — manages doctors & nurses, centre-wide question/education visibility and feature switches, deactivates patients, sees the activity log.<br><b>Doctor</b> — creates patients, edits the full dossier, per-family visibility, replaces QR codes, deletes diary entries.<br><b>Nurse</b> — views patients, shows/prints QR, resets family passwords, records seizures, edits contact details.',
      '<b>المالك</b> — كل الصلاحيات، ومنها إنشاء المدراء وعنوان QR العام.<br><b>المدير</b> — يدير الأطباء والممرضين، وإظهار الأسئلة والتثقيف على مستوى المركز، ومفاتيح الميزات، وتعطيل المرضى، وسجل النشاط.<br><b>الطبيب</b> — ينشئ المرضى، ويعدّل الملف كاملاً، ويخصّص ما تراه كل عائلة، ويستبدل رموز QR، ويحذف السجلات.<br><b>الممرض</b> — يطّلع على المرضى، ويعرض/يطبع رمز QR، ويعيد تعيين كلمة مرور العائلة، ويسجّل النوبات، ويعدّل بيانات التواصل.'],
    at: ['Time', 'الوقت'], who: ['Who', 'من'], action: ['Action', 'الإجراء'], target: ['Target', 'الهدف'],
    language: ['Language', 'اللغة'], changePw: ['Change password', 'تغيير كلمة المرور'], oldPw: ['Current password', 'كلمة المرور الحالية'], badOld: ['Current password is wrong.', 'كلمة المرور الحالية خاطئة.'], weak: ['At least 8 characters.', '٨ أحرف على الأقل.'],
    theme: ['Theme', 'المظهر'], error: ['Something went wrong.', 'حدث خطأ.'], forbidden: ['You do not have permission for this.', 'ليست لديك صلاحية لهذا.'], minutes: ['min', 'د'], cancel: ['Cancel', 'إلغاء'], close: ['Close', 'إغلاق'], none: ['—', '—']
  };
  let lang = store.get('lang', 'ar');
  const t = (k) => (T[k] ? T[k][lang === 'en' ? 0 : 1] : k);
  const iname = (it) => it ? (lang === 'en' ? it.en : it.ar) : '';
  const fmtN = (n) => new Intl.NumberFormat(lang === 'en' ? 'en' : 'ar-IQ').format(n);
  const fmtDT = (ms) => ms ? new Date(ms).toLocaleString(lang === 'en' ? 'en-GB' : 'ar-IQ', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDur = (s) => s == null ? '—' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const GOVS = ['Baghdad|بغداد', 'Basra|البصرة', 'Nineveh|نينوى', 'Erbil|أربيل', 'Sulaymaniyah|السليمانية', 'Duhok|دهوك', 'Kirkuk|كركوك', 'Anbar|الأنبار', 'Diyala|ديالى', 'Salah al-Din|صلاح الدين', 'Babylon|بابل', 'Karbala|كربلاء', 'Najaf|النجف', 'Wasit|واسط', 'Qadisiyyah|القادسية', 'Maysan|ميسان', 'Dhi Qar|ذي قار', 'Muthanna|المثنى', 'Halabja|حلبجة'];
  const LEVEL = { nurse: 1, doctor: 2, admin: 3, owner: 4 };

  // ---------------- state ----------------
  const API = (window.NAWBA_API || '').replace(/\/+$/, '');
  let token = store.get('token', '');
  let ME = null, CAT = null, SETTINGS = null;
  const can = (role) => ME && LEVEL[ME.role] >= LEVEL[role];

  async function api(path, opts = {}) {
    const res = await fetch(API + path, { method: opts.method || 'GET', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: opts.body ? JSON.stringify(opts.body) : undefined });
    if (res.status === 401 && !opts.public) { token = ''; store.set('token', ''); ME = null; boot(); throw new Error('auth'); }
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(d.error || 'error'); e.status = res.status; throw e; }
    return d;
  }
  function toast(msg) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; document.body.appendChild(el); setTimeout(() => el.remove(), 2600); }
  function errMsg(e) { return e.status === 403 ? t('forbidden') : e.message === 'username_taken' ? t('usernameTaken') : e.message === 'weak_password' ? t('weak') : t('error'); }
  function modal(html, onMount) {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    bg.addEventListener('click', (e) => { if (e.target === bg || e.target.closest('[data-close]')) bg.remove(); });
    document.body.appendChild(bg); onMount && onMount(bg); return bg;
  }
  function applyLang() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.title = `${t('appName')} — ${t('console')}`;
  }
  function setTheme(v) { if (v) document.documentElement.dataset.theme = v; else delete document.documentElement.dataset.theme; store.set('theme', v || ''); }
  setTheme(store.get('theme', ''));

  // ---------------- auth screens ----------------
  function authShell(inner) {
    document.body.innerHTML = `<div class="auth"><div class="box">
      <div class="brand">${I.logo}<div><b>${t('appName')}</b><div class="muted small">${t('console')}</div></div></div>
      ${inner}
      <div style="display:flex;justify-content:space-between;margin-top:16px" class="small"><a href="#" id="lang-sw">${lang === 'en' ? 'العربية' : 'English'}</a><a href="../app/">/app</a></div>
    </div></div>`;
    $('#lang-sw').onclick = (e) => { e.preventDefault(); lang = lang === 'en' ? 'ar' : 'en'; store.set('lang', lang); boot(); };
  }
  function setupScreen() {
    authShell(`<h2 style="margin:14px 0 4px;font-size:19px">${t('setupTitle')}</h2><p class="muted small">${t('setupHint')}</p>
      <form id="f"><div id="e"></div>
        <label class="f">${t('fullName')}<input type="text" name="name" required></label>
        <label class="f">${t('username')}<input type="text" name="username" class="ltr" required autocomplete="username"></label>
        <label class="f">${t('password')}<input type="password" name="password" minlength="8" required autocomplete="new-password"></label>
        <button class="btn" type="submit">${t('create')}</button></form>`);
    $('#f').onsubmit = async (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
      try { await api('/api/setup', { method: 'POST', body: { ...f, lang }, public: true }); loginScreen(); }
      catch (er) { $('#e').innerHTML = `<div class="err">${errMsg(er)}</div>`; }
    };
  }
  function loginScreen(msg = '') {
    authShell(`<form id="f">${msg ? `<div class="err">${esc(msg)}</div>` : ''}
      <label class="f">${t('username')}<input type="text" name="username" class="ltr" required autocomplete="username" autofocus></label>
      <label class="f">${t('password')}<input type="password" name="password" required autocomplete="current-password"></label>
      <button class="btn" type="submit">${t('login')}</button></form>`);
    $('#f').onsubmit = async (e) => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
      try {
        const r = await api('/api/staff/login', { method: 'POST', body: f, public: true });
        token = r.token; store.set('token', token);
        if (r.user.lang && !store.get('langChosen', false)) { lang = r.user.lang; store.set('lang', lang); }
        boot();
      } catch (er) { loginScreen(er.message === 'throttled' ? t('throttled') : t('badLogin')); }
    };
  }

  // ---------------- shell ----------------
  const NAV = [
    ['dashboard', '#/', I.sun, 'nurse'], ['patients', '#/patients', I.people, 'nurse'], ['content', '#/content', I.book, 'nurse'],
    ['settings', '#/settings', I.edit, 'nurse'], ['staff', '#/staff', I.user, 'admin'], ['audit', '#/audit', I.list, 'admin'], ['account', '#/account', I.heart, 'nurse']
  ];
  function shell() {
    document.body.innerHTML = `
      <div class="mobile-top"><button id="burger" aria-label="menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><b>${t('appName')}</b></div>
      <div class="shell">
        <aside class="rail" id="rail">
          <div class="brand">${I.logo}<div><b>${t('appName')}</b><small>${esc((SETTINGS?.centerName || {})[lang === 'en' ? 'en' : 'ar'] || t('console'))}</small></div></div>
          <div class="chev"></div>
          <nav class="nav">${NAV.filter(n => can(n[3])).map(n => `<a href="${n[1]}" data-nav="${n[0]}">${n[2]}<span>${t(n[0])}</span></a>`).join('')}</nav>
          <div class="me"><b>${esc(ME.name)}</b><span class="role-tag">${t(ME.role)}</span>
            <div class="row"><button id="lang-sw">${lang === 'en' ? 'العربية' : 'English'}</button><button id="theme-sw" aria-label="${t('theme')}">◐</button><button id="out">${t('logout')}</button></div></div>
        </aside>
        <main id="main"></main>
      </div>`;
    $('#burger').onclick = () => $('#rail').classList.toggle('open');
    $('#lang-sw').onclick = async () => { lang = lang === 'en' ? 'ar' : 'en'; store.set('lang', lang); store.set('langChosen', true); api('/api/staff/me', { method: 'POST', body: { lang } }).catch(() => {}); applyLang(); shell(); route(); };
    $('#theme-sw').onclick = () => { const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); setTheme(cur === 'dark' ? 'light' : 'dark'); };
    $('#out').onclick = async () => { await api('/api/staff/logout', { method: 'POST' }).catch(() => {}); token = ''; store.set('token', ''); boot(); };
  }
  const main = () => $('#main');
  function setNav(k) { $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === k)); $('#rail')?.classList.remove('open'); }
  function head(title, sub = '', actions = '', crumbs = '') {
    return `${crumbs ? `<div class="crumbs">${crumbs}</div>` : ''}<div class="page-head"><h1>${title}${sub ? `<small>${sub}</small>` : ''}</h1><div class="btn-group">${actions}</div></div>`;
  }

  // ---------------- routing ----------------
  addEventListener('hashchange', () => ME && route());
  let dirty = false;
  addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  async function route() {
    if (dirty && !confirm(t('unsaved') + ' — ' + (lang === 'en' ? 'leave anyway?' : 'المغادرة على أي حال؟'))) return;
    dirty = false;
    const h = location.hash.replace(/^#/, '') || '/';
    const parts = h.split('/').filter(Boolean);
    try {
      if (!parts.length) return dashboard();
      if (parts[0] === 'patients' && parts[1] === 'new') return newPatient();
      if (parts[0] === 'patients') return patientsList();
      if (parts[0] === 'patient') return patientPage(parts[1], parts[2] || 'dossier');
      if (parts[0] === 'content') return contentPage();
      if (parts[0] === 'settings') return settingsPage();
      if (parts[0] === 'staff') return staffPage();
      if (parts[0] === 'audit') return auditPage();
      if (parts[0] === 'account') return accountPage();
      dashboard();
    } catch (e) { if (e.message !== 'auth') main().innerHTML = `<div class="err">${errMsg(e)}</div>`; }
  }

  // ---------------- dashboard ----------------
  async function dashboard() {
    setNav('dashboard');
    const s = await api('/api/stats');
    main().innerHTML = head(t('dashboard'), esc((SETTINGS.centerName || {})[lang === 'en' ? 'en' : 'ar'] || ''), can('doctor') ? `<a class="btn" href="#/patients/new">${I.plus}${t('newPatient')}</a>` : '') + `
      <div class="stats">
        <div class="stat"><span>${t('activePatients')}</span><b>${fmtN(s.patients)}</b></div>
        <div class="stat"><span>${t('ev7')}</span><b>${fmtN(s.events7)}</b></div>
        <div class="stat"><span>${t('ev30')}</span><b>${fmtN(s.events30)}</b></div>
        <div class="stat clay"><span>${t('long30')}</span><b>${fmtN(s.long30)}</b></div>
      </div>
      <div class="panel"><h2>${t('recentEvents')}</h2>
        ${s.recent.length ? `<div class="table-wrap"><table><thead><tr><th>${t('when')}</th><th>${t('name')}</th><th>${t('id')}</th><th>${t('durationMin')}</th><th></th></tr></thead><tbody>
        ${s.recent.map(r => `<tr class="click" data-href="#/patient/${r.pid}/diary"><td>${fmtDT(r.started_at)}</td><td>${esc(r.name)}</td><td class="n ltr">${esc(r.code)}</td><td class="n">${fmtDur(r.duration_sec)}</td>
          <td>${r.data.urgent ? `<span class="tag c">${t('urgent')}</span>` : ''}${r.data.rescueGiven ? `<span class="tag s">${t('rescueGiven')}</span>` : ''}${r.duration_sec >= 300 ? '<span class="tag c">≥5′</span>' : ''}</td></tr>`).join('')}
        </tbody></table></div>` : `<div class="empty">${t('noEvents')}</div>`}
      </div>`;
    bindRowLinks();
  }
  function bindRowLinks() { $$('tr[data-href]').forEach(tr => tr.onclick = () => (location.hash = tr.dataset.href)); }

  // ---------------- patients ----------------
  async function patientsList() {
    setNav('patients');
    main().innerHTML = head(t('patients'), '', can('doctor') ? `<a class="btn" href="#/patients/new">${I.plus}${t('newPatient')}</a>` : '') +
      `<div class="panel"><input type="search" id="q" placeholder="${t('search')}" style="max-width:360px;margin-bottom:12px"><div id="list"></div></div>`;
    let timer;
    const load = async () => {
      const rows = await api('/api/patients?q=' + encodeURIComponent($('#q').value));
      $('#list').innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>${t('name')}</th><th>${t('id')}</th><th>${t('seizureTypes')}</th><th>${t('last30')}</th><th>${t('lastEvent')}</th><th>${t('status')}</th></tr></thead><tbody>
        ${rows.map(p => `<tr class="click" data-href="#/patient/${p.id}"><td><b>${esc(p.name)}</b>${p.data.guardian ? `<div class="muted small">${esc(p.data.guardian)}</div>` : ''}</td><td class="n ltr">${esc(p.code)}</td>
          <td>${(p.data.seizures || []).map(s => `<span class="tag t">${esc(s.typeId || '?')}</span>`).join('')}</td>
          <td class="n">${p.ev30 ? `<b>${fmtN(p.ev30)}</b>` : '<span class="muted">0</span>'}</td><td class="small">${fmtDT(p.last_event)}</td>
          <td>${p.active ? `<span class="tag r">${t('active')}</span>` : `<span class="tag">${t('inactive')}</span>`}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${t('noPatients')}</div>`;
      bindRowLinks();
    };
    $('#q').oninput = () => { clearTimeout(timer); timer = setTimeout(load, 220); };
    load();
  }

  async function newPatient() {
    setNav('patients');
    if (!can('doctor')) return (main().innerHTML = `<div class="err">${t('forbidden')}</div>`);
    main().innerHTML = head(t('newPatient'), '', '', `<a href="#/patients">${t('patients')}</a>`) + `
      <form class="panel stamp" id="f" style="max-width:720px"><div class="grid g2">
        <label class="f span2">${t('fullName')} *<input type="text" name="name" required></label>
        <label class="f">${t('dob')}<input type="date" name="dob"></label>
        <label class="f">${t('sex')}<select name="sex"><option value="">${t('choose')}</option><option value="m">${t('male')}</option><option value="f">${t('female')}</option></select></label>
        <label class="f">${t('guardian')}<input type="text" name="guardian"></label>
        <label class="f">${t('phone')}<input type="tel" name="phone" class="ltr"></label>
        <label class="f">${t('governorate')}<select name="governorate"><option value="">${t('choose')}</option>${GOVS.map(g => { const [en, ar] = g.split('|'); return `<option value="${en}">${lang === 'en' ? en : ar}</option>`; }).join('')}</select></label>
        <label class="f">${t('treatingDoctor')}<input type="text" name="doctor" value="${ME.role === 'doctor' ? esc(ME.name) : ''}"></label>
      </div><div style="margin-top:16px"><button class="btn" type="submit">${I.plus}${t('create')}</button></div></form>`;
    $('#f').onsubmit = async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target)); const name = f.name; delete f.name;
      try {
        const r = await api('/api/patients', { method: 'POST', body: { name, data: f } });
        location.hash = `#/patient/${r.id}/access`;
        setTimeout(() => credentialsModal(r.code, r.password, r.id, true), 150);
      } catch (er) { toast(errMsg(er)); }
    };
  }
  function credentialsModal(code, pw, id, isNew) {
    modal(`<h2>${isNew ? t('created') : t('newPw')}</h2><p class="muted">${isNew ? t('createdHint') : ''}</p>
      <div class="grid g2" style="margin:12px 0"><div><div class="muted small">${t('patientId')}</div><span class="cred">${esc(code)}</span></div>
      <div><div class="muted small">${t('password')}</div><span class="cred">${esc(pw)}</span></div></div>
      <div class="note">${t('pwOnce')}</div>
      <div class="btn-group" style="margin-top:16px"><button class="btn" data-close>${t('close')}</button>${isNew ? `<button class="btn ghost" id="pc">${t('printCard')}</button>` : ''}</div>`,
      (bg) => { const pc = $('#pc', bg); if (pc) pc.onclick = () => printCard(id, pw); });
  }

  // ---------------- patient page ----------------
  async function patientPage(id, tab) {
    setNav('patients');
    if (!CAT) CAT = await api('/api/catalog');
    const p = await api('/api/patients/' + id);
    const tabs = [['dossier', t('dossier')], ['diary', t('diary')], ['family', t('familyView')], ['access', t('access')]];
    main().innerHTML = head(esc(p.name), `<span class="ltr num">${esc(p.code)}</span>${p.active ? '' : ` · <span class="tag">${t('inactive')}</span>`}`, '', `<a href="#/patients">${t('patients')}</a>`) +
      `<nav class="tabs">${tabs.map(([k, l]) => `<a href="#/patient/${id}/${k}" class="${tab === k ? 'on' : ''}">${l}</a>`).join('')}</nav><div id="tab"></div>`;
    if (tab === 'diary') return diaryTab(p);
    if (tab === 'family') return familyTab(p);
    if (tab === 'access') return accessTab(p);
    return dossierTab(p);
  }
  const itemsOf = (cat) => CAT.items.filter(i => i.cat === cat);

  // ---- dossier ----
  function dossierTab(p) {
    const d = structuredClone(p.data);
    d.seizures ||= []; d.meds ||= []; d.contacts ||= []; d.etiology ||= []; d.rescue ||= { enabled: false, route: 'buccal', afterMin: 5 };
    const full = can('doctor');
    const nurseOK = ['guardian', 'phone', 'phone2', 'governorate', 'address', 'contacts'];
    const dis = (field) => (!full && !nurseOK.includes(field)) ? 'disabled' : '';
    const typeOptions = () => {
      const groups = {};
      itemsOf('seizure_type').forEach(i => (groups[i.group] ||= []).push(i));
      return Object.entries(groups).map(([g, list]) => `<optgroup label="${esc(g)}">${list.map(i => `<option value="${i.id}">${esc(iname(i))}</option>`).join('')}</optgroup>`).join('');
    };
    const chipset = (arr, cat, si) => `<div class="chipset">${itemsOf(cat).map(i => `<button type="button" class="${arr.includes(i.id) ? 'on' : ''}" data-chip="${si}|${cat}|${i.id}" ${full ? '' : 'disabled'} title="${esc(i.lay)}">${esc(iname(i))}${i.lvl === 'advanced' ? `<span class="lvl">●</span>` : ''}</button>`).join('')}</div>`;
    const catKey = { aura: 'aura', ictal: 'ictal', postictal: 'postictal', trigger: 'triggers' };

    const render = () => {
      $('#tab').innerHTML = `
      ${!full ? `<div class="note" style="margin-bottom:14px">${t('readOnlyNurse')}</div>` : ''}
      <div class="panel"><h2>${t('identity')}</h2><div class="grid g3">
        <label class="f">${t('fullName')}<input type="text" data-k="__name" value="${esc(p.name)}" ${full ? '' : 'disabled'}></label>
        <label class="f">${t('dob')}<input type="date" data-k="dob" value="${esc(d.dob || '')}" ${dis('dob')}></label>
        <label class="f">${t('sex')}<select data-k="sex" ${dis('sex')}><option value="">${t('choose')}</option><option value="m" ${d.sex === 'm' ? 'selected' : ''}>${t('male')}</option><option value="f" ${d.sex === 'f' ? 'selected' : ''}>${t('female')}</option></select></label>
        <label class="f">${t('guardian')}<input type="text" data-k="guardian" value="${esc(d.guardian || '')}"></label>
        <label class="f">${t('phone')}<input type="tel" class="ltr" data-k="phone" value="${esc(d.phone || '')}"></label>
        <label class="f">${t('governorate')}<select data-k="governorate"><option value="">${t('choose')}</option>${GOVS.map(g => { const [en, ar] = g.split('|'); return `<option value="${en}" ${d.governorate === en ? 'selected' : ''}>${lang === 'en' ? en : ar}</option>`; }).join('')}</select></label>
        <label class="f">${t('mrn')}<input type="text" class="ltr" data-k="mrn" value="${esc(d.mrn || '')}" ${dis('mrn')}></label>
        <label class="f">${t('treatingDoctor')}<input type="text" data-k="doctor" value="${esc(d.doctor || '')}" ${dis('doctor')}></label>
      </div></div>

      <div class="panel"><h2>${t('diagnosis')}</h2><div class="grid g2">
        <label class="f">${t('epilepsyType')}<select data-k="epilepsyType" ${dis('x')}><option value="">${t('choose')}</option>${['focal', 'generalized', 'combined', 'unknown'].map(k => `<option value="${k}" ${d.epilepsyType === k ? 'selected' : ''}>${t(k)}</option>`).join('')}</select></label>
        <label class="f">${t('syndrome')}<input type="text" data-k="syndrome" value="${esc(d.syndrome || '')}" ${dis('x')}></label>
        <div class="span2"><div class="muted small" style="margin-bottom:6px">${t('etiology')}</div><div class="chipset">${['structural', 'genetic', 'infectious', 'metabolic', 'immune', 'unknown'].map(k => `<button type="button" class="${d.etiology.includes(k) ? 'on' : ''}" data-etio="${k}" ${full ? '' : 'disabled'}>${t(k)}</button>`).join('')}</div></div>
        <label class="f">${t('comorbid')}<input type="text" data-k="comorbidities" value="${esc(d.comorbidities || '')}" ${dis('x')}></label>
        <label class="f">${t('allergies')}<input type="text" data-k="allergies" value="${esc(d.allergies || '')}" ${dis('x')}></label>
      </div></div>

      <div class="panel"><h2>${t('seizureTypes')} <span class="hint">ILAE 2025</span></h2>
        ${d.seizures.map((s, si) => `<div class="sz-card">
          <div class="head"><b>${t('seizureN')} ${si + 1}</b>${full ? `<button type="button" class="btn ghost sm" data-del-sz="${si}">${t('remove')}</button>` : ''}</div>
          <div class="grid g4">
            <label class="f span2">${t('ilaeType')}<select data-sz="${si}|typeId" ${dis('x')}><option value="">${t('choose')}</option>${typeOptions()}</select></label>
            <label class="f">${t('nickname')}<input type="text" data-sz="${si}|nickname" value="${esc(s.nickname || '')}" ${dis('x')}></label>
            <label class="f">${t('typDuration')}<input type="text" data-sz="${si}|duration" value="${esc(s.duration || '')}" placeholder="1–2 ${t('minutes')}" ${dis('x')}></label>
            <label class="f">${t('frequency')}<input type="number" min="0" data-sz="${si}|freqCount" value="${esc(s.freqCount || '')}" ${dis('x')}></label>
            <label class="f">${t('per')}<select data-sz="${si}|freqPer" ${dis('x')}>${['day', 'week', 'month', 'year'].map(k => `<option value="${k}" ${s.freqPer === k ? 'selected' : ''}>${t(k)}</option>`).join('')}</select></label>
          </div>
          ${s.typeId ? `<p class="small muted" style="margin:8px 0 0">↳ ${lang === 'en' ? 'Family sees' : 'تراه العائلة'}: «${esc(CAT.items.find(i => i.id === s.typeId)?.lay || '')}»</p>` : ''}
          ${['aura', 'ictal', 'postictal', 'trigger'].map(c => `<h3>${t(c)}</h3>${chipset(s[catKey[c]] || [], c, si)}`).join('')}
          <label class="f" style="margin-top:12px">${t('notes')}<input type="text" data-sz="${si}|notes" value="${esc(s.notes || '')}" ${dis('x')}></label>
        </div>`).join('')}
        ${full ? `<button type="button" class="btn ghost" id="add-sz">${I.plus}${t('addSeizure')}</button>` : ''}
      </div>

      <div class="grid g2">
        <div class="panel"><h2>${t('meds')}</h2>
          ${d.meds.map((m, i) => `<div class="repeat-row"><input type="text" placeholder="${t('drug')}" data-row="meds|${i}|name" value="${esc(m.name || '')}" ${dis('x')}><input type="text" placeholder="${t('dose')}" data-row="meds|${i}|dose" value="${esc(m.dose || '')}" ${dis('x')}><input type="text" placeholder="${t('schedule')}" data-row="meds|${i}|schedule" value="${esc(m.schedule || '')}" ${dis('x')}>${full ? `<button type="button" class="btn ghost sm" data-del-row="meds|${i}">✕</button>` : '<span></span>'}</div>`).join('')}
          ${full ? `<button type="button" class="btn ghost sm" data-add-row="meds">${I.plus}${t('add')}</button>` : ''}
        </div>
        <div class="panel"><h2>${t('rescue')}</h2>
          <label class="f inline"><span class="sw"><input type="checkbox" data-rescue="enabled" ${d.rescue.enabled ? 'checked' : ''} ${dis('x')}><i></i></span>${t('rescueOn')}</label>
          <div class="grid g2" style="margin-top:10px" ${d.rescue.enabled ? '' : 'hidden'}>
            <label class="f">${t('drug')}<input type="text" data-rescue="drug" value="${esc(d.rescue.drug || '')}" placeholder="Midazolam" ${dis('x')}></label>
            <label class="f">${t('dose')}<input type="text" data-rescue="dose" value="${esc(d.rescue.dose || '')}" placeholder="5 mg" ${dis('x')}></label>
            <label class="f">${t('route')}<select data-rescue="route" ${dis('x')}>${[['buccal', 'بين الخد واللثة (بالفم)'], ['nasal', 'بالأنف'], ['rectal', 'شرجي']].map(([k, ar]) => `<option value="${ar}" ${d.rescue.route === ar ? 'selected' : ''}>${t(k)}</option>`).join('')}</select></label>
            <label class="f">${t('giveAfter')}<input type="number" min="1" max="30" data-rescue="afterMin" value="${esc(d.rescue.afterMin || 5)}" ${dis('x')}></label>
            <label class="f span2">${t('notes')} (${lang === 'en' ? 'shown to family, Arabic' : 'تظهر للعائلة'})<input type="text" data-rescue="notes" value="${esc(d.rescue.notes || '')}" ${dis('x')}></label>
          </div>
        </div>
      </div>

      <div class="panel"><h2>${t('contacts')}</h2>
        ${d.contacts.map((c, i) => `<div class="repeat-row c4"><input type="text" placeholder="${t('name')}" data-row="contacts|${i}|name" value="${esc(c.name || '')}"><input type="text" placeholder="${t('relation')}" data-row="contacts|${i}|relation" value="${esc(c.relation || '')}"><input type="tel" class="ltr" placeholder="${t('phone')}" data-row="contacts|${i}|phone" value="${esc(c.phone || '')}"><button type="button" class="btn ghost sm" data-del-row="contacts|${i}">✕</button></div>`).join('')}
        <button type="button" class="btn ghost sm" data-add-row="contacts">${I.plus}${t('add')}</button>
      </div>

      <div class="grid g2">
        <label class="panel f">${t('familyNote')}<textarea data-k="familyNote" ${dis('x')} dir="rtl">${esc(d.familyNote || '')}</textarea></label>
        <label class="panel f">${t('clinicalNotes')}<textarea data-k="clinicalNotes" ${dis('x')}>${esc(d.clinicalNotes || '')}</textarea></label>
      </div>
      <div class="save-bar"><span class="muted" id="dirty-l"></span><button class="btn" id="save">${t('save')}</button></div>`;
      d.seizures.forEach((s, si) => { const sel = $(`[data-sz="${si}|typeId"]`); if (sel) sel.value = s.typeId || ''; });
      bind();
    };
    let name = p.name;
    const markDirty = () => { dirty = true; $('#dirty-l').textContent = t('unsaved'); };
    const bind = () => {
      const tab = $('#tab');
      tab.oninput = tab.onchange = (e) => {
        const el = e.target;
        if (el.dataset.k) { if (el.dataset.k === '__name') name = el.value; else d[el.dataset.k] = el.value; markDirty(); }
        else if (el.dataset.sz) { const [si, k] = el.dataset.sz.split('|'); d.seizures[si][k] = el.value; markDirty(); if (k === 'typeId' && e.type === 'change') render(); }
        else if (el.dataset.row) { const [list, i, k] = el.dataset.row.split('|'); d[list][i][k] = el.value; markDirty(); }
        else if (el.dataset.rescue) { const k = el.dataset.rescue; d.rescue[k] = el.type === 'checkbox' ? el.checked : el.value; markDirty(); if (k === 'enabled' && e.type === 'change') render(); }
      };
      tab.onclick = (e) => {
        const b = e.target.closest('button'); if (!b || b.disabled) return;
        if (b.dataset.chip) { const [si, c, id] = b.dataset.chip.split('|'); const k = catKey[c]; const arr = (d.seizures[si][k] ||= []); const ix = arr.indexOf(id); ix >= 0 ? arr.splice(ix, 1) : arr.push(id); b.classList.toggle('on'); markDirty(); }
        else if (b.dataset.etio) { const k = b.dataset.etio, ix = d.etiology.indexOf(k); ix >= 0 ? d.etiology.splice(ix, 1) : d.etiology.push(k); b.classList.toggle('on'); markDirty(); }
        else if (b.id === 'add-sz') { d.seizures.push({ freqPer: 'month', aura: [], ictal: [], postictal: [], triggers: [] }); markDirty(); render(); }
        else if (b.dataset.delSz != null) { if (confirm(t('confirmDel'))) { d.seizures.splice(+b.dataset.delSz, 1); markDirty(); render(); } }
        else if (b.dataset.addRow) { d[b.dataset.addRow].push({}); markDirty(); render(); }
        else if (b.dataset.delRow) { const [l, i] = b.dataset.delRow.split('|'); d[l].splice(+i, 1); markDirty(); render(); }
        else if (b.id === 'save') save();
      };
    };
    const save = async () => {
      try {
        await api('/api/patients/' + p.id, { method: 'PUT', body: { name, data: d } });
        dirty = false; $('#dirty-l').textContent = t('saved'); toast(t('saved'));
        p.name = name; $('.page-head h1').firstChild.textContent = name;
      } catch (er) { toast(errMsg(er)); }
    };
    render();
  }

  // ---- diary ----
  async function diaryTab(p) {
    const evs = await api(`/api/patients/${p.id}/events`);
    const byId = Object.fromEntries(CAT.items.map(i => [i.id, i]));
    // 16-week chart
    const WEEK = 7 * 864e5, now = Date.now(), weeks = 16;
    const buckets = Array.from({ length: weeks }, () => ({ n: 0, long: false }));
    evs.forEach(e => { const w = Math.floor((now - e.started_at) / WEEK); if (w >= 0 && w < weeks) { const b = buckets[weeks - 1 - w]; b.n++; if (e.duration_sec >= 300) b.long = true; } });
    const max = Math.max(4, ...buckets.map(b => b.n));
    const W = 640, H = 170, bw = W / weeks;
    const bars = buckets.map((b, i) => { const h = (b.n / max) * (H - 30); return `<rect class="bar ${b.long ? 'long' : ''}" x="${i * bw + 5}" y="${H - 18 - h}" width="${bw - 10}" height="${Math.max(h, b.n ? 2 : 0)}" rx="3"/>${b.n ? `<text x="${i * bw + bw / 2}" y="${H - 22 - h}" text-anchor="middle">${b.n}</text>` : ''}`; }).join('');
    const ticks = buckets.map((_, i) => i % 4 === 3 ? `<text x="${i * bw + bw / 2}" y="${H - 4}" text-anchor="middle">${i === weeks - 1 ? (lang === 'en' ? 'this wk' : 'هذا الأسبوع') : `-${weeks - 1 - i}`}</text>` : '').join('');
    const durs = evs.map(e => e.duration_sec).filter(x => x != null).sort((a, b) => a - b);
    const median = durs.length ? durs[Math.floor(durs.length / 2)] : null;
    const flagged = evs.filter(e => e.data.urgent).length;
    const last30 = evs.filter(e => e.started_at > now - 30 * 864e5).length;
    const chips = (ids, cls) => (ids || []).map(id => `<span class="tag ${cls}" title="${esc(byId[id]?.lay || '')}">${esc(iname(byId[id]) || id)}</span>`).join('');
    $('#tab').innerHTML = `
      <div class="stats">
        <div class="stat"><span>${t('total')}</span><b>${fmtN(evs.length)}</b></div>
        <div class="stat"><span>${t('last30')}</span><b>${fmtN(last30)}</b></div>
        <div class="stat"><span>${t('avgDur')}</span><b>${fmtDur(median)}</b></div>
        <div class="stat clay"><span>${t('withFlags')}</span><b>${fmtN(flagged)}</b></div>
      </div>
      <div class="panel chart"><h2>${t('weekly')}</h2><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('weekly')}" style="direction:ltr">
        <line class="grid-l" x1="0" x2="${W}" y1="${H - 18}" y2="${H - 18}"/>${bars}${ticks}</svg>
        <div class="legend"><span><i style="background:var(--tigris)"></i>${t('diary')}</span><span><i style="background:var(--clay)"></i>${t('longLegend')}</span></div></div>
      <div class="panel"><h2>${t('diary')}<span style="flex:1"></span><button class="btn sm" id="add-ev">${I.plus}${t('addEvent')}</button></h2>
        ${evs.length ? evs.map(e => `<div class="ev">
          <div class="ev-head"><b>${fmtDT(e.started_at)}</b><span class="tag ${e.duration_sec >= 300 ? 'c' : 't'} num">${fmtDur(e.duration_sec)}</span>
            ${e.data.kind ? `<span class="tag">${t(e.data.kind)}</span>` : ''}<span class="tag">${e.source === 'family' ? t('family') + (e.data.mode === 'live' ? ' · ' + t('live') : '') : t('staffSrc')}</span>
            ${e.data.urgent ? `<span class="tag c">${t('urgent')}</span>` : ''}${e.data.rescueGiven ? `<span class="tag s">${t('rescueGiven')}${e.data.rescueAfterSec ? ' @' + fmtDur(e.data.rescueAfterSec) : ''}</span>` : ''}
            ${e.video ? `<a class="tag t" href="${API}/api/events/${e.id}/video?t=${encodeURIComponent(token)}" target="_blank">▶ ${t('video')}</a>` : e.data.videoTaken ? `<span class="tag">${t('videoTaken')}</span>` : ''}
            <span style="flex:1"></span>${can('doctor') ? `<button class="btn ghost sm" data-del-ev="${e.id}">${t('del')}</button>` : ''}</div>
          <div class="ev-body">
            ${e.data.redflags && Object.values(e.data.redflags).some(Boolean) ? `<div><span class="k">${t('redflag')}</span>${chips(Object.keys(e.data.redflags).filter(k => e.data.redflags[k]), 'c')}</div>` : ''}
            ${e.data.aura?.length ? `<div><span class="k">${t('aura')}</span>${chips(e.data.aura, 's')}</div>` : ''}
            ${e.data.ictal?.length ? `<div><span class="k">${t('ictal')}</span>${chips(e.data.ictal, 't')}</div>` : ''}
            ${e.data.postictal?.length ? `<div><span class="k">${t('postictal')}</span>${chips(e.data.postictal, '')}</div>` : ''}
            ${e.data.trigger?.length ? `<div><span class="k">${t('trigger')}</span>${chips(e.data.trigger, 'r')}</div>` : ''}
            ${e.data.notes ? `<div><span class="k">${t('notes')}</span>${esc(e.data.notes)}</div>` : ''}
          </div></div>`).join('') : `<div class="empty">${t('noEvents')}</div>`}
      </div>`;
    $$('[data-del-ev]').forEach(b => b.onclick = async () => { if (!confirm(t('confirmDel'))) return; await api('/api/events/' + b.dataset.delEv, { method: 'DELETE' }); diaryTab(p); });
    $('#add-ev').onclick = () => {
      const local = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
      modal(`<h2>${t('addEvent')}</h2><form id="ef" class="grid g2">
        <label class="f">${t('when')}<input type="datetime-local" name="when" value="${local}" required></label>
        <label class="f">${t('durationMin')}<input type="number" step="0.5" min="0" name="dur"></label>
        <label class="f span2">${t('kind')}<select name="kind"><option value="convulsive">${t('convulsive')}</option><option value="nonconvulsive">${t('nonconvulsive')}</option></select></label>
        <label class="f span2">${t('notes')}<textarea name="notes"></textarea></label>
        <div class="btn-group span2"><button class="btn" type="submit">${t('save')}</button><button class="btn ghost" type="button" data-close>${t('cancel')}</button></div></form>`, (bg) => {
        $('#ef', bg).onsubmit = async (e) => {
          e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
          await api(`/api/patients/${p.id}/events`, { method: 'POST', body: { started_at: new Date(f.when).getTime(), duration_sec: f.dur ? Math.round(f.dur * 60) : null, data: { kind: f.kind, notes: f.notes, mode: 'staff' } } });
          bg.remove(); diaryTab(p);
        };
      });
    };
  }

  // ---- family view (per-patient overrides) ----
  function familyTab(p) {
    const ov = { ...p.overrides };
    const cats = CAT.categories.filter(c => c.family);
    const editable = can('doctor');
    const draw = () => {
      $('#tab').innerHTML = `<div class="note" style="margin-bottom:14px">${t('fvHint')}</div>` + cats.map(c => {
        const items = itemsOf(c.id);
        const vis = items.filter(i => ov[i.id] === 'show' || (ov[i.id] !== 'hide' && i.visible)).length;
        return `<div class="panel"><h2>${lang === 'en' ? esc(c.en) : esc(c.ar)}<span class="hint">${fmtN(vis)}/${fmtN(items.length)} ${t('visibleCount')}</span></h2>
        ${items.map(i => { const cur = ov[i.id] || 'default'; return `<div class="item-row"><div class="t"><b>${esc(iname(i))}</b> <span class="lvl-badge ${i.lvl}">${t(i.lvl)}</span><small>${esc(i.lay)}</small></div>
          <div class="seg" role="radiogroup">${['default', 'show', 'hide'].map(v => `<button class="${cur === v ? 'on ' + v : ''}" data-ov="${i.id}|${v}" ${editable ? '' : 'disabled'}>${v === 'default' ? `${t('def')} (${i.visible ? t('shown') : t('hidden')})` : t(v)}</button>`).join('')}</div></div>`; }).join('')}</div>`;
      }).join('');
      $$('[data-ov]').forEach(b => b.onclick = async () => {
        const [id, v] = b.dataset.ov.split('|');
        try { const r = await api(`/api/patients/${p.id}/overrides`, { method: 'PUT', body: { [id]: v } }); Object.keys(ov).forEach(k => delete ov[k]); Object.assign(ov, r.overrides); p.overrides = r.overrides; draw(); }
        catch (er) { toast(errMsg(er)); }
      });
    };
    draw();
  }

  // ---- access ----
  function accessTab(p) {
    $('#tab').innerHTML = `<div class="panel stamp"><div class="qr-box">
        <div class="qr-img" role="img" aria-label="QR">${qrSvg(p.link)}</div>
        <div style="flex:1;min-width:240px">
          <div class="muted small">${t('patientId')}</div><span class="cred">${esc(p.code)}</span>
          <p class="muted small" style="max-width:52ch">${t('qrHint')}</p>
          <div class="btn-group">
            <button class="btn" id="print">${t('printCard')}</button>
            <button class="btn ghost" id="copy">${t('copyLink')}</button>
            <button class="btn ghost" id="reset">${t('resetPw')}</button>
            ${can('doctor') ? `<button class="btn ghost" id="regen">${t('regenQr')}</button>` : ''}
          </div>
        </div></div></div>
      ${can('admin') ? `<div class="panel"><button class="btn ${p.active ? 'clay' : ''}" id="act">${p.active ? t('deactivate') : t('activate')}</button></div>` : ''}`;
    $('#copy').onclick = async () => { try { await navigator.clipboard.writeText(p.link); toast(t('copied')); } catch { prompt('', p.link); } };
    $('#reset').onclick = async () => { const r = await api(`/api/patients/${p.id}/reset-password`, { method: 'POST' }); credentialsModal(p.code, r.password, p.id, false); };
    $('#print').onclick = () => printCard(p.id);
    const rg = $('#regen'); if (rg) rg.onclick = async () => { if (!confirm(t('regenConfirm'))) return; await api(`/api/patients/${p.id}/regen-qr`, { method: 'POST' }); patientPage(p.id, 'access'); };
    const act = $('#act'); if (act) act.onclick = async () => { await api('/api/patients/' + p.id, { method: 'PUT', body: { active: !p.active } }); patientPage(p.id, 'access'); };
  }
  async function printCard(id, pw) {
    const p = await api('/api/patients/' + id);
    const svg = qrSvg(p.link);
    const w = window.open('', '_blank');
    if (!w) return toast('Popup blocked');
    w.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(p.name)} — نوبة</title><link rel="stylesheet" href="${new URL('../fonts/fonts.css', location.href).href}">
      <style>body{font-family:"Readex Pro",sans-serif;color:#15232a;margin:0;padding:24px}.card{max-width:520px;border:2px solid #15232a;border-radius:18px;padding:22px;box-shadow:4px 4px 0 rgba(21,35,42,.15)}
      .top{display:flex;align-items:center;gap:10px}.top b{font-size:26px}.chev{height:10px;margin:12px 0;color:#c2482b;background:linear-gradient(135deg,currentColor 25%,transparent 25%) -5px 0/10px 10px,linear-gradient(225deg,currentColor 25%,transparent 25%) -5px 0/10px 10px}
      .row{display:flex;gap:18px;align-items:center}.qr svg{width:170px;height:170px}.c{font-size:22px;font-weight:700;direction:ltr;display:inline-block;letter-spacing:.05em}ol{padding-inline-start:20px;margin:10px 0 0;font-size:14px;line-height:1.8}small{color:#5b6a6f}
      @media print{body{padding:0}}</style></head><body><div class="card">
      <div class="top">${I.logo.replace('<svg', '<svg width="42" height="42"').replace(/var\(--tigris\)/g, '#0e5a5e').replace(/var\(--on-tigris\)/g, '#f3eee4')}<div><b>نوبة</b><br><small>${esc(SETTINGS.centerName?.ar || '')}</small></div></div>
      <div class="chev"></div>
      <div class="row"><div class="qr">${svg}</div><div><small>المريض</small><div style="font-size:19px;font-weight:700">${esc(p.name)}</div>
        <small>رقم المريض</small><div class="c">${esc(p.code)}</div>${pw ? `<small>الرمز السري</small><div class="c">${esc(pw)}</div>` : ''}</div></div>
      <ol><li>افتح كاميرا الموبايل ووجّهها على الرمز.</li><li>اضغط على الرابط اللي يطلع، وبعدين "إضافة إلى الشاشة الرئيسية".</li><li>وقت النوبة اضغط الزر الجبير <b>نوبة الآن</b>.</li></ol>
      </div><script>setTimeout(()=>print(),400)<\/script></body></html>`);
    w.document.close();
  }

  // QR rendered in the browser (no server storage, works with any API host)
  function qrSvg(text) { const q = qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 6, margin: 8, scalable: true }); }

  // ---------------- content & visibility ----------------
  async function contentPage() {
    setNav('content');
    CAT = await api('/api/catalog');
    const editable = can('admin');
    let filter = store.get('lvlFilter', 'all');
    const draw = () => {
      main().innerHTML = head(t('content'), '', editable ? `<button class="btn ghost" id="basic">${t('showBasic')}</button><button class="btn ghost" id="all">${t('showAll')}</button>` : '') + `
        <div class="note" style="margin-bottom:14px">${t('contentHint')}</div>
        <div class="btn-group" style="margin-bottom:14px"><select id="lvl" style="width:auto">${[['all', t('filterAll')], ['basic', t('basic')], ['advanced', t('advanced')]].map(([v, l]) => `<option value="${v}" ${filter === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
        ${CAT.categories.map(c => {
          const items = CAT.items.filter(i => i.cat === c.id && (filter === 'all' || i.lvl === filter));
          const all = CAT.items.filter(i => i.cat === c.id);
          return `<div class="panel"><h2>${lang === 'en' ? esc(c.en) : esc(c.ar)}${c.family ? `<span class="hint">${fmtN(all.filter(i => i.visible).length)}/${fmtN(all.length)} ${t('visibleCount')}</span>` : ''}</h2>
          ${!c.family ? `<p class="muted small" style="margin-top:-6px">${t('staffOnlyCat')}</p>` : ''}
          ${items.map(i => `<div class="item-row"><div class="t"><b>${esc(iname(i))}</b> <span class="lvl-badge ${i.lvl}">${t(i.lvl)}</span>${i.group ? ` <span class="tag">${esc(i.group)}</span>` : ''}${i.ilae ? ` <span class="tag">${esc(i.ilae)}</span>` : ''}
            <small>${lang === 'en' ? esc(i.ar) + ' · ' : ''}«${esc(i.lay)}»</small></div>
            ${c.family ? `<label class="sw" title="${i.visible ? t('shown') : t('hidden')}"><input type="checkbox" data-vis="${i.id}" ${i.visible ? 'checked' : ''} ${editable ? '' : 'disabled'}><i></i></label>` : ''}</div>`).join('')}
          </div>`;
        }).join('')}
        <p class="muted small"><b>${t('source')}:</b> ${esc(CAT.source)}</p>`;
      $('#lvl').onchange = (e) => { filter = e.target.value; store.set('lvlFilter', filter); draw(); };
      $$('[data-vis]').forEach(cb => cb.onchange = async () => {
        try { await api('/api/catalog/visibility', { method: 'PUT', body: { [cb.dataset.vis]: cb.checked } }); CAT.items.find(i => i.id === cb.dataset.vis).visible = cb.checked; draw(); }
        catch (er) { cb.checked = !cb.checked; toast(errMsg(er)); }
      });
      const bulk = async (fn) => { const body = {}; CAT.items.filter(i => CAT.categories.find(c => c.id === i.cat)?.family).forEach(i => (body[i.id] = fn(i))); await api('/api/catalog/visibility', { method: 'PUT', body }); contentPage(); };
      const b1 = $('#basic'); if (b1) b1.onclick = () => bulk(i => i.lvl === 'basic');
      const b2 = $('#all'); if (b2) b2.onclick = () => bulk(() => true);
    };
    draw();
  }

  // ---------------- settings ----------------
  async function settingsPage() {
    setNav('settings');
    SETTINGS = await api('/api/settings');
    const f = SETTINGS.features, ed = can('admin'), dis = ed ? '' : 'disabled';
    const row = (key, title, hint, extra = '') => `<div class="item-row"><div class="t"><b>${title}</b><small>${hint}</small>${extra}</div><label class="sw"><input type="checkbox" data-feat="${key}" ${f[key] ? 'checked' : ''} ${dis}><i></i></label></div>`;
    main().innerHTML = head(t('settings')) + `
      <div class="panel stamp"><h2>${t('features')}</h2>
        ${row('ambulance', t('ambulance'), t('ambulanceHint'))}
        ${row('video', t('videoRec'), t('videoHint'))}
        <div ${f.video ? '' : 'hidden'}>${row('videoUpload', t('videoUpload'), t('videoUploadHint'))}</div>
        <div class="grid g3" style="margin-top:14px">
          <label class="f">${t('emergencyNumber')}<input type="tel" class="ltr" id="num" value="${esc(f.emergencyNumber)}" ${dis}></label>
          <label class="f">${t('rescueAlert')}<input type="number" min="1" max="30" id="ral" value="${esc(f.rescueAlertMin)}" ${dis}></label>
          <label class="f">${t('maxMb')}<input type="number" min="1" max="200" id="mb" value="${esc(f.videoMaxMb)}" ${dis}></label>
        </div>
        <p class="muted small">${t('rescueAlertHint')}</p>
      </div>
      <div class="panel"><h2>${t('centre')}</h2><div class="grid g2">
        <label class="f">${t('centreAr')}<input type="text" id="cna" value="${esc(SETTINGS.centerName?.ar || '')}" ${dis} dir="rtl"></label>
        <label class="f">${t('centreEn')}<input type="text" id="cne" value="${esc(SETTINGS.centerName?.en || '')}" ${dis} dir="ltr"></label>
        <label class="f span2">${t('publicUrl')}<input type="url" class="ltr" id="pu" value="${esc(SETTINGS.publicUrl || '')}" ${ME.role === 'owner' ? '' : 'disabled'} placeholder="https://"><span class="small">${t('publicUrlHint')}</span></label>
      </div></div>
      ${ed ? `<div class="save-bar"><span class="muted"></span><button class="btn" id="save">${t('save')}</button></div>` : ''}`;
    $$('[data-feat]').forEach(cb => cb.onchange = async () => {
      try { await api('/api/settings', { method: 'PUT', body: { features: { [cb.dataset.feat]: cb.checked } } }); toast(t('saved')); if (cb.dataset.feat === 'video') settingsPage(); }
      catch (er) { cb.checked = !cb.checked; toast(errMsg(er)); }
    });
    const sv = $('#save'); if (sv) sv.onclick = async () => {
      const body = { features: { emergencyNumber: $('#num').value, rescueAlertMin: $('#ral').value, videoMaxMb: $('#mb').value }, centerName: { ar: $('#cna').value, en: $('#cne').value } };
      if (ME.role === 'owner') body.publicUrl = $('#pu').value;
      try { await api('/api/settings', { method: 'PUT', body }); toast(t('saved')); SETTINGS = await api('/api/settings'); }
      catch (er) { toast(errMsg(er)); }
    };
  }

  // ---------------- staff ----------------
  async function staffPage() {
    setNav('staff');
    if (!can('admin')) return (main().innerHTML = `<div class="err">${t('forbidden')}</div>`);
    const rows = await api('/api/staff');
    const assignable = Object.keys(LEVEL).filter(r => r !== 'owner' && LEVEL[r] < LEVEL[ME.role]);
    main().innerHTML = head(t('staff')) + `
      <div class="grid g2">
      <form class="panel stamp" id="f"><h2>${t('addStaff')}</h2><div id="e"></div><div class="grid g2">
        <label class="f">${t('fullName')}<input type="text" name="name" required></label>
        <label class="f">${t('username')}<input type="text" name="username" class="ltr" required></label>
        <label class="f">${t('role')}<select name="role">${assignable.map(r => `<option value="${r}">${t(r)}</option>`).join('')}</select></label>
        <label class="f">${t('tempPw')}<input type="text" name="password" class="ltr" minlength="8" required></label>
      </div><button class="btn" style="margin-top:12px" type="submit">${I.plus}${t('add')}</button></form>
      <div class="panel"><h2>${t('rolesTitle')}</h2><p class="small" style="line-height:1.9;margin:0">${t('rolesHelp')}</p></div></div>
      <div class="panel"><div class="table-wrap"><table><thead><tr><th>${t('name')}</th><th>${t('username')}</th><th>${t('role')}</th><th>${t('status')}</th><th></th></tr></thead><tbody>
      ${rows.map(u => { const mine = LEVEL[u.role] < LEVEL[ME.role]; return `<tr><td><b>${esc(u.name)}</b></td><td class="ltr">${esc(u.username)}</td>
        <td>${mine ? `<select data-role="${u.id}" style="width:auto">${assignable.map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${t(r)}</option>`).join('')}</select>` : `<span class="role-tag" style="color:var(--tigris)">${t(u.role)}</span>`}</td>
        <td>${u.active ? `<span class="tag r">${t('active')}</span>` : `<span class="tag">${t('inactive')}</span>`}</td>
        <td>${mine ? `<div class="btn-group"><button class="btn ghost sm" data-act="${u.id}|${u.active ? 0 : 1}">${u.active ? t('disable') : t('enable')}</button><button class="btn ghost sm" data-pw="${u.id}">${t('resetStaffPw')}</button></div>` : ''}</td></tr>`; }).join('')}
      </tbody></table></div></div>`;
    $('#f').onsubmit = async (e) => {
      e.preventDefault();
      try { await api('/api/staff', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); staffPage(); toast(t('saved')); }
      catch (er) { $('#e').innerHTML = `<div class="err" style="margin-bottom:10px">${errMsg(er)}</div>`; }
    };
    $$('[data-role]').forEach(s => s.onchange = async () => { try { await api('/api/staff/' + s.dataset.role, { method: 'PATCH', body: { role: s.value } }); toast(t('saved')); } catch (er) { toast(errMsg(er)); } });
    $$('[data-act]').forEach(b => b.onclick = async () => { const [id, a] = b.dataset.act.split('|'); await api('/api/staff/' + id, { method: 'PATCH', body: { active: a === '1' } }); staffPage(); });
    $$('[data-pw]').forEach(b => b.onclick = async () => { const pw = prompt(t('promptPw')); if (!pw) return; try { await api('/api/staff/' + b.dataset.pw, { method: 'PATCH', body: { password: pw } }); toast(t('saved')); } catch (er) { toast(errMsg(er)); } });
  }

  // ---------------- audit ----------------
  async function auditPage() {
    setNav('audit');
    const rows = await api('/api/audit');
    main().innerHTML = head(t('audit')) + `<div class="panel"><div class="table-wrap"><table><thead><tr><th>${t('at')}</th><th>${t('who')}</th><th>${t('action')}</th><th>${t('target')}</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td class="small">${fmtDT(r.at)}</td><td class="ltr small">${esc(r.actor)}</td><td class="ltr small"><code>${esc(r.action)}</code></td><td class="ltr small">${esc(r.target || '')}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  // ---------------- account ----------------
  function accountPage() {
    setNav('account');
    main().innerHTML = head(t('account'), `${esc(ME.username)} · ${t(ME.role)}`) + `<div class="grid g2">
      <form class="panel" id="pf"><h2>${t('changePw')}</h2><div id="e"></div><div class="grid">
        <label class="f">${t('oldPw')}<input type="password" name="oldPassword" required autocomplete="current-password"></label>
        <label class="f">${t('newPw')}<input type="password" name="newPassword" minlength="8" required autocomplete="new-password"></label>
        <button class="btn" type="submit">${t('save')}</button></div></form>
      <div class="panel"><h2>${t('language')}</h2><div class="btn-group"><button class="btn ${lang === 'ar' ? '' : 'ghost'}" data-l="ar">العربية</button><button class="btn ${lang === 'en' ? '' : 'ghost'}" data-l="en">English</button></div></div></div>`;
    $('#pf').onsubmit = async (e) => {
      e.preventDefault();
      try { await api('/api/staff/me', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); e.target.reset(); $('#e').innerHTML = `<div class="ok-box">${t('saved')}</div>`; }
      catch (er) { $('#e').innerHTML = `<div class="err">${er.message === 'bad_old_password' ? t('badOld') : errMsg(er)}</div>`; }
    };
    $$('[data-l]').forEach(b => b.onclick = () => { lang = b.dataset.l; store.set('lang', lang); store.set('langChosen', true); api('/api/staff/me', { method: 'POST', body: { lang } }).catch(() => {}); applyLang(); shell(); route(); });
  }

  // ---------------- boot ----------------
  async function boot() {
    applyLang();
    if (!token) {
      const s = await fetch(API + '/api/setup').then(r => r.json()).catch(() => ({}));
      return s.needsOwner ? setupScreen() : loginScreen();
    }
    try {
      const r = await api('/api/staff/me'); ME = r.user;
      SETTINGS = await api('/api/settings');
    } catch { return; }
    shell(); route();
  }
  boot();
})();

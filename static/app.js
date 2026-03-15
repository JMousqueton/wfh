/* ============================================================
   WFH Planner – Frontend  (i18n + profile + API-backed)
   ============================================================ */

'use strict';

// ── Translations ──────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    locale:                'en-US',
    // Login
    logoSubtitle:          'Work From Home Planner',
    usernamePlaceholder:   'Username',
    passwordPlaceholder:   'Password',
    signIn:                'Sign In',
    loginError:            'Invalid username or password',
    // Header / nav
    today:                 'Today',
    logout:                'Logout',
    profileTitle:          'Profile',
    // Days
    dayLabels:             ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    // Status
    atHome:                'At home',
    atOffice:              'At office',
    travelling:            'Travelling',
    // Footer
    legendHome:            name => `${name} at home`,
    legendOffice:          'At office',
    legendTravel:          'Travelling',
    tapToToggle:           'Tap your own row to toggle status',
    exportIcs:             'Export week (.ics)',
    // Week range
    weekRange(days) {
      const s = days[0], e = days[4];
      const sm = s.toLocaleDateString('en-US', { month: 'long' });
      const em = e.toLocaleDateString('en-US', { month: 'long' });
      return sm === em
        ? `${sm} ${s.getDate()} – ${e.getDate()}, ${e.getFullYear()}`
        : `${sm} ${s.getDate()} – ${em} ${e.getDate()}, ${e.getFullYear()}`;
    },
    dayDate: d => `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`,
    // Profile
    languageSection:       'Language',
    langEn:                'English',
    langFr:                'French',
    emailSection:          'Email',
    emailPlaceholder:      'your@email.com',
    emailSuccess:          'Email saved ✓',
    emailInvalid:          'Invalid email address',
    passwordSection:       'Change Password',
    currentPwdPlaceholder: 'Current password',
    newPwdPlaceholder:     'New password',
    confirmPwdPlaceholder: 'Confirm new password',
    saveChanges:           'Save changes',
    pwdMismatch:           'Passwords do not match',
    pwdWrongCurrent:       'Current password is incorrect',
    pwdSuccess:            'Password updated ✓',
    langSaved:             'Language saved ✓',
    back:                  'Back',
    installTitle:          'Install WFH Planner',
    installHint:           'Add to Home Screen',
    monthlyView:           'Monthly view',
    weeklyView:            'Weekly view',
    dayOff:                'Day Off',
  },
  fr: {
    locale:                'fr-FR',
    // Login
    logoSubtitle:          'Planning de télétravail',
    usernamePlaceholder:   "Nom d'utilisateur",
    passwordPlaceholder:   'Mot de passe',
    signIn:                'Se connecter',
    loginError:            "Nom d'utilisateur ou mot de passe incorrect",
    // Header / nav
    today:                 "Aujourd'hui",
    logout:                'Déconnexion',
    profileTitle:          'Profil',
    // Days
    dayLabels:             ['LUN', 'MAR', 'MER', 'JEU', 'VEN'],
    // Status
    atHome:                'À domicile',
    atOffice:              'Au bureau',
    travelling:            'En déplacement',
    // Footer
    legendHome:            name => `${name} à domicile`,
    legendOffice:          'Au bureau',
    legendTravel:          'En déplacement',
    tapToToggle:           'Tapez votre ligne pour changer le statut',
    exportIcs:             'Exporter la semaine (.ics)',
    // Week range
    weekRange(days) {
      const s = days[0], e = days[4];
      const sm = s.toLocaleDateString('fr-FR', { month: 'long' });
      const em = e.toLocaleDateString('fr-FR', { month: 'long' });
      return sm === em
        ? `${s.getDate()} – ${e.getDate()} ${sm} ${e.getFullYear()}`
        : `${s.getDate()} ${sm} – ${e.getDate()} ${em} ${e.getFullYear()}`;
    },
    dayDate(d) {
      const m = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
      return `${d.getDate()} ${m}`;
    },
    // Profile
    languageSection:       'Langue',
    langEn:                'Anglais',
    langFr:                'Français',
    emailSection:          'Email',
    emailPlaceholder:      'votre@email.com',
    emailSuccess:          'Email enregistré ✓',
    emailInvalid:          'Adresse email invalide',
    passwordSection:       'Changer le mot de passe',
    currentPwdPlaceholder: 'Mot de passe actuel',
    newPwdPlaceholder:     'Nouveau mot de passe',
    confirmPwdPlaceholder: 'Confirmer le nouveau mot de passe',
    saveChanges:           'Enregistrer',
    pwdMismatch:           'Les mots de passe ne correspondent pas',
    pwdWrongCurrent:       'Mot de passe actuel incorrect',
    pwdSuccess:            'Mot de passe mis à jour ✓',
    langSaved:             'Langue enregistrée ✓',
    back:                  'Retour',
    installTitle:          'Installer WFH Planner',
    installHint:           'Ajouter à l\'écran d\'accueil',
    monthlyView:           'Vue mensuelle',
    weeklyView:            'Vue hebdomadaire',
    dayOff:                'Férié',
  },
};

// ── i18n helpers ──────────────────────────────────────────────────────────────
let currentLang = 'en';

function t(key) {
  return TRANSLATIONS[currentLang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}

function applyTranslations() {
  document.documentElement.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.dataset.i18n);
    if (typeof val === 'string') el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const val = t(el.dataset.i18nPlaceholder);
    if (typeof val === 'string') el.placeholder = val;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const val = t(el.dataset.i18nTitle);
    if (typeof val === 'string') el.title = val;
  });

  // Sync lang-toggle active state in profile view
  document.querySelectorAll('.btn-lang').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
  updateViewToggleLabel();
}

async function setLang(lang, persist = true) {
  currentLang = lang;
  applyTranslations();
  if (persist && currentUser()) {
    const updated = await api('PATCH', '/users/me', { lang });
    if (updated && _currentUser) _currentUser.lang = updated.lang;
  }
  // Re-render — always refresh calendar (even if hidden) so it's ready when back
  renderCalendar();
  renderProfileHero();

  // Show brief "saved" confirmation in profile language section
  const savedMsg = document.getElementById('langSavedMsg');
  if (savedMsg) {
    savedMsg.querySelector('[data-i18n]').textContent = t('langSaved');
    savedMsg.classList.remove('d-none');
    clearTimeout(savedMsg._hideTimer);
    savedMsg._hideTimer = setTimeout(() => savedMsg.classList.add('d-none'), 2000);
  }
}


// ── State ─────────────────────────────────────────────────────────────────────
const TOKEN_KEY  = 'wfh_token';
let allUsers     = [];
let _currentUser = null;
let _calCache    = {};
let weekOffset   = (() => { const d = new Date().getDay(); return (d === 0 || d === 6) ? 1 : 0; })();
let viewMode     = 'week';   // 'week' | 'month'
let monthOffset  = 0;

const DAY_LABELS_FALLBACK = ['MON', 'TUE', 'WED', 'THU', 'FRI'];


// ── API helper ────────────────────────────────────────────────────────────────
async function api(method, path, body = undefined) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 401) { _expireSession(); return null; }
  return res.json();
}

function _expireSession() {
  localStorage.removeItem(TOKEN_KEY);
  _currentUser = null;
  allUsers     = [];
  _calCache    = {};
  showView('loginView');
}


// ── Auth ──────────────────────────────────────────────────────────────────────
function currentUser() { return _currentUser; }

async function authRestore() {
  if (!localStorage.getItem(TOKEN_KEY)) return false;
  const user = await api('GET', '/auth/me');
  if (!user) return false;
  _currentUser = user;
  return true;
}

async function fetchAllUsers() {
  const list = await api('GET', '/users');
  if (list) allUsers = list;
}


// ── Conflict badge ────────────────────────────────────────────────────────────
async function refreshConflictBadge() {
  const data = await api('GET', '/conflicts/count');
  const el   = document.getElementById('conflictBadge');
  if (!el) return;
  if (data && data.count > 0) {
    el.textContent = data.count;
    el.classList.remove('d-none');
  } else {
    el.classList.add('d-none');
  }
}


// ── Calendar data ─────────────────────────────────────────────────────────────
async function calFetch(mondayIso) {
  const data = await api('GET', `/calendar?monday=${mondayIso}`);
  if (data) _calCache = data;
}

async function calFetchMerge(mondayIso) {
  const data = await api('GET', `/calendar?monday=${mondayIso}`);
  if (data) Object.assign(_calCache, data);
}

function calStatus(date, userId) {
  return _calCache[date]?.[userId] ?? null;
}

async function calToggle(date, userId) {
  const cycle = { null: 'home', home: 'travelling', travelling: null };
  const next  = cycle[calStatus(date, userId) ?? 'null'] ?? null;
  if (!_calCache[date]) _calCache[date] = {};
  _calCache[date][userId] = next;
  const result = await api('PUT', `/calendar/${date}/${userId}`, { status: next });
  if (result !== null) _calCache[date][userId] = result.status ?? null;
}


// ── Week helpers ──────────────────────────────────────────────────────────────
function mondayOf(date) {
  const d   = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekDays() {
  const mon = mondayOf(new Date());
  mon.setDate(mon.getDate() + weekOffset * 7);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function isToday(d) {
  const n = new Date();
  return d.getDate()     === n.getDate()  &&
         d.getMonth()    === n.getMonth() &&
         d.getFullYear() === n.getFullYear();
}

function isHoliday(date)   { return !!_calCache[date]?._holiday; }
function holidayName(date) { return _calCache[date]?._holiday ?? ''; }

function currentMonthDate() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + monthOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Returns an array of Mondays for every work-week that overlaps the given month
function getMonthWeeks(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const d        = new Date(mondayOf(firstDay));
  const weeks    = [];
  while (d <= lastDay) {
    const fri = new Date(d); fri.setDate(fri.getDate() + 4);
    if (fri >= firstDay) weeks.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return weeks;
}


// ── Views ─────────────────────────────────────────────────────────────────────
function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('d-none', v.id !== id));
}


// ── Calendar rendering ────────────────────────────────────────────────────────
async function renderCalendar() {
  const me   = currentUser();
  const days = weekDays();
  const mon  = isoDate(days[0]);
  const labels = t('dayLabels');

  // Header
  document.getElementById('weekRange').textContent = t('weekRange')(days);
  const badge = document.getElementById('userBadge');
  badge.innerHTML = `<i class="fas ${me.icon}"></i><span>${me.name}</span>`;
  badge.style.color = me.color;

  // Footer legend (dynamic, uses translated user names)
  const legend = document.getElementById('footerLegend');
  legend.innerHTML = allUsers.map(u => `
    <div class="legend-item">
      <i class="fas fa-house" style="color:${u.color}"></i>
      <span>${t('legendHome')(u.name)}</span>
    </div>
    <div class="legend-dot"></div>
  `).join('') + `
    <div class="legend-item">
      <i class="fas fa-plane" style="color:#f59e0b"></i>
      <span>${t('legendTravel')}</span>
    </div>
    <div class="legend-dot"></div>
    <div class="legend-item">
      <i class="fas fa-building" style="color:#64748b"></i>
      <span>${t('legendOffice')}</span>
    </div>
  `;

  // Fetch & render grid
  const grid = document.getElementById('weekGrid');
  grid.className = 'week-grid loading';
  await calFetch(mon);
  grid.className = 'week-grid';

  grid.innerHTML = '';
  days.forEach((day, i) => {
    const date  = isoDate(day);
    const today   = isToday(day);
    const holiday = isHoliday(date);
    const allHome = !holiday && allUsers.length > 0 && allUsers.every(u => calStatus(date, u.id) === 'home');
    const card  = document.createElement('div');
    card.className = `day-card${today ? ' today' : ''}${allHome ? ' all-home' : ''}${holiday ? ' holiday' : ''}`;
    card.innerHTML  = buildDayCard(day, date, today, me, labels[i] ?? DAY_LABELS_FALLBACK[i]);
    grid.appendChild(card);
  });

  grid.querySelectorAll('.status-row.mine').forEach(row => {
    row.addEventListener('click',   () => handleToggle(row.dataset.date, row.dataset.user));
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggle(row.dataset.date, row.dataset.user); }
    });
  });
}

function buildDayCard(day, date, today, me, dayLabel) {
  const header = `
    <div class="day-header">
      <div>
        <div class="day-name">${dayLabel}</div>
        <div class="day-date">${t('dayDate')(day)}</div>
      </div>
      ${today ? '<div class="today-dot"><i class="fas fa-circle"></i></div>' : ''}
    </div>`;

  if (isHoliday(date)) {
    return `${header}
    <div class="day-holiday">
      <i class="fas fa-calendar-xmark"></i>
      <span class="holiday-label">${t('dayOff')}</span>
      <span class="holiday-name">${holidayName(date)}</span>
    </div>`;
  }

  const rows = allUsers.map(u => buildStatusRow(u, date, u.id === me.id)).join('');
  return `${header}<div class="day-body">${rows}</div>`;
}

function statusDisplay(status) {
  if (status === 'home')       return { cls: 'is-home',       icon: 'fa-house',    label: t('atHome') };
  if (status === 'travelling') return { cls: 'is-travelling', icon: 'fa-plane',    label: t('travelling') };
  return                              { cls: 'is-office',     icon: 'fa-building', label: t('atOffice') };
}

function buildStatusRow(user, date, isMine) {
  const { cls, icon, label } = statusDisplay(calStatus(date, user.id));

  return `
    <div class="status-row ${isMine ? 'mine' : 'other'} ${cls}"
         data-user="${user.id}" data-date="${date}"
         style="--u-color:${user.color}; --u-rgb:${user.colorRgb};"
         ${isMine ? 'role="button" tabindex="0"' : ''}>
      <div class="status-avatar"><i class="fas ${user.icon}"></i></div>
      <div class="status-info">
        <span class="status-name">${user.name}</span>
        <span class="status-label">
          <i class="fas ${icon}"></i>
          <span>${label}</span>
        </span>
      </div>
      ${isMine ? '<div class="status-edit"><i class="fas fa-rotate"></i></div>' : ''}
    </div>
  `;
}

async function handleToggle(date, userId) {
  const row = document.querySelector(`.status-row[data-date="${date}"][data-user="${userId}"]`);
  if (!row) return;
  // Optimistic cycle: office → home → travelling → office
  const cycle = { 'is-office': 'home', 'is-home': 'travelling', 'is-travelling': null };
  const currentCls = ['is-office', 'is-home', 'is-travelling'].find(c => row.classList.contains(c)) ?? 'is-office';
  const nextStatus = cycle[currentCls] ?? null;
  const { cls, icon, label } = statusDisplay(nextStatus);
  row.classList.remove('is-office', 'is-home', 'is-travelling');
  row.classList.add(cls);
  row.querySelector('.status-label').innerHTML = `<i class="fas ${icon}"></i><span>${label}</span>`;
  await calToggle(date, userId);
  refreshConflictBadge();
  // Update all-home highlight on the day card
  const card = row.closest('.day-card');
  if (card) {
    const allHome = allUsers.every(u => calStatus(date, u.id) === 'home');
    card.classList.toggle('all-home', allHome);
  }
}


// ── Month view ────────────────────────────────────────────────────────────────
async function renderMonthView() {
  const me   = currentUser();
  const base = currentMonthDate();
  const year = base.getFullYear();
  const month = base.getMonth();

  // Header label (capitalise first letter for French)
  const raw   = base.toLocaleDateString(t('locale'), { month: 'long', year: 'numeric' });
  document.getElementById('weekRange').textContent = raw.charAt(0).toUpperCase() + raw.slice(1);

  const badge = document.getElementById('userBadge');
  badge.innerHTML = `<i class="fas ${me.icon}"></i><span>${me.name}</span>`;
  badge.style.color = me.color;

  // Footer legend (same as week view)
  const legend = document.getElementById('footerLegend');
  legend.innerHTML = allUsers.map(u => `
    <div class="legend-item">
      <i class="fas fa-house" style="color:${u.color}"></i>
      <span>${t('legendHome')(u.name)}</span>
    </div>
    <div class="legend-dot"></div>
  `).join('') + `
    <div class="legend-item">
      <i class="fas fa-plane" style="color:#f59e0b"></i>
      <span>${t('legendTravel')}</span>
    </div>
    <div class="legend-dot"></div>
    <div class="legend-item">
      <i class="fas fa-building" style="color:#64748b"></i>
      <span>${t('legendOffice')}</span>
    </div>
  `;

  // Fetch all weeks of the month in parallel
  const grid  = document.getElementById('weekGrid');
  grid.className = 'month-grid loading';
  const weeks = getMonthWeeks(year, month);
  await Promise.all(weeks.map(mon => calFetchMerge(isoDate(mon))));
  grid.className = 'month-grid';
  grid.innerHTML = '';

  // Header row – day labels
  t('dayLabels').forEach(label => {
    const h = document.createElement('div');
    h.className   = 'month-header-cell';
    h.textContent = label;
    grid.appendChild(h);
  });

  // Day cells
  weeks.forEach(monday => {
    for (let i = 0; i < 5; i++) {
      const day     = new Date(monday); day.setDate(day.getDate() + i);
      const date    = isoDate(day);
      const inMonth = day.getMonth() === month && day.getFullYear() === year;
      const today   = isToday(day);
      const holiday = inMonth && isHoliday(date);
      const allHome = inMonth && !holiday && allUsers.length > 0 && allUsers.every(u => calStatus(date, u.id) === 'home');

      const cell = document.createElement('div');
      cell.className = `month-cell${today ? ' today' : ''}${!inMonth ? ' out-of-month' : ''}${holiday ? ' holiday' : ''}${allHome ? ' all-home' : ''}`;

      const usersHtml = inMonth ? buildMonthUsersHtml(date) : '';

      cell.innerHTML = `
        <div class="month-cell-date">${day.getDate()}</div>
        <div class="month-cell-users">${usersHtml}</div>
      `;

      if (inMonth && !holiday) cell.addEventListener('click', () => handleMonthToggle(cell, date, me.id));
      grid.appendChild(cell);
    }
  });
}

async function handleMonthToggle(cell, date, userId) {
  await calToggle(date, userId);
  cell.querySelector('.month-cell-users').innerHTML = buildMonthUsersHtml(date);
  cell.classList.toggle('all-home', allUsers.every(u => calStatus(date, u.id) === 'home'));
  refreshConflictBadge();
}

function buildMonthUsersHtml(date) {
  if (isHoliday(date)) {
    return `<span class="month-holiday-label">
      <i class="fas fa-calendar-xmark"></i>
      <span>${t('dayOff')}</span>
    </span>`;
  }
  return allUsers.map(u => {
    const st = calStatus(date, u.id);
    const { icon: sIcon, label } = statusDisplay(st);
    const sColor = st === 'travelling' ? '#f59e0b'
                 : st === 'home'       ? u.color
                 : 'rgba(255,255,255,0.3)';
    return `<span class="month-user-row">
      <i class="fas ${u.icon}" style="color:${u.color}"></i>
      <span class="month-user-name" style="color:${u.color}">${u.name}</span>
      <i class="fas ${sIcon}" style="color:${sColor}"></i>
      <span class="month-status-label">${label}</span>
    </span>`;
  }).join('');
}

function updateViewToggleLabel() {
  const el = document.getElementById('viewToggleLabel');
  if (el) el.textContent = viewMode === 'week' ? t('monthlyView') : t('weeklyView');
}

function toggleView() {
  viewMode = viewMode === 'week' ? 'month' : 'week';
  updateViewToggleLabel();
  if (viewMode === 'month') {
    // Sync to the month containing the currently viewed week
    const now = new Date();
    const w   = weekDays()[0];
    monthOffset = (w.getFullYear() - now.getFullYear()) * 12 + (w.getMonth() - now.getMonth());
    renderMonthView();
  } else {
    renderCalendar();
  }
}


// ── Profile view ──────────────────────────────────────────────────────────────
function renderProfileHero() {
  const me   = currentUser();
  const hero = document.getElementById('profileHero');
  hero.innerHTML = `
    <div class="profile-avatar-icon" style="background:linear-gradient(135deg,${me.color}33,${me.color}22); color:${me.color}; border:1.5px solid ${me.color}44;">
      <i class="fas ${me.icon}"></i>
    </div>
    <div class="profile-hero-name">${me.name}</div>
  `;
}

function showProfile() {
  // Switch view first so the user always gets a response to the click
  showView('profileView');
  renderProfileHero();
  applyTranslations();
  document.getElementById('emailInput').value = currentUser().email ?? '';
  document.getElementById('emailMsg').className = 'pwd-message d-none';
  document.getElementById('pwdForm').reset();
  document.getElementById('pwdMsg').className = 'pwd-message d-none';
}

function showPwdMsg(text, type) {
  const el = document.getElementById('pwdMsg');
  el.textContent = text;
  el.className   = `pwd-message ${type}`;
}


// ── iOS install banner ─────────────────────────────────────────────────────────
function maybeShowIosBanner() {
  const isIos        = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone === true ||
                       window.matchMedia('(display-mode: standalone)').matches;
  const dismissed    = localStorage.getItem('wfh_ios_banner_dismissed');
  if (!isIos || isStandalone || dismissed) return;

  // Set hint with inline icon (bypasses applyTranslations textContent overwrite)
  const action = currentLang === 'fr' ? "Ajouter à l'écran d'accueil" : 'Add to Home Screen';
  const tap    = currentLang === 'fr' ? 'Appuyez sur' : 'Tap';
  const then   = currentLang === 'fr' ? 'puis' : 'then';
  document.getElementById('iosInstallHint').innerHTML =
    `${tap} <i class="fas fa-arrow-up-from-bracket"></i> ${then} <em>${action}</em>`;

  const banner = document.getElementById('iosInstallBanner');
  banner.classList.remove('d-none');
  document.getElementById('iosInstallClose').addEventListener('click', () => {
    banner.classList.add('d-none');
    localStorage.setItem('wfh_ios_banner_dismissed', '1');
  });
}


// ── Boot ──────────────────────────────────────────────────────────────────────
async function initApp() {
  applyTranslations();   // apply default lang before any view is shown

  const ok = await authRestore();
  if (!ok) { showView('loginView'); return; }

  currentLang = _currentUser.lang ?? 'en';
  applyTranslations();
  await fetchAllUsers();
  showView('appView');
  renderCalendar();
  refreshConflictBadge();
  maybeShowIosBanner();
}


// ── Event wiring ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initApp();

  // Populate login badge names from public API (no auth needed)
  fetch('/api/users/public').then(r => r.json()).then(names => {
    if (names[0]) document.getElementById('loginUser1').textContent = names[0];
    if (names[1]) document.getElementById('loginUser2').textContent = names[1];
  }).catch(() => {});


  /* ---- Login ---- */
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const btn      = document.querySelector('.btn-sign-in');
    btn.disabled   = true;

    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem(TOKEN_KEY, data.token);
      _currentUser = data.user;
      currentLang  = data.user.lang ?? 'en';
      applyTranslations();
      await fetchAllUsers();
      document.getElementById('loginError').classList.add('d-none');
      showView('appView');
      renderCalendar();
      refreshConflictBadge();
      maybeShowIosBanner();
    } catch {
      document.getElementById('loginError').classList.remove('d-none');
      const card = document.getElementById('loginCard');
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
    } finally {
      btn.disabled = false;
    }
  });

  /* ---- Password visibility toggle ---- */
  document.getElementById('togglePassword').addEventListener('click', () => {
    const inp  = document.getElementById('password');
    const icon = document.querySelector('#togglePassword i');
    if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fas fa-eye-slash'; }
    else                         { inp.type = 'password'; icon.className = 'fas fa-eye'; }
  });

  /* ---- User badge → profile ---- */
  const userBadge = document.getElementById('userBadge');
  userBadge.addEventListener('click', showProfile);
  userBadge.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showProfile(); } });

  /* ---- Back button (profile → calendar) ---- */
  document.getElementById('backBtn').addEventListener('click', () => { showView('appView'); renderCalendar(); });

  /* ---- Language buttons ---- */
  document.querySelectorAll('.btn-lang').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

  /* ---- Email form ---- */
  document.getElementById('emailForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('emailInput').value.trim();
    const btn   = e.target.querySelector('button[type="submit"]');
    const el    = document.getElementById('emailMsg');
    btn.disabled = true;
    try {
      const result = await api('PATCH', '/users/me', { email });
      if (!result) return;
      if (result.error) {
        el.textContent = result.error.includes('Invalid') ? t('emailInvalid') : result.error;
        el.className = 'pwd-message error';
      } else {
        if (_currentUser) _currentUser.email = result.email;
        document.getElementById('emailInput').value = result.email ?? '';
        el.textContent = t('emailSuccess');
        el.className = 'pwd-message success';
      }
    } catch {
      el.textContent = t('emailInvalid');
      el.className = 'pwd-message error';
    } finally {
      btn.disabled = false;
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  /* ---- Password form ---- */
  document.getElementById('pwdForm').addEventListener('submit', async e => {
    e.preventDefault();
    const currentPwd = document.getElementById('currentPwd').value;
    const newPwd     = document.getElementById('newPwd').value;
    const confirmPwd = document.getElementById('confirmPwd').value;

    if (newPwd !== confirmPwd) {
      showPwdMsg(t('pwdMismatch'), 'error');
      return;
    }

    const btn     = e.target.querySelector('button[type="submit"]');
    btn.disabled  = true;
    try {
      const result = await api('PATCH', '/users/me', { currentPassword: currentPwd, newPassword: newPwd });
      if (!result) return;
      if (result.error) {
        const msg = result.error.includes('incorrect') ? t('pwdWrongCurrent') : result.error;
        showPwdMsg(msg, 'error');
      } else {
        showPwdMsg(t('pwdSuccess'), 'success');
        document.getElementById('pwdForm').reset();
      }
    } finally {
      btn.disabled = false;
    }
  });

  /* ---- Logout ---- */
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try { await api('POST', '/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY);
    _currentUser = null;
    allUsers     = [];
    _calCache    = {};
    currentLang  = 'en';
    viewMode     = 'week';
    monthOffset  = 0;
    const dow    = new Date().getDay();
    weekOffset   = (dow === 0 || dow === 6) ? 1 : 0;
    applyTranslations();
    showView('loginView');
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').classList.add('d-none');
    document.getElementById('password').type = 'password';
    document.querySelector('#togglePassword i').className = 'fas fa-eye';
  });

  /* ---- Week / Month navigation ---- */
  document.getElementById('prevWeek').addEventListener('click', () => {
    if (viewMode === 'month') { monthOffset--; renderMonthView(); }
    else { weekOffset--; renderCalendar(); }
  });
  document.getElementById('nextWeek').addEventListener('click', () => {
    if (viewMode === 'month') { monthOffset++; renderMonthView(); }
    else { weekOffset++; renderCalendar(); }
  });
  document.getElementById('todayBtn').addEventListener('click', () => {
    if (viewMode === 'month') { monthOffset = 0; renderMonthView(); }
    else {
      const dow  = new Date().getDay();
      weekOffset = (dow === 0 || dow === 6) ? 1 : 0;
      renderCalendar();
    }
  });

  /* ---- View toggle (desktop) ---- */
  document.getElementById('viewToggleBtn').addEventListener('click', toggleView);

  /* ---- ICS export ---- */
  document.getElementById('exportIcsBtn').addEventListener('click', async () => {
    const monday = isoDate(weekDays()[0]);
    const token  = localStorage.getItem(TOKEN_KEY);
    const res    = await fetch(`/api/calendar/export.ics?monday=${monday}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url, download: `wfh-${monday}.ics`
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  /* ---- Swipe ---- */
  let touchX = 0;
  const appView = document.getElementById('appView');
  appView.addEventListener('touchstart', e => { touchX = e.changedTouches[0].screenX; }, { passive: true });
  appView.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].screenX - touchX;
    if (Math.abs(dx) > 80) { if (dx < 0) weekOffset++; else weekOffset--; renderCalendar(); }
  }, { passive: true });

  /* ---- PWA ---- */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});

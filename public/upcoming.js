(function () {
  'use strict';

  const THEME_COLORS = {
    default:     { primary: '#E8B830', glow: 'rgba(232,184,48,0.40)',   bg: 'rgba(14,14,18,0.92)',  accent: '#D4001A' },
    cyberpunk:   { primary: '#00F5FF', glow: 'rgba(0,245,255,0.45)',    bg: 'rgba(5,0,20,0.92)',    accent: '#FF2D78' },
    synthwave:   { primary: '#FF6EC7', glow: 'rgba(255,110,199,0.45)',  bg: 'rgba(13,0,48,0.92)',   accent: '#C77DFF' },
    midnight:    { primary: '#4488FF', glow: 'rgba(68,136,255,0.40)',   bg: 'rgba(5,10,30,0.92)',   accent: '#88AAFF' },
    egypt:       { primary: '#D4A017', glow: 'rgba(212,160,23,0.45)',   bg: 'rgba(18,12,4,0.92)',   accent: '#C0392B' },
    city:        { primary: '#A0C4D8', glow: 'rgba(160,196,216,0.35)', bg: 'rgba(8,16,24,0.92)',   accent: '#5A8FAA' },
    eco:         { primary: '#6BC96C', glow: 'rgba(107,201,108,0.40)', bg: 'rgba(6,18,6,0.92)',    accent: '#A8E063' },
    water:       { primary: '#29B6F6', glow: 'rgba(41,182,246,0.40)',  bg: 'rgba(4,16,28,0.92)',   accent: '#0288D1' },
    fire:        { primary: '#FF6B00', glow: 'rgba(255,107,0,0.50)',   bg: 'rgba(20,5,0,0.92)',    accent: '#FFD700' },
    rainbow:     { primary: '#FF6EC7', glow: 'rgba(255,110,199,0.35)', bg: 'rgba(10,0,20,0.88)',   accent: '#00F5FF' },
    trans:       { primary: '#55CDFC', glow: 'rgba(85,205,252,0.40)',  bg: 'rgba(6,14,22,0.92)',   accent: '#F7A8B8' },
    pan:         { primary: '#FF218C', glow: 'rgba(255,33,140,0.40)',  bg: 'rgba(18,4,10,0.92)',   accent: '#FFD800' },
    bi:          { primary: '#9B59D0', glow: 'rgba(155,89,208,0.40)',  bg: 'rgba(12,4,18,0.92)',   accent: '#FF218C' },
    lesbian:     { primary: '#FF4500', glow: 'rgba(255,69,0,0.40)',    bg: 'rgba(20,8,4,0.92)',    accent: '#FF9A56' },
    plage:       { primary: '#F4D35E', glow: 'rgba(244,211,94,0.40)',  bg: 'rgba(18,14,4,0.88)',   accent: '#3CAEA3' },
    smario:      { primary: '#E52222', glow: 'rgba(229,34,34,0.45)',   bg: 'rgba(20,4,4,0.92)',    accent: '#FFD700' },
    sdk:         { primary: '#7B3F00', glow: 'rgba(123,63,0,0.45)',    bg: 'rgba(14,8,2,0.92)',    accent: '#E52222' },
    slink:       { primary: '#D4A017', glow: 'rgba(212,160,23,0.45)',  bg: 'rgba(14,12,2,0.92)',   accent: '#2E8B57' },
    ssamus:      { primary: '#FF8C00', glow: 'rgba(255,140,0,0.45)',   bg: 'rgba(14,8,0,0.92)',    accent: '#8B0000' },
    sdsamus:     { primary: '#9400D3', glow: 'rgba(148,0,211,0.45)',   bg: 'rgba(10,0,14,0.92)',   accent: '#FF8C00' },
    syoshi:      { primary: '#6BC96C', glow: 'rgba(107,201,108,0.45)', bg: 'rgba(6,14,6,0.92)',    accent: '#E52222' },
    skirby:      { primary: '#FF69B4', glow: 'rgba(255,105,180,0.45)', bg: 'rgba(18,6,12,0.92)',   accent: '#FFD700' },
    sfox:        { primary: '#FF8C00', glow: 'rgba(255,140,0,0.45)',   bg: 'rgba(14,8,0,0.92)',    accent: '#C0C0C0' },
    spikachu:    { primary: '#FFD700', glow: 'rgba(255,215,0,0.50)',   bg: 'rgba(18,16,0,0.92)',   accent: '#FF6600' },
    sluigi:      { primary: '#4CAF50', glow: 'rgba(76,175,80,0.45)',   bg: 'rgba(4,14,4,0.92)',    accent: '#9C27B0' },
    ssonic:      { primary: '#1E90FF', glow: 'rgba(30,144,255,0.50)',  bg: 'rgba(2,8,18,0.92)',    accent: '#E52222' },
    sjoker:      { primary: '#E52222', glow: 'rgba(229,34,34,0.50)',   bg: 'rgba(4,2,6,0.95)',     accent: '#FFD700' },
    ssephiroth:  { primary: '#C0C0C0', glow: 'rgba(192,192,192,0.35)', bg: 'rgba(4,2,8,0.95)',    accent: '#8B0000' },
    spyra:       { primary: '#FF4500', glow: 'rgba(255,69,0,0.45)',    bg: 'rgba(18,6,2,0.92)',    accent: '#FFD700' },
    smythra:     { primary: '#FFD700', glow: 'rgba(255,215,0,0.45)',   bg: 'rgba(18,16,2,0.92)',   accent: '#FF8C00' },
    sbayonetta:  { primary: '#6A0DAD', glow: 'rgba(106,13,173,0.45)',  bg: 'rgba(8,2,12,0.92)',    accent: '#FFD700' },
    sinkling:    { primary: '#FF6600', glow: 'rgba(255,102,0,0.45)',   bg: 'rgba(18,8,0,0.92)',    accent: '#8B00FF' },
    sridley:     { primary: '#9400D3', glow: 'rgba(148,0,211,0.45)',   bg: 'rgba(8,0,12,0.92)',    accent: '#8B0000' },
    sbyleth:     { primary: '#228B22', glow: 'rgba(34,139,34,0.45)',   bg: 'rgba(4,10,4,0.92)',    accent: '#8B0000' },
    sminmin:     { primary: '#E52222', glow: 'rgba(229,34,34,0.45)',   bg: 'rgba(18,2,2,0.92)',    accent: '#1E90FF' },
    skazuya:     { primary: '#8B0000', glow: 'rgba(139,0,0,0.50)',     bg: 'rgba(12,2,2,0.92)',    accent: '#FFD700' },
    ssora:       { primary: '#4169E1', glow: 'rgba(65,105,225,0.45)',  bg: 'rgba(4,6,18,0.92)',    accent: '#FFD700' },
    dual:        { primary: '#E8B830', glow: 'rgba(232,184,48,0.35)',  bg: 'rgba(14,14,18,0.88)',  accent: '#D4001A' },
    transparent: { primary: '#E8B830', glow: 'rgba(232,184,48,0.25)', bg: 'rgba(14,14,18,0.10)',  accent: '#D4001A' },
  };

  const PAGE_SIZE     = 8;
  const PAGE_INTERVAL = 7000;

  let _page  = 0;
  let _pages = [];
  let _timer = null;

  /* ── Thème ────────────────────────────────────────── */
  function applyTheme(theme) {
    const c = THEME_COLORS[theme] || THEME_COLORS.default;
    const root = document.getElementById('uc-root');
    if (!root) return;
    root.style.setProperty('--uc-primary', c.primary);
    root.style.setProperty('--uc-glow',    c.glow);
    root.style.setProperty('--uc-bg',      c.bg);
    root.style.setProperty('--uc-accent',  c.accent);
  }

  /* ── Layout cadre ─────────────────────────────────── */
  function applyLayout(state) {
    const root = document.getElementById('uc-root');
    if (!root) return;
    const pct   = state.frameWidthPct || 30;
    const ratio = state.frameRatio    || '16:9';
    const fw    = Math.round(1920 * pct / 100);
    const innerW = fw - 72; // 36px padding de chaque côté
    const [rw, rh] = ratio === '4:3' ? [4, 3] : [16, 9];
    const fh = Math.round(innerW * rh / rw);
    root.style.setProperty('--uc-fw', fw + 'px');
    root.style.setProperty('--uc-fh', fh + 'px');
  }

  /* ── Helpers HTML ─────────────────────────────────── */
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderCard(s) {
    const isNext = s.position === 1;
    const bo     = s.totalGames ? `BO${s.totalGames}` : '';
    const p1seed = s.p1.seed != null ? `<span class="uc-seed">#${s.p1.seed}</span>` : '';
    const p2seed = s.p2.seed != null ? `<span class="uc-seed">#${s.p2.seed}</span>` : '';
    const p1pref = s.p1.prefix ? `<span class="uc-prefix">${esc(s.p1.prefix)}</span>` : '';
    const p2pref = s.p2.prefix ? `<span class="uc-prefix">${esc(s.p2.prefix)}</span>` : '';
    const phaseMini = s.phase && s.phase !== s.roundName
      ? `<div class="uc-phase-mini">${esc(s.phase)}${s.group ? ' · ' + esc(s.group) : ''}</div>` : '';

    return `<div class="uc-card${isNext ? ' next-up' : ''}">
      <div class="uc-num">${s.position}</div>
      <div class="uc-player">
        <div class="uc-player-top">${p1pref}<span class="uc-tag">${esc(s.p1.tag)}</span>${p1seed}</div>
      </div>
      <div class="uc-vs">
        <span class="uc-vs-text">VS</span>
        ${bo ? `<span class="uc-bo">${esc(bo)}</span>` : ''}
      </div>
      <div class="uc-player right">
        <div class="uc-player-top">${p2seed}<span class="uc-tag">${esc(s.p2.tag)}</span>${p2pref}</div>
      </div>
      <div class="uc-round">
        <div class="uc-round-name">${esc(s.roundName)}</div>
        ${phaseMini}
      </div>
    </div>`;
  }

  /* ── Carousel ─────────────────────────────────────── */
  function showPage(idx, animate) {
    const viewport = document.getElementById('uc-viewport');
    if (!viewport) return;
    const pages = viewport.querySelectorAll('.uc-page');
    if (!pages.length) return;
    idx = ((idx % pages.length) + pages.length) % pages.length;

    pages.forEach((p, i) => {
      if (i === idx) {
        if (animate && !p.classList.contains('active')) {
          p.style.transition = 'none';
          p.style.opacity    = '0';
          p.style.transform  = 'translateY(18px)';
          p.offsetHeight;
          p.style.transition = '';
        }
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    document.querySelectorAll('.uc-dot').forEach((d, i) => {
      d.classList.toggle('active', i === idx);
    });

    _page = idx;
  }

  function startCarousel(pageCount) {
    clearInterval(_timer);
    _timer = null;
    if (pageCount <= 1) return;
    _timer = setInterval(() => showPage((_page + 1) % pageCount, true), PAGE_INTERVAL);
  }

  /* ── Rendu principal ──────────────────────────────── */
  function render(state) {
    const root       = document.getElementById('uc-root');
    const viewport   = document.getElementById('uc-viewport');
    const phaseLabel = document.getElementById('uc-phase-label');
    const countLabel = document.getElementById('uc-count-label');
    const nav        = document.getElementById('uc-nav');
    if (!root || !viewport) return;

    root.classList.toggle('hidden', state.visible === false);
    applyLayout(state);

    const sets = state.sets || [];

    /* Phase du premier match en header */
    if (phaseLabel) {
      phaseLabel.textContent = sets[0]?.phase || 'PROCHAINS MATCHS';
    }

    /* Compteur */
    if (countLabel) {
      countLabel.textContent = sets.length
        ? sets.length + ' match' + (sets.length > 1 ? 's' : '') + ' en queue'
        : '';
    }

    clearInterval(_timer);

    /* État vide */
    if (!sets.length) {
      viewport.innerHTML = '<div class="uc-page active"><div class="uc-empty">Aucun match en attente</div></div>';
      if (nav) { nav.innerHTML = ''; nav.classList.remove('visible'); }
      return;
    }

    /* Découpage en pages de PAGE_SIZE */
    _pages = [];
    for (let i = 0; i < sets.length; i += PAGE_SIZE) _pages.push(sets.slice(i, i + PAGE_SIZE));

    viewport.innerHTML = _pages.map((page, pi) =>
      `<div class="uc-page${pi === 0 ? ' active' : ''}">${page.map(renderCard).join('')}</div>`
    ).join('');

    /* Dots de navigation */
    if (nav) {
      if (_pages.length > 1) {
        nav.innerHTML = _pages.map((_, i) =>
          `<span class="uc-dot${i === 0 ? ' active' : ''}" data-page="${i}"></span>`
        ).join('');
        nav.classList.add('visible');
        nav.querySelectorAll('.uc-dot').forEach(dot => {
          dot.addEventListener('click', () => {
            clearInterval(_timer);
            showPage(parseInt(dot.dataset.page, 10), true);
            startCarousel(_pages.length);
          });
        });
      } else {
        nav.innerHTML = '';
        nav.classList.remove('visible');
      }
    }

    _page = 0;
    startCarousel(_pages.length);
  }

  /* ── Réseau ───────────────────────────────────────── */
  const socket = io();

  fetch('/api/state').then(r => r.json()).then(s => applyTheme(s.overlayTheme || 'default')).catch(() => {});
  fetch('/api/upcoming').then(r => r.json()).then(render).catch(() => {});

  socket.on('stateUpdate',    s => applyTheme(s.overlayTheme || 'default'));
  socket.on('upcomingUpdate', render);
})();

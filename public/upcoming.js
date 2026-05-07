(function () {
  'use strict';

  /* text: couleur du texte sur le fond primary (clair ou sombre selon luminosité) */
  const THEME_COLORS = {
    default:     { primary: '#E8B830', text: '#0A0A10' },
    cyberpunk:   { primary: '#00F5FF', text: '#0A0A10' },
    synthwave:   { primary: '#FF6EC7', text: '#0A0A10' },
    midnight:    { primary: '#4488FF', text: '#0A0A10' },
    egypt:       { primary: '#D4A017', text: '#0A0A10' },
    city:        { primary: '#A0C4D8', text: '#0A0A10' },
    eco:         { primary: '#6BC96C', text: '#0A0A10' },
    water:       { primary: '#29B6F6', text: '#0A0A10' },
    fire:        { primary: '#FF6B00', text: '#0A0A10' },
    rainbow:     { primary: '#FF6EC7', text: '#0A0A10' },
    trans:       { primary: '#55CDFC', text: '#0A0A10' },
    pan:         { primary: '#FF218C', text: '#0A0A10' },
    bi:          { primary: '#9B59D0', text: '#F0EEF8' },
    lesbian:     { primary: '#FF4500', text: '#0A0A10' },
    plage:       { primary: '#F4D35E', text: '#0A0A10' },
    smario:      { primary: '#E52222', text: '#F0EEF8' },
    sdk:         { primary: '#7B3F00', text: '#F0EEF8' },
    slink:       { primary: '#D4A017', text: '#0A0A10' },
    ssamus:      { primary: '#FF8C00', text: '#0A0A10' },
    sdsamus:     { primary: '#9400D3', text: '#F0EEF8' },
    syoshi:      { primary: '#6BC96C', text: '#0A0A10' },
    skirby:      { primary: '#FF69B4', text: '#0A0A10' },
    sfox:        { primary: '#FF8C00', text: '#0A0A10' },
    spikachu:    { primary: '#FFD700', text: '#0A0A10' },
    sluigi:      { primary: '#4CAF50', text: '#0A0A10' },
    ssonic:      { primary: '#1E90FF', text: '#0A0A10' },
    sjoker:      { primary: '#E52222', text: '#F0EEF8' },
    ssephiroth:  { primary: '#C0C0C0', text: '#0A0A10' },
    spyra:       { primary: '#FF4500', text: '#0A0A10' },
    smythra:     { primary: '#FFD700', text: '#0A0A10' },
    sbayonetta:  { primary: '#6A0DAD', text: '#F0EEF8' },
    sinkling:    { primary: '#FF6600', text: '#0A0A10' },
    sridley:     { primary: '#9400D3', text: '#F0EEF8' },
    sbyleth:     { primary: '#228B22', text: '#F0EEF8' },
    sminmin:     { primary: '#E52222', text: '#F0EEF8' },
    skazuya:     { primary: '#8B0000', text: '#F0EEF8' },
    ssora:       { primary: '#4169E1', text: '#0A0A10' },
    dual:        { primary: '#E8B830', text: '#0A0A10' },
    transparent: { primary: '#E8B830', text: '#0A0A10' },
  };

  const PAGE_INTERVAL = 7000;

  let _page      = 0;
  let _pages     = [];
  let _timer     = null;
  let _textColor = '';

  /* ── Thème ────────────────────────────────────────── */
  function applyTheme(theme) {
    const c    = THEME_COLORS[theme] || THEME_COLORS.default;
    const root = document.getElementById('uc-root');
    if (!root) return;

    const textDark    = c.text === '#0A0A10';
    const muted       = textDark ? 'rgba(10,10,16,0.42)'  : 'rgba(240,238,248,0.45)';
    const border      = textDark ? 'rgba(10,10,16,0.12)'  : 'rgba(240,238,248,0.12)';
    const panelBorder = textDark ? 'rgba(10,10,16,0.35)'  : 'rgba(240,238,248,0.35)';

    root.style.setProperty('--uc-primary',      c.primary);
    root.style.setProperty('--uc-text',         c.text);
    root.style.setProperty('--uc-muted',        muted);
    root.style.setProperty('--uc-border',       border);
    root.style.setProperty('--uc-panel-border', panelBorder);

    /* Le box-shadow remplit tout autour du cadre avec la couleur primaire */
    const frameBox = document.getElementById('uc-frame-box');
    if (frameBox) frameBox.style.boxShadow = `0 0 0 2000px ${c.primary}`;

    /* Le panel droit a son propre fond */
    const panel = document.getElementById('uc-panel');
    if (panel) panel.style.background = c.primary;
  }

  /* ── Calcul dynamique de la taille de page ───────── */
  function computePageSize() {
    const panel = document.getElementById('uc-panel');
    if (!panel) return 8;
    const panelH = panel.getBoundingClientRect().height;
    const CARD_H = 37; // 9px padding-top + 9px padding-bottom + ~18px texte + 1px bordure
    return Math.max(1, Math.floor((panelH - 4) / CARD_H));
  }

  /* ── Couleur texte personnalisée ─────────────────── */
  function applyTextColor(hex) {
    const root = document.getElementById('uc-root');
    if (!root || !hex) return;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    root.style.setProperty('--uc-text',         hex);
    root.style.setProperty('--uc-muted',        `rgba(${r},${g},${b},0.42)`);
    root.style.setProperty('--uc-border',       `rgba(${r},${g},${b},0.12)`);
    root.style.setProperty('--uc-panel-border', `rgba(${r},${g},${b},0.35)`);
  }

  /* ── Layout cadre ─────────────────────────────────── */
  function applyLayout(state) {
    const root = document.getElementById('uc-root');
    if (!root) return;
    const pct    = state.frameWidthPct || 30;
    const ratio  = state.frameRatio    || '16:9';
    const fw     = Math.round(1920 * pct / 100);
    const innerW = fw - 80; // 40px padding de chaque côté
    const [rw, rh] = ratio === '4:3' ? [4, 3] : [16, 9];
    const fh = Math.round(innerW * rh / rw);
    const gw = Math.round(1920 * 5 / 100); // 5% gap
    const rm = Math.round(1920 * 2 / 100); // 2% marge droite
    const pw = 1920 - fw - gw - rm;
    root.style.setProperty('--uc-fw', fw + 'px');
    root.style.setProperty('--uc-fh', fh + 'px');
    root.style.setProperty('--uc-gw', gw + 'px');
    root.style.setProperty('--uc-rm', rm + 'px');
    root.style.setProperty('--uc-pw', pw + 'px');
  }

  /* ── Helpers HTML ─────────────────────────────────── */
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderCard(s) {
    const isNext = s.position === 1;
    const p1 = s.p1.prefix
      ? `<span class="uc-prefix">${esc(s.p1.prefix)}</span> <span class="uc-tag">${esc(s.p1.tag)}</span>`
      : `<span class="uc-tag">${esc(s.p1.tag)}</span>`;
    const p2 = s.p2.prefix
      ? `<span class="uc-tag">${esc(s.p2.tag)}</span> <span class="uc-prefix">${esc(s.p2.prefix)}</span>`
      : `<span class="uc-tag">${esc(s.p2.tag)}</span>`;
    const bo    = s.totalGames ? `BO${s.totalGames}` : '';
    const round = [esc(s.roundName), bo].filter(Boolean).join(' · ');
    return `<div class="uc-card${isNext ? ' next-up' : ''}">
      ${p1}
      <span class="uc-vs-text">vs</span>
      ${p2}
      ${round ? `<span class="uc-round-text">${round}</span>` : ''}
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
          p.style.transform  = 'translateY(12px)';
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
    const frameLabel = document.getElementById('uc-frame-label');
    const nav        = document.getElementById('uc-nav');
    if (!root || !viewport) return;

    root.classList.toggle('hidden', state.visible === false);
    _textColor = state.textColor || '';
    applyLayout(state);
    if (_textColor) applyTextColor(_textColor);

    if (frameLabel) frameLabel.textContent = state.frameLabel || '';

    const sets = state.sets || [];

    if (phaseLabel) {
      phaseLabel.textContent = sets[0]?.phase || 'PROCHAINS MATCHS';
    }
    if (countLabel) {
      countLabel.textContent = sets.length
        ? sets.length + ' match' + (sets.length > 1 ? 's' : '') + ' en queue'
        : '';
    }

    clearInterval(_timer);

    if (!sets.length) {
      viewport.innerHTML = '<div class="uc-page active"><div class="uc-empty">Aucun match en attente</div></div>';
      if (nav) { nav.innerHTML = ''; nav.classList.remove('visible'); }
      return;
    }

    const pageSize = computePageSize();
    _pages = [];
    for (let i = 0; i < sets.length; i += pageSize) _pages.push(sets.slice(i, i + pageSize));

    viewport.innerHTML = _pages.map((page, pi) =>
      `<div class="uc-page${pi === 0 ? ' active' : ''}">${page.map(renderCard).join('')}</div>`
    ).join('');

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

  socket.on('stateUpdate', s => {
    applyTheme(s.overlayTheme || 'default');
    if (_textColor) applyTextColor(_textColor);
  });
  socket.on('upcomingUpdate', render);
})();

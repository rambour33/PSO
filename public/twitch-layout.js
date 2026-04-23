/**
 * twitch-layout.js
 * Overlay Twitch – se connecte via Socket.IO et adapte dynamiquement
 * le cadre + les couleurs au thème choisi dans le panneau de contrôle.
 */
(function () {
  'use strict';

  // ── Couleurs par thème ────────────────────────────────────────
  const THEME_COLORS = {
    default:     { primary: '#E8B830', glow: 'rgba(232,184,48,0.45)',   bg: 'rgba(14,14,18,0.88)',    accent: '#D4001A'  },
    cyberpunk:   { primary: '#00F5FF', glow: 'rgba(0,245,255,0.5)',     bg: 'rgba(5,0,20,0.92)',      accent: '#FF2D78'  },
    synthwave:   { primary: '#FF6EC7', glow: 'rgba(255,110,199,0.5)',   bg: 'rgba(13,0,48,0.92)',     accent: '#C77DFF'  },
    midnight:    { primary: '#4488FF', glow: 'rgba(68,136,255,0.45)',   bg: 'rgba(5,10,30,0.92)',     accent: '#88AAFF'  },
    egypt:       { primary: '#D4A017', glow: 'rgba(212,160,23,0.5)',    bg: 'rgba(18,12,4,0.92)',     accent: '#C0392B'  },
    city:        { primary: '#A0C4D8', glow: 'rgba(160,196,216,0.4)',   bg: 'rgba(8,16,24,0.92)',     accent: '#5A8FAA'  },
    eco:         { primary: '#6BC96C', glow: 'rgba(107,201,108,0.45)',  bg: 'rgba(6,18,6,0.92)',      accent: '#A8E063'  },
    water:       { primary: '#29B6F6', glow: 'rgba(41,182,246,0.45)',   bg: 'rgba(4,16,28,0.92)',     accent: '#0288D1'  },
    fire:        { primary: '#FF6B00', glow: 'rgba(255,107,0,0.55)',    bg: 'rgba(20,5,0,0.92)',      accent: '#FFD700'  },
    rainbow:     { primary: '#FF6EC7', glow: 'rgba(255,110,199,0.4)',   bg: 'rgba(10,0,20,0.88)',     accent: '#00F5FF'  },
    trans:       { primary: '#55CDFC', glow: 'rgba(85,205,252,0.45)',   bg: 'rgba(6,14,22,0.92)',     accent: '#F7A8B8'  },
    pan:         { primary: '#FF218C', glow: 'rgba(255,33,140,0.45)',   bg: 'rgba(18,4,10,0.92)',     accent: '#FFD800'  },
    bi:          { primary: '#9B59D0', glow: 'rgba(155,89,208,0.45)',   bg: 'rgba(12,4,18,0.92)',     accent: '#FF218C'  },
    lesbian:     { primary: '#FF4500', glow: 'rgba(255,69,0,0.45)',     bg: 'rgba(20,8,4,0.92)',      accent: '#FF9A56'  },
    plage:       { primary: '#F4D35E', glow: 'rgba(244,211,94,0.45)',   bg: 'rgba(18,14,4,0.88)',     accent: '#3CAEA3'  },
    // Thèmes personnages Smash
    smario:      { primary: '#E52222', glow: 'rgba(229,34,34,0.5)',     bg: 'rgba(20,4,4,0.92)',      accent: '#FFD700'  },
    sdk:         { primary: '#7B3F00', glow: 'rgba(123,63,0,0.5)',      bg: 'rgba(14,8,2,0.92)',      accent: '#E52222'  },
    slink:       { primary: '#D4A017', glow: 'rgba(212,160,23,0.5)',    bg: 'rgba(14,12,2,0.92)',     accent: '#2E8B57'  },
    ssamus:      { primary: '#FF8C00', glow: 'rgba(255,140,0,0.5)',     bg: 'rgba(14,8,0,0.92)',      accent: '#8B0000'  },
    sdsamus:     { primary: '#9400D3', glow: 'rgba(148,0,211,0.5)',     bg: 'rgba(10,0,14,0.92)',     accent: '#FF8C00'  },
    syoshi:      { primary: '#6BC96C', glow: 'rgba(107,201,108,0.5)',   bg: 'rgba(6,14,6,0.92)',      accent: '#E52222'  },
    skirby:      { primary: '#FF69B4', glow: 'rgba(255,105,180,0.5)',   bg: 'rgba(18,6,12,0.92)',     accent: '#FFD700'  },
    sfox:        { primary: '#FF8C00', glow: 'rgba(255,140,0,0.5)',     bg: 'rgba(14,8,0,0.92)',      accent: '#C0C0C0'  },
    spikachu:    { primary: '#FFD700', glow: 'rgba(255,215,0,0.55)',    bg: 'rgba(18,16,0,0.92)',     accent: '#FF6600'  },
    sluigi:      { primary: '#4CAF50', glow: 'rgba(76,175,80,0.5)',     bg: 'rgba(4,14,4,0.92)',      accent: '#9C27B0'  },
    ssonic:      { primary: '#1E90FF', glow: 'rgba(30,144,255,0.55)',   bg: 'rgba(2,8,18,0.92)',      accent: '#E52222'  },
    sjoker:      { primary: '#E52222', glow: 'rgba(229,34,34,0.55)',    bg: 'rgba(4,2,6,0.95)',       accent: '#FFD700'  },
    ssephiroth:  { primary: '#C0C0C0', glow: 'rgba(192,192,192,0.4)',   bg: 'rgba(4,2,8,0.95)',       accent: '#8B0000'  },
    spyra:       { primary: '#FF4500', glow: 'rgba(255,69,0,0.5)',      bg: 'rgba(18,6,2,0.92)',      accent: '#FFD700'  },
    smythra:     { primary: '#FFD700', glow: 'rgba(255,215,0,0.5)',     bg: 'rgba(18,16,2,0.92)',     accent: '#FF8C00'  },
    sbayonetta:  { primary: '#6A0DAD', glow: 'rgba(106,13,173,0.5)',    bg: 'rgba(8,2,12,0.92)',      accent: '#FFD700'  },
    sinkling:    { primary: '#FF6600', glow: 'rgba(255,102,0,0.5)',     bg: 'rgba(18,8,0,0.92)',      accent: '#8B00FF'  },
    sridley:     { primary: '#9400D3', glow: 'rgba(148,0,211,0.5)',     bg: 'rgba(8,0,12,0.92)',      accent: '#8B0000'  },
    sbyleth:     { primary: '#228B22', glow: 'rgba(34,139,34,0.5)',     bg: 'rgba(4,10,4,0.92)',      accent: '#8B0000'  },
    sminmin:     { primary: '#E52222', glow: 'rgba(229,34,34,0.5)',     bg: 'rgba(18,2,2,0.92)',      accent: '#1E90FF'  },
    skazuya:     { primary: '#8B0000', glow: 'rgba(139,0,0,0.55)',      bg: 'rgba(12,2,2,0.92)',      accent: '#FFD700'  },
    ssora:       { primary: '#4169E1', glow: 'rgba(65,105,225,0.5)',    bg: 'rgba(4,6,18,0.92)',      accent: '#FFD700'  },
    // Dual : sera géré dynamiquement
    dual:        { primary: '#E8B830', glow: 'rgba(232,184,48,0.4)',    bg: 'rgba(14,14,18,0.88)',    accent: '#D4001A'  },
    transparent: { primary: '#E8B830', glow: 'rgba(232,184,48,0.3)',    bg: 'rgba(14,14,18,0.1)',     accent: '#D4001A'  },
  };

  // Fallback pour les thèmes non listés
  function getThemeColors(theme) {
    return THEME_COLORS[theme] || THEME_COLORS.default;
  }

  // ── Application des couleurs au layout ───────────────────────
  function applyColors(colors) {
    const root = document.getElementById('twitch-layout');
    root.style.setProperty('--tw-primary', colors.primary);
    root.style.setProperty('--tw-glow',    colors.glow);
    root.style.setProperty('--tw-bg',      colors.bg);
    root.style.setProperty('--tw-accent',  colors.accent);
  }

  // ── Classes de thème ─────────────────────────────────────────
  const ALL_THEMES = Object.keys(THEME_COLORS);

  function setThemeClass(theme) {
    const root = document.getElementById('twitch-layout');
    ALL_THEMES.forEach(t => root.classList.remove('theme-' + t));
    root.classList.add('theme-' + (theme || 'default'));
  }

  // ── Mise à jour du DOM ────────────────────────────────────────
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '';
  }

  let prevScores = { p1: null, p2: null };

  function animatePop(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('pop');
    void el.offsetWidth; // reflow
    el.classList.add('pop');
  }

  function update(s) {
    // Thème
    const theme = s.overlayTheme || 'default';
    setThemeClass(theme);
    applyColors(getThemeColors(theme));

    // Visibilité
    const root = document.getElementById('twitch-layout');
    root.classList.toggle('hidden', !s.visible);

    // Joueur 1
    const p1 = s.player1 || {};
    setText('tag-p1',  p1.tag  || p1.name || 'Joueur 1');
    setText('name-p1', p1.name || '');
    setText('char-p1', p1.character?.name || '');
    setText('score-p1', p1.score ?? 0);
    setText('vs-score-p1', p1.score ?? 0);

    // Joueur 2
    const p2 = s.player2 || {};
    setText('tag-p2',  p2.tag  || p2.name || 'Joueur 2');
    setText('name-p2', p2.name || '');
    setText('char-p2', p2.character?.name || '');
    setText('score-p2', p2.score ?? 0);
    setText('vs-score-p2', p2.score ?? 0);

    // Animation pop sur changement de score
    if (prevScores.p1 !== null && prevScores.p1 !== p1.score) {
      animatePop('score-p1');
      animatePop('vs-score-p1');
    }
    if (prevScores.p2 !== null && prevScores.p2 !== p2.score) {
      animatePop('score-p2');
      animatePop('vs-score-p2');
    }
    prevScores.p1 = p1.score;
    prevScores.p2 = p2.score;

    // Infos centre
    setText('event-label', s.event || 'PSO');
    setText('round-label',  s.stage || '');

    // Le swap est géré par échange des données player1/player2, pas de flip CSS nécessaire
  }

  // ── postMessage : options live depuis le panneau de contrôle ──
  window.addEventListener('message', (ev) => {
    if (!ev.data || ev.data.type !== 'twitch-option') return;
    const { key, value } = ev.data;
    if (key.startsWith('selector-')) {
      // visibilité d'éléments
      const sel = key.replace('selector-', '');
      document.querySelectorAll(sel).forEach(el => { el.style.display = value; });
    } else {
      // variable CSS
      document.getElementById('twitch-layout').style.setProperty(key, value);
    }
  });

  // ── Viewers ────────────────────────────────────────────────────
  let prevViewers = null;

  function formatViewers(n) {
    if (n === null || n === undefined) return '–';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
    return String(n);
  }

  function updateViewers({ viewers, live }) {
    const widget = document.getElementById('viewer-widget');
    const count  = document.getElementById('viewer-count');
    const dot    = document.getElementById('viewer-dot');
    if (!widget || !count) return;

    widget.classList.toggle('live',    !!live);
    widget.classList.toggle('offline', !live);

    const formatted = formatViewers(viewers);
    if (count.textContent !== formatted) {
      count.textContent = formatted;
      if (prevViewers !== null) {
        count.classList.remove('pop');
        void count.offsetWidth;
        count.classList.add('pop');
      }
    }
    prevViewers = viewers;
  }

  // ── Socket.IO ─────────────────────────────────────────────────
  const socket = io();

  fetch('/api/state').then(r => r.json()).then(s => {
    try { update(s); } catch(e) {}
  }).catch(() => {});

  socket.on('stateUpdate', (s) => {
    try { update(s); } catch(e) { console.error('[twitch-layout]', e); }
  });

  socket.on('twitch-viewers', (data) => {
    try { updateViewers(data); } catch(e) { console.error('[twitch-layout viewers]', e); }
  });

  socket.on('connect', () => {
    console.log('[twitch-layout] connecté');
  });

  socket.on('disconnect', () => {
    console.warn('[twitch-layout] déconnecté');
  });

})();

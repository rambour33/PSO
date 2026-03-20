/**
 * twitch-viewer.js
 * Overlay standalone compteur de viewers Twitch.
 * Reçoit : stateUpdate (thème) + twitch-viewers (count/live)
 */
(function () {
  'use strict';

  // ── Couleurs par thème (identique à twitch-layout.js) ─────────
  const THEME_COLORS = {
    default:     { primary: '#E8B830', glow: 'rgba(232,184,48,0.5)',    bg: 'rgba(14,14,18,0.92)',    accent: '#D4001A'  },
    cyberpunk:   { primary: '#00F5FF', glow: 'rgba(0,245,255,0.55)',    bg: 'rgba(5,0,20,0.95)',      accent: '#FF2D78'  },
    synthwave:   { primary: '#FF6EC7', glow: 'rgba(255,110,199,0.55)',  bg: 'rgba(13,0,48,0.95)',     accent: '#C77DFF'  },
    midnight:    { primary: '#4488FF', glow: 'rgba(68,136,255,0.5)',    bg: 'rgba(5,10,30,0.95)',     accent: '#88AAFF'  },
    egypt:       { primary: '#D4A017', glow: 'rgba(212,160,23,0.55)',   bg: 'rgba(18,12,4,0.95)',     accent: '#C0392B'  },
    city:        { primary: '#A0C4D8', glow: 'rgba(160,196,216,0.45)', bg: 'rgba(8,16,24,0.95)',     accent: '#5A8FAA'  },
    eco:         { primary: '#6BC96C', glow: 'rgba(107,201,108,0.5)',   bg: 'rgba(6,18,6,0.95)',      accent: '#A8E063'  },
    water:       { primary: '#29B6F6', glow: 'rgba(41,182,246,0.5)',    bg: 'rgba(4,16,28,0.95)',     accent: '#0288D1'  },
    fire:        { primary: '#FF6B00', glow: 'rgba(255,107,0,0.6)',     bg: 'rgba(20,5,0,0.95)',      accent: '#FFD700'  },
    rainbow:     { primary: '#FF6EC7', glow: 'rgba(255,110,199,0.45)', bg: 'rgba(10,0,20,0.92)',     accent: '#00F5FF'  },
    trans:       { primary: '#55CDFC', glow: 'rgba(85,205,252,0.5)',    bg: 'rgba(6,14,22,0.95)',     accent: '#F7A8B8'  },
    pan:         { primary: '#FF218C', glow: 'rgba(255,33,140,0.5)',    bg: 'rgba(18,4,10,0.95)',     accent: '#FFD800'  },
    bi:          { primary: '#9B59D0', glow: 'rgba(155,89,208,0.5)',    bg: 'rgba(12,4,18,0.95)',     accent: '#FF218C'  },
    lesbian:     { primary: '#FF4500', glow: 'rgba(255,69,0,0.5)',      bg: 'rgba(20,8,4,0.95)',      accent: '#FF9A56'  },
    plage:       { primary: '#F4D35E', glow: 'rgba(244,211,94,0.5)',    bg: 'rgba(18,14,4,0.92)',     accent: '#3CAEA3'  },
    smario:      { primary: '#E52222', glow: 'rgba(229,34,34,0.55)',    bg: 'rgba(20,4,4,0.95)',      accent: '#FFD700'  },
    sdk:         { primary: '#7B3F00', glow: 'rgba(123,63,0,0.55)',     bg: 'rgba(14,8,2,0.95)',      accent: '#E52222'  },
    slink:       { primary: '#D4A017', glow: 'rgba(212,160,23,0.55)',   bg: 'rgba(14,12,2,0.95)',     accent: '#2E8B57'  },
    ssamus:      { primary: '#FF8C00', glow: 'rgba(255,140,0,0.55)',    bg: 'rgba(14,8,0,0.95)',      accent: '#8B0000'  },
    sdsamus:     { primary: '#9400D3', glow: 'rgba(148,0,211,0.55)',    bg: 'rgba(10,0,14,0.95)',     accent: '#FF8C00'  },
    syoshi:      { primary: '#6BC96C', glow: 'rgba(107,201,108,0.55)', bg: 'rgba(6,14,6,0.95)',      accent: '#E52222'  },
    skirby:      { primary: '#FF69B4', glow: 'rgba(255,105,180,0.55)', bg: 'rgba(18,6,12,0.95)',     accent: '#FFD700'  },
    sfox:        { primary: '#FF8C00', glow: 'rgba(255,140,0,0.55)',    bg: 'rgba(14,8,0,0.95)',      accent: '#C0C0C0'  },
    spikachu:    { primary: '#FFD700', glow: 'rgba(255,215,0,0.6)',     bg: 'rgba(18,16,0,0.95)',     accent: '#FF6600'  },
    sluigi:      { primary: '#4CAF50', glow: 'rgba(76,175,80,0.55)',    bg: 'rgba(4,14,4,0.95)',      accent: '#9C27B0'  },
    ssonic:      { primary: '#1E90FF', glow: 'rgba(30,144,255,0.6)',    bg: 'rgba(2,8,18,0.95)',      accent: '#E52222'  },
    sjoker:      { primary: '#E52222', glow: 'rgba(229,34,34,0.6)',     bg: 'rgba(4,2,6,0.97)',       accent: '#FFD700'  },
    ssephiroth:  { primary: '#C0C0C0', glow: 'rgba(192,192,192,0.45)', bg: 'rgba(4,2,8,0.97)',       accent: '#8B0000'  },
    spyra:       { primary: '#FF4500', glow: 'rgba(255,69,0,0.55)',     bg: 'rgba(18,6,2,0.95)',      accent: '#FFD700'  },
    smythra:     { primary: '#FFD700', glow: 'rgba(255,215,0,0.55)',    bg: 'rgba(18,16,2,0.95)',     accent: '#FF8C00'  },
    sbaylonetta: { primary: '#6A0DAD', glow: 'rgba(106,13,173,0.55)',   bg: 'rgba(8,2,12,0.95)',      accent: '#FFD700'  },
    sinkling:    { primary: '#FF6600', glow: 'rgba(255,102,0,0.55)',    bg: 'rgba(18,8,0,0.95)',      accent: '#8B00FF'  },
    sridley:     { primary: '#9400D3', glow: 'rgba(148,0,211,0.55)',    bg: 'rgba(8,0,12,0.95)',      accent: '#8B0000'  },
    sbyleth:     { primary: '#228B22', glow: 'rgba(34,139,34,0.55)',    bg: 'rgba(4,10,4,0.95)',      accent: '#8B0000'  },
    sminmin:     { primary: '#E52222', glow: 'rgba(229,34,34,0.55)',    bg: 'rgba(18,2,2,0.95)',      accent: '#1E90FF'  },
    skazuya:     { primary: '#8B0000', glow: 'rgba(139,0,0,0.6)',       bg: 'rgba(12,2,2,0.95)',      accent: '#FFD700'  },
    ssora:       { primary: '#4169E1', glow: 'rgba(65,105,225,0.55)',   bg: 'rgba(4,6,18,0.95)',      accent: '#FFD700'  },
    dual:        { primary: '#E8B830', glow: 'rgba(232,184,48,0.45)',   bg: 'rgba(14,14,18,0.92)',    accent: '#D4001A'  },
    transparent: { primary: '#E8B830', glow: 'rgba(232,184,48,0.35)',   bg: 'rgba(14,14,18,0.1)',     accent: '#D4001A'  },
  };

  function getThemeColors(theme) {
    return THEME_COLORS[theme] || THEME_COLORS.default;
  }

  // ── Application du thème ──────────────────────────────────────
  const ALL_THEMES = Object.keys(THEME_COLORS);

  function applyTheme(theme) {
    const root = document.getElementById('viewer-overlay');
    const colors = getThemeColors(theme);

    ALL_THEMES.forEach(t => root.classList.remove('theme-' + t));
    root.classList.add('theme-' + (theme || 'default'));

    root.style.setProperty('--tv-primary', colors.primary);
    root.style.setProperty('--tv-glow',    colors.glow);
    root.style.setProperty('--tv-bg',      colors.bg);
    root.style.setProperty('--tv-accent',  colors.accent);
  }

  // ── Mise à jour des viewers ────────────────────────────────────
  let prevCount = null;

  function formatViewers(n) {
    if (n === null || n === undefined) return '–';
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1).replace('.0', '') + 'k';
    return String(n);
  }

  function updateViewers({ viewers, live }) {
    const overlay = document.getElementById('viewer-overlay');
    const number  = document.getElementById('viewer-number');
    const liveLabel = document.getElementById('live-label');

    overlay.classList.toggle('live',    !!live);
    overlay.classList.toggle('offline', !live);

    liveLabel.textContent = live ? 'EN DIRECT' : 'HORS LIGNE';

    const formatted = formatViewers(viewers);
    if (number.textContent !== formatted) {
      number.textContent = formatted;
      if (prevCount !== null) {
        number.classList.remove('pop');
        void number.offsetWidth;
        number.classList.add('pop');
      }
    }
    prevCount = viewers;
  }

  // ── Socket.IO ─────────────────────────────────────────────────
  const socket = io();

  socket.on('stateUpdate', (s) => {
    try { applyTheme(s.overlayTheme || 'default'); } catch(e) { console.error('[twitch-viewer]', e); }
  });

  socket.on('twitch-viewers', (data) => {
    try { updateViewers(data); } catch(e) { console.error('[twitch-viewer]', e); }
  });

})();

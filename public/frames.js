/**
 * frames.js — Overlay multi-cadres PSO
 * Reçoit : framesUpdate (state) + stateUpdate (thème)
 */
(function () {
  'use strict';

  /* ── Couleurs par thème ──────────────────────────────────────── */
  const THEME_COLORS = {
    default:    { primary: '#E8B830', glow: 'rgba(232,184,48,0.55)',   bg: 'rgba(14,14,18,0.0)'  },
    cyberpunk:  { primary: '#00F5FF', glow: 'rgba(0,245,255,0.6)',     bg: 'rgba(5,0,20,0.0)'    },
    synthwave:  { primary: '#FF6EC7', glow: 'rgba(255,110,199,0.6)',   bg: 'rgba(13,0,48,0.0)'   },
    midnight:   { primary: '#4488FF', glow: 'rgba(68,136,255,0.55)',   bg: 'rgba(5,10,30,0.0)'   },
    egypt:      { primary: '#D4A017', glow: 'rgba(212,160,23,0.6)',    bg: 'rgba(0,0,0,0.0)'     },
    city:       { primary: '#A0C4D8', glow: 'rgba(160,196,216,0.5)',   bg: 'rgba(0,0,0,0.0)'     },
    eco:        { primary: '#6BC96C', glow: 'rgba(107,201,108,0.55)',  bg: 'rgba(0,0,0,0.0)'     },
    water:      { primary: '#29B6F6', glow: 'rgba(41,182,246,0.55)',   bg: 'rgba(0,0,0,0.0)'     },
    fire:       { primary: '#FF6B00', glow: 'rgba(255,107,0,0.65)',    bg: 'rgba(0,0,0,0.0)'     },
    rainbow:    { primary: '#FF6EC7', glow: 'rgba(255,110,199,0.5)',   bg: 'rgba(0,0,0,0.0)'     },
    trans:      { primary: '#55CDFC', glow: 'rgba(85,205,252,0.55)',   bg: 'rgba(0,0,0,0.0)'     },
    pan:        { primary: '#FF218C', glow: 'rgba(255,33,140,0.55)',   bg: 'rgba(0,0,0,0.0)'     },
    bi:         { primary: '#9B59D0', glow: 'rgba(155,89,208,0.55)',   bg: 'rgba(0,0,0,0.0)'     },
    lesbian:    { primary: '#FF4500', glow: 'rgba(255,69,0,0.55)',     bg: 'rgba(0,0,0,0.0)'     },
    plage:      { primary: '#F4D35E', glow: 'rgba(244,211,94,0.55)',   bg: 'rgba(0,0,0,0.0)'     },
    smario:     { primary: '#E52222', glow: 'rgba(229,34,34,0.6)',     bg: 'rgba(0,0,0,0.0)'     },
    sdk:        { primary: '#7B3F00', glow: 'rgba(123,63,0,0.6)',      bg: 'rgba(0,0,0,0.0)'     },
    slink:      { primary: '#D4A017', glow: 'rgba(212,160,23,0.6)',    bg: 'rgba(0,0,0,0.0)'     },
    ssamus:     { primary: '#FF8C00', glow: 'rgba(255,140,0,0.6)',     bg: 'rgba(0,0,0,0.0)'     },
    sdsamus:    { primary: '#9400D3', glow: 'rgba(148,0,211,0.6)',     bg: 'rgba(0,0,0,0.0)'     },
    syoshi:     { primary: '#6BC96C', glow: 'rgba(107,201,108,0.6)',   bg: 'rgba(0,0,0,0.0)'     },
    skirby:     { primary: '#FF69B4', glow: 'rgba(255,105,180,0.6)',   bg: 'rgba(0,0,0,0.0)'     },
    sfox:       { primary: '#FF8C00', glow: 'rgba(255,140,0,0.6)',     bg: 'rgba(0,0,0,0.0)'     },
    spikachu:   { primary: '#FFD700', glow: 'rgba(255,215,0,0.65)',    bg: 'rgba(0,0,0,0.0)'     },
    sluigi:     { primary: '#4CAF50', glow: 'rgba(76,175,80,0.6)',     bg: 'rgba(0,0,0,0.0)'     },
    ssonic:     { primary: '#1E90FF', glow: 'rgba(30,144,255,0.65)',   bg: 'rgba(0,0,0,0.0)'     },
    sjoker:     { primary: '#E52222', glow: 'rgba(229,34,34,0.65)',    bg: 'rgba(0,0,0,0.0)'     },
    ssephiroth: { primary: '#C0C0C0', glow: 'rgba(192,192,192,0.5)',   bg: 'rgba(0,0,0,0.0)'     },
    spyra:      { primary: '#FF4500', glow: 'rgba(255,69,0,0.6)',      bg: 'rgba(0,0,0,0.0)'     },
    smythra:    { primary: '#FFD700', glow: 'rgba(255,215,0,0.6)',     bg: 'rgba(0,0,0,0.0)'     },
    skazuya:    { primary: '#8B0000', glow: 'rgba(139,0,0,0.65)',      bg: 'rgba(0,0,0,0.0)'     },
    ssora:      { primary: '#4169E1', glow: 'rgba(65,105,225,0.6)',    bg: 'rgba(0,0,0,0.0)'     },
    dual:       { primary: '#E8B830', glow: 'rgba(232,184,48,0.5)',    bg: 'rgba(0,0,0,0.0)'     },
    transparent:{ primary: '#E8B830', glow: 'rgba(232,184,48,0.4)',    bg: 'rgba(0,0,0,0.0)'     },
  };

  function getColors(theme) {
    return THEME_COLORS[theme] || THEME_COLORS.default;
  }

  /* ── Application du thème ────────────────────────────────────── */
  const ALL_THEMES = Object.keys(THEME_COLORS);
  let currentTheme = 'default';

  function applyTheme(theme) {
    if (theme === currentTheme) return;
    currentTheme = theme;
    const root = document.documentElement;
    const c = getColors(theme);
    root.style.setProperty('--fr-primary', c.primary);
    root.style.setProperty('--fr-glow',    c.glow);
    // bg: on laisse chaque cadre le gérer individuellement (showBg)

    document.querySelectorAll('.pso-frame').forEach(el => {
      ALL_THEMES.forEach(t => el.classList.remove('theme-' + t));
      el.classList.add('theme-' + (theme || 'default'));
    });
  }

  /* ── Rendu des cadres ────────────────────────────────────────── */
  const DEFAULT_BG_OPACITY = 'rgba(14,14,18,0.65)';

  function applyFrame(el, f, idx) {
    // Visibilité globale
    el.classList.toggle('hidden', !f.visible);

    // Position + taille
    el.style.left   = f.x      + 'px';
    el.style.top    = f.y      + 'px';
    el.style.width  = f.width  + 'px';
    el.style.height = f.height + 'px';

    // Fond (optionnel)
    const inner = el.querySelector('.frame-inner');
    if (inner) {
      const c = getColors(currentTheme);
      const bgOpacity = f.showBg ? DEFAULT_BG_OPACITY : c.bg;
      inner.style.background = bgOpacity;
    }

    // Label
    const label = document.getElementById('frame-label-' + idx);
    if (label) {
      label.textContent = f.label || '';
      label.classList.toggle('visible', !!(f.label && f.label.trim()));
    }
  }

  function applyState(s) {
    const count = s.count || 1;
    const frames = s.frames || [];

    document.querySelectorAll('.pso-frame').forEach((el, idx) => {
      if (idx >= count) {
        el.classList.add('hidden');
        return;
      }
      const fd = frames[idx] || defaultFrame(idx);
      applyFrame(el, fd, idx);
    });
  }

  function defaultFrame(idx) {
    const layouts = [
      { x: 40,  y: 40, width: 560, height: 420 },
      { x: 640, y: 40, width: 560, height: 420 },
      { x: 640, y: 500, width: 560, height: 420 },
    ];
    const l = layouts[idx] || layouts[0];
    return { visible: true, ...l, label: '', showBg: false };
  }

  /* ── Socket.IO ───────────────────────────────────────────────── */
  const socket = io();

  socket.on('stateUpdate',   s => { try { applyTheme(s.overlayTheme || 'default'); } catch(e){} });
  socket.on('framesUpdate',  s => { try { applyState(s); } catch(e){ console.error('[frames]', e); } });

})();

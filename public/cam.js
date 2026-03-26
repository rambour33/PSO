/**
 * cam.js — Overlay caméra PSO
 * Reçoit : camUpdate (state) + stateUpdate (thème)
 */
(function () {
  'use strict';

  // ── Couleurs par thème ────────────────────────────────────────
  const THEME_COLORS = {
    default:    { primary: '#E8B830', glow: 'rgba(232,184,48,0.55)'  },
    cyberpunk:  { primary: '#00F5FF', glow: 'rgba(0,245,255,0.6)'   },
    synthwave:  { primary: '#FF6EC7', glow: 'rgba(255,110,199,0.6)' },
    midnight:   { primary: '#4488FF', glow: 'rgba(68,136,255,0.55)' },
    egypt:      { primary: '#D4A017', glow: 'rgba(212,160,23,0.6)'  },
    city:       { primary: '#A0C4D8', glow: 'rgba(160,196,216,0.5)' },
    eco:        { primary: '#6BC96C', glow: 'rgba(107,201,108,0.55)'},
    water:      { primary: '#29B6F6', glow: 'rgba(41,182,246,0.55)' },
    fire:       { primary: '#FF6B00', glow: 'rgba(255,107,0,0.65)'  },
    rainbow:    { primary: '#FF6EC7', glow: 'rgba(255,110,199,0.5)' },
    trans:      { primary: '#55CDFC', glow: 'rgba(85,205,252,0.55)' },
    pan:        { primary: '#FF218C', glow: 'rgba(255,33,140,0.55)' },
    bi:         { primary: '#9B59D0', glow: 'rgba(155,89,208,0.55)' },
    lesbian:    { primary: '#FF4500', glow: 'rgba(255,69,0,0.55)'   },
    plage:      { primary: '#F4D35E', glow: 'rgba(244,211,94,0.55)' },
    smario:     { primary: '#E52222', glow: 'rgba(229,34,34,0.6)'   },
    ssonic:     { primary: '#1E90FF', glow: 'rgba(30,144,255,0.65)' },
    spikachu:   { primary: '#FFD700', glow: 'rgba(255,215,0,0.65)'  },
    ssephiroth: { primary: '#C0C0C0', glow: 'rgba(192,192,192,0.5)' },
    dual:       { primary: '#E8B830', glow: 'rgba(232,184,48,0.5)'  },
    transparent:{ primary: '#E8B830', glow: 'rgba(232,184,48,0.4)'  },
  };

  function getColors(theme) {
    return THEME_COLORS[theme] || THEME_COLORS.default;
  }

  let currentTheme = 'default';

  function applyTheme(theme) {
    if (theme === currentTheme) return;
    currentTheme = theme;
    const c = getColors(theme);
    document.documentElement.style.setProperty('--cam-primary', c.primary);
    document.documentElement.style.setProperty('--cam-glow',    c.glow);
  }

  // ── Application de l'état cam ─────────────────────────────────
  function applyCamState(s) {
    const root  = document.getElementById('cam-root');
    const label = document.getElementById('cam-label');
    if (!root) return;

    // Visibilité
    root.classList.toggle('hidden', !s.visible);

    // Taille (via CSS vars)
    root.style.setProperty('--cam-w', (s.width  || 360) + 'px');
    root.style.setProperty('--cam-h', (s.height || 270) + 'px');

    // Position (décalages depuis le centre-bas)
    root.style.setProperty('--cam-x', (s.offsetX || 0)  + 'px');
    root.style.setProperty('--cam-y', (s.offsetY || 40) + 'px');

    // Label
    if (label) {
      label.textContent = s.label || 'CAM';
      label.classList.toggle('hidden', !s.showLabel);
    }
  }

  // ── Socket.IO ─────────────────────────────────────────────────
  const socket = io();
  socket.on('stateUpdate', (s) => { try { applyTheme(s.overlayTheme || 'default'); } catch(e) {} });
  socket.on('camUpdate',   (s) => { try { applyCamState(s); } catch(e) { console.error('[cam]', e); } });

  // État initial
  fetch('/api/cam').then(r => r.json()).then(applyCamState).catch(() => {});

})();

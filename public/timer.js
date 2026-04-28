/**
 * timer.js — Overlay Timer PSO
 * Reçoit : stateUpdate (thème) + timerUpdate (état timer)
 */
(function () {
  'use strict';

  // ── Couleurs par thème ────────────────────────────────────────
  const THEME_COLORS = {
    default:    { primary:'#E8B830', glow:'rgba(232,184,48,0.55)',   bg:'rgba(14,14,18,0.92)'   },
    cyberpunk:  { primary:'#00F5FF', glow:'rgba(0,245,255,0.6)',     bg:'rgba(5,0,20,0.94)'     },
    synthwave:  { primary:'#FF6EC7', glow:'rgba(255,110,199,0.6)',   bg:'rgba(13,0,48,0.94)'    },
    midnight:   { primary:'#4488FF', glow:'rgba(68,136,255,0.55)',   bg:'rgba(5,10,30,0.94)'    },
    egypt:      { primary:'#D4A017', glow:'rgba(212,160,23,0.55)',   bg:'rgba(18,12,4,0.94)'    },
    city:       { primary:'#A0C4D8', glow:'rgba(160,196,216,0.45)', bg:'rgba(8,16,24,0.94)'    },
    eco:        { primary:'#6BC96C', glow:'rgba(107,201,108,0.55)', bg:'rgba(6,18,6,0.94)'     },
    water:      { primary:'#29B6F6', glow:'rgba(41,182,246,0.55)',  bg:'rgba(4,16,28,0.94)'    },
    fire:       { primary:'#FF6B00', glow:'rgba(255,107,0,0.65)',   bg:'rgba(20,5,0,0.94)'     },
    rainbow:    { primary:'#FF6EC7', glow:'rgba(255,110,199,0.5)',  bg:'rgba(10,0,20,0.92)'    },
    trans:      { primary:'#55CDFC', glow:'rgba(85,205,252,0.55)',  bg:'rgba(6,14,22,0.94)'    },
    pan:        { primary:'#FF218C', glow:'rgba(255,33,140,0.55)',  bg:'rgba(18,4,10,0.94)'    },
    bi:         { primary:'#9B59D0', glow:'rgba(155,89,208,0.55)',  bg:'rgba(12,4,18,0.94)'    },
    lesbian:    { primary:'#FF4500', glow:'rgba(255,69,0,0.55)',    bg:'rgba(20,8,4,0.94)'     },
    plage:      { primary:'#F4D35E', glow:'rgba(244,211,94,0.55)',  bg:'rgba(18,14,4,0.92)'    },
    smario:     { primary:'#E52222', glow:'rgba(229,34,34,0.6)',    bg:'rgba(20,4,4,0.94)'     },
    sdk:        { primary:'#7B3F00', glow:'rgba(123,63,0,0.6)',     bg:'rgba(14,8,2,0.94)'     },
    slink:      { primary:'#D4A017', glow:'rgba(212,160,23,0.6)',   bg:'rgba(14,12,2,0.94)'    },
    ssamus:     { primary:'#FF8C00', glow:'rgba(255,140,0,0.6)',    bg:'rgba(14,8,0,0.94)'     },
    sdsamus:    { primary:'#9400D3', glow:'rgba(148,0,211,0.6)',    bg:'rgba(10,0,14,0.94)'    },
    syoshi:     { primary:'#6BC96C', glow:'rgba(107,201,108,0.55)', bg:'rgba(6,14,6,0.94)'     },
    skirby:     { primary:'#FF69B4', glow:'rgba(255,105,180,0.55)', bg:'rgba(18,6,12,0.94)'    },
    sfox:       { primary:'#FF8C00', glow:'rgba(255,140,0,0.55)',   bg:'rgba(14,8,0,0.94)'     },
    spikachu:   { primary:'#FFD700', glow:'rgba(255,215,0,0.65)',   bg:'rgba(18,16,0,0.94)'    },
    sluigi:     { primary:'#4CAF50', glow:'rgba(76,175,80,0.6)',    bg:'rgba(4,14,4,0.94)'     },
    ssonic:     { primary:'#1E90FF', glow:'rgba(30,144,255,0.65)',  bg:'rgba(2,8,18,0.94)'     },
    sjoker:     { primary:'#E52222', glow:'rgba(229,34,34,0.65)',   bg:'rgba(4,2,6,0.96)'      },
    ssephiroth: { primary:'#C0C0C0', glow:'rgba(192,192,192,0.45)', bg:'rgba(4,2,8,0.96)'      },
    spyra:      { primary:'#FF4500', glow:'rgba(255,69,0,0.6)',     bg:'rgba(18,6,2,0.94)'     },
    smythra:    { primary:'#FFD700', glow:'rgba(255,215,0,0.6)',    bg:'rgba(18,16,2,0.94)'    },
    skazuya:    { primary:'#8B0000', glow:'rgba(139,0,0,0.65)',     bg:'rgba(12,2,2,0.94)'     },
    ssora:      { primary:'#4169E1', glow:'rgba(65,105,225,0.6)',   bg:'rgba(4,6,18,0.94)'     },
    dual:       { primary:'#E8B830', glow:'rgba(232,184,48,0.5)',   bg:'rgba(14,14,18,0.92)'   },
    transparent:{ primary:'#E8B830', glow:'rgba(232,184,48,0.4)',   bg:'rgba(14,14,18,0.75)'   },
  };

  function getColors(theme) {
    return THEME_COLORS[theme] || THEME_COLORS.default;
  }

  // ── Application du thème ──────────────────────────────────────
  const ALL_THEMES = Object.keys(THEME_COLORS);
  let currentTheme = 'default';

  function applyTheme(theme) {
    currentTheme = theme;
    const root = document.getElementById('timer-root');
    const c = getColors(theme);
    ALL_THEMES.forEach(t => root.classList.remove('theme-' + t));
    root.classList.add('theme-' + (theme || 'default'));
    root.style.setProperty('--tm-primary', c.primary);
    root.style.setProperty('--tm-glow',    c.glow);
    root.style.setProperty('--tm-bg',      c.bg);
    updateParticles();
  }

  // ── Particules ────────────────────────────────────────────────
  let PS = null;

  function initParticles() {
    if (typeof createParticleSystem === 'function') {
      PS = createParticleSystem('timer-particle-canvas', 'timer-body');
      PS.init();
    }
  }

  function updateParticles() {
    if (!PS) return;
    const enabled    = _state?.particlesEnabled ?? false;
    const countScale = (_state?.particleCountScale ?? 100) / 100;

    if (!enabled) {
      PS.stop();
      return;
    }

    // Appliquer le scale avant de (re)démarrer
    if (Math.abs(PS.countScale - countScale) > 0.01) {
      PS.setCountScale(countScale);
    }

    const theme = currentTheme || 'default';
    const tp = (typeof THEME_PARTICLES !== 'undefined') ? THEME_PARTICLES[theme] : null;
    if (!tp) { PS.stop(); return; }

    if (PS.type !== tp.type) {
      PS.start(tp.type, tp.count);
    }
  }

  // ── État local du timer ───────────────────────────────────────
  let _state = null;
  let _rafId = null;

  // ── Formattage du temps ───────────────────────────────────────
  function formatTime(totalSeconds, showMillis) {
    const neg = totalSeconds < 0;
    const abs = Math.abs(totalSeconds);

    if (showMillis) {
      const ms    = Math.floor((abs % 1) * 100);
      const secs  = Math.floor(abs) % 60;
      const mins  = Math.floor(abs / 60) % 60;
      const hrs   = Math.floor(abs / 3600);
      if (hrs > 0) {
        return (neg ? '-' : '') + pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + '.' + pad(ms);
      }
      return (neg ? '-' : '') + pad(mins) + ':' + pad(secs) + '.' + pad(ms);
    }

    const secs = Math.floor(abs) % 60;
    const mins = Math.floor(abs / 60) % 60;
    const hrs  = Math.floor(abs / 3600);
    if (hrs > 0) {
      return (neg ? '-' : '') + pad(hrs) + ':' + pad(mins) + ':' + pad(secs);
    }
    return (neg ? '-' : '') + pad(mins) + ':' + pad(secs);
  }

  function pad(n) { return String(Math.floor(n)).padStart(2, '0'); }

  // ── Calcul du temps courant ───────────────────────────────────
  function getCurrentSeconds(state) {
    const now = Date.now();
    const running = state.running;
    const elapsed = state.elapsed || 0;
    const startedAt = state.startedAt || now;
    const liveElapsed = running ? elapsed + (now - startedAt) / 1000 : elapsed;

    if (state.mode === 'countdown') {
      return (state.duration || 0) - liveElapsed;
    }
    return liveElapsed;
  }

  // ── Rendu RAF ─────────────────────────────────────────────────
  function startRaf() {
    if (_rafId) cancelAnimationFrame(_rafId);
    function step() {
      render();
      _rafId = requestAnimationFrame(step);
    }
    _rafId = requestAnimationFrame(step);
  }

  function stopRaf() {
    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  }

  function render() {
    if (!_state) return;
    const root   = document.getElementById('timer-root');
    const digits = document.getElementById('timer-digits');
    if (!root || !digits) return;

    let secs = getCurrentSeconds(_state);

    if (_state.mode === 'countdown' && secs <= 0) {
      digits.textContent = formatTime(0, _state.showMillis);
      root.classList.remove('alert', 'running');
      stopRaf();
      return;
    }

    digits.textContent = formatTime(secs, _state.showMillis);

    // Alert : countdown < alertAt
    const isAlert = _state.mode === 'countdown' && secs <= (_state.alertAt || 60);
    root.classList.toggle('alert', isAlert);
  }

  // ── Application de l'état complet ────────────────────────────
  function applyTimerState(s) {
    const prevEnabled    = _state?.particlesEnabled;
    const prevCountScale = _state?.particleCountScale;
    _state = s;

    // Mise à jour des particules si les paramètres ont changé
    if (s.particlesEnabled !== prevEnabled || s.particleCountScale !== prevCountScale) {
      updateParticles();
    }
    const root   = document.getElementById('timer-root');
    const label  = document.getElementById('timer-label');
    const digits = document.getElementById('timer-digits');
    if (!root) return;

    // Visibilité
    root.classList.toggle('hidden', !s.visible);

    // Position
    root.style.left = (s.posX || 960) + 'px';
    root.style.top  = (s.posY || 540) + 'px';

    // Label
    if (label) {
      label.textContent = (s.label || 'TIMER').toUpperCase();
      root.classList.toggle('no-label', !s.showLabel);
    }

    // Style
    root.classList.remove('style-minimal', 'style-big', 'style-default');
    root.classList.add('style-' + (s.style || 'default'));

    // Taille de police personnalisée
    if (digits && s.fontSize) {
      digits.style.fontSize = s.fontSize + 'px';
    }

    // Running state pour animations
    root.classList.toggle('running', !!s.running);

    // RAF
    if (s.visible && (s.running || s.mode === 'countdown' || s.elapsed > 0)) {
      startRaf();
    } else if (!s.visible) {
      stopRaf();
    } else {
      // Statique mais visible : un seul rendu
      stopRaf();
      render();
    }
  }

  // ── Socket.IO ─────────────────────────────────────────────────
  const socket = io();

  socket.on('stateUpdate',  (s) => { try { applyTheme(s.overlayTheme || 'default'); } catch(e) {} });
  socket.on('timerUpdate',  (s) => { try { applyTimerState(s); } catch(e) { console.error('[timer]', e); } });

  // Chargement initial
  initParticles();
  fetch('/api/timer').then(r => r.json()).then(applyTimerState).catch(() => {});
  fetch('/api/state').then(r => r.json()).then(s => { try { applyTheme(s.overlayTheme || 'default'); } catch(e) {} }).catch(() => {});

})();

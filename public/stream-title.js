/**
 * stream-title.js — Titre du stream PSO
 * Reçoit : titleUpdate (state) + stateUpdate (thème)
 */
(function () {
  'use strict';

  /* ── Couleurs par thème ──────────────────────────────────────── */
  const THEME_COLORS = {
    default:    { primary:'#E8B830', glow:'rgba(232,184,48,0.55)',   bg:'rgba(14,14,18,0.94)'  },
    cyberpunk:  { primary:'#00F5FF', glow:'rgba(0,245,255,0.6)',     bg:'rgba(5,0,20,0.96)'    },
    synthwave:  { primary:'#FF6EC7', glow:'rgba(255,110,199,0.6)',   bg:'rgba(13,0,48,0.96)'   },
    midnight:   { primary:'#4488FF', glow:'rgba(68,136,255,0.55)',   bg:'rgba(5,10,30,0.96)'   },
    egypt:      { primary:'#D4A017', glow:'rgba(212,160,23,0.6)',    bg:'rgba(18,12,4,0.96)'   },
    city:       { primary:'#A0C4D8', glow:'rgba(160,196,216,0.5)',   bg:'rgba(8,16,24,0.96)'   },
    eco:        { primary:'#6BC96C', glow:'rgba(107,201,108,0.55)',  bg:'rgba(6,18,6,0.96)'    },
    water:      { primary:'#29B6F6', glow:'rgba(41,182,246,0.55)',   bg:'rgba(4,16,28,0.96)'   },
    fire:       { primary:'#FF6B00', glow:'rgba(255,107,0,0.65)',    bg:'rgba(20,5,0,0.96)'    },
    rainbow:    { primary:'#FF6EC7', glow:'rgba(255,110,199,0.5)',   bg:'rgba(10,0,20,0.94)'   },
    trans:      { primary:'#55CDFC', glow:'rgba(85,205,252,0.55)',   bg:'rgba(6,14,22,0.96)'   },
    pan:        { primary:'#FF218C', glow:'rgba(255,33,140,0.55)',   bg:'rgba(18,4,10,0.96)'   },
    bi:         { primary:'#9B59D0', glow:'rgba(155,89,208,0.55)',   bg:'rgba(12,4,18,0.96)'   },
    lesbian:    { primary:'#FF4500', glow:'rgba(255,69,0,0.55)',     bg:'rgba(20,8,4,0.96)'    },
    plage:      { primary:'#F4D35E', glow:'rgba(244,211,94,0.55)',   bg:'rgba(18,14,4,0.94)'   },
    smario:     { primary:'#E52222', glow:'rgba(229,34,34,0.6)',     bg:'rgba(20,4,4,0.96)'    },
    sdk:        { primary:'#7B3F00', glow:'rgba(123,63,0,0.6)',      bg:'rgba(14,8,2,0.96)'    },
    slink:      { primary:'#D4A017', glow:'rgba(212,160,23,0.6)',    bg:'rgba(14,12,2,0.96)'   },
    ssamus:     { primary:'#FF8C00', glow:'rgba(255,140,0,0.6)',     bg:'rgba(14,8,0,0.96)'    },
    sdsamus:    { primary:'#9400D3', glow:'rgba(148,0,211,0.6)',     bg:'rgba(10,0,14,0.96)'   },
    syoshi:     { primary:'#6BC96C', glow:'rgba(107,201,108,0.6)',   bg:'rgba(6,14,6,0.96)'    },
    skirby:     { primary:'#FF69B4', glow:'rgba(255,105,180,0.6)',   bg:'rgba(18,6,12,0.96)'   },
    sfox:       { primary:'#FF8C00', glow:'rgba(255,140,0,0.6)',     bg:'rgba(14,8,0,0.96)'    },
    spikachu:   { primary:'#FFD700', glow:'rgba(255,215,0,0.65)',    bg:'rgba(18,16,0,0.96)'   },
    sluigi:     { primary:'#4CAF50', glow:'rgba(76,175,80,0.6)',     bg:'rgba(4,14,4,0.96)'    },
    ssonic:     { primary:'#1E90FF', glow:'rgba(30,144,255,0.65)',   bg:'rgba(2,8,18,0.96)'    },
    sjoker:     { primary:'#E52222', glow:'rgba(229,34,34,0.65)',    bg:'rgba(4,2,6,0.98)'     },
    ssephiroth: { primary:'#C0C0C0', glow:'rgba(192,192,192,0.5)',   bg:'rgba(4,2,8,0.98)'     },
    spyra:      { primary:'#FF4500', glow:'rgba(255,69,0,0.6)',      bg:'rgba(18,6,2,0.96)'    },
    smythra:    { primary:'#FFD700', glow:'rgba(255,215,0,0.6)',     bg:'rgba(18,16,2,0.96)'   },
    skazuya:    { primary:'#8B0000', glow:'rgba(139,0,0,0.65)',      bg:'rgba(12,2,2,0.96)'    },
    ssora:      { primary:'#4169E1', glow:'rgba(65,105,225,0.6)',    bg:'rgba(4,6,18,0.96)'    },
    dual:       { primary:'#E8B830', glow:'rgba(232,184,48,0.5)',    bg:'rgba(14,14,18,0.94)'  },
    transparent:{ primary:'#E8B830', glow:'rgba(232,184,48,0.4)',    bg:'rgba(14,14,18,0.5)'   },
  };

  const ALL_THEMES = Object.keys(THEME_COLORS);
  let currentTheme = 'default';

  function getC(theme) { return THEME_COLORS[theme] || THEME_COLORS.default; }

  /* ── Application du thème ────────────────────────────────────── */
  function applyTheme(theme) {
    if (theme === currentTheme) return;
    currentTheme = theme;
    const root = document.documentElement;
    const c = getC(theme);
    root.style.setProperty('--st-primary', c.primary);
    root.style.setProperty('--st-glow',    c.glow);
    root.style.setProperty('--st-bg',      c.bg);

    const el = document.getElementById('title-root');
    if (!el) return;
    ALL_THEMES.forEach(t => el.classList.remove('theme-' + t));
    el.classList.add('theme-' + (theme || 'default'));
  }

  /* ── Position ────────────────────────────────────────────────── */
  const CANVAS_W = 1920, CANVAS_H = 1080, PAD = 60;

  function setPosition(el, s) {
    const mw = s.maxWidth || 700;
    // Réinitialiser
    el.style.left = el.style.right = el.style.top = el.style.bottom = '';

    switch (s.position) {
      case 'tl':
        el.style.left = PAD + 'px';
        el.style.top  = PAD + 'px';
        break;
      case 'tc':
        el.style.left = Math.round((CANVAS_W - mw) / 2) + 'px';
        el.style.top  = PAD + 'px';
        break;
      case 'tr':
        el.style.right = PAD + 'px';
        el.style.top   = PAD + 'px';
        break;
      case 'ml':
        el.style.left = PAD + 'px';
        el.style.top  = Math.round((CANVAS_H - 120) / 2) + 'px';
        break;
      case 'mc':
        el.style.left = Math.round((CANVAS_W - mw) / 2) + 'px';
        el.style.top  = Math.round((CANVAS_H - 120) / 2) + 'px';
        break;
      case 'mr':
        el.style.right = PAD + 'px';
        el.style.top   = Math.round((CANVAS_H - 120) / 2) + 'px';
        break;
      case 'bl':
        el.style.left   = PAD + 'px';
        el.style.bottom = PAD + 'px';
        break;
      case 'bc':
        el.style.left   = Math.round((CANVAS_W - mw) / 2) + 'px';
        el.style.bottom = PAD + 'px';
        break;
      case 'br':
        el.style.right  = PAD + 'px';
        el.style.bottom = PAD + 'px';
        break;
      case 'custom':
        el.style.left = (s.x || 0) + 'px';
        el.style.top  = (s.y || 0) + 'px';
        break;
      default:
        el.style.left = PAD + 'px';
        el.style.top  = PAD + 'px';
    }
  }

  /* ── Application de l'état ──────────────────────────────────── */
  const ANIMS = ['anim-slide','anim-drop','anim-bounce','anim-fade','anim-none'];

  function applyState(s) {
    const root     = document.getElementById('title-root');
    const txtEl    = document.getElementById('title-text');
    const subEl    = document.getElementById('title-sub');
    const tagEl    = document.getElementById('title-tag');
    if (!root) return;

    /* Visibilité */
    /* On retire visible brièvement si le titre change pour retriggerer l'anim */
    root.classList.toggle('visible', !!s.visible);

    /* Textes */
    if (txtEl) txtEl.textContent = s.title || '';
    if (subEl) {
      subEl.textContent = s.subtitle || '';
      subEl.classList.toggle('hidden', !s.showSubtitle || !s.subtitle);
    }
    if (tagEl) {
      tagEl.textContent = s.tag || 'LIVE';
      tagEl.classList.toggle('hidden', !s.showTag);
    }

    /* Position */
    setPosition(root, s);
    root.style.setProperty('--st-max-w', (s.maxWidth || 700) + 'px');

    /* Tailles de police */
    root.style.setProperty('--st-fs',     (s.fontSize    || 38) + 'px');
    root.style.setProperty('--st-fs-sub', (s.fontSizeSub || 17) + 'px');

    /* Opacité fond */
    const op = Math.max(0, Math.min(100, s.bgOpacity ?? 94)) / 100;
    const c  = getC(currentTheme);
    const bg = c.bg.replace(/[\d.]+\)$/, op + ')');
    root.style.setProperty('--st-bg', bg);

    /* Animation */
    ANIMS.forEach(a => root.classList.remove(a));
    root.classList.add('anim-' + (s.animation || 'slide'));

    /* Alignement */
    root.classList.remove('align-left', 'align-center', 'align-right');
    root.classList.add('align-' + (s.align || 'left'));
  }

  /* ── Socket.IO ───────────────────────────────────────────────── */
  const socket = io();
  socket.on('stateUpdate',  s => { try { applyTheme(s.overlayTheme || 'default'); } catch(e) {} });
  socket.on('titleUpdate',  s => { try { applyState(s); } catch(e) { console.error('[stream-title]', e); } });

})();

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

  let currentTheme  = 'default';
  let currentCam    = {};
  let currentMatch  = {};

  function applyTheme(theme) {
    if (theme === currentTheme) return;
    currentTheme = theme;
    const c = getColors(theme);
    document.documentElement.style.setProperty('--cam-primary', c.primary);
    document.documentElement.style.setProperty('--cam-glow',    c.glow);
  }

  // ── Helpers ───────────────────────────────────────────────────
  function el(id) { return document.getElementById(id); }
  function show(id, visible) { el(id)?.classList.toggle('hidden', !visible); }
  function setText(id, txt) { const e = el(id); if (e) e.textContent = txt || ''; }

  // ── Info joueur ───────────────────────────────────────────────
  function applyInfoSlot(p, player) {
    const cam    = currentCam;
    const fields = cam.infoFields || {};

    // Tag
    show('cam-info-tag-' + p, !!fields.tag);
    setText('cam-info-tag-' + p, fields.tag && player.tag ? '[' + player.tag + ']' : '');

    // Nom
    show('cam-info-name-' + p, !!fields.name);
    setText('cam-info-name-' + p, fields.name ? (player.name || '') : '');

    // Pronoms
    show('cam-info-pronouns-' + p, !!(fields.pronouns && player.pronouns));
    setText('cam-info-pronouns-' + p, fields.pronouns ? (player.pronouns || '') : '');

    // Seed
    const seedTxt = player.seeding != null ? '#' + player.seeding : '';
    show('cam-info-seed-' + p, !!(fields.seed && seedTxt));
    setText('cam-info-seed-' + p, fields.seed ? seedTxt : '');

    // Social (premier non-vide des socials)
    const socialEl = el('cam-info-social-' + p);
    if (socialEl) {
      let socialTxt = '';
      if (fields.social) {
        const socials = player.socials || [];
        socialTxt = socials.find(s => s && s.trim()) || '';
      }
      socialEl.textContent = socialTxt;
    }

    // Personnage (stock icon)
    const charImg = el('cam-info-char-' + p);
    if (charImg) {
      const showChar = !!(fields.character && player.character?.name);
      charImg.classList.toggle('hidden', !showChar);
      if (showChar) {
        const color = String(player.character.color || 0).padStart(2, '0');
        charImg.src = '/Stock Icons/chara_2_' + player.character.name + '_' + color + '.png';
      }
    }
  }

  function applyInfo() {
    const cam   = currentCam;
    const match = currentMatch;
    const info  = el('cam-info');
    if (!info) return;

    const show2 = cam.infoPlayer === 'both';
    const showP1 = cam.infoPlayer === 'p1' || show2;
    const showP2 = cam.infoPlayer === 'p2' || show2;

    info.classList.toggle('hidden', !cam.infoVisible);
    info.classList.toggle('above', cam.infoPosition === 'above');

    el('cam-info-slot-p1')?.classList.toggle('hidden', !showP1);
    el('cam-info-slot-p2')?.classList.toggle('hidden', !showP2);
    el('cam-info-sep')?.classList.toggle('hidden', !show2);

    // Taille de police + opacité bg
    info.style.setProperty('--cam-info-fs', (cam.infoFontSize || 13) + 'px');
    info.style.setProperty('--cam-info-bg-opacity', ((cam.infoBgOpacity ?? 85) / 100).toFixed(2));
    const charSize = Math.round((cam.infoFontSize || 13) * 2.8);
    info.style.setProperty('--cam-info-char-size', charSize + 'px');

    if (showP1 && match.player1) applyInfoSlot('p1', match.player1);
    if (showP2 && match.player2) applyInfoSlot('p2', match.player2);
  }

  // ── Application de l'état cam ─────────────────────────────────
  function applyCamState(s) {
    currentCam = { ...currentCam, ...s };
    const root  = el('cam-root');
    const label = el('cam-label');
    if (!root) return;

    root.classList.toggle('hidden', !s.visible);
    root.style.setProperty('--cam-w', (s.width  || 360) + 'px');
    root.style.setProperty('--cam-h', (s.height || 270) + 'px');
    root.style.setProperty('--cam-x', (s.offsetX || 0)  + 'px');
    root.style.setProperty('--cam-y', (s.offsetY || 40) + 'px');

    if (label) {
      label.textContent = s.label || 'CAM';
      label.classList.toggle('hidden', !s.showLabel);
    }

    applyInfo();
  }

  // ── Socket.IO ─────────────────────────────────────────────────
  const socket = io();
  socket.on('stateUpdate', (s) => {
    try {
      applyTheme(s.overlayTheme || 'default');
      currentMatch = s;
      applyInfo();
    } catch(e) {}
  });
  socket.on('camUpdate', (s) => { try { applyCamState(s); } catch(e) { console.error('[cam]', e); } });

  // État initial
  Promise.all([
    fetch('/api/cam').then(r => r.json()),
    fetch('/api/state').then(r => r.json()),
  ]).then(([camState, matchState]) => {
    currentMatch = matchState;
    applyTheme(matchState.overlayTheme || 'default');
    applyCamState(camState);
  }).catch(() => {
    fetch('/api/cam').then(r => r.json()).then(applyCamState).catch(() => {});
  });

})();

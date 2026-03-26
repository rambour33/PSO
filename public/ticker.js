/**
 * ticker.js — Bandeau défilant PSO
 * Reçoit : tickerUpdate (state) + stateUpdate (thème)
 */
(function () {
  'use strict';

  // ── Couleurs par thème ────────────────────────────────────────
  const THEME_COLORS = {
    default:    { primary:'#E8B830', glow:'rgba(232,184,48,0.5)',   bg:'rgba(14,14,18,0.94)',   bgSolid:'#0E0E12' },
    cyberpunk:  { primary:'#00F5FF', glow:'rgba(0,245,255,0.55)',   bg:'rgba(5,0,20,0.96)',     bgSolid:'#050014' },
    synthwave:  { primary:'#FF6EC7', glow:'rgba(255,110,199,0.55)', bg:'rgba(13,0,48,0.96)',    bgSolid:'#0D0030' },
    midnight:   { primary:'#4488FF', glow:'rgba(68,136,255,0.5)',   bg:'rgba(5,10,30,0.96)',    bgSolid:'#050A1E' },
    egypt:      { primary:'#D4A017', glow:'rgba(212,160,23,0.55)', bg:'rgba(18,12,4,0.96)',    bgSolid:'#120C04' },
    city:       { primary:'#A0C4D8', glow:'rgba(160,196,216,0.4)', bg:'rgba(8,16,24,0.96)',    bgSolid:'#081018' },
    eco:        { primary:'#6BC96C', glow:'rgba(107,201,108,0.5)', bg:'rgba(6,18,6,0.96)',     bgSolid:'#061206' },
    water:      { primary:'#29B6F6', glow:'rgba(41,182,246,0.5)',  bg:'rgba(4,16,28,0.96)',    bgSolid:'#04101C' },
    fire:       { primary:'#FF6B00', glow:'rgba(255,107,0,0.6)',   bg:'rgba(20,5,0,0.96)',     bgSolid:'#140500' },
    rainbow:    { primary:'#FF6EC7', glow:'rgba(255,110,199,0.45)',bg:'rgba(10,0,20,0.94)',    bgSolid:'#0A0014' },
    trans:      { primary:'#55CDFC', glow:'rgba(85,205,252,0.5)',  bg:'rgba(6,14,22,0.96)',    bgSolid:'#060E16' },
    pan:        { primary:'#FF218C', glow:'rgba(255,33,140,0.5)',  bg:'rgba(18,4,10,0.96)',    bgSolid:'#12040A' },
    bi:         { primary:'#9B59D0', glow:'rgba(155,89,208,0.5)',  bg:'rgba(12,4,18,0.96)',    bgSolid:'#0C0412' },
    lesbian:    { primary:'#FF4500', glow:'rgba(255,69,0,0.5)',    bg:'rgba(20,8,4,0.96)',     bgSolid:'#140804' },
    plage:      { primary:'#F4D35E', glow:'rgba(244,211,94,0.5)',  bg:'rgba(18,14,4,0.94)',    bgSolid:'#120E04' },
    smario:     { primary:'#E52222', glow:'rgba(229,34,34,0.55)',  bg:'rgba(20,4,4,0.96)',     bgSolid:'#140404' },
    sdk:        { primary:'#7B3F00', glow:'rgba(123,63,0,0.55)',   bg:'rgba(14,8,2,0.96)',     bgSolid:'#0E0802' },
    slink:      { primary:'#D4A017', glow:'rgba(212,160,23,0.55)', bg:'rgba(14,12,2,0.96)',    bgSolid:'#0E0C02' },
    ssamus:     { primary:'#FF8C00', glow:'rgba(255,140,0,0.55)',  bg:'rgba(14,8,0,0.96)',     bgSolid:'#0E0800' },
    sdsamus:    { primary:'#9400D3', glow:'rgba(148,0,211,0.55)',  bg:'rgba(10,0,14,0.96)',    bgSolid:'#0A000E' },
    syoshi:     { primary:'#6BC96C', glow:'rgba(107,201,108,0.5)', bg:'rgba(6,14,6,0.96)',     bgSolid:'#060E06' },
    skirby:     { primary:'#FF69B4', glow:'rgba(255,105,180,0.5)', bg:'rgba(18,6,12,0.96)',    bgSolid:'#12060C' },
    sfox:       { primary:'#FF8C00', glow:'rgba(255,140,0,0.5)',   bg:'rgba(14,8,0,0.96)',     bgSolid:'#0E0800' },
    spikachu:   { primary:'#FFD700', glow:'rgba(255,215,0,0.6)',   bg:'rgba(18,16,0,0.96)',    bgSolid:'#121000' },
    sluigi:     { primary:'#4CAF50', glow:'rgba(76,175,80,0.55)',  bg:'rgba(4,14,4,0.96)',     bgSolid:'#040E04' },
    ssonic:     { primary:'#1E90FF', glow:'rgba(30,144,255,0.6)',  bg:'rgba(2,8,18,0.96)',     bgSolid:'#020812' },
    sjoker:     { primary:'#E52222', glow:'rgba(229,34,34,0.6)',   bg:'rgba(4,2,6,0.98)',      bgSolid:'#040206' },
    ssephiroth: { primary:'#C0C0C0', glow:'rgba(192,192,192,0.4)', bg:'rgba(4,2,8,0.98)',      bgSolid:'#040208' },
    spyra:      { primary:'#FF4500', glow:'rgba(255,69,0,0.55)',   bg:'rgba(18,6,2,0.96)',     bgSolid:'#120602' },
    smythra:    { primary:'#FFD700', glow:'rgba(255,215,0,0.55)',  bg:'rgba(18,16,2,0.96)',    bgSolid:'#121002' },
    skazuya:    { primary:'#8B0000', glow:'rgba(139,0,0,0.6)',     bg:'rgba(12,2,2,0.96)',     bgSolid:'#0C0202' },
    ssora:      { primary:'#4169E1', glow:'rgba(65,105,225,0.55)', bg:'rgba(4,6,18,0.96)',     bgSolid:'#040612' },
    dual:       { primary:'#E8B830', glow:'rgba(232,184,48,0.45)', bg:'rgba(14,14,18,0.94)',   bgSolid:'#0E0E12' },
    transparent:{ primary:'#E8B830', glow:'rgba(232,184,48,0.35)', bg:'rgba(14,14,18,0.7)',    bgSolid:'#0E0E12' },
  };

  function getColors(theme) {
    return THEME_COLORS[theme] || THEME_COLORS.default;
  }

  // ── Application du thème ──────────────────────────────────────
  const ALL_THEMES = Object.keys(THEME_COLORS);
  let currentTheme = 'default';

  function applyTheme(theme) {
    if (theme === currentTheme) return;
    currentTheme = theme;
    const root = document.getElementById('ticker-root');
    const c = getColors(theme);
    ALL_THEMES.forEach(t => root.classList.remove('theme-' + t));
    root.classList.add('theme-' + (theme || 'default'));
    root.style.setProperty('--tk-primary',  c.primary);
    root.style.setProperty('--tk-glow',     c.glow);
    root.style.setProperty('--tk-bg',       c.bg);
    root.style.setProperty('--tk-bg-solid', c.bgSolid);
  }

  // ── Rendu de la piste ─────────────────────────────────────────
  let _rafId = null;
  let _currentMessages = [];
  let _currentSpeed = 80;
  let _currentSep = '◆';
  let _offsetX = 0;
  let _lastTs = null;
  let _trackWidth = 0;

  function buildTrack(messages, sep) {
    const track = document.getElementById('ticker-track');
    const wrap  = track?.closest('.ticker-track-wrap');
    track.innerHTML = '';
    if (!messages.length) return;

    // Insérer une première copie pour tenter une mesure immédiate
    track.appendChild(buildSet(messages, sep));
    const setWidth  = track.scrollWidth;
    const wrapWidth = wrap ? wrap.offsetWidth : 1280;

    if (setWidth) {
      // Nombre de copies pour que la piste soit plus large que (wrapWidth + setWidth)
      const copies = Math.max(2, Math.ceil((wrapWidth + setWidth) / setWidth));
      for (let i = 1; i < copies; i++) {
        track.appendChild(buildSet(messages, sep));
      }
      _trackWidth = setWidth;
    } else {
      // Mesure impossible pour l'instant : ajouter une deuxième copie et mesurer
      // dans le RAF (cas des fonts pas encore chargées)
      track.appendChild(buildSet(messages, sep));
      _trackWidth = 0; // sera mesuré dans startScroll
    }

    _offsetX = wrap ? -(wrap.offsetWidth) : 0;
    _lastTs  = null;
  }

  function buildSet(messages, sep) {
    const frag = document.createDocumentFragment();
    messages.forEach((msg, i) => {
      const item = document.createElement('span');
      item.className = 'ticker-item';

      const text = document.createElement('span');
      text.className = 'ticker-msg';
      text.textContent = msg;
      item.appendChild(text);

      const dot = document.createElement('span');
      dot.className = 'ticker-dot';
      dot.textContent = ' ' + sep + ' ';
      item.appendChild(dot);

      frag.appendChild(item);
    });
    return frag;
  }

  // Animation RAF fluide
  function startScroll() {
    if (_rafId) cancelAnimationFrame(_rafId);

    function step(ts) {
      if (!_lastTs) _lastTs = ts;
      const dt = ts - _lastTs;
      _lastTs = ts;

      const track = document.getElementById('ticker-track');
      if (!track) return;

      // Mesure paresseuse si buildTrack n'avait pas pu mesurer (fonts non chargées)
      if (!_trackWidth) {
        const w = track.scrollWidth / 2;
        if (w > 0) {
          _trackWidth = w;
        } else {
          _rafId = requestAnimationFrame(step);
          return;
        }
      }

      _offsetX += (_currentSpeed * dt) / 1000; // px/s

      // Reset dès qu'on a parcouru exactement une copie → boucle propre
      if (_offsetX >= _trackWidth) {
        _offsetX -= _trackWidth;
      }

      track.style.transform = `translateX(${-_offsetX}px)`;
      _rafId = requestAnimationFrame(step);
    }

    _rafId = requestAnimationFrame(step);
  }

  function stopScroll() {
    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  }

  // ── Mise à jour depuis le serveur ────────────────────────────
  function applyTickerState(s) {
    const root  = document.getElementById('ticker-root');
    const label = document.getElementById('label-text');

    // Visibilité
    root.classList.toggle('hidden', !s.visible);
    if (!s.visible) { stopScroll(); return; }

    // Position
    root.classList.toggle('position-top',    s.position === 'top');
    root.classList.toggle('position-bottom', s.position !== 'top');

    // Label
    if (label) label.textContent = (s.label || 'INFO').toUpperCase();

    // Messages
    const msgs = (s.messages || []).filter(m => m && m.trim());
    const sep  = s.separator || '◆';
    const speed = Math.max(20, Math.min(400, s.speed || 80));

    const changed = JSON.stringify(msgs) !== JSON.stringify(_currentMessages) || sep !== _currentSep;
    _currentSpeed    = speed;
    _currentMessages = msgs;
    _currentSep      = sep;

    if (changed) {
      stopScroll();
      if (msgs.length) {
        buildTrack(msgs, sep);
        startScroll();
      }
    }
  }

  // ── Socket.IO ─────────────────────────────────────────────────
  const socket = io();

  socket.on('stateUpdate',   (s) => { try { applyTheme(s.overlayTheme || 'default'); } catch(e) {} });
  socket.on('tickerUpdate',  (s) => { try { applyTickerState(s); } catch(e) { console.error('[ticker]', e); } });

})();

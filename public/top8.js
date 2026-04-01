/**
 * top8.js — Overlay Top 8 plein écran PSO
 * Reçoit : stateUpdate (thème) + top8Update (données + personnages)
 */
(function () {
  'use strict';

  // ── Couleurs par thème ────────────────────────────────────────
  const THEME_COLORS = {
    default:    { primary:'#E8B830', glow:'rgba(232,184,48,0.50)',   glowSoft:'rgba(232,184,48,0.14)'   },
    cyberpunk:  { primary:'#00F5FF', glow:'rgba(0,245,255,0.60)',    glowSoft:'rgba(0,245,255,0.14)'    },
    synthwave:  { primary:'#FF6EC7', glow:'rgba(255,110,199,0.60)',  glowSoft:'rgba(255,110,199,0.14)'  },
    midnight:   { primary:'#4488FF', glow:'rgba(68,136,255,0.55)',   glowSoft:'rgba(68,136,255,0.14)'   },
    egypt:      { primary:'#D4A017', glow:'rgba(212,160,23,0.55)',   glowSoft:'rgba(212,160,23,0.14)'   },
    city:       { primary:'#A0C4D8', glow:'rgba(160,196,216,0.45)', glowSoft:'rgba(160,196,216,0.12)'  },
    eco:        { primary:'#6BC96C', glow:'rgba(107,201,108,0.55)', glowSoft:'rgba(107,201,108,0.14)'  },
    water:      { primary:'#29B6F6', glow:'rgba(41,182,246,0.55)',  glowSoft:'rgba(41,182,246,0.14)'   },
    fire:       { primary:'#FF6B00', glow:'rgba(255,107,0,0.65)',   glowSoft:'rgba(255,107,0,0.16)'    },
    rainbow:    { primary:'#FF6EC7', glow:'rgba(255,110,199,0.50)', glowSoft:'rgba(255,110,199,0.12)'  },
    trans:      { primary:'#55CDFC', glow:'rgba(85,205,252,0.55)',  glowSoft:'rgba(85,205,252,0.14)'   },
    pan:        { primary:'#FF218C', glow:'rgba(255,33,140,0.55)',  glowSoft:'rgba(255,33,140,0.14)'   },
    bi:         { primary:'#9B59D0', glow:'rgba(155,89,208,0.55)',  glowSoft:'rgba(155,89,208,0.14)'   },
    lesbian:    { primary:'#FF4500', glow:'rgba(255,69,0,0.55)',    glowSoft:'rgba(255,69,0,0.14)'     },
    plage:      { primary:'#F4D35E', glow:'rgba(244,211,94,0.55)',  glowSoft:'rgba(244,211,94,0.14)'   },
    smario:     { primary:'#E52222', glow:'rgba(229,34,34,0.60)',   glowSoft:'rgba(229,34,34,0.15)'    },
    sdk:        { primary:'#C87941', glow:'rgba(200,121,65,0.55)',  glowSoft:'rgba(200,121,65,0.15)'   },
    slink:      { primary:'#D4A017', glow:'rgba(212,160,23,0.55)',  glowSoft:'rgba(212,160,23,0.15)'   },
    ssamus:     { primary:'#FF8C00', glow:'rgba(255,140,0,0.55)',   glowSoft:'rgba(255,140,0,0.15)'    },
    sdsamus:    { primary:'#9400D3', glow:'rgba(148,0,211,0.55)',   glowSoft:'rgba(148,0,211,0.15)'    },
    skirby:     { primary:'#FF69B4', glow:'rgba(255,105,180,0.55)', glowSoft:'rgba(255,105,180,0.14)'  },
    spikachu:   { primary:'#FFD700', glow:'rgba(255,215,0,0.65)',   glowSoft:'rgba(255,215,0,0.16)'    },
    ssonic:     { primary:'#1E90FF', glow:'rgba(30,144,255,0.65)',  glowSoft:'rgba(30,144,255,0.15)'   },
    sjoker:     { primary:'#E52222', glow:'rgba(229,34,34,0.65)',   glowSoft:'rgba(229,34,34,0.16)'    },
    ssephiroth: { primary:'#C0C0C0', glow:'rgba(192,192,192,0.45)', glowSoft:'rgba(192,192,192,0.12)'  },
    dual:       { primary:'#E8B830', glow:'rgba(232,184,48,0.50)',   glowSoft:'rgba(232,184,48,0.14)'   },
    transparent:{ primary:'#E8B830', glow:'rgba(232,184,48,0.40)',   glowSoft:'rgba(232,184,48,0.12)'   },
  };

  const ALL_THEMES = Object.keys(THEME_COLORS);

  function getColors(theme) {
    return THEME_COLORS[theme] || THEME_COLORS.default;
  }

  // ── Application du thème ──────────────────────────────────────
  function applyTheme(theme) {
    const root = document.getElementById('top8-root');
    if (!root) return;
    const c = getColors(theme || 'default');
    ALL_THEMES.forEach(function (t) { root.classList.remove('theme-' + t); });
    if (theme && theme !== 'default') root.classList.add('theme-' + theme);
    root.style.setProperty('--t8-primary',   c.primary);
    root.style.setProperty('--t8-glow',      c.glow);
    root.style.setProperty('--t8-glow-soft', c.glowSoft);
    startParts(theme || 'default');
  }

  // ── Chemin image personnage ───────────────────────────────────
  function charSrc(charName, color) {
    if (!charName) return null;
    var n = charName.replace(/\s*\/\s*/g, '-');
    var c = String(color || 0).padStart(2, '0');
    return '/full/chara_1_' + n + '_' + c + '.png';
  }


  // ── Construction d'une carte joueur ──────────────────────────
  function buildCard(player, cardClass) {
    var card = document.createElement('div');
    card.className = 't8-card ' + cardClass;

    // Zone art
    var art = document.createElement('div');
    art.className = 't8-art';

    var src = charSrc(player.character, player.characterColor);
    if (src) {
      var img = document.createElement('img');
      img.className = 't8-art-img';
      img.src = src;
      img.alt = '';
      img.onerror = function () {
        // Essayer avec la couleur 00 par défaut
        var fallback = charSrc(player.character, 0);
        if (img.src !== fallback) {
          img.src = fallback;
        } else {
          img.style.display = 'none';
        }
      };
      art.appendChild(img);
    }

    // Barre d'info
    var info = document.createElement('div');
    info.className = 't8-info';

    var place = document.createElement('span');
    place.className = 't8-place';
    place.textContent = player.placement || '';
    info.appendChild(place);

    if (player.tag) {
      var tag = document.createElement('span');
      tag.className = 't8-tag';
      tag.textContent = player.tag;
      info.appendChild(tag);
    }

    var name = document.createElement('span');
    name.className = 't8-name' + (player.name ? '' : ' tbd');
    name.textContent = player.name || 'TBD';
    info.appendChild(name);

    if (player.wins !== undefined || player.losses !== undefined) {
      var wins  = player.wins   || 0;
      var losses = player.losses || 0;
      var total = wins + losses;
      var pct   = total > 0 ? Math.round(wins / total * 100) : 0;

      var wrBlock = document.createElement('div');
      wrBlock.className = 't8-wr-block';

      var wrRow = document.createElement('div');
      wrRow.className = 't8-winrate';
      wrRow.innerHTML =
        '<span class="t8-w">'    + wins   + 'W</span>' +
        '<span class="t8-wlsep">·</span>' +
        '<span class="t8-l">'    + losses + 'L</span>' +
        (total > 0
          ? '<span class="t8-wr-pct">' + pct + '%</span>'
          : '');

      wrBlock.appendChild(wrRow);

      if (total > 0) {
        var track = document.createElement('div');
        track.className = 't8-wr-bar-track';
        var fill = document.createElement('div');
        fill.className = 't8-wr-bar-fill';
        fill.style.width = pct + '%';
        track.appendChild(fill);
        wrBlock.appendChild(track);
      }

      info.appendChild(wrBlock);
    }

    card.appendChild(art);
    card.appendChild(info);
    return card;
  }

  // ── Rendu principal ───────────────────────────────────────────
  function render(state) {
    var root = document.getElementById('top8-root');
    if (!root) return;

    // Visibilité
    root.classList.toggle('hidden', !state.visible);

    // Position & échelle (utile pour tester hors-OBS)
    root.style.left      = (state.posX || 0) + 'px';
    root.style.top       = (state.posY || 0) + 'px';
    root.style.transform = 'scale(' + ((state.scale || 100) / 100) + ')';

    // Métadonnées header
    var tournEl = document.getElementById('top8-tournament');
    var evEl    = document.getElementById('top8-event');
    var dateEl  = document.getElementById('top8-date');
    if (tournEl) tournEl.textContent = state.tournamentName || '';
    if (evEl)    evEl.textContent    = state.eventName      || '';
    if (dateEl)  dateEl.textContent  = state.eventDate      || '';

    // Afficher/masquer les séparateurs selon la présence de contenu
    var hasTournament = !!(state.tournamentName);
    var hasEvent      = !!(state.eventName);
    var hasDate       = !!(state.eventDate);
    var sep1 = document.querySelector('.t8-sep-1');
    var sep2 = document.querySelector('.t8-sep-2');
    if (sep1) sep1.style.display = (hasTournament && hasEvent)                  ? '' : 'none';
    if (sep2) sep2.style.display = ((hasTournament || hasEvent) && hasDate)     ? '' : 'none';

    // Logo : tournamentLogo (start.gg) en priorité, sinon centerLogo (customisation)
    updateLogo(state.tournamentLogo || _centerLogo);

    // Trier par placement
    var players = (state.players || []).slice(0, 8)
      .slice()
      .sort(function (a, b) { return (a.placement || 99) - (b.placement || 99); });

    // ── Podium (top 3) : ordre 2e · 1er · 3e ─────────────────
    var podiumEl = document.getElementById('t8-podium');
    podiumEl.innerHTML = '';

    var p1 = players[0], p2 = players[1], p3 = players[2];
    // Ordre visuel podium : 2e gauche, 1er centre, 3e droite
    var podiumOrder = [
      { player: p2, cls: 't8-card-2nd' },
      { player: p1, cls: 't8-card-1st' },
      { player: p3, cls: 't8-card-3rd' },
    ];
    podiumOrder.forEach(function (item) {
      if (item.player) podiumEl.appendChild(buildCard(item.player, item.cls));
    });

    // ── Ligne du bas (4e – 8e) ────────────────────────────────
    var bottomEl = document.getElementById('t8-bottom');
    bottomEl.innerHTML = '';
    players.slice(3).forEach(function (p) {
      bottomEl.appendChild(buildCard(p, 't8-card-bottom'));
    });
  }

  // ── Logo (priorité tournamentLogo > centerLogo) ───────────────
  var _centerLogo = '';

  function updateLogo(url) {
    var el = document.getElementById('t8-logo');
    if (!el) return;
    if (url) { el.src = url; el.style.display = 'block'; }
    else     { el.src = ''; el.style.display = 'none';  }
  }

  // ── Système de particules ────────────────────────────────────
  var _pCtx = null, _pRAF = null, _parts = [], _pTheme = 'default';

  var PCFG = {
    default:    { rgb:'232,184,48',   n:45, vy:0.50, vx:0.30, r:1.8, blur:14 },
    cyberpunk:  { rgb:'0,245,255',    n:65, vy:1.50, vx:0.80, r:1.2, blur:16 },
    synthwave:  { rgb:'255,110,199',  n:35, vy:0.30, vx:0.20, r:3.2, blur:22 },
    midnight:   { rgb:'68,136,255',   n:55, vy:0.40, vx:0.30, r:1.5, blur:12 },
    egypt:      { rgb:'212,160,23',   n:40, vy:0.40, vx:0.20, r:1.8, blur:12 },
    fire:       { rgb:'255,107,0',    n:70, vy:1.10, vx:0.55, r:2.0, blur:18 },
    water:      { rgb:'41,182,246',   n:40, vy:0.35, vx:0.15, r:2.5, blur:12 },
    eco:        { rgb:'107,201,108',  n:40, vy:0.40, vx:0.25, r:1.8, blur:10 },
    city:       { rgb:'160,196,216',  n:30, vy:0.30, vx:0.20, r:1.5, blur: 8 },
    plage:      { rgb:'244,211,94',   n:35, vy:0.30, vx:0.20, r:2.0, blur:10 },
    rainbow:    { rgb:'255,110,199',  n:50, vy:0.50, vx:0.35, r:2.0, blur:14 },
    trans:      { rgb:'85,205,252',   n:40, vy:0.35, vx:0.25, r:2.0, blur:12 },
    pan:        { rgb:'255,33,140',   n:40, vy:0.40, vx:0.30, r:2.0, blur:14 },
    bi:         { rgb:'155,89,208',   n:40, vy:0.40, vx:0.30, r:2.0, blur:14 },
    lesbian:    { rgb:'255,69,0',     n:45, vy:0.70, vx:0.30, r:1.8, blur:14 },
    smario:     { rgb:'229,34,34',    n:50, vy:0.55, vx:0.30, r:2.0, blur:12 },
    sdk:        { rgb:'200,121,65',   n:40, vy:0.40, vx:0.25, r:1.8, blur:10 },
    slink:      { rgb:'212,160,23',   n:40, vy:0.40, vx:0.25, r:1.8, blur:12 },
    ssamus:     { rgb:'255,140,0',    n:45, vy:0.50, vx:0.30, r:2.0, blur:14 },
    sdsamus:    { rgb:'148,0,211',    n:45, vy:0.50, vx:0.30, r:2.2, blur:16 },
    skirby:     { rgb:'255,105,180',  n:45, vy:0.40, vx:0.30, r:2.2, blur:14 },
    spikachu:   { rgb:'255,215,0',    n:55, vy:0.60, vx:0.35, r:2.0, blur:16 },
    ssonic:     { rgb:'30,144,255',   n:60, vy:0.90, vx:0.50, r:1.5, blur:12 },
    sjoker:     { rgb:'229,34,34',    n:45, vy:0.55, vx:0.30, r:1.8, blur:14 },
    ssephiroth: { rgb:'192,192,192',  n:40, vy:0.30, vx:0.20, r:2.0, blur: 8 },
    dual:       { rgb:'232,184,48',   n:45, vy:0.50, vx:0.30, r:1.8, blur:14 },
    transparent:{ rgb:'232,184,48',   n:30, vy:0.35, vx:0.25, r:1.5, blur:10 },
  };

  function getPcfg(theme) {
    if (PCFG[theme]) return PCFG[theme];
    var c = getColors(theme);
    var h = c.primary.replace('#', '');
    var r = parseInt(h.substr(0,2),16), g = parseInt(h.substr(2,2),16), b = parseInt(h.substr(4,2),16);
    return { rgb: r+','+g+','+b, n:40, vy:0.40, vx:0.30, r:2.0, blur:12 };
  }

  function spawnPart(cfg, W, H, randomY) {
    return {
      x:       Math.random() * W,
      y:       randomY ? Math.random() * H : H + Math.random() * 40,
      vx:      (Math.random() - 0.5) * cfg.vx * 2,
      vy:      -(cfg.vy * 0.5 + Math.random() * cfg.vy),
      r:       cfg.r * (0.5 + Math.random() * 0.9),
      life:    0,
      maxLife: 180 + Math.random() * 240,
      maxA:    0.20 + Math.random() * 0.45,
    };
  }

  function initParts(theme) {
    _pTheme = theme || 'default';
    var canvas = document.getElementById('t8-particles');
    if (!canvas) return;
    _pCtx = canvas.getContext('2d');
    canvas.width  = 1920;
    canvas.height = 1080;
    var cfg = getPcfg(_pTheme);
    _parts = [];
    for (var i = 0; i < cfg.n; i++) {
      var p = spawnPart(cfg, 1920, 1080, true);
      p.life = Math.floor(Math.random() * p.maxLife);
      _parts.push(p);
    }
  }

  function drawParts() {
    if (!_pCtx) return;
    var ctx = _pCtx;
    var cfg = getPcfg(_pTheme);
    var W = 1920, H = 1080;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < _parts.length; i++) {
      var p = _parts[i];
      p.life++;
      var prog = p.life / p.maxLife;
      var a;
      if      (prog < 0.15) a = p.maxA * (prog / 0.15);
      else if (prog > 0.78) a = p.maxA * (1 - (prog - 0.78) / 0.22);
      else                   a = p.maxA;
      p.x += p.vx;
      p.y += p.vy;
      p.vx += (Math.random() - 0.5) * 0.04;
      ctx.save();
      ctx.globalAlpha  = a;
      ctx.shadowColor  = 'rgba(' + cfg.rgb + ',0.9)';
      ctx.shadowBlur   = cfg.blur;
      ctx.fillStyle    = 'rgba(' + cfg.rgb + ',1)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fill();
      ctx.restore();
      if (p.life >= p.maxLife || p.y < -20) {
        _parts[i] = spawnPart(cfg, W, H, false);
      }
    }
  }

  function startParts(theme) {
    initParts(theme);
    if (_pRAF) cancelAnimationFrame(_pRAF);
    (function loop() {
      drawParts();
      _pRAF = requestAnimationFrame(loop);
    })();
  }

  // ── Socket.IO ─────────────────────────────────────────────────
  var socket = io();
  socket.on('stateUpdate', function (s) {
    applyTheme(s.overlayTheme);
    if (s.centerLogo !== undefined) {
      _centerLogo = s.centerLogo || '';
      // Re-appliquer le logo si pas de logo tournoi dans l'état courant
    }
  });
  socket.on('top8Update', render);

  // ── État initial ──────────────────────────────────────────────
  fetch('/api/state').then(function (r) { return r.json(); }).then(function (s) {
    applyTheme(s.overlayTheme);
    _centerLogo = s.centerLogo || '';
  }).catch(function () {});
  fetch('/api/top8').then(function (r) { return r.json(); }).then(render).catch(function () {});
})();

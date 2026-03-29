/**
 * bracket.js — Overlay visualiseur de bracket PSO
 * Reçoit : stateUpdate (thème) + bracketUpdate (données bracket)
 */
(function () {
  'use strict';

  // ── Couleurs par thème ────────────────────────────────────────
  const THEME_COLORS = {
    default:    { primary:'#E8B830', glow:'rgba(232,184,48,0.45)',   glowSoft:'rgba(232,184,48,0.18)',   line:'rgba(232,184,48,0.30)'   },
    cyberpunk:  { primary:'#00F5FF', glow:'rgba(0,245,255,0.55)',    glowSoft:'rgba(0,245,255,0.15)',    line:'rgba(0,245,255,0.28)'    },
    synthwave:  { primary:'#FF6EC7', glow:'rgba(255,110,199,0.55)',  glowSoft:'rgba(255,110,199,0.15)',  line:'rgba(255,110,199,0.28)'  },
    midnight:   { primary:'#4488FF', glow:'rgba(68,136,255,0.50)',   glowSoft:'rgba(68,136,255,0.15)',   line:'rgba(68,136,255,0.28)'   },
    egypt:      { primary:'#D4A017', glow:'rgba(212,160,23,0.50)',   glowSoft:'rgba(212,160,23,0.15)',   line:'rgba(212,160,23,0.28)'   },
    city:       { primary:'#A0C4D8', glow:'rgba(160,196,216,0.40)', glowSoft:'rgba(160,196,216,0.12)', line:'rgba(160,196,216,0.25)'  },
    eco:        { primary:'#6BC96C', glow:'rgba(107,201,108,0.50)', glowSoft:'rgba(107,201,108,0.14)', line:'rgba(107,201,108,0.28)'  },
    water:      { primary:'#29B6F6', glow:'rgba(41,182,246,0.50)',  glowSoft:'rgba(41,182,246,0.14)',  line:'rgba(41,182,246,0.28)'   },
    fire:       { primary:'#FF6B00', glow:'rgba(255,107,0,0.60)',   glowSoft:'rgba(255,107,0,0.16)',   line:'rgba(255,107,0,0.30)'    },
    rainbow:    { primary:'#FF6EC7', glow:'rgba(255,110,199,0.45)', glowSoft:'rgba(255,110,199,0.12)', line:'rgba(255,110,199,0.25)'  },
    trans:      { primary:'#55CDFC', glow:'rgba(85,205,252,0.50)',  glowSoft:'rgba(85,205,252,0.14)',  line:'rgba(85,205,252,0.28)'   },
    pan:        { primary:'#FF218C', glow:'rgba(255,33,140,0.50)',  glowSoft:'rgba(255,33,140,0.14)',  line:'rgba(255,33,140,0.28)'   },
    bi:         { primary:'#9B59D0', glow:'rgba(155,89,208,0.50)',  glowSoft:'rgba(155,89,208,0.14)',  line:'rgba(155,89,208,0.28)'   },
    lesbian:    { primary:'#FF4500', glow:'rgba(255,69,0,0.50)',    glowSoft:'rgba(255,69,0,0.14)',    line:'rgba(255,69,0,0.28)'     },
    plage:      { primary:'#F4D35E', glow:'rgba(244,211,94,0.50)',  glowSoft:'rgba(244,211,94,0.14)',  line:'rgba(244,211,94,0.28)'   },
    smario:     { primary:'#E52222', glow:'rgba(229,34,34,0.55)',   glowSoft:'rgba(229,34,34,0.15)',   line:'rgba(229,34,34,0.28)'    },
    sdk:        { primary:'#C87941', glow:'rgba(200,121,65,0.55)',  glowSoft:'rgba(200,121,65,0.15)',  line:'rgba(200,121,65,0.28)'   },
    slink:      { primary:'#D4A017', glow:'rgba(212,160,23,0.55)',  glowSoft:'rgba(212,160,23,0.15)',  line:'rgba(212,160,23,0.28)'   },
    ssamus:     { primary:'#FF8C00', glow:'rgba(255,140,0,0.55)',   glowSoft:'rgba(255,140,0,0.15)',   line:'rgba(255,140,0,0.28)'    },
    sdsamus:    { primary:'#9400D3', glow:'rgba(148,0,211,0.55)',   glowSoft:'rgba(148,0,211,0.15)',   line:'rgba(148,0,211,0.28)'    },
    skirby:     { primary:'#FF69B4', glow:'rgba(255,105,180,0.50)', glowSoft:'rgba(255,105,180,0.14)', line:'rgba(255,105,180,0.28)'  },
    spikachu:   { primary:'#FFD700', glow:'rgba(255,215,0,0.60)',   glowSoft:'rgba(255,215,0,0.16)',   line:'rgba(255,215,0,0.30)'    },
    ssonic:     { primary:'#1E90FF', glow:'rgba(30,144,255,0.60)',  glowSoft:'rgba(30,144,255,0.15)',  line:'rgba(30,144,255,0.28)'   },
    sjoker:     { primary:'#E52222', glow:'rgba(229,34,34,0.60)',   glowSoft:'rgba(229,34,34,0.16)',   line:'rgba(229,34,34,0.28)'    },
    ssephiroth: { primary:'#C0C0C0', glow:'rgba(192,192,192,0.40)', glowSoft:'rgba(192,192,192,0.12)', line:'rgba(192,192,192,0.22)'  },
    dual:       { primary:'#E8B830', glow:'rgba(232,184,48,0.45)',   glowSoft:'rgba(232,184,48,0.18)',   line:'rgba(232,184,48,0.30)'   },
    transparent:{ primary:'#E8B830', glow:'rgba(232,184,48,0.35)',   glowSoft:'rgba(232,184,48,0.12)',   line:'rgba(232,184,48,0.22)'   },
  };

  function getColors(theme) {
    // Support préfixe 's' pour les thèmes personnages non listés
    return THEME_COLORS[theme] || THEME_COLORS.default;
  }

  const ALL_THEMES = Object.keys(THEME_COLORS);
  let currentTheme = 'default';

  function applyTheme(theme) {
    currentTheme = theme || 'default';
    const root = document.getElementById('bracket-root');
    if (!root) return;
    const c = getColors(currentTheme);
    ALL_THEMES.forEach(t => root.classList.remove('theme-' + t));
    root.classList.add('theme-' + currentTheme);
    root.style.setProperty('--br-primary',   c.primary);
    root.style.setProperty('--br-glow',      c.glow);
    root.style.setProperty('--br-glow-soft', c.glowSoft);
    root.style.setProperty('--br-line',      c.line);
    root.style.setProperty('--br-win-bg',    hexToRgba(c.primary, 0.12));
  }

  function hexToRgba(color, alpha) {
    // color peut être rgba() ou #hex
    if (color.startsWith('rgba') || color.startsWith('rgb')) return color;
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0,2),16);
    const g = parseInt(hex.substr(2,2),16);
    const b = parseInt(hex.substr(4,2),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ── Constantes de layout ──────────────────────────────────────
  const MATCH_W       = 210;   // largeur d'une carte
  const MATCH_H       = 58;    // hauteur d'une carte (2 slots × 28px + 2px border)
  const ROUND_GAP     = 44;    // espace horizontal entre rounds
  const HEADER_H      = 38;    // hauteur du header
  const LABEL_H       = 18;    // hauteur du label de round
  const LABEL_MARGIN  = 6;     // espace entre label et premier match
  const PAD_X         = 16;    // padding horizontal interne
  const PAD_TOP       = 10;    // padding au-dessus des labels
  const SECTION_GAP   = 28;    // espace entre winners et losers bracket
  const SEP_H         = 1;     // hauteur du séparateur

  // ── Rendu ─────────────────────────────────────────────────────
  function render(state) {
    const root = document.getElementById('bracket-root');
    if (!root) return;

    // Visibilité
    root.classList.toggle('hidden', !state.visible);
    if (!state.visible) return;

    // Position & scale
    root.style.left  = (state.posX || 0) + 'px';
    root.style.top   = (state.posY || 0) + 'px';
    root.style.transform = `scale(${(state.scale || 100) / 100})`;

    // Titres
    document.getElementById('bracket-title').textContent = (state.phaseName || 'BRACKET').toUpperCase();
    document.getElementById('bracket-subtitle').textContent = fmtBracketType(state.bracketType);

    const sets = state.sets || [];
    if (!sets.length) {
      renderEmpty();
      return;
    }

    // Séparer winners (round > 0) et losers (round < 0)
    const winnerSets = sets.filter(s => s.round > 0);
    const loserSets  = sets.filter(s => s.round < 0);

    // Grouper par round
    const winnersByRound = groupByRound(winnerSets, true);   // ascending
    const losersByRound  = groupByRound(loserSets,  false);  // ascending magnitude

    // Calculer les dimensions des sections
    const wLayout = computeLayout(winnersByRound);
    const lLayout = loserSets.length ? computeLayout(losersByRound) : null;

    // Calculer les dimensions totales de la bracket-stage
    const stageW = PAD_X * 2 + Math.max(wLayout.totalW, lLayout ? lLayout.totalW : 0);
    const stageH = PAD_TOP + LABEL_H + LABEL_MARGIN + wLayout.totalH
                 + (lLayout ? SECTION_GAP + SEP_H + LABEL_H + LABEL_MARGIN + lLayout.totalH : 0)
                 + PAD_TOP;

    const stage = document.getElementById('bracket-stage');
    stage.style.width  = stageW + 'px';
    stage.style.height = stageH + 'px';

    // Vider le contenu
    const matchesEl = document.getElementById('bracket-matches');
    const svgEl     = document.getElementById('bracket-svg');
    matchesEl.innerHTML = '';
    svgEl.setAttribute('viewBox', `0 0 ${stageW} ${stageH}`);
    svgEl.innerHTML = '';

    // Offset Y de chaque section
    const wOffY = PAD_TOP + LABEL_H + LABEL_MARGIN;
    const lOffY = lLayout
      ? wOffY + wLayout.totalH + SECTION_GAP + SEP_H + LABEL_H + LABEL_MARGIN
      : 0;

    // Rendre labels de rounds winners
    renderRoundLabels(svgEl, winnersByRound, wLayout, PAD_X, PAD_TOP);
    // Rendre matches winners
    renderMatches(matchesEl, winnersByRound, wLayout, PAD_X, wOffY, sets);
    // Rendre lignes SVG winners
    renderConnections(svgEl, winnersByRound, wLayout, PAD_X, wOffY, getColors(currentTheme).line);

    if (lLayout) {
      // Séparateur
      const sep = document.createElementNS('http://www.w3.org/2000/svg','line');
      const sepY = wOffY + wLayout.totalH + SECTION_GAP / 2;
      sep.setAttribute('x1', PAD_X); sep.setAttribute('y1', sepY);
      sep.setAttribute('x2', stageW - PAD_X); sep.setAttribute('y2', sepY);
      sep.setAttribute('stroke', 'rgba(255,255,255,0.08)');
      sep.setAttribute('stroke-width', '1');
      svgEl.appendChild(sep);

      // Label section losers
      const lSepY = wOffY + wLayout.totalH + SECTION_GAP / 2;
      const lSecLabel = document.createElement('div');
      lSecLabel.className = 'bracket-sep-label';
      lSecLabel.textContent = 'LOSERS BRACKET';
      lSecLabel.style.left = (stageW / 2) + 'px';
      lSecLabel.style.top  = (lSepY - 6) + 'px';
      matchesEl.appendChild(lSecLabel);

      // Labels de rounds losers
      const lLabelY = wOffY + wLayout.totalH + SECTION_GAP;
      renderRoundLabels(svgEl, losersByRound, lLayout, PAD_X, lLabelY);
      // Matches losers
      renderMatches(matchesEl, losersByRound, lLayout, PAD_X, lOffY, sets);
      // Lignes SVG losers
      renderConnections(svgEl, losersByRound, lLayout, PAD_X, lOffY, getColors(currentTheme).line);
    }

    // Taille totale de la boîte bracket-root = header + stage
    root.style.width  = stageW + 'px';
  }

  // ── Groupement par round ──────────────────────────────────────
  function groupByRound(sets, ascending) {
    const map = {};
    sets.forEach(s => {
      const r = Math.abs(s.round);
      if (!map[r]) map[r] = [];
      map[r].push(s);
    });
    // Trier chaque round par identifier
    Object.values(map).forEach(arr => {
      arr.sort((a, b) => (a.identifier || '').localeCompare(b.identifier || '', undefined, { numeric: true }));
    });
    // Clés triées
    const keys = Object.keys(map).map(Number).sort((a, b) => ascending ? a - b : b - a);
    return { map, rounds: keys };
  }

  // ── Calcul du layout (positions Y) ───────────────────────────
  function computeLayout(grouped) {
    const { map, rounds } = grouped;
    if (!rounds.length) return { totalW: 0, totalH: 0, colX: {}, matchY: {}, slotH: 0 };

    // Le nombre max de matches détermine la hauteur de base
    const maxCount = Math.max(...rounds.map(r => map[r].length));
    const slotH = MATCH_H + 8;   // espace vertical de base par match du premier round
    const totalH = maxCount * slotH;

    // Position X de chaque colonne
    const colX = {};
    rounds.forEach((r, i) => {
      colX[r] = i * (MATCH_W + ROUND_GAP);
    });

    // Position Y de chaque match (centré dans son slot alloué)
    const matchY = {};
    rounds.forEach(r => {
      const count = map[r].length;
      const step  = totalH / count;
      map[r].forEach((s, i) => {
        matchY[s.id] = step * i + (step - MATCH_H) / 2;
      });
    });

    const totalW = rounds.length * (MATCH_W + ROUND_GAP) - ROUND_GAP;
    return { totalW, totalH, colX, matchY, slotH };
  }

  // ── Rendu des labels de rounds ────────────────────────────────
  function renderRoundLabels(svgEl, grouped, layout, offX, offY) {
    const { map, rounds } = grouped;
    rounds.forEach(r => {
      const first = map[r][0];
      if (!first) return;
      const x = offX + layout.colX[r] + MATCH_W / 2;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', offY + LABEL_H - 4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-family', 'Russo One, sans-serif');
      text.setAttribute('font-size', '9');
      text.setAttribute('letter-spacing', '2');
      text.setAttribute('text-transform', 'uppercase');
      text.setAttribute('fill', 'var(--br-primary)');
      text.setAttribute('opacity', '0.75');
      text.textContent = (first.fullRoundText || 'R' + r).toUpperCase();
      svgEl.appendChild(text);
    });
  }

  // ── Rendu des cartes de match ─────────────────────────────────
  function renderMatches(container, grouped, layout, offX, offY, allSets) {
    const { map, rounds } = grouped;
    rounds.forEach(r => {
      map[r].forEach(s => {
        const card = buildMatchCard(s);
        card.style.left = (offX + layout.colX[r]) + 'px';
        card.style.top  = (offY + layout.matchY[s.id]) + 'px';
        container.appendChild(card);
      });
    });
  }

  function buildMatchCard(s) {
    const p1IsWinner = s.state === 3 && s.winnerId && String(s.winnerId) === String(s.p1?.id);
    const p2IsWinner = s.state === 3 && s.winnerId && String(s.winnerId) === String(s.p2?.id);
    const isLive     = s.state === 2;
    const isPending  = s.state === 1 || s.state === 6; // 6 = called

    const card = document.createElement('div');
    card.className = 'match-card'
      + (isLive    ? ' live'    : '')
      + (isPending ? ' pending' : '');
    card.dataset.setId = s.id;

    card.appendChild(buildSlot(s.p1, p1IsWinner, s.state === 3 && !p1IsWinner));
    card.appendChild(buildSlot(s.p2, p2IsWinner, s.state === 3 && !p2IsWinner));

    if (isLive) {
      const dot = document.createElement('div');
      dot.className = 'match-live-dot';
      card.appendChild(dot);
    }

    return card;
  }

  function buildSlot(player, isWinner, isLoser) {
    const slot = document.createElement('div');
    slot.className = 'match-slot'
      + (isWinner ? ' winner' : '')
      + (isLoser  ? ' loser'  : '');

    const isTbd = !player || !player.name || player.name === 'TBD';

    // Tag (préfixe)
    if (player?.tag) {
      const tag = document.createElement('span');
      tag.className = 'slot-tag';
      tag.textContent = player.tag;
      slot.appendChild(tag);
    }

    // Nom
    const name = document.createElement('span');
    name.className = 'slot-name' + (isTbd ? ' tbd' : '');
    name.textContent = isTbd ? 'TBD' : (player.name || 'TBD');
    slot.appendChild(name);

    // Score
    const score = document.createElement('span');
    score.className = 'slot-score';
    score.textContent = (player?.score != null && player.score >= 0) ? player.score : '';
    slot.appendChild(score);

    return slot;
  }

  // ── Lignes de connexion SVG ───────────────────────────────────
  function renderConnections(svgEl, grouped, layout, offX, offY, lineColor) {
    const { map, rounds } = grouped;

    for (let ri = 0; ri < rounds.length - 1; ri++) {
      const rA = rounds[ri];
      const rB = rounds[ri + 1];
      const setsA = map[rA];
      const setsB = map[rB];

      setsA.forEach((setA, idxA) => {
        const targetIdx = Math.floor(idxA / 2);
        const setB = setsB[targetIdx];
        if (!setB) return;

        const xA = offX + layout.colX[rA] + MATCH_W;
        const yA = offY + layout.matchY[setA.id] + MATCH_H / 2;
        const xB = offX + layout.colX[rB];
        const yB = offY + layout.matchY[setB.id] + MATCH_H / 2;
        const midX = (xA + xB) / 2;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${xA},${yA} C ${midX},${yA} ${midX},${yB} ${xB},${yB}`);
        path.setAttribute('stroke', lineColor || 'rgba(232,184,48,0.30)');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', '0.7');
        svgEl.appendChild(path);
      });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────
  function fmtBracketType(t) {
    if (!t) return '';
    const map = {
      DOUBLE_ELIMINATION: 'Double Élimination',
      SINGLE_ELIMINATION: 'Simple Élimination',
      ROUND_ROBIN:        'Round Robin',
    };
    return map[t] || t;
  }

  function renderEmpty() {
    const stage = document.getElementById('bracket-stage');
    stage.innerHTML = '<div style="padding:30px;color:rgba(255,255,255,0.3);font-size:13px;text-align:center">Aucune donnée de bracket</div>';
    stage.style.width = '300px';
    stage.style.height = '80px';
    const root = document.getElementById('bracket-root');
    root.style.width = '300px';
  }

  // ── Socket.IO ─────────────────────────────────────────────────
  const socket = io();
  socket.on('stateUpdate',   (s) => { try { applyTheme(s.overlayTheme || 'default'); } catch(e) {} });
  socket.on('bracketUpdate', (s) => { try { applyTheme(currentTheme); render(s); } catch(e) { console.error('[bracket]', e); } });

  // Chargement initial
  fetch('/api/bracket').then(r => r.json()).then(s => { render(s); }).catch(() => {});
  fetch('/api/state').then(r => r.json()).then(s => {
    try { applyTheme(s.overlayTheme || 'default'); } catch(e) {}
  }).catch(() => {});

})();

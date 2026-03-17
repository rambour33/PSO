// ─── H2H Overlay ──────────────────────────────────────────────────────────

(function () {

  function el(id) { return document.getElementById(id); }
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── Render ────────────────────────────────────────────────────────────────

  function render(state) {
    if (!state) return;
    const overlay = el('h2h-overlay');
    if (!overlay) return;

    if (!state.visible) { overlay.classList.add('hidden'); return; }
    overlay.classList.remove('hidden');

    const p1 = state.player1 || {};
    const p2 = state.player2 || {};
    const h2h = state.h2h   || {};

    const color1 = p1.color || '#E83030';
    const color2 = p2.color || '#3070E8';

    // Header
    el('h2h-bar1').style.background = color1;
    el('h2h-bar2').style.background = color2;
    el('h2h-tag1').style.color  = color1;
    el('h2h-tag2').style.color  = color2;
    el('h2h-tag1').textContent  = p1.tag  || '';
    el('h2h-tag2').textContent  = p2.tag  || '';
    el('h2h-name1').textContent = p1.name || 'JOUEUR 1';
    el('h2h-name2').textContent = p2.name || 'JOUEUR 2';
    el('h2h-event').textContent = state.eventName || '';

    // Stats
    renderStats('h2h-stats1', p1.currentStats || {}, color1);
    renderStats('h2h-stats2', p2.currentStats || {}, color2, true);

    // Record H2H
    renderRecord(h2h, color1, color2);

    // Persos H2H
    renderCharsH2H(h2h.topCharsP1 || [], h2h.topCharsP2 || []);

    // Sets H2H
    renderSets(h2h.sets || [], p1.name || '', p2.name || '');
  }

  function renderStats(containerId, stats, color, isRight = false) {
    const block = el(containerId);
    if (!block) return;

    const wins   = stats.wins   || 0;
    const losses = stats.losses || 0;
    const pct    = stats.winRate || 0;

    const chars = (stats.topChars || []).slice(0, 3);
    const iconsHtml = chars.map(c =>
      `<div class="h2h-char-icon" title="${escHtml(c.name)}">
        ${c.image ? `<img src="${escHtml(c.image)}" alt="" onerror="this.style.display='none'"/>` : ''}
      </div>`
    ).join('');

    block.innerHTML = `
      <div class="h2h-stats-wr" style="color:${color}">${pct}%</div>
      <div class="h2h-stats-record">${wins}V – ${losses}D</div>
      ${iconsHtml ? `<div class="h2h-stats-chars">${iconsHtml}</div>` : ''}
    `;
  }

  function renderRecord(h2h, color1, color2) {
    const total = h2h.totalSets || 0;
    const w1    = h2h.player1Wins || 0;
    const w2    = h2h.player2Wins || 0;

    el('h2h-wins1').textContent     = w1;
    el('h2h-wins2').textContent     = w2;
    el('h2h-wins1').style.color     = color1;
    el('h2h-wins2').style.color     = color2;
    el('h2h-record-label').textContent = `${w1} – ${w2}`;

    const pct1 = total > 0 ? (w1 / total) * 100 : 50;
    const pct2 = 100 - pct1;
    el('h2h-bar-p1').style.cssText = `width:${pct1}%;background:${color1}`;
    el('h2h-bar-p2').style.cssText = `width:${pct2}%;background:${color2}`;
  }

  function renderCharsH2H(chars1, chars2) {
    const b1 = el('h2h-chars1');
    const b2 = el('h2h-chars2');
    if (!b1 || !b2) return;

    function buildList(chars) {
      if (!chars.length) return '<div style="font-size:11px;color:#5A5A7A">—</div>';
      return chars.map(c => `
        <div class="h2h-char-row">
          <div class="h2h-char-row-icon">
            ${c.image ? `<img src="${escHtml(c.image)}" alt="" onerror="this.style.display='none'"/>` : ''}
          </div>
          <span class="h2h-char-row-name">${escHtml(c.name)}</span>
          <span class="h2h-char-row-games">${c.games}g</span>
        </div>
      `).join('');
    }

    b1.innerHTML = buildList(chars1);
    b2.innerHTML = buildList(chars2);
  }

  function renderSets(sets, p1Name, p2Name) {
    const list = el('h2h-sets-list');
    if (!list) return;
    list.innerHTML = '';

    if (!sets.length) {
      list.innerHTML = '<div class="h2h-no-h2h">Aucun face à face trouvé dans l\'historique</div>';
      return;
    }

    sets.forEach(s => {
      const p1Won    = s.winner === 1;
      const hasScore = s.score1 !== undefined && s.score2 !== undefined;
      const row = document.createElement('div');
      row.className = 'h2h-set-row' + (s.isCurrent ? ' current-event' : '');
      row.innerHTML = `
        <div class="h2h-set-left">
          <div class="h2h-set-badge ${p1Won ? 'win' : 'loss'}">${p1Won ? 'W' : 'L'}</div>
          ${hasScore ? `<span class="h2h-set-score">${s.score1}-${s.score2}</span>` : ''}
        </div>
        <div class="h2h-set-center">
          <div class="h2h-set-round">${escHtml(s.round)}</div>
          <div class="h2h-set-tournament">${escHtml(s.isCurrent ? '(tournoi actuel)' : s.tournamentName)}</div>
        </div>
        <div class="h2h-set-right">
          ${hasScore ? `<span class="h2h-set-score">${s.score2}-${s.score1}</span>` : ''}
          <div class="h2h-set-badge ${p1Won ? 'loss' : 'win'}">${p1Won ? 'L' : 'W'}</div>
        </div>
      `;
      list.appendChild(row);
    });
  }

  // ── Fetch + Poll ──────────────────────────────────────────────────────────

  function poll() {
    fetch('/api/h2h')
      .then(r => r.json())
      .then(render)
      .catch(() => {});
  }

  poll();
  setInterval(poll, 2000);

  try {
    const socket = io();
    socket.on('h2hUpdate', render);
  } catch (e) {}

})();

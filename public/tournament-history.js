// ─── Tournament History Overlay ────────────────────────────────────────────

(function () {

  function el(id) { return document.getElementById(id); }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ── Render ────────────────────────────────────────────────────────────────

  function render(state) {
    if (!state) return;

    const overlay = el('history-overlay');
    if (!overlay) return;

    if (!state.visible) {
      overlay.classList.add('hidden');
      return;
    }
    overlay.classList.remove('hidden');

    const color = state.playerColor || '#E8B830';
    el('history-color-bar').style.background = color;
    el('history-tag').textContent  = state.playerTag  || '';
    el('history-name').textContent = state.playerName || 'JOUEUR';

    renderTournaments(state.tournaments || [], color);
  }

  function renderTournaments(tournaments, color) {
    const container = el('history-tournaments');
    if (!container) return;
    container.innerHTML = '';

    if (!tournaments.length) {
      container.innerHTML = '<div class="history-empty">Aucun historique disponible</div>';
      return;
    }

    tournaments.forEach(t => {
      const p = t.placement;
      let placementClass = 'other';
      let placementLabel = '?';
      if (p) {
        if      (p === 1) placementClass = 'top1';
        else if (p === 2) placementClass = 'top2';
        else if (p === 3) placementClass = 'top3';
        else if (p <= 8)  placementClass = 'top8';
        placementLabel = p === 1 ? '1er' : p + 'e';
      }

      const entrantsStr = t.numEntrants ? `/${t.numEntrants}` : '';
      const dateStr = t.startAt
        ? new Date(t.startAt * 1000).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
        : '';

      const block = document.createElement('div');
      block.className = 'history-tournament';

      // Header du tournoi
      const header = document.createElement('div');
      header.className = 'history-tournament-header';
      header.innerHTML = `
        <div class="history-tournament-placement ${placementClass}">${placementLabel}${entrantsStr}</div>
        <div class="history-tournament-info">
          <span class="history-tournament-name">${escHtml(t.tournamentName)}</span>
          <span class="history-tournament-event">${escHtml(t.eventName)}</span>
        </div>
        <div class="history-tournament-meta">${dateStr}</div>
      `;
      block.appendChild(header);

      // Sets du tournoi
      if (t.sets && t.sets.length) {
        const setsDiv = document.createElement('div');
        setsDiv.className = 'history-sets';

        t.sets.forEach(s => {
          const isWin    = s.result === 'W';
          const hasScore = s.score !== undefined && s.opponentScore !== undefined;
          const scoreStr = hasScore ? `${s.score}-${s.opponentScore}` : '';
          const oppLabel = s.opponentTag ? `[${escHtml(s.opponentTag)}] ` : '';

          const row = document.createElement('div');
          row.className = 'history-set-row';
          row.innerHTML = `
            <div class="history-set-badge ${isWin ? 'win' : 'loss'}">${s.result}</div>
            ${scoreStr ? `<div class="history-set-score">${scoreStr}</div>` : ''}
            <div class="history-set-opponent">${oppLabel}${escHtml(s.opponentName || '?')}</div>
            <div class="history-set-round">${escHtml(s.round || '')}</div>
          `;
          setsDiv.appendChild(row);
        });

        block.appendChild(setsDiv);
      }

      container.appendChild(block);
    });
  }

  // ── Fetch + Poll ──────────────────────────────────────────────────────────

  function poll() {
    fetch('/api/tournament-history')
      .then(r => r.json())
      .then(render)
      .catch(() => {});
  }

  poll();
  setInterval(poll, 2000);

  try {
    const socket = io();
    socket.on('tournamentHistoryUpdate', render);
  } catch (e) {}

})();

// ─── Player Stats Overlay ──────────────────────────────────────────────────

(function () {

  // ── Helpers ──────────────────────────────────────────────────────────────

  function el(id) { return document.getElementById(id); }

  function lighten(hex, amt) {
    try {
      const r = Math.min(255, parseInt(hex.slice(1,3),16) + amt);
      const g = Math.min(255, parseInt(hex.slice(3,5),16) + amt);
      const b = Math.min(255, parseInt(hex.slice(5,7),16) + amt);
      return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
    } catch { return hex; }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  let lastVisible = null;

  function render(state) {
    if (!state) return;

    const overlay = el('stats-overlay');
    if (!overlay) return;

    if (!state.visible) {
      overlay.classList.add('hidden');
      lastVisible = false;
      return;
    }

    overlay.classList.remove('hidden');
    lastVisible = true;

    const color = state.playerColor || '#E8B830';
    const colorLight = lighten(color, 20);

    // Header
    el('stats-tag').textContent  = state.playerTag  || '';
    el('stats-name').textContent = state.playerName || 'JOUEUR';
    el('stats-event').textContent = state.eventName || '';

    // Color bar
    el('stats-color-bar').style.background = color;

    // Winrate
    const wins   = state.wins   || 0;
    const losses = state.losses || 0;
    const total  = wins + losses;
    const pct    = total > 0 ? Math.round((wins / total) * 100) : 0;

    const wrBar = el('stats-wr-bar');
    wrBar.style.width      = pct + '%';
    wrBar.style.background = `linear-gradient(90deg, ${color}, ${colorLight})`;

    el('stats-wr-pct').textContent    = pct + '%';
    el('stats-wr-record').textContent = wins + 'V \u2013 ' + losses + 'D';

    // Characters
    renderChars(state.topCharacters || [], color);

    // Prochain match
    renderNextMatch(state.nextMatch || null);

    // Tous les matchs joués
    renderResults(state.allMatches || []);

  }

  function renderChars(chars, color) {
    const list = el('stats-chars-list');
    if (!list) return;
    list.innerHTML = '';

    if (!chars.length) {
      list.innerHTML = '<div class="stats-char-row placeholder"><span style="color:#5A5A7A;font-size:11px">Aucune donnée de personnage</span></div>';
      return;
    }

    const maxGames = chars[0]?.games || 1;

    chars.slice(0, 3).forEach((char, i) => {
      const barPct = maxGames > 0 ? Math.round((char.games / maxGames) * 100) : 0;
      const row = document.createElement('div');
      row.className = 'stats-char-row';

      const imgHtml = char.image
        ? `<img src="${char.image}" alt="" onerror="this.style.display='none'" />`
        : '';

      row.innerHTML = `
        <div class="stats-char-rank">${i + 1}</div>
        <div class="stats-char-icon">${imgHtml}</div>
        <div class="stats-char-info">
          <span class="stats-char-name">${escHtml(char.name)}</span>
          <div class="stats-char-bar-wrap">
            <div class="stats-char-bar" style="width:${barPct}%;background:${color}"></div>
          </div>
        </div>
        <div class="stats-char-meta">${char.games} game${char.games !== 1 ? 's' : ''}</div>
      `;
      list.appendChild(row);
    });
  }

  function renderNextMatch(next) {
    const section = el('stats-next-section');
    const box     = el('stats-next-match');
    if (!section || !box) return;

    if (!next) {
      section.style.display = 'none';
      return;
    }

    section.style.display = '';
    const isLive = next.state === 2;
    const oppLabel = next.opponentTag
      ? `<span class="stats-next-opponent-tag">[${escHtml(next.opponentTag)}]</span> `
      : '';

    box.innerHTML = `
      ${isLive ? '<div class="stats-next-live-dot"></div>' : ''}
      <div class="stats-next-vs">VS</div>
      <div class="stats-next-opponent">
        <span class="stats-next-opponent-name">${oppLabel}${escHtml(next.opponentName)}</span>
      </div>
      <div class="stats-next-round">${escHtml(next.round)}</div>
    `;
  }

  function renderResults(results) {
    const list = el('stats-results-list');
    if (!list) return;
    list.innerHTML = '';

    if (!results.length) {
      list.innerHTML = '<div class="stats-result-row placeholder">Aucun match joué</div>';
      return;
    }

    results.forEach(r => {
      const isWin    = r.result === 'W';
      const hasScore = r.score !== undefined && r.opponentScore !== undefined;
      const scoreStr = hasScore ? `${r.score}-${r.opponentScore}` : '';
      const oppLabel = r.opponentTag ? `[${escHtml(r.opponentTag)}] ` : '';

      const row = document.createElement('div');
      row.className = 'stats-result-row';
      row.innerHTML = `
        <div class="stats-result-badge ${isWin ? 'win' : 'loss'}">${r.result}</div>
        ${scoreStr ? `<div class="stats-result-score">${scoreStr}</div>` : ''}
        <div class="stats-result-opponent">${oppLabel}${escHtml(r.opponentName || '?')}</div>
        <div class="stats-result-round">${escHtml(r.round || '')}</div>
      `;
      list.appendChild(row);
    });
  }


  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ── Fetch + Poll ──────────────────────────────────────────────────────────
  // Polling de secours : OBS Browser Source peut perdre la connexion Socket.io.
  // On interroge l'API toutes les 2s pour garantir la mise à jour.

  function poll() {
    fetch('/api/player-stats')
      .then(r => r.json())
      .then(render)
      .catch(() => {});
  }

  poll(); // Chargement initial immédiat
  setInterval(poll, 2000);

  // ── Socket.io (mise à jour instantanée) ───────────────────────────────────
  try {
    const socket = io();
    socket.on('playerStatsUpdate', render);
  } catch (e) {
    // Socket.io indisponible, le polling prend le relais
  }

})();

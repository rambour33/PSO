// ─── Player Stats Control ──────────────────────────────────────────────────

(function () {

  // These variables are shared with startgg-ui.js context via globals set by it.
  // We listen for a custom event dispatched by startgg-ui when entrants/event are loaded.
  let currentEventId = null;
  let currentEntrants = [];

  // ── Helpers ──────────────────────────────────────────────────────────────

  function showStatsStatus(msg, isError = false) {
    const el = document.getElementById('ps-status');
    if (el) { el.textContent = msg; el.style.color = isError ? '#e05050' : '#8888AA'; }
  }

  // ── Expose hook for startgg-ui to call when entrants/event are ready ──────

  window.onStartggEntrantsLoaded = function(eventId, entrants) {
    currentEventId = eventId;
    currentEntrants = entrants || [];
    populateEntrantSelect(currentEntrants);
    document.getElementById('ps-section').style.display = '';
  };

  function populateEntrantSelect(entrants) {
    const sel = document.getElementById('ps-entrant-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Choisir un joueur --</option>';
    entrants.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      const label = e.prefix ? `[${e.prefix}] ${e.tag}` : e.tag;
      opt.textContent = label;
      opt.dataset.tag = e.prefix || '';
      opt.dataset.name = e.tag;
      sel.appendChild(opt);
    });
  }

  // ── Filter entrant select ─────────────────────────────────────────────────

  const psSearch = document.getElementById('ps-entrant-search');
  if (psSearch) {
    psSearch.addEventListener('input', () => {
      const q = psSearch.value.toLowerCase();
      const filtered = q
        ? currentEntrants.filter(e =>
            e.tag.toLowerCase().includes(q) || (e.prefix || '').toLowerCase().includes(q)
          )
        : currentEntrants;
      populateEntrantSelect(filtered);
    });
  }

  // ── Load Stats ────────────────────────────────────────────────────────────

  const loadBtn = document.getElementById('ps-load-btn');
  if (loadBtn) {
    loadBtn.addEventListener('click', async () => {
      const sel = document.getElementById('ps-entrant-select');
      const entrantId = sel?.value;
      if (!entrantId || !currentEventId) {
        showStatsStatus('Sélectionnez un joueur et chargez un évènement d\'abord.', true);
        return;
      }
      showStatsStatus('Chargement des stats…');
      loadBtn.disabled = true;

      try {
        const res = await fetch(`/api/startgg/event/${currentEventId}/player-stats/${entrantId}`);
        const data = await res.json();
        if (data.error) { showStatsStatus('Erreur : ' + data.error, true); return; }

        // Show preview
        renderStatsPreview(data);
        showStatsStatus('Stats chargées.');

        // Store for sending
        window._loadedPlayerStats = data;

        // Afficher la section historique
        const histSection = document.getElementById('ps-history-section');
        if (histSection) histSection.style.display = '';
        window._loadedHistory = null;
        const histSendBtn = document.getElementById('ps-history-send-btn');
        if (histSendBtn) histSendBtn.disabled = true;
        showHistoryStatus('');
      } catch (e) {
        showStatsStatus('Erreur réseau : ' + e.message, true);
      } finally {
        loadBtn.disabled = false;
      }
    });
  }

  // ── Preview ───────────────────────────────────────────────────────────────

  function renderStatsPreview(data) {
    const preview = document.getElementById('ps-preview');
    if (!preview) return;

    const wins = data.wins || 0;
    const losses = data.losses || 0;
    const total = wins + losses;
    const pct = total > 0 ? Math.round((wins / total) * 100) : 0;

    const chars = (data.topCharacters || []).slice(0, 3).map(c => c.name).join(', ') || '—';

    preview.innerHTML = `
      <div class="ps-preview-inner">
        <div class="ps-preview-row">
          <strong>${data.playerTag ? '[' + data.playerTag + '] ' : ''}${data.playerName}</strong>
        </div>
        <div class="ps-preview-row">
          Winrate : <b>${pct}%</b> (${wins}V – ${losses}D)
        </div>
        <div class="ps-preview-row">
          Top persos : ${chars}
        </div>
        <div class="ps-preview-row hint">
          ${(data.recentResults || []).length} résultats récupérés
        </div>
      </div>
    `;
    preview.style.display = '';
    document.getElementById('ps-send-section').style.display = '';
  }

  // ── Send to overlay ───────────────────────────────────────────────────────

  const sendBtn = document.getElementById('ps-send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      if (!window._loadedPlayerStats) return;

      const sel = document.getElementById('ps-entrant-select');
      const selectedOpt = sel?.options[sel.selectedIndex];
      const color = document.getElementById('ps-color')?.value || '#E8B830';

      const payload = {
        ...window._loadedPlayerStats,
        playerColor: color,
        visible: true,
      };

      await fetch('/api/player-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showStatsStatus('Stats envoyées à l\'overlay !');
    });
  }

  // ── Hide stats overlay ────────────────────────────────────────────────────

  const hideBtn = document.getElementById('ps-hide-btn');
  if (hideBtn) {
    hideBtn.addEventListener('click', async () => {
      await fetch('/api/player-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: false })
      });
      showStatsStatus('Overlay masqué.');
    });
  }

  // ── History section ───────────────────────────────────────────────────────

  function showHistoryStatus(msg, isError = false) {
    const el = document.getElementById('ps-history-status');
    if (el) { el.textContent = msg; el.style.color = isError ? '#e05050' : '#8888AA'; }
  }

  const historyLoadBtn = document.getElementById('ps-history-load-btn');
  if (historyLoadBtn) {
    historyLoadBtn.addEventListener('click', async () => {
      const sel = document.getElementById('ps-entrant-select');
      const entrantId = sel?.value;
      if (!entrantId || !currentEventId) {
        showHistoryStatus('Chargez un joueur d\'abord.', true);
        return;
      }
      showHistoryStatus('Chargement de l\'historique…');
      historyLoadBtn.disabled = true;

      try {
        const res  = await fetch(`/api/startgg/event/${currentEventId}/player-history/${entrantId}`);
        const data = await res.json();
        if (data.error) { showHistoryStatus('Erreur : ' + data.error, true); return; }

        window._loadedHistory = data;
        const count = (data.tournaments || []).length;
        showHistoryStatus(`${count} tournoi(s) récupéré(s).`);

        const sendBtn = document.getElementById('ps-history-send-btn');
        if (sendBtn) sendBtn.disabled = false;
      } catch (e) {
        showHistoryStatus('Erreur réseau : ' + e.message, true);
      } finally {
        historyLoadBtn.disabled = false;
      }
    });
  }

  const historySendBtn = document.getElementById('ps-history-send-btn');
  if (historySendBtn) {
    historySendBtn.addEventListener('click', async () => {
      if (!window._loadedHistory) return;
      const color = document.getElementById('ps-color')?.value || '#E8B830';
      await fetch('/api/tournament-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...window._loadedHistory,
          playerColor: color,
          visible: true,
        })
      });
      showHistoryStatus('Historique envoyé à l\'overlay !');
    });
  }

  const historyHideBtn = document.getElementById('ps-history-hide-btn');
  if (historyHideBtn) {
    historyHideBtn.addEventListener('click', async () => {
      await fetch('/api/tournament-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: false })
      });
      showHistoryStatus('Overlay historique masqué.');
    });
  }

})();

// ─── H2H Control ─────────────────────────────────────────────────────────────

(function () {

  let currentEventId = null;
  let currentEntrants = [];
  let _loadedH2H = null;

  function status(msg, isError = false) {
    const el = document.getElementById('h2h-status');
    if (el) { el.textContent = msg; el.style.color = isError ? '#e05050' : '#8888AA'; }
  }

  // ── Appelé par startgg-ui quand les entrants sont chargés ─────────────────

  window.onStartggEntrantsLoaded = (function (prev) {
    return function (eventId, entrants) {
      if (prev) prev(eventId, entrants);
      currentEventId  = eventId;
      currentEntrants = entrants || [];
      populateSelects(currentEntrants);
      const sec = document.getElementById('sgg-h2h-section');
      if (sec) sec.style.display = '';
    };
  })(window.onStartggEntrantsLoaded);

  function populateSelects(entrants) {
    ['h2h-select-1', 'h2h-select-2'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      const prev = sel.value;
      sel.innerHTML = '<option value="">-- Choisir --</option>';
      entrants.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = e.prefix ? `[${e.prefix}] ${e.tag}` : e.tag;
        sel.appendChild(opt);
      });
      if (prev) sel.value = prev;
    });
  }

  // ── Filtres de recherche ──────────────────────────────────────────────────

  function bindSearch(searchId, selectId) {
    const inp = document.getElementById(searchId);
    if (!inp) return;
    inp.addEventListener('input', () => {
      const q = inp.value.toLowerCase();
      const filtered = q
        ? currentEntrants.filter(e => e.tag.toLowerCase().includes(q) || (e.prefix || '').toLowerCase().includes(q))
        : currentEntrants;
      populateFiltered(selectId, filtered);
    });
  }

  function populateFiltered(selectId, entrants) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = '<option value="">-- Choisir --</option>';
    entrants.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = e.prefix ? `[${e.prefix}] ${e.tag}` : e.tag;
      sel.appendChild(opt);
    });
    if (prev) sel.value = prev;
  }

  bindSearch('h2h-search-1', 'h2h-select-1');
  bindSearch('h2h-search-2', 'h2h-select-2');

  // ── Calculer H2H ─────────────────────────────────────────────────────────

  document.getElementById('h2h-calc-btn')?.addEventListener('click', async () => {
    const e1 = document.getElementById('h2h-select-1')?.value;
    const e2 = document.getElementById('h2h-select-2')?.value;
    if (!e1 || !e2 || !currentEventId) {
      status('Sélectionnez deux joueurs et chargez un évènement d\'abord.', true);
      return;
    }
    if (e1 === e2) { status('Choisissez deux joueurs différents.', true); return; }
    status('Calcul en cours…');
    document.getElementById('h2h-calc-btn').disabled = true;
    try {
      const res  = await fetch(`/api/startgg/event/${currentEventId}/h2h/${e1}/${e2}`);
      const data = await res.json();
      if (data.error) { status('Erreur : ' + data.error, true); return; }
      _loadedH2H = data;
      renderPreview(data);
      status('H2H calculé.');
      const showBtn = document.getElementById('h2h-show-btn');
      if (showBtn) showBtn.disabled = false;
    } catch (e) {
      status('Erreur réseau : ' + e.message, true);
    } finally {
      document.getElementById('h2h-calc-btn').disabled = false;
    }
  });

  function renderPreview(data) {
    const preview = document.getElementById('h2h-preview');
    const content = document.getElementById('h2h-preview-content');
    if (!preview || !content) return;
    const h = data.h2h || {};
    const p1 = data.player1 || {};
    const p2 = data.player2 || {};
    const s1 = p1.currentStats || {};
    const s2 = p2.currentStats || {};
    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="color:var(--gold);font-weight:700">${p1.tag ? '[' + p1.tag + '] ' : ''}${p1.name || '?'}</span>
        <span style="color:var(--text-muted)">vs</span>
        <span style="color:var(--gold);font-weight:700">${p2.tag ? '[' + p2.tag + '] ' : ''}${p2.name || '?'}</span>
      </div>
      <div style="text-align:center;font-size:15px;font-weight:700;margin-bottom:4px">
        ${h.player1Wins ?? 0} – ${h.player2Wins ?? 0}
        <span style="font-size:11px;color:var(--text-muted);font-weight:400">(${h.totalSets ?? 0} sets)</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted)">
        <span>WR événement : ${s1.winRate ?? 0}% (${s1.wins ?? 0}V–${s1.losses ?? 0}D)</span>
        <span>${s2.winRate ?? 0}% (${s2.wins ?? 0}V–${s2.losses ?? 0}D)</span>
      </div>
    `;
    preview.style.display = '';
  }

  // ── Envoyer à l'overlay ───────────────────────────────────────────────────

  document.getElementById('h2h-show-btn')?.addEventListener('click', async () => {
    if (!_loadedH2H) return;
    const color1 = document.getElementById('h2h-color-1')?.value || '#E83030';
    const color2 = document.getElementById('h2h-color-2')?.value || '#3070E8';
    const payload = {
      visible:   true,
      eventName: _loadedH2H.eventName || '',
      player1:   { ..._loadedH2H.player1, color: color1 },
      player2:   { ..._loadedH2H.player2, color: color2 },
      h2h:       _loadedH2H.h2h,
    };
    await fetch('/api/h2h', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    status('H2H affiché sur l\'overlay.');
  });

  document.getElementById('h2h-hide-btn')?.addEventListener('click', async () => {
    await fetch('/api/h2h', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: false }),
    });
    status('Overlay masqué.');
  });

})();

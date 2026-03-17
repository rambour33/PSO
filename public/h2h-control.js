// ─── H2H Control ──────────────────────────────────────────────────────────

(function () {

  let _currentEventId = null;
  let _h2hEntrant1Id  = null;
  let _h2hEntrant2Id  = null;
  let _loadedH2H      = null;
  let _allEntrants    = [];

  function showStatus(msg, isError = false) {
    const el = document.getElementById('h2h-status');
    if (el) { el.textContent = msg; el.style.color = isError ? '#e05050' : '#8888AA'; }
  }

  function updateDisplays() {
    const sel1 = document.getElementById('h2h-select1');
    const sel2 = document.getElementById('h2h-select2');
    const opt1 = sel1?.options[sel1.selectedIndex];
    const opt2 = sel2?.options[sel2.selectedIndex];

    const p1 = document.getElementById('h2h-p1-display');
    const p2 = document.getElementById('h2h-p2-display');
    if (p1) p1.textContent = opt1?.dataset.label || '—';
    if (p2) p2.textContent = opt2?.dataset.label || '—';

    _h2hEntrant1Id = sel1?.value || null;
    _h2hEntrant2Id = sel2?.value || null;

    const loadBtn = document.getElementById('h2h-load-btn');
    if (loadBtn) loadBtn.disabled = !(_h2hEntrant1Id && _h2hEntrant2Id);
  }

  function populateSelect(selectId, entrants) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">-- Choisir --</option>';
    entrants.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      const label = e.prefix ? `[${e.prefix}] ${e.tag}` : e.tag;
      opt.textContent = label;
      opt.dataset.label = label;
      if (String(e.id) === String(current)) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function setupSearch(searchId, selectId) {
    const input = document.getElementById(searchId);
    if (!input) return;
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      const filtered = q
        ? _allEntrants.filter(e =>
            e.tag.toLowerCase().includes(q) || (e.prefix||'').toLowerCase().includes(q))
        : _allEntrants;
      populateSelect(selectId, filtered);
      updateDisplays();
    });
  }

  // ── Hook depuis startgg-ui : event + entrants chargés ─────────────────────

  window.onStartggEventLoaded = function (eventId) {
    _currentEventId = eventId;
    const section = document.getElementById('h2h-section');
    if (section) section.style.display = '';
  };

  // Appelé quand les entrants sont chargés (depuis startgg-ui)
  const _origOnEntrantsLoaded = window.onStartggEntrantsLoaded;
  window.onStartggEntrantsLoaded = function (eventId, entrants) {
    _allEntrants = entrants || [];
    populateSelect('h2h-select1', _allEntrants);
    populateSelect('h2h-select2', _allEntrants);
    setupSearch('h2h-search1', 'h2h-select1');
    setupSearch('h2h-search2', 'h2h-select2');
    document.getElementById('h2h-select1')?.addEventListener('change', updateDisplays);
    document.getElementById('h2h-select2')?.addEventListener('change', updateDisplays);
    if (typeof _origOnEntrantsLoaded === 'function') _origOnEntrantsLoaded(eventId, entrants);
  };

  // ── Bouton H2H sur une carte set (pré-sélectionne les deux joueurs) ────────

  window.triggerH2HFromSet = function (p1tag, p1name, p2tag, p2name, e1Id, e2Id) {
    // Pré-sélectionner dans les selects
    const sel1 = document.getElementById('h2h-select1');
    const sel2 = document.getElementById('h2h-select2');
    if (sel1) sel1.value = e1Id;
    if (sel2) sel2.value = e2Id;

    _h2hEntrant1Id = e1Id;
    _h2hEntrant2Id = e2Id;

    const p1label = (p1tag ? `[${p1tag}] ` : '') + p1name;
    const p2label = (p2tag ? `[${p2tag}] ` : '') + p2name;
    const p1d = document.getElementById('h2h-p1-display');
    const p2d = document.getElementById('h2h-p2-display');
    if (p1d) p1d.textContent = p1label;
    if (p2d) p2d.textContent = p2label;

    const section = document.getElementById('h2h-section');
    if (section) section.style.display = '';
    showStatus('Joueurs sélectionnés depuis le set. Cliquez sur "Charger le H2H".');
    document.getElementById('h2h-load-btn').disabled = false;
  };

  // ── Charger le H2H ────────────────────────────────────────────────────────

  const loadBtn = document.getElementById('h2h-load-btn');
  if (loadBtn) {
    loadBtn.addEventListener('click', async () => {
      if (!_h2hEntrant1Id || !_h2hEntrant2Id || !_currentEventId) {
        showStatus('Sélectionnez un match dans "Sets en cours" d\'abord.', true);
        return;
      }
      showStatus('Chargement du H2H… (peut prendre quelques secondes)');
      loadBtn.disabled = true;

      try {
        const limitChecked = document.getElementById('h2h-limit-toggle')?.checked;
        const limitParam   = limitChecked ? '?limitTournaments=40' : '';
        const url = `/api/startgg/event/${_currentEventId}/h2h/${_h2hEntrant1Id}/${_h2hEntrant2Id}${limitParam}`;
        const res  = await fetch(url);
        const data = await res.json();
        if (data.error) { showStatus('Erreur : ' + data.error, true); return; }

        _loadedH2H = data;
        const total = data.h2h?.totalSets || 0;
        showStatus(`H2H chargé. ${total} confrontation(s) trouvée(s).`);

        // Prévisualisation
        const prev = document.getElementById('h2h-preview');
        if (prev) {
          const p1 = data.player1;
          const p2 = data.player2;
          prev.innerHTML = `
            <div class="ps-preview-inner">
              <div class="ps-preview-row">
                <strong>${p1.tag ? '[' + p1.tag + '] ' : ''}${p1.name}</strong>
                vs
                <strong>${p2.tag ? '[' + p2.tag + '] ' : ''}${p2.name}</strong>
              </div>
              <div class="ps-preview-row">
                Tournoi actuel — ${p1.name} : <b>${p1.currentStats.winRate}%</b>
                (${p1.currentStats.wins}V-${p1.currentStats.losses}D) /
                ${p2.name} : <b>${p2.currentStats.winRate}%</b>
                (${p2.currentStats.wins}V-${p2.currentStats.losses}D)
              </div>
              <div class="ps-preview-row">
                H2H total : <b>${data.h2h.player1Wins}</b>-<b>${data.h2h.player2Wins}</b>
              </div>
            </div>
          `;
          prev.style.display = '';
        }

        document.getElementById('h2h-send-section').style.display = '';
      } catch (e) {
        showStatus('Erreur réseau : ' + e.message, true);
      } finally {
        loadBtn.disabled = false;
      }
    });
  }

  // ── Envoyer à l'overlay ───────────────────────────────────────────────────

  const sendBtn = document.getElementById('h2h-send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      if (!_loadedH2H) return;
      const color1 = document.getElementById('h2h-color1')?.value || '#E83030';
      const color2 = document.getElementById('h2h-color2')?.value || '#3070E8';

      await fetch('/api/h2h', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ..._loadedH2H,
          player1: { ..._loadedH2H.player1, color: color1 },
          player2: { ..._loadedH2H.player2, color: color2 },
          visible: true,
        }),
      });
      showStatus('H2H envoyé à l\'overlay !');
    });
  }

  // ── Masquer ───────────────────────────────────────────────────────────────

  const hideBtn = document.getElementById('h2h-hide-btn');
  if (hideBtn) {
    hideBtn.addEventListener('click', async () => {
      await fetch('/api/h2h', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: false }),
      });
      showStatus('Overlay H2H masqué.');
    });
  }

})();

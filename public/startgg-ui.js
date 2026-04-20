// ─── start.gg UI ──────────────────────────────────────────────────────────────

(function () {
  // State
  let currentEventId        = null;
  let currentTournamentSlug = null;
  let allEntrants           = [];
  let currentPage         = 1;
  const PER_PAGE          = 100;
  let tournamentName      = '';
  let tournamentLogo      = '';
  let currentEventName    = '';

  // Auto-refresh
  const REFRESH_INTERVAL  = 60; // secondes
  let _refreshTimer       = null;
  let _countdownTimer     = null;
  let _countdownSec       = 0;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function showStatus(msg, isError = false) {
    const el = document.getElementById('status-msg');
    if (el) { el.textContent = msg; el.style.color = isError ? '#e05' : ''; }
  }

  function slugFromInput(raw) {
    raw = raw.trim();
    // Accept full URL like https://www.start.gg/tournament/foo/event/bar
    const m = raw.match(/tournament\/([^\/\s?#]+)/);
    if (m) return 'tournament/' + m[1];
    // Accept bare slug like "combo-breaker-2024"
    if (!raw.includes('/')) return 'tournament/' + raw;
    return raw;
  }

  // ── API Key ──────────────────────────────────────────────────────────────────

  async function loadKeyStatus() {
    const res = await fetch('/api/startgg/config');
    const data = await res.json();
    ['sgg-key-status', 'match-sgg-key-status'].forEach(id => {
      const hint = document.getElementById(id);
      if (!hint) return;
      if (data.hasKey) { hint.textContent = '✓ Clé API enregistrée'; hint.style.color = '#4caf50'; }
      else             { hint.textContent = 'Aucune clé API enregistrée.'; hint.style.color = '#e05050'; }
    });
  }

  async function saveApiKey(inputId) {
    const key = document.getElementById(inputId)?.value.trim();
    if (!key) return;
    await fetch('/api/startgg/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key })
    });
    document.getElementById(inputId).value = '';
    await loadKeyStatus();
    showStatus('Clé API start.gg enregistrée');
  }

  document.getElementById('sgg-save-key').addEventListener('click', () => saveApiKey('sgg-api-key'));
  document.getElementById('match-sgg-save-key')?.addEventListener('click', () => saveApiKey('match-sgg-api-key'));

  // ── Tournament Search ─────────────────────────────────────────────────────────

  async function searchTournament(slugInputId, infoId, nameId, selectId) {
    const raw = document.getElementById(slugInputId)?.value || '';
    if (!raw.trim()) return;
    const slug = slugFromInput(raw);
    showStatus('Recherche du tournoi…');
    document.getElementById(infoId).style.display = 'none';
    document.getElementById('sgg-entrants-section').style.display = 'none';
    document.getElementById('sgg-sets-section').style.display = 'none';

    const res = await fetch(`/api/startgg/tournament/${encodeURIComponent(slug)}`);
    const data = await res.json();
    if (data.error) { showStatus('Erreur : ' + data.error, true); return; }

    currentTournamentSlug = slug;
    tournamentName = data.name || '';
    const logoImg = (data.images || []).find(i => i.type === 'profile') || data.images?.[0];
    tournamentLogo = logoImg?.url || '';

    // Mettre à jour TOUS les sélecteurs d'événements (onglet startgg + onglet match)
    ['sgg-tournament-info', 'match-sgg-tournament-info'].forEach(tid => {
      const info = document.getElementById(tid);
      if (!info) return;
      const tname = info.querySelector('[id$="-tournament-name"]') || document.getElementById(tid.replace('tournament-info', 'tournament-name'));
      if (tname) tname.textContent = '🏆 ' + data.name;
      const sel = info.querySelector('select') || document.getElementById(tid.replace('tournament-info', 'event-select'));
      if (sel) {
        sel.innerHTML = '';
        (data.events || []).forEach(ev => {
          const opt = document.createElement('option');
          opt.value = ev.id;
          opt.textContent = `${ev.name} (${ev.numEntrants ?? '?'} joueurs)`;
          sel.appendChild(opt);
        });
      }
      info.style.display = '';
    });
    showStatus('Tournoi chargé : ' + data.name);
  }

  document.getElementById('sgg-search-btn').addEventListener('click', () =>
    searchTournament('sgg-slug', 'sgg-tournament-info', 'sgg-tournament-name', 'sgg-event-select'));
  document.getElementById('match-sgg-search-btn')?.addEventListener('click', () =>
    searchTournament('match-sgg-slug', 'match-sgg-tournament-info', 'match-sgg-tournament-name', 'match-sgg-event-select'));

  // ── Load Entrants ─────────────────────────────────────────────────────────────

  async function loadEvent(selectId) {
    const sel = document.getElementById(selectId);
    const eventId = sel?.value;
    if (!eventId) return;
    currentEventId   = eventId;
    currentEventName = sel.options[sel.selectedIndex]?.text?.replace(/\s*\(\d+.*\)$/, '').trim() || '';
    // Synchroniser l'autre sélecteur si besoin
    const otherId = selectId === 'sgg-event-select' ? 'match-sgg-event-select' : 'sgg-event-select';
    const other = document.getElementById(otherId);
    if (other && other.value !== eventId) other.value = eventId;
    currentPage = 1;
    await fetchEntrants(eventId, 1);
    document.getElementById('sgg-sets-section').style.display = '';
    await Promise.all([fetchSets(eventId), fetchStreamQueue()]);
    startAutoRefresh();
    // Masquer la section connexion dans l'onglet match une fois chargée
    const matchConnect = document.getElementById('match-sgg-connect-section');
    if (matchConnect) matchConnect.style.display = 'none';
  }

  document.getElementById('sgg-load-event').addEventListener('click', () => loadEvent('sgg-event-select'));
  document.getElementById('match-sgg-load-event')?.addEventListener('click', () => loadEvent('match-sgg-event-select'));

  async function fetchEntrants(eventId, page) {
    showStatus('Chargement des participants…');
    const res = await fetch(`/api/startgg/event/${eventId}/entrants?page=${page}`);
    const data = await res.json();
    if (data.error) { showStatus('Erreur : ' + data.error, true); return; }

    allEntrants = (data.entrants?.nodes || []).map(e => ({
      id:       e.id,
      name:     e.name,
      tag:      e.participants?.[0]?.gamerTag || e.name,
      prefix:   e.participants?.[0]?.prefix || '',
      playerId: e.participants?.[0]?.player?.id || null,
      userSlug: e.participants?.[0]?.player?.user?.slug || null,
      seeding:  e.initialSeedNum || null,
    }));
    const total = data.entrants?.pageInfo?.total || allEntrants.length;
    document.getElementById('sgg-entrants-count').textContent = `${total} participants`;
    document.getElementById('sgg-entrants-section').style.display = '';
    renderEntrants(allEntrants);
    setupAutocomplete(1);
    setupAutocomplete(2);
    showStatus('Participants chargés : ' + allEntrants.length);
    if (typeof window.onStartggEntrantsLoaded === 'function') {
      window.onStartggEntrantsLoaded(eventId, allEntrants);
    }
    if (typeof window.onStartggEventLoaded === 'function') {
      window.onStartggEventLoaded(eventId);
    }
  }

  function renderEntrants(list) {
    const container = document.getElementById('sgg-entrants-list');
    container.innerHTML = '';
    if (!list.length) {
      container.innerHTML = '<p class="hint">Aucun participant trouvé.</p>';
      return;
    }
    list.forEach(e => {
      const row = document.createElement('div');
      row.className = 'sgg-entrant-row';
      const label = e.prefix ? `[${e.prefix}] ${e.tag}` : e.tag;
      const seedLabel = e.seeding != null ? ` <span style="font-size:10px;color:var(--text-muted)">#${e.seeding}</span>` : '';
      row.innerHTML = `
        <span class="sgg-entrant-name">${label}${seedLabel}</span>
        <div class="sgg-entrant-actions">
          <button class="btn btn-outline btn-sm sgg-apply-p1" data-tag="${e.prefix}" data-name="${e.tag}" data-seed="${e.seeding ?? ''}">→ J1</button>
          <button class="btn btn-outline btn-sm sgg-apply-p2" data-tag="${e.prefix}" data-name="${e.tag}" data-seed="${e.seeding ?? ''}">→ J2</button>
        </div>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll('.sgg-apply-p1').forEach(btn => {
      btn.addEventListener('click', () => applyPlayer(1, btn.dataset.tag, btn.dataset.name, btn.dataset.seed ? parseInt(btn.dataset.seed) : null));
    });
    container.querySelectorAll('.sgg-apply-p2').forEach(btn => {
      btn.addEventListener('click', () => applyPlayer(2, btn.dataset.tag, btn.dataset.name, btn.dataset.seed ? parseInt(btn.dataset.seed) : null));
    });
  }

  // Filter
  document.getElementById('sgg-entrants-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = allEntrants.filter(p =>
      p.tag.toLowerCase().includes(q) || p.prefix.toLowerCase().includes(q)
    );
    renderEntrants(filtered);
  });

  // ── Apply Player ──────────────────────────────────────────────────────────────

  function applyPlayer(playerNum, prefix, tag, seeding) {
    const tagInput  = document.getElementById(`p${playerNum}-tag`);
    const nameInput = document.getElementById(`p${playerNum}-name`);
    const seedInput = document.getElementById(`p${playerNum}-seed`);
    if (tagInput)  tagInput.value  = prefix || '';
    if (nameInput) nameInput.value = tag;
    if (seedInput) seedInput.value = seeding != null ? seeding : '';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    showStatus(`Joueur ${playerNum} mis à jour : ${tag}${seeding != null ? ' (seed #' + seeding + ')' : ''}`);
  }

  // ── Constructeur de carte de set ─────────────────────────────────────────────

  function buildSetCard(s, roundFull, extraPrefix) {
    const [slot1, slot2] = s.slots || [];
    const p1 = slot1?.entrant?.participants?.[0];
    const p2 = slot2?.entrant?.participants?.[0];
    const p1Name    = p1?.gamerTag || slot1?.entrant?.name || '?';
    const p2Name    = p2?.gamerTag || slot2?.entrant?.name || '?';
    const p1Tag     = p1?.prefix || '';
    const p2Tag     = p2?.prefix || '';
    const p1ScoreCur = slot1?.standing?.stats?.score?.value ?? 0;
    const p2ScoreCur = slot2?.standing?.stats?.score?.value ?? 0;
    const p1Seed    = slot1?.entrant?.initialSeedNum ?? '';
    const p2Seed    = slot2?.entrant?.initialSeedNum ?? '';
    const p1Pronouns = p1?.user?.genderPronoun || '';
    const p2Pronouns = p2?.user?.genderPronoun || '';
    const e1Id      = slot1?.entrant?.id || '';
    const e2Id      = slot2?.entrant?.id || '';
    const p1PlayerId = p1?.player?.id || '';
    const p2PlayerId = p2?.player?.id || '';
    const state     = s.state || 1;
    const isActive  = state === 2;

    const seedLabel1  = p1Seed !== '' ? `<span class="sgg-mini-info">#${p1Seed}</span>` : '';
    const seedLabel2  = p2Seed !== '' ? `<span class="sgg-mini-info">#${p2Seed}</span>` : '';
    const pronLabel1  = p1Pronouns ? `<span class="sgg-mini-info">(${p1Pronouns})</span>` : '';
    const pronLabel2  = p2Pronouns ? `<span class="sgg-mini-info">(${p2Pronouns})</span>` : '';
    const stateBadge  = `<span class="sgg-state-badge" style="background:${SET_STATE_COLOR[state]||'#888'}">${SET_STATE_LABEL[state]||''}</span>`;
    const startBtn    = !isActive ? `<button class="btn btn-outline btn-sm sgg-start-set" data-setid="${s.id}">▶ Démarrer</button>` : '';
    const reportToggleBtn = isActive && e1Id && e2Id ? `<button class="btn btn-outline btn-sm sgg-report-toggle">✎ Score</button>` : '';
    const applyBtn    = `<button class="btn btn-primary btn-sm sgg-apply-set"
        data-setid="${s.id}"
        data-p1tag="${p1Tag}" data-p1name="${p1Name}"
        data-p2tag="${p2Tag}" data-p2name="${p2Name}"
        data-p1score="${Math.max(0,p1ScoreCur)}" data-p2score="${Math.max(0,p2ScoreCur)}"
        data-p1seed="${p1Seed}" data-p2seed="${p2Seed}"
        data-p1pronouns="${p1Pronouns}" data-p2pronouns="${p2Pronouns}"
        data-p1entrantid="${e1Id}" data-p2entrantid="${e2Id}"
        data-p1playerid="${p1PlayerId}" data-p2playerid="${p2PlayerId}"
        data-round="${roundFull}">→ Scoreboard</button>`;

    const card = document.createElement('div');
    card.className = 'sgg-set-card';
    card.innerHTML = `
      <div class="sgg-set-players">
        <span>${p1Tag ? '['+p1Tag+'] ':'' }${p1Name} ${seedLabel1} ${pronLabel1}</span>
        <span class="sgg-set-score">${isActive ? p1ScoreCur+' – '+p2ScoreCur : 'vs'}</span>
        <span>${p2Tag ? '['+p2Tag+'] ':'' }${p2Name} ${seedLabel2} ${pronLabel2}</span>
      </div>
      <div class="sgg-set-actions">${stateBadge}${startBtn}${reportToggleBtn}${applyBtn}</div>
    `;

    // Panneau de report inline pour les sets actifs (caché par défaut)
    if (isActive && e1Id && e2Id) {
      const toggleBtn = card.querySelector('.sgg-report-toggle');
      const reportPanel = document.createElement('div');
      reportPanel.className = 'sgg-report-panel';
      reportPanel.style.display = 'none';
      reportPanel.innerHTML = `
        <div class="sgg-report-row">
          <span class="sgg-report-name">${p1Tag ? '['+p1Tag+'] ':'' }${p1Name}</span>
          <div class="sgg-score-stepper">
            <button class="sgg-score-btn" data-delta="-1" data-player="1">−</button>
            <span class="sgg-score-val" data-player="1">0</span>
            <button class="sgg-score-btn" data-delta="1" data-player="1">+</button>
          </div>
          <span class="sgg-report-sep">–</span>
          <div class="sgg-score-stepper">
            <button class="sgg-score-btn" data-delta="-1" data-player="2">−</button>
            <span class="sgg-score-val" data-player="2">0</span>
            <button class="sgg-score-btn" data-delta="1" data-player="2">+</button>
          </div>
          <span class="sgg-report-name sgg-report-name-right">${p2Tag ? '['+p2Tag+'] ':'' }${p2Name}</span>
        </div>
        <div class="sgg-report-actions">
          <span class="sgg-report-status hint"></span>
          <button class="btn btn-outline btn-sm sgg-report-btn"
            data-setid="${s.id}"
            data-p1entrantid="${e1Id}"
            data-p2entrantid="${e2Id}">
            Envoyer le résultat
          </button>
        </div>
      `;

      // Toggle affichage
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          const open = reportPanel.style.display === 'none';
          reportPanel.style.display = open ? '' : 'none';
          toggleBtn.classList.toggle('active', open);
        });
      }

      // Scores locaux
      let sc1 = 0, sc2 = 0;
      function updateDisplay() {
        reportPanel.querySelector('.sgg-score-val[data-player="1"]').textContent = sc1;
        reportPanel.querySelector('.sgg-score-val[data-player="2"]').textContent = sc2;
        const btn = reportPanel.querySelector('.sgg-report-btn');
        btn.disabled = sc1 === sc2;
      }

      reportPanel.querySelectorAll('.sgg-score-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const player = btn.dataset.player;
          const delta  = parseInt(btn.dataset.delta);
          if (player === '1') sc1 = Math.max(0, sc1 + delta);
          else                sc2 = Math.max(0, sc2 + delta);
          updateDisplay();
        });
      });

      reportPanel.querySelector('.sgg-report-btn').addEventListener('click', async function() {
        const statusEl = reportPanel.querySelector('.sgg-report-status');
        this.disabled = true;
        statusEl.textContent = 'Envoi…';
        statusEl.style.color = '';
        try {
          const res = await fetch(`/api/startgg/set/${s.id}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              p1EntrantId: e1Id, p2EntrantId: e2Id,
              p1Score: sc1, p2Score: sc2,
            }),
          });
          const data = await res.json();
          if (data.error) {
            statusEl.textContent = '✗ ' + data.error;
            statusEl.style.color = '#e05';
            this.disabled = false;
          } else {
            statusEl.textContent = '✓ Résultat envoyé';
            statusEl.style.color = '#4caf50';
            showStatus('Score reporté sur start.gg');
            setTimeout(() => doRefresh(), 800);
          }
        } catch (_) {
          statusEl.textContent = '✗ Erreur réseau';
          statusEl.style.color = '#e05';
          this.disabled = false;
        }
      });

      updateDisplay();
      card.appendChild(reportPanel);
    }

    return card;
  }

  // ── Sets ──────────────────────────────────────────────────────────────────────

  async function fetchSets(eventId) {
    const res = await fetch(`/api/startgg/event/${eventId}/sets`);
    const data = await res.json();
    if (data.error) { showStatus('Erreur sets : ' + data.error, true); return; }
    renderSets(data.sets?.nodes || []);
  }

  // SET_STATE : 1=créé, 2=en cours, 3=terminé, 6=appelé
  const SET_STATE_LABEL = { 1: 'En attente', 2: 'En cours', 3: 'Terminé', 6: 'Appelé' };
  const SET_STATE_COLOR = { 1: '#888', 2: '#4caf50', 3: '#555', 6: '#E8B830' };

  // phaseKey → open state (persistent across re-renders)
  const _phaseOpen = {};

  function renderSets(sets) {
    // Tri : phaseOrder → round
    const sorted = [...sets].sort((a, b) => {
      const po = (a.phaseGroup?.phase?.phaseOrder ?? 99) - (b.phaseGroup?.phase?.phaseOrder ?? 99);
      if (po !== 0) return po;
      return (a.round ?? 0) - (b.round ?? 0);
    });
    renderSetsInContainer(sorted, document.getElementById('sgg-sets-list'));
    renderSetsInContainer(sorted, document.getElementById('match-sgg-sets-list'));
    const matchSection = document.getElementById('match-sgg-sets-section');
    if (matchSection) matchSection.style.display = sets.length ? '' : 'none';
  }

  function renderSetsInContainer(sets, container) {
    if (!container) return;
    container.innerHTML = '';
    if (!sets.length) {
      container.innerHTML = '<p class="hint">Aucun set disponible.</p>';
      return;
    }

    // Grouper par phase
    const phases = [];
    const phaseMap = {};
    sets.forEach(s => {
      const phaseId   = s.phaseGroup?.phase?.name || 'Phase';
      const phaseOrder = s.phaseGroup?.phase?.phaseOrder ?? 99;
      if (!phaseMap[phaseId]) {
        phaseMap[phaseId] = { name: phaseId, order: phaseOrder, sets: [] };
        phases.push(phaseMap[phaseId]);
      }
      phaseMap[phaseId].sets.push(s);
    });
    phases.sort((a, b) => a.order - b.order);

    phases.forEach(phase => {
      const total     = phase.sets.length;
      const done      = phase.sets.filter(s => s.state === 3).length;
      const pct       = total > 0 ? Math.round((done / total) * 100) : 0;
      const active    = phase.sets.filter(s => s.state === 2).length;
      const phaseKey  = container.id + '_' + phase.name;
      const isOpen    = _phaseOpen[phaseKey] !== false; // open by default

      // Bouton de phase
      const phaseBtn = document.createElement('div');
      phaseBtn.className = 'sgg-phase-btn' + (isOpen ? ' open' : '');
      phaseBtn.dataset.key = phaseKey;
      phaseBtn.innerHTML = `
        <div class="sgg-phase-btn-fill" style="width:${pct}%"></div>
        <div class="sgg-phase-btn-content">
          <span class="sgg-phase-btn-name">${phase.name}</span>
          <span class="sgg-phase-btn-stats">
            ${active > 0 ? `<span class="sgg-phase-active-dot"></span>` : ''}
            ${done}/${total}
          </span>
          <span class="sgg-phase-btn-arrow">${isOpen ? '▲' : '▼'}</span>
        </div>
      `;

      // Liste de sets (uniquement non-terminés)
      const setList = document.createElement('div');
      setList.className = 'sgg-phase-sets' + (isOpen ? ' open' : '');

      // Grouper TOUS les sets du round (y compris terminés) pour la jauge
      const roundMap = {};
      const roundOrder = [];
      phase.sets.forEach(s => {
        const key = s.fullRoundText || ('Round ' + s.round);
        const r   = s.round ?? 0;
        if (!roundMap[key]) {
          roundMap[key] = { label: key, round: r, all: [], active: [] };
          roundOrder.push(roundMap[key]);
        }
        roundMap[key].all.push(s);
        if (s.state !== 3) roundMap[key].active.push(s);
      });
      roundOrder.sort((a, b) => {
        const aW = a.round > 0, bW = b.round > 0;
        if (aW && !bW) return -1;
        if (!aW && bW) return 1;
        return a.round - b.round;
      });

      if (!roundOrder.length) {
        setList.innerHTML = '<p class="hint" style="padding:8px 0">Phase terminée ✓</p>';
      } else {
        roundOrder.forEach(rg => {
          const rTotal  = rg.all.length;
          const rDone   = rg.all.filter(s => s.state === 3).length;
          const rActive = rg.all.filter(s => s.state === 2).length;
          const rPct    = rTotal > 0 ? Math.round((rDone / rTotal) * 100) : 0;
          const roundKey = phaseKey + '_' + rg.label;
          // Ouvert par défaut seulement si des sets sont en cours ; sinon fermé.
          // Si l'utilisateur a déjà cliqué, on respecte son choix.
          const rIsOpen  = _phaseOpen[roundKey] !== undefined ? _phaseOpen[roundKey] : rActive > 0;

          // Bouton de round
          const roundBtn = document.createElement('div');
          roundBtn.className = 'sgg-round-btn' + (rIsOpen ? ' open' : '');
          roundBtn.dataset.key = roundKey;
          roundBtn.innerHTML = `
            <div class="sgg-round-btn-fill" style="width:${rPct}%"></div>
            <div class="sgg-round-btn-content">
              <span class="sgg-round-btn-name">${rg.label}</span>
              <span class="sgg-round-btn-stats">
                ${rActive > 0 ? `<span class="sgg-phase-active-dot"></span>` : ''}
                ${rDone}/${rTotal}
              </span>
              <span class="sgg-round-btn-arrow">${rIsOpen ? '▲' : '▼'}</span>
            </div>
          `;

          // Liste des sets du round
          const roundList = document.createElement('div');
          roundList.className = 'sgg-round-sets' + (rIsOpen ? ' open' : '');

          if (!rg.active.length) {
            roundList.innerHTML = '<p class="hint" style="padding:6px 4px">Round terminé ✓</p>';
          } else {
            rg.active.forEach(s => {
              const roundFull = [phase.name, s.fullRoundText].filter(Boolean).join(' — ');
              roundList.appendChild(buildSetCard(s, roundFull));
            });
          }

          roundBtn.addEventListener('click', () => {
            const open = !roundList.classList.contains('open');
            _phaseOpen[roundKey] = open;
            roundList.classList.toggle('open', open);
            roundBtn.classList.toggle('open', open);
            roundBtn.querySelector('.sgg-round-btn-arrow').textContent = open ? '▲' : '▼';
          });

          setList.appendChild(roundBtn);
          setList.appendChild(roundList);
        });
      }

      phaseBtn.addEventListener('click', () => {
        const open = !setList.classList.contains('open');
        _phaseOpen[phaseKey] = open;
        setList.classList.toggle('open', open);
        phaseBtn.classList.toggle('open', open);
        phaseBtn.querySelector('.sgg-phase-btn-arrow').textContent = open ? '▲' : '▼';
      });

      container.appendChild(phaseBtn);
      container.appendChild(setList);
    });

    // Délégation des clics set
    container.querySelectorAll('.sgg-apply-set').forEach(btn => {
      btn.addEventListener('click', () => {
        applySet(
          btn.dataset.p1tag, btn.dataset.p1name,
          btn.dataset.p2tag, btn.dataset.p2name,
          parseInt(btn.dataset.p1score), parseInt(btn.dataset.p2score),
          btn.dataset.round,
          btn.dataset.p1seed !== '' ? parseInt(btn.dataset.p1seed) : null,
          btn.dataset.p2seed !== '' ? parseInt(btn.dataset.p2seed) : null,
          btn.dataset.p1pronouns, btn.dataset.p2pronouns,
          btn.dataset.setid, btn.dataset.p1entrantid, btn.dataset.p2entrantid,
          btn.dataset.p1playerid, btn.dataset.p2playerid
        );
      });
    });

    container.querySelectorAll('.sgg-start-set').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '…';
        try {
          const res = await fetch(`/api/startgg/set/${btn.dataset.setid}/start`, { method: 'POST' });
          const data = await res.json();
          if (data.error) { showStatus('Erreur : ' + data.error, true); btn.disabled = false; btn.textContent = '▶ Démarrer'; return; }
          showStatus('Set démarré !');
          await refreshSets();
        } catch (e) {
          showStatus('Erreur réseau', true);
          btn.disabled = false;
          btn.textContent = '▶ Démarrer';
        }
      });
    });
  }

  function applySet(p1tag, p1name, p2tag, p2name, p1score, p2score, round, p1seed, p2seed, p1pronouns, p2pronouns, setId, p1EntrantId, p2EntrantId, p1PlayerId, p2PlayerId) {
    console.log('[applySet] setId=%s p1EntrantId=%s p2EntrantId=%s', setId, p1EntrantId, p2EntrantId);
    const setIdInput      = document.getElementById('sgg-current-set-id');
    const p1EntrantInput  = document.getElementById('sgg-p1-entrant-id');
    const p2EntrantInput  = document.getElementById('sgg-p2-entrant-id');
    const sendBtn         = document.getElementById('btn-send-startgg');
    if (setIdInput)     setIdInput.value     = setId     || '';
    if (p1EntrantInput) p1EntrantInput.value = p1EntrantId || '';
    if (p2EntrantInput) p2EntrantInput.value = p2EntrantId || '';
    // Stocker aussi directement sur le bouton envoyer pour éviter tout problème de DOM
    if (sendBtn) {
      sendBtn.dataset.setid       = setId       || '';
      sendBtn.dataset.p1entrantid = p1EntrantId || '';
      sendBtn.dataset.p2entrantid = p2EntrantId || '';
      sendBtn.style.display = setId ? '' : 'none';
    }
    const p1TagInput      = document.getElementById('p1-tag');
    const p1NameInput     = document.getElementById('p1-name');
    const p1SeedInput     = document.getElementById('p1-seed');
    const p1PronounsInput = document.getElementById('p1-pronouns');
    const p2TagInput      = document.getElementById('p2-tag');
    const p2NameInput     = document.getElementById('p2-name');
    const p2SeedInput     = document.getElementById('p2-seed');
    const p2PronounsInput = document.getElementById('p2-pronouns');

    if (p1TagInput) p1TagInput.value = p1tag;
    if (p1NameInput) p1NameInput.value = p1name;
    if (p1SeedInput) p1SeedInput.value = p1seed != null ? p1seed : '';
    if (p1PronounsInput) p1PronounsInput.value = p1pronouns || '';

    if (p2TagInput) p2TagInput.value = p2tag;
    if (p2NameInput) p2NameInput.value = p2name;
    if (p2SeedInput) p2SeedInput.value = p2seed != null ? p2seed : '';
    if (p2PronounsInput) p2PronounsInput.value = p2pronouns || '';

    if (typeof window.setMatchScore === 'function') {
      window.setMatchScore(p1score, p2score);
    }

    // Phase + round → champ "Phase"
    const stageInput = document.getElementById('stage') || document.getElementById('event-stage');
    if (stageInput && round) { stageInput.value = round; stageInput.dispatchEvent(new Event('input', { bubbles: true })); }

    // Nom de l'event → champ "Événement"
    if (currentEventName) {
      const evInput = document.getElementById('event-name');
      if (evInput) { evInput.value = currentEventName; evInput.dispatchEvent(new Event('input', { bubbles: true })); }
    }

    // Logo du tournoi → champ center-logo
    if (tournamentLogo) {
      const logoInput = document.getElementById('center-logo');
      if (logoInput) { logoInput.value = tournamentLogo; logoInput.dispatchEvent(new Event('input', { bubbles: true })); }
    }

    p1NameInput?.dispatchEvent(new Event('input', { bubbles: true }));
    showStatus(`Set appliqué : ${p1name} vs ${p2name}`);

    // Récupération des réseaux sociaux depuis start.gg
    function fillSocials(playerNum, playerId) {
      if (!playerId) return;
      fetch(`/api/startgg/player-socials/${playerId}`)
        .then(r => r.json())
        .then(socials => {
          const order = ['twitter', 'twitch', 'discord'];
          const values = order.map(k => socials[k] ? (k === 'twitter' ? 'Twitter @' + socials[k] : k.charAt(0).toUpperCase() + k.slice(1) + ' ' + socials[k]) : '').filter(Boolean);
          for (let i = 1; i <= 3; i++) {
            const inp = document.getElementById(`p${playerNum}-social-${i}`);
            if (inp) {
              inp.value = values[i - 1] || '';
              inp.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
        })
        .catch(() => {});
    }
    fillSocials(1, p1PlayerId);
    fillSocials(2, p2PlayerId);
  }

  // ── Stream Queue ──────────────────────────────────────────────────────────────

  async function fetchStreamQueue() {
    if (!currentTournamentSlug) return;
    try {
      const res  = await fetch(`/api/startgg/tournament/${encodeURIComponent(currentTournamentSlug)}/stream-queue`);
      const data = await res.json();
      if (data.error) return;
      renderStreamQueue(Array.isArray(data) ? data : []);
    } catch (_) {}
  }

  function renderStreamQueue(queue) {
    ['sgg-stream-queue', 'match-sgg-stream-queue'].forEach(id => {
      const container = document.getElementById(id);
      if (!container) return;
      container.innerHTML = '';
      // Filtrer les streams qui ont au moins un set non-terminé
      const active = queue.filter(sq => sq.sets && sq.sets.some(s => s.state !== 3));
      container.style.display = active.length ? '' : 'none';
      if (!active.length) return;

      active.forEach(sq => {
        const streamName = sq.stream?.streamName || 'Stream';
        const streamSrc  = (sq.stream?.streamSource || '').toLowerCase();
        const icon = streamSrc === 'twitch' ? '🟣' : streamSrc === 'youtube' ? '🔴' : '🎥';

        const block = document.createElement('div');
        block.className = 'sgg-stream-block';
        block.innerHTML = `<div class="sgg-stream-header">${icon} ${streamName}</div>`;

        const cardList = document.createElement('div');
        cardList.className = 'sgg-stream-cards';

        sq.sets.filter(s => s.state !== 3).forEach((s, idx) => {
          const phaseName = s.phaseGroup?.phase?.name || '';
          const roundFull = [phaseName, s.fullRoundText].filter(Boolean).join(' — ');
          const card = buildSetCard(s, roundFull);
          // Badge numéro de passage (propre à la stream queue)
          const header = card.querySelector('.sgg-set-header') || card.querySelector('.sgg-set-players');
          if (header) {
            const badge = document.createElement('span');
            badge.className = 'sgg-stream-order';
            badge.textContent = idx + 1;
            header.prepend(badge);
          }
          cardList.appendChild(card);
        });

        block.appendChild(cardList);
        container.appendChild(block);
      });
    });
  }

  // ── Auto-refresh ──────────────────────────────────────────────────────────────

  function updateCountdown(sec) {
    ['sgg-refresh-countdown', 'match-sgg-refresh-countdown'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = sec > 0 ? `↺ ${sec}s` : '';
    });
  }

  async function doRefresh() {
    if (!currentEventId) return;
    await Promise.all([
      fetchSets(currentEventId),
      fetchStreamQueue(),
    ]);
  }

  function startAutoRefresh() {
    if (_refreshTimer)   clearInterval(_refreshTimer);
    if (_countdownTimer) clearInterval(_countdownTimer);
    _countdownSec = REFRESH_INTERVAL;
    updateCountdown(_countdownSec);
    _countdownTimer = setInterval(() => {
      _countdownSec--;
      updateCountdown(_countdownSec);
      if (_countdownSec <= 0) _countdownSec = REFRESH_INTERVAL;
    }, 1000);
    _refreshTimer = setInterval(async () => {
      _countdownSec = REFRESH_INTERVAL;
      await doRefresh();
    }, REFRESH_INTERVAL * 1000);
  }

  async function refreshSets() {
    if (!currentEventId) return;
    showStatus('Actualisation…');
    _countdownSec = REFRESH_INTERVAL;
    await doRefresh();
    showStatus('Sets actualisés');
  }

  document.getElementById('sgg-refresh-sets').addEventListener('click', refreshSets);
  document.getElementById('match-sgg-refresh-sets')?.addEventListener('click', refreshSets);

  // ── Autocomplete ──────────────────────────────────────────────────────────────

  function setupAutocomplete(playerNum) {
    const nameInput = document.getElementById(`p${playerNum}-name`);
    const tagInput  = document.getElementById(`p${playerNum}-tag`);
    if (!nameInput) return;

    // Create dropdown container
    const drop = document.createElement('div');
    drop.className = 'ac-dropdown';
    drop.style.display = 'none';
    nameInput.parentNode.style.position = 'relative';
    nameInput.parentNode.appendChild(drop);

    function hideDrop() { drop.style.display = 'none'; }

    function showDrop(results) {
      drop.innerHTML = '';
      if (!results.length) { hideDrop(); return; }
      results.forEach(e => {
        const item = document.createElement('div');
        item.className = 'ac-item';
        item.tabIndex = -1;
        const label = e.prefix ? `<span class="ac-prefix">[${e.prefix}]</span> ${e.tag}` : e.tag;
        item.innerHTML = label;
        item.addEventListener('mousedown', ev => {
          ev.preventDefault();
          applyPlayer(playerNum, e.prefix, e.tag, e.seeding ?? null);
          hideDrop();
        });
        drop.appendChild(item);
      });
      drop.style.display = 'block';
    }

    nameInput.addEventListener('input', () => {
      const q = nameInput.value.toLowerCase();
      if (!q || !allEntrants.length) { hideDrop(); return; }
      const results = allEntrants
        .filter(e => e.tag.toLowerCase().includes(q) || e.prefix.toLowerCase().includes(q))
        .slice(0, 8);
      showDrop(results);
    });

    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Escape') hideDrop();
      if (e.key === 'ArrowDown') {
        const items = drop.querySelectorAll('.ac-item');
        if (items.length) { e.preventDefault(); items[0].focus(); }
      }
    });

    drop.addEventListener('keydown', e => {
      const items = [...drop.querySelectorAll('.ac-item')];
      const idx = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && idx < items.length - 1) { e.preventDefault(); items[idx+1].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); idx > 0 ? items[idx-1].focus() : nameInput.focus(); }
      if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); items[idx].dispatchEvent(new MouseEvent('mousedown')); }
      if (e.key === 'Escape') { hideDrop(); nameInput.focus(); }
    });

    // Also autocomplete on tag input
    if (tagInput) {
      tagInput.addEventListener('input', () => {
        const q = tagInput.value.toLowerCase();
        if (!q || !allEntrants.length) { hideDrop(); return; }
        const results = allEntrants
          .filter(e => e.prefix.toLowerCase().includes(q) || e.tag.toLowerCase().includes(q))
          .slice(0, 8);
        showDrop(results);
      });
    }

    document.addEventListener('click', e => {
      if (!nameInput.contains(e.target) && !drop.contains(e.target) && !(tagInput && tagInput.contains(e.target))) {
        hideDrop();
      }
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────────

  loadKeyStatus();

  // Exposer le eventId courant pour le bracket
  window.onStartggEventLoaded = function(evId) {
    currentEventId = evId;
    loadBracketPhases(evId);
    document.getElementById('sgg-bracket-section').style.display = '';
    document.getElementById('sgg-top8-section').style.display = '';
    if (typeof window.setTop8EventId === 'function') window.setTop8EventId(evId);
  };

})();

// ════════════════════════════════════════════════════════════════
// BRACKET VISUALISEUR
// ════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  let _currentPgId   = null;
  let _currentPgName = '';
  let _autoInterval  = null;
  let _bracketData   = null;

  // ── Chargement des phases ─────────────────────────────────────
  window.loadBracketPhases = async function (eventId) {
    if (!eventId) return;
    try {
      const res  = await fetch(`/api/startgg/event/${eventId}/phases`);
      const data = await res.json();
      if (data.error) return;

      const phSel = document.getElementById('sgg-phase-select');
      if (!phSel) return;
      phSel.innerHTML = '<option value="">— Choisir une phase —</option>';
      (data.phases || []).forEach(ph => {
        const opt = document.createElement('option');
        opt.value = JSON.stringify({ id: ph.id, name: ph.name, bracketType: ph.bracketType,
          phaseGroups: (ph.phaseGroups?.nodes || []) });
        opt.textContent = ph.name;
        phSel.appendChild(opt);
      });

      // Auto-select si une seule phase
      if (data.phases?.length === 1) {
        phSel.selectedIndex = 1;
        phSel.dispatchEvent(new Event('change'));
        // Auto-charger le bracket si une seule phase
        setTimeout(() => document.getElementById('sgg-bracket-load-btn')?.click(), 200);
      }
    } catch(e) { console.error('[bracket phases]', e); }
  };

  // ── Sélection d'une phase → afficher les groupes ──────────────
  document.getElementById('sgg-phase-select')?.addEventListener('change', function() {
    const pgGroup = document.getElementById('sgg-pg-group');
    const pgSel   = document.getElementById('sgg-pg-select');
    if (!this.value || !pgGroup || !pgSel) { if (pgGroup) pgGroup.style.display = 'none'; return; }

    const ph = JSON.parse(this.value);
    pgSel.innerHTML = '<option value="">— Choisir un groupe —</option>';
    const groups = ph.phaseGroups || [];
    groups.forEach(pg => {
      const opt = document.createElement('option');
      opt.value = pg.id;
      opt.textContent = groups.length === 1 ? ph.name : `${ph.name} — Groupe ${pg.displayIdentifier}`;
      pgSel.appendChild(opt);
    });

    // N'afficher le select que si plusieurs groupes
    pgGroup.style.display = groups.length > 1 ? '' : 'none';
    // Auto-select si un seul groupe
    if (groups.length === 1) pgSel.selectedIndex = 1;
  });

  // ── Charger le bracket ────────────────────────────────────────
  async function loadBracket() {
    const phSel = document.getElementById('sgg-phase-select');
    const pgSel = document.getElementById('sgg-pg-select');
    if (!phSel?.value) {
      setBracketStatus('Sélectionnez une phase.', true);
      return;
    }

    const ph   = JSON.parse(phSel.value);
    const pgId = pgSel?.value || (ph.phaseGroups?.[0]?.id);
    if (!pgId) { setBracketStatus('Groupe introuvable.', true); return; }

    _currentPgId   = pgId;
    _currentPgName = ph.name;
    setBracketStatus('Chargement du bracket…');

    try {
      const res  = await fetch(`/api/startgg/phasegroup/${pgId}/sets`);
      const data = await res.json();
      if (data.error) { setBracketStatus('Erreur : ' + data.error, true); return; }

      _bracketData = data;
      setBracketStatus(`${data.sets.length} sets chargés`);
      renderPreview(data);

      // Afficher le bouton refresh
      const refreshBtn = document.getElementById('sgg-bracket-refresh-btn');
      if (refreshBtn) refreshBtn.style.display = '';

    } catch(e) { setBracketStatus('Erreur réseau : ' + e.message, true); }
  }

  document.getElementById('sgg-bracket-load-btn')?.addEventListener('click', loadBracket);
  document.getElementById('sgg-bracket-refresh-btn')?.addEventListener('click', async () => {
    if (!_currentPgId) return;
    setBracketStatus('Actualisation…');
    try {
      const res  = await fetch(`/api/startgg/phasegroup/${_currentPgId}/sets`);
      const data = await res.json();
      if (data.error) { setBracketStatus('Erreur : ' + data.error, true); return; }
      _bracketData = data;
      setBracketStatus(`${data.sets.length} sets — Actualisé`);
      renderPreview(data);
      // Pousser si l'overlay est visible
      await pushBracket({ visible: true });
    } catch(e) { setBracketStatus('Erreur : ' + e.message, true); }
  });

  // ── Afficher / masquer ────────────────────────────────────────
  document.getElementById('sgg-bracket-show-btn')?.addEventListener('click', async () => {
    if (!_bracketData) { setBracketStatus('Chargez d\'abord un bracket.', true); return; }
    await pushBracket({ visible: true });
    setBracketStatus('Bracket affiché');
  });

  document.getElementById('sgg-bracket-hide-btn')?.addEventListener('click', async () => {
    await pushBracket({ visible: false });
    setBracketStatus('Bracket masqué');
  });

  // ── Échelle ───────────────────────────────────────────────────
  const scaleRange = document.getElementById('sgg-bracket-scale');
  const scaleVal   = document.getElementById('sgg-bracket-scale-val');
  scaleRange?.addEventListener('input', () => {
    if (scaleVal) scaleVal.textContent = scaleRange.value + '%';
    sendOverlayConfig();
  });

  // ── Position ──────────────────────────────────────────────────
  ['x','y'].forEach(axis => {
    const range = document.getElementById(`sgg-bracket-pos-${axis}`);
    const num   = document.getElementById(`sgg-bracket-pos-${axis}-num`);
    range?.addEventListener('input', () => { if (num) num.value = range.value; sendOverlayConfig(); });
    num?.addEventListener('input',   () => { if (range) range.value = num.value; sendOverlayConfig(); });
  });

  let _configDebounce = null;
  function sendOverlayConfig() {
    clearTimeout(_configDebounce);
    _configDebounce = setTimeout(() => {
      fetch('/api/bracket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posX:  parseInt(document.getElementById('sgg-bracket-pos-x-num')?.value || '0', 10),
          posY:  parseInt(document.getElementById('sgg-bracket-pos-y-num')?.value || '0', 10),
          scale: parseInt(scaleRange?.value || '90', 10),
        }),
      }).catch(() => {});
    }, 120);
  }

  // ── Auto-refresh ──────────────────────────────────────────────
  document.getElementById('sgg-bracket-autorefresh')?.addEventListener('change', function() {
    clearInterval(_autoInterval);
    if (this.checked) {
      const secs = parseInt(document.getElementById('sgg-bracket-autorefresh-interval')?.value || '60', 10);
      _autoInterval = setInterval(() => {
        document.getElementById('sgg-bracket-refresh-btn')?.click();
      }, secs * 1000);
    }
  });
  document.getElementById('sgg-bracket-autorefresh-interval')?.addEventListener('change', function() {
    const cb = document.getElementById('sgg-bracket-autorefresh');
    if (cb?.checked) { cb.dispatchEvent(new Event('change')); }
  });

  // ── Pousser l'état vers le serveur ───────────────────────────
  async function pushBracket(extra = {}) {
    if (!_bracketData) return;
    const body = Object.assign({
      phaseName:   _bracketData.phaseName || _currentPgName,
      bracketType: _bracketData.bracketType,
      sets:        _bracketData.sets,
      posX:        parseInt(document.getElementById('sgg-bracket-pos-x-num')?.value || '0', 10),
      posY:        parseInt(document.getElementById('sgg-bracket-pos-y-num')?.value || '0', 10),
      scale:       parseInt(scaleRange?.value || '90', 10),
    }, extra);
    await fetch('/api/bracket', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    }).catch(() => {});
  }

  // ── Aperçu des rounds dans le panneau ─────────────────────────
  function renderPreview(data) {
    const preview = document.getElementById('sgg-bracket-preview');
    const list    = document.getElementById('sgg-bracket-rounds-list');
    if (!preview || !list) return;

    // Grouper par fullRoundText
    const rounds = {};
    (data.sets || []).forEach(s => {
      const label = s.fullRoundText || ('R' + s.round);
      if (!rounds[label]) rounds[label] = { count: 0, done: 0, live: 0 };
      rounds[label].count++;
      if (s.state === 3) rounds[label].done++;
      if (s.state === 2) rounds[label].live++;
    });

    list.innerHTML = '';
    Object.entries(rounds).forEach(([label, info]) => {
      const chip = document.createElement('div');
      chip.style.cssText = `
        display:inline-flex;align-items:center;gap:5px;
        padding:4px 10px;border-radius:3px;font-size:11px;
        background:var(--surface2);border:1px solid var(--border);
        white-space:nowrap;
      `;
      const pct = info.count ? Math.round(info.done / info.count * 100) : 0;
      chip.innerHTML = `
        <span style="font-weight:600;color:var(--text)">${label}</span>
        <span style="color:var(--text-muted)">${info.done}/${info.count}</span>
        ${info.live > 0 ? `<span style="width:6px;height:6px;border-radius:50%;background:#D4001A;box-shadow:0 0 4px #D4001A"></span>` : ''}
        <div style="width:40px;height:3px;background:var(--border);border-radius:2px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:var(--gold);border-radius:2px;transition:width .3s"></div>
        </div>
      `;
      list.appendChild(chip);
    });

    preview.style.display = '';
  }

  // ── Statut ────────────────────────────────────────────────────
  function setBracketStatus(msg, isError) {
    const el = document.getElementById('sgg-bracket-status');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? 'var(--danger)' : '';
  }

})();

// ════════════════════════════════════════════════════════════════
// TOP 8
// ════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  let _currentEventId = null;
  let _top8Meta = { tournamentName: '', eventDate: '', tournamentLogo: '' };

  // ── Construire les 8 lignes joueurs ───────────────────────────
  const playersContainer = document.getElementById('sgg-top8-players');
  if (playersContainer) {
    const PLACE_COLORS = ['#FFD700','#B8B8C8','#CD7F32'];
    const inputStyle = 'font-size:12px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text);padding:4px 6px';
    for (let i = 0; i < 8; i++) {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:6px;align-items:stretch;margin-bottom:6px';
      const pColor = PLACE_COLORS[i] || 'var(--text-muted)';
      row.innerHTML =
        // Numéro placement
        `<span style="font-family:'Russo One',sans-serif;font-size:12px;color:${pColor};min-width:18px;text-align:center;flex-shrink:0;align-self:center">${i + 1}</span>` +
        // Prévisualisation personnage (art complet + stock icon en surimpression)
        `<div data-top8-char-btn="${i}" title="Choisir le personnage" style="` +
          `position:relative;flex-shrink:0;width:46px;height:62px;` +
          `border:1px solid ${pColor}44;border-radius:4px;` +
          `background:linear-gradient(160deg,rgba(255,255,255,0.04),rgba(0,0,0,0.35));` +
          `overflow:hidden;cursor:pointer;transition:border-color 0.15s` +
        `">` +
          // Art complet
          `<img data-top8-char-art="${i}" src="" alt="" style="` +
            `display:none;position:absolute;bottom:-4px;left:50%;` +
            `transform:translateX(-50%);height:118%;width:auto;pointer-events:none` +
          `" onerror="this.style.display='none'" />` +
          // Stock icon (coin bas-droite)
          `<img data-top8-char-icon="${i}" src="" alt="" style="` +
            `display:none;position:absolute;bottom:2px;right:2px;` +
            `width:18px;height:18px;object-fit:contain;pointer-events:none;` +
            `filter:drop-shadow(0 1px 2px rgba(0,0,0,0.8))` +
          `" onerror="this.style.display='none'" />` +
          // Fond dégradé en bas pour lisibilité
          `<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 45%);pointer-events:none"></div>` +
          // Placeholder "+"
          `<span data-top8-char-placeholder="${i}" style="` +
            `position:absolute;inset:0;display:flex;align-items:center;` +
            `justify-content:center;font-size:20px;color:var(--text-muted);pointer-events:none` +
          `">＋</span>` +
        `</div>` +
        // Inputs texte
        `<div style="display:flex;flex-direction:column;gap:4px;flex:1;min-width:0;justify-content:center">` +
          `<input type="text" placeholder="TAG" data-top8-tag="${i}" style="width:100%;${inputStyle}" />` +
          `<input type="text" placeholder="Nom du joueur" data-top8-name="${i}" style="width:100%;${inputStyle}" />` +
        `</div>` +
        // Champs cachés
        `<input type="hidden" data-top8-char="${i}" />` +
        `<input type="hidden" data-top8-char-color="${i}" value="0" />`;
      playersContainer.appendChild(row);
    }

    // Clic sur la prévisualisation → ouvre le picker
    playersContainer.addEventListener('click', function(e) {
      const btn = e.target.closest('[data-top8-char-btn]');
      if (!btn) return;
      const slot = parseInt(btn.getAttribute('data-top8-char-btn'), 10);
      openT8CharPicker(slot);
    });
    // Hover : accentuer la bordure
    playersContainer.addEventListener('mouseover', function(e) {
      const btn = e.target.closest('[data-top8-char-btn]');
      if (btn) btn.style.borderColor = 'var(--gold)';
    });
    playersContainer.addEventListener('mouseout', function(e) {
      const btn = e.target.closest('[data-top8-char-btn]');
      if (!btn) return;
      const i = parseInt(btn.getAttribute('data-top8-char-btn'), 10);
      const PLACE_COLORS_LOCAL = ['#FFD700','#B8B8C8','#CD7F32'];
      btn.style.borderColor = (PLACE_COLORS_LOCAL[i] || 'var(--text-muted)') + '44';
    });
  }

  // ── Picker de personnage Top 8 ─────────────────────────────────
  let _t8CharSlot = -1;
  let _t8CharList = [];

  // Créer le modal picker (deux étapes : perso → skin)
  const _t8Modal = document.createElement('div');
  _t8Modal.id = 't8-char-modal';
  _t8Modal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9999;overflow:auto;padding:30px 16px';
  _t8Modal.innerHTML =
    `<div style="max-width:860px;margin:0 auto;background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden">` +
    // Header commun
    `<div style="display:flex;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border);gap:10px">` +
      `<button id="t8-skin-back" style="display:none;font-size:12px;padding:4px 10px;border:1px solid var(--border);border-radius:4px;background:var(--surface2);color:var(--text);cursor:pointer;flex-shrink:0">← Retour</button>` +
      `<span id="t8-char-modal-title" style="font-weight:700;font-size:14px;flex-shrink:0">Choisir le personnage</span>` +
      `<input type="text" id="t8-char-search" placeholder="Rechercher…" style="flex:1;font-size:12px;padding:5px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text)" />` +
      `<button id="t8-char-modal-close" style="font-size:12px;padding:4px 10px;border:1px solid var(--border);border-radius:4px;background:var(--surface2);color:var(--text);cursor:pointer;flex-shrink:0">Fermer</button>` +
    `</div>` +
    // Étape 1 : grille personnages
    `<div id="t8-char-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:6px;padding:12px;max-height:65vh;overflow-y:auto"></div>` +
    // Étape 2 : grille skins (cachée par défaut)
    `<div id="t8-skin-panel" style="display:none;padding:16px">` +
      `<div id="t8-skin-char-name" style="font-size:13px;font-weight:600;color:var(--text-muted);margin-bottom:12px;text-align:center;letter-spacing:1px;text-transform:uppercase"></div>` +
      `<div id="t8-skin-grid" style="display:grid;grid-template-columns:repeat(8,1fr);gap:8px"></div>` +
    `</div>` +
    `</div>`;
  document.body.appendChild(_t8Modal);

  document.getElementById('t8-char-modal-close').addEventListener('click', closeT8CharPicker);
  document.getElementById('t8-skin-back').addEventListener('click', function() {
    document.getElementById('t8-skin-panel').style.display = 'none';
    document.getElementById('t8-char-grid').style.display  = 'grid';
    document.getElementById('t8-char-search').style.display = '';
    this.style.display = 'none';
    document.getElementById('t8-char-modal-title').textContent = 'Personnage — Slot ' + (_t8CharSlot + 1);
  });
  _t8Modal.addEventListener('click', function(e) {
    if (e.target === _t8Modal) closeT8CharPicker();
  });
  document.getElementById('t8-char-search').addEventListener('input', function() {
    renderT8CharGrid(this.value);
  });

  // Charger la liste des personnages
  fetch('/api/characters').then(r => r.json()).then(list => {
    _t8CharList = list;
  }).catch(() => {});

  function openT8CharPicker(slot) {
    _t8CharSlot = slot;
    // Toujours démarrer à l'étape 1
    document.getElementById('t8-char-grid').style.display   = 'grid';
    document.getElementById('t8-char-search').style.display = '';
    document.getElementById('t8-skin-panel').style.display  = 'none';
    document.getElementById('t8-skin-back').style.display   = 'none';
    document.getElementById('t8-char-modal-title').textContent = 'Personnage — Slot ' + (slot + 1);
    document.getElementById('t8-char-search').value = '';
    renderT8CharGrid('');
    _t8Modal.style.display = 'block';
    setTimeout(() => document.getElementById('t8-char-search').focus(), 80);
  }

  function closeT8CharPicker() {
    _t8Modal.style.display = 'none';
    _t8CharSlot = -1;
  }

  function renderT8CharGrid(filter) {
    const grid = document.getElementById('t8-char-grid');
    if (!grid) return;
    const lf = filter.toLowerCase();
    const list = lf ? _t8CharList.filter(c => c.name.toLowerCase().includes(lf)) : _t8CharList;
    grid.innerHTML = '';
    list.forEach(function(char) {
      const card = document.createElement('div');
      card.style.cssText = [
        'position:relative',
        'display:flex','flex-direction:column','align-items:center','gap:3px',
        'padding:4px 4px 5px',
        'border:1px solid var(--border)','border-radius:5px',
        'cursor:pointer','background:var(--surface2)',
        'overflow:hidden','transition:border-color 0.12s,transform 0.1s',
        'height:86px',
      ].join(';');

      // Art complet en fond (position absolue, décalévers le bas)
      const artImg = document.createElement('img');
      artImg.src = charArtSrc(char.name, 0);
      artImg.style.cssText = 'position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);height:82px;width:auto;pointer-events:none;opacity:0.85';
      artImg.onerror = function() { this.style.display = 'none'; };

      // Dégradé de lisibilité
      const grad = document.createElement('div');
      grad.style.cssText = 'position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.08) 55%,transparent 100%);pointer-events:none';

      // Stock icon en haut
      const stockImg = document.createElement('img');
      stockImg.src = '/Stock Icons/chara_2_' + char.name + '_00.png';
      stockImg.style.cssText = 'position:relative;z-index:2;width:34px;height:34px;object-fit:contain;margin-top:2px;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.7))';
      stockImg.onerror = function() { this.style.opacity = '0.15'; };

      // Nom en bas
      const label = document.createElement('span');
      label.style.cssText = 'position:relative;z-index:2;font-size:8.5px;color:#fff;text-align:center;line-height:1.2;word-break:break-word;margin-top:auto;text-shadow:0 1px 3px rgba(0,0,0,0.9)';
      label.textContent = char.name;

      card.appendChild(artImg);
      card.appendChild(grad);
      card.appendChild(stockImg);
      card.appendChild(label);

      card.addEventListener('mouseenter', () => {
        card.style.borderColor = 'var(--gold)';
        card.style.transform = 'scale(1.04)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.borderColor = 'var(--border)';
        card.style.transform = '';
      });
      card.addEventListener('click', () => showT8SkinPicker(char.name));
      grid.appendChild(card);
    });
  }

  function showT8SkinPicker(charName) {
    // Basculer vers l'étape 2
    document.getElementById('t8-char-grid').style.display   = 'none';
    document.getElementById('t8-char-search').style.display = 'none';
    document.getElementById('t8-skin-panel').style.display  = 'block';
    document.getElementById('t8-skin-back').style.display   = '';
    document.getElementById('t8-char-modal-title').textContent = charName;
    document.getElementById('t8-skin-char-name').textContent   = 'Choisir un skin';

    const grid = document.getElementById('t8-skin-grid');
    grid.innerHTML = '';

    const SKIN_LABELS = ['Default','Rouge','Bleu','Vert','Jaune','Blanc','Violet','Cyan'];
    for (let ci = 0; ci < 8; ci++) {
      const pad  = String(ci).padStart(2, '0');
      const card = document.createElement('div');
      card.style.cssText = [
        'position:relative','display:flex','flex-direction:column','align-items:center',
        'gap:3px','padding:4px','border:2px solid var(--border)','border-radius:6px',
        'cursor:pointer','background:var(--surface2)','overflow:hidden',
        'transition:border-color 0.12s,transform 0.1s','height:110px',
      ].join(';');

      // Art complet en fond
      const artImg = document.createElement('img');
      artImg.src = charArtSrc(charName, ci);
      artImg.style.cssText = 'position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);height:100px;width:auto;pointer-events:none;opacity:0.9';
      artImg.onerror = function() { this.style.display = 'none'; };

      // Dégradé
      const grad = document.createElement('div');
      grad.style.cssText = 'position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.05) 55%,transparent 100%);pointer-events:none';

      // Stock icon
      const stockImg = document.createElement('img');
      stockImg.src = '/Stock Icons/chara_2_' + charName + '_' + pad + '.png';
      stockImg.style.cssText = 'position:relative;z-index:2;width:36px;height:36px;object-fit:contain;margin-top:3px;filter:drop-shadow(0 1px 4px rgba(0,0,0,0.8))';
      stockImg.onerror = function() { card.style.opacity = '0.3'; card.style.pointerEvents = 'none'; };

      // Numéro/label du skin
      const label = document.createElement('span');
      label.style.cssText = 'position:relative;z-index:2;font-size:8px;color:#fff;text-align:center;margin-top:auto;text-shadow:0 1px 3px rgba(0,0,0,0.9);line-height:1.2';
      label.textContent = SKIN_LABELS[ci] || 'Skin ' + (ci + 1);

      card.appendChild(artImg);
      card.appendChild(grad);
      card.appendChild(stockImg);
      card.appendChild(label);

      card.addEventListener('mouseenter', () => { card.style.borderColor = 'var(--gold)'; card.style.transform = 'scale(1.05)'; });
      card.addEventListener('mouseleave', () => { card.style.borderColor = 'var(--border)'; card.style.transform = ''; });
      card.addEventListener('click', () => selectT8Char(charName, ci));
      grid.appendChild(card);
    }
  }

  function charArtSrc(name, color) {
    if (!name) return '';
    const n = name.replace(/\s*\/\s*/g, '-');
    const c = String(color || 0).padStart(2, '0');
    return '/full/chara_1_' + n + '_' + c + '.png';
  }

  function setT8CharIcon(slot, charName, colorIndex) {
    const art     = document.querySelector('[data-top8-char-art="'         + slot + '"]');
    const icon    = document.querySelector('[data-top8-char-icon="'        + slot + '"]');
    const pholder = document.querySelector('[data-top8-char-placeholder="' + slot + '"]');
    if (!pholder) return;
    if (charName) {
      const pad = String(colorIndex || 0).padStart(2, '0');
      if (art) {
        art.src = charArtSrc(charName, colorIndex);
        art.style.display = 'block';
      }
      if (icon) {
        icon.src = '/Stock Icons/chara_2_' + charName + '_' + pad + '.png';
        icon.style.display = 'block';
      }
      pholder.style.display = 'none';
    } else {
      if (art)  { art.src  = ''; art.style.display  = 'none'; }
      if (icon) { icon.src = ''; icon.style.display = 'none'; }
      pholder.style.display = '';
    }
  }

  function selectT8Char(charName, colorIndex) {
    if (_t8CharSlot < 0) return;
    const charInput  = document.querySelector('[data-top8-char="'       + _t8CharSlot + '"]');
    const colorInput = document.querySelector('[data-top8-char-color="' + _t8CharSlot + '"]');
    if (charInput)  charInput.value  = charName;
    if (colorInput) colorInput.value = colorIndex || 0;
    setT8CharIcon(_t8CharSlot, charName, colorIndex || 0);
    closeT8CharPicker();
    pushTop8();
  }

  function getPlayers() {
    const players = [];
    for (let i = 0; i < 8; i++) {
      const tagEl   = document.querySelector(`[data-top8-tag="${i}"]`);
      const nameEl  = document.querySelector(`[data-top8-name="${i}"]`);
      const charEl  = document.querySelector(`[data-top8-char="${i}"]`);
      const colorEl = document.querySelector(`[data-top8-char-color="${i}"]`);
      players.push({
        placement:      i + 1,
        tag:            tagEl  ? tagEl.value.trim()                    : '',
        name:           nameEl ? nameEl.value.trim()                   : '',
        character:      charEl ? charEl.value.trim()                   : '',
        characterColor: colorEl ? parseInt(colorEl.value || '0', 10)  : 0,
      });
    }
    return players;
  }

  function setPlayers(players) {
    (players || []).forEach((p, i) => {
      const tagEl   = document.querySelector(`[data-top8-tag="${i}"]`);
      const nameEl  = document.querySelector(`[data-top8-name="${i}"]`);
      const charEl  = document.querySelector(`[data-top8-char="${i}"]`);
      const colorEl = document.querySelector(`[data-top8-char-color="${i}"]`);
      if (tagEl)   tagEl.value   = p.tag       || '';
      if (nameEl)  nameEl.value  = p.name      || '';
      if (charEl)  charEl.value  = p.character || '';
      if (colorEl) colorEl.value = p.characterColor ?? 0;
      setT8CharIcon(i, p.character || '', p.characterColor ?? 0);
    });
  }

  function setTop8Status(msg, isError) {
    const el = document.getElementById('sgg-top8-status');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? 'var(--danger)' : '';
  }

  // ── Charger depuis start.gg ────────────────────────────────────
  async function loadTop8() {
    if (!_currentEventId) { setTop8Status('Chargez d\'abord un évènement.', true); return; }
    setTop8Status('Chargement des standings…');
    try {
      const res  = await fetch(`/api/startgg/event/${_currentEventId}/standings`);
      const data = await res.json();
      if (data.error) { setTop8Status('Erreur : ' + data.error, true); return; }
      setPlayers(data.players || []);
      const evNameInput = document.getElementById('sgg-top8-event-name');
      if (evNameInput && !evNameInput.value) evNameInput.value = data.eventName || '';
      // Stocker les métadonnées tournoi
      _top8Meta = {
        tournamentName: data.tournamentName || '',
        eventDate:      data.eventDate      || '',
        tournamentLogo: data.tournamentLogo || '',
      };
      setTop8Status((data.players?.length || 0) + ' joueurs chargés');
      const refreshBtn = document.getElementById('sgg-top8-refresh-btn');
      if (refreshBtn) refreshBtn.style.display = '';
      // Synchroniser tout vers le serveur
      await pushTop8();
    } catch (e) { setTop8Status('Erreur réseau : ' + e.message, true); }
  }

  document.getElementById('sgg-top8-load-btn')?.addEventListener('click', loadTop8);
  document.getElementById('sgg-top8-refresh-btn')?.addEventListener('click', loadTop8);

  // ── Afficher / Masquer ────────────────────────────────────────
  document.getElementById('sgg-top8-show-btn')?.addEventListener('click', () => pushTop8({ visible: true }));
  document.getElementById('sgg-top8-hide-btn')?.addEventListener('click', () => pushTop8({ visible: false }));

  // ── Échelle ───────────────────────────────────────────────────
  const scaleRange = document.getElementById('sgg-top8-scale');
  const scaleVal   = document.getElementById('sgg-top8-scale-val');
  scaleRange?.addEventListener('input', () => {
    if (scaleVal) scaleVal.textContent = scaleRange.value + '%';
    sendConfig();
  });

  // ── Position ──────────────────────────────────────────────────
  ['x', 'y'].forEach(axis => {
    const range = document.getElementById(`sgg-top8-pos-${axis}`);
    const num   = document.getElementById(`sgg-top8-pos-${axis}-num`);
    range?.addEventListener('input', () => { if (num) num.value = range.value; sendConfig(); });
    num?.addEventListener('input',   () => { if (range) range.value = num.value; sendConfig(); });
  });

  let _configDebounce = null;
  function sendConfig() {
    clearTimeout(_configDebounce);
    _configDebounce = setTimeout(() => {
      fetch('/api/top8', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          posX:  parseInt(document.getElementById('sgg-top8-pos-x-num')?.value || '0', 10),
          posY:  parseInt(document.getElementById('sgg-top8-pos-y-num')?.value || '0', 10),
          scale: parseInt(scaleRange?.value || '100', 10),
        }),
      }).catch(() => {});
    }, 120);
  }

  async function pushTop8(extra) {
    const body = Object.assign({
      eventName:      document.getElementById('sgg-top8-event-name')?.value?.trim() || '',
      tournamentName: _top8Meta.tournamentName,
      eventDate:      _top8Meta.eventDate,
      tournamentLogo: _top8Meta.tournamentLogo,
      players:        getPlayers(),
      posX:  parseInt(document.getElementById('sgg-top8-pos-x-num')?.value || '0', 10),
      posY:  parseInt(document.getElementById('sgg-top8-pos-y-num')?.value || '0', 10),
      scale: parseInt(scaleRange?.value || '100', 10),
    }, extra || {});
    await fetch('/api/top8', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    }).catch(() => {});
  }

  // ── API exposée ───────────────────────────────────────────────
  window.setTop8EventId = function (evId) {
    _currentEventId = evId;
    loadTop8();
  };
})();

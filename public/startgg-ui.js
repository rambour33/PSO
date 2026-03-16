// ─── start.gg UI ──────────────────────────────────────────────────────────────

(function () {
  // State
  let currentEventId = null;
  let allEntrants = [];
  let currentPage = 1;
  const PER_PAGE = 100;

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
    const hint = document.getElementById('sgg-key-status');
    if (data.hasKey) {
      hint.textContent = '✓ Clé API enregistrée';
      hint.style.color = '#4caf50';
    } else {
      hint.textContent = 'Aucune clé API enregistrée.';
      hint.style.color = '#e05050';
    }
  }

  document.getElementById('sgg-save-key').addEventListener('click', async () => {
    const key = document.getElementById('sgg-api-key').value.trim();
    if (!key) return;
    await fetch('/api/startgg/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key })
    });
    document.getElementById('sgg-api-key').value = '';
    await loadKeyStatus();
    showStatus('Clé API start.gg enregistrée');
  });

  // ── Tournament Search ─────────────────────────────────────────────────────────

  document.getElementById('sgg-search-btn').addEventListener('click', async () => {
    const raw = document.getElementById('sgg-slug').value;
    if (!raw.trim()) return;
    const slug = slugFromInput(raw);
    showStatus('Recherche du tournoi…');
    document.getElementById('sgg-tournament-info').style.display = 'none';
    document.getElementById('sgg-entrants-section').style.display = 'none';
    document.getElementById('sgg-sets-section').style.display = 'none';

    const res = await fetch(`/api/startgg/tournament/${encodeURIComponent(slug)}`);
    const data = await res.json();
    if (data.error) { showStatus('Erreur : ' + data.error, true); return; }

    document.getElementById('sgg-tournament-name').textContent = '🏆 ' + data.name;
    const sel = document.getElementById('sgg-event-select');
    sel.innerHTML = '';
    (data.events || []).forEach(ev => {
      const opt = document.createElement('option');
      opt.value = ev.id;
      opt.textContent = `${ev.name} (${ev.numEntrants ?? '?'} joueurs)`;
      sel.appendChild(opt);
    });
    document.getElementById('sgg-tournament-info').style.display = '';
    showStatus('Tournoi chargé : ' + data.name);
  });

  // ── Load Entrants ─────────────────────────────────────────────────────────────

  document.getElementById('sgg-load-event').addEventListener('click', async () => {
    const eventId = document.getElementById('sgg-event-select').value;
    if (!eventId) return;
    currentEventId = eventId;
    currentPage = 1;
    await fetchEntrants(eventId, 1);
    document.getElementById('sgg-sets-section').style.display = '';
    await fetchSets(eventId);
  });

  async function fetchEntrants(eventId, page) {
    showStatus('Chargement des participants…');
    const res = await fetch(`/api/startgg/event/${eventId}/entrants?page=${page}`);
    const data = await res.json();
    if (data.error) { showStatus('Erreur : ' + data.error, true); return; }

    allEntrants = (data.entrants?.nodes || []).map(e => ({
      id: e.id,
      name: e.name,
      tag: e.participants?.[0]?.gamerTag || e.name,
      prefix: e.participants?.[0]?.prefix || ''
    }));
    const total = data.entrants?.pageInfo?.total || allEntrants.length;
    document.getElementById('sgg-entrants-count').textContent = `${total} participants`;
    document.getElementById('sgg-entrants-section').style.display = '';
    renderEntrants(allEntrants);
    showStatus('Participants chargés : ' + allEntrants.length);
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
      row.innerHTML = `
        <span class="sgg-entrant-name">${label}</span>
        <div class="sgg-entrant-actions">
          <button class="btn btn-outline btn-sm sgg-apply-p1" data-tag="${e.prefix}" data-name="${e.tag}">→ J1</button>
          <button class="btn btn-outline btn-sm sgg-apply-p2" data-tag="${e.prefix}" data-name="${e.tag}">→ J2</button>
        </div>
      `;
      container.appendChild(row);
    });

    container.querySelectorAll('.sgg-apply-p1').forEach(btn => {
      btn.addEventListener('click', () => applyPlayer(1, btn.dataset.tag, btn.dataset.name));
    });
    container.querySelectorAll('.sgg-apply-p2').forEach(btn => {
      btn.addEventListener('click', () => applyPlayer(2, btn.dataset.tag, btn.dataset.name));
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

  function applyPlayer(playerNum, prefix, tag) {
    const tagInput = document.getElementById(`p${playerNum}-tag`);
    const nameInput = document.getElementById(`p${playerNum}-name`);
    if (tagInput) tagInput.value = prefix || '';
    if (nameInput) nameInput.value = tag;
    // Trigger emitState via the existing control.js mechanism
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    showStatus(`Joueur ${playerNum} mis à jour : ${tag}`);
  }

  // ── Sets ──────────────────────────────────────────────────────────────────────

  async function fetchSets(eventId) {
    const res = await fetch(`/api/startgg/event/${eventId}/sets`);
    const data = await res.json();
    if (data.error) { showStatus('Erreur sets : ' + data.error, true); return; }
    renderSets(data.sets?.nodes || []);
  }

  function renderSets(sets) {
    const container = document.getElementById('sgg-sets-list');
    container.innerHTML = '';
    if (!sets.length) {
      container.innerHTML = '<p class="hint">Aucun set en cours.</p>';
      return;
    }
    sets.forEach(s => {
      const [slot1, slot2] = s.slots || [];
      const p1 = slot1?.entrant?.participants?.[0];
      const p2 = slot2?.entrant?.participants?.[0];
      const p1Name = p1?.gamerTag || slot1?.entrant?.name || '?';
      const p2Name = p2?.gamerTag || slot2?.entrant?.name || '?';
      const p1Tag = p1?.prefix || '';
      const p2Tag = p2?.prefix || '';
      const p1Score = slot1?.standing?.stats?.score?.value ?? 0;
      const p2Score = slot2?.standing?.stats?.score?.value ?? 0;

      const card = document.createElement('div');
      card.className = 'sgg-set-card';
      card.innerHTML = `
        <div class="sgg-set-round">${s.fullRoundText || ''}</div>
        <div class="sgg-set-players">
          <span>${p1Tag ? '[' + p1Tag + '] ' : ''}${p1Name}</span>
          <span class="sgg-set-score">${p1Score} – ${p2Score}</span>
          <span>${p2Tag ? '[' + p2Tag + '] ' : ''}${p2Name}</span>
        </div>
        <div class="sgg-set-actions">
          <button class="btn btn-primary btn-sm sgg-apply-set"
            data-p1tag="${p1Tag}" data-p1name="${p1Name}"
            data-p2tag="${p2Tag}" data-p2name="${p2Name}"
            data-p1score="${Math.max(0, p1Score)}" data-p2score="${Math.max(0, p2Score)}"
            data-round="${s.fullRoundText || ''}">
            Appliquer au scoreboard
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll('.sgg-apply-set').forEach(btn => {
      btn.addEventListener('click', () => {
        applySet(
          btn.dataset.p1tag, btn.dataset.p1name,
          btn.dataset.p2tag, btn.dataset.p2name,
          parseInt(btn.dataset.p1score), parseInt(btn.dataset.p2score),
          btn.dataset.round
        );
      });
    });
  }

  function applySet(p1tag, p1name, p2tag, p2name, p1score, p2score, round) {
    // Apply names
    const p1TagInput = document.getElementById('p1-tag');
    const p1NameInput = document.getElementById('p1-name');
    const p2TagInput = document.getElementById('p2-tag');
    const p2NameInput = document.getElementById('p2-name');
    if (p1TagInput) p1TagInput.value = p1tag;
    if (p1NameInput) p1NameInput.value = p1name;
    if (p2TagInput) p2TagInput.value = p2tag;
    if (p2NameInput) p2NameInput.value = p2name;

    // Apply scores via score buttons (click + or reset then +)
    const score1Input = document.getElementById('p1-score');
    const score2Input = document.getElementById('p2-score');
    if (score1Input) { score1Input.value = p1score; score1Input.dispatchEvent(new Event('input', { bubbles: true })); }
    if (score2Input) { score2Input.value = p2score; score2Input.dispatchEvent(new Event('input', { bubbles: true })); }

    // Apply round as stage name
    const stageInput = document.getElementById('stage');
    if (stageInput && round) { stageInput.value = round; stageInput.dispatchEvent(new Event('input', { bubbles: true })); }

    p1NameInput?.dispatchEvent(new Event('input', { bubbles: true }));
    showStatus(`Set appliqué : ${p1name} vs ${p2name}`);
  }

  document.getElementById('sgg-refresh-sets').addEventListener('click', async () => {
    if (!currentEventId) return;
    showStatus('Actualisation des sets…');
    await fetchSets(currentEventId);
    showStatus('Sets actualisés');
  });

  // ── Init ──────────────────────────────────────────────────────────────────────

  loadKeyStatus();

})();

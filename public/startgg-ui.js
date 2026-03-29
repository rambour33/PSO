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
      id:       e.id,
      name:     e.name,
      tag:      e.participants?.[0]?.gamerTag || e.name,
      prefix:   e.participants?.[0]?.prefix || '',
      playerId: e.participants?.[0]?.player?.id || null,
      userSlug: e.participants?.[0]?.player?.user?.slug || null,
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

      const e1Id = slot1?.entrant?.id || '';
      const e2Id = slot2?.entrant?.id || '';

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
          applyPlayer(playerNum, e.prefix, e.tag);
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

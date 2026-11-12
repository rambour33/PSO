/* Page dédiée : connexion start.gg — clé API + choix du tournoi */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  const state = {
    hasKey:   false,
    keyOk:    false,
    user:     null,
    config:   {},     // tournoi actuellement enregistré (/api/tournament-config)
    mine:     null,   // liste des tournois administrés
    sel:      null,   // tournoi sélectionné (détail)
    eventId:  null,
  };

  /* ── Helpers ─────────────────────────────────────────────── */

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function setStatus(el, msg, cls) {
    el.textContent = msg || '';
    el.className = 'sg-status' + (cls ? ' ' + cls : '');
  }

  let _toastT = null;
  function toast(msg, isErr) {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'sg-toast show' + (isErr ? ' err' : '');
    clearTimeout(_toastT);
    _toastT = setTimeout(() => { t.className = 'sg-toast' + (isErr ? ' err' : ''); }, 3200);
  }

  function extractSlug(raw) {
    raw = String(raw || '').trim();
    if (!raw) return '';
    const m = raw.match(/tournament\/([\w-]+)/i);
    if (m) return m[1];
    return raw.replace(/^\/+|\/+$/g, '');
  }

  function fmtDate(ts) {
    if (!ts) return '';
    return new Date(ts * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function timing(t) {
    const now = Date.now() / 1000;
    if (t.startAt && t.startAt > now) return { cls: 'upcoming', label: 'À venir' };
    if (t.endAt && t.endAt >= now)    return { cls: 'live',     label: 'En cours' };
    return { cls: 'past', label: 'Terminé' };
  }

  function metaLine(t) {
    return [
      fmtDate(t.startAt),
      t.city,
      t.numAttendees ? `${t.numAttendees} participants` : '',
    ].filter(Boolean).join(' · ');
  }

  async function api(url, opts = {}) {
    const r = await fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(opts.headers || {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    let data = {};
    try { data = await r.json(); } catch {}
    if (r.status === 401) throw new Error('Session expirée — reconnecte-toi au panneau.');
    if (!r.ok || data.error) throw new Error(data.error || `Erreur ${r.status}`);
    return data;
  }

  /* ── En-tête : pastilles de statut ───────────────────────── */

  function renderHeader() {
    const k = state.keyOk ? '<span class="sg-pill ok">Clé valide</span>'
            : state.hasKey ? '<span class="sg-pill err">Clé refusée</span>'
            : '<span class="sg-pill">Pas de clé</span>';
    const t = state.config.slug
      ? `<span class="sg-pill ok">${esc(state.config.name || state.config.slug)}</span>`
      : '<span class="sg-pill">Aucun tournoi</span>';
    $('hdr-status').innerHTML = k + t;
    $('step-key').classList.toggle('done', state.keyOk);
    $('step-tour').classList.toggle('done', !!(state.config.slug && state.config.eventId));
    $('step-key').textContent  = state.keyOk ? '✓' : '1';
    $('step-tour').textContent = (state.config.slug && state.config.eventId) ? '✓' : '2';
  }

  /* ══ 1. CLÉ API ═════════════════════════════════════════════ */

  function showKeyForm(editing) {
    $('key-connected').hidden = true;
    $('key-form').hidden = false;
    $('key-cancel').hidden = !editing;
    $('key-input').value = '';
    $('key-input').focus();
  }

  function renderKey() {
    $('key-invalid').hidden = true;
    if (state.keyOk && state.user) {
      const u = state.user;
      $('key-connected').hidden = false;
      $('key-form').hidden = true;
      $('acc-name').textContent = u.gamerTag ? `${u.gamerTag}${u.name ? ' (' + u.name + ')' : ''}` : (u.name || 'Compte start.gg');
      $('acc-avatar').src = u.avatar || '';
      $('acc-avatar').style.visibility = u.avatar ? '' : 'hidden';
      $('acc-link').href = u.slug ? `https://www.start.gg/${u.slug}` : 'https://www.start.gg';
    } else {
      $('key-connected').hidden = true;
      $('key-form').hidden = false;
      $('key-cancel').hidden = true;
      if (state.hasKey && !state.keyOk) {
        $('key-invalid').hidden = false;
        $('key-invalid').textContent = '⚠ La clé enregistrée est refusée par start.gg' +
          (state.keyError ? ` : ${state.keyError}` : '') + '. Colle une nouvelle clé.';
      }
    }
    // Le choix du tournoi n'est possible qu'avec une clé valide
    $('tour-locked').hidden = state.keyOk;
    $('tour-picker').hidden = !state.keyOk;
    renderHeader();
  }

  async function loadMe() {
    try {
      const me = await api('/api/startgg/me');
      state.hasKey   = !!me.hasKey;
      state.keyOk    = !!me.ok;
      state.user     = me.user || null;
      state.keyError = me.error || '';
    } catch (e) {
      state.keyOk = false;
      state.keyError = e.message;
    }
    renderKey();
    if (state.keyOk && !state.mine) loadMine();
  }

  async function saveKey() {
    const key = $('key-input').value.trim();
    const st = $('key-status');
    if (!key) { setStatus(st, 'Colle d\'abord ta clé.', 'err'); return; }
    $('key-save').disabled = true;
    setStatus(st, 'Test de la clé auprès de start.gg…', 'busy');
    try {
      const test = await api('/api/startgg/test-key', { method: 'POST', body: { apiKey: key } });
      await api('/api/startgg/config', { method: 'POST', body: { apiKey: key } });
      state.hasKey = true; state.keyOk = true; state.user = test.user; state.keyError = '';
      state.mine = null;
      setStatus(st, '');
      renderKey();
      loadMine();
      toast('Clé enregistrée — connecté à start.gg');
    } catch (e) {
      setStatus(st, '❌ ' + e.message, 'err');
    } finally {
      $('key-save').disabled = false;
    }
  }

  async function removeKey() {
    if (!confirm('Retirer la clé start.gg de PSO ? Les données du tournoi ne seront plus mises à jour.')) return;
    try {
      await api('/api/startgg/config', { method: 'POST', body: { apiKey: '' } });
      state.hasKey = false; state.keyOk = false; state.user = null; state.mine = null;
      renderKey();
      toast('Clé retirée');
    } catch (e) { toast(e.message, true); }
  }

  $('key-save').addEventListener('click', saveKey);
  $('key-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveKey(); });
  $('key-change').addEventListener('click', () => showKeyForm(true));
  $('key-cancel').addEventListener('click', () => { setStatus($('key-status'), ''); renderKey(); });
  $('key-remove').addEventListener('click', removeKey);
  $('key-eye').addEventListener('click', () => {
    const i = $('key-input');
    i.type = i.type === 'password' ? 'text' : 'password';
  });

  /* ══ 2. TOURNOI ═════════════════════════════════════════════ */

  /* Tournoi actif */
  function renderCurrent() {
    const c = state.config;
    const box = $('current');
    if (!c.slug) { box.hidden = true; renderHeader(); return; }
    box.hidden = false;
    $('cur-banner').style.backgroundImage = c.bannerUrl ? `url("${c.bannerUrl}")` : '';
    $('cur-logo').src = c.logoUrl || '';
    $('cur-logo').style.visibility = c.logoUrl ? '' : 'hidden';
    $('cur-name').textContent = c.name || c.slug;
    $('cur-meta').textContent = [c.eventName || 'Aucun bracket choisi', c.phaseName].filter(Boolean).join(' · ');
    $('cur-open').href = `https://www.start.gg/tournament/${c.slug}`;
    renderHeader();
    renderMine();
  }

  async function loadConfig() {
    try { state.config = await api('/api/tournament-config'); } catch { state.config = {}; }
    renderCurrent();
  }

  /* Onglets */
  document.querySelectorAll('.sg-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sg-tab').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.sg-pane').forEach(p => { p.hidden = p.id !== btn.dataset.pane; });
      if (btn.dataset.pane === 'pane-url') $('url-input').focus();
    });
  });

  /* Mes tournois */
  async function loadMine() {
    const st = $('mine-status');
    setStatus(st, 'Chargement de tes tournois…', 'busy');
    $('mine-list').innerHTML = '';
    try {
      const data = await api('/api/startgg/my-tournaments');
      state.mine = data.tournaments || [];
      setStatus(st, state.mine.length ? '' : 'Aucun tournoi trouvé où tu es organisateur/admin. Utilise l\'onglet « Par lien ».');
      renderMine();
    } catch (e) {
      state.mine = null;
      setStatus(st, '❌ ' + e.message, 'err');
    }
  }

  function renderMine() {
    if (!state.mine) return;
    const q = $('mine-filter').value.trim().toLowerCase();
    const list = state.mine.filter(t => !q || t.name.toLowerCase().includes(q) || t.slug.includes(q));
    $('mine-list').innerHTML = list.map(t => {
      const tm = timing(t);
      const isActive = t.slug === state.config.slug;
      const isSel = state.sel && state.sel.slug === t.slug;
      return `<button class="sg-tour${isSel ? ' selected' : ''}" data-slug="${esc(t.slug)}">
        <img src="${esc(t.logoUrl)}" alt="" ${t.logoUrl ? '' : 'style="visibility:hidden"'} />
        <div class="sg-tour-info">
          <div class="sg-tour-name">${esc(t.name)}</div>
          <div class="sg-tour-meta">${esc(metaLine(t))}</div>
        </div>
        ${isActive ? '<span class="sg-badge active">Actif</span>' : `<span class="sg-badge ${tm.cls}">${tm.label}</span>`}
      </button>`;
    }).join('') || (q ? '<div class="sg-hint">Aucun tournoi ne correspond.</div>' : '');
  }

  $('go-url').addEventListener('click', e => {
    e.preventDefault();
    document.querySelector('.sg-tab[data-pane="pane-url"]').click();
  });

  $('mine-filter').addEventListener('input', renderMine);
  $('mine-refresh').addEventListener('click', loadMine);
  $('mine-list').addEventListener('click', e => {
    const b = e.target.closest('.sg-tour');
    if (!b) return;
    const t = state.mine.find(x => x.slug === b.dataset.slug);
    if (t) selectTournament(t);
  });

  /* Par lien */
  async function fetchByUrl() {
    const slug = extractSlug($('url-input').value);
    const st = $('url-status');
    if (!slug) { setStatus(st, 'Colle le lien du tournoi.', 'err'); return; }
    $('url-fetch').disabled = true;
    setStatus(st, 'Recherche du tournoi…', 'busy');
    try {
      const t = await api('/api/tournament-config/fetch', { method: 'POST', body: { slug } });
      t.slug = String(t.slug || slug).replace(/^tournament\//, '');
      setStatus(st, '✓ Tournoi trouvé', 'ok');
      selectTournament(t);
    } catch (e) {
      setStatus(st, '❌ ' + e.message, 'err');
    } finally {
      $('url-fetch').disabled = false;
    }
  }
  $('url-fetch').addEventListener('click', fetchByUrl);
  $('url-input').addEventListener('keydown', e => { if (e.key === 'Enter') fetchByUrl(); });

  /* Détail + choix du bracket */
  function selectTournament(t) {
    state.sel = t;
    const sameAsActive = t.slug === state.config.slug;
    state.eventId = null;

    $('detail').hidden = false;
    $('det-banner').hidden = !t.bannerUrl;
    $('det-banner').style.backgroundImage = t.bannerUrl ? `url("${t.bannerUrl}")` : '';
    $('det-logo').src = t.logoUrl || '';
    $('det-logo').style.visibility = t.logoUrl ? '' : 'hidden';
    $('det-name').textContent = t.name;
    $('det-meta').textContent = metaLine(t);
    $('det-display-name').value = sameAsActive && state.config.name ? state.config.name : t.name;

    // Logo : on garde un logo perso déjà configuré pour ce tournoi
    const customLogo = sameAsActive && state.config.logoUrl && state.config.logoUrl !== t.logoUrl;
    $('det-use-logo').checked = !customLogo && !!t.logoUrl;
    $('det-use-logo').disabled = !t.logoUrl;
    $('det-logo-hint').textContent = !t.logoUrl ? 'Ce tournoi n\'a pas de logo sur start.gg.'
      : customLogo ? 'Décoché : le logo personnalisé actuel est conservé.' : '';

    const events = t.events || [];
    $('det-events').innerHTML = events.map(ev => `
      <button class="sg-event" data-id="${ev.id}">
        <span class="sg-event-name">${esc(ev.name)}</span>
        <span class="sg-event-meta">${ev.numEntrants || 0} inscrit${ev.numEntrants > 1 ? 's' : ''}</span>
      </button>`).join('') || '<div class="sg-hint">Ce tournoi n\'a aucun bracket.</div>';

    const pre = (sameAsActive && events.find(ev => String(ev.id) === String(state.config.eventId))) || (events.length === 1 ? events[0] : null);
    $('det-phase-wrap').hidden = true;
    if (pre) selectEvent(pre.id, sameAsActive ? state.config.phaseId : null);

    setStatus($('det-status'), '');
    renderSaveBtn();
    renderMine();
    $('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function selectEvent(id, phaseToSelect) {
    state.eventId = id;
    document.querySelectorAll('.sg-event').forEach(b => b.classList.toggle('selected', String(b.dataset.id) === String(id)));
    renderSaveBtn();

    const sel = $('det-phase');
    sel.innerHTML = '<option value="">Toutes les phases</option>';
    $('det-phase-wrap').hidden = true;
    try {
      const data = await api(`/api/startgg/event/${id}/phases`);
      if (state.eventId !== id) return;
      const phases = data.phases || [];
      phases.forEach(ph => {
        const o = document.createElement('option');
        o.value = ph.id;
        o.textContent = ph.name;
        if (String(ph.id) === String(phaseToSelect)) o.selected = true;
        sel.appendChild(o);
      });
      // Une seule phase : on la sélectionne d'office, pas besoin d'afficher le choix
      if (phases.length === 1) sel.value = phases[0].id;
      $('det-phase-wrap').hidden = phases.length < 2;
    } catch { /* phases optionnelles */ }
  }

  $('det-events').addEventListener('click', e => {
    const b = e.target.closest('.sg-event');
    if (b) selectEvent(Number(b.dataset.id));
  });

  function renderSaveBtn() {
    $('det-save').disabled = !state.eventId;
    $('det-save').textContent = state.eventId ? '✓ Utiliser ce tournoi' : 'Choisis un bracket';
  }

  async function saveTournament() {
    const t = state.sel;
    if (!t || !state.eventId) return;
    const ev = (t.events || []).find(e => e.id === state.eventId);
    const phSel = $('det-phase');
    const phaseId = phSel.value ? Number(phSel.value) : null;
    const useLogo = $('det-use-logo').checked;
    const payload = {
      slug:      t.slug,
      id:        t.id,
      name:      $('det-display-name').value.trim() || t.name,
      bannerUrl: t.bannerUrl || '',
      eventId:   state.eventId,
      eventName: ev ? ev.name : '',
      phaseId,
      phaseName: phaseId ? phSel.selectedOptions[0].textContent : '',
    };
    if (useLogo) payload.logoUrl = t.logoUrl || '';
    else if (t.slug !== state.config.slug) payload.logoUrl = '';

    $('det-save').disabled = true;
    setStatus($('det-status'), 'Enregistrement…', 'busy');
    try {
      state.config = await api('/api/tournament-config', { method: 'POST', body: payload });
      localStorage.setItem('pso_setup_dismissed', '1');
      setStatus($('det-status'), '✓ Tournoi enregistré. Le panneau et les overlays sont synchronisés.', 'ok');
      renderCurrent();
      toast(`${payload.name} — ${payload.eventName}`);
    } catch (e) {
      setStatus($('det-status'), '❌ ' + e.message, 'err');
    } finally {
      renderSaveBtn();
    }
  }
  $('det-save').addEventListener('click', saveTournament);

  /* ── Synchro live (si modifié depuis le panneau) ─────────── */
  if (typeof io === 'function') {
    io().on('tournamentConfigUpdate', cfg => { state.config = cfg || {}; renderCurrent(); });
  }

  /* ── Init ────────────────────────────────────────────────── */
  loadConfig();
  loadMe();
})();

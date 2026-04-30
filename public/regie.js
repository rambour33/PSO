// ─── Socket ───────────────────────────────────────────────────────────────────
const socket = io();
const connDot = document.getElementById('conn-dot');
socket.on('connect',    () => connDot.classList.add('connected'));
socket.on('disconnect', () => connDot.classList.remove('connected'));

// ─── State ────────────────────────────────────────────────────────────────────
let sbState = {
  player1: { tag: '', name: 'PLAYER 1', score: 0, character: null },
  player2: { tag: '', name: 'PLAYER 2', score: 0, character: null },
  event: '', stage: '',
};
let superState   = null;
let charList     = [];
let activeSetId  = null;
let p1Char = null;
let p2Char = null;

// ─── Status ───────────────────────────────────────────────────────────────────
let _statusTimer = null;
function setStatus(msg, type = '') {
  const el = document.getElementById('status-bar');
  el.textContent = msg;
  el.className = 'status-bar' + (type ? ' ' + type : '');
  clearTimeout(_statusTimer);
  _statusTimer = setTimeout(() => { el.textContent = 'Prêt.'; el.className = 'status-bar'; }, 3500);
}

// ─── Scoreboard ───────────────────────────────────────────────────────────────
function syncToForm(s) {
  sbState = s;
  document.getElementById('p1-tag').value   = s.player1.tag   || '';
  document.getElementById('p1-name').value  = s.player1.name  || '';
  document.getElementById('p1-score').textContent = s.player1.score ?? 0;
  document.getElementById('p2-tag').value   = s.player2.tag   || '';
  document.getElementById('p2-name').value  = s.player2.name  || '';
  document.getElementById('p2-score').textContent = s.player2.score ?? 0;
  document.getElementById('sb-event').value = s.event || '';
  document.getElementById('sb-stage').value = s.stage || '';
  if (s.player1.character !== p1Char) { p1Char = s.player1.character; highlightChar(1, p1Char); }
  if (s.player2.character !== p2Char) { p2Char = s.player2.character; highlightChar(2, p2Char); }
}

function buildStateFromForm() {
  return {
    ...sbState,
    player1: {
      ...sbState.player1,
      tag:       document.getElementById('p1-tag').value.trim(),
      name:      document.getElementById('p1-name').value.trim() || 'PLAYER 1',
      score:     parseInt(document.getElementById('p1-score').textContent) || 0,
      character: p1Char,
    },
    player2: {
      ...sbState.player2,
      tag:       document.getElementById('p2-tag').value.trim(),
      name:      document.getElementById('p2-name').value.trim() || 'PLAYER 2',
      score:     parseInt(document.getElementById('p2-score').textContent) || 0,
      character: p2Char,
    },
    event: document.getElementById('sb-event').value.trim(),
    stage: document.getElementById('sb-stage').value.trim(),
  };
}

async function sendScoreboard() {
  const payload = buildStateFromForm();
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    sbState = payload;
    setStatus('Scoreboard appliqué.', 'ok');
  } catch (e) {
    setStatus('Erreur réseau : ' + e.message, 'err');
  }
}

function swapPlayers() {
  const p1tag   = document.getElementById('p1-tag').value;
  const p1name  = document.getElementById('p1-name').value;
  const p1score = parseInt(document.getElementById('p1-score').textContent) || 0;
  const p2tag   = document.getElementById('p2-tag').value;
  const p2name  = document.getElementById('p2-name').value;
  const p2score = parseInt(document.getElementById('p2-score').textContent) || 0;
  const tmpChar = p1Char;

  document.getElementById('p1-tag').value  = p2tag;
  document.getElementById('p1-name').value = p2name;
  document.getElementById('p1-score').textContent = p2score;
  document.getElementById('p2-tag').value  = p1tag;
  document.getElementById('p2-name').value = p1name;
  document.getElementById('p2-score').textContent = p1score;

  p1Char = p2Char;
  p2Char = tmpChar;
  highlightChar(1, p1Char);
  highlightChar(2, p2Char);
  sendScoreboard();
}

function resetScores() {
  document.getElementById('p1-score').textContent = 0;
  document.getElementById('p2-score').textContent = 0;
  sendScoreboard();
}

document.getElementById('btn-apply').addEventListener('click', sendScoreboard);
document.getElementById('btn-swap').addEventListener('click', swapPlayers);
document.getElementById('btn-reset-score').addEventListener('click', resetScores);

document.getElementById('p1-inc').addEventListener('click', () => {
  const el = document.getElementById('p1-score');
  el.textContent = (parseInt(el.textContent) || 0) + 1;
});
document.getElementById('p1-dec').addEventListener('click', () => {
  const el = document.getElementById('p1-score');
  el.textContent = Math.max(0, (parseInt(el.textContent) || 0) - 1);
});
document.getElementById('p2-inc').addEventListener('click', () => {
  const el = document.getElementById('p2-score');
  el.textContent = (parseInt(el.textContent) || 0) + 1;
});
document.getElementById('p2-dec').addEventListener('click', () => {
  const el = document.getElementById('p2-score');
  el.textContent = Math.max(0, (parseInt(el.textContent) || 0) - 1);
});

document.getElementById('p1-char-clear').addEventListener('click', () => { p1Char = null; highlightChar(1, null); });
document.getElementById('p2-char-clear').addEventListener('click', () => { p2Char = null; highlightChar(2, null); });

// ─── Characters ───────────────────────────────────────────────────────────────
function buildCharGrids(chars) {
  charList = chars;
  ['p1', 'p2'].forEach(p => {
    const grid = document.getElementById(`${p}-char-grid`);
    grid.innerHTML = '';
    chars.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'char-btn';
      btn.dataset.id = c.id;
      const img = document.createElement('img');
      img.src = `/Stock Icons/chara_2_${c.id.replace(/\s*\/\s*/g, '-')}_00.png`;
      img.alt = c.name;
      img.onerror = () => { img.style.display = 'none'; btn.textContent = c.name[0]; };
      btn.appendChild(img);
      btn.addEventListener('click', () => {
        const player = p === 'p1' ? 1 : 2;
        if (p === 'p1') p1Char = c.id;
        else             p2Char = c.id;
        highlightChar(player, c.id);
      });
      grid.appendChild(btn);
    });
  });
}

function highlightChar(player, charId) {
  const grid = document.getElementById(`p${player}-char-grid`);
  grid.querySelectorAll('.char-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.id === charId);
  });
}

// ─── Socket sync ──────────────────────────────────────────────────────────────
socket.on('stateUpdate', s => { syncToForm(s); });
socket.on('superStateUpdate', s => { superState = s; renderScenes(); });

// ─── Load initial state ───────────────────────────────────────────────────────
async function loadState() {
  try {
    const s = await fetch('/api/state').then(r => r.json());
    syncToForm(s);
  } catch {}
}

async function loadSuper() {
  try {
    superState = await fetch('/api/super').then(r => r.json());
    renderScenes();
  } catch {}
}

async function loadChars() {
  try {
    const chars = await fetch('/api/characters').then(r => r.json());
    buildCharGrids(chars);
  } catch {}
}

// ─── Scenes ───────────────────────────────────────────────────────────────────
function renderScenes() {
  if (!superState) return;
  const grid = document.getElementById('scene-grid');
  grid.innerHTML = '';
  superState.scenes.forEach((scene, i) => {
    const btn = document.createElement('button');
    btn.className = 'scene-btn' + (i === superState.activeScene ? ' active' : '');
    btn.innerHTML = `<span class="scene-num">${i + 1}</span><span class="scene-label">${escHtml(scene.name || `Scène ${i + 1}`)}</span>`;
    btn.addEventListener('click', () => sendScene(i));
    grid.appendChild(btn);
  });
}

async function sendScene(idx) {
  try {
    await fetch(`/api/super/scene/${idx}`, { method: 'POST' });
    setStatus(`Scène ${idx + 1} activée.`, 'ok');
  } catch (e) {
    setStatus('Erreur scène : ' + e.message, 'err');
  }
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Themes ───────────────────────────────────────────────────────────────────
const THEMES = [
  { key: 'default',     label: 'Default',     color: '#3a3a5a' },
  { key: 'blue',        label: 'Blue',        color: '#1a4aaa' },
  { key: 'red',         label: 'Red',         color: '#aa1a1a' },
  { key: 'green',       label: 'Green',       color: '#1a7a1a' },
  { key: 'gold',        label: 'Gold',        color: '#b08000' },
  { key: 'purple',      label: 'Purple',      color: '#6a1aaa' },
  { key: 'dark',        label: 'Dark',        color: '#1a1a2a' },
  { key: 'transparent', label: 'Transparent', color: 'transparent' },
];

function buildThemes() {
  const grid = document.getElementById('theme-grid');
  grid.innerHTML = '';
  THEMES.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'theme-btn';
    btn.dataset.key = t.key;
    btn.innerHTML = `<span class="theme-swatch" style="background:${t.color};border:1px solid rgba(255,255,255,.15)"></span>${escHtml(t.label)}`;
    btn.addEventListener('click', () => sendTheme(t.key));
    grid.appendChild(btn);
  });
}

async function sendTheme(key) {
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overlayTheme: key }),
    });
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.key === key));
    setStatus(`Thème "${key}" appliqué.`, 'ok');
  } catch (e) {
    setStatus('Erreur thème : ' + e.message, 'err');
  }
}

// ─── Start.gg ────────────────────────────────────────────────────────────────
const LS_KEY   = 'pso_regie_apikey';
const LS_SLUG  = 'pso_regie_slug';

let sggEventId   = null;
let sggEventName = '';

function initStartgg() {
  const savedKey  = localStorage.getItem(LS_KEY)  || '';
  const savedSlug = localStorage.getItem(LS_SLUG) || '';
  document.getElementById('sgg-apikey').value = savedKey;
  document.getElementById('sgg-slug').value   = savedSlug;
  if (savedKey) checkSggKey();
}

async function checkSggKey() {
  try {
    const d = await fetch('/api/startgg/config').then(r => r.json());
    const el = document.getElementById('sgg-key-status');
    if (d.hasKey) { el.textContent = '✓ Clé API enregistrée'; el.className = 'sgg-key-status ok'; }
    else          { el.textContent = 'Aucune clé enregistrée'; el.className = 'sgg-key-status err'; }
  } catch {}
}

async function saveAndSearch() {
  const key  = document.getElementById('sgg-apikey').value.trim();
  const slug = document.getElementById('sgg-slug').value.trim();
  if (!slug) { setStatus('Slug du tournoi manquant.', 'err'); return; }

  if (key) {
    localStorage.setItem(LS_KEY, key);
    await fetch('/api/startgg/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: key }),
    });
  }
  localStorage.setItem(LS_SLUG, slug);

  const cleanSlug = slugFromInput(slug);
  setStatus('Recherche du tournoi…');

  try {
    const data = await fetch(`/api/startgg/tournament/${encodeURIComponent(cleanSlug)}`).then(r => r.json());
    if (data.error) { setStatus('Erreur : ' + data.error, 'err'); return; }

    document.getElementById('sgg-tournament-name').textContent = data.name || cleanSlug;
    const sel = document.getElementById('sgg-event-select');
    sel.innerHTML = '';
    (data.events || []).forEach(ev => {
      const opt = document.createElement('option');
      opt.value = ev.id;
      opt.textContent = `${ev.name} (${ev.numEntrants ?? '?'})`;
      sel.appendChild(opt);
    });
    document.getElementById('sgg-tournament-section').style.display = '';
    checkSggKey();
    setStatus('Tournoi chargé : ' + data.name, 'ok');
  } catch (e) {
    setStatus('Erreur réseau : ' + e.message, 'err');
  }
}

async function loadEvent() {
  const eventId = document.getElementById('sgg-event-select').value;
  if (!eventId) return;
  sggEventId   = eventId;
  const sel    = document.getElementById('sgg-event-select');
  sggEventName = sel.options[sel.selectedIndex]?.text?.replace(/\s*\(\d+.*\)$/, '').trim() || '';
  setStatus('Chargement des sets…');
  await fetchSets();
}

async function fetchSets() {
  if (!sggEventId) return;
  try {
    const data = await fetch(`/api/startgg/event/${sggEventId}/sets`).then(r => r.json());
    renderSets(data);
    setStatus('Sets chargés.', 'ok');
  } catch (e) {
    setStatus('Erreur chargement sets : ' + e.message, 'err');
  }
}

function renderSets(data) {
  const list = document.getElementById('sgg-sets-list');
  const hint = document.getElementById('sgg-sets-hint');
  list.innerHTML = '';

  const allSets = (data.sets?.nodes || []).filter(s => s.slots?.[0]?.entrant && s.slots?.[1]?.entrant);

  if (!allSets.length) {
    hint.style.display = '';
    hint.textContent = 'Aucun set disponible.';
    return;
  }
  hint.style.display = 'none';

  allSets.forEach(s => {
    const [slot1, slot2] = s.slots || [];
    const p1 = slot1?.entrant?.participants?.[0];
    const p2 = slot2?.entrant?.participants?.[0];
    const p1Name = p1?.gamerTag || slot1?.entrant?.name || '?';
    const p2Name = p2?.gamerTag || slot2?.entrant?.name || '?';
    const p1Tag  = p1?.prefix || '';
    const p2Tag  = p2?.prefix || '';
    const p1Score = Math.max(0, slot1?.standing?.stats?.score?.value ?? 0);
    const p2Score = Math.max(0, slot2?.standing?.stats?.score?.value ?? 0);
    const round  = s.fullRoundText || s.round || '';
    const setId  = s.id;

    const card = document.createElement('div');
    card.className = 'set-card' + (setId === activeSetId ? ' active' : '');
    card.dataset.setid = setId;
    card.innerHTML = `
      <div class="set-card-players">
        <span>${escHtml((p1Tag ? '['+p1Tag+'] ' : '') + p1Name)}</span>
        <span class="set-vs">vs</span>
        <span>${escHtml((p2Tag ? '['+p2Tag+'] ' : '') + p2Name)}</span>
      </div>
      <div class="set-card-round">${escHtml(String(round))}</div>
    `;
    card.addEventListener('click', () => {
      activeSetId = setId;
      list.querySelectorAll('.set-card').forEach(c => c.classList.toggle('active', c.dataset.setid == setId));
      applySet({ p1Tag, p1Name, p2Tag, p2Name, p1Score, p2Score, round });
    });
    list.appendChild(card);
  });
}

function applySet({ p1Tag, p1Name, p2Tag, p2Name, p1Score, p2Score, round }) {
  document.getElementById('p1-tag').value  = p1Tag;
  document.getElementById('p1-name').value = p1Name;
  document.getElementById('p1-score').textContent = p1Score;
  document.getElementById('p2-tag').value  = p2Tag;
  document.getElementById('p2-name').value = p2Name;
  document.getElementById('p2-score').textContent = p2Score;
  if (round) document.getElementById('sb-stage').value = round;
  if (sggEventName) document.getElementById('sb-event').value = sggEventName;
  setStatus(`Set importé : ${p1Name} vs ${p2Name}`);
}

function slugFromInput(raw) {
  raw = raw.trim();
  const m = raw.match(/tournament\/([^\s?#]+)/);
  if (m) return 'tournament/' + m[1];
  if (!raw.includes('/')) return 'tournament/' + raw;
  return raw;
}

document.getElementById('sgg-search-btn').addEventListener('click', saveAndSearch);
document.getElementById('sgg-load-event-btn').addEventListener('click', loadEvent);
document.getElementById('sgg-slug').addEventListener('keydown', e => { if (e.key === 'Enter') saveAndSearch(); });

// ─── Init ─────────────────────────────────────────────────────────────────────
buildThemes();
initStartgg();
Promise.all([loadState(), loadSuper(), loadChars()]);

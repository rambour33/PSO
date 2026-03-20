/* ── Twitch Chat Overlay — messages via Socket.io serveur ──────────────────── */

const FALLBACK_COLORS = [
  '#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#C77DFF',
  '#FF9A3C','#4ECDC4','#FF6FC8','#A8E063','#F7971E'
];

function hashColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return FALLBACK_COLORS[Math.abs(h) % FALLBACK_COLORS.length];
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Badge image URLs ───────────────────────────────────────── */

const BADGE_URLS = {
  broadcaster: 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1',
  moderator:   'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d7/1',
  vip:         'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/1',
  premium:     'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/1',
};

function buildBadgesHtml(badges) {
  if (!badges || !Object.keys(badges).length) return '';
  let html = '<span class="chat-badges">';
  for (const key of Object.keys(badges)) {
    const url = BADGE_URLS[key];
    if (url) {
      html += `<img class="chat-badge" src="${url}" alt="${escapeHtml(key)}" title="${escapeHtml(key)}" />`;
    } else if (['broadcaster','moderator','vip','subscriber'].includes(key)) {
      html += `<span class="chat-badge-text ${escapeHtml(key)}">${key.slice(0,3).toUpperCase()}</span>`;
    }
  }
  return html + '</span>';
}

function buildTextWithEmotes(message, emotes) {
  if (!emotes || !Object.keys(emotes).length) return escapeHtml(message);
  const reps = [];
  for (const [id, positions] of Object.entries(emotes)) {
    for (const pos of positions) {
      const [s, e] = pos.split('-').map(Number);
      reps.push({ s, e, id, name: message.slice(s, e + 1) });
    }
  }
  reps.sort((a, b) => a.s - b.s);
  let out = '', cursor = 0;
  for (const r of reps) {
    out += escapeHtml(message.slice(cursor, r.s));
    out += `<img class="chat-emote" src="https://static-cdn.jtvnw.net/emoticons/v2/${r.id}/default/dark/1.0" alt="${escapeHtml(r.name)}" />`;
    cursor = r.e + 1;
  }
  return out + escapeHtml(message.slice(cursor));
}

/* ── DOM refs ────────────────────────────────────────────────── */

const overlay   = document.getElementById('chat-overlay');
const msgList   = document.getElementById('chat-messages');
const dot       = document.getElementById('chat-live-dot');
const chanLabel = document.getElementById('chat-channel-name');
const header    = overlay.querySelector('.chat-header');

function syncHeaderHeight() {
  const h = header ? header.offsetHeight : 40;
  overlay.style.setProperty('--chat-header-h', h + 'px');
}
window.addEventListener('resize', syncHeaderHeight);
requestAnimationFrame(syncHeaderHeight);

let chatState = { channel: '', visible: false, maxMessages: 15, x: 0, y: 0, width: 360, maxHeight: 600 };

function setConnected(ok) {
  dot.classList.toggle('connected', !!ok);
  dot.title = ok ? 'Connecté' : 'Déconnecté';
}

/* ── Render a message ───────────────────────────────────────── */

function addMessage({ displayName, color, badges, emotes, message, isAction }) {
  const col   = color || hashColor(displayName || '?');
  const el    = document.createElement('div');
  el.className = 'chat-msg' + (isAction ? ' is-action' : '');

  const text = buildTextWithEmotes(message, emotes);
  const msgHtml = isAction
    ? `<span class="chat-text"><span style="color:${col}">${text}</span></span>`
    : `<span class="chat-text">${text}</span>`;

  el.innerHTML = `${buildBadgesHtml(badges)}<span class="chat-author" style="color:${col}">${escapeHtml(displayName || '?')}</span><span class="chat-colon">:</span>${msgHtml}`;
  msgList.appendChild(el);
  trimMessages();
}

function addNotice(text) {
  const el = document.createElement('div');
  el.className = 'chat-notice';
  el.textContent = text;
  msgList.appendChild(el);
  trimMessages();
}

function trimMessages() {
  const max = chatState.maxMessages || 15;
  while (msgList.children.length > max) msgList.firstChild.remove();
}

/* ── Apply state from server ─────────────────────────────────── */

function applyState(s) {
  if (!s) return;
  chatState = s;
  overlay.classList.toggle('hidden', !s.visible);
  overlay.classList.toggle('transparent-mode', !!s.transparentMode);
  overlay.style.left      = (s.x || 0) + 'px';
  overlay.style.top       = (s.y || 0) + 'px';
  overlay.style.width     = (s.width || 360) + 'px';
  overlay.style.maxHeight = (s.maxHeight || 600) + 'px';
  chanLabel.textContent   = s.channel || '—';
  setConnected(s.connected);
  const pb = s.particleBorder ?? 28;
  overlay.style.setProperty('--chat-particle-border',    pb + 'px');
  overlay.style.setProperty('--chat-particle-border-x2', (pb * 2) + 'px');
}

/* ── Particules ─────────────────────────────────────────────── */

let ChatPS = null;
let _lastParticleKey = null;

function initParticles() {
  if (typeof createParticleSystem === 'function') {
    ChatPS = createParticleSystem('chat-particle-canvas', 'chat-overlay');
    ChatPS.init();
  }
}

function updateParticles(s) {
  if (!ChatPS || !window.THEME_PARTICLES) return;
  if (s.particlesEnabled === false) { ChatPS.stop(); _lastParticleKey = null; return; }
  const tpConf = THEME_PARTICLES[s.overlayTheme || 'default'];
  if (tpConf) {
    const key = tpConf.type + '|' + tpConf.count;
    if (key !== _lastParticleKey) {
      ChatPS.start(tpConf.type, tpConf.count);
      _lastParticleKey = key;
    }
  } else {
    if (_lastParticleKey) { ChatPS.stop(); _lastParticleKey = null; }
  }
  const pOp = (s.particleOpacity ?? 100) / 100;
  if (Math.abs(ChatPS.opacity - pOp) > 0.01) ChatPS.setOpacity(pOp);
  const pScale = (s.particleCountScale ?? 100) / 100;
  if (Math.abs(ChatPS.countScale - pScale) > 0.01) ChatPS.setCountScale(pScale);
}

/* ── Theme sync depuis le scoreboard ─────────────────────────── */

function applyTheme(s) {
  if (!s) return;
  const bg     = s.sbBgColor  || '#0E0E12';
  const accent = s.tagColor   || '#9147FF';

  // Surface légèrement plus claire que le bg
  const r = parseInt(bg.slice(1,3),16), g = parseInt(bg.slice(3,5),16), b = parseInt(bg.slice(5,7),16);
  const surface = `rgb(${Math.min(255,r+14)},${Math.min(255,g+14)},${Math.min(255,b+14)})`;

  const root = document.documentElement;
  root.style.setProperty('--theme-bg',      bg);
  root.style.setProperty('--theme-surface', surface);
  root.style.setProperty('--theme-accent',  accent);

  updateParticles(s);
}

/* ── Init ───────────────────────────────────────────────────── */

initParticles();

/* ── Polling + Socket ───────────────────────────────────────── */

function poll() {
  fetch('/api/twitch-chat').then(r => r.json()).then(applyState).catch(() => {});
  fetch('/api/state').then(r => r.json()).then(applyTheme).catch(() => {});
}
poll();
setInterval(poll, 2000);

try {
  const socket = io();
  socket.on('twitchChatUpdate',  applyState);
  socket.on('twitchChatMessage', addMessage);
  socket.on('twitchChatNotice',  d => addNotice(d.text));
  socket.on('stateUpdate',       applyTheme);
} catch (e) {}

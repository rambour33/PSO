/* ── YouTube Chat Overlay ── messages via Socket.io serveur ──── */

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

/* ── DOM refs ─────────────────────────────────────────────────── */

const overlay   = document.getElementById('yt-overlay');
const msgList   = document.getElementById('yt-messages');
const dot       = document.getElementById('yt-live-dot');
const chanLabel = document.getElementById('yt-channel-name');

let chatState = { channelId: '', visible: false, maxMessages: 15, x: 0, y: 0, width: 360, maxHeight: 600 };

function setConnected(ok) {
  dot.classList.toggle('connected', !!ok);
  dot.title = ok ? 'Connecté' : 'Déconnecté';
}

/* ── Build badges ────────────────────────────────────────────── */

function buildBadges(isOwner, isModerator, isMember) {
  let html = '';
  if (isOwner)    html += '<span class="yt-badge owner">Créateur</span>';
  if (isModerator) html += '<span class="yt-badge mod">Modo</span>';
  if (isMember && !isOwner) html += '<span class="yt-badge member">Membre</span>';
  if (!html) return '';
  return `<span class="yt-badges">${html}</span>`;
}

/* ── Build avatar element ────────────────────────────────────── */

function buildAvatar(profileImage, displayName) {
  if (profileImage) {
    return `<img class="yt-avatar" src="${escapeHtml(profileImage)}" alt="" loading="lazy" onerror="this.style.display='none'" />`;
  }
  const initial = (displayName || '?').charAt(0).toUpperCase();
  return `<div class="yt-avatar-placeholder">${escapeHtml(initial)}</div>`;
}

/* ── Render a regular message ───────────────────────────────── */

function addMessage(data) {
  const { displayName, profileImage, isOwner, isModerator, isMember, message } = data;
  const color  = hashColor(displayName || '?');
  const badges = buildBadges(!!isOwner, !!isModerator, !!isMember);

  const el = document.createElement('div');
  el.className = 'yt-msg';
  el.innerHTML = `
    ${buildAvatar(profileImage, displayName)}
    <div class="yt-msg-right">
      ${badges}
      <span class="yt-author" style="color:${color}">${escapeHtml(displayName || '?')}</span>
      <span class="yt-colon">:</span>
      <span class="yt-text">${escapeHtml(message)}</span>
    </div>
  `;
  msgList.prepend(el);
  trimMessages();
}

/* ── Render a SuperChat ─────────────────────────────────────── */

function addSuperChat(data) {
  const { displayName, profileImage, message, superChat } = data;
  const tierClass = superChat.tier >= 2 ? `tier-${superChat.tier}` : '';
  const el = document.createElement('div');
  el.className = `yt-superchat ${tierClass}`;

  const avatarSrc = profileImage
    ? `<img class="yt-superchat-avatar" src="${escapeHtml(profileImage)}" alt="" onerror="this.style.display='none'" />`
    : '';

  el.innerHTML = `
    <div class="yt-superchat-header">
      ${avatarSrc}
      <span class="yt-superchat-name">${escapeHtml(displayName || '?')}</span>
      <span class="yt-superchat-amount">${escapeHtml(superChat.amount)}</span>
    </div>
    ${message ? `<div class="yt-superchat-msg">${escapeHtml(message)}</div>` : ''}
  `;
  msgList.prepend(el);
  trimMessages();
}

/* ── Render a notice ────────────────────────────────────────── */

function addNotice(text) {
  const el = document.createElement('div');
  el.className = 'yt-notice';
  el.textContent = text;
  msgList.prepend(el);
  trimMessages();
}

function trimMessages() {
  const max = chatState.maxMessages || 15;
  while (msgList.children.length > max) msgList.lastChild.remove();
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
  chanLabel.textContent   = s.channelId || '—';
  setConnected(!!s.connected);
}

/* ── Init + Socket ────────────────────────────────────────────── */

fetch('/api/youtube-chat').then(r => r.json()).then(applyState).catch(() => {});

try {
  const socket = io();
  socket.on('youtubeChatUpdate',   applyState);
  socket.on('youtubeChatMessage',  (data) => {
    if (data.superChat) addSuperChat(data);
    else addMessage(data);
  });
  socket.on('youtubeChatNotice',   d => addNotice(d.text));
} catch (e) {}

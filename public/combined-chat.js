/* ── Combined Chat Overlay — Twitch + YouTube ───────────────────── */

/* ── Helpers communs ─────────────────────────────────────────────── */

const FALLBACK_COLORS = [
  '#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#C77DFF',
  '#FF9A3C','#4ECDC4','#FF6FC8','#A8E063','#F7971E',
];

function hashColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return FALLBACK_COLORS[Math.abs(h) % FALLBACK_COLORS.length];
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── Badge URLs Twitch ───────────────────────────────────────────── */

const BADGE_URLS = {
  broadcaster: 'https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/1',
  moderator:   'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d7/1',
  vip:         'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/1',
  premium:     'https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/1',
};

function buildTwitchBadges(badges) {
  if (!badges || !Object.keys(badges).length) return '';
  let html = '<span class="cc-badges">';
  for (const key of Object.keys(badges)) {
    const url = BADGE_URLS[key];
    if (url) {
      html += `<img class="cc-badge-img" src="${url}" alt="${escapeHtml(key)}" />`;
    } else if (['broadcaster','moderator','vip','subscriber'].includes(key)) {
      html += `<span class="cc-badge-text ${escapeHtml(key)}">${key.slice(0,3).toUpperCase()}</span>`;
    }
  }
  return html + '</span>';
}

function buildTwitchEmotes(message, emotes) {
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
    out += `<img class="cc-emote" src="https://static-cdn.jtvnw.net/emoticons/v2/${r.id}/default/dark/1.0" alt="${escapeHtml(r.name)}" />`;
    cursor = r.e + 1;
  }
  return out + escapeHtml(message.slice(cursor));
}

function buildYtBadges(isOwner, isModerator, isMember) {
  let html = '';
  if (isOwner)               html += '<span class="cc-yt-badge owner">Créateur</span>';
  if (isModerator)           html += '<span class="cc-yt-badge mod">Modo</span>';
  if (isMember && !isOwner)  html += '<span class="cc-yt-badge member">Membre</span>';
  return html ? `<span class="cc-yt-badges">${html}</span>` : '';
}

function buildYtAvatar(profileImage, displayName) {
  if (profileImage) {
    return `<img class="cc-avatar" src="${escapeHtml(profileImage)}" alt="" loading="lazy" onerror="this.style.display='none'" />`;
  }
  const initial = (displayName || '?').charAt(0).toUpperCase();
  return `<div class="cc-avatar-placeholder">${escapeHtml(initial)}</div>`;
}

/* ── Icônes plateforme ───────────────────────────────────────────── */

const ICON_TWITCH = `<span class="cc-platform twitch"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg></span>`;
const ICON_YT     = `<span class="cc-platform youtube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.3 5 12 5 12 5s-4.3 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.7 2.3.8C6.8 19 12 19 12 19s4.3 0 7-.2c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM9.7 14.5V9l5.4 2.8-5.4 2.7z"/></svg></span>`;

/* ── DOM refs ────────────────────────────────────────────────────── */

const overlay    = document.getElementById('cc-overlay');
const msgList    = document.getElementById('cc-messages');
const dotTwitch  = document.getElementById('cc-dot-twitch');
const dotYt      = document.getElementById('cc-dot-yt');
const nameTwitch = document.getElementById('cc-twitch-name');
const nameYt     = document.getElementById('cc-yt-name');

let state = {
  visible: true, x: 0, y: 0, width: 380, maxHeight: 620,
  maxMessages: 20, transparentMode: false,
};

/* ── Appliquer la position / taille ─────────────────────────────── */

function applyState(s) {
  if (!s) return;
  state = { ...state, ...s };
  overlay.classList.toggle('hidden',           !state.visible);
  overlay.classList.toggle('transparent-mode', !!state.transparentMode);
  overlay.style.left      = (state.x      || 0)   + 'px';
  overlay.style.top       = (state.y      || 0)   + 'px';
  overlay.style.width     = (state.width  || 380) + 'px';
  overlay.style.maxHeight = (state.maxHeight || 620) + 'px';
}

/* ── Trim ────────────────────────────────────────────────────────── */

function trim() {
  const max = state.maxMessages || 20;
  while (msgList.children.length > max) msgList.lastChild.remove();
}

/* ── Twitch message ─────────────────────────────────────────────── */

function addTwitchMessage({ displayName, color, badges, emotes, message, isAction }) {
  const col  = color || hashColor(displayName || '?');
  const el   = document.createElement('div');
  el.className = 'cc-msg from-twitch' + (isAction ? ' is-action' : '');

  const text = buildTwitchEmotes(message, emotes);
  const msgHtml = isAction
    ? `<span class="cc-text"><span style="color:${col}">${text}</span></span>`
    : `<span class="cc-text">${text}</span>`;

  el.innerHTML = `${ICON_TWITCH}${buildTwitchBadges(badges)}<span class="cc-author" style="color:${col}">${escapeHtml(displayName || '?')}</span><span class="cc-colon">:</span>${msgHtml}`;
  msgList.prepend(el);
  trim();
}

/* ── YouTube message ─────────────────────────────────────────────── */

function addYtMessage({ displayName, profileImage, isOwner, isModerator, isMember, message, superChat }) {
  if (superChat) {
    addYtSuperChat({ displayName, profileImage, message, superChat });
    return;
  }
  const color   = hashColor(displayName || '?');
  const el      = document.createElement('div');
  el.className  = 'cc-msg from-youtube';

  const badges = buildYtBadges(!!isOwner, !!isModerator, !!isMember);
  const avatar = buildYtAvatar(profileImage, displayName);

  el.innerHTML = `${ICON_YT}${avatar}<span class="cc-yt-badges-wrap">${badges}</span><span class="cc-author" style="color:${color}">${escapeHtml(displayName || '?')}</span><span class="cc-colon">:</span><span class="cc-text">${escapeHtml(message)}</span>`;
  msgList.prepend(el);
  trim();
}

function addYtSuperChat({ displayName, profileImage, message, superChat }) {
  const tier = superChat.tier || 1;
  const el   = document.createElement('div');
  el.className = `cc-superchat tier-${tier}`;

  const avatarSrc = profileImage
    ? `<img class="cc-superchat-avatar" src="${escapeHtml(profileImage)}" alt="" onerror="this.style.display='none'" />`
    : '';

  el.innerHTML = `
    <div class="cc-superchat-header">
      ${ICON_YT}${avatarSrc}
      <span class="cc-superchat-name">${escapeHtml(displayName || '?')}</span>
      <span class="cc-superchat-amount">${escapeHtml(superChat.amount)}</span>
    </div>
    ${message ? `<div class="cc-superchat-msg">${escapeHtml(message)}</div>` : ''}
  `;
  msgList.prepend(el);
  trim();
}

/* ── Notices ─────────────────────────────────────────────────────── */

function addNotice(text, platform) {
  const el     = document.createElement('div');
  el.className = `cc-notice ${platform}`;
  el.textContent = text;
  msgList.prepend(el);
  trim();
}

/* ── Status des sources ─────────────────────────────────────────── */

function setTwitchStatus(s) {
  dotTwitch.classList.toggle('connected', !!s.connected);
  dotTwitch.title = s.connected ? `Twitch: ${s.channel || '—'}` : 'Twitch déconnecté';
  nameTwitch.textContent = s.channel || '—';
}

function setYtStatus(s) {
  dotYt.classList.toggle('connected', !!s.connected);
  dotYt.title = s.connected ? `YouTube: ${s.channelId || '—'}` : 'YouTube déconnecté';
  nameYt.textContent = s.channelId || '—';
}

/* ── Thème / particules ──────────────────────────────────────────── */

let ChatPS = null;
let _lastParticleKey = null;

function initParticles() {
  if (typeof createParticleSystem === 'function') {
    ChatPS = createParticleSystem('cc-particle-canvas', 'cc-overlay');
    ChatPS.init();
  }
}

function applyTheme(s) {
  if (!s) return;
  const bg     = s.sbBgColor || '#0E0E12';
  const accent = s.tagColor  || '#9147FF';
  const r = parseInt(bg.slice(1,3),16), g = parseInt(bg.slice(3,5),16), b = parseInt(bg.slice(5,7),16);
  const surface = `rgb(${Math.min(255,r+14)},${Math.min(255,g+14)},${Math.min(255,b+14)})`;
  const root = document.documentElement;
  root.style.setProperty('--theme-bg',      bg);
  root.style.setProperty('--theme-surface', surface);
  root.style.setProperty('--theme-accent',  accent);

  if (!ChatPS || !window.THEME_PARTICLES) return;
  if (s.particlesEnabled === false) { ChatPS.stop(); _lastParticleKey = null; return; }
  const tpConf = THEME_PARTICLES[s.overlayTheme || 'default'];
  if (tpConf) {
    const key = tpConf.type + '|' + tpConf.count;
    if (key !== _lastParticleKey) { ChatPS.start(tpConf.type, tpConf.count); _lastParticleKey = key; }
  } else {
    if (_lastParticleKey) { ChatPS.stop(); _lastParticleKey = null; }
  }
  const pOp = (s.particleOpacity ?? 100) / 100;
  if (Math.abs(ChatPS.opacity - pOp) > 0.01) ChatPS.setOpacity(pOp);
  const pScale = (s.particleCountScale ?? 100) / 100;
  if (Math.abs(ChatPS.countScale - pScale) > 0.01) ChatPS.setCountScale(pScale);
}

/* ── Init ────────────────────────────────────────────────────────── */

initParticles();

/* Charge l'état initial des deux sources */
fetch('/api/combined-chat').then(r => r.json()).then(applyState).catch(() => {});
fetch('/api/twitch-chat').then(r => r.json()).then(setTwitchStatus).catch(() => {});
fetch('/api/youtube-chat').then(r => r.json()).then(setYtStatus).catch(() => {});
fetch('/api/state').then(r => r.json()).then(applyTheme).catch(() => {});

/* ── Socket ──────────────────────────────────────────────────────── */

try {
  const socket = io();

  socket.on('combinedChatUpdate',  applyState);
  socket.on('twitchChatUpdate',    setTwitchStatus);
  socket.on('youtubeChatUpdate',   setYtStatus);

  socket.on('twitchChatMessage',   addTwitchMessage);
  socket.on('youtubeChatMessage',  addYtMessage);

  socket.on('twitchChatNotice',    d => addNotice(d.text, 'twitch'));
  socket.on('youtubeChatNotice',   d => addNotice(d.text, 'youtube'));

  socket.on('stateUpdate',         applyTheme);
} catch(e) {}

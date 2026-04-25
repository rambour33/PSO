const socket = io();

const ROLE_COLORS = {
  'Duelist':    '#FF4655',
  'Initiator':  '#F59E0B',
  'Controller': '#8B5CF6',
  'Sentinel':   '#10B981',
};

function renderSlot(slot, idx, container, side) {
  const el = document.createElement('div');
  const isActive = slot.active && !slot.locked;
  el.className = 'val-pb-slot' +
    (slot.locked ? ' locked' : '') +
    (isActive    ? ' active' : '');

  // Icône agent
  const iconEl = document.createElement('div');
  iconEl.className = 'val-pb-agent-icon';
  if (slot.agent) {
    const roleColor = ROLE_COLORS[slot.role] || 'rgba(255,255,255,0.2)';
    iconEl.style.borderColor = roleColor + '88';
    iconEl.style.background  = roleColor + '18';
    const abbr = document.createElement('div');
    abbr.className = 'icon-abbr';
    abbr.style.color = roleColor;
    abbr.textContent = slot.agent.slice(0, 3).toUpperCase();
    iconEl.appendChild(abbr);
  } else {
    const num = document.createElement('div');
    num.className = 'icon-abbr';
    num.textContent = `P${idx + 1}`;
    iconEl.appendChild(num);
  }

  // Infos
  const info = document.createElement('div');
  info.className = 'val-pb-slot-info';

  const playerEl = document.createElement('div');
  playerEl.className = 'val-pb-slot-player';
  playerEl.textContent = slot.name || `JOUEUR ${idx + 1}`;

  const agentEl = document.createElement('div');
  agentEl.className = 'val-pb-slot-agent';
  agentEl.textContent = slot.agent || '—';

  info.appendChild(playerEl);
  info.appendChild(agentEl);

  if (slot.role) {
    const roleEl = document.createElement('div');
    roleEl.className = 'val-pb-slot-role';
    roleEl.style.color = ROLE_COLORS[slot.role] || 'rgba(236,232,225,0.3)';
    roleEl.textContent = slot.role.toUpperCase();
    info.appendChild(roleEl);
  }

  // Indicateur verrou
  const lock = document.createElement('div');
  lock.className = 'val-pb-slot-lock';
  lock.textContent = slot.locked ? '✓' : (isActive ? '●' : '○');

  el.appendChild(iconEl);
  el.appendChild(info);
  el.appendChild(lock);
  container.appendChild(el);
}

function renderMaps(maps, container) {
  container.innerHTML = '';
  if (!maps?.length) return;
  const decided = maps.filter(m => m.status !== 'available');
  decided.forEach(m => {
    const el = document.createElement('div');
    const statusCls = m.status === 'picked' ? 'status-picked' :
                      m.team === 1 ? 'status-banned-1' : 'status-banned-2';
    el.className = `val-pb-map ${statusCls}`;
    const label = m.status === 'picked' ? 'PICK' :
                  `BAN – ${m.team === 1 ? document.getElementById('vpb-t1-name').textContent : document.getElementById('vpb-t2-name').textContent}`;
    el.innerHTML =
      `<span class="val-pb-map-name">${m.name}</span>` +
      `<span class="val-pb-map-status">${label}</span>`;
    container.appendChild(el);
  });
}

function applyState(s) {
  if (!s) return;
  const root = document.getElementById('val-pb');
  root.classList.toggle('hidden', !s.visible);

  const r = document.documentElement;
  r.style.setProperty('--val-team1',   s.team1?.color || '#FF4655');
  r.style.setProperty('--val-team2',   s.team2?.color || '#3B71E4');
  r.style.setProperty('--val-primary', s.team1?.color || '#FF4655');

  // Noms et logos
  document.getElementById('vpb-t1-name').textContent = (s.team1?.name || 'TEAM ALPHA').toUpperCase();
  document.getElementById('vpb-t2-name').textContent = (s.team2?.name || 'TEAM BRAVO').toUpperCase();
  const l1 = document.getElementById('vpb-t1-logo');
  l1.src = s.team1?.logo || '';
  const l2 = document.getElementById('vpb-t2-logo');
  l2.src = s.team2?.logo || '';

  // Phase
  document.getElementById('vpb-event').textContent =
    (s.event || 'VCT 2025').toUpperCase();
  document.getElementById('vpb-phase').textContent =
    s.phase === 'map' ? 'MAP VETO' : 'AGENT SELECT';

  // Slots team 1
  const t1slots = document.getElementById('vpb-t1-slots');
  t1slots.innerHTML = '';
  (s.team1?.players || []).forEach((p, i) => renderSlot(p, i, t1slots, 1));

  // Slots team 2
  const t2slots = document.getElementById('vpb-t2-slots');
  t2slots.innerHTML = '';
  (s.team2?.players || []).forEach((p, i) => renderSlot(p, i, t2slots, 2));

  // Cartes de maps
  renderMaps(s.maps, document.getElementById('vpb-maps'));
}

socket.on('valPickBanUpdate', applyState);
fetch('/api/val/pickban').then(r => r.json()).then(applyState).catch(() => {});

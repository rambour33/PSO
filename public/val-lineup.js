const socket = io();

const ROLE_COLORS = {
  'Duelist':    '#FF4655',
  'Initiator':  '#F59E0B',
  'Controller': '#8B5CF6',
  'Sentinel':   '#10B981',
};

function flagEmoji(code) {
  if (!code || code.length !== 2) return '';
  return [...code.toUpperCase()].map(c => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');
}

function renderPlayers(players, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  (players || []).forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'val-lineup-player';

    // Drapeau
    const flag = document.createElement('div');
    flag.className = 'val-lineup-player-flag';
    flag.textContent = p.flag ? flagEmoji(p.flag) : '';

    // Infos
    const info = document.createElement('div');
    info.className = 'val-lineup-player-info';

    const nameEl = document.createElement('div');
    nameEl.className = 'val-lineup-player-name';
    nameEl.textContent = p.name || `JOUEUR ${i + 1}`;

    const agentEl = document.createElement('div');
    agentEl.className = 'val-lineup-player-agent';
    agentEl.textContent = p.agent || '—';

    info.appendChild(nameEl);
    info.appendChild(agentEl);

    if (p.role) {
      const roleEl = document.createElement('div');
      roleEl.className = 'val-lineup-player-role';
      roleEl.style.color = ROLE_COLORS[p.role] || 'rgba(236,232,225,0.35)';
      roleEl.textContent = p.role.toUpperCase();
      info.appendChild(roleEl);
    }

    el.appendChild(flag);
    el.appendChild(info);

    if (p.igl) {
      const iglEl = document.createElement('div');
      iglEl.className = 'val-lineup-player-igl';
      iglEl.textContent = 'IGL';
      el.appendChild(iglEl);
    }

    container.appendChild(el);
  });
}

function applyState(s) {
  if (!s) return;
  const root = document.getElementById('val-lineup');
  root.classList.toggle('hidden', !s.visible);

  const r = document.documentElement;
  r.style.setProperty('--val-team1',   s.team1?.color || '#FF4655');
  r.style.setProperty('--val-team2',   s.team2?.color || '#3B71E4');
  r.style.setProperty('--val-primary', s.team1?.color || '#FF4655');

  // Équipe 1
  document.getElementById('vlu-t1-name').textContent = (s.team1?.name || 'TEAM ALPHA').toUpperCase();
  const l1 = document.getElementById('vlu-t1-logo');
  l1.src = s.team1?.logo || '';

  // Équipe 2
  document.getElementById('vlu-t2-name').textContent = (s.team2?.name || 'TEAM BRAVO').toUpperCase();
  const l2 = document.getElementById('vlu-t2-logo');
  l2.src = s.team2?.logo || '';

  // Centre
  document.getElementById('vlu-event').textContent = (s.event   || 'VCT 2025').toUpperCase();
  document.getElementById('vlu-map').textContent   = (s.mapName || '').toUpperCase();

  renderPlayers(s.team1?.players, 'vlu-t1-players');
  renderPlayers(s.team2?.players, 'vlu-t2-players');
}

socket.on('valLineupUpdate', applyState);
fetch('/api/val/lineup').then(r => r.json()).then(applyState).catch(() => {});

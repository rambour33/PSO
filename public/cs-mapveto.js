const socket = io();

function applyState(s) {
  if (!s) return;
  const root = document.getElementById('cs-mv');
  root.classList.toggle('hidden', !s.visible);

  const t1c = s.team1?.color || '#E8B400';
  const t2c = s.team2?.color || '#5B94EB';
  const r = document.documentElement;
  r.style.setProperty('--cs-t',  t1c);
  r.style.setProperty('--cs-ct', t2c);

  document.getElementById('cmv-t1-name').textContent = (s.team1?.name || 'TEAM ALPHA').toUpperCase();
  document.getElementById('cmv-t2-name').textContent = (s.team2?.name || 'TEAM BRAVO').toUpperCase();
  const l1 = document.getElementById('cmv-t1-logo'); l1.src = s.team1?.logo || '';
  const l2 = document.getElementById('cmv-t2-logo'); l2.src = s.team2?.logo || '';

  document.getElementById('cmv-event').textContent = (s.event || 'IEM KATOWICE').toUpperCase();
  document.getElementById('cmv-phase').textContent = (s.phase || 'MAP VETO').toUpperCase();

  // Slots équipes
  const t1picks = (s.maps || []).filter(m => m.status === 'picked' && m.team === 1);
  const t2picks = (s.maps || []).filter(m => m.status === 'picked' && m.team === 2);
  const t1bans  = (s.maps || []).filter(m => m.status === 'banned'  && m.team === 1);
  const t2bans  = (s.maps || []).filter(m => m.status === 'banned'  && m.team === 2);

  renderSlots(document.getElementById('cmv-t1-slots'), t1picks, t1bans, 3);
  renderSlots(document.getElementById('cmv-t2-slots'), t2picks, t2bans, 3);

  // Cartes de maps
  const mapsEl = document.getElementById('cmv-maps');
  mapsEl.innerHTML = '';
  (s.maps || []).forEach(m => {
    const el = document.createElement('div');
    el.className = `cs-mv-map-item ${m.status === 'available' ? 'available' : m.status === 'picked' ? `picked-${m.team}` : m.status === 'banned' ? 'banned' : m.status === 'decider' ? 'decider' : 'available'}`;
    const nameEl = document.createElement('div'); nameEl.textContent = m.name.toUpperCase();
    const statusEl = document.createElement('div'); statusEl.className = 'cs-mv-map-status';
    if (m.status === 'picked')  statusEl.textContent = m.team === 1 ? 'PICK T1' : 'PICK T2';
    if (m.status === 'banned')  statusEl.textContent = m.team === 1 ? 'BAN T1'  : 'BAN T2';
    if (m.status === 'decider') statusEl.textContent = 'DECIDER';
    el.appendChild(nameEl);
    el.appendChild(statusEl);
    mapsEl.appendChild(el);
  });
}

function renderSlots(container, picks, bans, maxEach) {
  container.innerHTML = '';
  for (let i = 0; i < maxEach; i++) {
    const p = picks[i];
    const slot = document.createElement('div');
    slot.className = p ? 'cs-mv-slot filled-pick' : 'cs-mv-slot';
    slot.textContent = p ? p.name.toUpperCase() : '—';
    container.appendChild(slot);
  }
  for (let i = 0; i < maxEach; i++) {
    const b = bans[i];
    const slot = document.createElement('div');
    slot.className = b ? 'cs-mv-slot filled-ban' : 'cs-mv-slot';
    slot.textContent = b ? b.name.toUpperCase() : '—';
    container.appendChild(slot);
  }
}

socket.on('cs2MapVetoUpdate', applyState);
fetch('/api/cs2/mapveto').then(r => r.json()).then(applyState).catch(() => {});

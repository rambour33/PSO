const socket = io();

function renderCasters(s) {
  const root = document.getElementById('casters-root');
  const container = document.getElementById('casters-cards');

  // Visibility
  root.classList.toggle('hidden', !s.visible);

  // Layout
  container.dataset.layout = s.layout || 'row';

  const hex = (s.bgColor || '#0E0E12').replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = (s.bgOpacity ?? 100) / 100;
  const cardBg = `rgba(${r},${g},${b},${a})`;

  // Only render active casters (those with a name)
  const active = s.casters.filter(c => c.name.trim() !== '');
  container.innerHTML = '';

  active.forEach(caster => {
    const card = document.createElement('div');
    card.className = 'caster-card';
    card.style.setProperty('background', cardBg, 'important');

    const inner = document.createElement('div');
    inner.className = 'caster-card-inner';

    // Name
    const nameEl = document.createElement('div');
    nameEl.className = 'caster-name';
    nameEl.textContent = caster.name;
    inner.appendChild(nameEl);

    // Socials
    const socialsEl = document.createElement('div');
    socialsEl.className = 'caster-socials';

    const networks = [
      { key: 'twitter', cls: 'twitter', icon: '𝕏',  prefix: '' },
      { key: 'twitch',  cls: 'twitch',  icon: '▶',  prefix: '' },
      { key: 'youtube', cls: 'youtube', icon: '▶', prefix: '' },
    ];

    networks.forEach(({ key, cls, icon, prefix }) => {
      const handle = caster[key] ? caster[key].trim() : '';
      if (!handle) return;
      const row = document.createElement('div');
      row.className = `caster-social ${cls}`;
      row.innerHTML = `
        <span class="social-icon">${icon}</span>
        <span class="social-handle">${prefix}${handle}</span>
      `;
      socialsEl.appendChild(row);
    });

    inner.appendChild(socialsEl);
    card.appendChild(inner);
    container.appendChild(card);
  });
}

socket.on('castersUpdate', renderCasters);

fetch('/api/casters').then(r => r.json()).then(castersData => {
  document.getElementById('casters-root').classList.add('animate-in');
  renderCasters(castersData);
});

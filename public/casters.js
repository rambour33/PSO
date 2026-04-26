const socket = io();

function renderCasters(s) {
  const root = document.getElementById('casters-root');
  const container = document.getElementById('casters-cards');

  root.classList.toggle('hidden', !s.visible);
  container.dataset.layout = s.layout || 'row';

  // Label "COMMENTATEURS"
  const label = root.querySelector('.casters-label');
  if (label) label.style.display = s.showLabel !== false ? '' : 'none';

  // Background color
  const hex = (s.bgColor || '#0E0E12').replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = (s.bgOpacity ?? 100) / 100;
  const cardBg = `rgba(${r},${g},${b},${a})`;

  container.innerHTML = '';

  s.casters.forEach((caster, idx) => {
    if (!caster.name.trim()) return;
    const n = idx + 1;
    const showName    = s[`c${n}ShowName`]    !== false;
    const nameSize    = s[`c${n}NameSize`]    || 22;
    const nameColor   = s[`c${n}NameColor`]   || '#F0EEF8';
    const showTwitter = s[`c${n}ShowTwitter`] !== false;
    const showTwitch  = s[`c${n}ShowTwitch`]  !== false;
    const showYoutube = s[`c${n}ShowYoutube`] !== false;

    const card = document.createElement('div');
    card.className = 'caster-card';
    card.style.setProperty('background', cardBg, 'important');

    const inner = document.createElement('div');
    inner.className = 'caster-card-inner';

    if (showName) {
      const nameEl = document.createElement('div');
      nameEl.className = 'caster-name';
      nameEl.textContent = caster.name;
      nameEl.style.fontSize = nameSize + 'px';
      nameEl.style.color = nameColor;
      inner.appendChild(nameEl);
    }

    const socialsEl = document.createElement('div');
    socialsEl.className = 'caster-socials';

    const networks = [
      { key: 'twitter', cls: 'twitter', icon: '𝕏',  show: showTwitter },
      { key: 'twitch',  cls: 'twitch',  icon: '▶',  show: showTwitch  },
      { key: 'youtube', cls: 'youtube', icon: '▶', show: showYoutube },
    ];

    networks.forEach(({ key, cls, icon, show }) => {
      if (!show) return;
      const handle = caster[key] ? caster[key].trim() : '';
      if (!handle) return;
      const row = document.createElement('div');
      row.className = `caster-social ${cls}`;
      row.innerHTML = `<span class="social-icon">${icon}</span><span class="social-handle">${handle}</span>`;
      socialsEl.appendChild(row);
    });

    if (socialsEl.children.length > 0) inner.appendChild(socialsEl);
    card.appendChild(inner);
    container.appendChild(card);
  });
}

socket.on('castersUpdate', renderCasters);

fetch('/api/casters').then(r => r.json()).then(castersData => {
  document.getElementById('casters-root').classList.add('animate-in');
  renderCasters(castersData);
});

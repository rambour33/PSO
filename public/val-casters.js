const socket = io();

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${alpha})`;
}

function renderCasters(s) {
  if (!s) return;
  const root  = document.getElementById('val-casters');
  const cards = document.getElementById('val-casters-cards');

  root.classList.toggle('hidden', !s.visible);
  cards.dataset.layout = s.layout || 'row';

  // Couleur de fond
  if (s.bgColor) {
    const a = (s.bgOpacity ?? 96) / 100;
    document.documentElement.style.setProperty('--val-bg', hexToRgba(s.bgColor, a));
  }

  cards.innerHTML = '';
  (s.casters || []).forEach((caster, idx) => {
    if (!caster.name?.trim()) return;
    const n = idx + 1;

    const showName    = s[`c${n}ShowName`]    !== false;
    const nameSize    = s[`c${n}NameSize`]    || 22;
    const nameColor   = s[`c${n}NameColor`]   || '#ECE8E1';
    const showTwitter = s[`c${n}ShowTwitter`] !== false;
    const showTwitch  = s[`c${n}ShowTwitch`]  !== false;
    const showYoutube = s[`c${n}ShowYoutube`] !== false;

    const card = document.createElement('div');
    card.className = 'val-caster-card';

    if (showName) {
      const nameEl = document.createElement('div');
      nameEl.className = 'val-caster-name';
      nameEl.textContent = caster.name;
      nameEl.style.fontSize = nameSize + 'px';
      nameEl.style.color    = nameColor;
      card.appendChild(nameEl);
    }

    const socialsEl = document.createElement('div');
    socialsEl.className = 'val-caster-socials';
    [
      { key: 'twitter', cls: 'twitter', icon: '𝕏',  show: showTwitter },
      { key: 'twitch',  cls: 'twitch',  icon: '▶', show: showTwitch },
      { key: 'youtube', cls: 'youtube', icon: '▶', show: showYoutube },
    ].forEach(({ key, cls, icon, show }) => {
      if (!show || !caster[key]?.trim()) return;
      const row = document.createElement('div');
      row.className = `val-caster-social ${cls}`;
      row.innerHTML = `<span class="social-icon">${icon}</span><span>${caster[key]}</span>`;
      socialsEl.appendChild(row);
    });

    if (socialsEl.children.length > 0) card.appendChild(socialsEl);
    cards.appendChild(card);
  });
}

// Écoute le même état que l'overlay SSBU + la mise à jour du thème Valorant
socket.on('castersUpdate',  renderCasters);
socket.on('valMatchUpdate', s => {
  if (!s?.theme) return;
  const themes = {
    'valorant-default': '#FF4655', 'valorant-dark': '#FF4655', 'valorant-night': '#BD3944',
    'sentinels': '#E31937', 'fnatic': '#F5821F', 'navi': '#F7CF00',
    'team-liquid': '#009AC7', 'loud': '#73E02A', 'cloud9': '#00C8FF',
    'vitality': '#F5D000', 'drx': '#00A3FF', 'paper-rex': '#FF6B00',
  };
  const color = themes[s.theme] || '#FF4655';
  document.documentElement.style.setProperty('--val-primary', color);
});

fetch('/api/casters').then(r => r.json()).then(renderCasters).catch(() => {});

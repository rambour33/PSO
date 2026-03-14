const socket = io();
let currentState = null;

function renderPlayerName(elId, player) {
  const el = document.getElementById(elId);
  el.innerHTML = '';
  if (player.tag) {
    const tag = document.createElement('span');
    tag.className = 'player-tag';
    tag.textContent = player.tag;
    el.appendChild(tag);
  }
  const name = document.createElement('span');
  name.className = 'player-name-text';
  name.textContent = player.name;
  el.appendChild(name);
  if (player.pronouns) {
    const pro = document.createElement('span');
    pro.className = 'player-pronouns';
    pro.textContent = player.pronouns;
    el.appendChild(pro);
  }
}

function getFormatMax(fmt, custom) {
  if (fmt === 'Bo1') return 1;
  if (fmt === 'Bo3') return 3;
  if (fmt === 'Bo5') return 5;
  return custom || 2;
}

function renderDots(containerId, score, totalGames, color) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const winsNeeded = Math.ceil(totalGames / 2);
  el.innerHTML = '';
  for (let i = 0; i < winsNeeded; i++) {
    const dot = document.createElement('div');
    dot.className = 'win-dot' + (i < score ? ' filled' : '');
    dot.style.setProperty('--dot-color', color);
    el.appendChild(dot);
  }
}

function update(s) {
  const prev = currentState;

  const sb = document.getElementById('scoreboard');
  sb.classList.toggle('hidden', !s.visible);
  sb.classList.toggle('swapped', !!s.swapped);
  sb.classList.toggle('style-slim', s.overlayStyle === 'slim');

  // Background color + opacity
  const hex = (s.sbBgColor || '#0E0E12').replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = (s.sbBgOpacity ?? 100) / 100;
  sb.style.setProperty('--sb-bg', `rgba(${r},${g},${b},${a})`);
  sb.style.setProperty('--event-text-size', `${s.eventTextSize ?? 12}px`);
  sb.style.setProperty('--event-text-color', s.eventTextColor || '#5A5A7A');
  sb.style.setProperty('--tag-color', s.tagColor || '#E8B830');
  sb.style.setProperty('--name-color', s.nameColor || '#F0EEF8');
  sb.style.setProperty('--pronouns-color', s.pronounsColor || '#5A5A7A');

  // Colors — full layout
  document.getElementById('player1-block').style.setProperty('--p1-color', s.player1.color);
  document.getElementById('player2-block').style.setProperty('--p2-color', s.player2.color);
  // Colors — slim layout
  document.getElementById('player1-block-slim').style.setProperty('--p1-color', s.player1.color);
  document.getElementById('player2-block-slim').style.setProperty('--p2-color', s.player2.color);

  // Player names — both layouts
  renderPlayerName('p1-name', s.player1);
  renderPlayerName('p2-name', s.player2);
  renderPlayerName('p1-name-slim', s.player1);
  renderPlayerName('p2-name-slim', s.player2);
  document.getElementById('event-name').textContent = s.event;
  document.getElementById('event-stage').textContent = s.stage;
  document.getElementById('format-info').textContent = s.format === 'custom' ? `First to ${s.customWins}` : s.format;

  // Current stage
  const stageSep = document.getElementById('current-stage-sep');
  const stageName = document.getElementById('current-stage-name');
  if (s.currentStage) {
    stageSep.style.display = 'inline';
    stageName.textContent = s.currentStage;
  } else {
    stageSep.style.display = 'none';
    stageName.textContent = '';
  }

  // Characters — Player 1
  const p1Img = document.getElementById('p1-char-img');
  const p1Ph  = document.getElementById('p1-char-placeholder');
  if (s.player1.character && s.player1.character.image) {
    p1Img.src = s.player1.character.image;
    p1Img.style.display = 'block';
    p1Ph.style.display = 'none';
  } else {
    p1Img.style.display = 'none';
    p1Ph.style.display = 'flex';
    p1Ph.textContent = s.player1.character ? s.player1.character.name.charAt(0) : '?';
  }

  // Stock icon — Player 1 (slim)
  const p1Stock = document.getElementById('p1-stock-icon');
  const p1Sep   = document.getElementById('p1-icon-sep');
  if (s.player1.character) {
    const color1 = String(s.player1.stockColor ?? 0).padStart(2, '0');
    p1Stock.src = `/Stock Icons/chara_2_${s.player1.character.name}_${color1}.png`;
    p1Stock.style.display = 'block';
    p1Sep.style.display = 'block';
    p1Stock.onerror = () => { p1Stock.style.display = 'none'; p1Sep.style.display = 'none'; };
  } else {
    p1Stock.style.display = 'none';
    p1Sep.style.display = 'none';
  }

  // Characters — Player 2
  const p2Img = document.getElementById('p2-char-img');
  const p2Ph  = document.getElementById('p2-char-placeholder');
  if (s.player2.character && s.player2.character.image) {
    p2Img.src = s.player2.character.image;
    p2Img.style.display = 'block';
    p2Ph.style.display = 'none';
  } else {
    p2Img.style.display = 'none';
    p2Ph.style.display = 'flex';
    p2Ph.textContent = s.player2.character ? s.player2.character.name.charAt(0) : '?';
  }

  // Stock icon — Player 2 (slim)
  const p2Stock = document.getElementById('p2-stock-icon');
  const p2Sep   = document.getElementById('p2-icon-sep');
  if (s.player2.character) {
    const color2 = String(s.player2.stockColor ?? 0).padStart(2, '0');
    p2Stock.src = `/Stock Icons/chara_2_${s.player2.character.name}_${color2}.png`;
    p2Stock.style.display = 'block';
    p2Sep.style.display = 'block';
    p2Stock.onerror = () => { p2Stock.style.display = 'none'; p2Sep.style.display = 'none'; };
  } else {
    p2Stock.style.display = 'none';
    p2Sep.style.display = 'none';
  }

  // Center logo — full layout
  const centerImg = document.getElementById('center-logo-img');
  const vsEl = document.getElementById('score-vs');
  if (s.centerLogo) {
    centerImg.src = s.centerLogo;
    centerImg.style.display = 'block';
    vsEl.style.display = 'none';
  } else {
    centerImg.style.display = 'none';
    vsEl.style.display = 'inline';
  }
  // Center logo — slim layout
  const centerImgSlim = document.getElementById('center-logo-img-slim');
  const vsSlim = document.getElementById('slim-vs');
  if (s.centerLogo) {
    centerImgSlim.src = s.centerLogo;
    centerImgSlim.style.display = 'block';
    vsSlim.style.display = 'none';
  } else {
    centerImgSlim.style.display = 'none';
    vsSlim.style.display = 'inline';
  }

  // Scores with flash animation
  const s1El = document.getElementById('p1-score');
  const s2El = document.getElementById('p2-score');
  if (prev && prev.player1.score !== s.player1.score) {
    s1El.classList.remove('updated');
    void s1El.offsetWidth;
    s1El.classList.add('updated');
  }
  if (prev && prev.player2.score !== s.player2.score) {
    s2El.classList.remove('updated');
    void s2El.offsetWidth;
    s2El.classList.add('updated');
  }
  s1El.textContent = s.player1.score;
  s2El.textContent = s.player2.score;

  // Scores — slim layout
  const s1Slim = document.getElementById('p1-score-slim');
  const s2Slim = document.getElementById('p2-score-slim');
  if (prev && prev.player1.score !== s.player1.score) {
    s1Slim.classList.remove('updated'); void s1Slim.offsetWidth; s1Slim.classList.add('updated');
  }
  if (prev && prev.player2.score !== s.player2.score) {
    s2Slim.classList.remove('updated'); void s2Slim.offsetWidth; s2Slim.classList.add('updated');
  }
  s1Slim.textContent = s.player1.score;
  s2Slim.textContent = s.player2.score;

  // Series dots
  const max = getFormatMax(s.format, s.customWins);
  renderDots('p1-dots', s.player1.score, max, s.player1.color);
  renderDots('p2-dots', s.player2.score, max, s.player2.color);

  currentState = JSON.parse(JSON.stringify(s));
}

socket.on('stateUpdate', update);

fetch('/api/state')
  .then(r => r.json())
  .then(s => {
    document.getElementById('scoreboard').classList.add('animate-in');
    update(s);
  });

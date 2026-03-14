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

function update(s) {
  const prev = currentState;

  document.getElementById('scoreboard').classList.toggle('hidden', !s.visible);

  document.getElementById('player1-block').style.setProperty('--p1-color', s.player1.color);
  document.getElementById('player2-block').style.setProperty('--p2-color', s.player2.color);

  renderPlayerName('p1-name', s.player1);
  renderPlayerName('p2-name', s.player2);
  document.getElementById('event-name').textContent = s.event;
  document.getElementById('event-stage').textContent = s.stage;
  document.getElementById('format-info').textContent = s.format === 'custom' ? `First to ${s.customWins}` : s.format;

  const stageSep = document.getElementById('current-stage-sep');
  const stageName = document.getElementById('current-stage-name');
  if (s.currentStage) {
    stageSep.style.display = 'inline';
    stageName.textContent = s.currentStage;
  } else {
    stageSep.style.display = 'none';
    stageName.textContent = '';
  }

  // Center logo
  const centerImg = document.getElementById('center-logo-img');
  const vsEl = document.getElementById('slim-vs');
  if (s.centerLogo) {
    centerImg.src = s.centerLogo;
    centerImg.style.display = 'block';
    vsEl.style.display = 'none';
  } else {
    centerImg.style.display = 'none';
    vsEl.style.display = 'inline';
  }

  // Scores with flash
  const s1El = document.getElementById('p1-score');
  const s2El = document.getElementById('p2-score');
  if (prev && prev.player1.score !== s.player1.score) {
    s1El.classList.remove('updated'); void s1El.offsetWidth; s1El.classList.add('updated');
  }
  if (prev && prev.player2.score !== s.player2.score) {
    s2El.classList.remove('updated'); void s2El.offsetWidth; s2El.classList.add('updated');
  }
  s1El.textContent = s.player1.score;
  s2El.textContent = s.player2.score;

  currentState = JSON.parse(JSON.stringify(s));
}

socket.on('stateUpdate', update);

fetch('/api/state')
  .then(r => r.json())
  .then(s => {
    document.getElementById('scoreboard').classList.add('animate-in');
    update(s);
  });

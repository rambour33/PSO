/* ── YouTube Alerts Overlay ─────────────────────────────────────── */

let alertsState = {
  duration: 7000,
  position: 'bottom-right',
};

let alertQueue = [];
let showing = false;

const container = document.getElementById('alerts-container');

// ── SuperChat tier → couleur ──────────────────────────────────────

const SUPERCHAT_COLORS = {
  1: '#1565C0', // bleu (petit don)
  2: '#00B8D4', // cyan
  3: '#00BFA5', // teal
  4: '#FFD600', // jaune
  5: '#E65100', // orange
  6: '#E91E63', // rose
  7: '#C62828', // rouge (gros don)
};

function superChatColor(tier) {
  return SUPERCHAT_COLORS[tier] || SUPERCHAT_COLORS[1];
}

// ── Position ──────────────────────────────────────────────────────

function applyPosition(pos) {
  container.className = 'pos-' + (pos || 'bottom-right');
}

// ── Queue et affichage ────────────────────────────────────────────

function showNextAlert() {
  if (showing || alertQueue.length === 0) return;
  showing = true;
  const data = alertQueue.shift();
  const card = buildCard(data);
  container.appendChild(card);

  const bar = card.querySelector('.alert-progress-bar');
  if (bar) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.transition = `transform ${alertsState.duration}ms linear`;
        bar.style.transform = 'scaleX(0)';
      });
    });
  }

  requestAnimationFrame(() => card.classList.add('slide-in'));

  setTimeout(() => {
    card.classList.remove('slide-in');
    card.classList.add('slide-out');
    card.addEventListener('animationend', () => {
      card.remove();
      showing = false;
      showNextAlert();
    }, { once: true });
  }, alertsState.duration);
}

function enqueueAlert(data) {
  alertQueue.push(data);
  showNextAlert();
}

// ── Construction de la card ───────────────────────────────────────

function buildCard(data) {
  const card = document.createElement('div');
  card.className = 'alert-card';
  card.style.setProperty('--alert-color', data.color);
  card.style.borderColor = data.color + '66';

  const body = document.createElement('div');
  body.className = 'alert-body';

  // Icône
  const iconEl = document.createElement('div');
  iconEl.className = 'alert-icon';
  iconEl.style.background = data.color;
  iconEl.style.boxShadow = `0 0 20px ${data.color}`;
  iconEl.textContent = data.icon;
  body.appendChild(iconEl);

  // Texte
  const textEl = document.createElement('div');
  textEl.className = 'alert-text';

  const typeEl = document.createElement('div');
  typeEl.className = 'alert-type';
  typeEl.textContent = data.label;
  textEl.appendChild(typeEl);

  const nameEl = document.createElement('div');
  nameEl.className = 'alert-username';
  nameEl.textContent = data.username;
  textEl.appendChild(nameEl);

  if (data.detail) {
    const detailEl = document.createElement('div');
    detailEl.className = 'alert-detail';
    detailEl.textContent = data.detail;
    textEl.appendChild(detailEl);
  }

  if (data.message) {
    const msgEl = document.createElement('div');
    msgEl.className = 'alert-message';
    msgEl.textContent = data.message;
    textEl.appendChild(msgEl);
  }

  body.appendChild(textEl);

  // Montant (SuperChat)
  if (data.amount) {
    const amountEl = document.createElement('div');
    amountEl.className = 'alert-amount';
    amountEl.textContent = data.amount;
    body.appendChild(amountEl);
  }

  card.appendChild(body);

  // Barre de progression
  const pw = document.createElement('div');
  pw.className = 'alert-progress';
  const pb = document.createElement('div');
  pb.className = 'alert-progress-bar';
  pb.style.background = data.color;
  pb.style.boxShadow = `0 0 8px ${data.color}`;
  pw.appendChild(pb);
  card.appendChild(pw);

  return card;
}

// ── Événements Socket ─────────────────────────────────────────────

const socket = io();

// SuperChat
socket.on('youtubeAlertSuperChat', (data) => {
  const color = superChatColor(data.tier || 1);
  enqueueAlert({
    icon:     '💛',
    label:    'Super Chat',
    username: data.displayName || '?',
    detail:   null,
    message:  data.message || '',
    color,
    amount:   data.amount || '',
  });
});

// Nouveau membre
socket.on('youtubeAlertMember', (data) => {
  enqueueAlert({
    icon:     '⭐',
    label:    'Nouveau Membre',
    username: data.displayName || '?',
    detail:   null,
    message:  data.message || '',
    color:    '#4CAF50',
  });
});

// Anniversaire de membership
socket.on('youtubeAlertMilestone', (data) => {
  enqueueAlert({
    icon:     '🏅',
    label:    'Anniversaire Membre',
    username: data.displayName || '?',
    detail:   data.months ? `${data.months} mois de membership` : null,
    message:  data.message || '',
    color:    '#FFD600',
  });
});

// SuperSticker
socket.on('youtubeAlertSuperSticker', (data) => {
  const color = superChatColor(data.tier || 1);
  enqueueAlert({
    icon:     '🎉',
    label:    'Super Sticker',
    username: data.displayName || '?',
    detail:   null,
    message:  '',
    color,
    amount:   data.amount || '',
  });
});

// Init position
fetch('/api/youtube-alerts')
  .then(r => r.json())
  .then(s => { alertsState = { ...alertsState, ...s }; applyPosition(alertsState.position); })
  .catch(() => applyPosition('bottom-right'));

socket.on('youtubeAlertsUpdate', (s) => {
  alertsState = { ...alertsState, ...s };
  applyPosition(alertsState.position);
});

const socket = io();

let alertsState = {
  subsEnabled: true,
  bitsEnabled: true,
  bitsMinAmount: 1,
  duration: 6000,
  position: 'bottom-right',
};

let alertQueue = [];
let showing = false;

const container = document.getElementById('alerts-container');

// ── Position ──────────────────────────────────────────────────────────────────

function applyPosition(pos) {
  container.className = 'pos-' + (pos || 'bottom-right');
}

// ── Alert display ─────────────────────────────────────────────────────────────

function showNextAlert() {
  if (showing || alertQueue.length === 0) return;
  showing = true;
  const data = alertQueue.shift();
  const card = buildCard(data);
  container.appendChild(card);

  // Animate progress bar
  const bar = card.querySelector('.alert-progress-bar');
  if (bar) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.transition = `transform ${alertsState.duration}ms linear`;
        bar.style.transform = 'scaleX(0)';
      });
    });
  }

  // Slide in
  requestAnimationFrame(() => {
    card.classList.add('slide-in');
  });

  // Slide out after duration
  const timer = setTimeout(() => {
    card.classList.remove('slide-in');
    card.classList.add('slide-out');
    card.addEventListener('animationend', () => {
      card.remove();
      showing = false;
      showNextAlert();
    }, { once: true });
  }, alertsState.duration);

  card._timer = timer;
}

function enqueueAlert(data) {
  alertQueue.push(data);
  showNextAlert();
}

// ── Card builder ──────────────────────────────────────────────────────────────

function buildCard(data) {
  const card = document.createElement('div');
  card.className = 'alert-card';

  const color = data.color || (data.type === 'bits' ? '#f59e0b' : '#9147ff');
  card.style.setProperty('--alert-color', color);
  if (data.type === 'bits') {
    card.style.borderColor = 'rgba(245, 158, 11, 0.5)';
  }

  const body = document.createElement('div');
  body.className = 'alert-body';

  // Icon
  const iconEl = document.createElement('div');
  iconEl.className = 'alert-icon';
  iconEl.style.background = color;
  iconEl.style.boxShadow = `0 0 16px ${color}`;
  iconEl.textContent = data.icon;
  body.appendChild(iconEl);

  // Text
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

  // Amount badge (for bits)
  if (data.amount) {
    const amountEl = document.createElement('div');
    amountEl.className = 'alert-amount';
    amountEl.style.color = color;
    amountEl.style.textShadow = `0 0 12px ${color}`;
    amountEl.textContent = data.amount.toLocaleString('fr-FR');
    body.appendChild(amountEl);
  }

  card.appendChild(body);

  // Progress bar
  const progressWrap = document.createElement('div');
  progressWrap.className = 'alert-progress';
  const progressBar = document.createElement('div');
  progressBar.className = 'alert-progress-bar';
  progressBar.style.background = color;
  progressBar.style.boxShadow = `0 0 8px ${color}`;
  progressWrap.appendChild(progressBar);
  card.appendChild(progressWrap);

  return card;
}

// ── Tier label helper ─────────────────────────────────────────────────────────

function tierLabel(tier) {
  if (tier === '2000') return 'Tier 2';
  if (tier === '3000') return 'Tier 3';
  if (tier === 'Prime') return 'Twitch Prime';
  return 'Tier 1';
}

// ── Socket events ─────────────────────────────────────────────────────────────

socket.on('twitchSubAlert', (data) => {
  if (!alertsState.subsEnabled) return;
  let label, detail, icon, username;

  if (data.type === 'subgift') {
    label    = 'Abonnement offert';
    icon     = '🎁';
    username = data.username;
    detail   = `offre un abo à ${data.recipient} · ${tierLabel(data.tier)}`;
  } else if (data.type === 'resub') {
    label    = 'Réabonnement';
    icon     = '⭐';
    username = data.username;
    detail   = `${data.months} mois · ${tierLabel(data.tier)}`;
  } else {
    label    = 'Nouvel abonné';
    icon     = '⭐';
    username = data.username;
    detail   = tierLabel(data.tier);
  }

  enqueueAlert({
    type:    'sub',
    icon,
    label,
    username,
    detail,
    message: data.message || '',
    color:   '#9147ff',
  });
});

socket.on('twitchBitsAlert', (data) => {
  if (!alertsState.bitsEnabled) return;
  if (data.amount < (alertsState.bitsMinAmount || 1)) return;

  enqueueAlert({
    type:     'bits',
    icon:     '💎',
    label:    'Bits',
    username: data.username,
    detail:   null,
    message:  data.message || '',
    color:    '#f59e0b',
    amount:   data.amount,
  });
});

socket.on('twitchAlertsUpdate', (state) => {
  alertsState = { ...alertsState, ...state };
  applyPosition(alertsState.position);
});

// ── Init ──────────────────────────────────────────────────────────────────────

fetch('/api/twitch-alerts')
  .then(r => r.json())
  .then(s => {
    alertsState = { ...alertsState, ...s };
    applyPosition(alertsState.position);
  })
  .catch(() => {
    applyPosition('bottom-right');
  });

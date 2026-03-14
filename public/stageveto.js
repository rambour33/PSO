const socket = io();
let vetoState = null;
let matchState = null;

// ── Render header ─────────────────────────────────────────────

function renderHeader(v) {
  document.getElementById('vh-p1-name').textContent = v.player1Name;
  document.getElementById('vh-p2-name').textContent = v.player2Name;

  document.getElementById('vh-p1').style.borderLeft = `3px solid ${v.player1Color}`;
  document.getElementById('vh-p2').style.borderRight = `3px solid ${v.player2Color}`;

  const actionEl = document.getElementById('step-action');
  const playerEl = document.getElementById('step-player');

  if (v.done || v.stages.length === 0) {
    actionEl.textContent = v.done ? 'FIN' : 'ATTENTE';
    actionEl.className = 'step-action done';
    playerEl.textContent = v.done ? 'Stage sélectionné' : 'Aucun stage configuré';
    playerEl.style.color = '';
    return;
  }

  const step = v.sequence[v.currentStep];
  if (!step) return;

  if (step.action === 'decider') {
    actionEl.textContent = 'AUTO';
    actionEl.className = 'step-action done';
    playerEl.textContent = 'Décider automatique';
    playerEl.style.color = '';
  } else {
    actionEl.textContent = 'BAN';
    actionEl.className = 'step-action ban';
    const pName = step.player === 1 ? v.player1Name : v.player2Name;
    const pColor = step.player === 1 ? v.player1Color : v.player2Color;
    playerEl.textContent = pName;
    playerEl.style.color = pColor;
  }
}

// ── Render stages ─────────────────────────────────────────────

function renderStages(v) {
  const grid = document.getElementById('stages-grid');
  grid.innerHTML = '';

  if (!v.stages || v.stages.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-family:"Russo One",sans-serif;font-size:14px;color:var(--smash-muted);letter-spacing:2px;padding:16px;text-transform:uppercase;';
    empty.textContent = 'Aucun stage dans le ruleset';
    grid.appendChild(empty);
    return;
  }

  const step = v.sequence[v.currentStep];
  const isClickable = false; // OBS overlay is read-only

  v.stages.forEach(stage => {
    const card = document.createElement('div');
    card.className = `stage-card ${stage.status}`;

    // Background
    const bg = document.createElement('div');
    bg.className = 'stage-card-bg';
    if (stage.image) {
      bg.style.backgroundImage = `url('${stage.image}')`;
    } else {
      const colors = { starter: '#1a3a2a', counterpick: '#1a2a3a' };
      bg.style.background = colors[stage.type] || '#1E1E2A';
    }

    // Gradient overlay
    const ov = document.createElement('div');
    ov.className = 'stage-card-ov';

    // Type badge
    const typeBadge = document.createElement('div');
    typeBadge.className = `stage-card-type ${stage.type}`;
    typeBadge.textContent = stage.type === 'starter' ? 'STARTER' : 'CP';

    // Status badge
    const banBadge = document.createElement('div');
    banBadge.className = 'stage-card-badge';
    if (stage.status === 'banned_p1') {
      banBadge.textContent = 'BANNI';
    } else if (stage.status === 'banned_p2') {
      banBadge.textContent = 'BANNI';
    } else if (stage.status === 'selected') {
      banBadge.textContent = 'SÉLECTIONNÉ';
    }

    // Team attribution
    const teamEl = document.createElement('div');
    teamEl.className = 'stage-card-team';
    if (stage.status === 'banned_p1') {
      teamEl.textContent = v.player1Name;
      teamEl.style.color = v.player1Color;
    } else if (stage.status === 'banned_p2') {
      teamEl.textContent = v.player2Name;
      teamEl.style.color = v.player2Color;
    }

    // Name
    const nameEl = document.createElement('div');
    nameEl.className = 'stage-card-name';
    nameEl.textContent = stage.name;

    card.appendChild(bg);
    card.appendChild(ov);
    card.appendChild(typeBadge);
    card.appendChild(banBadge);
    card.appendChild(teamEl);
    card.appendChild(nameEl);

    grid.appendChild(card);
  });
}

// ── Render sequence bar ───────────────────────────────────────

function renderSequence(v) {
  const bar = document.getElementById('sequence-bar');
  bar.innerHTML = '';

  if (!v.sequence || v.sequence.length === 0) return;

  v.sequence.forEach((step, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'seq-sep';
      sep.textContent = '›';
      bar.appendChild(sep);
    }

    const el = document.createElement('div');
    const isDone = step.mapId !== null;
    const isCurrent = !v.done && i === v.currentStep;

    let cls = 'seq-step';
    if (isCurrent) {
      cls += ' current';
    } else if (isDone) {
      cls += step.action === 'decider' ? ' done-select' : ' done-ban';
    }
    el.className = cls;

    const pName = step.action === 'decider'
      ? 'AUTO'
      : (step.player === 1 ? v.player1Name : v.player2Name);

    let label = `${step.action === 'decider' ? 'SELECT' : 'BAN'} · ${pName}`;

    if (isDone && step.mapId) {
      const stg = v.stages.find(st => st.id === step.mapId);
      if (stg) label += ` (${stg.name})`;
    }

    el.textContent = label;
    bar.appendChild(el);
  });
}

// ── Main render ───────────────────────────────────────────────

function renderVeto(v) {
  vetoState = v;

  const root = document.getElementById('veto-root');
  root.classList.toggle('hidden', !v.visible);

  renderHeader(v);
  renderStages(v);
  renderSequence(v);
}

// ── Socket events ─────────────────────────────────────────────

socket.on('vetoUpdate', renderVeto);

socket.on('stateUpdate', (s) => {
  matchState = s;
  // If we already have vetoState, sync player info
  if (vetoState) {
    const synced = {
      ...vetoState,
      player1Name: s.player1.name,
      player2Name: s.player2.name,
      player1Color: s.player1.color,
      player2Color: s.player2.color,
    };
    renderVeto(synced);
  }
});

// ── Init ──────────────────────────────────────────────────────

fetch('/api/veto').then(r => r.json()).then(v => renderVeto(v));

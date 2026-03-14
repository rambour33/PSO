const socket = io();

let state = {
  player1: { name: 'PLAYER 1', score: 0, character: null, color: '#E83030' },
  player2: { name: 'PLAYER 2', score: 0, character: null, color: '#3070E8' },
  format: 'Bo3',
  customWins: 2,
  event: 'TOURNAMENT',
  stage: 'Grand Final',
  currentStage: '',
  visible: true,
};
let vetoState = null;
let characterList = [];
let rulesetState = { stages: [], bansPerPlayer: 2 };
let activePickPlayer = null; // 1 or 2

// ── Status messages ───────────────────────────────────────────

let statusTimer = null;
function setStatus(msg, type = 'success') {
  const el = document.getElementById('status-msg');
  el.textContent = msg;
  el.className = 'status-msg' + (type === 'error' ? ' error' : '');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    el.classList.add('fade');
    setTimeout(() => { el.textContent = 'Prêt'; el.className = 'status-msg'; }, 500);
  }, 3000);
}

// ── Scoreboard ────────────────────────────────────────────────

function updateStockColorBtns(player, charName) {
  document.querySelectorAll(`#p${player}-stock-colors .stock-color-btn`).forEach(btn => {
    const color = String(btn.dataset.color).padStart(2, '0');
    btn.innerHTML = '';
    if (charName) {
      const img = document.createElement('img');
      img.src = `/Stock Icons/chara_2_${charName}_${color}.png`;
      img.alt = parseInt(btn.dataset.color) + 1;
      img.onerror = () => { btn.textContent = parseInt(btn.dataset.color) + 1; };
      btn.appendChild(img);
    } else {
      btn.textContent = parseInt(btn.dataset.color) + 1;
    }
  });
}

function syncFromState(s) {
  state = s;

  document.getElementById('p1-tag').value      = s.player1.tag      || '';
  document.getElementById('p1-name').value     = s.player1.name;
  document.getElementById('p1-pronouns').value = s.player1.pronouns || '';
  document.getElementById('p2-tag').value      = s.player2.tag      || '';
  document.getElementById('p2-name').value     = s.player2.name;
  document.getElementById('p2-pronouns').value = s.player2.pronouns || '';
  document.getElementById('p1-color').value    = s.player1.color;
  document.getElementById('p2-color').value    = s.player2.color;
  document.getElementById('p1-score-display').textContent = s.player1.score;
  document.getElementById('p2-score-display').textContent = s.player2.score;
  document.getElementById('event-name').value = s.event;
  document.getElementById('event-stage').value = s.stage;
  document.getElementById('current-stage').value = s.currentStage || '';
  document.getElementById('center-logo').value = s.centerLogo || '';
  updateLogoPreview();

  // Format buttons
  document.querySelectorAll('.format-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.fmt === s.format);
  });
  document.getElementById('custom-wins-group').style.display = s.format === 'custom' ? '' : 'none';
  document.getElementById('custom-wins').value = s.customWins;

  // Character previews
  updateCharPreview(1, s.player1.character);
  updateCharPreview(2, s.player2.character);

  // Stock color buttons
  [1, 2].forEach(p => {
    const color = s[`player${p}`].stockColor ?? 0;
    const charName = s[`player${p}`].character?.name || null;
    updateStockColorBtns(p, charName);
    document.querySelectorAll(`#p${p}-stock-colors .stock-color-btn`).forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.color) === color);
    });
  });

  // Overlay style buttons
  document.querySelectorAll('.overlay-style-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.style === (s.overlayStyle || 'full'));
  });

  // Textes joueurs
  const tagEl = document.getElementById('tag-color');
  const nameEl = document.getElementById('name-color');
  const pronounsEl = document.getElementById('pronouns-color');
  if (tagEl) tagEl.value = s.tagColor || '#E8B830';
  if (nameEl) nameEl.value = s.nameColor || '#F0EEF8';
  if (pronounsEl) pronounsEl.value = s.pronounsColor || '#5A5A7A';

  // Event bar
  const etSizeEl = document.getElementById('event-text-size');
  const etColorEl = document.getElementById('event-text-color');
  if (etSizeEl) etSizeEl.value = s.eventTextSize ?? 12;
  if (etColorEl) etColorEl.value = s.eventTextColor || '#5A5A7A';

  // Scoreboard background
  const sbColorEl = document.getElementById('sb-bg-color');
  const sbOpacityEl = document.getElementById('sb-bg-opacity');
  if (sbColorEl) sbColorEl.value = s.sbBgColor || '#0E0E12';
  if (sbOpacityEl) sbOpacityEl.value = s.sbBgOpacity ?? 100;

  // Swap button
  document.getElementById('btn-swap').classList.toggle('active', !!s.swapped);

  // Visibility button
  const btn = document.getElementById('btn-visibility');
  btn.textContent = s.visible ? 'Masquer' : 'Afficher';
  btn.style.background = s.visible ? '' : '#333345';
  btn.style.borderColor = s.visible ? '' : '#444460';
  document.getElementById('overlay-status').textContent = s.visible ? 'Visible' : 'Masqué';
}

function updateCharPreview(player, char) {
  const imgEl = document.getElementById(`p${player}-preview-img`);
  const nameEl = document.getElementById(`p${player}-char-name`);
  if (char) {
    nameEl.textContent = char.name;
    if (char.image) {
      imgEl.innerHTML = `<img src="${char.image}" style="width:48px;height:48px;object-fit:cover;border-radius:3px" />`;
    } else {
      imgEl.textContent = char.name.charAt(0).toUpperCase();
    }
  } else {
    nameEl.textContent = 'Aucun personnage';
    imgEl.textContent = '?';
  }
}

function buildStateFromForm() {
  return {
    ...state,
    player1: {
      ...state.player1,
      tag:        document.getElementById('p1-tag').value.trim(),
      name:       document.getElementById('p1-name').value.trim() || 'PLAYER 1',
      pronouns:   document.getElementById('p1-pronouns').value.trim(),
      color:      document.getElementById('p1-color').value,
      stockColor: state.player1.stockColor ?? 0,
    },
    player2: {
      ...state.player2,
      tag:        document.getElementById('p2-tag').value.trim(),
      name:       document.getElementById('p2-name').value.trim() || 'PLAYER 2',
      pronouns:   document.getElementById('p2-pronouns').value.trim(),
      color:      document.getElementById('p2-color').value,
      stockColor: state.player2.stockColor ?? 0,
    },
    event: document.getElementById('event-name').value.trim() || 'TOURNAMENT',
    stage: document.getElementById('event-stage').value.trim() || '',
    currentStage: document.getElementById('current-stage').value.trim(),
    centerLogo: document.getElementById('center-logo').value.trim(),
    swapped: state.swapped ?? false,
    overlayStyle: state.overlayStyle || 'full',
    tagColor: document.getElementById('tag-color')?.value || '#E8B830',
    nameColor: document.getElementById('name-color')?.value || '#F0EEF8',
    pronounsColor: document.getElementById('pronouns-color')?.value || '#5A5A7A',
    eventTextSize: parseInt(document.getElementById('event-text-size')?.value ?? 12),
    eventTextColor: document.getElementById('event-text-color')?.value || '#5A5A7A',
    sbBgColor: document.getElementById('sb-bg-color')?.value || '#0E0E12',
    sbBgOpacity: parseInt(document.getElementById('sb-bg-opacity')?.value ?? 100),
    format: state.format,
    customWins: parseInt(document.getElementById('custom-wins').value) || 2,
  };
}

function emitState(newState) {
  state = newState;
  socket.emit('updateState', newState);
  // Sync veto player names & colors
  if (vetoState) {
    const updatedVeto = {
      ...vetoState,
      player1Name: newState.player1.name,
      player2Name: newState.player2.name,
      player1Color: newState.player1.color,
      player2Color: newState.player2.color,
    };
    vetoState = updatedVeto;
    socket.emit('updateVeto', updatedVeto);
  }
}

// Score buttons
document.querySelectorAll('.btn-score').forEach(btn => {
  btn.addEventListener('click', () => {
    const p = btn.dataset.player;
    const key = `player${p}`;
    const delta = btn.classList.contains('plus') ? 1 : -1;
    const newScore = Math.max(0, state[key].score + delta);
    state[key] = { ...state[key], score: newScore };
    document.getElementById(`p${p}-score-display`).textContent = newScore;
    emitState(buildStateFromForm());
    setStatus(`Score J${p} : ${newScore}`);
  });
});

// Format buttons
document.querySelectorAll('.format-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.format = btn.dataset.fmt;
    document.querySelectorAll('.format-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.fmt === state.format);
    });
    document.getElementById('custom-wins-group').style.display = state.format === 'custom' ? '' : 'none';
  });
});


document.getElementById('btn-apply').addEventListener('click', () => {
  emitState(buildStateFromForm());
  setStatus('Appliqué !');
});

document.getElementById('btn-reset-score').addEventListener('click', () => {
  state.player1 = { ...state.player1, score: 0 };
  state.player2 = { ...state.player2, score: 0 };
  document.getElementById('p1-score-display').textContent = 0;
  document.getElementById('p2-score-display').textContent = 0;
  const ns = buildStateFromForm();
  ns.player1.score = 0;
  ns.player2.score = 0;
  emitState(ns);
  setStatus('Scores réinitialisés');
});

document.getElementById('tag-color').addEventListener('input', (e) => {
  state.tagColor = e.target.value;
  emitState(buildStateFromForm());
});

document.getElementById('name-color').addEventListener('input', (e) => {
  state.nameColor = e.target.value;
  emitState(buildStateFromForm());
});

document.getElementById('pronouns-color').addEventListener('input', (e) => {
  state.pronounsColor = e.target.value;
  emitState(buildStateFromForm());
});

document.getElementById('event-text-size').addEventListener('input', (e) => {
  state.eventTextSize = parseInt(e.target.value) || 12;
  emitState(buildStateFromForm());
});

document.getElementById('event-text-color').addEventListener('input', (e) => {
  state.eventTextColor = e.target.value;
  emitState(buildStateFromForm());
});

document.getElementById('sb-bg-color').addEventListener('input', (e) => {
  state.sbBgColor = e.target.value;
  emitState(buildStateFromForm());
});

document.getElementById('sb-bg-opacity').addEventListener('input', (e) => {
  state.sbBgOpacity = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
  emitState(buildStateFromForm());
});

document.querySelectorAll('.overlay-style-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.overlayStyle = btn.dataset.style;
    document.querySelectorAll('.overlay-style-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.style === state.overlayStyle);
    });
    emitState(buildStateFromForm());
    setStatus(`Style : ${state.overlayStyle}`);
  });
});

document.getElementById('btn-swap').addEventListener('click', () => {
  const ns = buildStateFromForm();
  ns.swapped = !state.swapped;
  emitState(ns);
  document.getElementById('btn-swap').classList.toggle('active', ns.swapped);
  setStatus(`Joueurs ${ns.swapped ? 'inversés' : 'normal'}`);
});

document.getElementById('btn-visibility').addEventListener('click', () => {
  const ns = buildStateFromForm();
  ns.visible = !state.visible;
  emitState(ns);
  const btn = document.getElementById('btn-visibility');
  btn.textContent = ns.visible ? 'Masquer' : 'Afficher';
  btn.style.background = ns.visible ? '' : '#333345';
  btn.style.borderColor = ns.visible ? '' : '#444460';
  document.getElementById('overlay-status').textContent = ns.visible ? 'Visible' : 'Masqué';
  setStatus(`Overlay ${ns.visible ? 'affiché' : 'masqué'}`);
});

// Copy buttons
document.getElementById('btn-copy-overlay').addEventListener('click', () => {
  navigator.clipboard.writeText('http://localhost:3002/overlay').then(() => {
    const b = document.getElementById('btn-copy-overlay');
    b.textContent = '✓';
    setTimeout(() => { b.textContent = '📋'; }, 1500);
    setStatus('URL scoreboard copiée');
  });
});

document.getElementById('btn-copy-veto').addEventListener('click', () => {
  navigator.clipboard.writeText('http://localhost:3002/stageveto').then(() => {
    const b = document.getElementById('btn-copy-veto');
    b.textContent = '✓';
    setTimeout(() => { b.textContent = '📋'; }, 1500);
    setStatus('URL veto copiée');
  });
});

// ── Character picker ──────────────────────────────────────────

function openCharPicker(player) {
  activePickPlayer = player;
  document.getElementById('char-modal-title').textContent = `Choisir un personnage — Joueur ${player}`;
  document.getElementById('char-modal').style.display = 'flex';
  document.getElementById('char-search').value = '';
  renderCharGrid('');
  setTimeout(() => document.getElementById('char-search').focus(), 100);
}

function closeCharPicker() {
  document.getElementById('char-modal').style.display = 'none';
  activePickPlayer = null;
}

function renderCharGrid(filter) {
  const grid = document.getElementById('char-grid');
  grid.innerHTML = '';
  const lf = filter.toLowerCase();
  const filtered = characterList.filter(c => c.name.toLowerCase().includes(lf));

  filtered.forEach(char => {
    const card = document.createElement('div');
    card.className = 'char-card';

    const currentChar = activePickPlayer === 1 ? state.player1.character : state.player2.character;
    if (currentChar && currentChar.id === char.id) {
      card.classList.add('selected');
    }

    if (char.image) {
      const img = document.createElement('img');
      img.className = 'char-card-img';
      img.src = char.image;
      img.alt = char.name;
      card.appendChild(img);
    } else {
      card.style.display = 'flex';
      card.style.alignItems = 'center';
      card.style.justifyContent = 'center';
      card.style.flexDirection = 'column';
      card.style.gap = '2px';
      const initial = document.createElement('div');
      initial.style.cssText = 'font-size:22px;color:var(--gold);font-family:"Russo One",sans-serif;line-height:1;';
      initial.textContent = char.name.charAt(0).toUpperCase();
      card.appendChild(initial);
    }

    const nameEl = document.createElement('div');
    nameEl.className = 'char-card-name';
    nameEl.textContent = char.name;
    card.appendChild(nameEl);

    card.addEventListener('click', () => {
      if (!activePickPlayer) return;
      const charData = { id: char.id, name: char.name, image: char.image };
      const ns = buildStateFromForm();
      if (activePickPlayer === 1) {
        ns.player1.character = charData;
        state.player1.character = charData;
      } else {
        ns.player2.character = charData;
        state.player2.character = charData;
      }
      emitState(ns);
      updateCharPreview(activePickPlayer, charData);
      updateStockColorBtns(activePickPlayer, char.name);
      closeCharPicker();
      setStatus(`Personnage J${activePickPlayer} : ${char.name}`);
    });

    grid.appendChild(card);
  });

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--text-muted);font-size:13px;padding:20px;width:100%;text-align:center;';
    empty.textContent = 'Aucun personnage trouvé';
    grid.appendChild(empty);
  }
}

document.getElementById('p1-pick-btn').addEventListener('click', () => openCharPicker(1));
document.getElementById('p2-pick-btn').addEventListener('click', () => openCharPicker(2));

// Stock color variant buttons
document.querySelectorAll('.stock-color-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const p = btn.dataset.player;
    const color = parseInt(btn.dataset.color);
    state[`player${p}`].stockColor = color;
    document.querySelectorAll(`#p${p}-stock-colors .stock-color-btn`).forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.color) === color);
    });
    emitState(buildStateFromForm());
    setStatus(`Stock icon J${p} : couleur ${color + 1}`);
  });
});

document.getElementById('char-modal-close').addEventListener('click', closeCharPicker);
document.getElementById('char-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('char-modal')) closeCharPicker();
});
document.getElementById('char-search').addEventListener('input', (e) => renderCharGrid(e.target.value));

// ── Veto ──────────────────────────────────────────────────────

function renderVetoStep(s) {
  const actionEl = document.getElementById('veto-action-badge');
  const textEl = document.getElementById('veto-step-text');

  if (!s || s.stages.length === 0) {
    actionEl.textContent = 'ATTENTE';
    actionEl.className = 'csb-action done';
    textEl.textContent = 'Configurez le ruleset et sauvegardez pour commencer';
    textEl.style.color = '';
    return;
  }

  if (s.done) {
    actionEl.textContent = 'FIN';
    actionEl.className = 'csb-action done';
    const selected = s.stages.find(st => st.status === 'selected');
    textEl.textContent = selected ? `Stage sélectionné : ${selected.name}` : 'Stage sélectionné automatiquement';
    textEl.style.color = '';
    return;
  }

  const step = s.sequence[s.currentStep];
  if (!step) return;

  if (step.action === 'decider') {
    actionEl.textContent = 'AUTO';
    actionEl.className = 'csb-action done';
    textEl.textContent = 'Stage décider calculé automatiquement';
    textEl.style.color = '';
  } else {
    actionEl.textContent = 'BAN';
    actionEl.className = 'csb-action ban';
    const pName = step.player === 1 ? s.player1Name : s.player2Name;
    const pColor = step.player === 1 ? s.player1Color : s.player2Color;
    textEl.textContent = `${pName} doit bannir un stage`;
    textEl.style.color = pColor;
  }
}

function renderVetoStages(s) {
  const grid = document.getElementById('veto-stages-grid');
  grid.innerHTML = '';

  if (!s || s.stages.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--text-muted);font-size:12px;padding:12px;font-family:"Russo One",sans-serif;letter-spacing:1px;text-transform:uppercase;';
    empty.textContent = 'Aucun stage — ajoutez-en dans le ruleset';
    grid.appendChild(empty);
    return;
  }

  const step = s.sequence ? s.sequence[s.currentStep] : null;
  const isClickable = !s.done && step && step.action !== 'decider';

  s.stages.forEach(stage => {
    const card = document.createElement('div');
    card.className = `stage-card ${stage.status}`;

    // Background
    const bg = document.createElement('div');
    bg.className = 'stage-card-bg';
    if (stage.image) {
      bg.style.backgroundImage = `url('${stage.image}')`;
    } else {
      bg.style.background = stage.type === 'starter' ? '#1a3a2a' : '#1a2a3a';
    }

    const ov = document.createElement('div');
    ov.className = 'stage-card-ov';

    const typeBadge = document.createElement('div');
    typeBadge.className = 'stage-card-type-badge';
    typeBadge.textContent = stage.type === 'starter' ? 'S' : 'CP';

    const banBadge = document.createElement('div');
    banBadge.className = 'stage-card-ban-badge';
    if (stage.status === 'banned_p1' || stage.status === 'banned_p2') {
      banBadge.textContent = 'BANNI';
    } else if (stage.status === 'selected') {
      banBadge.textContent = 'OK';
    }

    const teamEl = document.createElement('div');
    teamEl.className = 'stage-card-team';
    if (stage.status === 'banned_p1') {
      teamEl.textContent = s.player1Name;
      teamEl.style.color = s.player1Color;
    } else if (stage.status === 'banned_p2') {
      teamEl.textContent = s.player2Name;
      teamEl.style.color = s.player2Color;
    }

    const nameEl = document.createElement('div');
    nameEl.className = 'stage-card-name';
    nameEl.textContent = stage.name;

    card.appendChild(bg);
    card.appendChild(ov);
    card.appendChild(typeBadge);
    card.appendChild(banBadge);
    card.appendChild(teamEl);
    card.appendChild(nameEl);

    if (isClickable && stage.status === 'available') {
      card.addEventListener('click', () => {
        socket.emit('vetoAction', { stageId: stage.id });
        setStatus(`Ban : ${stage.name}`);
      });
    }

    grid.appendChild(card);
  });
}

function renderVetoSequence(s) {
  const track = document.getElementById('veto-seq-track');
  track.innerHTML = '';

  if (!s || !s.sequence || s.sequence.length === 0) return;

  s.sequence.forEach((step, i) => {
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'seq-sep';
      sep.textContent = '›';
      track.appendChild(sep);
    }

    const el = document.createElement('div');
    const isDone = step.mapId !== null;
    const isCurrent = !s.done && i === s.currentStep;

    let cls = 'seq-item';
    if (isCurrent) {
      cls += ' current';
    } else if (isDone) {
      cls += step.action === 'decider' ? ' done-select' : ' done-ban';
    }
    el.className = cls;

    // Dot
    const dot = document.createElement('span');
    dot.className = 'dot';
    el.appendChild(dot);

    const pName = step.action === 'decider'
      ? 'Auto'
      : (step.player === 1 ? s.player1Name : s.player2Name);

    const txt = document.createElement('span');
    txt.textContent = `${step.action === 'decider' ? 'SELECT' : 'BAN'} · ${pName}`;
    el.appendChild(txt);

    if (isDone && step.mapId) {
      const stg = s.stages.find(st => st.id === step.mapId);
      if (stg) {
        const mn = document.createElement('span');
        mn.style.opacity = '0.6';
        mn.textContent = ` (${stg.name})`;
        el.appendChild(mn);
      }
    }

    track.appendChild(el);
  });
}

function renderVeto(s) {
  vetoState = s;
  renderVetoStep(s);
  renderVetoStages(s);
  renderVetoSequence(s);

  const btn = document.getElementById('veto-btn-visibility');
  btn.textContent = s.visible ? 'Masquer veto' : 'Afficher veto';
  btn.style.background = s.visible ? '' : '#333345';
  btn.style.borderColor = s.visible ? '' : '#444460';
}

document.getElementById('veto-btn-reset').addEventListener('click', () => {
  if (!confirm('Réinitialiser le veto ? Tous les bans seront effacés.')) return;
  fetch('/api/veto/reset', { method: 'POST' })
    .then(() => setStatus('Veto réinitialisé'));
});

document.getElementById('veto-btn-visibility').addEventListener('click', () => {
  if (!vetoState) return;
  const newVisible = !vetoState.visible;
  socket.emit('updateVeto', { ...vetoState, visible: newVisible });
  setStatus(`Veto ${newVisible ? 'affiché' : 'masqué'}`);
});

// ── Ruleset builder ───────────────────────────────────────────

function renderRulesetList() {
  const list = document.getElementById('ruleset-stages-list');
  list.innerHTML = '';

  if (rulesetState.stages.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--text-muted);font-size:12px;padding:8px;text-align:center;';
    empty.textContent = 'Aucun stage — utilisez le formulaire ci-dessous';
    list.appendChild(empty);
    return;
  }

  rulesetState.stages.forEach((stage, idx) => {
    const item = document.createElement('div');
    item.className = 'ruleset-stage-item';

    const dot = document.createElement('span');
    dot.style.cssText = `width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${stage.type === 'starter' ? '#4ade80' : '#3A7FE8'};`;

    const name = document.createElement('span');
    name.style.cssText = 'flex:1;font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    name.textContent = stage.name;

    const typeLabel = document.createElement('span');
    typeLabel.style.cssText = 'font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;flex-shrink:0;';
    typeLabel.textContent = stage.type === 'starter' ? 'S' : 'CP';

    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.style.cssText = 'background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;line-height:1;padding:0 4px;flex-shrink:0;';
    delBtn.title = 'Supprimer ce stage';
    delBtn.addEventListener('click', () => {
      rulesetState.stages.splice(idx, 1);
      renderRulesetList();
      setStatus(`Stage supprimé`);
    });

    item.appendChild(dot);
    item.appendChild(name);
    item.appendChild(typeLabel);
    item.appendChild(delBtn);
    list.appendChild(item);
  });

  document.getElementById('bans-per-player').value = rulesetState.bansPerPlayer;
}

document.getElementById('btn-add-stage').addEventListener('click', () => {
  const nameInput = document.getElementById('new-stage-name');
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    setStatus('Nom du stage requis', 'error');
    return;
  }
  const image = document.getElementById('new-stage-image').value.trim();
  const type = document.querySelector('input[name="stage-type"]:checked').value;
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();

  rulesetState.stages.push({ id, name, image, type });
  nameInput.value = '';
  document.getElementById('new-stage-image').value = '';
  renderRulesetList();
  setStatus(`Stage "${name}" ajouté`);
});

// Allow Enter key in stage name input
document.getElementById('new-stage-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-add-stage').click();
});

document.getElementById('btn-save-ruleset').addEventListener('click', () => {
  rulesetState.bansPerPlayer = parseInt(document.getElementById('bans-per-player').value) || 2;
  socket.emit('updateRuleset', rulesetState);
  setStatus('Ruleset appliqué — veto réinitialisé');
});

function renderSavedRulesets(list) {
  const container = document.getElementById('saved-rulesets-list');
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:8px">Aucun ruleset sauvegardé</div>';
    return;
  }
  list.forEach(({ name, ruleset }) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid var(--border)';

    const label = document.createElement('span');
    label.style.cssText = 'flex:1;font-size:12px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    label.textContent = name;

    const loadBtn = document.createElement('button');
    loadBtn.className = 'btn btn-outline btn-sm';
    loadBtn.textContent = 'Charger';
    loadBtn.addEventListener('click', () => {
      rulesetState = { ...ruleset };
      renderRulesetList();
      socket.emit('updateRuleset', rulesetState);
      setStatus(`Ruleset "${name}" chargé`);
    });

    const delBtn = document.createElement('button');
    delBtn.style.cssText = 'background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;line-height:1;padding:0 2px;flex-shrink:0';
    delBtn.textContent = '×';
    delBtn.addEventListener('click', () => {
      fetch(`/api/rulesets/saved/${encodeURIComponent(name)}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(renderSavedRulesets);
      setStatus(`Ruleset "${name}" supprimé`);
    });

    row.appendChild(label);
    row.appendChild(loadBtn);
    row.appendChild(delBtn);
    container.appendChild(row);
  });
}

document.getElementById('btn-ruleset-save').addEventListener('click', () => {
  const name = document.getElementById('ruleset-save-name').value.trim();
  if (!name) { setStatus('Nom requis', 'error'); return; }
  rulesetState.bansPerPlayer = parseInt(document.getElementById('bans-per-player').value) || 2;
  fetch('/api/rulesets/saved', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, ruleset: rulesetState }),
  }).then(r => r.json()).then(list => {
    renderSavedRulesets(list);
    document.getElementById('ruleset-save-name').value = '';
    setStatus(`Ruleset "${name}" enregistré`);
  });
});

// ── Character image manager ───────────────────────────────────

function renderCharImageGrid() {
  const grid = document.getElementById('char-image-grid');
  grid.innerHTML = '';

  characterList.forEach(char => {
    const item = document.createElement('div');
    item.className = 'char-img-item';

    // Preview
    const preview = document.createElement('div');
    preview.style.cssText = 'width:32px;height:32px;background:var(--surface);border:1px solid var(--border);border-radius:3px;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;color:var(--text-muted);font-family:"Russo One",sans-serif;';
    if (char.image) {
      const img = document.createElement('img');
      img.src = char.image;
      img.style.cssText = 'width:32px;height:32px;object-fit:cover;';
      img.onerror = () => { preview.innerHTML = ''; preview.textContent = char.name.charAt(0); };
      preview.appendChild(img);
    } else {
      preview.textContent = char.name.charAt(0).toUpperCase();
    }

    // Name label
    const label = document.createElement('span');
    label.style.cssText = 'font-size:11px;color:var(--text);flex-shrink:0;min-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    label.textContent = char.name;

    // URL input
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'URL image';
    input.value = char.image || '';
    input.dataset.charid = char.id;
    input.style.cssText = 'flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:3px;color:var(--text);font-size:12px;padding:4px 6px;outline:none;min-width:0;transition:border-color 0.15s;';

    input.addEventListener('focus', () => { input.style.borderColor = 'var(--gold)'; });
    input.addEventListener('blur', () => { input.style.borderColor = 'var(--border)'; });

    input.addEventListener('input', (e) => {
      const c = characterList.find(ch => ch.id === char.id);
      if (c) {
        c.image = e.target.value.trim();
        if (c.image) {
          preview.innerHTML = '';
          const img = document.createElement('img');
          img.src = c.image;
          img.style.cssText = 'width:32px;height:32px;object-fit:cover;';
          img.onerror = () => { preview.innerHTML = ''; preview.textContent = char.name.charAt(0); };
          preview.appendChild(img);
        } else {
          preview.innerHTML = '';
          preview.textContent = char.name.charAt(0).toUpperCase();
        }
      }
    });

    item.appendChild(preview);
    item.appendChild(label);
    item.appendChild(input);
    grid.appendChild(item);
  });
}

document.getElementById('btn-save-chars').addEventListener('click', () => {
  socket.emit('updateCharacters', characterList);
  setStatus('Images des personnages sauvegardées');
});

// ── Onglets ───────────────────────────────────────────────────

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ── Logo preview ──────────────────────────────────────────────

document.getElementById('center-logo').addEventListener('input', updateLogoPreview);

function updateLogoPreview() {
  const url = document.getElementById('center-logo').value.trim();
  const box = document.getElementById('center-logo-preview');
  if (url) {
    box.innerHTML = `<img src="${url}" onerror="this.parentElement.innerHTML='<span>Erreur</span>'" />`;
  } else {
    box.innerHTML = '<span>Aperçu</span>';
  }
}

document.getElementById('btn-apply-logo').addEventListener('click', () => {
  emitState(buildStateFromForm());
  updateLogoPreview();
  setStatus('Logo appliqué !');
});

// Boutons copie dans tab customisation
document.querySelectorAll('.obs-url-item .btn-copy[data-url]').forEach(btn => {
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(btn.dataset.url).then(() => {
      const old = btn.textContent;
      btn.textContent = '✓';
      setTimeout(() => { btn.textContent = old; }, 1500);
      setStatus('URL copiée');
    });
  });
});

// ── Casters ───────────────────────────────────────────────────

let castersState = {
  visible: false,
  layout: 'row',
  bgColor: '#0E0E12',
  bgOpacity: 100,
  casters: [
    { name: '', twitter: '', twitch: '', youtube: '' },
    { name: '', twitter: '', twitch: '', youtube: '' },
  ],
};

function syncCastersFromState(s) {
  castersState = s;

  // Layout buttons
  document.querySelectorAll('.casters-layout-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.layout === (s.layout || 'row'));
  });

  const bgEl = document.getElementById('casters-bg-color');
  if (bgEl) bgEl.value = s.bgColor || '#0E0E12';
  const opEl = document.getElementById('casters-bg-opacity');
  if (opEl) opEl.value = s.bgOpacity ?? 100;

  const fields = ['name', 'twitter', 'twitch', 'youtube'];
  [1, 2].forEach(i => {
    fields.forEach(f => {
      const el = document.getElementById(`c${i}-${f}`);
      if (el) el.value = s.casters[i - 1][f] || '';
    });
  });

  const btn = document.getElementById('btn-casters-visibility');
  btn.textContent = s.visible ? 'Masquer' : 'Afficher';
  btn.style.background = s.visible ? '#1a3a2a' : '';
  btn.style.borderColor = s.visible ? 'var(--gold)' : '';

}

function buildCastersFromForm() {
  const fields = ['name', 'twitter', 'twitch', 'youtube'];
  return {
    ...castersState,
    bgColor: document.getElementById('casters-bg-color')?.value || '#0E0E12',
    bgOpacity: parseInt(document.getElementById('casters-bg-opacity')?.value ?? 100),
    casters: [1, 2].map(i => {
      const c = {};
      fields.forEach(f => {
        c[f] = (document.getElementById(`c${i}-${f}`)?.value || '').trim();
      });
      return c;
    }),
  };
}

document.getElementById('casters-bg-color').addEventListener('input', (e) => {
  castersState.bgColor = e.target.value;
  socket.emit('updateCasters', castersState);
});

document.getElementById('casters-bg-opacity').addEventListener('input', (e) => {
  castersState.bgOpacity = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
  socket.emit('updateCasters', castersState);
});

document.querySelectorAll('.casters-layout-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    castersState.layout = btn.dataset.layout;
    document.querySelectorAll('.casters-layout-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.layout === castersState.layout);
    });
    socket.emit('updateCasters', castersState);
    setStatus(`Casters : disposition ${castersState.layout === 'row' ? 'en ligne' : 'en colonne'}`);
  });
});



document.getElementById('btn-apply-casters').addEventListener('click', () => {
  const ns = buildCastersFromForm();
  socket.emit('updateCasters', ns);
  castersState = ns;
  setStatus('Casters appliqués !');
});

document.getElementById('btn-casters-visibility').addEventListener('click', () => {
  const ns = buildCastersFromForm();
  ns.visible = !castersState.visible;
  socket.emit('updateCasters', ns);
  castersState = ns;
  const btn = document.getElementById('btn-casters-visibility');
  btn.textContent = ns.visible ? 'Masquer' : 'Afficher';
  btn.style.background = ns.visible ? '#1a3a2a' : '';
  btn.style.borderColor = ns.visible ? 'var(--gold)' : '';
  setStatus(`Casters ${ns.visible ? 'affichés' : 'masqués'}`);
});

document.getElementById('btn-copy-casters').addEventListener('click', () => {
  navigator.clipboard.writeText('http://localhost:3002/casters').then(() => {
    const b = document.getElementById('btn-copy-casters');
    b.textContent = '✓';
    setTimeout(() => { b.textContent = '📋'; }, 1500);
    setStatus('URL casters copiée');
  });
});

// ── Socket.io ─────────────────────────────────────────────────

socket.on('connect', () => {
  const el = document.getElementById('conn-status');
  el.classList.remove('disconnected');
  el.querySelector('.label').textContent = 'Connecté';
});

socket.on('disconnect', () => {
  const el = document.getElementById('conn-status');
  el.classList.add('disconnected');
  el.querySelector('.label').textContent = 'Déconnecté';
});

socket.on('stateUpdate', syncFromState);
socket.on('vetoUpdate', renderVeto);
socket.on('castersUpdate', syncCastersFromState);
socket.on('rulesetUpdate', (r) => {
  rulesetState = r;
  renderRulesetList();
});
socket.on('characterUpdate', (chars) => {
  characterList = chars;
  renderCharImageGrid();
});

// ── Init ──────────────────────────────────────────────────────

Promise.all([
  fetch('/api/state').then(r => r.json()),
  fetch('/api/veto').then(r => r.json()),
  fetch('/api/ruleset').then(r => r.json()),
  fetch('/api/characters').then(r => r.json()),
  fetch('/api/casters').then(r => r.json()),
  fetch('/api/rulesets/saved').then(r => r.json()),
]).then(([s, v, r, c, cas, savedRulesets]) => {
  syncFromState(s);
  renderVeto(v);
  rulesetState = r;
  renderRulesetList();
  characterList = c;
  renderCharImageGrid();
  syncCastersFromState(cas);
  renderSavedRulesets(savedRulesets);
}).catch(err => {
  setStatus('Erreur de chargement', 'error');
  console.error(err);
});

// ── Keyboard shortcuts ────────────────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (document.getElementById('char-modal').style.display !== 'none') return;

  switch (e.key) {
    case '1':
      document.querySelector('.btn-score.plus[data-player="1"]').click();
      break;
    case '2':
      document.querySelector('.btn-score.plus[data-player="2"]').click();
      break;
    case 'r':
    case 'R':
      document.getElementById('btn-reset-score').click();
      break;
    case 'v':
    case 'V':
      document.getElementById('btn-visibility').click();
      break;
    case 'Escape':
      closeCharPicker();
      break;
  }
});

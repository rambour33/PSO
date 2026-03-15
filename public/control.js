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
let rulesetState = { stages: [], banPatternGame1: '2-2', banPatternGame2: '1', firstBanner: 1, stageClause: false };
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
      img.src = `/Stock Icons/chara_2_${charName.replace(/\s*\/\s*/g, '-')}_${color}.png`;
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
  const lpVal = s.logoParticleCount ?? 3;
  document.getElementById('logo-particles-range').value = lpVal;
  document.getElementById('logo-particles-num').value   = lpVal;
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
    imgEl.innerHTML = `<img src="/full/chara_1_${char.name}_00.png" style="width:48px;height:48px;object-fit:contain;" onerror="this.parentElement.textContent='${char.name.charAt(0).toUpperCase()}'" />`;
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
    logoParticleCount: parseInt(document.getElementById('logo-particles-num').value) || 3,
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

    const img = document.createElement('img');
    img.className = 'char-card-img';
    img.src = `/full/chara_1_${char.name}_00.png`;
    img.alt = char.name;
    img.onerror = function() {
      this.replaceWith(Object.assign(document.createElement('div'), {
        style: 'font-size:22px;color:var(--gold);font-family:"Russo One",sans-serif;line-height:1;',
        textContent: char.name.charAt(0).toUpperCase()
      }));
    };
    card.appendChild(img);

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

  renderBanBuilder('g1');
  renderBanBuilder('g2');
  updateBanPreview();
}

const STAGE_LIST = [
  { name: 'Random',                    image: '' },
  { name: 'Battlefield',               image: '/maps/SSBU-Battlefield.png' },
  { name: 'Small Battlefield',         image: '/maps/SSBU-Small-Battlefield.jpg' },
  { name: 'Big Battlefield',           image: '/maps/SSBU-Big-Battlefield.png' },
  { name: 'Final Destination',         image: '/maps/SSBU-Final_Destination.jpg' },
  { name: "Peach's Castle",            image: "/maps/SSBU-Peach's_Castle.png" },
  { name: 'Kongo Jungle',              image: '/maps/SSBU-Kongo_Jungle.png' },
  { name: 'Hyrule Castle',             image: '/maps/SSBU-Hyrule_Castle.png' },
  { name: 'Super Happy Tree',          image: '' },
  { name: 'Dream Land',                image: '/maps/SSBU-Dream_Land.png' },
  { name: 'Saffron City',              image: '' },
  { name: 'Mushroom Kingdom',          image: '/maps/SSBU-Mushroom_Kingdom_(SSB).png' },
  { name: "Princess Peach's Castle",   image: "/maps/SSBU-Princess_Peach's_Castle.png" },
  { name: 'Rainbow Cruise',            image: '/maps/SSBU-Rainbow_Cruise.png' },
  { name: 'Kongo Falls',               image: '/maps/SSBU-Kongo_Falls.jpg' },
  { name: 'Jungle Japes',              image: '/maps/SSBU-Jungle_Japes.png' },
  { name: 'Great Bay',                 image: '/maps/SSBU-Great_Bay.jpg' },
  { name: 'Temple',                    image: '/maps/SSBU-Temple.png' },
  { name: 'Brinstar',                  image: '/maps/SSBU-Brinstar.png' },
  { name: "Yoshi's Island (Melee)",    image: "/maps/SSBU-Yoshi's_Island_(SSBM).png" },
  { name: "Yoshi's Story",             image: "/maps/SSBU-Yoshi's_Story.png" },
  { name: 'Fountain of Dreams',        image: '/maps/SSBU-Fountain_of_Dreams.png' },
  { name: 'Green Greens',              image: '/maps/SSBU-Green_Greens.png' },
  { name: 'Corneria',                  image: '/maps/SSBU-Corneria.png' },
  { name: 'Venom',                     image: '/maps/SSBU-Venom.png' },
  { name: 'Pokémon Stadium',           image: '/maps/SSBU-Pokémon_Stadium.png' },
  { name: 'Onett',                     image: '/maps/SSBU-Onett.png' },
  { name: 'Mushroom Kingdom 2',        image: '/maps/SSBU-Mushroom_Kingdom_II.png' },
  { name: 'Brinstar Depths',           image: '/maps/SSBU-Brinstar_Depths.png' },
  { name: 'Big Blue',                  image: '/maps/SSBU-Big_Blue.png' },
  { name: 'Fourside',                  image: '/maps/SSBU-Fourside.jpg' },
  { name: 'Delfino Plaza',             image: '/maps/SSBU-Delfino_Plaza.jpg' },
  { name: 'Mushroomy Kingdom',         image: '/maps/SSBU-Mushroomy_Kingdom.png' },
  { name: 'Figure-8 Circuit',          image: '/maps/SSBU-Mario_Circuit_(SSBB).png' },
  { name: 'WarioWare, Inc.',           image: '/maps/SSBU-WarioWare,_Inc..png' },
  { name: 'Bridge of Eldin',           image: '/maps/SSBU-Bridge_of_Eldin.png' },
  { name: 'Norfair',                   image: '/maps/SSBU-Norfair.png' },
  { name: 'Frigate Orpheon',           image: '/maps/SSBU-Frigate_Orpheon.png' },
  { name: "Yoshi's Island (Brawl)",    image: "/maps/SSBU-Yoshi's_Island_(SSBB).png" },
  { name: 'Halberd',                   image: '/maps/SSBU-Halberd.png' },
  { name: 'Lylat Cruise',              image: '/maps/SSBU-Lylat_Cruise.jpg' },
  { name: 'Pokémon Stadium 2',         image: '/maps/SSBU-Pokémon_Stadium_2.png' },
  { name: 'Port Town Aero Dive',       image: '/maps/SSBU-Port_Town_Aero_Dive.png' },
  { name: 'Castle Siege',              image: '/maps/SSBU-Castle_Siege.png' },
  { name: 'Distant Planet',            image: '/maps/SSBU-Distant_Planet.png' },
  { name: 'Smashville',                image: '/maps/SSBU-Smashville.png' },
  { name: 'New Pork City',             image: '/maps/SSBU-New_Pork_City.png' },
  { name: 'Summit',                    image: '/maps/SSBU-Summit.png' },
  { name: 'Skyworld',                  image: '/maps/SSBU-Skyworld.png' },
  { name: 'Shadow Moses Island',       image: '/maps/SSBU-Shadow_Moses_Island_2.jpg' },
  { name: "Luigi's Mansion",           image: "/maps/SSBU-Luigi's_Mansion.png" },
  { name: 'Pirate Ship',               image: '/maps/SSBU-Pirate_Ship.png' },
  { name: 'Spear Pillar',              image: '/maps/SSBU-Spear_Pillar.png' },
  { name: '75 m',                      image: '/maps/SSBU-75m.png' },
  { name: 'Mario Bros.',               image: '/maps/SSBU-Mario_Bros.png' },
  { name: 'Hanenbow',                  image: '/maps/SSBU-Hanenbow.png' },
  { name: 'Green Hill Zone',           image: '/maps/SSBU-Green_Hill_Zone.png' },
  { name: '3D Land',                   image: '/maps/SSBU-3D_Land.png' },
  { name: 'Golden Plains',             image: '/maps/SSBU-Golden_Plains.png' },
  { name: 'Paper Mario',               image: '/maps/SSBU-Paper_Mario.png' },
  { name: 'Gerudo Valley',             image: '/maps/SSBU-Gerudo_Valley.png' },
  { name: 'Spirit Train',              image: '/maps/SSBU-Spirit_Train.png' },
  { name: 'Dream Land GB',             image: '/maps/SSBU-Dream_Land_(3DS).png' },
  { name: 'Unova Pokémon League',      image: '/maps/SSBU-Unova_Pokémon_League.png' },
  { name: 'Prism Tower',               image: '/maps/SSBU-Prism_Tower.png' },
  { name: 'Mute City SNES',            image: '/maps/SSBU-Mute_City_(3DS).png' },
  { name: 'Magicant',                  image: '/maps/SSBU-Magicant.png' },
  { name: 'Arena Ferox',               image: '/maps/SSBU-Arena_Ferox.png' },
  { name: 'Reset Bomb Forest',         image: '/maps/SSBU-Reset_Bomb_Forest.png' },
  { name: 'Tortimer Island',           image: '/maps/SSBU-Tortimer_Island.png' },
  { name: 'Balloon Fight',             image: '/maps/SSBU-Balloon_Fight.png' },
  { name: 'Living Room',               image: '/maps/SSBU-Living_Room.png' },
  { name: 'Find Mii',                  image: '/maps/SSBU-Find_Mii.png' },
  { name: 'Tomodachi Life',            image: '/maps/SSBU-Tomodachi_Life.png' },
  { name: 'PictoChat 2',               image: '/maps/SSBU-PictoChat_2.png' },
  { name: 'Mushroom Kingdom U',        image: '/maps/SSBU-Mushroom_Kingdom_U.png' },
  { name: 'Mario Galaxy',              image: '/maps/SSBU-Mario_Galaxy.jpg' },
  { name: 'Mario Circuit',             image: '/maps/SSBU-Mario_Circuit_(SSB4).png' },
  { name: 'Skyloft',                   image: '/maps/SSBU-Skyloft.png' },
  { name: 'The Great Cave Offensive',  image: '/maps/SSBU-The_Great_Cave_Offensive.png' },
  { name: 'Kalos Pokémon League',      image: '/maps/SSBU-Kalos_Pokémon_League.png' },
  { name: 'Coliseum',                  image: '/maps/SSBU-Coliseum.png' },
  { name: 'Flat Zone X',               image: '/maps/SSBU-Flat_Zone_X.png' },
  { name: "Palutena's Temple",         image: "/maps/SSBU-Palutena's_Temple.png" },
  { name: 'Gamer',                     image: '/maps/SSBU-Gamer.png' },
  { name: 'Garden of Hope',            image: '/maps/SSBU-Garden_of_Hope.png' },
  { name: 'Town and City',             image: '/maps/SSBU-Town_and_City.png' },
  { name: 'Wii Fit Studio',            image: '/maps/SSBU-Wii_Fit_Studio.png' },
  { name: 'Boxing Ring',               image: '/maps/SSBU-Boxing_Ring_1.png' },
  { name: 'Gaur Plain',                image: '/maps/SSBU-Gaur_Plain.png' },
  { name: 'Duck Hunt',                 image: '/maps/SSBU-Duck_Hunt.png' },
  { name: 'Wrecking Crew',             image: '/maps/SSBU-Wrecking_Crew.png' },
  { name: 'Pilotwings',                image: '/maps/SSBU-Pilotwings.png' },
  { name: 'Wuhu Island',               image: '/maps/SSBU-Wuhu_Island.png' },
  { name: 'Windy Hill Zone',           image: '/maps/SSBU-Windy_Hill_Zone.png' },
  { name: 'Wily Castle',               image: '/maps/SSBU-Wily_Castle.png' },
  { name: 'PAC-LAND',                  image: '/maps/SSBU-Pac-Land.png' },
  { name: 'Super Mario Maker',         image: '/maps/SSBU-Super_Mario_Maker.png' },
  { name: 'Suzaku Castle',             image: '/maps/SSBU-Suzaku_Castle.png' },
  { name: 'Midgar',                    image: '/maps/SSBU-Midgar.jpg' },
  { name: 'Umbra Clock Tower',         image: '/maps/SSBU-Umbra_Clock_Tower.png' },
  { name: 'New Donk City Hall',        image: '/maps/SSBU-New_Donk_City_Hall.jpg' },
  { name: 'Great Plateau Tower',       image: '/maps/SSBU-Great_Plateau_Tower.jpg' },
  { name: 'Moray Towers',              image: '/maps/SSBU-Moray_Towers.png' },
  { name: "Dracula's Castle",          image: "/maps/SSBU-Dracula's_Castle.png" },
  { name: 'Mementos',                  image: '/maps/SSBU-Mementos.jpg' },
  { name: "Yggdrasil's Altar",         image: "/maps/SSBU-Yggdrasil'sAltar.jpg" },
  { name: 'Spiral Mountain',           image: '/maps/SSBU-Spiral_Mountain.jpg' },
  { name: 'Garreg Mach Monastery',     image: '/maps/SSBU-Garreg_Mach_Monastery.jpg' },
  { name: 'Spring Stadium',            image: '/maps/SSBU-Spring_Stadium.jpg' },
  { name: 'Minecraft World',           image: '/maps/SSBU-Minecraft_World.jpg' },
  { name: 'Northern Cave',             image: '/maps/SSBU_Northern_Cave.png' },
  { name: 'Mishima Dojo',              image: '/maps/SSBU-Mishima_Dojo.png' },
  { name: 'Hollow Bastion',            image: '/maps/SSBU-Hollow_Bastion.jpg' },
];

function renderStagePicker() {
  const grid = document.getElementById('stage-picker-grid');
  grid.innerHTML = '';
  STAGE_LIST.forEach(stage => {
    const card = document.createElement('div');
    card.className = 'stage-pick-card';
    if (stage.image) {
      const img = document.createElement('img');
      img.src = stage.image;
      img.alt = stage.name;
      card.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'stage-pick-ph';
      ph.textContent = '?';
      card.appendChild(ph);
    }
    const lbl = document.createElement('span');
    lbl.textContent = stage.name;
    card.appendChild(lbl);
    card.addEventListener('click', () => {
      const type = document.querySelector('input[name="stage-type"]:checked').value;
      const id = stage.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
      rulesetState.stages.push({ id, name: stage.name, image: stage.image, type });
      renderRulesetList();
      setStatus(`Stage "${stage.name}" ajouté`);
      document.getElementById('stage-modal').style.display = 'none';
    });
    grid.appendChild(card);
  });
}
renderStagePicker();

document.getElementById('btn-open-stage-picker').addEventListener('click', () => {
  document.getElementById('stage-modal').style.display = 'flex';
});
document.getElementById('stage-modal-close').addEventListener('click', () => {
  document.getElementById('stage-modal').style.display = 'none';
});
document.getElementById('stage-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('stage-modal')) document.getElementById('stage-modal').style.display = 'none';
});

// ── Ban sequence builder ───────────────────────────────────────

// Internal representation: [{player:1, count:2}, {player:2, count:2}]
let banBuilderG1 = [];
let banBuilderG2 = [];

function parseBanPattern(str) {
  return str.split('-').map(n => parseInt(n)).filter(n => n > 0);
}

function patternToBuilder(str, firstBanner) {
  const parts = parseBanPattern(str);
  let cur = firstBanner || 1;
  return parts.map(count => { const p = cur; cur = cur === 1 ? 2 : 1; return { player: p, count }; });
}

function builderToPattern(builder) {
  return builder.map(s => s.count).join('-') || '0';
}

function renderBanBuilder(key) {
  const builder = key === 'g1' ? banBuilderG1 : banBuilderG2;
  const stepsEl = document.getElementById(`ban-seq-${key}`);
  const countEl = document.getElementById(`ban-builder-${key}-count`);
  const total = rulesetState.stages.length;
  const allocated = builder.reduce((s, b) => s + b.count, 0);
  const remaining = total > 0 ? total - 1 - allocated : 0;

  countEl.textContent = total > 0
    ? `${allocated}/${total - 1} bans — ${remaining >= 0 ? remaining + ' restant(s)' : Math.abs(remaining) + ' en trop'}`
    : 'Aucun stage dans le ruleset';
  countEl.style.color = remaining === 0 ? 'var(--gold)' : remaining < 0 ? 'var(--danger)' : 'var(--text-muted)';

  stepsEl.innerHTML = '';

  builder.forEach((step, i) => {
    if (i > 0) {
      const arrow = document.createElement('span');
      arrow.className = 'ban-seq-arrow';
      arrow.textContent = '→';
      stepsEl.appendChild(arrow);
    }
    const block = document.createElement('div');
    block.className = `ban-seq-block p${step.player}`;

    const minus = document.createElement('button');
    minus.textContent = '−';
    minus.className = 'ban-seq-adj';
    minus.addEventListener('click', () => {
      if (step.count > 1) step.count--;
      else builder.splice(i, 1);
      onBuilderChange(key);
    });

    const label = document.createElement('span');
    label.textContent = `J${step.player} ×${step.count}`;

    const plus = document.createElement('button');
    plus.textContent = '+';
    plus.className = 'ban-seq-adj';
    plus.addEventListener('click', () => { step.count++; onBuilderChange(key); });

    const del = document.createElement('button');
    del.textContent = '×';
    del.className = 'ban-seq-del';
    del.addEventListener('click', () => { builder.splice(i, 1); onBuilderChange(key); });

    block.appendChild(minus);
    block.appendChild(label);
    block.appendChild(plus);
    block.appendChild(del);
    stepsEl.appendChild(block);
  });
}

function onBuilderChange(key) {
  const builder = key === 'g1' ? banBuilderG1 : banBuilderG2;
  const pattern = builderToPattern(builder);
  document.getElementById(`ban-pattern-${key}`).value = pattern;
  if (key === 'g1') rulesetState.banPatternGame1 = pattern;
  else rulesetState.banPatternGame2 = pattern;
  renderBanBuilder(key);
  updateBanPreview();
}

function updateBanPreview() {
  const total = rulesetState.stages.length;
  const a1 = banBuilderG1.reduce((s, b) => s + b.count, 0);
  const a2 = banBuilderG2.reduce((s, b) => s + b.count, 0);
  const preview = document.getElementById('ban-pattern-preview');
  const msgs = [];
  if (total > 0) {
    if (a1 + 1 === total) msgs.push(`Jeu 1 : ✓ ${a1} bans → 1 stage sélectionné`);
    else msgs.push(`Jeu 1 : ${a1} bans / ${total - 1} requis`);
    if (a2 + 1 === total) msgs.push(`Jeux suivants : ✓ ${a2} bans → 1 stage sélectionné`);
    else msgs.push(`Jeux suivants : ${a2} bans / ${total - 1} requis`);
  }
  preview.textContent = msgs.join('   ·   ');
}

function syncBanUI() {
  const first = rulesetState.firstBanner || 1;
  banBuilderG1 = patternToBuilder(rulesetState.banPatternGame1 || '2-2', first);
  banBuilderG2 = patternToBuilder(rulesetState.banPatternGame2 || '1', first);
  document.getElementById('stage-clause').checked = !!rulesetState.stageClause;
  document.querySelectorAll('.ban-first-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.first) === first);
  });
  renderBanBuilder('g1');
  renderBanBuilder('g2');
  updateBanPreview();
}

document.querySelectorAll('.ban-seq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.builder;
    const player = parseInt(btn.dataset.player);
    const builder = key === 'g1' ? banBuilderG1 : banBuilderG2;
    const last = builder[builder.length - 1];
    if (last && last.player === player) last.count++;
    else builder.push({ player, count: 1 });
    onBuilderChange(key);
  });
});

document.getElementById('stage-clause').addEventListener('change', (e) => {
  rulesetState.stageClause = e.target.checked;
});

document.querySelectorAll('.ban-first-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    rulesetState.firstBanner = parseInt(btn.dataset.first);
    document.querySelectorAll('.ban-first-btn').forEach(b => b.classList.toggle('active', b === btn));
    document.getElementById('ban-first-result').textContent = `J${rulesetState.firstBanner} commence`;
    updateBanPreview();
  });
});

const SHIFUMI = ['Pierre 🪨', 'Feuille 📄', 'Ciseaux ✂️'];
// wins[i][j] = true si le coup i bat le coup j (0=Pierre, 1=Feuille, 2=Ciseaux)
const SHIFUMI_BEATS = [[false,false,true],[true,false,false],[false,true,false]];

function runShifumi() {
  const btn = document.getElementById('btn-shifumi');
  const resultEl = document.getElementById('ban-first-result');
  const i1 = Math.floor(Math.random() * 3);
  const i2 = Math.floor(Math.random() * 3);
  const move1 = SHIFUMI[i1];
  const move2 = SHIFUMI[i2];

  if (i1 === i2) {
    resultEl.textContent = `J1: ${move1} · J2: ${move2} → Égalité, relance…`;
    btn.disabled = true;
    setTimeout(() => { btn.disabled = false; runShifumi(); }, 2000);
    return;
  }

  const winner = SHIFUMI_BEATS[i1][i2] ? 1 : 2;
  rulesetState.firstBanner = winner;
  document.querySelectorAll('.ban-first-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.first) === winner);
  });
  resultEl.textContent = `J1: ${move1} · J2: ${move2} → J${winner} commence`;
  updateBanPreview();
  setStatus(`Shifumi : J${winner} bannit en premier`);
}

document.getElementById('btn-shifumi').addEventListener('click', runShifumi);

document.getElementById('btn-save-ruleset').addEventListener('click', () => {
  rulesetState.banPatternGame1 = builderToPattern(banBuilderG1) || '2-2';
  rulesetState.banPatternGame2 = builderToPattern(banBuilderG2) || '1';
  rulesetState.stageClause = document.getElementById('stage-clause').checked;
  socket.emit('updateRuleset', rulesetState);
  setStatus('Ruleset appliqué — veto réinitialisé');
});

document.getElementById('veto-btn-next-game').addEventListener('click', () => {
  if (!vetoState || !vetoState.done) {
    if (!confirm('Le veto n\'est pas terminé. Passer au jeu suivant quand même ?')) return;
  }
  socket.emit('vetoNextGame');
  setStatus(`Jeu ${(vetoState?.gameNumber || 1) + 1} — veto relancé`);
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

// Particules logo — sync slider ↔ number
document.getElementById('logo-particles-range').addEventListener('input', function () {
  document.getElementById('logo-particles-num').value = this.value;
  emitState(buildStateFromForm());
});
document.getElementById('logo-particles-num').addEventListener('change', function () {
  let v = Math.min(100, Math.max(1, parseInt(this.value) || 1));
  this.value = v;
  document.getElementById('logo-particles-range').value = v;
  emitState(buildStateFromForm());
});

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

// ── Thèmes ────────────────────────────────────────────────────

const THEMES = {
  default: {
    sbBgColor:       '#0E0E12',
    sbBgOpacity:     100,
    eventTextColor:  '#EAB830',
    eventTextSize:   12,
    tagColor:        '#E8B830',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#5A5A7A',
    castersBgColor:  '#0E0E12',
    castersBgOpacity: 100,
  },
  cyberpunk: {
    sbBgColor:       '#0D0118',
    sbBgOpacity:     95,
    eventTextColor:  '#00F5FF',
    eventTextSize:   13,
    tagColor:        '#FF2D78',
    nameColor:       '#E0D0FF',
    pronounsColor:   '#BF00FF',
    castersBgColor:  '#0D0118',
    castersBgOpacity: 95,
  },
  synthwave: {
    sbBgColor:       '#0D0030',
    sbBgOpacity:     95,
    eventTextColor:  '#FFD700',
    eventTextSize:   13,
    tagColor:        '#FF6EC7',
    nameColor:       '#F8E8FF',
    pronounsColor:   '#C77DFF',
    castersBgColor:  '#0D0030',
    castersBgOpacity: 95,
  },
  midnight: {
    sbBgColor:       '#000814',
    sbBgOpacity:     100,
    eventTextColor:  '#4FC3F7',
    eventTextSize:   12,
    tagColor:        '#4FC3F7',
    nameColor:       '#E8F4FD',
    pronounsColor:   '#1E6FA8',
    castersBgColor:  '#000814',
    castersBgOpacity: 100,
  },
  fire: {
    sbBgColor:       '#0D0200',
    sbBgOpacity:     96,
    eventTextColor:  '#FF6B35',
    eventTextSize:   13,
    tagColor:        '#FF4500',
    nameColor:       '#FFE0C0',
    pronounsColor:   '#8B3A1A',
    castersBgColor:  '#0D0200',
    castersBgOpacity: 96,
  },
  egypt: {
    sbBgColor:       '#1A0F00',
    sbBgOpacity:     93,
    eventTextColor:  '#C8A96E',
    eventTextSize:   12,
    tagColor:        '#D4A017',
    nameColor:       '#F5E6C8',
    pronounsColor:   '#8B7355',
    castersBgColor:  '#1A0F00',
    castersBgOpacity: 93,
  },
  city: {
    sbBgColor:       '#050510',
    sbBgOpacity:     95,
    eventTextColor:  '#4DAACC',
    eventTextSize:   13,
    tagColor:        '#00D4FF',
    nameColor:       '#E8F4FF',
    pronounsColor:   '#4A7A8A',
    castersBgColor:  '#050510',
    castersBgOpacity: 95,
  },
  eco: {
    sbBgColor:       '#0A1A08',
    sbBgOpacity:     92,
    eventTextColor:  '#6AAA50',
    eventTextSize:   12,
    tagColor:        '#8BC34A',
    nameColor:       '#E8F5E0',
    pronounsColor:   '#5A7A48',
    castersBgColor:  '#0A1A08',
    castersBgOpacity: 92,
  },
  water: {
    sbBgColor:       '#00101E',
    sbBgOpacity:     94,
    eventTextColor:  '#4DD9F0',
    eventTextSize:   12,
    tagColor:        '#00D4FF',
    nameColor:       '#E0F7FF',
    pronounsColor:   '#3A7A8A',
    castersBgColor:  '#00101E',
    castersBgOpacity: 94,
  },
  pkpsy: {
    sbBgColor:       '#1A0020',
    sbBgOpacity:     95,
    eventTextColor:  '#F95587',
    eventTextSize:   13,
    tagColor:        '#F95587',
    nameColor:       '#FFE0F0',
    pronounsColor:   '#9F44D3',
    castersBgColor:  '#1A0020',
    castersBgOpacity: 95,
  },
  pktenebres: {
    sbBgColor:       '#060608',
    sbBgOpacity:     97,
    eventTextColor:  '#8B0000',
    eventTextSize:   12,
    tagColor:        '#8B0000',
    nameColor:       '#D0C0C0',
    pronounsColor:   '#500050',
    castersBgColor:  '#060608',
    castersBgOpacity: 97,
  },
  pkelectrik: {
    sbBgColor:       '#0A0900',
    sbBgOpacity:     96,
    eventTextColor:  '#F7D02C',
    eventTextSize:   13,
    tagColor:        '#F7D02C',
    nameColor:       '#FFFFF0',
    pronounsColor:   '#C8A800',
    castersBgColor:  '#0A0900',
    castersBgOpacity: 96,
  },
  pkfee: {
    sbBgColor:       '#1A000F',
    sbBgOpacity:     94,
    eventTextColor:  '#D685AD',
    eventTextSize:   12,
    tagColor:        '#D685AD',
    nameColor:       '#FFE8F4',
    pronounsColor:   '#A05080',
    castersBgColor:  '#1A000F',
    castersBgOpacity: 94,
  },
  pkspectre: {
    sbBgColor:       '#050010',
    sbBgOpacity:     97,
    eventTextColor:  '#7038F8',
    eventTextSize:   13,
    tagColor:        '#7038F8',
    nameColor:       '#E0D8FF',
    pronounsColor:   '#480088',
    castersBgColor:  '#050010',
    castersBgOpacity: 97,
  },
  pkdragon: {
    sbBgColor:       '#030020',
    sbBgOpacity:     96,
    eventTextColor:  '#6F35FC',
    eventTextSize:   13,
    tagColor:        '#6F35FC',
    nameColor:       '#E8E0FF',
    pronounsColor:   '#FF7038',
    castersBgColor:  '#030020',
    castersBgOpacity: 96,
  },
  pkglace: {
    sbBgColor:       '#000A12',
    sbBgOpacity:     95,
    eventTextColor:  '#96D9D6',
    eventTextSize:   12,
    tagColor:        '#96D9D6',
    nameColor:       '#E8F8FF',
    pronounsColor:   '#5AAAB0',
    castersBgColor:  '#000A12',
    castersBgOpacity: 95,
  },
  pkcombat: {
    sbBgColor:       '#150300',
    sbBgOpacity:     96,
    eventTextColor:  '#C22E28',
    eventTextSize:   13,
    tagColor:        '#C22E28',
    nameColor:       '#FFE0D8',
    pronounsColor:   '#8B2020',
    castersBgColor:  '#150300',
    castersBgOpacity: 96,
  },
  pkpoison: {
    sbBgColor:       '#08000A',
    sbBgOpacity:     96,
    eventTextColor:  '#A33EA1',
    eventTextSize:   12,
    tagColor:        '#A33EA1',
    nameColor:       '#F0D8F8',
    pronounsColor:   '#7B00B4',
    castersBgColor:  '#08000A',
    castersBgOpacity: 96,
  },
  pksol: {
    sbBgColor:       '#120900',
    sbBgOpacity:     94,
    eventTextColor:  '#E2BF65',
    eventTextSize:   12,
    tagColor:        '#E2BF65',
    nameColor:       '#FFF0D0',
    pronounsColor:   '#A07830',
    castersBgColor:  '#120900',
    castersBgOpacity: 94,
  },
  pkvol: {
    sbBgColor:       '#040510',
    sbBgOpacity:     94,
    eventTextColor:  '#A98FF3',
    eventTextSize:   12,
    tagColor:        '#A98FF3',
    nameColor:       '#EEE8FF',
    pronounsColor:   '#6050A0',
    castersBgColor:  '#040510',
    castersBgOpacity: 94,
  },
  pkinsecte: {
    sbBgColor:       '#040500',
    sbBgOpacity:     95,
    eventTextColor:  '#A6B91A',
    eventTextSize:   12,
    tagColor:        '#A6B91A',
    nameColor:       '#F0F8D0',
    pronounsColor:   '#6A7A10',
    castersBgColor:  '#040500',
    castersBgOpacity: 95,
  },
  pkroche: {
    sbBgColor:       '#0A0800',
    sbBgOpacity:     94,
    eventTextColor:  '#B6A136',
    eventTextSize:   12,
    tagColor:        '#B6A136',
    nameColor:       '#F8F0D0',
    pronounsColor:   '#807020',
    castersBgColor:  '#0A0800',
    castersBgOpacity: 94,
  },
  pkacier: {
    sbBgColor:       '#080810',
    sbBgOpacity:     95,
    eventTextColor:  '#B7B7CE',
    eventTextSize:   12,
    tagColor:        '#B7B7CE',
    nameColor:       '#F0F0F8',
    pronounsColor:   '#7080A0',
    castersBgColor:  '#080810',
    castersBgOpacity: 95,
  },
  pknormal: {
    sbBgColor:       '#0A0A08',
    sbBgOpacity:     93,
    eventTextColor:  '#A8A77A',
    eventTextSize:   12,
    tagColor:        '#A8A77A',
    nameColor:       '#F0F0E8',
    pronounsColor:   '#706860',
    castersBgColor:  '#0A0A08',
    castersBgOpacity: 93,
  },
  pkplante: {
    sbBgColor:       '#020900',
    sbBgOpacity:     95,
    eventTextColor:  '#7AC74C',
    eventTextSize:   12,
    tagColor:        '#7AC74C',
    nameColor:       '#E8F8D8',
    pronounsColor:   '#4A8030',
    castersBgColor:  '#020900',
    castersBgOpacity: 95,
  },
  pkfeu: {
    sbBgColor:       '#100400',
    sbBgOpacity:     96,
    eventTextColor:  '#EE8130',
    eventTextSize:   13,
    tagColor:        '#EE8130',
    nameColor:       '#FFE8D0',
    pronounsColor:   '#A05010',
    castersBgColor:  '#100400',
    castersBgOpacity: 96,
  },
  pkeau: {
    sbBgColor:       '#00050F',
    sbBgOpacity:     95,
    eventTextColor:  '#6390F0',
    eventTextSize:   12,
    tagColor:        '#6390F0',
    nameColor:       '#D8E8FF',
    pronounsColor:   '#3060B0',
    castersBgColor:  '#00050F',
    castersBgOpacity: 95,
  },
};

function applyTheme(key) {
  const t = THEMES[key];
  if (!t) return;

  // Scoreboard state
  state.overlayTheme   = key;
  state.sbBgColor      = t.sbBgColor;
  state.sbBgOpacity    = t.sbBgOpacity;
  state.eventTextColor = t.eventTextColor;
  state.eventTextSize  = t.eventTextSize;
  state.tagColor       = t.tagColor;
  state.nameColor      = t.nameColor;
  state.pronounsColor  = t.pronounsColor;

  // Casters state
  castersState.bgColor   = t.castersBgColor;
  castersState.bgOpacity = t.castersBgOpacity;

  // Update color pickers
  document.getElementById('sb-bg-color').value      = t.sbBgColor;
  document.getElementById('sb-bg-opacity').value    = t.sbBgOpacity;
  document.getElementById('event-text-color').value = t.eventTextColor;
  document.getElementById('event-text-size').value  = t.eventTextSize;
  document.getElementById('tag-color').value        = t.tagColor;
  document.getElementById('name-color').value       = t.nameColor;
  document.getElementById('pronouns-color').value   = t.pronounsColor;
  document.getElementById('casters-bg-color').value   = t.castersBgColor;
  document.getElementById('casters-bg-opacity').value = t.castersBgOpacity;

  // Emit
  emitState(buildStateFromForm());
  socket.emit('updateCasters', castersState);

  // Active state on cards
  document.querySelectorAll('.theme-preset-card').forEach(c => {
    c.classList.toggle('active', c.dataset.theme === key);
  });

  setStatus(`Thème "${key}" appliqué`);
}

document.querySelectorAll('.theme-preset-card').forEach(card => {
  card.addEventListener('click', () => applyTheme(card.dataset.theme));
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

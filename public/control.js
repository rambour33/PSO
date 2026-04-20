const socket = io();

let state = {
  player1: { name: 'PLAYER 1', score: 0, character: null, color: '#E83030' },
  player2: { name: 'PLAYER 2', score: 0, character: null, color: '#3070E8' },
  format: 'Bo3',
  customWins: 2,
  event: 'TOURNAMENT',
  stage: 'Grand Final',
  visible: true,
};
let vetoState = null;
let characterList = [];
let rulesetState = { stages: [], banPatternGame1: '2-2', banPatternGame2: '1', firstBanner: 1, stageClause: false, pickG1: true, pickG2: true };
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
  document.getElementById('p1-seed').value     = s.player1.seeding  != null ? s.player1.seeding : '';
  document.getElementById('p2-tag').value      = s.player2.tag      || '';
  document.getElementById('p2-name').value     = s.player2.name;
  document.getElementById('p2-pronouns').value = s.player2.pronouns || '';
  document.getElementById('p2-seed').value     = s.player2.seeding  != null ? s.player2.seeding : '';
  document.getElementById('p1-color').value    = s.player1.color;
  document.getElementById('p2-color').value    = s.player2.color;
  document.getElementById('p1-score-display').textContent = s.player1.score;
  document.getElementById('p2-score-display').textContent = s.player2.score;
  document.getElementById('event-name').value = s.event;
  document.getElementById('event-stage').value = s.stage;
  document.getElementById('center-logo').value = s.centerLogo || '';
  const lpVal = s.logoParticleCount ?? 3;
  document.getElementById('logo-particles-range').value = lpVal;
  document.getElementById('logo-particles-num').value   = lpVal;
  const pOp = s.particleOpacity ?? 100;
  document.getElementById('particle-opacity-range').value = pOp;
  document.getElementById('particle-opacity-num').value   = pOp;
  const pCt = s.particleCountScale ?? 100;
  document.getElementById('particle-count-range').value = pCt;
  document.getElementById('particle-count-num').value   = pCt;
  updateParticlesToggle(s.particlesEnabled !== false);
  updateHidePlayerColorsBtn(s.hidePlayerColors === true);
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

  // Socials restore
  const p1Soc = s.player1.socials || ['', '', ''];
  const p2Soc = s.player2.socials || ['', '', ''];
  ['1','2','3'].forEach((n, i) => {
    const e1 = document.getElementById('p1-social-' + n);
    const e2 = document.getElementById('p2-social-' + n);
    if (e1) e1.value = p1Soc[i] || '';
    if (e2) e2.value = p2Soc[i] || '';
  });

  // Flag restore
  if (window.flagPickerRestore) {
    window.flagPickerRestore(1, s.player1.flag || '');
    window.flagPickerRestore(2, s.player2.flag || '');
  }
  // Flag size restore
  const fs = s.flagSize ?? 52;
  const fsRange = document.getElementById('flag-size-range');
  const fsNum   = document.getElementById('flag-size-num');
  if (fsRange) fsRange.value = fs;
  if (fsNum)   fsNum.value   = fs;

  // Flag offset restore
  const p1fx = s.player1.flagOffsetX ?? 0;
  const p1fy = s.player1.flagOffsetY ?? 0;
  const p2fx = s.player2.flagOffsetX ?? 0;
  const p2fy = s.player2.flagOffsetY ?? 0;
  ['p1-flag-x', 'p1-flag-y', 'p2-flag-x', 'p2-flag-y'].forEach((id, i) => {
    const val = [p1fx, p1fy, p2fx, p2fy][i];
    const range = document.getElementById(id + '-range');
    const num   = document.getElementById(id + '-num');
    if (range) range.value = val;
    if (num)   num.value   = val;
  });

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
  const _showLtControls = s.ltVisible || s.overlayStyle === 'lower-third';
  const ltCard = document.getElementById('lt-position-card');
  if (ltCard) ltCard.style.display = _showLtControls ? '' : 'none';
  const ltBtn = document.getElementById('btn-lt-toggle');
  if (ltBtn) { ltBtn.textContent = s.ltVisible ? 'Lower Third extra : ON' : 'Lower Third extra : OFF'; ltBtn.classList.toggle('btn-primary', !!s.ltVisible); ltBtn.classList.toggle('btn-outline', !s.ltVisible); }

  // Score display buttons
  document.querySelectorAll('.score-display-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.display === (s.scoreDisplay || 'numbers'));
  });

  // Dots orientation buttons
  document.querySelectorAll('.dots-orientation-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.orientation === (s.dotsOrientation || 'row'));
  });

  // Event bar position buttons
  document.querySelectorAll('.event-bar-pos-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.pos === (s.eventBarPosition || 'top'));
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

  // Scoreboard scale/position
  const sbScale = s.sbScale ?? 100;
  const sbX = s.sbX ?? 0;
  const sbY = s.sbY ?? 0;
  const scaleR = document.getElementById('sb-scale-range');
  const scaleN = document.getElementById('sb-scale-num');
  const xR = document.getElementById('sb-x-range');
  const xN = document.getElementById('sb-x-num');
  const yR = document.getElementById('sb-y-range');
  const yN = document.getElementById('sb-y-num');
  if (scaleR) { scaleR.value = sbScale; scaleN.value = sbScale; }
  if (xR) { xR.value = sbX; xN.value = sbX; }
  if (yR) { yR.value = sbY; yN.value = sbY; }

  const ltB = s.ltBottom ?? 150;
  const ltPx = s.ltPaddingX ?? 60;
  const ltBR = document.getElementById('lt-bottom-range');
  const ltBN = document.getElementById('lt-bottom-num');
  const ltPxR = document.getElementById('lt-padding-x-range');
  const ltPxN = document.getElementById('lt-padding-x-num');
  if (ltBR) { ltBR.value = ltB; ltBN.value = ltB; }
  if (ltPxR) { ltPxR.value = ltPx; ltPxN.value = ltPx; }

  // Texture (customisation tab)
  const txOp = s.overlayTextureOpacity ?? 50;
  const txOpRange = document.getElementById('texture-opacity-range');
  const txOpNum   = document.getElementById('texture-opacity-num');
  if (txOpRange) txOpRange.value = txOp;
  if (txOpNum)   txOpNum.value   = txOp;
  const txBlend = document.getElementById('texture-blend');
  if (txBlend) txBlend.value = s.overlayTextureBlend || 'normal';
  const txSize = document.getElementById('texture-size');
  if (txSize)  txSize.value  = s.overlayTextureSize  || 'repeat';
  updateTexturePreview(s.overlayTexture || null);
  // Sync theme config panel if open
  const tcPanel = document.getElementById('theme-config-panel');
  if (tcPanel && tcPanel.style.display !== 'none') {
    const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    setEl('tc-particle-opacity-range', s.particleOpacity ?? 100);
    setEl('tc-particle-opacity-num',   s.particleOpacity ?? 100);
    setEl('tc-particle-count-range',   s.particleCountScale ?? 100);
    setEl('tc-particle-count-num',     s.particleCountScale ?? 100);
    setEl('tc-texture-opacity-range',  txOp);
    setEl('tc-texture-opacity-num',    txOp);
    const tcBlend = document.getElementById('tc-texture-blend');
    if (tcBlend) tcBlend.value = s.overlayTextureBlend || 'normal';
    const tcSize  = document.getElementById('tc-texture-size');
    if (tcSize)  tcSize.value  = s.overlayTextureSize  || 'repeat';
    _tcSyncTexturePreview(s.overlayTexture || null);
  }

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
      flag:        document.getElementById('p1-flag')?.value || '',
      flagOffsetX: parseInt(document.getElementById('p1-flag-x-num')?.value ?? 0),
      flagOffsetY: parseInt(document.getElementById('p1-flag-y-num')?.value ?? 0),
      seeding:    document.getElementById('p1-seed')?.value.trim() ? parseInt(document.getElementById('p1-seed').value) : null,
      socials: [
        document.getElementById('p1-social-1')?.value.trim() || '',
        document.getElementById('p1-social-2')?.value.trim() || '',
        document.getElementById('p1-social-3')?.value.trim() || '',
      ],
    },
    player2: {
      ...state.player2,
      tag:        document.getElementById('p2-tag').value.trim(),
      name:       document.getElementById('p2-name').value.trim() || 'PLAYER 2',
      pronouns:   document.getElementById('p2-pronouns').value.trim(),
      color:      document.getElementById('p2-color').value,
      stockColor: state.player2.stockColor ?? 0,
      flag:        document.getElementById('p2-flag')?.value || '',
      flagOffsetX: parseInt(document.getElementById('p2-flag-x-num')?.value ?? 0),
      flagOffsetY: parseInt(document.getElementById('p2-flag-y-num')?.value ?? 0),
      seeding:    document.getElementById('p2-seed')?.value.trim() ? parseInt(document.getElementById('p2-seed').value) : null,
      socials: [
        document.getElementById('p2-social-1')?.value.trim() || '',
        document.getElementById('p2-social-2')?.value.trim() || '',
        document.getElementById('p2-social-3')?.value.trim() || '',
      ],
    },
    event: document.getElementById('event-name').value.trim() || 'TOURNAMENT',
    stage: document.getElementById('event-stage').value.trim() || '',
    centerLogo: document.getElementById('center-logo').value.trim(),
    swapped: state.swapped ?? false,
    overlayStyle: state.overlayStyle || 'full',
    scoreDisplay: state.scoreDisplay || 'numbers',
    dotsOrientation: state.dotsOrientation || 'row',
    eventBarPosition: state.eventBarPosition || 'top',
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
    particleOpacity:    parseInt(document.getElementById('particle-opacity-num')?.value ?? 100),
    particleCountScale: parseInt(document.getElementById('particle-count-num')?.value ?? 100),
    particlesEnabled:   state.particlesEnabled !== false,
    hidePlayerColors:   state.hidePlayerColors === true,
    sbScale:     parseInt(document.getElementById('sb-scale-num')?.value ?? 100),
    sbX:         parseInt(document.getElementById('sb-x-num')?.value ?? 0),
    sbY:         parseInt(document.getElementById('sb-y-num')?.value ?? 0),
    ltVisible:   state.ltVisible || false,
    ltBottom:    parseInt(document.getElementById('lt-bottom-num')?.value ?? 150),
    ltPaddingX:  parseInt(document.getElementById('lt-padding-x-num')?.value ?? 60),
    flagSize: parseInt(document.getElementById('flag-size-num')?.value ?? 52),
    overlayTexture:        state.overlayTexture || null,
    overlayTextureOpacity: parseInt(document.getElementById('texture-opacity-num')?.value ?? 50),
    overlayTextureBlend:   document.getElementById('texture-blend')?.value || 'normal',
    overlayTextureSize:    document.getElementById('texture-size')?.value || 'repeat',
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
  cancelAutoApply();
  emitState(buildStateFromForm());
  setStatus('Appliqué !');
});

/* ── Auto-apply après 10 s d'inactivité ──────────────────────── */
let _autoApplyTimer    = null;
let _autoApplyInterval = null;
const BTN_APPLY        = document.getElementById('btn-apply');
const AUTO_APPLY_DELAY = 10; // secondes

function cancelAutoApply() {
  clearTimeout(_autoApplyTimer);
  clearInterval(_autoApplyInterval);
  _autoApplyTimer = _autoApplyInterval = null;
  if (BTN_APPLY) BTN_APPLY.textContent = 'Appliquer';
}

function scheduleAutoApply() {
  cancelAutoApply();
  let remaining = AUTO_APPLY_DELAY;
  if (BTN_APPLY) BTN_APPLY.textContent = `Appliquer (auto ${remaining}s)`;
  _autoApplyInterval = setInterval(() => {
    remaining--;
    if (BTN_APPLY) BTN_APPLY.textContent = remaining > 0
      ? `Appliquer (auto ${remaining}s)`
      : 'Appliquer';
  }, 1000);
  _autoApplyTimer = setTimeout(() => {
    clearInterval(_autoApplyInterval);
    _autoApplyInterval = null;
    if (BTN_APPLY) BTN_APPLY.textContent = 'Appliquer';
    emitState(buildStateFromForm());
    setStatus('Appliqué automatiquement');
  }, AUTO_APPLY_DELAY * 1000);
}

// Écoute tous les inputs/selects de la section scoreboard
document.querySelector('.scoreboard-section')?.addEventListener('input',  scheduleAutoApply);
document.querySelector('.scoreboard-section')?.addEventListener('change', scheduleAutoApply);

// Exposé pour startgg-ui.js : met à jour le score dans state + l'affichage
window.setMatchScore = function(p1score, p2score) {
  state.player1 = { ...state.player1, score: p1score };
  state.player2 = { ...state.player2, score: p2score };
  const d1 = document.getElementById('p1-score-display');
  const d2 = document.getElementById('p2-score-display');
  if (d1) d1.textContent = p1score;
  if (d2) d2.textContent = p2score;
};

document.getElementById('btn-send-startgg').addEventListener('click', async function() {
  // Lire en priorité depuis le dataset du bouton (mis à jour par applySet),
  // avec fallback sur les hidden inputs
  const btn         = this;
  const setId       = btn.dataset.setid       || document.getElementById('sgg-current-set-id')?.value  || '';
  const p1EntrantId = btn.dataset.p1entrantid || document.getElementById('sgg-p1-entrant-id')?.value   || '';
  const p2EntrantId = btn.dataset.p2entrantid || document.getElementById('sgg-p2-entrant-id')?.value   || '';

  console.log('[send] setId=%s p1EntrantId=%s p2EntrantId=%s', setId, p1EntrantId, p2EntrantId);

  if (!setId) return;

  // Lire les scores depuis l'affichage (toujours à jour) plutôt que state
  const p1Score = parseInt(document.getElementById('p1-score-display')?.textContent) || 0;
  const p2Score = parseInt(document.getElementById('p2-score-display')?.textContent) || 0;

  if (p1Score === p2Score) {
    setStatus('Scores égaux : impossible de déterminer le vainqueur', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Envoi…';

  try {
    const res = await fetch(`/api/startgg/set/${setId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p1EntrantId,
        p2EntrantId,
        p1Score,
        p2Score,
        p1Character: state.player1.character || null,
        p2Character: state.player2.character || null,
      }),
    });
    const data = await res.json();
    if (data.error) {
      setStatus('Erreur start.gg : ' + data.error, 'error');
    } else {
      setStatus('Score envoyé sur start.gg !');
      btn.textContent = '✓ Score envoyé';
      // Masquer le bouton et vider les IDs : le set est terminé
      document.getElementById('sgg-current-set-id').value  = '';
      document.getElementById('sgg-p1-entrant-id').value   = '';
      document.getElementById('sgg-p2-entrant-id').value   = '';
      btn.style.display = 'none';
      // Actualiser la liste des sets dans les deux onglets
      document.getElementById('match-sgg-refresh-sets')?.click();
      return;
    }
  } catch (e) {
    setStatus('Erreur : ' + e.message);
  }
  btn.textContent = '▲ Envoyer le score sur start.gg';
  btn.disabled = false;
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
    const ltCard = document.getElementById('lt-position-card');
    if (ltCard) ltCard.style.display = (state.overlayStyle === 'lower-third' || state.ltVisible) ? '' : 'none';
    emitState(buildStateFromForm());
    setStatus(`Style : ${state.overlayStyle}`);
  });
});

document.querySelectorAll('.score-display-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.scoreDisplay = btn.dataset.display;
    document.querySelectorAll('.score-display-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.display === state.scoreDisplay);
    });
    emitState(buildStateFromForm());
  });
});

document.querySelectorAll('.dots-orientation-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.dotsOrientation = btn.dataset.orientation;
    document.querySelectorAll('.dots-orientation-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.orientation === state.dotsOrientation);
    });
    emitState(buildStateFromForm());
  });
});

document.getElementById('btn-lt-toggle')?.addEventListener('click', () => {
  state.ltVisible = !state.ltVisible;
  const ltCard = document.getElementById('lt-position-card');
  if (ltCard) ltCard.style.display = state.ltVisible ? '' : 'none';
  const ltBtn = document.getElementById('btn-lt-toggle');
  if (ltBtn) { ltBtn.textContent = state.ltVisible ? 'Lower Third : ON' : 'Lower Third : OFF'; ltBtn.classList.toggle('btn-primary', state.ltVisible); ltBtn.classList.toggle('btn-outline', !state.ltVisible); }
  emitState(buildStateFromForm());
});

document.querySelectorAll('.event-bar-pos-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.eventBarPosition = btn.dataset.pos;
    document.querySelectorAll('.event-bar-pos-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.pos === state.eventBarPosition);
    });
    emitState(buildStateFromForm());
  });
});

document.getElementById('btn-swap').addEventListener('click', () => {
  // ── Swap les champs du formulaire ──
  const swapVal = (idA, idB, prop = 'value') => {
    const a = document.getElementById(idA);
    const b = document.getElementById(idB);
    if (!a || !b) return;
    const tmp = a[prop]; a[prop] = b[prop]; b[prop] = tmp;
  };
  const swapText = (idA, idB) => {
    const a = document.getElementById(idA);
    const b = document.getElementById(idB);
    if (!a || !b) return;
    const tmp = a.textContent; a.textContent = b.textContent; b.textContent = tmp;
  };

  swapVal('p1-tag',       'p2-tag');
  swapVal('p1-name',      'p2-name');
  swapVal('p1-pronouns',  'p2-pronouns');
  swapVal('p1-seed',      'p2-seed');
  swapVal('p1-color',     'p2-color');
  swapVal('p1-flag',      'p2-flag');
  swapVal('p1-flag-x-num','p2-flag-x-num');
  swapVal('p1-flag-y-num','p2-flag-y-num');
  swapVal('p1-flag-x',    'p2-flag-x');
  swapVal('p1-flag-y',    'p2-flag-y');
  swapText('p1-score-display', 'p2-score-display');

  // ── Swap le state ──
  const tmp = state.player1;
  state.player1 = state.player2;
  state.player2 = tmp;

  // ── Mise à jour des previews personnage et stock colors ──
  updateCharPreview(1, state.player1.character);
  updateCharPreview(2, state.player2.character);
  updateStockColorBtns(1, state.player1.character?.name || null);
  updateStockColorBtns(2, state.player2.character?.name || null);

  // ── Envoi ──
  const ns = buildStateFromForm();
  ns.swapped = !state.swapped;
  emitState(ns);
  document.getElementById('btn-swap').classList.toggle('active', ns.swapped);
  setStatus(`Joueurs inversés`);
});

document.getElementById('btn-vs-trigger').addEventListener('click', () => {
  socket.emit('triggerVsScreen');
  const btn = document.getElementById('btn-vs-trigger');
  btn.textContent = '✓ Envoyé';
  setTimeout(() => { btn.textContent = '⚔ VS Anim'; }, 1200);
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

document.getElementById('btn-server-reload').addEventListener('click', () => {
  const btn = document.getElementById('btn-server-reload');
  if (!confirm('Redémarrer le serveur PSO ?\nLes overlays se reconnecteront automatiquement.')) return;
  btn.disabled = true;
  btn.textContent = '↺ Redémarrage…';
  fetch('/api/server/reload', { method: 'POST' })
    .then(() => {
      setStatus('Serveur en cours de redémarrage…');
      // Attendre reconnexion socket
      const check = setInterval(() => {
        if (socket.connected) {
          clearInterval(check);
          btn.disabled = false;
          btn.textContent = '↺ Serveur';
          setStatus('Serveur redémarré !');
        }
      }, 500);
    })
    .catch(() => {
      // Normal : le serveur coupe avant de répondre
      setStatus('Serveur en cours de redémarrage…');
      btn.disabled = false;
      btn.textContent = '↺ Serveur';
    });
});

// ── Multi-PC / Réseau local ───────────────────────────────────────────────────

let _serverIPs = [];
let _serverPort = 3002;
let _urlMode = 'local';

function getServerBase() {
  if (_urlMode === 'network' && _serverIPs.length > 0) {
    return 'http://' + _serverIPs[0] + ':' + _serverPort;
  }
  return 'http://localhost:' + _serverPort;
}

function applyUrlMode(mode) {
  _urlMode = mode;
  const base = getServerBase();
  document.querySelectorAll('.obs-url-item .btn-copy[data-url]').forEach(btn => {
    try {
      const urlPath = new URL(btn.dataset.url).pathname;
      btn.dataset.url = base + urlPath;
      const code = btn.previousElementSibling;
      if (code && code.tagName === 'CODE') code.textContent = base.replace(/^https?:\/\//, '') + urlPath;
    } catch(e) {}
  });
  document.getElementById('btn-mode-local')?.classList.toggle('active', mode === 'local');
  document.getElementById('btn-mode-network')?.classList.toggle('active', mode === 'network');
  const ipSpan = document.getElementById('obs-mode-ip');
  if (ipSpan) {
    if (mode === 'network' && _serverIPs.length > 0) {
      ipSpan.textContent = '→ ' + _serverIPs[0] + ':' + _serverPort;
      ipSpan.style.color = 'var(--gold)';
    } else {
      ipSpan.textContent = _serverIPs.length > 0 ? 'IP réseau : ' + _serverIPs[0] : '';
      ipSpan.style.color = 'var(--text-muted)';
    }
  }
}

fetch('/api/server-info').then(r => r.json()).then(data => {
  _serverIPs = data.ips || [];
  _serverPort = data.port || 3002;
  const btnNet = document.getElementById('btn-mode-network');
  const ipSpan = document.getElementById('obs-mode-ip');
  if (_serverIPs.length > 0) {
    if (btnNet) btnNet.title = 'IP réseau : ' + _serverIPs.join(', ');
    if (ipSpan) ipSpan.textContent = 'IP réseau : ' + _serverIPs[0];
  } else {
    if (btnNet) { btnNet.disabled = true; btnNet.title = 'Aucune IP réseau détectée'; }
  }
}).catch(() => {});

document.getElementById('btn-mode-local')?.addEventListener('click', () => applyUrlMode('local'));
document.getElementById('btn-mode-network')?.addEventListener('click', () => applyUrlMode('network'));

// Copy buttons
document.getElementById('btn-copy-overlay').addEventListener('click', () => {
  navigator.clipboard.writeText(getServerBase() + '/overlay').then(() => {
    const b = document.getElementById('btn-copy-overlay');
    b.textContent = '✓';
    setTimeout(() => { b.textContent = '📋'; }, 1500);
    setStatus('URL scoreboard copiée');
  });
});

document.getElementById('btn-copy-veto').addEventListener('click', () => {
  navigator.clipboard.writeText(getServerBase() + '/stageveto').then(() => {
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
let banPickG1 = false;
let banPickG2 = false;

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
  const total    = rulesetState.stages.length;
  const hasPick  = key === 'g1' ? banPickG1 : banPickG2;
  const maxBans  = Math.max(0, total - 1);
  const allocated = builder.reduce((s, b) => s + b.count, 0);
  const remaining = maxBans - allocated;

  countEl.textContent = total > 0
    ? `${allocated}/${maxBans} bans${hasPick ? ' + map sélectionnée' : ''} — ${remaining >= 0 ? remaining + ' restant(s)' : Math.abs(remaining) + ' en trop'}`
    : 'Aucun stage dans le ruleset';
  countEl.style.color = remaining < 0 ? 'var(--danger)' : remaining === 0 ? 'var(--gold)' : 'var(--text-muted)';

  stepsEl.innerHTML = '';

  // Pick block — rendered FIRST
  if (hasPick) {
    const block = document.createElement('div');
    block.className = 'ban-seq-block pick';
    const label = document.createElement('span');
    label.textContent = '✓ Map sélectionnée';
    const del = document.createElement('button');
    del.textContent = '×';
    del.className = 'ban-seq-del';
    del.addEventListener('click', () => {
      if (key === 'g1') banPickG1 = false; else banPickG2 = false;
      onBuilderChange(key);
    });
    block.appendChild(label);
    block.appendChild(del);
    stepsEl.appendChild(block);
  }

  // Ban steps after
  builder.forEach((step, i) => {
    const arrow = document.createElement('span');
    arrow.className = 'ban-seq-arrow';
    arrow.textContent = '→';
    stepsEl.appendChild(arrow);

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
    label.textContent = `${step.player === 1 ? 'Gagnant' : 'Perdant'} ×${step.count}`;

    const plus = document.createElement('button');
    plus.textContent = '+';
    plus.className = 'ban-seq-adj';
    plus.disabled = remaining <= 0;
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

  // Enable/disable add buttons
  const pickBtn = document.querySelector(`.ban-seq-btn.pick[data-builder="${key}"]`);
  if (pickBtn) pickBtn.disabled = hasPick;
  document.querySelectorAll(`.ban-seq-btn:not(.pick)[data-builder="${key}"]`).forEach(b => {
    b.disabled = remaining <= 0;
  });
}

function onBuilderChange(key) {
  const builder = key === 'g1' ? banBuilderG1 : banBuilderG2;
  const pattern = builderToPattern(builder);
  document.getElementById(`ban-pattern-${key}`).value = pattern;
  if (key === 'g1') { rulesetState.banPatternGame1 = pattern; rulesetState.pickG1 = banPickG1; }
  else { rulesetState.banPatternGame2 = pattern; rulesetState.pickG2 = banPickG2; }
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
    const max = total - 1;
    msgs.push(a1 <= max ? `Jeu 1 : ${a1}/${max} bans` : `Jeu 1 : ⚠ ${a1} bans (max ${max})`);
    msgs.push(a2 <= max ? `Jeux suivants : ${a2}/${max} bans` : `Jeux suivants : ⚠ ${a2} bans (max ${max})`);
  }
  preview.textContent = msgs.join('   ·   ');
}

function syncBanUI() {
  const first = rulesetState.firstBanner || 1;
  banBuilderG1 = patternToBuilder(rulesetState.banPatternGame1 || '2-2', first);
  banBuilderG2 = patternToBuilder(rulesetState.banPatternGame2 || '1', first);
  banPickG1 = rulesetState.pickG1 !== false;
  banPickG2 = rulesetState.pickG2 !== false;
  document.getElementById('stage-clause').checked = !!rulesetState.stageClause;
  document.querySelectorAll('.ban-first-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.first) === first);
  });
  renderBanBuilder('g1');
  renderBanBuilder('g2');
  updateBanPreview();
}

document.querySelectorAll('.ban-seq-btn:not(.pick)').forEach(btn => {
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

document.querySelectorAll('.ban-seq-btn.pick').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.builder;
    if (key === 'g1') banPickG1 = true; else banPickG2 = true;
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

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const target = document.getElementById('tab-' + tabId);
  if (target) target.classList.add('active');
  const sel = document.getElementById('tab-select-mobile');
  if (sel) sel.value = tabId;
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.getElementById('tab-select-mobile')?.addEventListener('change', function() {
  switchTab(this.value);
});

// ── Mode mobile ────────────────────────────────────────────────

(function () {
  const btn = document.getElementById('btn-mobile-mode');
  const STORAGE_KEY = 'pso-mobile-mode';

  function setMobile(on) {
    document.body.classList.toggle('mobile-mode', on);
    if (btn) btn.classList.toggle('active', on);
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
  }

  // Restore saved preference, OR auto-enable on small screen
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved !== null) {
    setMobile(saved === '1');
  } else if (window.innerWidth < 768) {
    setMobile(true);
  }

  btn?.addEventListener('click', () => setMobile(!document.body.classList.contains('mobile-mode')));
})();

// ── Sous-onglets ──────────────────────────────────────────────

document.querySelectorAll('.subtab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const parent = btn.closest('.tab-content');
    parent.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
    parent.querySelectorAll('.subtab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const target = parent.querySelector('#subtab-' + btn.dataset.subtab);
    if (target) target.classList.add('active');
  });
});

// ── Accordions ────────────────────────────────────────────────

document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    header.closest('.accordion-tile').classList.toggle('open');
  });
});

// ── Logo preview & upload fichier local ──────────────────────

document.getElementById('center-logo').addEventListener('input', updateLogoPreview);

// Bouton 📁 → ouvre le file picker
document.getElementById('btn-logo-file-pick')?.addEventListener('click', () => {
  document.getElementById('center-logo-file-input')?.click();
});

// Upload du fichier vers /api/logo/upload
document.getElementById('center-logo-file-input')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    fetch('/api/logo/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, data: ev.target.result }),
    })
      .then(r => r.json())
      .then(({ url }) => {
        if (!url) return;
        document.getElementById('center-logo').value = url;
        updateLogoPreview();
        e.target.value = '';
      })
      .catch(() => alert('Erreur upload logo'));
  };
  reader.readAsDataURL(file);
});

function updateLogoPreview() {
  const url = document.getElementById('center-logo').value.trim();
  const box = document.getElementById('center-logo-preview');
  if (url) {
    box.innerHTML = `<img src="${url}" onerror="this.parentElement.innerHTML='<span>Erreur</span>'" />`;
  } else {
    box.innerHTML = '<span>Aperçu</span>';
  }
}

// Particules — bouton ON/OFF
function updateParticlesToggle(enabled) {
  const btn  = document.getElementById('btn-particles-toggle');
  const ctrls = document.getElementById('particles-controls');
  if (!btn) return;
  if (enabled) {
    btn.textContent = '⏸ Désactiver les particules';
    btn.classList.remove('btn-outline');
    btn.classList.add('btn-primary');
    ctrls.style.opacity = '1';
    ctrls.style.pointerEvents = '';
  } else {
    btn.textContent = '▶ Activer les particules';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-outline');
    ctrls.style.opacity = '0.4';
    ctrls.style.pointerEvents = 'none';
  }
}

document.getElementById('btn-particles-toggle').addEventListener('click', () => {
  state.particlesEnabled = state.particlesEnabled === false;
  emitState(buildStateFromForm());
  setStatus(state.particlesEnabled === false ? 'Particules désactivées' : 'Particules activées');
});

function updateHidePlayerColorsBtn(hidden) {
  const btn = document.getElementById('btn-hide-player-colors');
  if (!btn) return;
  if (hidden) {
    btn.textContent = '🎨 Couleurs joueurs : OFF';
    btn.classList.add('btn-danger');
    btn.classList.remove('btn-outline');
  } else {
    btn.textContent = '🎨 Couleurs joueurs : ON';
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-outline');
  }
}

document.getElementById('btn-hide-player-colors').addEventListener('click', () => {
  state.hidePlayerColors = !state.hidePlayerColors;
  updateHidePlayerColorsBtn(state.hidePlayerColors);
  emitState(buildStateFromForm());
  setStatus(state.hidePlayerColors ? 'Couleurs joueurs masquées' : 'Couleurs joueurs visibles');
});

// Particules — opacité & quantité — sync slider ↔ number
['particle-opacity', 'particle-count'].forEach(id => {
  document.getElementById(id + '-range').addEventListener('input', function () {
    document.getElementById(id + '-num').value = this.value;
    emitState(buildStateFromForm());
  });
  document.getElementById(id + '-num').addEventListener('change', function () {
    const isOpacity = id === 'particle-opacity';
    const [min, max] = isOpacity ? [0, 100] : [10, 500];
    let v = Math.min(max, Math.max(min, parseInt(this.value) || min));
    this.value = v;
    document.getElementById(id + '-range').value = v;
    emitState(buildStateFromForm());
  });
});

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

// Scoreboard scale/position sliders — sync range ↔ number and emit
[
  { id: 'sb-scale',      min: 50,   max: 200 },
  { id: 'sb-x',          min: -960, max: 960 },
  { id: 'sb-y',          min: -200, max: 600 },
  { id: 'lt-bottom',     min: 0,    max: 500 },
  { id: 'lt-padding-x',  min: 0,    max: 400 },
].forEach(({ id, min, max }) => {
  document.getElementById(id + '-range').addEventListener('input', function () {
    document.getElementById(id + '-num').value = this.value;
    emitState(buildStateFromForm());
  });
  document.getElementById(id + '-num').addEventListener('change', function () {
    let v = Math.min(max, Math.max(min, parseInt(this.value) || 0));
    this.value = v;
    document.getElementById(id + '-range').value = v;
    emitState(buildStateFromForm());
  });
});

// Flag size slider
['flag-size'].forEach(id => {
  document.getElementById(id + '-range')?.addEventListener('input', function () {
    document.getElementById(id + '-num').value = this.value;
    emitState(buildStateFromForm());
  });
  document.getElementById(id + '-num')?.addEventListener('change', function () {
    let v = Math.min(150, Math.max(20, parseInt(this.value) || 52));
    this.value = v;
    document.getElementById(id + '-range').value = v;
    emitState(buildStateFromForm());
  });
});

// Flag position sliders — sync range ↔ number and emit
['p1-flag-x', 'p1-flag-y', 'p2-flag-x', 'p2-flag-y'].forEach(id => {
  document.getElementById(id + '-range').addEventListener('input', function () {
    document.getElementById(id + '-num').value = this.value;
    emitState(buildStateFromForm());
  });
  document.getElementById(id + '-num').addEventListener('change', function () {
    let v = Math.min(200, Math.max(-200, parseInt(this.value) || 0));
    this.value = v;
    document.getElementById(id + '-range').value = v;
    emitState(buildStateFromForm());
  });
});

document.getElementById('btn-apply-logo').addEventListener('click', () => {
  emitState(buildStateFromForm());
  updateLogoPreview();
  setStatus('Logo appliqué !');
});

// ── VS Screen background ───────────────────────────────────────

(function () {
  const fileInput   = document.getElementById('vs-bg-file');
  const previewWrap = document.getElementById('vs-bg-preview-wrap');
  const previewImg  = document.getElementById('vs-bg-preview');
  const clearBtn    = document.getElementById('btn-vs-bg-clear');
  const statusEl    = document.getElementById('vs-bg-status');

  function showPreview(url) {
    previewImg.src = url;
    previewWrap.style.display = 'block';
  }
  function hidePreview() {
    previewWrap.style.display = 'none';
    previewImg.src = '';
  }

  // Charger le background existant au démarrage
  fetch('/api/vs-background').then(r => r.json()).then(({ url }) => {
    if (url) showPreview(url + '?t=' + Date.now());
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    statusEl.textContent = 'Envoi en cours…';
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      const base64  = dataUrl.split(',')[1];
      try {
        const res = await fetch('/api/vs-background', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, data: base64 }),
        });
        const { url, error } = await res.json();
        if (error) { statusEl.textContent = 'Erreur : ' + error; return; }
        showPreview(url + '?t=' + Date.now());
        statusEl.textContent = 'Background appliqué !';
        setTimeout(() => { statusEl.textContent = ''; }, 2000);
      } catch (err) {
        statusEl.textContent = 'Erreur réseau';
      }
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
  });

  clearBtn.addEventListener('click', async () => {
    await fetch('/api/vs-background', { method: 'DELETE' });
    hidePreview();
    statusEl.textContent = 'Background supprimé';
    setTimeout(() => { statusEl.textContent = ''; }, 2000);
  });
})();

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
  dual: {
    sbBgColor:       '#0A0A0E',
    sbBgOpacity:     100,
    eventTextColor:  '#E8B830',
    eventTextSize:   12,
    tagColor:        '#E8B830',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#5A5A7A',
    castersBgColor:  '#0A0A0E',
    castersBgOpacity: 100,
  },
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
  rainbow: {
    sbBgColor:       '#080808',
    sbBgOpacity:     95,
    eventTextColor:  '#FF8C00',
    eventTextSize:   13,
    tagColor:        '#FF8C00',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#AAAAAA',
    castersBgColor:  '#080808',
    castersBgOpacity: 95,
  },
  trans: {
    sbBgColor:       '#060D12',
    sbBgOpacity:     95,
    eventTextColor:  '#55CDFC',
    eventTextSize:   12,
    tagColor:        '#55CDFC',
    nameColor:       '#FDEEFF',
    pronounsColor:   '#F7A8B8',
    castersBgColor:  '#060D12',
    castersBgOpacity: 95,
  },
  pan: {
    sbBgColor:       '#08040A',
    sbBgOpacity:     95,
    eventTextColor:  '#FF218C',
    eventTextSize:   13,
    tagColor:        '#FF218C',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#21B1FF',
    castersBgColor:  '#08040A',
    castersBgOpacity: 95,
  },
  bi: {
    sbBgColor:       '#060308',
    sbBgOpacity:     96,
    eventTextColor:  '#D60270',
    eventTextSize:   12,
    tagColor:        '#D60270',
    nameColor:       '#FFE0F0',
    pronounsColor:   '#9B4F96',
    castersBgColor:  '#060308',
    castersBgOpacity: 96,
  },
  plage: {
    sbBgColor:       '#03121A',
    sbBgOpacity:     94,
    eventTextColor:  '#48CAE4',
    eventTextSize:   12,
    tagColor:        '#48CAE4',
    nameColor:       '#F5F0E8',
    pronounsColor:   '#ADE8F4',
    castersBgColor:  '#03121A',
    castersBgOpacity: 94,
  },
  lesbian: {
    sbBgColor:       '#0A0200',
    sbBgOpacity:     95,
    eventTextColor:  '#D62900',
    eventTextSize:   13,
    tagColor:        '#D62900',
    nameColor:       '#FFF0E8',
    pronounsColor:   '#D461A6',
    castersBgColor:  '#0A0200',
    castersBgOpacity: 95,
  },
  flag_fr: {
    sbBgColor:       '#000510',
    sbBgOpacity:     95,
    eventTextColor:  '#4D8FFF',
    eventTextSize:   13,
    tagColor:        '#4D8FFF',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#EF4135',
    castersBgColor:  '#000510',
    castersBgOpacity: 95,
  },
  flag_ch: {
    sbBgColor:       '#0D0002',
    sbBgOpacity:     95,
    eventTextColor:  '#FF3040',
    eventTextSize:   13,
    tagColor:        '#FF3040',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#FF8090',
    castersBgColor:  '#0D0002',
    castersBgOpacity: 95,
  },
  flag_be: {
    sbBgColor:       '#0A0800',
    sbBgOpacity:     95,
    eventTextColor:  '#FFD700',
    eventTextSize:   13,
    tagColor:        '#FFD700',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#CC1010',
    castersBgColor:  '#0A0800',
    castersBgOpacity: 95,
  },
  flag_es: {
    sbBgColor:       '#0E0200',
    sbBgOpacity:     95,
    eventTextColor:  '#FF4422',
    eventTextSize:   13,
    tagColor:        '#FF4422',
    nameColor:       '#FFE040',
    pronounsColor:   '#CC2010',
    castersBgColor:  '#0E0200',
    castersBgOpacity: 95,
  },
  flag_it: {
    sbBgColor:       '#000E04',
    sbBgOpacity:     95,
    eventTextColor:  '#00CC55',
    eventTextSize:   13,
    tagColor:        '#00CC55',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#CE2B37',
    castersBgColor:  '#000E04',
    castersBgOpacity: 95,
  },
  flag_de: {
    sbBgColor:       '#0A0800',
    sbBgOpacity:     95,
    eventTextColor:  '#FFD700',
    eventTextSize:   13,
    tagColor:        '#FFD700',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#CC2020',
    castersBgColor:  '#0A0800',
    castersBgOpacity: 95,
  },
  flag_nl: {
    sbBgColor:       '#0A0300',
    sbBgOpacity:     95,
    eventTextColor:  '#FF7700',
    eventTextSize:   13,
    tagColor:        '#FF7700',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#CC2020',
    castersBgColor:  '#0A0300',
    castersBgOpacity: 95,
  },
  flag_pt: {
    sbBgColor:       '#000800',
    sbBgOpacity:     95,
    eventTextColor:  '#00CC55',
    eventTextSize:   13,
    tagColor:        '#00CC55',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#CC1020',
    castersBgColor:  '#000800',
    castersBgOpacity: 95,
  },
  flag_at: {
    sbBgColor:       '#0D0001',
    sbBgOpacity:     95,
    eventTextColor:  '#FF4455',
    eventTextSize:   13,
    tagColor:        '#FF4455',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#FF8090',
    castersBgColor:  '#0D0001',
    castersBgOpacity: 95,
  },
  flag_ca: {
    sbBgColor:       '#0D0001',
    sbBgOpacity:     95,
    eventTextColor:  '#FF3333',
    eventTextSize:   13,
    tagColor:        '#FF3333',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#FF7777',
    castersBgColor:  '#0D0001',
    castersBgOpacity: 95,
  },
  flag_us: {
    sbBgColor:       '#000510',
    sbBgOpacity:     95,
    eventTextColor:  '#4477FF',
    eventTextSize:   13,
    tagColor:        '#4477FF',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#CC2020',
    castersBgColor:  '#000510',
    castersBgOpacity: 95,
  },
  flag_mx: {
    sbBgColor:       '#000E04',
    sbBgOpacity:     95,
    eventTextColor:  '#00CC55',
    eventTextSize:   13,
    tagColor:        '#00CC55',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#CE112D',
    castersBgColor:  '#000E04',
    castersBgOpacity: 95,
  },
  flag_eu: {
    sbBgColor:       '#000214',
    sbBgOpacity:     95,
    eventTextColor:  '#FFD700',
    eventTextSize:   13,
    tagColor:        '#FFD700',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#4477FF',
    castersBgColor:  '#000214',
    castersBgOpacity: 95,
  },
  flag_br: {
    sbBgColor:       '#000A00',
    sbBgOpacity:     95,
    eventTextColor:  '#FFD700',
    eventTextSize:   13,
    tagColor:        '#FFD700',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#009C3B',
    castersBgColor:  '#000A00',
    castersBgOpacity: 95,
  },
  flag_jp: {
    sbBgColor:       '#0D0001',
    sbBgOpacity:     95,
    eventTextColor:  '#FF0000',
    eventTextSize:   13,
    tagColor:        '#FF0000',
    nameColor:       '#FFFFFF',
    pronounsColor:   '#FF6070',
    castersBgColor:  '#0D0001',
    castersBgOpacity: 95,
  },
  smario: {
    sbBgColor:       '#1A0400',
    sbBgOpacity:     95,
    eventTextColor:  '#E52222',
    eventTextSize:   12,
    tagColor:        '#E52222',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#891414',
    castersBgColor:  '#1A0400',
    castersBgOpacity: 95,
  },
  sdk: {
    sbBgColor:       '#140A00',
    sbBgOpacity:     95,
    eventTextColor:  '#8B4513',
    eventTextSize:   12,
    tagColor:        '#8B4513',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#53290b',
    castersBgColor:  '#140A00',
    castersBgOpacity: 95,
  },
  slink: {
    sbBgColor:       '#051200',
    sbBgOpacity:     95,
    eventTextColor:  '#4CAF50',
    eventTextSize:   12,
    tagColor:        '#4CAF50',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#2e6930',
    castersBgColor:  '#051200',
    castersBgOpacity: 95,
  },
  ssamus: {
    sbBgColor:       '#100800',
    sbBgOpacity:     95,
    eventTextColor:  '#FF8C00',
    eventTextSize:   12,
    tagColor:        '#FF8C00',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#995400',
    castersBgColor:  '#100800',
    castersBgOpacity: 95,
  },
  sdsamus: {
    sbBgColor:       '#000D1A',
    sbBgOpacity:     95,
    eventTextColor:  '#00BFFF',
    eventTextSize:   12,
    tagColor:        '#00BFFF',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#007399',
    castersBgColor:  '#000D1A',
    castersBgOpacity: 95,
  },
  syoshi: {
    sbBgColor:       '#001A05',
    sbBgOpacity:     95,
    eventTextColor:  '#55CC44',
    eventTextSize:   12,
    tagColor:        '#55CC44',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#337a29',
    castersBgColor:  '#001A05',
    castersBgOpacity: 95,
  },
  skirby: {
    sbBgColor:       '#1A0510',
    sbBgOpacity:     95,
    eventTextColor:  '#FF69B4',
    eventTextSize:   12,
    tagColor:        '#FF69B4',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#993f6c',
    castersBgColor:  '#1A0510',
    castersBgOpacity: 95,
  },
  sfox: {
    sbBgColor:       '#080808',
    sbBgOpacity:     95,
    eventTextColor:  '#FF8C00',
    eventTextSize:   12,
    tagColor:        '#FF8C00',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#995400',
    castersBgColor:  '#080808',
    castersBgOpacity: 95,
  },
  spikachu: {
    sbBgColor:       '#0A0900',
    sbBgOpacity:     95,
    eventTextColor:  '#FFD700',
    eventTextSize:   12,
    tagColor:        '#FFD700',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#998100',
    castersBgColor:  '#0A0900',
    castersBgOpacity: 95,
  },
  sluigi: {
    sbBgColor:       '#001005',
    sbBgOpacity:     95,
    eventTextColor:  '#4CAF50',
    eventTextSize:   12,
    tagColor:        '#4CAF50',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#2e6930',
    castersBgColor:  '#001005',
    castersBgOpacity: 95,
  },
  sness: {
    sbBgColor:       '#0A0010',
    sbBgOpacity:     95,
    eventTextColor:  '#FF4500',
    eventTextSize:   12,
    tagColor:        '#FF4500',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#992900',
    castersBgColor:  '#0A0010',
    castersBgOpacity: 95,
  },
  sfalcon: {
    sbBgColor:       '#050010',
    sbBgOpacity:     95,
    eventTextColor:  '#FF6600',
    eventTextSize:   12,
    tagColor:        '#FF6600',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#993d00',
    castersBgColor:  '#050010',
    castersBgOpacity: 95,
  },
  sjigglypuff: {
    sbBgColor:       '#1A000D',
    sbBgOpacity:     95,
    eventTextColor:  '#FFB6C1',
    eventTextSize:   12,
    tagColor:        '#FFB6C1',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#996d74',
    castersBgColor:  '#1A000D',
    castersBgOpacity: 95,
  },
  speach: {
    sbBgColor:       '#1A0A10',
    sbBgOpacity:     95,
    eventTextColor:  '#FFB6C1',
    eventTextSize:   12,
    tagColor:        '#FFB6C1',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#996d74',
    castersBgColor:  '#1A0A10',
    castersBgOpacity: 95,
  },
  sdaisy: {
    sbBgColor:       '#0D0A00',
    sbBgOpacity:     95,
    eventTextColor:  '#FF9500',
    eventTextSize:   12,
    tagColor:        '#FF9500',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#995900',
    castersBgColor:  '#0D0A00',
    castersBgOpacity: 95,
  },
  sbowser: {
    sbBgColor:       '#0A0500',
    sbBgOpacity:     95,
    eventTextColor:  '#FF6600',
    eventTextSize:   12,
    tagColor:        '#FF6600',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#993d00',
    castersBgColor:  '#0A0500',
    castersBgOpacity: 95,
  },
  siceclimbers: {
    sbBgColor:       '#000A12',
    sbBgOpacity:     95,
    eventTextColor:  '#96D9D6',
    eventTextSize:   12,
    tagColor:        '#96D9D6',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#5a8280',
    castersBgColor:  '#000A12',
    castersBgOpacity: 95,
  },
  ssheik: {
    sbBgColor:       '#050508',
    sbBgOpacity:     95,
    eventTextColor:  '#C8A000',
    eventTextSize:   12,
    tagColor:        '#C8A000',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#786000',
    castersBgColor:  '#050508',
    castersBgOpacity: 95,
  },
  szelda: {
    sbBgColor:       '#100A00',
    sbBgOpacity:     95,
    eventTextColor:  '#FFD700',
    eventTextSize:   12,
    tagColor:        '#FFD700',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#998100',
    castersBgColor:  '#100A00',
    castersBgOpacity: 95,
  },
  sdrmario: {
    sbBgColor:       '#000005',
    sbBgOpacity:     95,
    eventTextColor:  '#FF4444',
    eventTextSize:   12,
    tagColor:        '#FF4444',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#992929',
    castersBgColor:  '#000005',
    castersBgOpacity: 95,
  },
  spichu: {
    sbBgColor:       '#0A0800',
    sbBgOpacity:     95,
    eventTextColor:  '#FFE550',
    eventTextSize:   12,
    tagColor:        '#FFE550',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#998930',
    castersBgColor:  '#0A0800',
    castersBgOpacity: 95,
  },
  sfalco: {
    sbBgColor:       '#00050A',
    sbBgOpacity:     95,
    eventTextColor:  '#4488FF',
    eventTextSize:   12,
    tagColor:        '#4488FF',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#295299',
    castersBgColor:  '#00050A',
    castersBgOpacity: 95,
  },
  smarth: {
    sbBgColor:       '#00050F',
    sbBgOpacity:     95,
    eventTextColor:  '#3366CC',
    eventTextSize:   12,
    tagColor:        '#3366CC',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#1f3d7a',
    castersBgColor:  '#00050F',
    castersBgOpacity: 95,
  },
  slucina: {
    sbBgColor:       '#000510',
    sbBgOpacity:     95,
    eventTextColor:  '#66AAFF',
    eventTextSize:   12,
    tagColor:        '#66AAFF',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#3d6699',
    castersBgColor:  '#000510',
    castersBgOpacity: 95,
  },
  sylink: {
    sbBgColor:       '#001505',
    sbBgOpacity:     95,
    eventTextColor:  '#66BB44',
    eventTextSize:   12,
    tagColor:        '#66BB44',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#3d7029',
    castersBgColor:  '#001505',
    castersBgOpacity: 95,
  },
  sganondorf: {
    sbBgColor:       '#080005',
    sbBgOpacity:     95,
    eventTextColor:  '#8800BB',
    eventTextSize:   12,
    tagColor:        '#8800BB',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#520070',
    castersBgColor:  '#080005',
    castersBgOpacity: 95,
  },
  smewtwo: {
    sbBgColor:       '#08000A',
    sbBgOpacity:     95,
    eventTextColor:  '#CC44CC',
    eventTextSize:   12,
    tagColor:        '#CC44CC',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#7a297a',
    castersBgColor:  '#08000A',
    castersBgOpacity: 95,
  },
  sroy: {
    sbBgColor:       '#0D0200',
    sbBgOpacity:     95,
    eventTextColor:  '#FF4400',
    eventTextSize:   12,
    tagColor:        '#FF4400',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#992900',
    castersBgColor:  '#0D0200',
    castersBgOpacity: 95,
  },
  schrom: {
    sbBgColor:       '#000510',
    sbBgOpacity:     95,
    eventTextColor:  '#3366EE',
    eventTextSize:   12,
    tagColor:        '#3366EE',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#1f3d8f',
    castersBgColor:  '#000510',
    castersBgOpacity: 95,
  },
  sgamewatch: {
    sbBgColor:       '#050505',
    sbBgOpacity:     95,
    eventTextColor:  '#FFFFFF',
    eventTextSize:   12,
    tagColor:        '#FFFFFF',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#999999',
    castersBgColor:  '#050505',
    castersBgOpacity: 95,
  },
  smetaknight: {
    sbBgColor:       '#05000A',
    sbBgOpacity:     95,
    eventTextColor:  '#8855FF',
    eventTextSize:   12,
    tagColor:        '#8855FF',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#523399',
    castersBgColor:  '#05000A',
    castersBgOpacity: 95,
  },
  spit: {
    sbBgColor:       '#0A0800',
    sbBgOpacity:     95,
    eventTextColor:  '#FFD700',
    eventTextSize:   12,
    tagColor:        '#FFD700',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#998100',
    castersBgColor:  '#0A0800',
    castersBgOpacity: 95,
  },
  sdarkpit: {
    sbBgColor:       '#050008',
    sbBgOpacity:     95,
    eventTextColor:  '#888888',
    eventTextSize:   12,
    tagColor:        '#888888',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#525252',
    castersBgColor:  '#050008',
    castersBgOpacity: 95,
  },
  szss: {
    sbBgColor:       '#000510',
    sbBgOpacity:     95,
    eventTextColor:  '#22AAFF',
    eventTextSize:   12,
    tagColor:        '#22AAFF',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#146699',
    castersBgColor:  '#000510',
    castersBgOpacity: 95,
  },
  swario: {
    sbBgColor:       '#0A0A00',
    sbBgOpacity:     95,
    eventTextColor:  '#FFD700',
    eventTextSize:   12,
    tagColor:        '#FFD700',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#998100',
    castersBgColor:  '#0A0A00',
    castersBgOpacity: 95,
  },
  ssnake: {
    sbBgColor:       '#050505',
    sbBgOpacity:     96,
    eventTextColor:  '#7AAA50',
    eventTextSize:   12,
    tagColor:        '#D2A020',
    nameColor:       '#D8E8D0',
    pronounsColor:   '#4A6438',
    castersBgColor:  '#050505',
    castersBgOpacity: 96,
  },
  sike: {
    sbBgColor:       '#000510',
    sbBgOpacity:     95,
    eventTextColor:  '#2244CC',
    eventTextSize:   12,
    tagColor:        '#2244CC',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#14297a',
    castersBgColor:  '#000510',
    castersBgOpacity: 95,
  },
  spktrainer: {
    sbBgColor:       '#050005',
    sbBgOpacity:     95,
    eventTextColor:  '#FF2222',
    eventTextSize:   12,
    tagColor:        '#FF2222',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#991414',
    castersBgColor:  '#050005',
    castersBgOpacity: 95,
  },
  sdiddy: {
    sbBgColor:       '#0A0500',
    sbBgOpacity:     95,
    eventTextColor:  '#FF6600',
    eventTextSize:   12,
    tagColor:        '#FF6600',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#993d00',
    castersBgColor:  '#0A0500',
    castersBgOpacity: 95,
  },
  slucas: {
    sbBgColor:       '#000510',
    sbBgOpacity:     95,
    eventTextColor:  '#FFAA00',
    eventTextSize:   12,
    tagColor:        '#FFAA00',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#996600',
    castersBgColor:  '#000510',
    castersBgOpacity: 95,
  },
  ssonic: {
    sbBgColor:       '#000510',
    sbBgOpacity:     95,
    eventTextColor:  '#1E90FF',
    eventTextSize:   12,
    tagColor:        '#1E90FF',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#125699',
    castersBgColor:  '#000510',
    castersBgOpacity: 95,
  },
  sdedede: {
    sbBgColor:       '#000510',
    sbBgOpacity:     95,
    eventTextColor:  '#3366EE',
    eventTextSize:   12,
    tagColor:        '#3366EE',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#1f3d8f',
    castersBgColor:  '#000510',
    castersBgOpacity: 95,
  },
  solimar: {
    sbBgColor:       '#020A02',
    sbBgOpacity:     96,
    eventTextColor:  '#5AAA28',
    eventTextSize:   12,
    tagColor:        '#FFD700',
    nameColor:       '#E8F5E2',
    pronounsColor:   '#3A7020',
    castersBgColor:  '#020A02',
    castersBgOpacity: 96,
  },
  slucario: {
    sbBgColor:       '#000010',
    sbBgOpacity:     95,
    eventTextColor:  '#4488FF',
    eventTextSize:   12,
    tagColor:        '#4488FF',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#295299',
    castersBgColor:  '#000010',
    castersBgOpacity: 95,
  },
  srob: {
    sbBgColor:       '#050505',
    sbBgOpacity:     95,
    eventTextColor:  '#FF4444',
    eventTextSize:   12,
    tagColor:        '#FF4444',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#992929',
    castersBgColor:  '#050505',
    castersBgOpacity: 95,
  },
  stoonlink: {
    sbBgColor:       '#001505',
    sbBgOpacity:     95,
    eventTextColor:  '#55CC44',
    eventTextSize:   12,
    tagColor:        '#55CC44',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#337a29',
    castersBgColor:  '#001505',
    castersBgOpacity: 95,
  },
  swolf: {
    sbBgColor:       '#050510',
    sbBgOpacity:     95,
    eventTextColor:  '#8899AA',
    eventTextSize:   12,
    tagColor:        '#8899AA',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#525c66',
    castersBgColor:  '#050510',
    castersBgOpacity: 95,
  },
  svilager: {
    sbBgColor:       '#001505',
    sbBgOpacity:     95,
    eventTextColor:  '#88CC44',
    eventTextSize:   12,
    tagColor:        '#88CC44',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#527a29',
    castersBgColor:  '#001505',
    castersBgOpacity: 95,
  },
  smegaman: {
    sbBgColor:       '#000510',
    sbBgOpacity:     95,
    eventTextColor:  '#44AAFF',
    eventTextSize:   12,
    tagColor:        '#44AAFF',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#296699',
    castersBgColor:  '#000510',
    castersBgOpacity: 95,
  },
  swiifit: {
    sbBgColor:       '#050808',
    sbBgOpacity:     95,
    eventTextColor:  '#EEEEEE',
    eventTextSize:   12,
    tagColor:        '#EEEEEE',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#8f8f8f',
    castersBgColor:  '#050808',
    castersBgOpacity: 95,
  },
  srosalina: {
    sbBgColor:       '#000510',
    sbBgOpacity:     95,
    eventTextColor:  '#88AAFF',
    eventTextSize:   12,
    tagColor:        '#88AAFF',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#526699',
    castersBgColor:  '#000510',
    castersBgOpacity: 95,
  },
  slittlemac: {
    sbBgColor:       '#0A0500',
    sbBgOpacity:     95,
    eventTextColor:  '#88FF00',
    eventTextSize:   12,
    tagColor:        '#88FF00',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#529900',
    castersBgColor:  '#0A0500',
    castersBgOpacity: 95,
  },
  sgreninja: {
    sbBgColor:       '#000510',
    sbBgOpacity:     95,
    eventTextColor:  '#2244AA',
    eventTextSize:   12,
    tagColor:        '#2244AA',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#142966',
    castersBgColor:  '#000510',
    castersBgOpacity: 95,
  },
  spalutena: {
    sbBgColor:       '#050808',
    sbBgOpacity:     95,
    eventTextColor:  '#AAFFAA',
    eventTextSize:   12,
    tagColor:        '#AAFFAA',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#669966',
    castersBgColor:  '#050808',
    castersBgOpacity: 95,
  },
  spacman: {
    sbBgColor:       '#0A0900',
    sbBgOpacity:     95,
    eventTextColor:  '#FFD700',
    eventTextSize:   12,
    tagColor:        '#FFD700',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#998100',
    castersBgColor:  '#0A0900',
    castersBgOpacity: 95,
  },
  srobin: {
    sbBgColor:       '#050305',
    sbBgOpacity:     95,
    eventTextColor:  '#AA5500',
    eventTextSize:   12,
    tagColor:        '#AA5500',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#663300',
    castersBgColor:  '#050305',
    castersBgOpacity: 95,
  },
  sshulk: {
    sbBgColor:       '#060500',
    sbBgOpacity:     95,
    eventTextColor:  '#FFAA00',
    eventTextSize:   12,
    tagColor:        '#FFAA00',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#996600',
    castersBgColor:  '#060500',
    castersBgOpacity: 95,
  },
  sbowserjr: {
    sbBgColor:       '#080400',
    sbBgOpacity:     95,
    eventTextColor:  '#FF6600',
    eventTextSize:   12,
    tagColor:        '#FF6600',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#993d00',
    castersBgColor:  '#080400',
    castersBgOpacity: 95,
  },
  sduckhunt: {
    sbBgColor:       '#030A03',
    sbBgOpacity:     95,
    eventTextColor:  '#88AA44',
    eventTextSize:   12,
    tagColor:        '#88AA44',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#526629',
    castersBgColor:  '#030A03',
    castersBgOpacity: 95,
  },
  sryu: {
    sbBgColor:       '#080500',
    sbBgOpacity:     95,
    eventTextColor:  '#FF8822',
    eventTextSize:   12,
    tagColor:        '#FF8822',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#995214',
    castersBgColor:  '#080500',
    castersBgOpacity: 95,
  },
  sken: {
    sbBgColor:       '#0A0300',
    sbBgOpacity:     95,
    eventTextColor:  '#FF4400',
    eventTextSize:   12,
    tagColor:        '#FF4400',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#992900',
    castersBgColor:  '#0A0300',
    castersBgOpacity: 95,
  },
  scloud: {
    sbBgColor:       '#030508',
    sbBgOpacity:     95,
    eventTextColor:  '#4488FF',
    eventTextSize:   12,
    tagColor:        '#4488FF',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#295299',
    castersBgColor:  '#030508',
    castersBgOpacity: 95,
  },
  scorrin: {
    sbBgColor:       '#00050A',
    sbBgOpacity:     95,
    eventTextColor:  '#44CCCC',
    eventTextSize:   12,
    tagColor:        '#44CCCC',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#297a7a',
    castersBgColor:  '#00050A',
    castersBgOpacity: 95,
  },
  sbayonetta: {
    sbBgColor:       '#050505',
    sbBgOpacity:     95,
    eventTextColor:  '#FFCC00',
    eventTextSize:   12,
    tagColor:        '#FFCC00',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#997a00',
    castersBgColor:  '#050505',
    castersBgOpacity: 95,
  },
  sinkling: {
    sbBgColor:       '#05000A',
    sbBgOpacity:     95,
    eventTextColor:  '#FF6600',
    eventTextSize:   12,
    tagColor:        '#FF6600',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#993d00',
    castersBgColor:  '#05000A',
    castersBgOpacity: 95,
  },
  sridley: {
    sbBgColor:       '#050008',
    sbBgOpacity:     95,
    eventTextColor:  '#9900CC',
    eventTextSize:   12,
    tagColor:        '#9900CC',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#5c007a',
    castersBgColor:  '#050008',
    castersBgOpacity: 95,
  },
  ssimon: {
    sbBgColor:       '#080500',
    sbBgOpacity:     95,
    eventTextColor:  '#CC9900',
    eventTextSize:   12,
    tagColor:        '#CC9900',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#7a5c00',
    castersBgColor:  '#080500',
    castersBgOpacity: 95,
  },
  srichter: {
    sbBgColor:       '#030510',
    sbBgOpacity:     95,
    eventTextColor:  '#4477FF',
    eventTextSize:   12,
    tagColor:        '#4477FF',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#294799',
    castersBgColor:  '#030510',
    castersBgOpacity: 95,
  },
  skrool: {
    sbBgColor:       '#030A03',
    sbBgOpacity:     95,
    eventTextColor:  '#88CC00',
    eventTextSize:   12,
    tagColor:        '#88CC00',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#527a00',
    castersBgColor:  '#030A03',
    castersBgOpacity: 95,
  },
  sisabelle: {
    sbBgColor:       '#060A00',
    sbBgOpacity:     95,
    eventTextColor:  '#FFCC00',
    eventTextSize:   12,
    tagColor:        '#FFCC00',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#997a00',
    castersBgColor:  '#060A00',
    castersBgOpacity: 95,
  },
  sincineroar: {
    sbBgColor:       '#080005',
    sbBgOpacity:     95,
    eventTextColor:  '#FF4400',
    eventTextSize:   12,
    tagColor:        '#FF4400',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#992900',
    castersBgColor:  '#080005',
    castersBgOpacity: 95,
  },
  spiranha: {
    sbBgColor:       '#000A00',
    sbBgOpacity:     95,
    eventTextColor:  '#FF2222',
    eventTextSize:   12,
    tagColor:        '#FF2222',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#991414',
    castersBgColor:  '#000A00',
    castersBgOpacity: 95,
  },
  sjoker: {
    sbBgColor:       '#080505',
    sbBgOpacity:     95,
    eventTextColor:  '#FF2222',
    eventTextSize:   12,
    tagColor:        '#FF2222',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#991414',
    castersBgColor:  '#080505',
    castersBgOpacity: 95,
  },
  shero: {
    sbBgColor:       '#000510',
    sbBgOpacity:     95,
    eventTextColor:  '#FFAA00',
    eventTextSize:   12,
    tagColor:        '#FFAA00',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#996600',
    castersBgColor:  '#000510',
    castersBgOpacity: 95,
  },
  sbanjo: {
    sbBgColor:       '#050A05',
    sbBgOpacity:     95,
    eventTextColor:  '#CC8800',
    eventTextSize:   12,
    tagColor:        '#CC8800',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#7a5200',
    castersBgColor:  '#050A05',
    castersBgOpacity: 95,
  },
  sterry: {
    sbBgColor:       '#0A0000',
    sbBgOpacity:     95,
    eventTextColor:  '#FF2222',
    eventTextSize:   12,
    tagColor:        '#FF2222',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#991414',
    castersBgColor:  '#0A0000',
    castersBgOpacity: 95,
  },
  sbyleth: {
    sbBgColor:       '#030508',
    sbBgOpacity:     95,
    eventTextColor:  '#44BBAA',
    eventTextSize:   12,
    tagColor:        '#44BBAA',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#297066',
    castersBgColor:  '#030508',
    castersBgOpacity: 95,
  },
  sminmin: {
    sbBgColor:       '#0A0000',
    sbBgOpacity:     95,
    eventTextColor:  '#FF3333',
    eventTextSize:   12,
    tagColor:        '#FF3333',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#991f1f',
    castersBgColor:  '#0A0000',
    castersBgOpacity: 95,
  },
  ssteve: {
    sbBgColor:       '#030505',
    sbBgOpacity:     95,
    eventTextColor:  '#8B6914',
    eventTextSize:   12,
    tagColor:        '#8B6914',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#533f0c',
    castersBgColor:  '#030505',
    castersBgOpacity: 95,
  },
  ssephiroth: {
    sbBgColor:       '#050508',
    sbBgOpacity:     95,
    eventTextColor:  '#CCDDFF',
    eventTextSize:   12,
    tagColor:        '#CCDDFF',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#7a8599',
    castersBgColor:  '#050508',
    castersBgOpacity: 95,
  },
  spyra: {
    sbBgColor:       '#0A0200',
    sbBgOpacity:     95,
    eventTextColor:  '#FF4400',
    eventTextSize:   12,
    tagColor:        '#FF4400',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#992900',
    castersBgColor:  '#0A0200',
    castersBgOpacity: 95,
  },
  smythra: {
    sbBgColor:       '#0A0800',
    sbBgOpacity:     95,
    eventTextColor:  '#FFD700',
    eventTextSize:   12,
    tagColor:        '#FFD700',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#998100',
    castersBgColor:  '#0A0800',
    castersBgOpacity: 95,
  },
  skazuya: {
    sbBgColor:       '#080005',
    sbBgOpacity:     95,
    eventTextColor:  '#AA0000',
    eventTextSize:   12,
    tagColor:        '#AA0000',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#660000',
    castersBgColor:  '#080005',
    castersBgOpacity: 95,
  },
  ssora: {
    sbBgColor:       '#00051A',
    sbBgOpacity:     96,
    eventTextColor:  '#6BA8FF',
    eventTextSize:   13,
    tagColor:        '#FFC832',
    nameColor:       '#E8F2FF',
    pronounsColor:   '#4477BB',
    castersBgColor:  '#00051A',
    castersBgOpacity: 96,
  },
  smii_brawl: {
    sbBgColor:       '#080505',
    sbBgOpacity:     95,
    eventTextColor:  '#FF8822',
    eventTextSize:   12,
    tagColor:        '#FF8822',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#995214',
    castersBgColor:  '#080505',
    castersBgOpacity: 95,
  },
  smii_sword: {
    sbBgColor:       '#050508',
    sbBgOpacity:     95,
    eventTextColor:  '#AAAAFF',
    eventTextSize:   12,
    tagColor:        '#AAAAFF',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#666699',
    castersBgColor:  '#050508',
    castersBgOpacity: 95,
  },
  smii_gun: {
    sbBgColor:       '#050505',
    sbBgOpacity:     95,
    eventTextColor:  '#FF4444',
    eventTextSize:   12,
    tagColor:        '#FF4444',
    nameColor:       '#F0EEF8',
    pronounsColor:   '#992929',
    castersBgColor:  '#050505',
    castersBgOpacity: 95,
  },
};

function applyTheme(key) {
  // Thème transparent — pas de couleurs à appliquer, juste changer la clé
  if (key === 'transparent') {
    state.overlayTheme = 'transparent';
    emitState(buildStateFromForm());
    document.querySelectorAll('.theme-preset-card').forEach(c => {
      c.classList.toggle('active', c.dataset.theme === 'transparent');
    });
    const tpPanel = document.getElementById('transparent-pos-panel');
    if (tpPanel) tpPanel.style.display = 'block';
    showThemeConfigPanel('transparent');
    setStatus('Thème "Transparent" appliqué');
    return;
  }
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

  // Show/hide transparent position panel
  const tpPanel = document.getElementById('transparent-pos-panel');
  if (tpPanel) tpPanel.style.display = key === 'transparent' ? 'block' : 'none';

  // Show theme config panel
  showThemeConfigPanel(key);

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
  navigator.clipboard.writeText(getServerBase() + '/casters').then(() => {
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

// ── Transparent theme — position inputs ──────────────────────
(function() {
  function emitTpPositions() {
    const barYEl  = document.getElementById('tp-bar-y');
    const eventX  = document.getElementById('tp-event-x');
    const eventY  = document.getElementById('tp-event-y');
    state.transparentPositions = {
      barY:  parseInt(barYEl?.value  ?? 20),
      event: { x: parseInt(eventX?.value ?? 720), y: parseInt(eventY?.value ?? 0) },
    };
    emitState(buildStateFromForm());
  }

  // Slider ↔ number sync for barY
  const barYRange = document.getElementById('tp-bar-y-range');
  const barYNum   = document.getElementById('tp-bar-y');
  barYRange?.addEventListener('input', () => { barYNum.value = barYRange.value; emitTpPositions(); });
  barYNum?.addEventListener('input',   () => { barYRange.value = barYNum.value; emitTpPositions(); });

  document.getElementById('tp-event-x')?.addEventListener('input', emitTpPositions);
  document.getElementById('tp-event-y')?.addEventListener('input', emitTpPositions);

  socket.on('stateUpdate', function(s) {
    if (!s.transparentPositions) return;
    const pos = s.transparentPositions;
    const barYEl    = document.getElementById('tp-bar-y');
    const barYRange = document.getElementById('tp-bar-y-range');
    const eventX    = document.getElementById('tp-event-x');
    const eventY    = document.getElementById('tp-event-y');
    if (pos.barY != null && document.activeElement !== barYEl) {
      if (barYEl)    barYEl.value    = pos.barY;
      if (barYRange) barYRange.value = pos.barY;
    }
    if (pos.event) {
      if (eventX && document.activeElement !== eventX) eventX.value = pos.event.x;
      if (eventY && document.activeElement !== eventY) eventY.value = pos.event.y;
    }
    const tpPanel = document.getElementById('transparent-pos-panel');
    if (tpPanel && s.overlayTheme === 'transparent') tpPanel.style.display = 'block';
  });
})();

// ── Theme presets ─────────────────────────────────────────────

const THEME_PRESET_FIELDS = [
  'overlayTheme','overlayStyle',
  'sbBgColor','sbBgOpacity',
  'eventTextColor','eventTextSize',
  'tagColor','nameColor','pronounsColor',
  'sbScale','sbX','sbY',
  'particleOpacity','particleCountScale','particlesEnabled','logoParticleCount',
  'transparentPositions',
  'overlayTexture','overlayTextureOpacity','overlayTextureBlend','overlayTextureSize',
];

function buildThemePreset() {
  const s = buildStateFromForm();
  const preset = {};
  THEME_PRESET_FIELDS.forEach(k => { if (s[k] !== undefined) preset[k] = s[k]; });
  return preset;
}

function applyThemePreset(preset) {
  if (preset.overlayTheme !== undefined) {
    state.overlayTheme = preset.overlayTheme;
    applyTheme(preset.overlayTheme);
  }
  if (preset.overlayTexture !== undefined) {
    state.overlayTexture = preset.overlayTexture || null;
    updateTexturePreview(state.overlayTexture);
  }
  if (preset.overlayStyle !== undefined) {
    document.querySelectorAll('.overlay-style-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.style === preset.overlayStyle);
    });
  }
  const setInput = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
  setInput('sb-bg-color',    preset.sbBgColor);
  setInput('sb-bg-opacity',  preset.sbBgOpacity);
  setInput('event-text-color', preset.eventTextColor);
  setInput('event-text-size',  preset.eventTextSize);
  setInput('tag-color',      preset.tagColor);
  setInput('name-color',     preset.nameColor);
  setInput('pronouns-color', preset.pronounsColor);
  setInput('sb-scale-range', preset.sbScale);  setInput('sb-scale-num', preset.sbScale);
  setInput('sb-x-range',     preset.sbX);      setInput('sb-x-num', preset.sbX);
  setInput('sb-y-range',     preset.sbY);      setInput('sb-y-num', preset.sbY);
  setInput('particle-opacity-num',    preset.particleOpacity);
  setInput('particle-count-num',      preset.particleCountScale);
  if (preset.transparentPositions) {
    state.transparentPositions = preset.transparentPositions;
    const pos = preset.transparentPositions;
    if (pos.barY != null) {
      setInput('tp-bar-y', pos.barY);
      setInput('tp-bar-y-range', pos.barY);
    }
    if (pos.event) {
      setInput('tp-event-x', pos.event.x);
      setInput('tp-event-y', pos.event.y);
    }
  }
  emitState(buildStateFromForm());
}

function renderSavedThemePresets(list) {
  const container = document.getElementById('saved-theme-presets-list');
  if (!container) return;
  container.innerHTML = '';
  if (!list.length) {
    container.innerHTML = '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:8px">Aucun thème sauvegardé</div>';
    return;
  }
  list.forEach(({ name, preset }) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid var(--border)';

    const themeChip = document.createElement('span');
    themeChip.style.cssText = 'font-size:10px;color:var(--text-muted);background:var(--surface2);border-radius:3px;padding:1px 5px;flex-shrink:0';
    themeChip.textContent = preset.overlayTheme || 'default';

    const label = document.createElement('span');
    label.style.cssText = 'flex:1;font-size:12px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    label.textContent = name;

    const loadBtn = document.createElement('button');
    loadBtn.className = 'btn btn-outline btn-sm';
    loadBtn.textContent = 'Charger';
    loadBtn.addEventListener('click', () => {
      applyThemePreset(preset);
      setStatus(`Thème "${name}" chargé`);
    });

    const delBtn = document.createElement('button');
    delBtn.style.cssText = 'background:none;border:none;color:var(--danger);cursor:pointer;font-size:16px;line-height:1;padding:0 2px;flex-shrink:0';
    delBtn.textContent = '×';
    delBtn.addEventListener('click', () => {
      fetch(`/api/theme-presets/${encodeURIComponent(name)}`, { method: 'DELETE' })
        .then(r => r.json()).then(renderSavedThemePresets);
      setStatus(`Thème "${name}" supprimé`);
    });

    row.appendChild(themeChip);
    row.appendChild(label);
    row.appendChild(loadBtn);
    row.appendChild(delBtn);
    container.appendChild(row);
  });
}

document.getElementById('btn-theme-preset-save')?.addEventListener('click', () => {
  const name = document.getElementById('theme-preset-save-name').value.trim();
  if (!name) { setStatus('Nom requis pour enregistrer'); return; }
  fetch('/api/theme-presets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, preset: buildThemePreset() }),
  })
    .then(r => r.json())
    .then(list => {
      renderSavedThemePresets(list);
      document.getElementById('theme-preset-save-name').value = '';
      setStatus(`Thème "${name}" enregistré`);
    })
    .catch(err => setStatus('Erreur lors de la sauvegarde : ' + err.message));
});

fetch('/api/theme-presets')
  .then(r => r.json())
  .then(renderSavedThemePresets)
  .catch(() => {});

// ── Onglet Twitch Layout ──────────────────────────────────────────

// Copier l'URL de l'overlay
document.getElementById('btn-copy-twitch-url')?.addEventListener('click', () => {
  const input = document.getElementById('twitch-layout-url');
  if (!input) return;
  input.select();
  navigator.clipboard.writeText(input.value).then(() => {
    setStatus('URL copiée dans le presse-papiers');
  }).catch(() => {
    document.execCommand('copy');
    setStatus('URL copiée');
  });
});

// Mettre à jour l'URL avec le bon host/port au chargement
(function () {
  const input = document.getElementById('twitch-layout-url');
  if (input) input.value = window.location.origin + '/twitch-layout';
})();

// Sliders du cadre (coin size, épaisseur, opacité bg) → injectés via postMessage dans l'iframe
function sendTwitchOption(key, value) {
  const iframe = document.getElementById('twitch-layout-preview');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({ type: 'twitch-option', key, value }, '*');
  }
}

function syncTwitchSlider(rangeId, numId, cssVar, transform) {
  const range = document.getElementById(rangeId);
  const num   = document.getElementById(numId);
  if (!range || !num) return;
  const apply = (v) => {
    const val = transform ? transform(v) : v + 'px';
    sendTwitchOption(cssVar, val);
  };
  range.addEventListener('input', () => { num.value = range.value; apply(range.value); });
  num.addEventListener('input',   () => { range.value = num.value; apply(num.value);   });
}

syncTwitchSlider('tw-corner-size',  'tw-corner-size-num',  '--tw-corner-size',  v => v + 'px');
syncTwitchSlider('tw-corner-thick', 'tw-corner-thick-num', '--tw-corner-thick', v => v + 'px');
syncTwitchSlider('tw-bg-opacity',   'tw-bg-opacity-num',   '--tw-bg-opacity',   v => (v / 100).toFixed(2));

// Checkboxes de visibilité des éléments
const TW_CHECKBOXES = [
  { id: 'tw-show-corners',   selector: '.corner',       prop: 'display', on: 'block',  off: 'none'   },
  { id: 'tw-show-scanline',  selector: '.scan-line',    prop: 'display', on: 'block',  off: 'none'   },
  { id: 'tw-show-sidelines', selector: '.side-line',    prop: 'display', on: 'block',  off: 'none'   },
  { id: 'tw-show-glow',      selector: '.ambient-glow', prop: 'display', on: 'block',  off: 'none'   },
  { id: 'tw-show-chars',     selector: '.player-character', prop: 'display', on: 'block', off: 'none' },
  { id: 'tw-show-vs',        selector: '.bottom-bar',       prop: 'display', on: 'flex',  off: 'none' },
];

TW_CHECKBOXES.forEach(({ id, selector, prop, on, off }) => {
  const cb = document.getElementById(id);
  if (!cb) return;
  cb.addEventListener('change', () => {
    sendTwitchOption('selector-' + selector, cb.checked ? on : off);
  });
});

// ── Config Twitch viewers ─────────────────────────────────────────

// Mettre à jour l'URL viewer avec le bon host
(function () {
  const input = document.getElementById('twitch-viewer-url');
  if (input) input.value = window.location.origin + '/twitch-viewer';
})();

// Copier URL viewer
document.getElementById('btn-copy-viewer-url')?.addEventListener('click', () => {
  const input = document.getElementById('twitch-viewer-url');
  if (!input) return;
  navigator.clipboard.writeText(input.value).then(() => setStatus('URL viewers copiée')).catch(() => {
    input.select(); document.execCommand('copy'); setStatus('URL viewers copiée');
  });
});

// Charger la config Twitch au démarrage
fetch('/api/twitch/config')
  .then(r => r.json())
  .then(cfg => {
    const chEl = document.getElementById('tw-channel');
    const ciEl = document.getElementById('tw-client-id');
    if (chEl) chEl.value = cfg.channel || '';
    if (ciEl) ciEl.value = cfg.clientId || '';
    updateTwitchDisplay({ viewers: cfg.viewers, live: cfg.live });
  })
  .catch(() => {});

// Sauvegarder config
document.getElementById('btn-tw-save')?.addEventListener('click', () => {
  const channel      = document.getElementById('tw-channel')?.value.trim() || '';
  const clientId     = document.getElementById('tw-client-id')?.value.trim() || '';
  const clientSecret = document.getElementById('tw-client-secret')?.value || '';
  fetch('/api/twitch/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, clientId, clientSecret }),
  })
    .then(r => r.json())
    .then(() => setStatus('Config Twitch sauvegardée'))
    .catch(e => setStatus('Erreur : ' + e.message));
});

// Actualisation manuelle
document.getElementById('btn-tw-refresh')?.addEventListener('click', () => {
  fetch('/api/twitch/config')
    .then(r => r.json())
    .then(cfg => { updateTwitchDisplay({ viewers: cfg.viewers, live: cfg.live }); setStatus('Viewers actualisés'); })
    .catch(e => setStatus('Erreur : ' + e.message));
});

// Afficher le compteur dans le panneau
function updateTwitchDisplay({ viewers, live }) {
  const dot    = document.getElementById('tw-live-dot');
  const label  = document.getElementById('tw-live-label');
  const count  = document.getElementById('tw-viewer-count');
  if (!dot || !label || !count) return;

  if (live) {
    dot.style.background = '#FF0000';
    label.textContent    = 'EN DIRECT';
    label.style.color    = '#FF4444';
  } else {
    dot.style.background = '#555';
    label.textContent    = viewers === null ? '–' : 'HORS LIGNE';
    label.style.color    = 'var(--text-muted)';
  }

  if (viewers === null || viewers === undefined) {
    count.textContent = '–';
  } else if (viewers >= 1000) {
    count.textContent = (viewers / 1000).toFixed(1).replace('.0', '') + 'k';
  } else {
    count.textContent = String(viewers);
  }
}

// Mise à jour via Socket.IO
if (typeof socket !== 'undefined') {
  socket.on('twitch-viewers',     updateTwitchDisplay);
  socket.on('twitch-auth-status', applyTwitchAuthStatus);
  socket.on('youtube-auth-status', (data) => {
    if (typeof applyYouTubeConnectStatus === 'function') applyYouTubeConnectStatus(data);
  });
}

// ── Twitch OAuth broadcaster ──────────────────────────────────────

function applyTwitchAuthStatus(data) {
  // Propager au tab Connexions si chargé
  if (typeof applyTwitchConnectStatus === 'function') {
    try { applyTwitchConnectStatus(data); } catch(e) {}
  }
  const { authenticated, displayName } = data;
  const dot   = document.getElementById('tw-auth-dot');
  const label = document.getElementById('tw-auth-label');
  const btnLogin  = document.getElementById('btn-tw-login');
  const btnLogout = document.getElementById('btn-tw-logout');
  const subsCard  = document.getElementById('tw-subs-card');
  const predCard  = document.getElementById('tw-pred-card');
  if (!dot) return;
  if (authenticated) {
    dot.style.background = '#6bc96c';
    label.textContent    = `Connecté : ${displayName || ''}`;
    label.style.color    = '#6bc96c';
    btnLogin.style.display  = 'none';
    btnLogout.style.display = '';
    if (subsCard) subsCard.style.display = '';
    if (predCard) predCard.style.display = '';
  } else {
    dot.style.background = '#555';
    label.textContent    = 'Non connecté';
    label.style.color    = 'var(--text-muted)';
    btnLogin.style.display  = '';
    btnLogout.style.display = 'none';
    if (subsCard) subsCard.style.display = 'none';
    if (predCard) predCard.style.display = 'none';
  }
}

// Charger le statut auth au démarrage
fetch('/api/twitch/auth-status')
  .then(r => r.json())
  .then(applyTwitchAuthStatus)
  .catch(() => {});

// Connexion broadcaster
document.getElementById('btn-tw-login')?.addEventListener('click', () => {
  window.open('/auth/twitch', '_blank', 'width=600,height=700');
});

// Déconnexion
document.getElementById('btn-tw-logout')?.addEventListener('click', () => {
  fetch('/api/twitch/auth', { method: 'DELETE' })
    .then(() => applyTwitchAuthStatus({ authenticated: false }))
    .catch(e => setStatus('Erreur : ' + e.message));
});

// ── Abonnés ───────────────────────────────────────────────────────

function loadSubscribers() {
  const list  = document.getElementById('tw-subs-list');
  const total = document.getElementById('tw-subs-total');
  if (!list) return;
  list.innerHTML = '<span style="color:var(--text-muted);">Chargement…</span>';
  fetch('/api/twitch/subscribers')
    .then(r => r.json())
    .then(data => {
      if (data.error) { list.innerHTML = `<span style="color:#fc8181;">${data.error}</span>`; return; }
      const subs = data.data || [];
      if (total) total.textContent = data.total !== undefined ? `— ${data.total} abonnés` : '';
      if (!subs.length) { list.innerHTML = '<span style="color:var(--text-muted);">Aucun abonné.</span>'; return; }
      list.innerHTML = subs.map(s =>
        `<div style="display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:4px;background:var(--surface2);">
          <span style="flex:1;font-weight:500;">${s.user_name}</span>
          <span style="font-size:11px;color:var(--text-muted);">tier ${s.tier ? s.tier.charAt(0) : '?'}</span>
        </div>`
      ).join('');
    })
    .catch(e => { if (list) list.innerHTML = `<span style="color:#fc8181;">${e.message}</span>`; });
}

document.getElementById('btn-tw-subs-refresh')?.addEventListener('click', loadSubscribers);

// ── Prédictions ───────────────────────────────────────────────────

// Sync durée slider ↔ number
(function () {
  const range = document.getElementById('tw-pred-window');
  const num   = document.getElementById('tw-pred-window-num');
  if (!range || !num) return;
  range.addEventListener('input', () => { num.value = range.value; });
  num.addEventListener('input', () => { range.value = num.value; });
})();

let _activePredId = null;
let _activePredOutcomes = [];

function renderActivePrediction(pred) {
  const box     = document.getElementById('tw-pred-active');
  const title   = document.getElementById('tw-pred-active-title');
  const status  = document.getElementById('tw-pred-active-status');
  const outcomes = document.getElementById('tw-pred-outcomes');
  const btnLock = document.getElementById('btn-tw-pred-lock');
  if (!box) return;

  if (!pred) { box.style.display = 'none'; _activePredId = null; return; }

  _activePredId = pred.id;
  _activePredOutcomes = pred.outcomes || [];
  box.style.display = '';
  title.textContent  = pred.title;
  status.textContent = { ACTIVE: 'En cours', LOCKED: 'Verrouillé', RESOLVED: 'Terminé', CANCELED: 'Annulé' }[pred.status] || pred.status;

  const totalPoints = _activePredOutcomes.reduce((s, o) => s + (o.channel_points || 0), 0);
  outcomes.innerHTML = _activePredOutcomes.map(o => {
    const pct = totalPoints ? Math.round((o.channel_points || 0) / totalPoints * 100) : 0;
    const actionBtn = pred.status === 'LOCKED'
      ? `<button class="btn btn-outline btn-sm" style="font-size:11px;padding:2px 8px;" onclick="resolvePrediction('${o.id}')">Choisir</button>`
      : '';
    return `<div style="padding:6px 8px;background:var(--surface);border-radius:4px;display:flex;align-items:center;gap:8px;">
      <span style="flex:1;font-weight:500;">${o.title}</span>
      <span style="font-size:12px;color:var(--text-muted);">${pct}% · ${o.channel_points || 0} pts</span>
      ${actionBtn}
    </div>`;
  }).join('');

  if (btnLock) btnLock.style.display = pred.status === 'ACTIVE' ? '' : 'none';
}

function loadActivePrediction() {
  fetch('/api/twitch/predictions')
    .then(r => r.json())
    .then(data => {
      if (data.error) { setStatus('Prédictions : ' + data.error); return; }
      const active = (data.data || []).find(p => p.status === 'ACTIVE' || p.status === 'LOCKED');
      renderActivePrediction(active || null);
    })
    .catch(e => setStatus('Erreur prédictions : ' + e.message));
}

document.getElementById('btn-tw-pred-refresh')?.addEventListener('click', loadActivePrediction);

// Créer prédiction
document.getElementById('btn-tw-pred-create')?.addEventListener('click', () => {
  const title  = document.getElementById('tw-pred-title')?.value.trim();
  const o1     = document.getElementById('tw-pred-o1')?.value.trim();
  const o2     = document.getElementById('tw-pred-o2')?.value.trim();
  const window = Number(document.getElementById('tw-pred-window')?.value) || 120;
  if (!title || !o1 || !o2) { setStatus('Remplis la question et les 2 choix'); return; }
  fetch('/api/twitch/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, outcomes: [o1, o2], predictionWindow: window }),
  })
    .then(r => r.json())
    .then(data => {
      if (data.error) { setStatus('Erreur : ' + data.error); return; }
      const pred = data.data && data.data[0];
      if (pred) renderActivePrediction(pred);
      setStatus('Prédiction lancée !');
    })
    .catch(e => setStatus('Erreur : ' + e.message));
});

// Verrouiller
document.getElementById('btn-tw-pred-lock')?.addEventListener('click', () => {
  if (!_activePredId) return;
  fetch('/api/twitch/predictions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: _activePredId, status: 'LOCKED' }),
  })
    .then(r => r.json())
    .then(data => {
      const pred = data.data && data.data[0];
      if (pred) renderActivePrediction(pred);
      setStatus('Prédiction verrouillée');
    })
    .catch(e => setStatus('Erreur : ' + e.message));
});

// Annuler
document.getElementById('btn-tw-pred-cancel')?.addEventListener('click', () => {
  if (!_activePredId) return;
  if (!confirm('Annuler la prédiction ? Les points seront remboursés.')) return;
  fetch('/api/twitch/predictions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: _activePredId, status: 'CANCELED' }),
  })
    .then(r => r.json())
    .then(() => { renderActivePrediction(null); setStatus('Prédiction annulée'); })
    .catch(e => setStatus('Erreur : ' + e.message));
});

// Résoudre (appelé depuis le HTML dynamique)
window.resolvePrediction = function (outcomeId) {
  if (!_activePredId) return;
  fetch('/api/twitch/predictions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: _activePredId, status: 'RESOLVED', winning_outcome_id: outcomeId }),
  })
    .then(r => r.json())
    .then(() => { renderActivePrediction(null); setStatus('Prédiction résolue !'); })
    .catch(e => setStatus('Erreur : ' + e.message));
};

// ── Titre du stream ───────────────────────────────────────────────

// Fix URL
(function () {
  const el = document.getElementById('title-url');
  if (el) el.value = window.location.origin + '/stream-title';
})();

let titleLocal = {
  visible: false, title: '', subtitle: '', tag: 'LIVE',
  showTag: false, showSubtitle: true,
  position: 'tl', x: 60, y: 60,
  maxWidth: 700, fontSize: 38, fontSizeSub: 17,
  bgOpacity: 94, animation: 'slide', align: 'left',
};

function titleSend(patch) {
  if (patch) Object.assign(titleLocal, patch);
  fetch('/api/title', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(titleLocal),
  }).catch(e => setStatus('Erreur Titre : ' + e.message));
}

/* Mise à jour UI depuis état */
function updateTitleUI(s) {
  Object.assign(titleLocal, s);

  const btn = document.getElementById('btn-title-toggle');
  if (btn) {
    btn.textContent = s.visible ? '⏸ Masquer le titre' : '▶ Afficher le titre';
    btn.classList.toggle('btn-danger', !!s.visible);
    btn.classList.toggle('btn-primary', !s.visible);
  }

  function syncInput(id, val) {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) el.value = val;
  }
  function syncCheck(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  }

  syncInput('title-text-input', s.title || '');
  syncInput('title-sub-input',  s.subtitle || '');
  syncInput('title-tag-input',  s.tag || 'LIVE');
  syncCheck('title-showsub',    s.showSubtitle);
  syncCheck('title-showtag',    s.showTag);
  syncInput('title-x', s.x);
  syncInput('title-y', s.y);

  syncInput('title-fs-range',    s.fontSize);
  syncInput('title-fs-num',      s.fontSize);
  syncInput('title-fssub-range', s.fontSizeSub);
  syncInput('title-fssub-num',   s.fontSizeSub);
  syncInput('title-mw-range',    s.maxWidth);
  syncInput('title-mw-num',      s.maxWidth);
  syncInput('title-bg-range',    s.bgOpacity);
  syncInput('title-bg-num',      s.bgOpacity);

  document.querySelectorAll('.title-pos-btn').forEach(b =>
    b.classList.toggle('active-sep', b.dataset.pos === s.position));
  document.querySelectorAll('.title-align-btn').forEach(b =>
    b.classList.toggle('active-sep', b.dataset.align === s.align));
  document.querySelectorAll('.title-anim-btn').forEach(b =>
    b.classList.toggle('active-sep', b.dataset.anim === s.animation));
}

/* Charger l'état initial */
fetch('/api/title').then(r => r.json()).then(updateTitleUI).catch(() => {});

/* Bouton ON/OFF */
document.getElementById('btn-title-toggle')?.addEventListener('click', () => {
  titleLocal.visible = !titleLocal.visible;
  titleSend();
  updateTitleUI({ visible: titleLocal.visible });
});

/* Boutons position */
document.querySelectorAll('.title-pos-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    titleLocal.position = btn.dataset.pos;
    document.querySelectorAll('.title-pos-btn').forEach(b => b.classList.remove('active-sep'));
    btn.classList.add('active-sep');
    titleSend();
  });
});

/* Boutons tag preset */
document.querySelectorAll('.title-tag-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    const inp = document.getElementById('title-tag-input');
    if (inp) inp.value = btn.dataset.tag;
  });
});

/* Bouton Appliquer textes */
document.getElementById('btn-title-texts')?.addEventListener('click', () => {
  titleSend({
    title:        document.getElementById('title-text-input')?.value || '',
    subtitle:     document.getElementById('title-sub-input')?.value  || '',
    tag:          (document.getElementById('title-tag-input')?.value || 'LIVE').toUpperCase(),
    showSubtitle: document.getElementById('title-showsub')?.checked ?? true,
    showTag:      document.getElementById('title-showtag')?.checked ?? false,
  });
  setStatus('Textes mis à jour');
});

/* Boutons alignement */
document.querySelectorAll('.title-align-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.title-align-btn').forEach(b => b.classList.remove('active-sep'));
    btn.classList.add('active-sep');
    titleSend({ align: btn.dataset.align });
  });
});

/* Boutons animation */
document.querySelectorAll('.title-anim-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.title-anim-btn').forEach(b => b.classList.remove('active-sep'));
    btn.classList.add('active-sep');
    titleSend({ animation: btn.dataset.anim });
  });
});

/* Sliders synchro (range ↔ number) */
(function () {
  const pairs = [
    ['title-fs-range',    'title-fs-num',    'fontSize'],
    ['title-fssub-range', 'title-fssub-num', 'fontSizeSub'],
    ['title-mw-range',    'title-mw-num',    'maxWidth'],
    ['title-bg-range',    'title-bg-num',    'bgOpacity'],
  ];
  pairs.forEach(([rid, nid, key]) => {
    const range = document.getElementById(rid);
    const num   = document.getElementById(nid);
    if (!range || !num) return;
    let _t = null;
    function onVal(v) {
      clearTimeout(_t);
      _t = setTimeout(() => titleSend({ [key]: Number(v) }), 250);
    }
    range.addEventListener('input', () => { num.value = range.value; onVal(range.value); });
    num.addEventListener('input',   () => { range.value = num.value; onVal(num.value); });
  });

  /* Position X/Y custom */
  ['title-x', 'title-y'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => {
      titleSend({
        x: Number(document.getElementById('title-x')?.value || 60),
        y: Number(document.getElementById('title-y')?.value || 60),
      });
    });
  });
})();

/* Bouton Appliquer style */
document.getElementById('btn-title-style')?.addEventListener('click', () => {
  titleSend({
    fontSize:    Number(document.getElementById('title-fs-num')?.value    || 38),
    fontSizeSub: Number(document.getElementById('title-fssub-num')?.value || 17),
    maxWidth:    Number(document.getElementById('title-mw-num')?.value    || 700),
    bgOpacity:   Number(document.getElementById('title-bg-num')?.value    || 94),
  });
  setStatus('Style mis à jour');
});

/* Copier URL */
document.getElementById('btn-copy-title-url')?.addEventListener('click', () => {
  const el = document.getElementById('title-url');
  if (!el) return;
  navigator.clipboard.writeText(el.value)
    .then(() => setStatus('URL titre copiée'))
    .catch(() => { el.select(); document.execCommand('copy'); setStatus('URL titre copiée'); });
});

// ── Bandeau / Ticker ──────────────────────────────────────────────

// Corriger l'URL avec le bon host
(function () {
  const el = document.getElementById('ticker-url');
  if (el) el.value = window.location.origin + '/ticker';
})();

// État local du ticker
let tickerLocal = {
  visible: false, position: 'bottom', label: 'INFO',
  separator: '◆', speed: 80, messages: [],
};

function tickerSend(patch) {
  Object.assign(tickerLocal, patch);
  fetch('/api/ticker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tickerLocal),
  }).catch(e => setStatus('Erreur bandeau : ' + e.message));
}

function updateTickerUI(s) {
  tickerLocal = Object.assign(tickerLocal, s);

  // Bouton toggle
  const btn = document.getElementById('btn-ticker-toggle');
  if (btn) {
    btn.textContent = s.visible ? '⏸ Masquer le bandeau' : '▶ Afficher le bandeau';
    btn.classList.toggle('btn-danger', !!s.visible);
    btn.classList.toggle('btn-primary', !s.visible);
  }

  // Position buttons
  document.querySelectorAll('.ticker-pos-btn').forEach(b => {
    b.classList.toggle('active-sep', b.dataset.pos === s.position);
  });

  // Label
  const labelEl = document.getElementById('ticker-label');
  if (labelEl && document.activeElement !== labelEl) labelEl.value = s.label || 'INFO';

  // Messages
  const ta = document.getElementById('ticker-messages');
  if (ta && document.activeElement !== ta) ta.value = (s.messages || []).join('\n');
  updateMsgCount(s.messages || []);

  // Speed
  const sr = document.getElementById('ticker-speed-range');
  const sn = document.getElementById('ticker-speed-num');
  if (sr && document.activeElement !== sr) sr.value = s.speed || 80;
  if (sn && document.activeElement !== sn) sn.value = s.speed || 80;

  // Séparateurs
  document.querySelectorAll('.ticker-sep-btn').forEach(b => {
    b.classList.toggle('active-sep', b.dataset.sep === s.separator);
  });
}

function updateMsgCount(msgs) {
  const el = document.getElementById('ticker-msg-count');
  if (el) el.textContent = `${msgs.filter(m => m.trim()).length} message(s)`;
}

// Charger l'état initial
fetch('/api/ticker').then(r => r.json()).then(updateTickerUI).catch(() => {});

// Bouton ON/OFF
document.getElementById('btn-ticker-toggle')?.addEventListener('click', () => {
  tickerSend({ visible: !tickerLocal.visible });
  updateTickerUI({ visible: !tickerLocal.visible });
});

// Boutons position
document.querySelectorAll('.ticker-pos-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    tickerSend({ position: btn.dataset.pos });
    updateTickerUI({ position: btn.dataset.pos });
  });
});

// Enregistrer messages
document.getElementById('btn-ticker-save')?.addEventListener('click', () => {
  const ta = document.getElementById('ticker-messages');
  const msgs = ta ? ta.value.split('\n').map(l => l.trim()).filter(Boolean) : [];
  const label = (document.getElementById('ticker-label')?.value || 'INFO').toUpperCase();
  tickerSend({ messages: msgs, label });
  updateMsgCount(msgs);
  setStatus('Bandeau mis à jour');
});

// Textarea : compter messages en temps réel
document.getElementById('ticker-messages')?.addEventListener('input', () => {
  const ta = document.getElementById('ticker-messages');
  updateMsgCount(ta.value.split('\n'));
});

// Boutons séparateur
document.querySelectorAll('.ticker-sep-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ticker-sep-btn').forEach(b => b.classList.remove('active-sep'));
    btn.classList.add('active-sep');
    tickerSend({ separator: btn.dataset.sep });
  });
});
// Séparateur custom
document.getElementById('ticker-sep-custom')?.addEventListener('change', function () {
  if (!this.value) return;
  document.querySelectorAll('.ticker-sep-btn').forEach(b => b.classList.remove('active-sep'));
  tickerSend({ separator: this.value });
});

// Vitesse
(function () {
  const range = document.getElementById('ticker-speed-range');
  const num   = document.getElementById('ticker-speed-num');
  if (!range || !num) return;
  let _debounce = null;
  function onSpeed(v) {
    clearTimeout(_debounce);
    _debounce = setTimeout(() => tickerSend({ speed: Number(v) }), 300);
  }
  range.addEventListener('input', () => { num.value = range.value; onSpeed(range.value); });
  num.addEventListener('input',   () => { range.value = num.value; onSpeed(num.value); });
})();

// Copier URL
document.getElementById('btn-copy-ticker-url')?.addEventListener('click', () => {
  const el = document.getElementById('ticker-url');
  if (!el) return;
  navigator.clipboard.writeText(el.value).then(() => setStatus('URL bandeau copiée')).catch(() => {
    el.select(); document.execCommand('copy'); setStatus('URL bandeau copiée');
  });
});

// ── Cadres (Frames) ───────────────────────────────────────────────

// Corriger URL avec le bon host
(function () {
  const el = document.getElementById('frames-url');
  if (el) el.value = window.location.origin + '/frames';
})();

let framesLocal = {
  count: 1,
  frames: [
    { visible: true, x: 40,  y: 40,  width: 560, height: 420, label: '', showBg: false },
    { visible: true, x: 640, y: 40,  width: 560, height: 420, label: '', showBg: false },
    { visible: true, x: 640, y: 500, width: 560, height: 420, label: '', showBg: false },
    { visible: true, x: 40,  y: 500, width: 560, height: 315, label: '', showBg: false },
    { visible: true, x: 1300,y: 40,  width: 560, height: 315, label: '', showBg: false },
    { visible: true, x: 1300,y: 420, width: 560, height: 315, label: '', showBg: false },
  ],
};

// ── Cam overlay ───────────────────────────────────────────────
(function () {
  let camLocal = {
    visible: false, width: 360, height: 270, offsetX: 0, offsetY: 40, label: 'CAM', showLabel: true,
    infoVisible: false, infoPlayer: 'p1', infoPosition: 'below',
    infoFields: { tag: true, name: true, pronouns: false, seed: false, social: false, character: false },
    infoFontSize: 13, infoBgOpacity: 85,
  };

  function camSend(patch) {
    if (patch) Object.assign(camLocal, patch);
    fetch('/api/cam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(camLocal),
    });
  }

  function camSetInput(id, val) {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) el.value = val;
  }

  // Sync depuis le serveur
  socket.on('camUpdate', (s) => {
    camLocal = { ...camLocal, ...s };
    const vis = document.getElementById('cam-visible');
    if (vis) vis.checked = !!s.visible;
    const sl = document.getElementById('cam-show-label');
    if (sl) sl.checked = !!s.showLabel;
    camSetInput('cam-width-range',  s.width);   camSetInput('cam-width-num',  s.width);
    camSetInput('cam-height-range', s.height);  camSetInput('cam-height-num', s.height);
    camSetInput('cam-x-range',      s.offsetX); camSetInput('cam-x-num',      s.offsetX);
    camSetInput('cam-y-range',      s.offsetY); camSetInput('cam-y-num',      s.offsetY);
    camSetInput('cam-label-text',   s.label);
    // Info joueur sync
    const iv = document.getElementById('cam-info-visible');
    if (iv) iv.checked = !!s.infoVisible;
    if (s.infoPlayer) {
      document.querySelectorAll('.cam-info-player-btn').forEach(b => b.classList.toggle('active', b.dataset.player === s.infoPlayer));
    }
    if (s.infoPosition) {
      document.querySelectorAll('.cam-info-pos-btn').forEach(b => b.classList.toggle('active', b.dataset.pos === s.infoPosition));
    }
    if (s.infoFields) {
      Object.entries(s.infoFields).forEach(([k, v]) => {
        const cb = document.getElementById('cam-field-' + k);
        if (cb) cb.checked = !!v;
      });
    }
    if (s.infoFontSize != null) { camSetInput('cam-info-fs-range', s.infoFontSize); camSetInput('cam-info-fs-num', s.infoFontSize); }
    if (s.infoBgOpacity != null) { camSetInput('cam-info-bg-range', s.infoBgOpacity); camSetInput('cam-info-bg-num', s.infoBgOpacity); }
  });

  // Visibilité
  document.getElementById('cam-visible')?.addEventListener('change', (e) => {
    camSend({ visible: e.target.checked });
  });

  // Label show/hide
  document.getElementById('cam-show-label')?.addEventListener('change', (e) => {
    camSend({ showLabel: e.target.checked });
  });

  // Texte label
  document.getElementById('cam-label-text')?.addEventListener('input', (e) => {
    camSend({ label: e.target.value });
  });

  // Sliders taille + position
  [
    ['cam-width',  'width',   true],
    ['cam-height', 'height',  true],
    ['cam-x',      'offsetX', false],
    ['cam-y',      'offsetY', false],
  ].forEach(([base, key, positive]) => {
    const range = document.getElementById(base + '-range');
    const num   = document.getElementById(base + '-num');
    if (!range || !num) return;
    function sync(val) {
      range.value = val; num.value = val;
      camSend({ [key]: Number(val) });
    }
    range.addEventListener('input', () => sync(range.value));
    num.addEventListener('input',   () => sync(num.value));
  });

  // Presets taille
  document.querySelectorAll('.cam-preset-size').forEach(btn => {
    btn.addEventListener('click', () => {
      const w = parseInt(btn.dataset.w), h = parseInt(btn.dataset.h);
      camSetInput('cam-width-range', w);  camSetInput('cam-width-num', w);
      camSetInput('cam-height-range', h); camSetInput('cam-height-num', h);
      camSend({ width: w, height: h });
    });
  });

  // Presets position
  document.getElementById('cam-pos-center')?.addEventListener('click', () => {
    camSetInput('cam-x-range', 0); camSetInput('cam-x-num', 0);
    camSetInput('cam-y-range', 40); camSetInput('cam-y-num', 40);
    camSend({ offsetX: 0, offsetY: 40 });
  });
  document.getElementById('cam-pos-left')?.addEventListener('click', () => {
    const w = camLocal.width || 360;
    const x = -(960 - w / 2 - 20);
    camSetInput('cam-x-range', x); camSetInput('cam-x-num', x);
    camSetInput('cam-y-range', 40); camSetInput('cam-y-num', 40);
    camSend({ offsetX: x, offsetY: 40 });
  });
  document.getElementById('cam-pos-right')?.addEventListener('click', () => {
    const w = camLocal.width || 360;
    const x = 960 - w / 2 - 20;
    camSetInput('cam-x-range', x); camSetInput('cam-x-num', x);
    camSetInput('cam-y-range', 40); camSetInput('cam-y-num', 40);
    camSend({ offsetX: x, offsetY: 40 });
  });

  // ── Infos joueur ─────────────────────────────────────────────
  document.getElementById('cam-info-visible')?.addEventListener('change', (e) => {
    camSend({ infoVisible: e.target.checked });
  });

  document.querySelectorAll('.cam-info-player-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cam-info-player-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      camSend({ infoPlayer: btn.dataset.player });
    });
  });

  document.querySelectorAll('.cam-info-pos-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cam-info-pos-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      camSend({ infoPosition: btn.dataset.pos });
    });
  });

  ['tag','name','pronouns','seed','social','character'].forEach(field => {
    document.getElementById('cam-field-' + field)?.addEventListener('change', (e) => {
      camLocal.infoFields = { ...camLocal.infoFields, [field]: e.target.checked };
      camSend({ infoFields: camLocal.infoFields });
    });
  });

  (function() {
    const range = document.getElementById('cam-info-fs-range');
    const num   = document.getElementById('cam-info-fs-num');
    if (!range || !num) return;
    function sync(val) { range.value = val; num.value = val; camSend({ infoFontSize: Number(val) }); }
    range.addEventListener('input', () => sync(range.value));
    num.addEventListener('input',   () => sync(num.value));
  })();

  (function() {
    const range = document.getElementById('cam-info-bg-range');
    const num   = document.getElementById('cam-info-bg-num');
    if (!range || !num) return;
    function sync(val) { range.value = val; num.value = val; camSend({ infoBgOpacity: Number(val) }); }
    range.addEventListener('input', () => sync(range.value));
    num.addEventListener('input',   () => sync(num.value));
  })();
})();

function framesSend(patch) {
  if (patch) Object.assign(framesLocal, patch);
  fetch('/api/frames', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(framesLocal),
  }).catch(e => setStatus('Erreur cadres : ' + e.message));
}

function framesUpdateCards(count) {
  document.querySelectorAll('.frame-card').forEach((card, i) => {
    card.style.display = i < count ? '' : 'none';
  });
  document.querySelectorAll('.frames-count-btn').forEach(b => {
    b.classList.toggle('active-sep', Number(b.dataset.count) === count);
  });
}

function updateFramesUI(s) {
  framesLocal = Object.assign(framesLocal, s);
  framesUpdateCards(s.count || 1);
  (s.frames || []).forEach((f, idx) => {
    function setVal(sel, val) {
      const el = document.querySelector(sel + `[data-idx="${idx}"]`);
      if (el && document.activeElement !== el) el.value = val;
    }
    function setChecked(sel, val) {
      const el = document.querySelector(sel + `[data-idx="${idx}"]`);
      if (el) el.checked = !!val;
    }
    setVal('.frame-x', f.x);
    setVal('.frame-y', f.y);
    setVal('.frame-w', f.width);
    setVal('.frame-h', f.height);
    const sliderEl = document.querySelector(`.frame-w[data-idx="${idx}"]`);
    if (sliderEl && f.width) sliderEl.dataset.ratio = (f.height || 1) / f.width;
    setVal('.frame-label', f.label);
    setChecked('.frame-visible-toggle', f.visible);
    setChecked('.frame-showbg', f.showBg);
  });
}

// Charger l'état initial
fetch('/api/frames').then(r => r.json()).then(updateFramesUI).catch(() => {});

// Boutons count
document.querySelectorAll('.frames-count-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const count = Number(btn.dataset.count);
    framesLocal.count = count;
    framesUpdateCards(count);
    framesSend();
  });
});

// Applique un cadre en temps réel
function applyFrameCard(idx) {
  const get = (sel) => {
    const el = document.querySelector(sel + `[data-idx="${idx}"]`);
    return el ? el.value : '';
  };
  const getChecked = (sel) => {
    const el = document.querySelector(sel + `[data-idx="${idx}"]`);
    return el ? el.checked : false;
  };
  framesLocal.frames[idx] = {
    visible: getChecked('.frame-visible-toggle'),
    x:       Number(get('.frame-x')),
    y:       Number(get('.frame-y')),
    width:   Number(get('.frame-w')),
    height:  Number(get('.frame-h')),
    label:   get('.frame-label'),
    showBg:  getChecked('.frame-showbg'),
  };
  framesSend();
}

// Boutons Appliquer (conservés pour compatibilité)
document.querySelectorAll('.frame-save-btn').forEach(btn => {
  btn.addEventListener('click', () => applyFrameCard(Number(btn.dataset.idx)));
});

// Inputs en temps réel
['.frame-x', '.frame-y'].forEach(sel => {
  document.querySelectorAll(sel).forEach(el => {
    el.addEventListener('input', () => applyFrameCard(Number(el.dataset.idx)));
  });
});
['.frame-label'].forEach(sel => {
  document.querySelectorAll(sel).forEach(el => {
    el.addEventListener('input', () => applyFrameCard(Number(el.dataset.idx)));
  });
});
['.frame-visible-toggle', '.frame-showbg'].forEach(sel => {
  document.querySelectorAll(sel).forEach(el => {
    el.addEventListener('change', () => applyFrameCard(Number(el.dataset.idx)));
  });
});

// Boutons ratio
document.querySelectorAll('.frame-ratio-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = Number(btn.dataset.idx);
    const [rw, rh] = btn.dataset.ratio.split('/').map(Number);
    const wEl = document.querySelector(`.frame-w[data-idx="${idx}"]`);
    const hEl = document.querySelector(`.frame-h[data-idx="${idx}"]`);
    if (!wEl || !hEl) return;
    const w = Number(wEl.value) || 560;
    hEl.value = Math.round(w * rh / rw);
    wEl.dataset.ratio = rh / rw;
    applyFrameCard(idx);
  });
});

// Slider Taille : met à jour hauteur puis applique
document.querySelectorAll('.frame-w[type="range"]').forEach(range => {
  const idx = Number(range.dataset.idx);
  const hEl = document.querySelector(`.frame-h[data-idx="${idx}"]`);
  range.addEventListener('input', () => {
    if (hEl) {
      const ratio = parseFloat(range.dataset.ratio) || 0.75;
      hEl.value = Math.round(Number(range.value) * ratio);
    }
    applyFrameCard(idx);
  });
});

// Presets disposition (x/y = centre du cadre)
const PRESETS = {
  'preset-cam-bl': {
    count: 1,
    frames: [{ visible:true, x:240,  y:853, width:400, height:225, label:'', showBg:false }],
  },
  'preset-cam-bc': {
    count: 1,
    frames: [{ visible:true, x:960,  y:928, width:400, height:225, label:'', showBg:false }],
  },
  'preset-cam-br': {
    count: 1,
    frames: [{ visible:true, x:1680, y:853, width:400, height:225, label:'', showBg:false }],
  },
  'preset-2side': {
    count: 2,
    frames: [
      { visible:true, x:480,  y:436, width:840, height:472, label:'', showBg:false },
      { visible:true, x:1440, y:436, width:840, height:472, label:'', showBg:false },
    ],
  },
  'preset-3col': {
    count: 3,
    frames: [
      { visible:true, x:340,  y:398, width:560, height:315, label:'', showBg:false },
      { visible:true, x:960,  y:398, width:560, height:315, label:'', showBg:false },
      { visible:true, x:1580, y:398, width:560, height:315, label:'', showBg:false },
    ],
  },
  'preset-4grid': {
    count: 4,
    frames: [
      { visible:true, x:490,  y:293, width:900, height:506, label:'', showBg:false },
      { visible:true, x:1430, y:293, width:900, height:506, label:'', showBg:false },
      { visible:true, x:490,  y:827, width:900, height:506, label:'', showBg:false },
      { visible:true, x:1430, y:827, width:900, height:506, label:'', showBg:false },
    ],
  },
  'preset-6grid': {
    count: 6,
    frames: [
      { visible:true, x:340,  y:209, width:600, height:337, label:'', showBg:false },
      { visible:true, x:960,  y:209, width:600, height:337, label:'', showBg:false },
      { visible:true, x:1580, y:209, width:600, height:337, label:'', showBg:false },
      { visible:true, x:340,  y:589, width:600, height:337, label:'', showBg:false },
      { visible:true, x:960,  y:589, width:600, height:337, label:'', showBg:false },
      { visible:true, x:1580, y:589, width:600, height:337, label:'', showBg:false },
    ],
  },
};

Object.keys(PRESETS).forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => {
    const p = PRESETS[id];
    // Fusionner : on écrase les cadres concernés
    p.frames.forEach((f, i) => { framesLocal.frames[i] = Object.assign({}, framesLocal.frames[i], f); });
    framesLocal.count = p.count;
    updateFramesUI(framesLocal);
    framesSend();
    setStatus('Disposition appliquée');
  });
});

// Copier URL
document.getElementById('btn-copy-frames-url')?.addEventListener('click', () => {
  const el = document.getElementById('frames-url');
  if (!el) return;
  navigator.clipboard.writeText(el.value)
    .then(() => setStatus('URL cadres copiée'))
    .catch(() => { el.select(); document.execCommand('copy'); setStatus('URL cadres copiée'); });
});

// ── Studio / Super Overlay ────────────────────────────────────────

// Fix URL
(function () {
  const el = document.getElementById('super-url');
  if (el) el.value = window.location.origin + '/super-overlay';
})();

/* Couleur associée à chaque calque */
const LAYER_COLORS = {
  'overlay':            '#E8B830',
  'stageveto':          '#00F5FF',
  'casters':            '#FF6EC7',
  'vs-screen':          '#4488FF',
  'player-stats':       '#6BC96C',
  'twitch-layout':      '#FF8C00',
  'twitch-viewer':      '#9B59D0',
  'twitch-chat':        '#B065E8',
  'ticker':             '#FF4500',
  'frames':             '#29B6F6',
  'cam':                '#20C9A0',
  'stream-title':       '#A8FF78',
  'h2h':                '#FFD700',
  'tournament-history': '#FF218C',
};

// État complet multi-scènes (synchronisé depuis le serveur)
let superFullState = { activeScene: 0, scenes: [] };
// Vue locale de la scène active (utilisée par renderLayerList/renderCanvas)
let superLocal = { bgColor: 'transparent', layers: [] };
let studioScale = 0.5;

/* ── Scène active → superLocal ─────────────────────────────── */
function syncSceneToLocal() {
  const scene = superFullState.scenes[superFullState.activeScene];
  if (!scene) return;
  superLocal.bgColor = scene.bgColor;
  superLocal.layers  = scene.layers; // inclut snapshot si présent
}

/* ── Rendu du sélecteur de scènes ──────────────────────────── */
function renderSceneButtons() {
  const container = document.getElementById('studio-scene-btns');
  if (!container) return;
  container.innerHTML = '';
  superFullState.scenes.forEach((scene, i) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm scene-select-btn' + (i === superFullState.activeScene ? ' btn-primary' : ' btn-outline');
    btn.dataset.idx = i;
    btn.title = 'Double-clic pour renommer';
    btn.innerHTML = `<span style="font-size:10px;color:inherit;opacity:0.6;display:block;line-height:1">${i + 1}</span><span style="font-size:11px;font-weight:600;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">${scene.name}</span>`;
    btn.addEventListener('click', () => switchScene(i));
    btn.addEventListener('dblclick', () => startRename(i));
    container.appendChild(btn);
  });
}

function switchScene(idx) {
  if (idx === superFullState.activeScene) return;
  superFullState.activeScene = idx;
  syncSceneToLocal();
  renderSceneButtons();
  renderLayerList();
  renderCanvas();
  renderLayerControls();
  // Sync fond
  document.querySelectorAll('.so-bg-preset').forEach(btn => {
    btn.classList.toggle('active-sep', btn.dataset.bg === superLocal.bgColor);
  });
  fetch(`/api/super/scene/${idx}`, { method: 'POST' }).catch(() => {});
}

function startRename(idx) {
  const row   = document.getElementById('studio-scene-rename-row');
  const input = document.getElementById('studio-scene-name-input');
  if (!row || !input) return;
  input.value = superFullState.scenes[idx].name;
  input.dataset.idx = idx;
  row.style.display = 'flex';
  input.focus();
  input.select();
}

document.getElementById('btn-scene-rename-ok')?.addEventListener('click', () => {
  const input = document.getElementById('studio-scene-name-input');
  const row   = document.getElementById('studio-scene-rename-row');
  if (!input) return;
  const idx  = parseInt(input.dataset.idx);
  const name = input.value.trim() || `Scène ${idx + 1}`;
  superFullState.scenes[idx].name = name;
  row.style.display = 'none';
  renderSceneButtons();
  fetch(`/api/super/scene/${idx}/name`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }).catch(() => {});
});
document.getElementById('btn-scene-rename-cancel')?.addEventListener('click', () => {
  const row = document.getElementById('studio-scene-rename-row');
  if (row) row.style.display = 'none';
});

/* ── Envoi au serveur ────────────────────────────────────────── */
let _superDebounce = null;
function superSend() {
  clearTimeout(_superDebounce);
  _superDebounce = setTimeout(() => {
    fetch('/api/super', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(superLocal),
    }).catch(e => setStatus('Erreur Studio : ' + e.message));
  }, 120);
}

/* ── Calcul du scale selon la largeur du container ──────────── */
function recalcStudioScale() {
  const container = document.getElementById('studio-canvas-container');
  const wrap      = document.getElementById('studio-canvas-wrap');
  const inner     = document.getElementById('studio-canvas-inner');
  if (!container || !wrap || !inner) return;

  const availW  = container.offsetWidth;
  studioScale   = Math.min(availW / 1920, 1);

  wrap.style.width  = (1920 * studioScale) + 'px';
  wrap.style.height = (1080 * studioScale) + 'px';
  inner.style.transform = `scale(${studioScale})`;
}

// Overlays qui supportent les snapshots
const SNAPSHOT_SUPPORTED = new Set([
  'overlay','cam','ticker','stream-title','frames',
  'player-stats','tournament-history','twitch-chat'
]);

/* ── Rendu de la liste de calques ──────────────────────────── */
function renderLayerList() {
  const list = document.getElementById('studio-layer-list');
  if (!list) return;

  const sorted = superLocal.layers.slice().sort((a, b) => a.order - b.order);
  list.innerHTML = '';

  sorted.forEach(layer => {
    const color = LAYER_COLORS[layer.id] || '#888';
    const hasSnap = !!layer.snapshot;
    const canSnap = SNAPSHOT_SUPPORTED.has(layer.id);
    const li = document.createElement('li');
    li.className   = 'studio-layer-item' + (layer.visible ? '' : ' sli-disabled');
    li.draggable   = true;
    li.dataset.id  = layer.id;

    const snapBtns = canSnap ? `
      <button class="btn btn-sm sli-snap-btn ${hasSnap ? 'sli-snap-saved' : 'sli-snap-empty'}"
        data-id="${layer.id}"
        title="Shift+clic pour supprimer le snapshot">
        ${hasSnap ? '💾 Sauvegardé' : '💾 Sauvegarder'}
      </button>
    ` : '';

    li.innerHTML = `
      <span class="sli-drag" title="Glisser pour réordonner">⠿</span>
      <span class="sli-dot" style="background:${color}"></span>
      <label class="sli-vis-wrap" title="Visible dans le Super Overlay">
        <input type="checkbox" class="sli-vis" data-id="${layer.id}" ${layer.visible ? 'checked' : ''} />
        <span style="font-size:11px;">${layer.visible ? 'ON' : 'OFF'}</span>
      </label>
      <span class="sli-name">${layer.label}</span>
      <span class="sli-snap-wrap">${snapBtns}</span>
    `;

    list.appendChild(li);
  });

  bindListDrag();
  bindVisToggles();
  bindSnapButtons();
}

function bindSnapButtons() {
  document.querySelectorAll('.sli-snap-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id       = btn.dataset.id;
      const sceneIdx = superFullState.activeScene;
      btn.disabled   = true;

      try {
        if (e.shiftKey) {
          const r = await fetch(`/api/super/scene/${sceneIdx}/layer/${id}/snapshot`, { method: 'DELETE' });
          if (!r.ok) throw new Error((await r.json()).error || r.statusText);
          setStatus(`Snapshot supprimé — ${id}`);
        } else {
          btn.textContent = '⏳';
          const r = await fetch(`/api/super/scene/${sceneIdx}/layer/${id}/snapshot`, { method: 'POST' });
          if (!r.ok) throw new Error((await r.json()).error || r.statusText);
          setStatus(`💾 Snapshot sauvegardé — ${id}`);
        }
      } catch (err) {
        setStatus(`Erreur snapshot : ${err.message}`);
      }
      btn.disabled = false;
    });
  });
}

function saveLayerSnapshot(id) {
  const sceneIdx = superFullState.activeScene;
  fetch(`/api/super/scene/${sceneIdx}/layer/${id}/snapshot`, { method: 'POST' })
    .then(r => r.json())
    .then(d => { if (d.error) setStatus('Erreur : ' + d.error); else setStatus(`💾 Snapshot sauvegardé — ${id}`); })
    .catch(e => setStatus('Erreur snapshot : ' + e.message));
}

/* ── Drag-to-reorder la liste ──────────────────────────────── */
let _dragListEl = null;

function bindListDrag() {
  const list = document.getElementById('studio-layer-list');
  if (!list) return;

  list.querySelectorAll('.studio-layer-item').forEach(li => {
    li.addEventListener('dragstart', e => {
      _dragListEl = li;
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      _dragListEl = null;
      // Réindexer l'order selon position DOM
      const items = [...list.querySelectorAll('.studio-layer-item')];
      items.forEach((item, idx) => {
        const layer = superLocal.layers.find(l => l.id === item.dataset.id);
        if (layer) layer.order = idx;
      });
      superSend();
      renderCanvas();
      renderLayerControls();
    });
    li.addEventListener('dragover', e => {
      e.preventDefault();
      if (!_dragListEl || li === _dragListEl) return;
      li.classList.add('drag-over');
      const rect = li.getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        list.insertBefore(_dragListEl, li);
      } else {
        list.insertBefore(_dragListEl, li.nextSibling);
      }
    });
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
    li.addEventListener('drop', e => {
      e.preventDefault();
      li.classList.remove('drag-over');
    });
  });
}

/* ── Toggles de visibilité dans la liste ──────────────────── */
function bindVisToggles() {
  document.querySelectorAll('.sli-vis').forEach(chk => {
    chk.addEventListener('change', () => {
      const layer = superLocal.layers.find(l => l.id === chk.dataset.id);
      if (!layer) return;
      layer.visible = chk.checked;

      // Mettre à jour le label ON/OFF
      const li = chk.closest('.studio-layer-item');
      if (li) {
        li.classList.toggle('sli-disabled', !chk.checked);
        const span = chk.nextElementSibling;
        if (span) span.textContent = chk.checked ? 'ON' : 'OFF';
      }

      superSend();
      renderCanvas();
      renderLayerControls();
    });
  });
}

/* ── Rendu du canvas (iframes + overlays drag) ───────────────── */
function renderCanvas() {
  const inner     = document.getElementById('studio-canvas-inner');
  const dragLayer = document.getElementById('studio-drag-layer');
  if (!inner || !dragLayer) return;

  recalcStudioScale();

  const sorted = superLocal.layers.slice().sort((a, b) => a.order - b.order);

  /* ── Iframes ── */
  sorted.forEach((layer, idx) => {
    let wrap = document.getElementById('sc-wrap-' + layer.id);
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id        = 'sc-wrap-' + layer.id;
      wrap.className = 'sc-iframe-wrap';
      wrap.style.cssText = 'position:absolute;width:1920px;height:1080px;pointer-events:none;';

      const iframe = document.createElement('iframe');
      iframe.src       = layer.url;
      iframe.scrolling = 'no';
      iframe.title     = layer.label;
      iframe.style.cssText = 'width:1920px;height:1080px;border:none;pointer-events:none;';
      wrap.appendChild(iframe);
      inner.appendChild(wrap);
    }
    wrap.style.left    = layer.x + 'px';
    wrap.style.top     = layer.y + 'px';
    wrap.style.zIndex  = idx;
    wrap.style.opacity = layer.visible ? (layer.opacity ?? 1) : 0.12;
    wrap.style.filter  = layer.visible ? 'none' : 'grayscale(100%)';
  });

  /* ── Overlays drag pleine taille (coords écran) ── */
  dragLayer.innerHTML = '';
  const visibleSorted = sorted.filter(l => l.visible);
  visibleSorted.forEach((layer, i) => {
    const color   = LAYER_COLORS[layer.id] || '#888';
    const overlay = document.createElement('div');
    overlay.className  = 'sc-drag-overlay';
    overlay.id         = 'sc-overlay-' + layer.id;
    overlay.dataset.id = layer.id;
    overlay.style.left   = (layer.x * studioScale) + 'px';
    overlay.style.top    = (layer.y * studioScale) + 'px';
    overlay.style.width  = (1920 * studioScale) + 'px';
    overlay.style.height = (1080 * studioScale) + 'px';
    overlay.style.zIndex = i;
    overlay.style.setProperty('--sc-color', color);
    overlay.innerHTML = `<div class="sc-overlay-badge" style="background:${color};">${layer.label}</div>`;
    dragLayer.appendChild(overlay);
  });

  dragLayer.style.pointerEvents = visibleSorted.length ? 'auto' : 'none';
  bindHandleDrag();
}

/* ── Drag des overlays dans le canvas ────────────────────────── */
let _dragging = null;
let _dragStart = null;

function bindHandleDrag() {
  document.querySelectorAll('.sc-drag-overlay').forEach(overlay => {
    overlay.addEventListener('mousedown', e => {
      _dragging = overlay.dataset.id;
      const layer = superLocal.layers.find(l => l.id === _dragging);
      if (!layer) return;
      _dragStart = { mx: e.clientX, my: e.clientY, lx: layer.x, ly: layer.y };
      overlay.classList.add('sc-dragging');
      e.preventDefault();
      e.stopPropagation();
    });
  });
}

document.addEventListener('mousemove', e => {
  if (!_dragging || !_dragStart) return;
  const layer = superLocal.layers.find(l => l.id === _dragging);
  if (!layer) return;

  const dx = (e.clientX - _dragStart.mx) / studioScale;
  const dy = (e.clientY - _dragStart.my) / studioScale;
  layer.x  = Math.round(_dragStart.lx + dx);
  layer.y  = Math.round(_dragStart.ly + dy);

  /* Déplacer l'overlay drag */
  const overlay = document.getElementById('sc-overlay-' + _dragging);
  if (overlay) {
    overlay.style.left = (layer.x * studioScale) + 'px';
    overlay.style.top  = (layer.y * studioScale) + 'px';
  }
  /* Déplacer l'iframe */
  const wrap = document.getElementById('sc-wrap-' + _dragging);
  if (wrap) { wrap.style.left = layer.x + 'px'; wrap.style.top = layer.y + 'px'; }

  /* Sync les inputs X/Y */
  const xi = document.querySelector(`.sc-x-input[data-id="${_dragging}"]`);
  const yi = document.querySelector(`.sc-y-input[data-id="${_dragging}"]`);
  if (xi) xi.value = layer.x;
  if (yi) yi.value = layer.y;
});

document.addEventListener('mouseup', () => {
  if (_dragging) {
    const overlay = document.getElementById('sc-overlay-' + _dragging);
    if (overlay) overlay.classList.remove('sc-dragging');
    superSend();
    _dragging  = null;
    _dragStart = null;
  }
});

/* ── Contrôles par calque visible ──────────────────────────── */
function renderLayerControls() {
  const container = document.getElementById('studio-layer-controls');
  if (!container) return;

  const visible = superLocal.layers
    .filter(l => l.visible)
    .sort((a, b) => a.order - b.order);

  if (!visible.length) { container.innerHTML = ''; return; }

  // Garder les valeurs des inputs actifs pendant le rendu
  const focused = document.activeElement?.dataset?.id;

  container.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'custom-card';
  wrap.style.padding = '10px 14px';

  const title = document.createElement('h3');
  title.style.marginBottom = '10px';
  title.textContent = 'Position & opacité des calques actifs';
  wrap.appendChild(title);

  visible.forEach(layer => {
    const color = LAYER_COLORS[layer.id] || '#888';
    const row   = document.createElement('div');
    row.className = 'studio-ctrl-card';

    const hasSnap   = !!layer.snapshot;
    const canSnap   = SNAPSHOT_SUPPORTED.has(layer.id);
    const snapStyle = hasSnap ? 'color:var(--success);border-color:var(--success)' : '';
    const snapLabel = hasSnap ? '💾 À jour' : '💾 Sauvegarder l\'état';
    const snapBtn   = canSnap
      ? `<button class="btn btn-outline btn-sm sc-snap-btn" data-id="${layer.id}" style="${snapStyle}" title="Sauvegarde les paramètres actuels de cet overlay dans cette scène">${snapLabel}</button>`
      : '';

    row.innerHTML = `
      <span class="studio-ctrl-dot" style="background:${color}"></span>
      <span class="studio-ctrl-name">${layer.label}</span>

      <span class="studio-ctrl-field">
        <label>X</label>
        <input type="number" class="sc-x-input" data-id="${layer.id}" value="${layer.x}" min="-1920" max="1920" />
      </span>
      <span class="studio-ctrl-field">
        <label>Y</label>
        <input type="number" class="sc-y-input" data-id="${layer.id}" value="${layer.y}" min="-1080" max="1080" />
      </span>
      <span class="studio-ctrl-field" style="flex:1;min-width:160px;">
        <label>Opacité</label>
        <input type="range" class="sc-opacity" data-id="${layer.id}" min="0" max="1" step="0.05" value="${layer.opacity ?? 1}" />
        <span class="studio-ctrl-opacity-val" id="sc-opval-${layer.id}">${Math.round((layer.opacity ?? 1) * 100)}%</span>
      </span>
      <button class="btn btn-outline btn-sm sc-reset-pos" data-id="${layer.id}" title="Remettre à X=0 Y=0">↺ 0,0</button>
      ${snapBtn}
    `;
    wrap.appendChild(row);
  });
  container.appendChild(wrap);

  bindLayerControlInputs();
}

function bindLayerControlInputs() {
  document.querySelectorAll('.sc-x-input').forEach(el => {
    el.addEventListener('change', () => {
      const layer = superLocal.layers.find(l => l.id === el.dataset.id);
      if (!layer) return;
      layer.x = Number(el.value);
      updateCanvasLayerPos(layer);
      superSend();
    });
  });
  document.querySelectorAll('.sc-y-input').forEach(el => {
    el.addEventListener('change', () => {
      const layer = superLocal.layers.find(l => l.id === el.dataset.id);
      if (!layer) return;
      layer.y = Number(el.value);
      updateCanvasLayerPos(layer);
      superSend();
    });
  });
  document.querySelectorAll('.sc-opacity').forEach(el => {
    el.addEventListener('input', () => {
      const layer = superLocal.layers.find(l => l.id === el.dataset.id);
      if (!layer) return;
      layer.opacity = Number(el.value);
      const val = document.getElementById('sc-opval-' + el.dataset.id);
      if (val) val.textContent = Math.round(layer.opacity * 100) + '%';
      const wrap = document.getElementById('sc-wrap-' + el.dataset.id);
      if (wrap) wrap.style.opacity = layer.opacity;
      superSend();
    });
  });
  document.querySelectorAll('.sc-reset-pos').forEach(btn => {
    btn.addEventListener('click', () => {
      const layer = superLocal.layers.find(l => l.id === btn.dataset.id);
      if (!layer) return;
      layer.x = 0; layer.y = 0;
      const xi = document.querySelector(`.sc-x-input[data-id="${btn.dataset.id}"]`);
      const yi = document.querySelector(`.sc-y-input[data-id="${btn.dataset.id}"]`);
      if (xi) xi.value = 0;
      if (yi) yi.value = 0;
      updateCanvasLayerPos(layer);
      superSend();
    });
  });

  document.querySelectorAll('.sc-snap-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      btn.disabled = true;
      btn.textContent = '⏳';
      try {
        const r = await fetch(`/api/super/scene/${superFullState.activeScene}/layer/${id}/snapshot`, { method: 'POST' });
        const d = await r.json();
        if (d.error) throw new Error(d.error);
        setStatus(`💾 État de "${id}" sauvegardé dans la scène`);
      } catch (err) {
        setStatus('Erreur : ' + err.message);
      }
      btn.disabled = false;
    });
  });
}

function updateCanvasLayerPos(layer) {
  const wrap   = document.getElementById('sc-wrap-' + layer.id);
  const handle = document.getElementById('sc-handle-' + layer.id);
  if (wrap)   { wrap.style.left = layer.x + 'px'; wrap.style.top = layer.y + 'px'; }
  if (handle) { handle.style.left = (layer.x * studioScale + 6) + 'px'; handle.style.top = (layer.y * studioScale + 6) + 'px'; }
}

/* ── Bouton "Tout masquer" ───────────────────────────────────── */
document.getElementById('btn-super-none')?.addEventListener('click', () => {
  superLocal.layers.forEach(l => { l.visible = false; });
  superSend();
  renderLayerList();
  renderCanvas();
  renderLayerControls();
});

/* ── Réinitialiser toutes les positions ─────────────────────── */
document.getElementById('btn-reset-all-pos')?.addEventListener('click', () => {
  superLocal.layers.forEach(l => { l.x = 0; l.y = 0; });
  superSend();
  renderCanvas();
  renderLayerControls();
});

/* ── Fond du Super Overlay ──────────────────────────────────── */
document.querySelectorAll('.so-bg-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.so-bg-preset').forEach(b => b.classList.remove('active-sep'));
    btn.classList.add('active-sep');
    superLocal.bgColor = btn.dataset.bg;
    superSend();
  });
});
document.getElementById('so-bg-color-picker')?.addEventListener('input', function () {
  document.querySelectorAll('.so-bg-preset').forEach(b => b.classList.remove('active-sep'));
  superLocal.bgColor = this.value;
  superSend();
});

/* ── Copier URL ──────────────────────────────────────────────── */
document.getElementById('btn-copy-super-url')?.addEventListener('click', () => {
  const el = document.getElementById('super-url');
  if (!el) return;
  navigator.clipboard.writeText(el.value)
    .then(() => setStatus('URL Super Overlay copiée'))
    .catch(() => { el.select(); document.execCommand('copy'); setStatus('URL Super Overlay copiée'); });
});

/* ── Mise à jour complète depuis le serveur (superStateUpdate) ── */
function updateStudioFullState(s) {
  superFullState = s;
  syncSceneToLocal();
  renderSceneButtons();
  renderLayerList();
  renderCanvas();
  renderLayerControls();
  document.querySelectorAll('.so-bg-preset').forEach(btn => {
    btn.classList.toggle('active-sep', btn.dataset.bg === superLocal.bgColor);
  });
}

/* ── Mise à jour scène active uniquement (superUpdate) ─────── */
function updateStudioUI(s) {
  // s = { bgColor, layers } de la scène active
  const scene = superFullState.scenes[superFullState.activeScene];
  if (scene) {
    scene.bgColor = s.bgColor;
    scene.layers  = s.layers;
  }
  syncSceneToLocal();
  renderLayerList();
  renderCanvas();
  renderLayerControls();
  document.querySelectorAll('.so-bg-preset').forEach(btn => {
    btn.classList.toggle('active-sep', btn.dataset.bg === superLocal.bgColor);
  });
}

/* ── Init ────────────────────────────────────────────────────── */
fetch('/api/super').then(r => r.json()).then(updateStudioFullState).catch(() => {});

// Recalcul scale si le panneau est redimensionné
if (typeof ResizeObserver !== 'undefined') {
  const ro = new ResizeObserver(() => {
    recalcStudioScale();
    // Repositionner les handles
    superLocal.layers.filter(l => l.visible).forEach((layer, i) => {
      const handle = document.getElementById('sc-handle-' + layer.id);
      if (handle) {
        handle.style.left = (layer.x * studioScale + 6 + i * 2) + 'px';
        handle.style.top  = (layer.y * studioScale + 6 + i * 2) + 'px';
      }
    });
  });
  const container = document.getElementById('studio-canvas-container');
  if (container) ro.observe(container);
}

// Recalcul quand on entre dans l'onglet Studio
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.tab === 'studio') {
      setTimeout(() => { recalcStudioScale(); renderCanvas(); }, 80);
    }
  });
});

// Réception Socket.IO
if (typeof socket !== 'undefined') {
  socket.on('titleUpdate',  updateTitleUI);
  socket.on('tickerUpdate', updateTickerUI);
  socket.on('framesUpdate', updateFramesUI);
  socket.on('superUpdate',      updateStudioUI);
  socket.on('superStateUpdate', updateStudioFullState);
}

/* ═══════════════════════════════════════════════════════════════
   TWITCH CHAT CONTROL
═══════════════════════════════════════════════════════════════ */

(function() {
  function syncRangeNum(rangeId, numId, display) {
    const range = document.getElementById(rangeId);
    const num   = numId ? document.getElementById(numId) : null;
    const lbl   = display ? document.getElementById(display) : null;
    if (!range) return;
    function update(v) {
      range.value = v;
      if (num) num.value = v;
      if (lbl) lbl.textContent = v;
    }
    range.addEventListener('input', () => { if (num) num.value = range.value; if (lbl) lbl.textContent = range.value; });
    if (num) num.addEventListener('input', () => { range.value = num.value; if (lbl) lbl.textContent = num.value; });
    return update;
  }

  const setX   = syncRangeNum('chat-pos-x', 'chat-pos-x-num');
  const setY   = syncRangeNum('chat-pos-y', 'chat-pos-y-num');
  const setW   = syncRangeNum('chat-width', null, 'chat-width-val');
  const setMH  = syncRangeNum('chat-maxh', null, 'chat-maxh-val');
  const setMax = syncRangeNum('chat-max-msg', null, 'chat-max-msg-val');
  const setPB  = syncRangeNum('chat-particle-border', null, 'chat-particle-border-val');

  // Load initial state
  fetch('/api/twitch-chat').then(r => r.json()).then(s => {
    document.getElementById('chat-channel-input').value = s.channel || '';
    if (setX)   setX(s.x     || 0);
    if (setY)   setY(s.y     || 0);
    if (setW)   setW(s.width || 360);
    if (setMH)  setMH(s.maxHeight || 600);
    if (setMax) setMax(s.maxMessages || 15);
    if (setPB)  setPB(s.particleBorder ?? 28);
    const tToggle = document.getElementById('chat-transparent-toggle');
    if (tToggle) tToggle.checked = !!s.transparentMode;
  }).catch(() => {});

  function postChatState(extra) {
    const body = {
      channel:     (document.getElementById('chat-channel-input')?.value || '').trim(),
      maxMessages:    parseInt(document.getElementById('chat-max-msg')?.value) || 15,
      particleBorder:  parseInt(document.getElementById('chat-particle-border')?.value) ?? 28,
      transparentMode: !!document.getElementById('chat-transparent-toggle')?.checked,
      width:       parseInt(document.getElementById('chat-width')?.value) || 360,
      maxHeight:   parseInt(document.getElementById('chat-maxh')?.value) || 600,
      x:           parseInt(document.getElementById('chat-pos-x')?.value) || 0,
      y:           parseInt(document.getElementById('chat-pos-y')?.value) || 0,
      ...extra,
    };
    return fetch('/api/twitch-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json());
  }

  document.getElementById('chat-connect-btn')?.addEventListener('click', () => {
    const chan = (document.getElementById('chat-channel-input')?.value || '').trim();
    if (!chan) { document.getElementById('chat-status').textContent = 'Entrez un nom de canal.'; return; }
    postChatState({ visible: true }).then(() => {
      document.getElementById('chat-status').textContent = `Connexion à #${chan}…`;
    });
  });

  document.getElementById('chat-hide-btn')?.addEventListener('click', () => {
    postChatState({ visible: false }).then(() => {
      document.getElementById('chat-status').textContent = 'Chat masqué.';
    });
  });

  document.getElementById('chat-pos-apply-btn')?.addEventListener('click', () => {
    postChatState({}).then(() => {
      document.getElementById('chat-status').textContent = 'Position appliquée.';
    });
  });

  // Live update on slider changes
  ['chat-width','chat-maxh','chat-max-msg','chat-particle-border'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => postChatState({}));
  });
  document.getElementById('chat-transparent-toggle')?.addEventListener('change', () => postChatState({}));
})();

/* ═══════════════════════════════════════════════════════════════
   TWITCH ALERTS CONTROL
═══════════════════════════════════════════════════════════════ */

(function () {
  // Mettre à jour l'URL avec le bon host
  const urlInput = document.getElementById('alerts-overlay-url');
  if (urlInput) urlInput.value = window.location.origin + '/twitch-alerts';

  // Copier URL
  document.getElementById('btn-copy-alerts-url')?.addEventListener('click', () => {
    const input = document.getElementById('alerts-overlay-url');
    if (!input) return;
    navigator.clipboard.writeText(input.value)
      .then(() => setStatus('URL alertes copiée'))
      .catch(() => { input.select(); document.execCommand('copy'); setStatus('URL alertes copiée'); });
  });

  // Sync slider ↔ number
  function syncSN(rangeId, numId) {
    const r = document.getElementById(rangeId);
    const n = document.getElementById(numId);
    if (!r || !n) return;
    r.addEventListener('input', () => { n.value = r.value; });
    n.addEventListener('input', () => { r.value = n.value; });
  }
  syncSN('alerts-bits-min', 'alerts-bits-min-num');
  syncSN('alerts-duration',  'alerts-duration-num');

  function collectState() {
    return {
      subsEnabled:   !!document.getElementById('alerts-subs-enabled')?.checked,
      bitsEnabled:   !!document.getElementById('alerts-bits-enabled')?.checked,
      bitsMinAmount: parseInt(document.getElementById('alerts-bits-min')?.value || '1', 10),
      duration:      parseInt(document.getElementById('alerts-duration')?.value  || '6', 10) * 1000,
      position:      document.getElementById('alerts-position')?.value || 'bottom-right',
    };
  }

  let _debounce = null;
  function sendAlertsState() {
    clearTimeout(_debounce);
    _debounce = setTimeout(() => {
      fetch('/api/twitch-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectState()),
      }).catch(() => {});
    }, 150);
  }

  // Load state
  fetch('/api/twitch-alerts')
    .then(r => r.json())
    .then(s => {
      const subsEl    = document.getElementById('alerts-subs-enabled');
      const bitsEl    = document.getElementById('alerts-bits-enabled');
      const minR      = document.getElementById('alerts-bits-min');
      const minN      = document.getElementById('alerts-bits-min-num');
      const durR      = document.getElementById('alerts-duration');
      const durN      = document.getElementById('alerts-duration-num');
      const posEl     = document.getElementById('alerts-position');

      if (subsEl) subsEl.checked = !!s.subsEnabled;
      if (bitsEl) bitsEl.checked = !!s.bitsEnabled;
      if (minR)   minR.value = s.bitsMinAmount ?? 1;
      if (minN)   minN.value = s.bitsMinAmount ?? 1;
      const durSec = Math.round((s.duration || 6000) / 1000);
      if (durR)   durR.value = durSec;
      if (durN)   durN.value = durSec;
      if (posEl)  posEl.value = s.position || 'bottom-right';
    })
    .catch(() => {});

  // Live update on any change
  ['alerts-subs-enabled','alerts-bits-enabled','alerts-position'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', sendAlertsState);
  });
  ['alerts-bits-min','alerts-bits-min-num','alerts-duration','alerts-duration-num'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', sendAlertsState);
  });

  // Test buttons
  document.getElementById('btn-alerts-test-sub')?.addEventListener('click', () => {
    fetch('/api/twitch-alerts/test-sub', { method: 'POST' }).catch(() => {});
  });
  document.getElementById('btn-alerts-test-bits')?.addEventListener('click', () => {
    fetch('/api/twitch-alerts/test-bits', { method: 'POST' }).catch(() => {});
  });
})();

/* ═══════════════════════════════════════════════════════════════
   YOUTUBE CHAT CONTROL
═══════════════════════════════════════════════════════════════ */

(function () {
  // Mettre à jour l'URL overlay avec le bon host
  const urlInput = document.getElementById('yt-overlay-url');
  if (urlInput) urlInput.value = window.location.origin + '/youtube-chat';

  // Copier URL
  document.getElementById('btn-copy-yt-url')?.addEventListener('click', () => {
    const input = document.getElementById('yt-overlay-url');
    if (!input) return;
    navigator.clipboard.writeText(input.value)
      .then(() => setStatus('URL YouTube Chat copiée'))
      .catch(() => { input.select(); document.execCommand('copy'); setStatus('URL YouTube Chat copiée'); });
  });

  // Sync slider ↔ display label
  function syncSliderDisplay(rangeId, displayId) {
    const range = document.getElementById(rangeId);
    const disp  = document.getElementById(displayId);
    if (!range || !disp) return;
    range.addEventListener('input', () => { disp.textContent = range.value; });
  }
  syncSliderDisplay('yt-max-msg', 'yt-max-msg-val');
  syncSliderDisplay('yt-width',   'yt-width-val');
  syncSliderDisplay('yt-maxh',    'yt-maxh-val');

  // Sync pos slider ↔ number input
  function syncSN(rangeId, numId) {
    const r = document.getElementById(rangeId);
    const n = document.getElementById(numId);
    if (!r || !n) return;
    r.addEventListener('input', () => { n.value = r.value; });
    n.addEventListener('input', () => { r.value = n.value; });
  }
  syncSN('yt-pos-x', 'yt-pos-x-num');
  syncSN('yt-pos-y', 'yt-pos-y-num');

  function collectYtState(extra) {
    return {
      channelId:       (document.getElementById('yt-channel-id')?.value || '').trim(),
      maxMessages:     parseInt(document.getElementById('yt-max-msg')?.value) || 15,
      width:           parseInt(document.getElementById('yt-width')?.value) || 360,
      maxHeight:       parseInt(document.getElementById('yt-maxh')?.value) || 600,
      x:               parseInt(document.getElementById('yt-pos-x')?.value) || 0,
      y:               parseInt(document.getElementById('yt-pos-y')?.value) || 0,
      transparentMode: !!document.getElementById('yt-transparent-toggle')?.checked,
      ...extra,
    };
  }

  function postYtState(extra) {
    return fetch('/api/youtube-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectYtState(extra)),
    }).then(r => r.json());
  }

  // Update connection status UI
  function updateYtConnStatus(s) {
    const dot   = document.getElementById('yt-conn-dot');
    const label = document.getElementById('yt-conn-label');
    if (!dot || !label) return;
    if (s.connected) {
      dot.style.background = '#FF0000';
      dot.style.boxShadow  = '0 0 6px #FF0000';
      label.textContent    = 'Connecté au live';
      label.style.color    = '#FF0000';
    } else if (s.error) {
      dot.style.background = '#e74c3c';
      dot.style.boxShadow  = 'none';
      label.textContent    = 'Erreur : ' + s.error;
      label.style.color    = '#e74c3c';
      const statusEl = document.getElementById('yt-status');
      if (statusEl) statusEl.textContent = s.error;
    } else {
      dot.style.background = '#555';
      dot.style.boxShadow  = 'none';
      label.textContent    = 'Déconnecté';
      label.style.color    = 'var(--text-muted)';
    }
  }

  // Load initial state
  fetch('/api/youtube-chat')
    .then(r => r.json())
    .then(s => {
      const chEl    = document.getElementById('yt-channel-id');
      const wR      = document.getElementById('yt-width');
      const wD      = document.getElementById('yt-width-val');
      const mhR     = document.getElementById('yt-maxh');
      const mhD     = document.getElementById('yt-maxh-val');
      const mmR     = document.getElementById('yt-max-msg');
      const mmD     = document.getElementById('yt-max-msg-val');
      const xR      = document.getElementById('yt-pos-x');
      const xN      = document.getElementById('yt-pos-x-num');
      const yR      = document.getElementById('yt-pos-y');
      const yN      = document.getElementById('yt-pos-y-num');
      const tToggle = document.getElementById('yt-transparent-toggle');

      if (chEl)  chEl.value  = s.channelId || '';
      if (wR)  { wR.value  = s.width     || 360; if (wD)  wD.textContent  = wR.value; }
      if (mhR) { mhR.value = s.maxHeight || 600; if (mhD) mhD.textContent = mhR.value; }
      if (mmR) { mmR.value = s.maxMessages || 15; if (mmD) mmD.textContent = mmR.value; }
      if (xR)  { xR.value  = s.x || 0;  if (xN)  xN.value = s.x || 0; }
      if (yR)  { yR.value  = s.y || 0;  if (yN)  yN.value = s.y || 0; }
      if (tToggle) tToggle.checked = !!s.transparentMode;
      if (s.hasApiKey) {
        const apiStatusEl = document.getElementById('yt-api-status');
        if (apiStatusEl) apiStatusEl.textContent = '✓ Clé API enregistrée';
      }
      updateYtConnStatus(s);
    })
    .catch(() => {});

  // Save API key + channel ID
  document.getElementById('yt-save-btn')?.addEventListener('click', () => {
    const apiKey    = document.getElementById('yt-api-key')?.value || '';
    const channelId = (document.getElementById('yt-channel-id')?.value || '').trim();
    fetch('/api/youtube-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, channelId }),
    })
      .then(r => r.json())
      .then(s => {
        const apiStatusEl = document.getElementById('yt-api-status');
        if (apiStatusEl) apiStatusEl.textContent = s.hasApiKey ? '✓ Clé API enregistrée' : '';
        setStatus('Config YouTube sauvegardée');
        const keyInput = document.getElementById('yt-api-key');
        if (keyInput) keyInput.value = '';
      })
      .catch(e => setStatus('Erreur : ' + e.message));
  });

  // Connect to live
  document.getElementById('yt-connect-btn')?.addEventListener('click', () => {
    const chanId = (document.getElementById('yt-channel-id')?.value || '').trim();
    if (!chanId) { document.getElementById('yt-status').textContent = 'Entrez un Channel ID.'; return; }
    const statusEl = document.getElementById('yt-status');
    if (statusEl) statusEl.textContent = 'Connexion en cours…';
    postYtState({ visible: true }).catch(() => {});
  });

  // Hide
  document.getElementById('yt-hide-btn')?.addEventListener('click', () => {
    postYtState({ visible: false }).then(s => {
      const statusEl = document.getElementById('yt-status');
      if (statusEl) statusEl.textContent = 'Chat masqué.';
      updateYtConnStatus(s);
    });
  });

  // Apply position
  document.getElementById('yt-pos-apply-btn')?.addEventListener('click', () => {
    postYtState({}).then(() => {
      const statusEl = document.getElementById('yt-status');
      if (statusEl) statusEl.textContent = 'Position appliquée.';
    });
  });

  // Live update on display slider changes
  ['yt-width','yt-maxh','yt-max-msg'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => postYtState({}));
  });
  document.getElementById('yt-transparent-toggle')?.addEventListener('change', () => postYtState({}));

  // Socket: connexion status
  if (typeof socket !== 'undefined') {
    socket.on('youtubeChatUpdate', updateYtConnStatus);
  }
})();

// ════════════════════════════════════════════════════════════════
// OBS TOOLS — Timer
// ════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  let _timerState = null;
  let _rafId      = null;
  let _isRunning  = false;

  // ── Helpers ──────────────────────────────────────────────────
  function pad(n) { return String(Math.floor(Math.abs(n))).padStart(2, '0'); }

  function formatLive(totalSeconds) {
    const abs  = Math.abs(totalSeconds);
    const secs = Math.floor(abs) % 60;
    const mins = Math.floor(abs / 60) % 60;
    const hrs  = Math.floor(abs / 3600);
    if (hrs > 0) return pad(hrs) + ':' + pad(mins) + ':' + pad(secs);
    return pad(mins) + ':' + pad(secs);
  }

  function getCurrentSeconds(state) {
    const now       = Date.now();
    const elapsed   = state.elapsed || 0;
    const startedAt = state.startedAt || now;
    const live      = state.running ? elapsed + (now - startedAt) / 1000 : elapsed;
    if (state.mode === 'countdown') return (state.duration || 0) - live;
    return live;
  }

  // ── Affichage live dans le panneau ───────────────────────────
  function startLiveDisplay() {
    if (_rafId) cancelAnimationFrame(_rafId);
    function step() {
      if (!_timerState) return;
      const el = document.getElementById('timer-live-display');
      if (el) el.textContent = formatLive(getCurrentSeconds(_timerState));
      _rafId = requestAnimationFrame(step);
    }
    _rafId = requestAnimationFrame(step);
  }

  function stopLiveDisplay() {
    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  }

  // ── Lecture des valeurs du formulaire ────────────────────────
  function getDuration() {
    const m = parseInt(document.getElementById('timer-duration-min')?.value || '0', 10);
    const s = parseInt(document.getElementById('timer-duration-sec')?.value || '0', 10);
    return (isNaN(m) ? 0 : m) * 60 + (isNaN(s) ? 0 : s);
  }

  function getConfig() {
    return {
      mode:       document.getElementById('timer-mode')?.value || 'countdown',
      duration:   getDuration(),
      visible:    document.getElementById('timer-visible-toggle')?.checked ?? true,
      label:      document.getElementById('timer-label')?.value || 'TIMER',
      showLabel:  document.getElementById('timer-show-label')?.checked ?? true,
      posX:       parseInt(document.getElementById('timer-pos-x-num')?.value || '960', 10),
      posY:       parseInt(document.getElementById('timer-pos-y-num')?.value || '540', 10),
      style:      document.getElementById('timer-style')?.value || 'default',
      fontSize:   parseInt(document.getElementById('timer-fontsize')?.value || '80', 10),
      alertAt:    parseInt(document.getElementById('timer-alert-at')?.value || '60', 10),
      showMillis:         document.getElementById('timer-show-millis')?.checked ?? false,
      particlesEnabled:   document.getElementById('timer-particles-enabled')?.checked ?? false,
      particleCountScale: parseInt(document.getElementById('timer-particles-scale')?.value || '100', 10),
    };
  }

  // ── Envoi au serveur ─────────────────────────────────────────
  function send(body) {
    return fetch('/api/timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(r => r.json())
      .then(s => { _timerState = s; syncUI(s); return s; })
      .catch(e => console.error('[timer-ctrl]', e));
  }

  let _debounce = null;
  function sendConfig() {
    clearTimeout(_debounce);
    _debounce = setTimeout(() => send(getConfig()), 120);
  }

  // ── Sync UI depuis l'état ────────────────────────────────────
  function syncUI(s) {
    if (!s) return;

    // Mode
    const modeEl = document.getElementById('timer-mode');
    if (modeEl && modeEl.value !== s.mode) modeEl.value = s.mode;

    // Durée
    const totalMin = Math.floor((s.duration || 0) / 60);
    const totalSec = (s.duration || 0) % 60;
    const minEl = document.getElementById('timer-duration-min');
    const secEl = document.getElementById('timer-duration-sec');
    if (minEl && parseInt(minEl.value, 10) !== totalMin) minEl.value = totalMin;
    if (secEl && parseInt(secEl.value, 10) !== totalSec) secEl.value = totalSec;

    // Bouton Start/Stop
    const btn = document.getElementById('timer-start-btn');
    if (btn) {
      btn.textContent = s.running ? '⏸ Stop' : '▶ Start';
      btn.classList.toggle('btn-danger', s.running);
      btn.classList.toggle('btn-primary', !s.running);
    }

    _isRunning = s.running;

    // Live display RAF
    if (s.running) startLiveDisplay();
    else {
      stopLiveDisplay();
      const el = document.getElementById('timer-live-display');
      if (el) el.textContent = formatLive(getCurrentSeconds(s));
    }

    // Visible
    const visEl = document.getElementById('timer-visible-toggle');
    if (visEl) visEl.checked = !!s.visible;

    // Particules
    const pEnEl = document.getElementById('timer-particles-enabled');
    if (pEnEl) pEnEl.checked = !!s.particlesEnabled;
    const pScEl  = document.getElementById('timer-particles-scale');
    const pScVal = document.getElementById('timer-particles-scale-val');
    if (pScEl && s.particleCountScale != null) { pScEl.value = s.particleCountScale; }
    if (pScVal && s.particleCountScale != null) { pScVal.textContent = s.particleCountScale + '%'; }

    // Show countdown/alert groups
    const dg = document.getElementById('timer-duration-group');
    const ag = document.getElementById('timer-alert-group');
    if (dg) dg.style.display = s.mode === 'countdown' ? '' : 'none';
    if (ag) ag.style.display = s.mode === 'countdown' ? '' : 'none';
  }

  // ── Initialisation ───────────────────────────────────────────
  function init() {
    // Charger l'état initial
    fetch('/api/timer')
      .then(r => r.json())
      .then(s => { _timerState = s; syncUI(s); })
      .catch(() => {});

    // Start / Stop
    document.getElementById('timer-start-btn')?.addEventListener('click', () => {
      if (_isRunning) {
        send({ action: 'stop' });
      } else {
        // Sync config avant de démarrer
        send(Object.assign(getConfig(), { action: 'start' }));
      }
    });

    // Reset
    document.getElementById('timer-reset-btn')?.addEventListener('click', () => {
      send({ action: 'reset' });
    });

    // Visible toggle
    document.getElementById('timer-visible-toggle')?.addEventListener('change', sendConfig);

    // Mode
    document.getElementById('timer-mode')?.addEventListener('change', (e) => {
      const dg = document.getElementById('timer-duration-group');
      const ag = document.getElementById('timer-alert-group');
      if (dg) dg.style.display = e.target.value === 'countdown' ? '' : 'none';
      if (ag) ag.style.display = e.target.value === 'countdown' ? '' : 'none';
      sendConfig();
    });

    // Durée
    ['timer-duration-min', 'timer-duration-sec'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', sendConfig);
    });

    // Label
    document.getElementById('timer-label')?.addEventListener('input', sendConfig);
    document.getElementById('timer-show-label')?.addEventListener('change', sendConfig);

    // Style
    document.getElementById('timer-style')?.addEventListener('change', sendConfig);

    // Alertat
    document.getElementById('timer-alert-at')?.addEventListener('input', sendConfig);

    // Millis
    document.getElementById('timer-show-millis')?.addEventListener('change', sendConfig);

    // Particules
    document.getElementById('timer-particles-enabled')?.addEventListener('change', sendConfig);
    const psRange = document.getElementById('timer-particles-scale');
    const psVal   = document.getElementById('timer-particles-scale-val');
    psRange?.addEventListener('input', () => {
      if (psVal) psVal.textContent = psRange.value + '%';
      sendConfig();
    });

    // Font size slider
    const fsRange = document.getElementById('timer-fontsize');
    const fsVal   = document.getElementById('timer-fontsize-val');
    fsRange?.addEventListener('input', () => {
      if (fsVal) fsVal.textContent = fsRange.value;
      sendConfig();
    });

    // Position sliders ↔ number inputs
    const posXRange = document.getElementById('timer-pos-x');
    const posXNum   = document.getElementById('timer-pos-x-num');
    const posYRange = document.getElementById('timer-pos-y');
    const posYNum   = document.getElementById('timer-pos-y-num');

    posXRange?.addEventListener('input', () => { if (posXNum) posXNum.value = posXRange.value; sendConfig(); });
    posXNum?.addEventListener('input',   () => { if (posXRange) posXRange.value = posXNum.value; sendConfig(); });
    posYRange?.addEventListener('input', () => { if (posYNum) posYNum.value = posYRange.value; sendConfig(); });
    posYNum?.addEventListener('input',   () => { if (posYRange) posYRange.value = posYNum.value; sendConfig(); });

    // Socket live sync
    if (typeof socket !== 'undefined') {
      socket.on('timerUpdate', (s) => {
        _timerState = s;
        syncUI(s);
      });
    }
  }

  // Lancer après le DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ── Texture de fond ───────────────────────────────────────────

function updateTexturePreview(url) {
  const preview = document.getElementById('texture-preview');
  const empty   = document.getElementById('texture-preview-empty');
  if (!preview) return;
  if (url) {
    preview.style.backgroundImage = 'url(' + url + ')';
    if (empty) empty.style.display = 'none';
  } else {
    preview.style.backgroundImage = 'none';
    if (empty) empty.style.display = 'flex';
  }
}

document.getElementById('texture-file-input')?.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    fetch('/api/texture/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, data: ev.target.result }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.url) {
          state.overlayTexture = res.url;
          updateTexturePreview(res.url);
          emitState(buildStateFromForm());
          setStatus('Texture chargée');
        } else {
          setStatus('Erreur upload texture');
        }
      })
      .catch(err => setStatus('Erreur upload texture : ' + err.message));
  };
  reader.readAsDataURL(file);
  // Reset input to allow re-selecting the same file
  e.target.value = '';
});

document.getElementById('btn-texture-clear')?.addEventListener('click', () => {
  if (state.overlayTexture) {
    const filename = state.overlayTexture.split('/').pop();
    fetch('/api/texture/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    }).catch(() => {});
  }
  state.overlayTexture = null;
  updateTexturePreview(null);
  emitState(buildStateFromForm());
  setStatus('Texture retirée');
});

(function () {
  const txOpRange = document.getElementById('texture-opacity-range');
  const txOpNum   = document.getElementById('texture-opacity-num');
  if (txOpRange && txOpNum) {
    txOpRange.addEventListener('input', () => { txOpNum.value = txOpRange.value; emitState(buildStateFromForm()); });
    txOpNum.addEventListener('input',   () => { txOpRange.value = txOpNum.value; emitState(buildStateFromForm()); });
  }
  document.getElementById('texture-blend')?.addEventListener('change', () => emitState(buildStateFromForm()));
  document.getElementById('texture-size')?.addEventListener('change',  () => emitState(buildStateFromForm()));
})();

// ── Panneau de config thème ───────────────────────────────────

function _tcSyncTexturePreview(url) {
  const preview = document.getElementById('tc-texture-preview');
  const empty   = document.getElementById('tc-texture-preview-empty');
  if (!preview) return;
  if (url) {
    preview.style.backgroundImage = 'url(' + url + ')';
    if (empty) empty.style.display = 'none';
  } else {
    preview.style.backgroundImage = 'none';
    if (empty) empty.style.display = 'flex';
  }
}

function _tcSyncToMain() {
  // Sync tc-particle controls → main particle controls (pour que buildStateFromForm() les lise)
  const fields = [
    ['tc-particle-opacity-range', 'particle-opacity-range'],
    ['tc-particle-opacity-num',   'particle-opacity-num'],
    ['tc-particle-count-range',   'particle-count-range'],
    ['tc-particle-count-num',     'particle-count-num'],
  ];
  fields.forEach(([from, to]) => {
    const src  = document.getElementById(from);
    const dest = document.getElementById(to);
    if (src && dest) dest.value = src.value;
  });
  // Sync tc-texture controls → main texture controls
  const txFields = [
    ['tc-texture-opacity-range', 'texture-opacity-range'],
    ['tc-texture-opacity-num',   'texture-opacity-num'],
    ['tc-texture-blend',         'texture-blend'],
    ['tc-texture-size',          'texture-size'],
  ];
  txFields.forEach(([from, to]) => {
    const src  = document.getElementById(from);
    const dest = document.getElementById(to);
    if (src && dest) dest.value = src.value;
  });
}

function showThemeConfigPanel(key) {
  const panel = document.getElementById('theme-config-panel');
  if (!panel) return;

  // Titre
  const label = key === 'transparent' ? 'Transparent'
    : (THEMES[key] ? key.replace(/^s/, '').replace(/_/g, ' ') : key);
  const nameEl = document.getElementById('theme-config-name');
  if (nameEl) nameEl.textContent = label.charAt(0).toUpperCase() + label.slice(1);

  // Peupler contrôles particules depuis state actuel
  const en = state.particlesEnabled !== false;
  const op = state.particleOpacity ?? 100;
  const ct = state.particleCountScale ?? 100;

  const tcToggle = document.getElementById('tc-particles-toggle');
  const tcCtrls  = document.getElementById('tc-particles-controls');
  if (tcToggle) {
    tcToggle.textContent = en ? '⏸ Désactiver' : '▶ Activer';
    tcToggle.className = 'btn ' + (en ? 'btn-primary' : 'btn-outline');
    if (tcCtrls) { tcCtrls.style.opacity = en ? '1' : '0.4'; tcCtrls.style.pointerEvents = en ? '' : 'none'; }
  }
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('tc-particle-opacity-range', op); set('tc-particle-opacity-num', op);
  set('tc-particle-count-range', ct);   set('tc-particle-count-num', ct);

  // Peupler contrôles texture depuis state actuel
  _tcSyncTexturePreview(state.overlayTexture || null);
  set('tc-texture-opacity-range', state.overlayTextureOpacity ?? 50);
  set('tc-texture-opacity-num',   state.overlayTextureOpacity ?? 50);
  const blendEl = document.getElementById('tc-texture-blend');
  if (blendEl) blendEl.value = state.overlayTextureBlend || 'normal';
  const sizeEl  = document.getElementById('tc-texture-size');
  if (sizeEl)  sizeEl.value  = state.overlayTextureSize  || 'repeat';

  panel.style.display = 'block';
  // Scroll to panel
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Fermer
document.getElementById('btn-theme-config-close')?.addEventListener('click', () => {
  const panel = document.getElementById('theme-config-panel');
  if (panel) panel.style.display = 'none';
});

// Particules toggle
document.getElementById('tc-particles-toggle')?.addEventListener('click', function () {
  state.particlesEnabled = state.particlesEnabled === false;
  const en = state.particlesEnabled !== false;
  this.textContent = en ? '⏸ Désactiver' : '▶ Activer';
  this.className = 'btn ' + (en ? 'btn-primary' : 'btn-outline');
  const tcCtrls = document.getElementById('tc-particles-controls');
  if (tcCtrls) { tcCtrls.style.opacity = en ? '1' : '0.4'; tcCtrls.style.pointerEvents = en ? '' : 'none'; }
  // Sync main toggle
  updateParticlesToggle(en);
  emitState(buildStateFromForm());
});

// Particules sliders (tc → main → emit)
(function () {
  const pairs = [
    ['tc-particle-opacity-range', 'tc-particle-opacity-num'],
    ['tc-particle-count-range',   'tc-particle-count-num'],
  ];
  pairs.forEach(([rangeId, numId]) => {
    const range = document.getElementById(rangeId);
    const num   = document.getElementById(numId);
    if (!range || !num) return;
    range.addEventListener('input', () => { num.value = range.value; _tcSyncToMain(); emitState(buildStateFromForm()); });
    num.addEventListener('input',   () => { range.value = num.value; _tcSyncToMain(); emitState(buildStateFromForm()); });
  });
})();

// Texture upload (panneau thème)
document.getElementById('tc-texture-file-input')?.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    fetch('/api/texture/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, data: ev.target.result }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.url) {
          state.overlayTexture = res.url;
          _tcSyncTexturePreview(res.url);
          updateTexturePreview(res.url);
          _tcSyncToMain();
          emitState(buildStateFromForm());
          setStatus('Texture chargée');
        }
      })
      .catch(err => setStatus('Erreur : ' + err.message));
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

// Texture retirer (panneau thème)
document.getElementById('tc-btn-texture-clear')?.addEventListener('click', () => {
  if (state.overlayTexture) {
    const filename = state.overlayTexture.split('/').pop();
    fetch('/api/texture/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    }).catch(() => {});
  }
  state.overlayTexture = null;
  _tcSyncTexturePreview(null);
  updateTexturePreview(null);
  _tcSyncToMain();
  emitState(buildStateFromForm());
  setStatus('Texture retirée');
});

// Texture opacity/blend/size (panneau thème)
(function () {
  const tcOpRange = document.getElementById('tc-texture-opacity-range');
  const tcOpNum   = document.getElementById('tc-texture-opacity-num');
  if (tcOpRange && tcOpNum) {
    tcOpRange.addEventListener('input', () => { tcOpNum.value = tcOpRange.value; _tcSyncToMain(); emitState(buildStateFromForm()); });
    tcOpNum.addEventListener('input',   () => { tcOpRange.value = tcOpNum.value; _tcSyncToMain(); emitState(buildStateFromForm()); });
  }
  document.getElementById('tc-texture-blend')?.addEventListener('change', () => { _tcSyncToMain(); emitState(buildStateFromForm()); });
  document.getElementById('tc-texture-size')?.addEventListener('change',  () => { _tcSyncToMain(); emitState(buildStateFromForm()); });
})();

// ═══════════════════════════════════════════════════════════════
// TAB : CONNEXIONS — Twitch + YouTube OAuth
// ═══════════════════════════════════════════════════════════════

// ── Twitch ────────────────────────────────────────────────────

function applyTwitchConnectStatus({ authenticated, displayName, login, avatar, hasClientId, hasSecret }) {
  const connected = document.getElementById('twitch-auth-connected');
  const form      = document.getElementById('twitch-auth-form');
  if (!connected || !form) return;

  if (authenticated) {
    connected.style.display = '';
    form.style.display      = 'none';
    const el = document.getElementById('twitch-auth-avatar');
    if (el && avatar) { el.src = avatar; el.style.display = ''; }
    const nameEl  = document.getElementById('twitch-auth-name');
    const loginEl = document.getElementById('twitch-auth-login');
    if (nameEl)  nameEl.textContent  = displayName || '';
    if (loginEl) loginEl.textContent = login ? `@${login}` : '';
  } else {
    connected.style.display = 'none';
    form.style.display      = '';
    if (hasClientId) {
      document.getElementById('twitch-cred-id').placeholder = '•••• (enregistré)';
    }
  }
}

fetch('/api/twitch/auth-status').then(r => r.json()).then(applyTwitchConnectStatus).catch(() => {});

if (typeof socket !== 'undefined') {
  socket.on('twitch-auth-status', applyTwitchConnectStatus);
  socket.on('youtube-auth-status', applyYouTubeConnectStatus);
}

document.getElementById('btn-twitch-save-creds')?.addEventListener('click', () => {
  const clientId     = document.getElementById('twitch-cred-id')?.value.trim();
  const clientSecret = document.getElementById('twitch-cred-secret')?.value;
  const status       = document.getElementById('twitch-cred-status');
  if (!clientId) { if (status) status.textContent = 'Client ID requis'; return; }
  fetch('/api/twitch/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  }).then(r => r.json()).then(() => {
    if (status) { status.textContent = '✓ Enregistré.'; status.style.color = '#6bc96c'; }
  }).catch(e => { if (status) status.textContent = 'Erreur : ' + e.message; });
});

document.getElementById('btn-twitch-oauth')?.addEventListener('click', () => {
  const clientId     = document.getElementById('twitch-cred-id')?.value.trim();
  const clientSecret = document.getElementById('twitch-cred-secret')?.value;
  const status       = document.getElementById('twitch-cred-status');

  const doOpen = () => {
    const onMsg = (e) => {
      if (e.data?.type === 'twitch-auth-ok') {
        window.removeEventListener('message', onMsg);
        fetch('/api/twitch/auth-status').then(r => r.json()).then(applyTwitchConnectStatus).catch(() => {});
      }
    };
    window.addEventListener('message', onMsg);
    window.open('/auth/twitch', '_blank', 'width=600,height=700');
  };

  // Si le Client ID est rempli, on sauvegarde d'abord
  if (clientId) {
    fetch('/api/twitch/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    }).then(() => doOpen())
      .catch(e => { if (status) status.textContent = 'Erreur sauvegarde : ' + e.message; });
  } else {
    doOpen();
  }
});

document.getElementById('btn-twitch-disconnect')?.addEventListener('click', () => {
  fetch('/api/twitch/auth', { method: 'DELETE' })
    .then(() => applyTwitchConnectStatus({ authenticated: false }))
    .catch(() => {});
});

// ── YouTube ────────────────────────────────────────────────────

function applyYouTubeConnectStatus({ authenticated, channelName, channelId, avatar, hasClientId }) {
  const connected = document.getElementById('youtube-auth-connected');
  const form      = document.getElementById('youtube-auth-form');
  if (!connected || !form) return;

  if (authenticated) {
    connected.style.display = '';
    form.style.display      = 'none';
    const el = document.getElementById('youtube-auth-avatar');
    if (el && avatar) { el.src = avatar; el.style.display = ''; }
    const nameEl    = document.getElementById('youtube-auth-name');
    const chanEl    = document.getElementById('youtube-auth-channel');
    if (nameEl)  nameEl.textContent  = channelName || '';
    if (chanEl)  chanEl.textContent  = channelId   || '';
  } else {
    connected.style.display = 'none';
    form.style.display      = '';
    if (hasClientId) {
      document.getElementById('youtube-cred-id').placeholder = '•••• (enregistré)';
    }
  }
}

fetch('/api/youtube/auth-status').then(r => r.json()).then(applyYouTubeConnectStatus).catch(() => {});

document.getElementById('btn-youtube-save-creds')?.addEventListener('click', () => {
  const clientId     = document.getElementById('youtube-cred-id')?.value.trim();
  const clientSecret = document.getElementById('youtube-cred-secret')?.value;
  const status       = document.getElementById('youtube-cred-status');
  if (!clientId) { if (status) status.textContent = 'Client ID requis'; return; }
  fetch('/api/youtube/auth-credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  }).then(() => {
    if (status) { status.textContent = 'Enregistré.'; status.style.color = '#6bc96c'; }
  }).catch(e => { if (status) status.textContent = 'Erreur : ' + e.message; });
});

document.getElementById('btn-youtube-oauth')?.addEventListener('click', () => {
  const win = window.open('/auth/youtube', '_blank', 'width=600,height=700,noopener');
  const onMsg = (e) => {
    if (e.data?.type === 'youtube-auth-ok') {
      window.removeEventListener('message', onMsg);
      fetch('/api/youtube/auth-status').then(r => r.json()).then(applyYouTubeConnectStatus).catch(() => {});
    }
  };
  window.addEventListener('message', onMsg);
});

document.getElementById('btn-youtube-disconnect')?.addEventListener('click', () => {
  fetch('/api/youtube/auth', { method: 'DELETE' })
    .then(() => applyYouTubeConnectStatus({ authenticated: false }))
    .catch(() => {});
});

// ── start.gg clé API ─────────────────────────────────────────────────────────

function applyStartggKeyStatus({ hasKey }) {
  const connected = document.getElementById('conn-startgg-connected');
  const form      = document.getElementById('conn-startgg-form');
  if (!connected || !form) return;
  connected.style.display = hasKey ? '' : 'none';
  form.style.display      = hasKey ? 'none' : '';
}

fetch('/api/startgg/config').then(r => r.json()).then(applyStartggKeyStatus).catch(() => {});

document.getElementById('conn-startgg-save')?.addEventListener('click', () => {
  const key    = document.getElementById('conn-startgg-key')?.value.trim();
  const status = document.getElementById('conn-startgg-status');
  if (!key) return;
  fetch('/api/startgg/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: key })
  })
    .then(r => r.json())
    .then(() => {
      document.getElementById('conn-startgg-key').value = '';
      applyStartggKeyStatus({ hasKey: true });
      // Sync avec l'onglet start.gg
      const sggStatus = document.getElementById('sgg-key-status');
      if (sggStatus) { sggStatus.textContent = '✓ Clé API enregistrée'; sggStatus.style.color = '#4caf50'; }
    })
    .catch(() => { if (status) status.textContent = 'Erreur lors de l\'enregistrement.'; });
});

document.getElementById('conn-startgg-remove')?.addEventListener('click', () => {
  fetch('/api/startgg/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: '' })
  })
    .then(() => {
      applyStartggKeyStatus({ hasKey: false });
      const sggStatus = document.getElementById('sgg-key-status');
      if (sggStatus) { sggStatus.textContent = 'Aucune clé API enregistrée.'; sggStatus.style.color = '#e05050'; }
    })
    .catch(() => {});
});

// Boutons "Copier" dans les tutos
document.querySelectorAll('.conn-copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.dataset.copy;
    if (!val) return;
    navigator.clipboard.writeText(val).then(() => {
      const orig = btn.textContent;
      btn.textContent = 'Copié !';
      btn.style.color = '#6BC96C';
      btn.style.borderColor = '#6BC96C';
      setTimeout(() => { btn.textContent = orig; btn.style.color = ''; btn.style.borderColor = ''; }, 1500);
    });
  });
});

// ── Créateur de thème custom ──────────────────────────────────────────────

const CT_DEFAULTS = {
  bgType: 'gradient', bgColor1: '#0E0E12', bgColor2: '#16161E', bgAngle: 135,
  bgTexture: null, bgTextureOpacity: 80, bgTextureSize: 'cover',
  accentColor: '#E8B830', p1Color: '#E83030', p2Color: '#3070E8',
  nameColor: '#F0EEF8', tagColor: '#E8B830', pronounsColor: '#5A5A7A',
  scoreColor: '#F0EEF8', eventColor: '#5A5A7A', scoreSepColor: '#E8B830',
  neonEnabled: false, neonColor: '#E8B830', neonIntensity: 8,
  neonName: true, neonScore: true, neonTag: false, neonEvent: false, neonAccent: true,
  fontFamily: 'Russo One', letterSpacing: 2, nameFontSize: 24,
  particleType: 'sparkle', particleCount: 0,
  coverImage: null, coverOpacity: 50, coverMode: 'cover',
};

let customTheme = { ...CT_DEFAULTS };

function ctGet() {
  customTheme.bgType           = document.querySelector('input[name="ct-bg-type"]:checked')?.value || 'gradient';
  customTheme.bgColor1         = document.getElementById('ct-bg-color1')?.value    || CT_DEFAULTS.bgColor1;
  customTheme.bgColor2         = document.getElementById('ct-bg-color2')?.value    || CT_DEFAULTS.bgColor2;
  customTheme.bgAngle          = parseInt(document.getElementById('ct-bg-angle-num')?.value    || 135);
  customTheme.bgTextureOpacity = parseInt(document.getElementById('ct-bg-texture-opacity-num')?.value ?? 80);
  customTheme.bgTextureSize    = document.getElementById('ct-bg-texture-size')?.value || 'cover';
  customTheme.accentColor = document.getElementById('ct-accent-color')?.value || CT_DEFAULTS.accentColor;
  customTheme.p1Color     = document.getElementById('ct-p1-color')?.value     || CT_DEFAULTS.p1Color;
  customTheme.p2Color     = document.getElementById('ct-p2-color')?.value     || CT_DEFAULTS.p2Color;
  customTheme.nameColor   = document.getElementById('ct-name-color')?.value   || CT_DEFAULTS.nameColor;
  customTheme.tagColor    = document.getElementById('ct-tag-color')?.value    || CT_DEFAULTS.tagColor;
  customTheme.pronounsColor = document.getElementById('ct-pronouns-color')?.value || CT_DEFAULTS.pronounsColor;
  customTheme.scoreColor  = document.getElementById('ct-score-color')?.value  || CT_DEFAULTS.scoreColor;
  customTheme.eventColor  = document.getElementById('ct-event-color')?.value  || CT_DEFAULTS.eventColor;
  customTheme.scoreSepColor = document.getElementById('ct-sep-color')?.value  || CT_DEFAULTS.scoreSepColor;
  customTheme.neonEnabled   = document.getElementById('ct-neon-enabled')?.checked  || false;
  customTheme.neonColor     = document.getElementById('ct-neon-color')?.value      || CT_DEFAULTS.neonColor;
  customTheme.neonIntensity = parseInt(document.getElementById('ct-neon-intensity-num')?.value || 8);
  customTheme.neonName      = document.getElementById('ct-neon-name')?.checked    || false;
  customTheme.neonScore     = document.getElementById('ct-neon-score')?.checked   || false;
  customTheme.neonTag       = document.getElementById('ct-neon-tag')?.checked     || false;
  customTheme.neonEvent     = document.getElementById('ct-neon-event')?.checked   || false;
  customTheme.neonAccent    = document.getElementById('ct-neon-accent')?.checked  || false;
  customTheme.fontFamily    = document.getElementById('ct-font-family')?.value    || 'Russo One';
  customTheme.letterSpacing = parseInt(document.getElementById('ct-letter-spacing-num')?.value || 2);
  customTheme.nameFontSize  = parseInt(document.getElementById('ct-name-size-num')?.value      || 24);
  customTheme.particleType  = document.getElementById('ct-particle-type')?.value  || 'sparkle';
  customTheme.particleCount = parseInt(document.getElementById('ct-particle-count-num')?.value || 60);
  customTheme.coverOpacity  = parseInt(document.getElementById('ct-cover-opacity-num')?.value  || 50);
  customTheme.coverMode     = document.getElementById('ct-cover-mode')?.value     || 'cover';
  return customTheme;
}

function ctSend() {
  ctGet();
  const ns = { ...state, customTheme: { ...customTheme } };
  state = ns;
  socket.emit('updateState', ns);
  ctUpdatePreview();
}

function ctUpdatePreview() {
  const ct = customTheme;
  const bg = document.getElementById('ct-preview-bg');
  if (bg) {
    let bgVal;
    if (ct.bgType === 'transparent') {
      bgVal = 'repeating-conic-gradient(#444 0% 25%, #222 0% 50%) 0 0 / 12px 12px';
    } else if (ct.bgType === 'texture' && ct.bgTexture) {
      const sz = ct.bgTextureSize === 'repeat' ? 'auto' : (ct.bgTextureSize || 'cover');
      const rp = ct.bgTextureSize === 'repeat' ? 'repeat' : 'no-repeat';
      bgVal = `url('${ct.bgTexture}') center / ${sz} ${rp}`;
    } else if (ct.bgType === 'gradient') {
      bgVal = `linear-gradient(${ct.bgAngle}deg, ${ct.bgColor1}, ${ct.bgColor2})`;
    } else {
      bgVal = ct.bgColor1;
    }
    if (ct.coverImage && ct.bgType !== 'transparent') {
      bgVal = `url('${ct.coverImage}') center / ${ct.coverMode || 'cover'} no-repeat, ` + bgVal;
    }
    bg.style.background = bgVal;
  }

  const applyText = (id, color, neonOn, neonColor, neonPx) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.color = color;
    el.style.textShadow = neonOn ? `0 0 ${neonPx}px ${neonColor}, 0 0 ${neonPx * 2}px ${neonColor}` : 'none';
  };

  applyText('ct-preview-p1',     ct.nameColor,     ct.neonEnabled && ct.neonName,  ct.neonColor, ct.neonIntensity);
  applyText('ct-preview-p2',     ct.nameColor,     ct.neonEnabled && ct.neonName,  ct.neonColor, ct.neonIntensity);
  applyText('ct-preview-score1', ct.scoreColor,    ct.neonEnabled && ct.neonScore, ct.neonColor, ct.neonIntensity);
  applyText('ct-preview-score2', ct.scoreColor,    ct.neonEnabled && ct.neonScore, ct.neonColor, ct.neonIntensity);
  applyText('ct-preview-vs',     ct.scoreSepColor, ct.neonEnabled && ct.neonScore, ct.neonColor, ct.neonIntensity);

  ['ct-preview-p1','ct-preview-p2','ct-preview-score1','ct-preview-score2','ct-preview-vs'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.fontFamily    = `'${ct.fontFamily}', sans-serif`;
      el.style.letterSpacing = ct.letterSpacing + 'px';
    }
  });
  ['ct-preview-p1','ct-preview-p2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.fontSize = ct.nameFontSize + 'px';
  });

  // Badge actif (dans le créateur)
  const isActive = (state && state.overlayTheme === 'custom');
  const badge = document.getElementById('ct-active-badge');
  if (badge) badge.style.display = isActive ? '' : 'none';

  // ── Mise à jour de la carte dans la grille de thèmes ──
  const cardBg = document.getElementById('theme-card-custom-bg');
  if (cardBg) {
    let bgVal = ct.bgType === 'gradient'
      ? `linear-gradient(${ct.bgAngle || 135}deg, ${ct.bgColor1 || '#0E0E12'}, ${ct.bgColor2 || '#16161E'})`
      : (ct.bgColor1 || '#0E0E12');
    if (ct.coverImage) bgVal = `url('${ct.coverImage}') center / ${ct.coverMode || 'cover'} no-repeat, ` + bgVal;
    cardBg.style.background = bgVal;
  }
  const neon = ct.neonEnabled ? `0 0 ${ct.neonIntensity || 8}px ${ct.neonColor || '#E8B830'}, 0 0 ${(ct.neonIntensity || 8) * 2}px ${ct.neonColor || '#E8B830'}` : 'none';
  const applyCard = (id, color, useNeon) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.color = color;
    el.style.textShadow = useNeon ? neon : 'none';
    el.style.fontFamily = `'${ct.fontFamily || 'Russo One'}', sans-serif`;
  };
  applyCard('theme-card-custom-p1', ct.nameColor || '#F0EEF8', ct.neonEnabled && ct.neonName);
  applyCard('theme-card-custom-p2', ct.nameColor || '#F0EEF8', ct.neonEnabled && ct.neonName);
  applyCard('theme-card-custom-s1', ct.scoreColor || '#F0EEF8', ct.neonEnabled && ct.neonScore);
  applyCard('theme-card-custom-s2', ct.scoreColor || '#F0EEF8', ct.neonEnabled && ct.neonScore);
  applyCard('theme-card-custom-vs', ct.scoreSepColor || '#E8B830', ct.neonEnabled && ct.neonScore);
  const cardBadge = document.getElementById('theme-card-custom-badge');
  if (cardBadge) cardBadge.style.display = isActive ? '' : 'none';

  // Sync hex text inputs alongside color pickers
  const syncHex = (pickerId, textSelector) => {
    const picker = document.getElementById(pickerId);
    if (!picker) return;
    // find sibling text input
    const txt = picker.parentElement?.querySelector('input[type="text"]');
    if (txt && txt.value !== picker.value) txt.value = picker.value;
  };
  ['ct-bg-color1','ct-bg-color2','ct-accent-color','ct-p1-color','ct-p2-color',
   'ct-name-color','ct-tag-color','ct-pronouns-color','ct-score-color','ct-event-color','ct-sep-color',
   'ct-neon-color'].forEach(id => syncHex(id));
}

function updateBgTypeVisibility(bgType) {
  const isGrad   = bgType === 'gradient';
  const isSolid  = bgType === 'solid';
  const isTransp = bgType === 'transparent';
  const isTexture= bgType === 'texture';
  const colorsGrp = document.getElementById('ct-bg-colors-group');
  const col2      = document.getElementById('ct-bg-color2-group');
  const angGrp    = document.getElementById('ct-bg-angle-group');
  const transpGrp = document.getElementById('ct-bg-transparent-group');
  const texGrp    = document.getElementById('ct-bg-texture-group');
  if (colorsGrp) colorsGrp.style.display = (isGrad || isSolid) ? '' : 'none';
  if (col2)      col2.style.display      = isGrad ? '' : 'none';
  if (angGrp)    angGrp.style.display    = isGrad ? '' : 'none';
  if (transpGrp) transpGrp.style.display = isTransp ? '' : 'none';
  if (texGrp)    texGrp.style.display    = isTexture ? '' : 'none';
}

function ctWire() {
  // Color pickers
  const colorIds = [
    'ct-bg-color1','ct-bg-color2','ct-accent-color','ct-p1-color','ct-p2-color',
    'ct-name-color','ct-tag-color','ct-pronouns-color','ct-score-color','ct-event-color','ct-sep-color',
    'ct-neon-color',
  ];
  colorIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      // Also update sibling hex text input
      const txt = el.parentElement?.querySelector('input[type="text"]');
      if (txt) txt.value = el.value;
      ctSend();
    });
  });

  // Background type radios
  document.querySelectorAll('input[name="ct-bg-type"]').forEach(r => {
    r.addEventListener('change', () => {
      const bgType = document.querySelector('input[name="ct-bg-type"]:checked')?.value || 'gradient';
      updateBgTypeVisibility(bgType);
      ctSend();
    });
  });

  // Range ↔ number input pairs
  const sliderPairs = [
    ['ct-bg-angle-range',         'ct-bg-angle-num'],
    ['ct-neon-intensity-range',   'ct-neon-intensity-num'],
    ['ct-name-size-range',        'ct-name-size-num'],
    ['ct-letter-spacing-range',   'ct-letter-spacing-num'],
    ['ct-particle-count-range',   'ct-particle-count-num'],
    ['ct-cover-opacity-range',    'ct-cover-opacity-num'],
    ['ct-bg-texture-opacity-range', 'ct-bg-texture-opacity-num'],
  ];
  sliderPairs.forEach(([rId, nId]) => {
    const r = document.getElementById(rId);
    const n = document.getElementById(nId);
    if (r && n) {
      r.addEventListener('input', () => { n.value = r.value; ctSend(); });
      n.addEventListener('input', () => { r.value = n.value; ctSend(); });
    }
  });

  // Checkboxes
  ['ct-neon-enabled','ct-neon-name','ct-neon-score','ct-neon-tag','ct-neon-event','ct-neon-accent'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      if (id === 'ct-neon-enabled') {
        const neonControls = document.getElementById('ct-neon-controls');
        if (neonControls) neonControls.style.display = el.checked ? '' : 'none';
      }
      ctSend();
    });
  });

  // Select dropdowns
  ['ct-font-family','ct-particle-type','ct-cover-mode','ct-bg-texture-size'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', ctSend);
  });

  // Cover image upload
  const coverInput = document.getElementById('ct-cover-input');
  if (coverInput) {
    coverInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        customTheme.coverImage = ev.target.result;
        const preview = document.getElementById('ct-cover-preview');
        if (preview) { preview.src = ev.target.result; preview.style.display = 'block'; }
        const empty = document.getElementById('ct-cover-empty');
        if (empty) empty.style.display = 'none';
        ctSend();
      };
      reader.readAsDataURL(file);
    });
  }

  // Cover image clear
  document.getElementById('ct-cover-clear')?.addEventListener('click', () => {
    customTheme.coverImage = null;
    const preview = document.getElementById('ct-cover-preview');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    const empty = document.getElementById('ct-cover-empty');
    if (empty) empty.style.display = '';
    const inp = document.getElementById('ct-cover-input');
    if (inp) inp.value = '';
    ctSend();
  });

  // Texture image upload
  const textureInput = document.getElementById('ct-bg-texture-input');
  if (textureInput) {
    textureInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        customTheme.bgTexture = ev.target.result;
        const preview = document.getElementById('ct-bg-texture-preview');
        if (preview) { preview.src = ev.target.result; preview.style.display = 'block'; }
        const empty = document.getElementById('ct-bg-texture-empty');
        if (empty) empty.style.display = 'none';
        ctSend();
      };
      reader.readAsDataURL(file);
    });
  }

  // Texture image clear
  document.getElementById('ct-bg-texture-clear')?.addEventListener('click', () => {
    customTheme.bgTexture = null;
    const preview = document.getElementById('ct-bg-texture-preview');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    const empty = document.getElementById('ct-bg-texture-empty');
    if (empty) empty.style.display = '';
    const inp = document.getElementById('ct-bg-texture-input');
    if (inp) inp.value = '';
    ctSend();
  });

  // Activate button
  const activateCustomTheme = () => {
    ctGet();
    const ns = buildStateFromForm();
    ns.overlayTheme = 'custom';
    ns.customTheme  = { ...customTheme };
    emitState(ns);
    document.querySelectorAll('.theme-preset-card').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-theme="custom"]')?.classList.add('active');
    ctUpdatePreview();
  };

  document.getElementById('btn-ct-apply')?.addEventListener('click', activateCustomTheme);

  // Clic sur la carte dans la grille
  document.getElementById('theme-card-custom')?.addEventListener('click', activateCustomTheme);
}

function ctLoad(ct) {
  if (!ct) return;
  customTheme = { ...CT_DEFAULTS, ...ct };

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
    // Also sync sibling hex text input for color pickers
    if (el && el.type === 'color') {
      const txt = el.parentElement?.querySelector('input[type="text"]');
      if (txt) txt.value = val;
    }
  };
  const setCheck = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };

  // bg type radio
  const bgRad = document.querySelector(`input[name="ct-bg-type"][value="${customTheme.bgType}"]`);
  if (bgRad) bgRad.checked = true;
  updateBgTypeVisibility(customTheme.bgType || 'gradient');

  set('ct-bg-color1', customTheme.bgColor1);
  set('ct-bg-color2', customTheme.bgColor2);
  set('ct-bg-angle-range',  customTheme.bgAngle);
  set('ct-bg-angle-num',    customTheme.bgAngle);
  set('ct-accent-color',    customTheme.accentColor);
  set('ct-p1-color',        customTheme.p1Color);
  set('ct-p2-color',        customTheme.p2Color);
  set('ct-name-color',      customTheme.nameColor);
  set('ct-tag-color',       customTheme.tagColor);
  set('ct-pronouns-color',  customTheme.pronounsColor);
  set('ct-score-color',     customTheme.scoreColor);
  set('ct-event-color',     customTheme.eventColor);
  set('ct-sep-color',       customTheme.scoreSepColor);
  setCheck('ct-neon-enabled', customTheme.neonEnabled);
  set('ct-neon-color',         customTheme.neonColor);
  set('ct-neon-intensity-range', customTheme.neonIntensity);
  set('ct-neon-intensity-num',   customTheme.neonIntensity);
  setCheck('ct-neon-name',    customTheme.neonName);
  setCheck('ct-neon-score',   customTheme.neonScore);
  setCheck('ct-neon-tag',     customTheme.neonTag);
  setCheck('ct-neon-event',   customTheme.neonEvent);
  setCheck('ct-neon-accent',  customTheme.neonAccent);
  set('ct-font-family',        customTheme.fontFamily);
  set('ct-name-size-range',    customTheme.nameFontSize);
  set('ct-name-size-num',      customTheme.nameFontSize);
  set('ct-letter-spacing-range', customTheme.letterSpacing);
  set('ct-letter-spacing-num',   customTheme.letterSpacing);
  set('ct-particle-type',      customTheme.particleType);
  set('ct-particle-count-range', customTheme.particleCount);
  set('ct-particle-count-num',   customTheme.particleCount);
  set('ct-cover-opacity-range',  customTheme.coverOpacity);
  set('ct-cover-opacity-num',    customTheme.coverOpacity);
  set('ct-cover-mode',           customTheme.coverMode);

  if (customTheme.coverImage) {
    const preview = document.getElementById('ct-cover-preview');
    if (preview) { preview.src = customTheme.coverImage; preview.style.display = 'block'; }
    const empty = document.getElementById('ct-cover-empty');
    if (empty) empty.style.display = 'none';
  }

  set('ct-bg-texture-opacity-range', customTheme.bgTextureOpacity ?? 80);
  set('ct-bg-texture-opacity-num',   customTheme.bgTextureOpacity ?? 80);
  set('ct-bg-texture-size',          customTheme.bgTextureSize || 'cover');
  if (customTheme.bgTexture) {
    const prev = document.getElementById('ct-bg-texture-preview');
    if (prev) { prev.src = customTheme.bgTexture; prev.style.display = 'block'; }
    const empty = document.getElementById('ct-bg-texture-empty');
    if (empty) empty.style.display = 'none';
  } else {
    const prev = document.getElementById('ct-bg-texture-preview');
    if (prev) { prev.src = ''; prev.style.display = 'none'; }
    const empty = document.getElementById('ct-bg-texture-empty');
    if (empty) empty.style.display = '';
  }

  const neonControls = document.getElementById('ct-neon-controls');
  if (neonControls) neonControls.style.display = customTheme.neonEnabled ? '' : 'none';

  ctUpdatePreview();
}

// Wire all events
ctWire();

// Load from initial state if available
if (typeof state !== 'undefined' && state && state.customTheme) {
  ctLoad(state.customTheme);
}

// Sync on socket state updates
socket.on('stateUpdate', (s) => {
  if (s && s.customTheme) ctLoad(s.customTheme);
});

// ─── Onglet Overlay multi-PC ─────────────────────────────────────────────────

(function initOverlayIP() {
  let _ipsLoaded = false;

  function loadIPs() {
    if (_ipsLoaded) return;
    fetch('/api/server-info')
      .then(r => r.json())
      .then(data => {
        _ipsLoaded = true;
        const list = document.getElementById('ip-list');
        const portEl = document.getElementById('ip-port');
        const urlText = document.getElementById('ip-url-text');
        const urlControl = document.getElementById('ip-control-url');
        if (!list) return;

        const port = data.port || 3002;
        if (portEl) portEl.textContent = port;

        const ips = data.ips || [];
        if (ips.length === 0) {
          list.innerHTML = '<span class="ip-loading">Aucune IP trouvée (réseau non disponible)</span>';
          return;
        }

        list.innerHTML = ips.map(ip =>
          `<span class="ip-chip" title="Cliquer pour copier">${ip}</span>`
        ).join('');

        // Clic sur un chip = copie l'IP
        list.querySelectorAll('.ip-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            navigator.clipboard.writeText(chip.textContent.trim()).then(() => {
              const orig = chip.textContent;
              chip.textContent = 'Copié !';
              setTimeout(() => { chip.textContent = orig; }, 1200);
            });
          });
        });

        // Panneau de contrôle : une URL cliquable par IP
        const controlList = document.getElementById('ip-control-list');
        if (controlList) {
          controlList.innerHTML = ips.map(ip =>
            `<a class="ip-chip ip-chip-link" href="http://${ip}:${port}/control" target="_blank">http://${ip}:${port}/control</a>`
          ).join('');
        }

        // Mettre à jour l'URL d'exemple avec la première IP
        const firstIP = ips[0];
        if (urlText) urlText.textContent = `http://${firstIP}:${port}/overlay`;
        if (urlControl) urlControl.textContent = `http://${firstIP}:${port}/control`;

        // Bouton copier l'URL overlay
        const copyBtn = document.getElementById('ip-copy-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(`http://${firstIP}:${port}/overlay`).then(() => {
              copyBtn.textContent = 'Copié !';
              setTimeout(() => { copyBtn.textContent = 'Copier'; }, 1500);
            });
          });
        }
      })
      .catch(() => {
        const list = document.getElementById('ip-list');
        if (list) list.innerHTML = '<span class="ip-loading">Erreur lors de la récupération de l\'IP</span>';
      });
  }

  // Charger l'IP quand l'onglet est ouvert
  document.querySelectorAll('.tab-btn[data-tab="overlayip"]').forEach(btn => {
    btn.addEventListener('click', loadIPs);
  });
  document.getElementById('tab-select-mobile')?.addEventListener('change', function() {
    if (this.value === 'overlayip') loadIPs();
  });
})();

// ─── Onglet Éléments libres ──────────────────────────────────────────────────

(function initSelElements() {
  let _debounce = null;
  let _loaded = false;

  // Envoie l'état complet de tous les éléments
  function sendAll() {
    clearTimeout(_debounce);
    _debounce = setTimeout(() => {
      const elements = {};
      document.querySelectorAll('.sel-row').forEach(row => {
        const visEl  = row.querySelector('.sel-vis');
        const xEl    = row.querySelector('.sel-x');
        const yEl    = row.querySelector('.sel-y');
        const sizeEl = row.querySelector('.sel-size');
        if (!xEl) return;
        const key = xEl.dataset.key;
        elements[key] = {
          x:       parseInt(xEl.value)    || 0,
          y:       parseInt(yEl.value)    || 0,
          visible: visEl ? visEl.checked : true,
          size:    sizeEl ? (parseInt(sizeEl.value) || 0) : undefined,
        };
        if (elements[key].size === undefined) delete elements[key].size;
      });

      const visible = document.getElementById('sel-visible')?.checked ?? true;
      fetch('/api/elements-overlay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible, elements }),
      });
    }, 80);
  }

  // Charge l'état depuis le serveur et remplit les inputs
  function loadState() {
    if (_loaded) return;
    fetch('/api/elements-overlay').then(r => r.json()).then(s => {
      _loaded = true;

      const visEl = document.getElementById('sel-visible');
      if (visEl) visEl.checked = s.visible !== false;

      const els = s.elements || {};
      for (const [key, conf] of Object.entries(els)) {
        const xEl    = document.querySelector(`.sel-x[data-key="${key}"]`);
        const yEl    = document.querySelector(`.sel-y[data-key="${key}"]`);
        const sEl    = document.querySelector(`.sel-size[data-key="${key}"]`);
        const vEl    = document.querySelector(`.sel-vis[data-key="${key}"]`);
        if (xEl) xEl.value = conf.x ?? xEl.value;
        if (yEl) yEl.value = conf.y ?? yEl.value;
        if (sEl && conf.size != null) sEl.value = conf.size;
        if (vEl) vEl.checked = conf.visible !== false;
      }
    }).catch(() => {});
  }

  // Wire les événements
  function wire() {
    document.querySelectorAll('.sel-x, .sel-y, .sel-size, .sel-vis').forEach(inp => {
      inp.addEventListener('input', sendAll);
    });
    const visEl = document.getElementById('sel-visible');
    if (visEl) visEl.addEventListener('change', sendAll);
  }

  // Charge quand l'onglet est ouvert
  document.querySelectorAll('.tab-btn[data-tab="builder"]').forEach(btn => {
    btn.addEventListener('click', loadState);
  });

  wire();
})();

// ─── Boutons copier URL par élément (onglet Éléments libres) ────────────────

(function initSelCopyButtons() {
  function buildButtons() {
    document.querySelectorAll('#tab-builder .sel-row').forEach(row => {
      if (row.querySelector('.sel-copy-btn')) return; // déjà ajouté

      const xInput = row.querySelector('.sel-x');
      if (!xInput) return;
      const key = xInput.dataset.key;
      const url = `${location.origin}/scoreboard-elements?el=${key}`;

      // Bouton +Canvas
      const canvasBtn = document.createElement('button');
      canvasBtn.className = 'btn btn-sm btn-primary sel-canvas-btn';
      canvasBtn.textContent = '+';
      canvasBtn.title = 'Ajouter au canvas du builder';
      canvasBtn.style.cssText = 'font-size:13px;padding:2px 7px;min-width:24px;';
      canvasBtn.addEventListener('click', () => {
        if (window.sbbAddFromElement) window.sbbAddFromElement(key);
        canvasBtn.textContent = '✓';
        setTimeout(() => { canvasBtn.textContent = '+'; }, 1000);
      });
      row.appendChild(canvasBtn);

      // Bouton OBS (copier URL)
      const wrap = document.createElement('div');
      wrap.className = 'sel-copy-wrap';
      wrap.title = url;

      const code = document.createElement('code');
      code.className = 'sel-copy-url';
      code.textContent = `?el=${key}`;

      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline sel-copy-btn';
      btn.textContent = 'OBS';
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(url).then(() => {
          btn.textContent = '✓';
          setTimeout(() => { btn.textContent = 'OBS'; }, 1400);
        });
      });

      wrap.appendChild(code);
      wrap.appendChild(btn);
      row.appendChild(wrap);
    });
  }

  // Injecte lors de l'ouverture de l'onglet
  document.querySelectorAll('.tab-btn[data-tab="builder"]').forEach(btn => {
    btn.addEventListener('click', buildButtons);
  });

  // Injecte immédiatement si l'onglet est actif au chargement
  if (document.getElementById('tab-builder')?.classList.contains('active')) {
    buildButtons();
  }
})();

// ══════════════════════════════════════════════════════════════
// CRÉATEUR DE SCOREBOARD
// ══════════════════════════════════════════════════════════════
(function () {

  /* ── État ───────────────────────────────────────────────── */
  let layouts      = [];
  let activeId     = null;
  let selectedId   = null;  // shape id
  let sbbScale     = 1;
  let dragState    = null;  // { type:'move'|'resize', shapeId, handle, startX, startY, origShape }
  let propsPosUnit = 'px';  // 'px' | '%'

  const _GEOM = { fill:'#E8B830', fillOpacity:1, border:'#FFFFFF', borderWidth:0, opacity:1, shadow:false, shadowBlur:16, shadowColor:'rgba(0,0,0,0.6)' };

  const SHAPE_DEFAULTS = {
    rect:         { w:400, h:80,  fill:'#0E0E12', fillOpacity:1, border:'#E8B830', borderWidth:2, radius:4, opacity:1, shadow:false, shadowBlur:16, shadowColor:'rgba(0,0,0,0.6)', linkedTo:'', linkPadLeft:0, linkPadRight:0, linkPadTop:0, linkPadBottom:0 },
    text:         { w:300, h:60,  text:'Texte',   fontSize:24,   fontFamily:'Russo One', fontWeight:'normal', textColor:'#FFFFFF', textAlign:'center', letterSpacing:0, uppercase:false, opacity:1, dynamic:'', template:'', shadow:false, shadowBlur:8, shadowColor:'rgba(0,0,0,0.6)', background:false, fill:'#000000', fillOpacity:0.5, radius:0, paddingX:12, autoWidth:false, anchorSide:'left', minW:50, maxW:900 },
    image:        { w:200, h:200, src:'',         objectFit:'cover', radius:0, opacity:1 },
    circle:       { w:100, h:100, ..._GEOM },
    oval:         { w:200, h:100, ..._GEOM },
    'semi-circle':{ w:200, h:100, direction:'top',  ..._GEOM },
    triangle:     { w:120, h:120, direction:'up',   ..._GEOM },
    star:         { w:120, h:120, ..._GEOM },
    diamond:      { w:100, h:140, ..._GEOM },
    hexagon:      { w:130, h:140, ..._GEOM },
  };

  const DYNAMIC_OPTS = [
    { v:'', label:'(statique)' },
    { v:'p1.name',     label:'Joueur 1 — Nom' },
    { v:'p1.tag',      label:'Joueur 1 — Tag' },
    { v:'p1.score',    label:'Joueur 1 — Score' },
    { v:'p1.pronouns', label:'Joueur 1 — Pronoms' },
    { v:'p1.seed',     label:'Joueur 1 — Seed' },
    { v:'p2.name',     label:'Joueur 2 — Nom' },
    { v:'p2.tag',      label:'Joueur 2 — Tag' },
    { v:'p2.score',    label:'Joueur 2 — Score' },
    { v:'p2.pronouns', label:'Joueur 2 — Pronoms' },
    { v:'p2.seed',     label:'Joueur 2 — Seed' },
    { v:'event',       label:'Événement' },
    { v:'stage',       label:'Round / Poule' },
    { v:'format',      label:'Format' },
  ];

  /* ── Helpers ────────────────────────────────────────────── */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
  function getLayout() { return layouts.find(l => l.id === activeId) || null; }
  function getShape(id) { const l = getLayout(); return l?.shapes.find(s => s.id === id) || null; }

  function hex2rgba(hex, a) {
    const h = (hex||'#000').replace('#','');
    return `rgba(${parseInt(h.slice(0,2),16)||0},${parseInt(h.slice(2,4),16)||0},${parseInt(h.slice(4,6),16)||0},${a??1})`;
  }

  /* ── Valeurs dynamiques (visualisateur) ─────────────────── */
  function getDynamicValue(key) {
    const s = state;
    const map = {
      'p1.name':     () => s.player1?.name     || '',
      'p1.tag':      () => s.player1?.tag      || '',
      'p1.score':    () => String(s.player1?.score ?? 0),
      'p1.pronouns': () => s.player1?.pronouns || '',
      'p1.seed':     () => s.player1?.seeding  != null ? String(s.player1.seeding) : '',
      'p2.name':     () => s.player2?.name     || '',
      'p2.tag':      () => s.player2?.tag      || '',
      'p2.score':    () => String(s.player2?.score ?? 0),
      'p2.pronouns': () => s.player2?.pronouns || '',
      'p2.seed':     () => s.player2?.seeding  != null ? String(s.player2.seeding) : '',
      'event':       () => s.event  || '',
      'stage':       () => s.stage  || '',
      'format':      () => s.format || '',
    };
    return map[key] ? map[key]() : '';
  }

  function getDynamicImageSrc(key) {
    const s = state;
    if (key === 'p1.char') return s.player1?.character ? `/full/chara_1_${s.player1.character.name}_00.png` : '';
    if (key === 'p2.char') return s.player2?.character ? `/full/chara_1_${s.player2.character.name}_00.png` : '';
    if (key === 'p1.flag') return s.player1?.flag ? '/' + s.player1.flag : '';
    if (key === 'p2.flag') return s.player2?.flag ? '/' + s.player2.flag : '';
    return '';
  }

  function resolveTemplate(tpl) {
    return tpl.replace(/\{([^}]+)\}/g, (_, key) => getDynamicValue(key.trim()));
  }

  function getTextContent(sh) {
    if (sh.template) return resolveTemplate(sh.template);
    if (sh.dynamic)  return getDynamicValue(sh.dynamic) || sh.text || 'Texte';
    return sh.text || 'Texte';
  }

  /* ── Auto-layout : étirement + liaisons ─────────────────── */
  function applyAutoLayout() {
    const l = getLayout(); if (!l) return;
    const inner = document.getElementById('sbb-canvas-inner'); if (!inner) return;

    // Passe 1 : auto-largeur des textes dynamiques
    l.shapes.forEach(sh => {
      if (sh.type !== 'text' || !sh.autoWidth) return;
      const el = inner.querySelector(`[data-id="${sh.id}"]`); if (!el) return;

      // Mesure la largeur réelle du contenu
      el.style.width = 'fit-content';
      el.style.maxWidth = (sh.maxW || 900) + 'px';
      const measured = Math.min(sh.maxW || 900, Math.max(sh.minW || 50, el.scrollWidth));
      el.style.width = measured + 'px';
      el.style.maxWidth = '';

      const prevW = sh.w;
      if (sh.anchorSide === 'right') {
        // Le bord droit est fixe : le gauche recule
        sh.x = (sh.x + prevW) - measured;
        el.style.left = sh.x + 'px';
      }
      sh.w = measured;
    });

    // Passe 2 : formes liées à un texte
    l.shapes.forEach(sh => {
      if (!sh.linkedTo) return;
      const textSh = l.shapes.find(s => s.id === sh.linkedTo); if (!textSh) return;
      const pL = sh.linkPadLeft  || 0;
      const pR = sh.linkPadRight || 0;
      const pT = sh.linkPadTop   || 0;
      const pB = sh.linkPadBottom|| 0;
      sh.x = textSh.x - pL;
      sh.y = textSh.y - pT;
      sh.w = textSh.w + pL + pR;
      sh.h = textSh.h + pT + pB;
      const el = inner.querySelector(`[data-id="${sh.id}"]`);
      if (el) {
        el.style.left   = sh.x + 'px';
        el.style.top    = sh.y + 'px';
        el.style.width  = sh.w + 'px';
        el.style.height = sh.h + 'px';
      }
    });

    // Passe 3 : formes collées (gluedTo) — plusieurs passes pour propager les chaînes
    for (let _p = 0; _p < 6; _p++) {
      let changed = false;
      l.shapes.forEach(sh => {
        if (!sh.gluedTo) return;
        const target = l.shapes.find(s => s.id === sh.gluedTo); if (!target) return;
        const gap = sh.glueGap ?? 0;
        let nx = sh.x, ny = sh.y;
        // Adjacence
        if      (sh.glueSide === 'right')   nx = target.x + target.w + gap;
        else if (sh.glueSide === 'left')    nx = target.x - sh.w - gap;
        else if (sh.glueSide === 'bottom')  ny = target.y + target.h + gap;
        else if (sh.glueSide === 'top')     ny = target.y - sh.h - gap;
        // Alignement axe X
        else if (sh.glueSide === 'ax-l')    nx = target.x;
        else if (sh.glueSide === 'ax-c')    nx = target.x + (target.w - sh.w) / 2;
        else if (sh.glueSide === 'ax-r')    nx = target.x + target.w - sh.w;
        // Alignement axe Y
        else if (sh.glueSide === 'ay-t')    ny = target.y;
        else if (sh.glueSide === 'ay-c')    ny = target.y + (target.h - sh.h) / 2;
        else if (sh.glueSide === 'ay-b')    ny = target.y + target.h - sh.h;
        if (nx !== sh.x || ny !== sh.y) { sh.x = Math.round(nx); sh.y = Math.round(ny); changed = true; }
        const el = inner.querySelector(`[data-id="${sh.id}"]`);
        if (el) { el.style.left = sh.x + 'px'; el.style.top = sh.y + 'px'; }
      });
      if (!changed) break;
    }

    renderHandles();
  }

  const GEOM_TYPES = ['circle','oval','semi-circle','triangle','star','diamond','hexagon'];

  const SEMI_RADIUS = {
    top:    '50% 50% 0 0 / 100% 100% 0 0',
    bottom: '0 0 50% 50% / 0 0 100% 100%',
    left:   '50% 0 0 50% / 100% 0 0 100%',
    right:  '0 50% 50% 0 / 0 100% 100% 0',
  };

  const SVG_DEFS = {
    'tri-up':    { pts: '50,3 97,97 3,97' },
    'tri-down':  { pts: '3,3 97,3 50,97' },
    'tri-left':  { pts: '97,3 97,97 3,50' },
    'tri-right': { pts: '3,3 97,50 3,97' },
    star:        { pts: '50,3 61,37 95,37 68,58 79,92 50,71 21,92 32,58 5,37 39,37' },
    diamond:     { pts: '50,3 97,50 50,97 3,50' },
    hexagon:     { pts: '50,3 97,27 97,73 50,97 3,73 3,27' },
  };

  /* ── Helpers points polygone ─────────────────────────────── */
  function parsePts(str) {
    return str.trim().split(/\s+/).map(p => p.split(',').map(Number));
  }
  function ptsToStr(arr) {
    return arr.map(([x,y]) => `${Math.round(x*10)/10},${Math.round(y*10)/10}`).join(' ');
  }
  function getShapePts(sh) {
    if (sh.customPoints) return sh.customPoints;
    if (sh.type === 'rect') return [[0,0],[100,0],[100,100],[0,100]];
    let key = sh.type;
    if (sh.type === 'triangle') key = 'tri-' + (sh.direction || 'up');
    const def = SVG_DEFS[key];
    return def ? parsePts(def.pts) : [];
  }
  const VERTEX_TYPES = ['rect','triangle','star','diamond','hexagon'];

  function applyGeomStyles(el, sh) {
    const bg = sh.type === 'rect'
      ? hex2rgba(sh.fill || '#0E0E12', sh.fillOpacity ?? 1)
      : hex2rgba(sh.fill || '#E8B830', sh.fillOpacity ?? 1);
    const bw = sh.borderWidth || 0;
    const bc = sh.type === 'rect' ? (sh.border || '#E8B830') : (sh.border || '#FFFFFF');

    if (sh.type === 'circle' || sh.type === 'oval') {
      el.style.background   = bg;
      el.style.borderRadius = '50%';
      if (bw > 0) el.style.border = `${bw}px solid ${bc}`;
      if (sh.shadow) el.style.boxShadow = `0 4px ${sh.shadowBlur||16}px ${sh.shadowColor||'rgba(0,0,0,0.6)'}`;
      return;
    }

    if (sh.type === 'semi-circle') {
      el.style.background   = bg;
      el.style.borderRadius = SEMI_RADIUS[sh.direction || 'top'];
      if (bw > 0) el.style.border = `${bw}px solid ${bc}`;
      if (sh.shadow) el.style.boxShadow = `0 4px ${sh.shadowBlur||16}px ${sh.shadowColor||'rgba(0,0,0,0.6)'}`;
      return;
    }

    // SVG shapes
    const ptsArr = getShapePts(sh);
    if (!ptsArr.length) return;
    const ptsStr = ptsToStr(ptsArr);

    const ns  = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.cssText = 'width:100%;height:100%;display:block;position:absolute;inset:0;overflow:visible;';
    const poly = document.createElementNS(ns, 'polygon');
    poly.setAttribute('points', ptsStr);
    poly.setAttribute('fill', bg);
    if (bw > 0) {
      poly.setAttribute('stroke', bc);
      poly.setAttribute('stroke-width', String(bw * 1.2));
      poly.setAttribute('vector-effect', 'non-scaling-stroke');
    }
    if (sh.shadow) {
      const filterId = 'sf-' + sh.id.replace(/[^a-z0-9]/gi,'');
      const defs = document.createElementNS(ns, 'defs');
      const filt = document.createElementNS(ns, 'filter');
      filt.setAttribute('id', filterId);
      filt.setAttribute('x','-20%'); filt.setAttribute('y','-20%');
      filt.setAttribute('width','140%'); filt.setAttribute('height','140%');
      const blur = document.createElementNS(ns, 'feGaussianBlur');
      blur.setAttribute('stdDeviation', String((sh.shadowBlur||16) * 0.3));
      blur.setAttribute('in', 'SourceAlpha');
      blur.setAttribute('result','blur');
      const flood = document.createElementNS(ns, 'feFlood');
      flood.setAttribute('flood-color', sh.shadowColor||'rgba(0,0,0,0.6)');
      flood.setAttribute('result','color');
      const comp = document.createElementNS(ns, 'feComposite');
      comp.setAttribute('in','color'); comp.setAttribute('in2','blur');
      comp.setAttribute('operator','in'); comp.setAttribute('result','shadow');
      const merge = document.createElementNS(ns, 'feMerge');
      const mn1 = document.createElementNS(ns, 'feMergeNode'); mn1.setAttribute('in','shadow');
      const mn2 = document.createElementNS(ns, 'feMergeNode'); mn2.setAttribute('in','SourceGraphic');
      merge.appendChild(mn1); merge.appendChild(mn2);
      filt.appendChild(blur); filt.appendChild(flood); filt.appendChild(comp); filt.appendChild(merge);
      defs.appendChild(filt);
      svg.appendChild(defs);
      poly.setAttribute('filter', `url(#${filterId})`);
    }
    svg.appendChild(poly);
    el.style.overflow = 'visible';
    el.appendChild(svg);
  }

  /* ── API ────────────────────────────────────────────────── */
  async function apiLoad() {
    const d = await fetch('/api/sb-layouts').then(r=>r.json()).catch(()=>({layouts:[]}));
    layouts = d.layouts || [];
  }

  async function apiCreate(name) {
    const d = await fetch('/api/sb-layouts',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name}) }).then(r=>r.json());
    layouts.push(d.layout);
    return d.layout;
  }

  async function apiSave() {
    const l = getLayout(); if (!l) return;
    await fetch(`/api/sb-layouts/${l.id}`,{ method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name:l.name, shapes:l.shapes }) });
  }

  let _saveTimer = null;
  function scheduleSave() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(apiSave, 300);
  }

  async function apiDelete(id) {
    await fetch(`/api/sb-layouts/${id}`,{ method:'DELETE' });
    layouts = layouts.filter(l=>l.id!==id);
  }

  /* ── Canvas scaling ─────────────────────────────────────── */
  function updateScale() {
    const wrap  = document.getElementById('sbb-canvas-wrap');
    const inner = document.getElementById('sbb-canvas-inner');
    if (!wrap || !inner) return;
    sbbScale = wrap.clientWidth / 1920;
    inner.style.transform = `scale(${sbbScale})`;
    wrap.style.height = Math.round(1080 * sbbScale) + 'px';
  }

  function clientToCanvas(clientX, clientY) {
    const wrap = document.getElementById('sbb-canvas-wrap');
    const rect = wrap.getBoundingClientRect();
    return {
      x: (clientX - rect.left)  / sbbScale,
      y: (clientY - rect.top)   / sbbScale,
    };
  }

  /* ── Render canvas ──────────────────────────────────────── */
  function renderCanvas() {
    const inner = document.getElementById('sbb-canvas-inner'); if (!inner) return;
    const inter = document.getElementById('sbb-interact-layer'); if (!inter) return;
    inner.innerHTML = '';
    inter.innerHTML = '';
    const l = getLayout(); if (!l) return;

    l.shapes.forEach((sh, idx) => {
      const el = document.createElement('div');
      el.className  = 'sbb-shape-preview';
      el.dataset.id = sh.id;
      el.style.cssText = `
        position:absolute;
        left:${sh.x}px;top:${sh.y}px;
        width:${sh.w}px;height:${sh.h}px;
        opacity:${sh.visible===false?0.25:sh.opacity??1};
        cursor:move;
        box-sizing:border-box;
        overflow:hidden;
        pointer-events:auto;
        z-index:${idx+1};
      `;

      if (sh.type === 'rect') {
        if (sh.customPoints) {
          // Déformé → rendu SVG polygone
          applyGeomStyles(el, sh);
        } else {
          el.style.background   = hex2rgba(sh.fill||'#0E0E12', sh.fillOpacity??1);
          el.style.borderRadius = (sh.radius||0) + 'px';
          if ((sh.borderWidth||0)>0) el.style.border = `${sh.borderWidth}px solid ${sh.border||'#E8B830'}`;
          if (sh.shadow) el.style.boxShadow = `0 4px ${sh.shadowBlur||16}px ${sh.shadowColor||'rgba(0,0,0,0.6)'}`;
        }
      }

      if (GEOM_TYPES.includes(sh.type)) {
        applyGeomStyles(el, sh);
      }

      if (sh.type === 'text') {
        el.style.display       = 'flex';
        el.style.alignItems    = 'center';
        el.style.justifyContent = sh.textAlign==='left'?'flex-start':sh.textAlign==='right'?'flex-end':'center';
        el.style.fontFamily    = `'${sh.fontFamily||'Russo One'}', sans-serif`;
        el.style.fontSize      = (sh.fontSize||24) + 'px';
        el.style.fontWeight    = sh.fontWeight||'normal';
        el.style.color         = sh.textColor||'#FFFFFF';
        el.style.letterSpacing = (sh.letterSpacing||0) + 'px';
        el.style.textTransform = sh.uppercase?'uppercase':'none';
        el.style.padding       = '0 ' + (sh.paddingX||0) + 'px';
        el.style.whiteSpace    = 'nowrap';
        el.style.overflow      = 'hidden';
        if (sh.background) {
          el.style.background   = hex2rgba(sh.fill||'#000000', sh.fillOpacity??0.5);
          el.style.borderRadius = (sh.radius||0) + 'px';
        }
        el.textContent = getTextContent(sh);
      }

      if (sh.type === 'image') {
        el.style.borderRadius = (sh.radius||0) + 'px';
        const resolvedSrc = sh.dynamicSrc ? getDynamicImageSrc(sh.dynamicSrc) : sh.src;
        if (resolvedSrc) {
          const img = document.createElement('img');
          img.src = resolvedSrc;
          if (sh.dynamicSrc) el.dataset.dynamicSrc = sh.dynamicSrc;
          img.style.width='100%'; img.style.height='100%'; img.style.objectFit=sh.objectFit||'cover';
          img.style.borderRadius=(sh.radius||0)+'px';
          el.appendChild(img);
        } else {
          el.style.border='2px dashed rgba(255,255,255,0.2)';
          el.style.display='flex'; el.style.alignItems='center'; el.style.justifyContent='center';
          el.style.color='rgba(255,255,255,0.3)'; el.style.fontSize='12px';
          el.textContent = sh.dynamicSrc ? sh.dynamicSrc : 'Image';
        }
      }

      el.addEventListener('mousedown', e => { e.stopPropagation(); sbbSelectShape(sh.id); sbbStartDrag(e, sh.id); });
      inner.appendChild(el);
    });

    renderHandles();
    applyAutoLayout();
  }

  function renderHandles() {
    const inter = document.getElementById('sbb-interact-layer'); if (!inter) return;
    inter.innerHTML = '';
    if (!selectedId) return;
    const sh = getShape(selectedId); if (!sh) return;

    // Outline
    const outline = document.createElement('div');
    outline.style.cssText = `
      position:absolute;
      left:${sh.x * sbbScale}px;top:${sh.y * sbbScale}px;
      width:${sh.w * sbbScale}px;height:${sh.h * sbbScale}px;
      border:2px solid #4AF;
      box-shadow:0 0 0 1px rgba(0,0,0,0.4);
      pointer-events:none;
      z-index:300;
    `;
    inter.appendChild(outline);

    // Handles
    const HANDLES = [
      { id:'nw', cx:0,   cy:0   }, { id:'n',  cx:0.5, cy:0   }, { id:'ne', cx:1,   cy:0   },
      { id:'w',  cx:0,   cy:0.5 }, { id:'e',  cx:1,   cy:0.5 },
      { id:'sw', cx:0,   cy:1   }, { id:'s',  cx:0.5, cy:1   }, { id:'se', cx:1,   cy:1   },
    ];
    const CURSORS = { nw:'nw-resize',n:'n-resize',ne:'ne-resize',w:'w-resize',e:'e-resize',sw:'sw-resize',s:'s-resize',se:'se-resize' };

    HANDLES.forEach(h => {
      const hEl = document.createElement('div');
      const hx = (sh.x + sh.w * h.cx) * sbbScale;
      const hy = (sh.y + sh.h * h.cy) * sbbScale;
      hEl.style.cssText = `
        position:absolute;
        left:${hx - 5}px;top:${hy - 5}px;
        width:10px;height:10px;
        background:#fff;border:2px solid #4AF;
        border-radius:2px;
        cursor:${CURSORS[h.id]};
        z-index:301;
        pointer-events:auto;
      `;
      hEl.dataset.handle = h.id;
      hEl.addEventListener('mousedown', e => { e.stopPropagation(); sbbStartResize(e, sh.id, h.id); });
      inter.appendChild(hEl);
    });

    // Poignées de vertex pour les polygones
    if (VERTEX_TYPES.includes(sh.type)) {
      const pts = getShapePts(sh);
      pts.forEach(([vx, vy], idx) => {
        const hx = (sh.x + (vx / 100) * sh.w) * sbbScale;
        const hy = (sh.y + (vy / 100) * sh.h) * sbbScale;
        const vh = document.createElement('div');
        vh.style.cssText = `
          position:absolute;
          left:${hx}px; top:${hy}px;
          width:10px; height:10px;
          transform:translate(-50%,-50%);
          border-radius:50%;
          background:#F80; border:2px solid #FFF;
          cursor:crosshair;
          z-index:302;
          pointer-events:auto;
          box-shadow:0 0 4px rgba(0,0,0,0.6);
        `;
        vh.title = `Point ${idx + 1} (${Math.round(vx)},${Math.round(vy)})`;
        vh.addEventListener('mousedown', e => { e.stopPropagation(); sbbStartVertexDrag(e, sh.id, idx); });
        inter.appendChild(vh);
      });
    }
  }

  /* ── Layers list ─────────────────────────────────────────── */
  function renderLayers() {
    const container = document.getElementById('sbb-layers'); if (!container) return;
    const l = getLayout();
    if (!l || l.shapes.length === 0) {
      container.innerHTML = '<p style="font-size:12px;color:var(--text-muted);text-align:center;padding:16px 0;">Aucune forme — cliquer sur "Ajouter" à gauche</p>';
      return;
    }
    container.innerHTML = '';
    // Render in reverse order (top layers first)
    [...l.shapes].reverse().forEach((sh, _i) => {
      const realIdx = l.shapes.indexOf(sh);
      const row = document.createElement('div');
      row.className = 'sbb-layer-row';
      row.dataset.id = sh.id;
      row.style.cssText = `
        display:flex;align-items:center;gap:6px;
        padding:5px 8px;border-radius:5px;cursor:pointer;
        background:${sh.id===selectedId?'rgba(68,170,255,0.12)':'transparent'};
        border:1px solid ${sh.id===selectedId?'rgba(68,170,255,0.3)':'transparent'};
        font-size:12px;color:var(--text);
      `;

      // Drag handle
      const grip = document.createElement('span');
      grip.textContent = '⠿';
      grip.style.cssText='color:var(--text-muted);cursor:ns-resize;flex-shrink:0;font-size:14px;';
      grip.dataset.gripFor = sh.id;

      // Type icon
      const icon = document.createElement('span');
      icon.textContent = sh.type==='rect'?'▬':sh.type==='text'?'T':'🖼';
      icon.style.cssText='flex-shrink:0;font-size:10px;width:16px;text-align:center;';

      // Name
      const name = document.createElement('span');
      name.textContent = sh.name || sh.type;
      name.style.cssText='flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';

      // Visibility
      const vis = document.createElement('button');
      vis.textContent = sh.visible===false ? '👁‍🗨' : '👁';
      vis.title = sh.visible===false ? 'Afficher' : 'Masquer';
      vis.style.cssText='background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:12px;padding:2px;';
      vis.addEventListener('click', e => {
        e.stopPropagation();
        sh.visible = sh.visible === false ? true : false;
        renderCanvas(); renderLayers(); scheduleSave();
      });

      row.appendChild(grip);
      row.appendChild(icon);
      row.appendChild(name);
      row.appendChild(vis);

      row.addEventListener('click', () => sbbSelectShape(sh.id));
      container.appendChild(row);
    });

    // Layer drag-to-reorder
    setupLayerDrag(container, l);
  }

  function setupLayerDrag(container, l) {
    let draggingId = null;
    container.querySelectorAll('[data-grip-for]').forEach(grip => {
      grip.addEventListener('mousedown', e => {
        e.preventDefault();
        draggingId = grip.dataset.gripFor;
        const row = grip.closest('.sbb-layer-row');
        row.style.opacity = '0.5';

        function onMove(ev) {
          const els = [...container.querySelectorAll('.sbb-layer-row')];
          const target = els.find(r => {
            const rect = r.getBoundingClientRect();
            return ev.clientY >= rect.top && ev.clientY <= rect.bottom && r.dataset.id !== draggingId;
          });
          if (target) {
            container.querySelectorAll('.sbb-layer-row').forEach(r => r.style.borderTop='');
            target.style.borderTop = '2px solid #4AF';
          }
        }

        function onUp(ev) {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          row.style.opacity='';
          container.querySelectorAll('.sbb-layer-row').forEach(r => r.style.borderTop='');

          // find drop target
          const els = [...container.querySelectorAll('.sbb-layer-row')];
          const target = els.find(r => {
            const rect = r.getBoundingClientRect();
            return ev.clientY >= rect.top && ev.clientY <= rect.bottom && r.dataset.id !== draggingId;
          });
          if (target) {
            // layers are rendered reversed, so we need to invert
            const fromIdx = l.shapes.findIndex(s=>s.id===draggingId);
            const toIdx   = l.shapes.findIndex(s=>s.id===target.dataset.id);
            if (fromIdx>-1 && toIdx>-1 && fromIdx!==toIdx) {
              const [sh] = l.shapes.splice(fromIdx,1);
              l.shapes.splice(toIdx,0,sh);
              renderCanvas(); renderLayers(); scheduleSave();
            }
          }
          draggingId = null;
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  /* ── Shape selection ─────────────────────────────────────── */
  function sbbSelectShape(id) {
    selectedId = id;
    renderHandles();
    renderLayers();
    renderProps();
  }

  function sbbDeselect() {
    selectedId = null;
    renderHandles();
    renderLayers();
    renderProps();
  }

  /* ── Snap / guides d'alignement ─────────────────────────── */
  const SNAP_THRESHOLD = 5;

  function computeSnaps(sh) {
    const l = getLayout();
    if (!l) return { snapX: null, snapY: null, guides: [] };

    // Bords du shape déplacé (non-snappé)
    const myX = [sh.x, sh.x + Math.round(sh.w / 2), sh.x + sh.w];
    const myY = [sh.y, sh.y + Math.round(sh.h / 2), sh.y + sh.h];

    let bestDx = null, bestDy = null;
    const seen = new Set();
    const guides = [];

    l.shapes.forEach(o => {
      if (o.id === sh.id || o.visible === false) return;
      const ox = [o.x, o.x + Math.round(o.w / 2), o.x + o.w];
      const oy = [o.y, o.y + Math.round(o.h / 2), o.y + o.h];

      myX.forEach(mx => {
        ox.forEach(ex => {
          const d = ex - mx;
          if (Math.abs(d) <= SNAP_THRESHOLD) {
            if (bestDx === null || Math.abs(d) < Math.abs(bestDx)) bestDx = d;
            const key = 'x' + ex;
            if (!seen.has(key)) { seen.add(key); guides.push({ axis:'x', pos: ex }); }
          }
        });
      });

      myY.forEach(my => {
        oy.forEach(ey => {
          const d = ey - my;
          if (Math.abs(d) <= SNAP_THRESHOLD) {
            if (bestDy === null || Math.abs(d) < Math.abs(bestDy)) bestDy = d;
            const key = 'y' + ey;
            if (!seen.has(key)) { seen.add(key); guides.push({ axis:'y', pos: ey }); }
          }
        });
      });
    });

    return { snapX: bestDx, snapY: bestDy, guides };
  }

  function renderSnapGuides(guides) {
    const el = document.getElementById('sbb-snap-guides');
    if (!el) return;
    el.innerHTML = '';
    guides.forEach(g => {
      const line = document.createElement('div');
      if (g.axis === 'x') {
        const px = g.pos * sbbScale;
        line.style.cssText = `position:absolute;left:${px}px;top:0;bottom:0;width:1px;background:#FF3D9A;box-shadow:0 0 3px #FF3D9A;`;
      } else {
        const py = g.pos * sbbScale;
        line.style.cssText = `position:absolute;top:${py}px;left:0;right:0;height:1px;background:#FF3D9A;box-shadow:0 0 3px #FF3D9A;`;
      }
      el.appendChild(line);
    });
  }

  function clearSnapGuides() {
    const el = document.getElementById('sbb-snap-guides');
    if (el) el.innerHTML = '';
  }

  function isSnapEnabled() {
    return document.getElementById('sbb-snap-enabled')?.checked ?? true;
  }

  /* ── Drag to move ────────────────────────────────────────── */
  function sbbStartDrag(e, shapeId) {
    e.preventDefault();
    const sh = getShape(shapeId); if (!sh) return;
    const start = clientToCanvas(e.clientX, e.clientY);
    dragState = { type:'move', shapeId, startX:start.x, startY:start.y, origX:sh.x, origY:sh.y };

    function onMove(ev) {
      const pos = clientToCanvas(ev.clientX, ev.clientY);
      const dx = pos.x - dragState.startX;
      const dy = pos.y - dragState.startY;
      sh.x = Math.round(dragState.origX + dx);
      sh.y = Math.round(dragState.origY + dy);

      if (isSnapEnabled()) {
        const { snapX, snapY, guides } = computeSnaps(sh);
        if (snapX !== null) sh.x += Math.round(snapX);
        if (snapY !== null) sh.y += Math.round(snapY);
        renderSnapGuides(guides);
      } else {
        clearSnapGuides();
      }

      const el = document.querySelector(`#sbb-canvas-inner [data-id="${shapeId}"]`);
      if (el) { el.style.left = sh.x+'px'; el.style.top = sh.y+'px'; }
      renderHandles();
      renderProps();
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      clearSnapGuides();
      dragState = null;
      scheduleSave();
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  /* ── Resize ──────────────────────────────────────────────── */
  function sbbStartResize(e, shapeId, handle) {
    e.preventDefault();
    const sh = getShape(shapeId); if (!sh) return;
    const start = clientToCanvas(e.clientX, e.clientY);
    dragState = { type:'resize', shapeId, handle, startX:start.x, startY:start.y, orig:{ x:sh.x, y:sh.y, w:sh.w, h:sh.h } };
    const MIN = 20;

    function onMove(ev) {
      const pos  = clientToCanvas(ev.clientX, ev.clientY);
      const dx   = pos.x - dragState.startX;
      const dy   = pos.y - dragState.startY;
      const o    = dragState.orig;
      let { x, y, w, h } = o;

      if (handle.includes('e')) w = Math.max(MIN, o.w + dx);
      if (handle.includes('s')) h = Math.max(MIN, o.h + dy);
      if (handle.includes('w')) { const nw = Math.max(MIN, o.w - dx); x = o.x + (o.w - nw); w = nw; }
      if (handle.includes('n')) { const nh = Math.max(MIN, o.h - dy); y = o.y + (o.h - nh); h = nh; }

      sh.x = Math.round(x); sh.y = Math.round(y);
      sh.w = Math.round(w); sh.h = Math.round(h);

      const el = document.querySelector(`#sbb-canvas-inner [data-id="${shapeId}"]`);
      if (el) { el.style.left=sh.x+'px'; el.style.top=sh.y+'px'; el.style.width=sh.w+'px'; el.style.height=sh.h+'px'; }
      renderHandles();
      renderProps();
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      dragState = null;
      scheduleSave();
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  /* ── Vertex drag ─────────────────────────────────────────── */
  function sbbStartVertexDrag(e, shapeId, vtxIdx) {
    e.preventDefault();
    const sh = getShape(shapeId); if (!sh) return;
    // Initialise customPoints depuis les défauts si pas encore modifié
    if (!sh.customPoints) sh.customPoints = getShapePts(sh);

    function onMove(ev) {
      const pos = clientToCanvas(ev.clientX, ev.clientY);
      const vx = ((pos.x - sh.x) / sh.w) * 100;
      const vy = ((pos.y - sh.y) / sh.h) * 100;
      sh.customPoints[vtxIdx] = [Math.round(vx * 10) / 10, Math.round(vy * 10) / 10];
      // Redessine juste le SVG dans l'élément canvas
      const el = document.querySelector(`#sbb-canvas-inner [data-id="${shapeId}"]`);
      if (el) {
        const oldSvg = el.querySelector('svg');
        if (oldSvg) oldSvg.remove();
        applyGeomStyles(el, sh);
      }
      renderHandles();
    }

    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      scheduleSave();
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  /* ── Properties panel ────────────────────────────────────── */
  function row(label, input) {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;align-items:center;gap:10px;';
    const l = document.createElement('label');
    l.textContent = label;
    l.style.cssText = 'font-size:12px;color:var(--text-muted);min-width:100px;flex-shrink:0;';
    d.appendChild(l);
    if (input) d.appendChild(input);
    return d;
  }

  function makeInput(type, val, onChange, opts={}) {
    const el = document.createElement('input');
    el.type  = type;
    if (type==='checkbox') el.checked = !!val;
    else el.value = val ?? '';
    if (opts.min !== undefined) el.min = opts.min;
    if (opts.max !== undefined) el.max = opts.max;
    if (opts.step !== undefined) el.step = opts.step;
    el.style.cssText = type==='color'
      ? 'width:36px;height:28px;cursor:pointer;border:none;background:none;padding:0;'
      : type==='checkbox'
      ? 'cursor:pointer;'
      : 'flex:1;padding:5px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:5px;color:var(--text);font-size:12px;min-width:0;';
    const evt = type==='checkbox'?'change':'input';
    el.addEventListener(evt, () => onChange(type==='checkbox'?el.checked:(type==='number'?parseFloat(el.value):el.value)));
    return el;
  }

  function makeSelect(options, val, onChange) {
    const el = document.createElement('select');
    el.style.cssText = 'flex:1;padding:5px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:5px;color:var(--text);font-size:12px;';
    options.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.v || o; opt.textContent = o.label || o;
      if (opt.value === val) opt.selected = true;
      el.appendChild(opt);
    });
    el.addEventListener('change', () => onChange(el.value));
    return el;
  }

  function renderProps() {
    const card  = document.getElementById('sbb-props-card');
    const body  = document.getElementById('sbb-props-body');
    const title = document.getElementById('sbb-props-title');
    if (!card||!body||!title) return;

    const sh = selectedId ? getShape(selectedId) : null;
    card.style.display = sh ? '' : 'none';
    if (!sh) return;

    title.textContent = 'Propriétés — ' + (sh.name||sh.type);
    body.innerHTML = '';

    function prop(key) { return v => { sh[key]=v; scheduleSave(); renderCanvas(); if(['x','y','w','h'].includes(key)) renderHandles(); } }

    // Name
    const nameInput = makeInput('text', sh.name, v => { sh.name=v; renderLayers(); scheduleSave(); });
    nameInput.placeholder='Nom de la forme';
    body.appendChild(row('Nom', nameInput));

    // Geometry — px / % toggle
    const CANVAS_W = 1920, CANVAS_H = 1080;
    const GEO_BASE = {x:CANVAS_W, y:CANVAS_H, w:CANVAS_W, h:CANVAS_H};

    function pxToDisp(px, k) {
      if (propsPosUnit === '%') return Math.round(px / GEO_BASE[k] * 10000) / 100;
      return px;
    }
    function dispToPx(val, k) {
      if (propsPosUnit === '%') return Math.round(val * GEO_BASE[k] / 100);
      return Math.round(val);
    }

    const unitToggle = document.createElement('button');
    unitToggle.className = 'btn btn-outline btn-sm';
    unitToggle.textContent = propsPosUnit === 'px' ? 'px' : '%';
    unitToggle.style.cssText = 'font-size:10px;padding:1px 6px;min-width:28px;';
    unitToggle.title = 'Basculer px / %';

    const gRow = document.createElement('div');
    gRow.style.cssText='display:flex;gap:6px;flex-wrap:wrap;align-items:center;';

    const geoInputs = {};
    [['X',sh.x,'x'],['Y',sh.y,'y'],['L',sh.w,'w'],['H',sh.h,'h']].forEach(([l,v,k])=>{
      const wrapper = document.createElement('div');
      wrapper.style.cssText='display:flex;align-items:center;gap:4px;';
      const lbl = document.createElement('span');
      lbl.textContent=l; lbl.style.cssText='font-size:11px;color:var(--text-muted);min-width:10px;';
      const step = propsPosUnit === '%' ? 0.01 : 1;
      const inp = makeInput('number', pxToDisp(v,k), val => {
        sh[k] = dispToPx(val, k);
        scheduleSave(); renderCanvas(); renderHandles();
      }, {step});
      inp.style.width='70px'; inp.style.flex='none';
      geoInputs[k] = inp;
      wrapper.appendChild(lbl); wrapper.appendChild(inp); gRow.appendChild(wrapper);
    });
    gRow.appendChild(unitToggle);

    unitToggle.addEventListener('click', () => {
      propsPosUnit = propsPosUnit === 'px' ? '%' : 'px';
      unitToggle.textContent = propsPosUnit;
      const newStep = propsPosUnit === '%' ? 0.01 : 1;
      Object.entries(geoInputs).forEach(([k, inp]) => {
        inp.value = pxToDisp(sh[k], k);
        inp.step  = newStep;
      });
    });

    body.appendChild(row('Position / Taille', gRow));

    // Opacity
    body.appendChild(row('Opacité', makeInput('number', Math.round((sh.opacity??1)*100), v=>{sh.opacity=v/100;prop('opacity')(sh.opacity);}, {min:0,max:100,step:1})));

    // Shared fill+border props for rect and all geometric shapes
    if (sh.type === 'rect' || GEOM_TYPES.includes(sh.type)) {
      const fillRow = document.createElement('div');
      fillRow.style.cssText='display:flex;gap:8px;align-items:center;flex:1;';
      fillRow.appendChild(makeInput('color', sh.fill||'#E8B830', v=>{sh.fill=v;prop('fill')(v);}));
      const opInput = makeInput('number', Math.round((sh.fillOpacity??1)*100), v=>{sh.fillOpacity=v/100;scheduleSave();renderCanvas();},{min:0,max:100,step:1});
      opInput.style.width='60px';opInput.style.flex='none';
      const opLabel = document.createElement('span'); opLabel.textContent='% opacité'; opLabel.style.cssText='font-size:11px;color:var(--text-muted);';
      fillRow.appendChild(opInput); fillRow.appendChild(opLabel);
      body.appendChild(row('Fond', fillRow));

      const borderRow = document.createElement('div');
      borderRow.style.cssText='display:flex;gap:8px;align-items:center;flex:1;';
      borderRow.appendChild(makeInput('color', sh.border||'#FFFFFF', v=>{sh.border=v;prop('border')(v);}));
      const bwInput = makeInput('number', sh.borderWidth??0, v=>{sh.borderWidth=v;scheduleSave();renderCanvas();},{min:0,max:20,step:1});
      bwInput.style.width='60px';bwInput.style.flex='none';
      const bwLabel = document.createElement('span'); bwLabel.textContent='px'; bwLabel.style.cssText='font-size:11px;color:var(--text-muted);';
      borderRow.appendChild(bwInput); borderRow.appendChild(bwLabel);
      body.appendChild(row('Contour', borderRow));

      if (sh.type === 'rect') {
        body.appendChild(row('Rayon', makeInput('number', sh.radius||0, v=>{sh.radius=v;prop('radius')(v);},{min:0,max:200,step:1})));
      }

      // Direction selector for semi-circle and triangle
      if (sh.type === 'semi-circle') {
        body.appendChild(row('Direction', makeSelect(
          [{v:'top',label:'Haut (dôme)'},{v:'bottom',label:'Bas'},{v:'left',label:'Gauche'},{v:'right',label:'Droite'}],
          sh.direction||'top', v=>{sh.direction=v;scheduleSave();renderCanvas();}
        )));
      }
      if (sh.type === 'triangle') {
        body.appendChild(row('Direction', makeSelect(
          [{v:'up',label:'▲ Haut'},{v:'down',label:'▼ Bas'},{v:'left',label:'◀ Gauche'},{v:'right',label:'▶ Droite'}],
          sh.direction||'up', v=>{sh.direction=v;scheduleSave();renderCanvas();}
        )));
      }

      // Liaison à un texte
      const l = getLayout();
      const textShapes = (l ? l.shapes : []).filter(s => s.type === 'text' && s.id !== sh.id);
      const linkedOpts = [{v:'',label:'— aucune liaison —'}, ...textShapes.map(s=>({v:s.id,label:s.name||s.text||s.id}))];
      body.appendChild(row('Lié à (texte)', makeSelect(linkedOpts, sh.linkedTo||'', v=>{
        sh.linkedTo=v; scheduleSave(); renderCanvas();
        linkPadSection.style.display = v ? 'contents' : 'none';
      })));

      const linkPadSection = document.createElement('div');
      linkPadSection.style.display = sh.linkedTo ? 'contents' : 'none';
      const padRow = document.createElement('div');
      padRow.style.cssText='display:flex;gap:6px;flex-wrap:wrap;';
      [['G',sh.linkPadLeft||0,'linkPadLeft'],['D',sh.linkPadRight||0,'linkPadRight'],['H',sh.linkPadTop||0,'linkPadTop'],['B',sh.linkPadBottom||0,'linkPadBottom']].forEach(([pl,v,k])=>{
        const wrapper = document.createElement('div');
        wrapper.style.cssText='display:flex;align-items:center;gap:3px;';
        const lbl=document.createElement('span');lbl.textContent=pl;lbl.style.cssText='font-size:11px;color:var(--text-muted);';
        const inp=makeInput('number',v,val=>{sh[k]=Math.round(val);scheduleSave();renderCanvas();},{step:1,min:-200,max:200});
        inp.style.width='60px';
        wrapper.appendChild(lbl);wrapper.appendChild(inp);padRow.appendChild(wrapper);
      });
      linkPadSection.appendChild(padRow);
      body.appendChild(row('Marge liaison', linkPadSection));
    }

    if (sh.type === 'text') {
      // ── Mode texte : statique / dynamique / template ──────
      const MODE_OPTS = [
        {v:'static',   label:'Statique'},
        {v:'dynamic',  label:'Dynamique (1 clé)'},
        {v:'template', label:'Template (multi-liaisons)'},
      ];
      const currentMode = sh.textMode || (sh.template ? 'template' : (sh.dynamic ? 'dynamic' : 'static'));

      const modeStaticRow    = document.createElement('div');
      const modeDynamicRow   = document.createElement('div');
      const modeTemplateRow  = document.createElement('div');

      function showMode(m) {
        modeStaticRow.style.display   = m === 'static'   ? 'flex' : 'none';
        modeDynamicRow.style.display  = m === 'dynamic'  ? 'flex' : 'none';
        modeTemplateRow.style.display = m === 'template' ? '' : 'none';
      }

      body.appendChild(row('Mode', makeSelect(MODE_OPTS, currentMode, m => {
        sh.textMode = m;
        if (m === 'static')   { sh.template=''; sh.dynamic=''; }
        if (m === 'dynamic')  { sh.template=''; }
        if (m === 'template') { sh.dynamic=''; }
        scheduleSave();
        showMode(m);
      })));

      // Statique
      const textInput = makeInput('text', sh.text||'', v=>{sh.text=v;prop('text')(v);});
      textInput.placeholder='Texte statique';
      modeStaticRow.style.cssText='display:flex;align-items:center;gap:10px;';
      const stLbl=document.createElement('label');stLbl.textContent='Texte';
      stLbl.style.cssText='font-size:12px;color:var(--text-muted);min-width:100px;flex-shrink:0;';
      modeStaticRow.appendChild(stLbl); modeStaticRow.appendChild(textInput);
      body.appendChild(modeStaticRow);

      // Dynamique (1 clé)
      modeDynamicRow.style.cssText='display:flex;align-items:center;gap:10px;';
      const dynLbl=document.createElement('label');dynLbl.textContent='Dynamique';
      dynLbl.style.cssText='font-size:12px;color:var(--text-muted);min-width:100px;flex-shrink:0;';
      const dynSel=makeSelect(DYNAMIC_OPTS, sh.dynamic||'', v=>{sh.dynamic=v;scheduleSave();renderCanvas();});
      modeDynamicRow.appendChild(dynLbl); modeDynamicRow.appendChild(dynSel);
      body.appendChild(modeDynamicRow);

      // Template multi-liaisons
      modeTemplateRow.style.display = currentMode === 'template' ? '' : 'none';
      const tplLabel = document.createElement('label');
      tplLabel.textContent = 'Template';
      tplLabel.style.cssText = 'font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;';
      modeTemplateRow.appendChild(tplLabel);

      const tplInput = document.createElement('input');
      tplInput.type = 'text';
      tplInput.value = sh.template || '';
      tplInput.placeholder = 'ex: {p1.tag} | {p1.name}';
      tplInput.style.cssText = 'width:100%;padding:6px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:5px;color:var(--text);font-size:12px;font-family:monospace;';
      tplInput.addEventListener('input', () => { sh.template = tplInput.value; scheduleSave(); renderCanvas(); });

      const tplPreview = document.createElement('div');
      tplPreview.style.cssText = 'font-size:11px;color:var(--accent);margin-top:3px;min-height:14px;';
      function updatePreview() { tplPreview.textContent = sh.template ? '→ ' + resolveTemplate(sh.template) : ''; }
      tplInput.addEventListener('input', updatePreview);
      updatePreview();

      // Chips cliquables pour insérer les clés
      const chips = document.createElement('div');
      chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;';
      DYNAMIC_OPTS.filter(o => o.v).forEach(o => {
        const chip = document.createElement('button');
        chip.textContent = '{' + o.v + '}';
        chip.title = o.label;
        chip.style.cssText = 'font-size:10px;padding:2px 6px;background:var(--surface2);border:1px solid var(--border);border-radius:4px;color:var(--text-muted);cursor:pointer;font-family:monospace;';
        chip.addEventListener('click', () => {
          const ins = '{' + o.v + '}';
          const s = tplInput.selectionStart, e = tplInput.selectionEnd;
          const v = tplInput.value;
          tplInput.value = v.slice(0, s) + ins + v.slice(e);
          tplInput.setSelectionRange(s + ins.length, s + ins.length);
          sh.template = tplInput.value;
          scheduleSave(); renderCanvas(); updatePreview();
        });
        chips.appendChild(chip);
      });

      modeTemplateRow.appendChild(tplInput);
      modeTemplateRow.appendChild(tplPreview);
      modeTemplateRow.appendChild(chips);
      body.appendChild(modeTemplateRow);

      showMode(currentMode);

      // Font family
      body.appendChild(row('Police', makeSelect(
        [{v:'Russo One',label:'Russo One'},{v:'Inter',label:'Inter'},{v:'Bebas Neue',label:'Bebas Neue'},{v:'Oswald',label:'Oswald'},{v:'Rajdhani',label:'Rajdhani'}],
        sh.fontFamily||'Russo One', v=>{sh.fontFamily=v;prop('fontFamily')(v);}
      )));

      const fsRow = document.createElement('div');
      fsRow.style.cssText='display:flex;gap:8px;align-items:center;flex:1;';
      const fsInput = makeInput('number', sh.fontSize||24, v=>{sh.fontSize=v;scheduleSave();renderCanvas();},{min:6,max:300,step:1});
      fsInput.style.width='70px';fsInput.style.flex='none';
      const tcInput = makeInput('color', sh.textColor||'#FFFFFF', v=>{sh.textColor=v;prop('textColor')(v);});
      fsRow.appendChild(fsInput); fsRow.appendChild(tcInput);
      body.appendChild(row('Taille / Couleur', fsRow));

      body.appendChild(row('Alignement', makeSelect(
        [{v:'left',label:'Gauche'},{v:'center',label:'Centre'},{v:'right',label:'Droite'}],
        sh.textAlign||'center', v=>{sh.textAlign=v;prop('textAlign')(v);}
      )));

      body.appendChild(row('Espacement', makeInput('number', sh.letterSpacing||0, v=>{sh.letterSpacing=v;prop('letterSpacing')(v);},{min:0,max:30,step:0.5})));

      const upperRow = document.createElement('div');
      upperRow.style.cssText='display:flex;gap:8px;align-items:center;';
      upperRow.appendChild(makeInput('checkbox', sh.uppercase||false, v=>{sh.uppercase=v;prop('uppercase')(v);}));
      const ul=document.createElement('span');ul.textContent='MAJUSCULES';ul.style.fontSize='12px';
      upperRow.appendChild(ul);
      body.appendChild(row('Style', upperRow));

      // Background on text
      const bgRow = document.createElement('div');
      bgRow.style.cssText='display:flex;gap:8px;align-items:center;';
      bgRow.appendChild(makeInput('checkbox', sh.background||false, v=>{sh.background=v;scheduleSave();renderCanvas();}));
      const bgl=document.createElement('span');bgl.textContent='Fond coloré';bgl.style.fontSize='12px';
      bgRow.appendChild(bgl);
      if (sh.background) {
        bgRow.appendChild(makeInput('color', sh.fill||'#000000', v=>{sh.fill=v;scheduleSave();renderCanvas();}));
        const foa = makeInput('number', Math.round((sh.fillOpacity??0.5)*100), v=>{sh.fillOpacity=v/100;scheduleSave();renderCanvas();},{min:0,max:100,step:1});
        foa.style.width='60px';foa.style.flex='none';bgRow.appendChild(foa);
      }
      body.appendChild(row('Fond', bgRow));

      // Auto-width
      const awRow = document.createElement('div');
      awRow.style.cssText='display:flex;gap:8px;align-items:center;';
      const awChk = makeInput('checkbox', sh.autoWidth||false, v=>{
        sh.autoWidth=v; scheduleSave(); renderCanvas();
        awOptionsRow.style.display = v ? 'flex' : 'none';
      });
      awRow.appendChild(awChk);
      const awLbl=document.createElement('span');awLbl.textContent='Auto-largeur';awLbl.style.fontSize='12px';
      awRow.appendChild(awLbl);
      body.appendChild(row('Étirement', awRow));

      const awOptionsRow = document.createElement('div');
      awOptionsRow.style.cssText='display:' + (sh.autoWidth?'flex':'none') + ';gap:6px;flex-wrap:wrap;align-items:center;';
      const anchorSel = makeSelect(
        [{v:'left',label:'Ancrage gauche'},{v:'right',label:'Ancrage droit'}],
        sh.anchorSide||'left', v=>{sh.anchorSide=v;scheduleSave();renderCanvas();}
      );
      awOptionsRow.appendChild(anchorSel);
      const minWInp = makeInput('number', sh.minW||50, v=>{sh.minW=v;scheduleSave();renderCanvas();},{min:10,max:1920,step:1});
      minWInp.style.width='70px'; minWInp.title='Largeur min';
      const maxWInp = makeInput('number', sh.maxW||900, v=>{sh.maxW=v;scheduleSave();renderCanvas();},{min:10,max:1920,step:1});
      maxWInp.style.width='70px'; maxWInp.title='Largeur max';
      const minLbl=document.createElement('span');minLbl.textContent='min';minLbl.style.cssText='font-size:11px;color:var(--text-muted);';
      const maxLbl=document.createElement('span');maxLbl.textContent='max';maxLbl.style.cssText='font-size:11px;color:var(--text-muted);';
      awOptionsRow.appendChild(minLbl); awOptionsRow.appendChild(minWInp);
      awOptionsRow.appendChild(maxLbl); awOptionsRow.appendChild(maxWInp);
      body.appendChild(row('', awOptionsRow));
    }

    if (sh.type === 'image') {
      const srcInput = makeInput('text', sh.src||'', v=>{sh.src=v;prop('src')(v);});
      srcInput.placeholder='URL de l\'image';
      body.appendChild(row('URL', srcInput));

      body.appendChild(row('Ajustement', makeSelect(
        [{v:'cover',label:'Cover'},{v:'contain',label:'Contain'},{v:'fill',label:'Remplir'},{v:'none',label:'Aucun'}],
        sh.objectFit||'cover', v=>{sh.objectFit=v;prop('objectFit')(v);}
      )));

      body.appendChild(row('Rayon', makeInput('number', sh.radius||0, v=>{sh.radius=v;prop('radius')(v);},{min:0,max:200,step:1})));
    }

    // Shadow (rect + text)
    if (sh.type !== 'image') {
      const shadowRow = document.createElement('div');
      shadowRow.style.cssText='display:flex;gap:8px;align-items:center;';
      shadowRow.appendChild(makeInput('checkbox', sh.shadow||false, v=>{sh.shadow=v;scheduleSave();renderCanvas();}));
      const sl=document.createElement('span');sl.textContent='Activer l\'ombre';sl.style.fontSize='12px';
      shadowRow.appendChild(sl);
      body.appendChild(row('Ombre', shadowRow));
    }

    // ── Collage (toutes les formes) ──────────────────────────
    {
      const allShapes = (getLayout()?.shapes || []).filter(s => s.id !== sh.id);
      const glueOpts = [{v:'',label:'— aucun —'}, ...allShapes.map(s=>({v:s.id,label:s.name||s.type}))];
      const glueSel = makeSelect(glueOpts, sh.gluedTo||'', v => {
        sh.gluedTo = v;
        glueSideRow.style.display = v ? 'flex' : 'none';
        glueGapRow.style.display  = v ? 'flex' : 'none';
        scheduleSave(); applyAutoLayout();
      });
      body.appendChild(row('Collé à', glueSel));

      const GLUE_SIDE_OPTS = [
        {v:'right',  label:'→ Adjacence : à droite'},
        {v:'left',   label:'← Adjacence : à gauche'},
        {v:'bottom', label:'↓ Adjacence : en dessous'},
        {v:'top',    label:'↑ Adjacence : au-dessus'},
        {v:'ax-l',   label:'⬡ Axe X — bord gauche'},
        {v:'ax-c',   label:'⬡ Axe X — centré'},
        {v:'ax-r',   label:'⬡ Axe X — bord droit'},
        {v:'ay-t',   label:'⬡ Axe Y — bord haut'},
        {v:'ay-c',   label:'⬡ Axe Y — centré'},
        {v:'ay-b',   label:'⬡ Axe Y — bord bas'},
      ];
      const AXIS_MODES = ['ax-l','ax-c','ax-r','ay-t','ay-c','ay-b'];
      function isAxisMode(side) { return AXIS_MODES.includes(side); }

      const glueSideRow = document.createElement('div');
      glueSideRow.style.display = sh.gluedTo ? 'flex' : 'none';
      glueSideRow.appendChild(makeSelect(GLUE_SIDE_OPTS, sh.glueSide||'right', v => {
        sh.glueSide = v;
        glueGapRow.style.display = (sh.gluedTo && !isAxisMode(v)) ? 'flex' : 'none';
        scheduleSave(); applyAutoLayout();
      }));
      body.appendChild(row('Côté', glueSideRow));

      const glueGapRow = document.createElement('div');
      glueGapRow.style.display = (sh.gluedTo && !isAxisMode(sh.glueSide||'right')) ? 'flex' : 'none';
      const glueGapInp = makeInput('number', sh.glueGap??0, v => {
        sh.glueGap = v; scheduleSave(); applyAutoLayout();
      }, {min:-500, max:500, step:1});
      glueGapInp.style.width = '70px';
      const glueGapLbl = document.createElement('span');
      glueGapLbl.textContent = 'px écart'; glueGapLbl.style.cssText='font-size:11px;color:var(--text-muted);';
      glueGapRow.appendChild(glueGapInp); glueGapRow.appendChild(glueGapLbl);
      body.appendChild(row('Écart', glueGapRow));

      // Sync gap visibility when gluedTo changes
      glueSel.addEventListener('change', () => {
        glueGapRow.style.display = (sh.gluedTo && !isAxisMode(sh.glueSide||'right')) ? 'flex' : 'none';
      });
    }

    // Reset points (polygones seulement)
    if (VERTEX_TYPES.includes(sh.type) && sh.customPoints) {
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn btn-outline btn-sm';
      resetBtn.textContent = 'Réinitialiser les points';
      resetBtn.style.fontSize = '11px';
      resetBtn.addEventListener('click', () => {
        delete sh.customPoints;
        scheduleSave(); renderCanvas(); renderProps();
      });
      body.appendChild(row('Points', resetBtn));
    }

    // ── Duplication parallèle (toutes les formes) ────────────
    const dupRow = document.createElement('div');
    dupRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';

    function swapP1P2(val) {
      if (!val) return val;
      return val.replace(/^p1\./, '\x00').replace(/^p2\./, 'p1.').replace(/^\x00/, 'p2.');
    }
    function makeMirrorCopy(mirrorH, mirrorV) {
      const layout = getLayout(); if (!layout) return;
      const newSh = JSON.parse(JSON.stringify(sh));
      newSh.id   = uid();
      newSh.name = (sh.name || sh.type) + (mirrorH ? ' ↔' : ' ↕');
      if (mirrorH) newSh.x = 1920 - sh.x - sh.w;
      if (mirrorV) newSh.y = 1080 - sh.y - sh.h;
      // Swap liaisons J1↔J2
      if (newSh.dynamic)    newSh.dynamic    = swapP1P2(newSh.dynamic);
      if (newSh.dynamicSrc) newSh.dynamicSrc = swapP1P2(newSh.dynamicSrc);
      if (newSh.linkedTo) newSh.linkedTo = ''; // pas de liaison automatique
      layout.shapes.push(newSh);
      scheduleSave(); renderCanvas(); renderLayers(); sbbSelectShape(newSh.id);
    }

    const btnH = document.createElement('button');
    btnH.className = 'btn btn-outline btn-sm';
    btnH.textContent = '↔ Miroir H';
    btnH.title = 'Copie symétrique horizontale (autour de X=960), swap J1↔J2';
    btnH.addEventListener('click', () => makeMirrorCopy(true, false));

    const btnV = document.createElement('button');
    btnV.className = 'btn btn-outline btn-sm';
    btnV.textContent = '↕ Miroir V';
    btnV.title = 'Copie symétrique verticale (autour de Y=540)';
    btnV.addEventListener('click', () => makeMirrorCopy(false, true));

    const btnOffset = document.createElement('button');
    btnOffset.className = 'btn btn-outline btn-sm';
    btnOffset.textContent = '+ Décaler';
    btnOffset.title = 'Dupliquer avec décalage personnalisé';
    btnOffset.addEventListener('click', () => {
      const dx = parseInt(prompt('Décalage X (px) :', '20') || '0');
      const dy = parseInt(prompt('Décalage Y (px) :', '20') || '0');
      const layout = getLayout(); if (!layout) return;
      const newSh = JSON.parse(JSON.stringify(sh));
      newSh.id   = uid();
      newSh.name = (sh.name || sh.type) + ' (copie)';
      newSh.x   += dx;
      newSh.y   += dy;
      if (newSh.linkedTo) newSh.linkedTo = '';
      layout.shapes.push(newSh);
      scheduleSave(); renderCanvas(); renderLayers(); sbbSelectShape(newSh.id);
    });

    dupRow.appendChild(btnH);
    dupRow.appendChild(btnV);
    dupRow.appendChild(btnOffset);
    body.appendChild(row('Dupliquer', dupRow));
  }

  /* ── Mapping éléments libres → forme canvas ─────────────── */
  const SEL_TO_SHAPE = {
    'event':      { type:'text',  dynamic:'event',       name:'Événement',    w:400, h:50 },
    'phase':      { type:'text',  dynamic:'stage',       name:'Round/Phase',  w:400, h:60 },
    'format':     { type:'text',  dynamic:'format',      name:'Format',       w:200, h:40 },
    'p1score':    { type:'text',  dynamic:'p1.score',    name:'Score J1',     w:120, h:80, fontSize:64 },
    'p1tag':      { type:'text',  dynamic:'p1.tag',      name:'Tag J1',       w:200, h:50 },
    'p1name':     { type:'text',  dynamic:'p1.name',     name:'Pseudo J1',    w:300, h:60 },
    'p1pronouns': { type:'text',  dynamic:'p1.pronouns', name:'Pronoms J1',   w:200, h:40, fontSize:16 },
    'p1seed':     { type:'text',  dynamic:'p1.seed',     name:'Seed J1',      w:100, h:40, fontSize:16 },
    'p1flag':     { type:'image', dynamicSrc:'p1.flag',  name:'Drapeau J1',   w:90,  h:60, objectFit:'contain' },
    'p1char':     { type:'image', dynamicSrc:'p1.char',  name:'Personnage J1',w:220, h:220, objectFit:'contain' },
    'p2score':    { type:'text',  dynamic:'p2.score',    name:'Score J2',     w:120, h:80, fontSize:64 },
    'p2tag':      { type:'text',  dynamic:'p2.tag',      name:'Tag J2',       w:200, h:50 },
    'p2name':     { type:'text',  dynamic:'p2.name',     name:'Pseudo J2',    w:300, h:60 },
    'p2pronouns': { type:'text',  dynamic:'p2.pronouns', name:'Pronoms J2',   w:200, h:40, fontSize:16 },
    'p2seed':     { type:'text',  dynamic:'p2.seed',     name:'Seed J2',      w:100, h:40, fontSize:16 },
    'p2flag':     { type:'image', dynamicSrc:'p2.flag',  name:'Drapeau J2',   w:90,  h:60, objectFit:'contain' },
    'p2char':     { type:'image', dynamicSrc:'p2.char',  name:'Personnage J2',w:220, h:220, objectFit:'contain' },
  };

  function addShapeFromElement(selKey) {
    const l = getLayout();
    if (!l) { alert('Crée d\'abord un layout !'); return; }
    const cfg = SEL_TO_SHAPE[selKey]; if (!cfg) return;
    const base = { ...SHAPE_DEFAULTS[cfg.type] };
    const sh = {
      id:      uid(),
      visible: true,
      x: Math.round((1920 - (cfg.w || base.w)) / 2),
      y: Math.round((1080 - (cfg.h || base.h)) / 2),
      ...base,
      ...cfg,
      // cfg.w/h override base defaults
      w: cfg.w || base.w,
      h: cfg.h || base.h,
    };
    l.shapes.push(sh);
    scheduleSave();
    renderCanvas();
    renderLayers();
    sbbSelectShape(sh.id);
  }

  /* ── Add shape ───────────────────────────────────────────── */
  function addShape(type) {
    const l = getLayout(); if (!l) return;
    const def = { ...SHAPE_DEFAULTS[type] };
    const NAMES = { rect:'Rectangle', text:'Texte', image:'Image', circle:'Cercle', oval:'Ovale', 'semi-circle':'Demi-cercle', triangle:'Triangle', star:'Étoile', diamond:'Diamant', hexagon:'Hexagone' };
    const sh = {
      id:      uid(),
      type,
      name:    NAMES[type] || type,
      visible: true,
      x: Math.round((1920 - def.w) / 2),
      y: Math.round((1080 - def.h) / 2),
      ...def,
    };
    l.shapes.push(sh);
    scheduleSave();
    renderCanvas();
    renderLayers();
    sbbSelectShape(sh.id);
  }

  /* ── Layout management ───────────────────────────────────── */
  function refreshLayoutSelect() {
    const sel = document.getElementById('sbb-layout-select'); if (!sel) return;
    sel.innerHTML = '';
    if (layouts.length === 0) {
      const opt = document.createElement('option');
      opt.textContent = '— aucun layout —';
      opt.disabled = true;
      sel.appendChild(opt);
    } else {
      layouts.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = l.name;
        if (l.id === activeId) opt.selected = true;
        sel.appendChild(opt);
      });
    }
    refreshOverlayLink();
  }

  function refreshOverlayLink() {
    const a   = document.getElementById('sbb-overlay-link'); if (!a) return;
    const url = activeId ? `http://localhost:3002/scoreboard-custom?layout=${activeId}` : '#';
    a.href = url;
    const urlInput = document.getElementById('sbb-url-display');
    if (urlInput) urlInput.value = url;
  }

  function switchLayout(id) {
    activeId   = id;
    selectedId = null;
    renderCanvas();
    renderLayers();
    renderProps();
    refreshOverlayLink();
  }

  /* ── Init & events ───────────────────────────────────────── */
  async function init() {
    await apiLoad();
    if (layouts.length > 0) activeId = layouts[0].id;
    refreshLayoutSelect();
    renderCanvas();
    renderLayers();
    renderProps();
    updateScale();
  }

  // Layout select
  document.getElementById('sbb-layout-select')?.addEventListener('change', e => switchLayout(e.target.value));

  // Nouveau layout
  document.getElementById('sbb-btn-new')?.addEventListener('click', async () => {
    const name = prompt('Nom du scoreboard :');
    if (!name) return;
    const l = await apiCreate(name);
    activeId = l.id;
    refreshLayoutSelect();
    switchLayout(l.id);
  });

  // Renommer
  document.getElementById('sbb-btn-rename')?.addEventListener('click', async () => {
    const l = getLayout(); if (!l) return;
    const name = prompt('Nouveau nom :', l.name);
    if (!name || name === l.name) return;
    l.name = name;
    await apiSave();
    refreshLayoutSelect();
  });

  // Dupliquer layout
  document.getElementById('sbb-btn-duplicate')?.addEventListener('click', async () => {
    const l = getLayout(); if (!l) return;
    const newL = await apiCreate(l.name + ' (copie)');
    // Copy shapes with new ids
    newL.shapes = l.shapes.map(sh => ({ ...sh, id: uid() }));
    layouts[layouts.length-1] = newL;
    await fetch(`/api/sb-layouts/${newL.id}`,{ method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(newL) });
    activeId = newL.id;
    refreshLayoutSelect();
    switchLayout(newL.id);
  });

  // Supprimer layout
  document.getElementById('sbb-btn-delete')?.addEventListener('click', async () => {
    const l = getLayout(); if (!l) return;
    if (!confirm(`Supprimer "${l.name}" ?`)) return;
    await apiDelete(l.id);
    activeId = layouts.length > 0 ? layouts[0].id : null;
    refreshLayoutSelect();
    selectedId = null;
    renderCanvas(); renderLayers(); renderProps();
  });

  // Copier URL
  document.getElementById('sbb-btn-copy-url')?.addEventListener('click', () => {
    if (!activeId) return;
    const url = `http://localhost:3002/scoreboard-custom?layout=${activeId}`;
    navigator.clipboard.writeText(url).then(() => setStatus('URL copiée !'));
  });

  // ── Image de fond de référence (builder uniquement) ──────────
  const bgLayer  = document.getElementById('sbb-bg-layer');
  const bgFile   = document.getElementById('sbb-bg-file');
  const bgPick   = document.getElementById('sbb-bg-pick');
  const bgUrl    = document.getElementById('sbb-bg-url');
  const bgSlider = document.getElementById('sbb-bg-opacity');
  const bgOpVal  = document.getElementById('sbb-bg-opacity-val');
  const bgClear  = document.getElementById('sbb-bg-clear');

  function applyBg(src) {
    if (!bgLayer) return;
    if (src) {
      bgLayer.style.backgroundImage = `url('${src}')`;
      bgLayer.style.display = 'block';
    } else {
      bgLayer.style.backgroundImage = 'none';
      bgLayer.style.display = 'none';
    }
  }

  if (bgPick) bgPick.addEventListener('click', () => bgFile?.click());

  if (bgFile) bgFile.addEventListener('change', () => {
    const file = bgFile.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { applyBg(e.target.result); if (bgUrl) bgUrl.value = ''; };
    reader.readAsDataURL(file);
  });

  if (bgUrl) bgUrl.addEventListener('input', () => {
    const v = bgUrl.value.trim();
    applyBg(v || null);
  });

  if (bgSlider) bgSlider.addEventListener('input', () => {
    const v = bgSlider.value;
    if (bgOpVal) bgOpVal.textContent = v + '%';
    if (bgLayer) bgLayer.style.opacity = v / 100;
  });

  if (bgClear) bgClear.addEventListener('click', () => {
    applyBg(null);
    if (bgUrl) bgUrl.value = '';
    if (bgFile) bgFile.value = '';
  });

  // Désélectionner (clic sur canvas vide)
  document.getElementById('sbb-canvas-inner')?.addEventListener('mousedown', e => {
    if (e.target.id === 'sbb-canvas-inner') sbbDeselect();
  });
  document.getElementById('sbb-btn-deselect')?.addEventListener('click', sbbDeselect);

  // Centrer la forme sélectionnée
  document.getElementById('sbb-btn-center')?.addEventListener('click', () => {
    const sh = getShape(selectedId); if (!sh) return;
    sh.x = Math.round((1920 - sh.w) / 2);
    sh.y = Math.round((1080 - sh.h) / 2);
    renderCanvas(); renderHandles(); renderProps(); scheduleSave();
  });

  // Dupliquer forme
  document.getElementById('sbb-btn-duplicate-shape')?.addEventListener('click', () => {
    const l = getLayout(); const sh = getShape(selectedId); if (!l||!sh) return;
    const copy = { ...JSON.parse(JSON.stringify(sh)), id: uid(), name: (sh.name||sh.type)+' (copie)', x:sh.x+20, y:sh.y+20 };
    l.shapes.push(copy);
    scheduleSave(); renderCanvas(); renderLayers(); sbbSelectShape(copy.id);
  });

  // Supprimer forme
  document.getElementById('sbb-btn-delete-shape')?.addEventListener('click', () => {
    const l = getLayout(); if (!l||!selectedId) return;
    l.shapes = l.shapes.filter(s=>s.id!==selectedId);
    selectedId = null;
    scheduleSave(); renderCanvas(); renderLayers(); renderProps();
  });

  // Ajouter forme
  document.querySelectorAll('.sbb-add-shape').forEach(btn => {
    btn.addEventListener('click', () => {
      const l = getLayout();
      if (!l) { alert('Créez d\'abord un layout.'); return; }
      addShape(btn.dataset.type);
    });
  });

  // Resize observer pour recalculer l'échelle
  const canvasWrap = document.getElementById('sbb-canvas-wrap');
  if (canvasWrap && window.ResizeObserver) {
    new ResizeObserver(() => { updateScale(); renderHandles(); }).observe(canvasWrap);
  }

  // Ouvrir l'onglet → init ou refresh
  document.querySelectorAll('.tab-btn[data-tab="builder"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (layouts.length === 0 && !activeId) init();
      else { updateScale(); renderCanvas(); renderLayers(); }
    });
  });

  // Pré-charger les layouts en background
  apiLoad().then(() => {
    if (layouts.length > 0 && !activeId) activeId = layouts[0].id;
    refreshLayoutSelect();
  });

  // Exposer pour les boutons col.1
  window.sbbAddFromElement = addShapeFromElement;

})();

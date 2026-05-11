const socket = io();

// ── Canvas refs ───────────────────────────────────────────────────────────────
const root   = document.getElementById('vic-root');
const canvas = document.getElementById('confetti-canvas');
const ctx    = canvas.getContext('2d');
canvas.width  = 1920;
canvas.height = 1080;

const particleCanvas = document.getElementById('vic-canvas-particles');
particleCanvas.width  = 960;
particleCanvas.height = 1080;
let PS = null;

// ── State ─────────────────────────────────────────────────────────────────────
let _currentWinner = null;
let _confettiRunning = false;
let _confettiParticles = [];
let _confettiRaf = null;
let _spawnUntil = 0;
let _autoHideTimer = null;

let victoryConfig = {
  bg:        { blur: 18, brightness: 30, saturation: 140, opacity: 100 },
  vignette:  { intensity: 100 },
  scanlines: { visible: true, opacity: 8 },
  particles: { p1Override: 'auto', p2Override: 'auto', density: 100, opacity: 100 },
  animation: { entryType: 'fade', exitType: 'fade', flashEnabled: true, autoHide: 0, duration: 700 },
  tint:      { visible: false, color: '#000000', opacity: 0 },
};

// ── Couleurs par thème ────────────────────────────────────────────────────────

const NAMED_THEME_COLORS = {
  cyberpunk:  '#00F5FF', synthwave: '#C77DFF', midnight: '#4FC3F7',
  fire:       '#FF4500', egypt:     '#D4A017', city:     '#00D4FF',
  eco:        '#8BC34A', water:     '#00B4D8', rainbow:  '#FF8C00',
  pkpsy:      '#F95587', pktenebres:'#8B0000', pkelectrik:'#F7D02C',
  pkfee:      '#D685AD', pkspectre: '#7038F8', pkdragon: '#6F35FC',
  pkglace:    '#96D9D6', pkcombat:  '#C22E28', pkpoison: '#A33EA1',
  pksol:      '#E2BF65', pkvol:     '#A98FF3', pkinsecte:'#A6B91A',
  pkroche:    '#B6A136', pkacier:   '#B7B7CE', pknormal: '#A8A77A',
  pkplante:   '#7AC74C', pkfeu:     '#EE8130', pkeau:    '#6390F0',
  trans:      '#55CDFC', pan:       '#FF218C', bi:       '#D60270',
  lesbian:    '#D62900', plage:     '#48CAE4',
};

const CHAR_COLORS = {
  smario:'#E52222',sdk:'#8B4513',slink:'#5BAD20',ssamus:'#FF6A00',
  sdsamus:'#9D00FF',syoshi:'#5DCB14',skirby:'#FF8CB4',sfox:'#CC5500',
  spikachu:'#FFD700',sluigi:'#2AA000',sness:'#CC1100',sfalcon:'#FF4400',
  sjigglypuff:'#FF8CB4',speach:'#F9A8D4',sdaisy:'#FFD700',sbowser:'#009A00',
  siceclimbers:'#7AB8FF',ssheik:'#00A0C0',szelda:'#C080FF',sdrmario:'#E52222',
  spichu:'#FFD700',sfalco:'#0088CC',smarth:'#8855FF',slucina:'#CC6688',
  sylink:'#2A7040',sganondorf:'#6600AA',smewtwo:'#C070FF',sroy:'#FF3300',
  schrom:'#4488FF',sgamewatch:'#AAAAAA',smetaknight:'#4466BB',spit:'#AACC55',
  sdarkpit:'#6688AA',szss:'#CC66FF',swario:'#DDAA00',ssnake:'#448822',
  sike:'#0066CC',spktrainer:'#CC3300',sdiddy:'#BB5500',slucas:'#CC8833',
  ssonic:'#1A6BFF',sdedede:'#CC0055',solimar:'#DDAA00',slucario:'#4488CC',
  srob:'#AAAAAA',stoonlink:'#55AA22',swolf:'#6688AA',svilager:'#88CC44',
  smegaman:'#0099DD',swiifit:'#AADDAA',srosalina:'#88AAFF',slittlemac:'#FF8822',
  sgreninja:'#2266AA',spalutena:'#CCAAFF',spacman:'#FFDD00',srobin:'#CC5500',
  sshulk:'#CCAA55',sbowserjr:'#DD9900',sduckhunt:'#886644',sryu:'#FFFFFF',
  sken:'#FF6600',scloud:'#6699CC',scorrin:'#CC7755',sbayonetta:'#8888CC',
  sinkling:'#FF4499',sridley:'#8844AA',ssimon:'#CC8844',srichter:'#997744',
  skrool:'#AA6600',sisabelle:'#FFCC44',sincineroar:'#CC3366',spiranha:'#33BB33',
  sjoker:'#DD0000',shero:'#4455CC',sbanjo:'#CC9933',sterry:'#FF3300',
  sbyleth:'#996633',sminmin:'#FF6688',ssteve:'#887766',ssephiroth:'#AAAAFF',
  spyra:'#FF9900',smythra:'#FF5500',skazuya:'#5500CC',ssora:'#4477FF',
  smii_brawl:'#AA4400',smii_sword:'#7799BB',smii_gun:'#448866',
};

function getThemeColor(s, wPlayer) {
  const theme = s.overlayTheme || 'default';
  if (theme === 'custom') return s.customTheme?.accentColor || wPlayer.color || '#e6c84a';
  if (theme === 'dual' || theme.startsWith('s')) {
    const charKey = 's' + (wPlayer.character?.id || '');
    return CHAR_COLORS[charKey] || wPlayer.color || '#e6c84a';
  }
  return NAMED_THEME_COLORS[theme] || wPlayer.color || '#e6c84a';
}

// ── Config application ────────────────────────────────────────────────────────
function applyVictoryConfig(cfg) {
  victoryConfig = cfg;

  const bgEl        = document.getElementById('vic-bg');
  const vignetteEl  = document.getElementById('vic-vignette');
  const scanlinesEl = document.getElementById('vic-scanlines');
  const tintEl      = document.getElementById('vic-tint');

  // Background filters
  bgEl.style.filter  = `blur(${cfg.bg.blur}px) brightness(${cfg.bg.brightness/100}) saturate(${cfg.bg.saturation/100})`;
  bgEl.style.opacity = cfg.bg.opacity / 100;

  // Vignette
  vignetteEl.style.opacity = cfg.vignette.intensity / 100;

  // Scanlines
  scanlinesEl.style.display = cfg.scanlines.visible ? '' : 'none';
  scanlinesEl.style.opacity = cfg.scanlines.opacity / 100;

  // Tint
  if (cfg.tint.visible && cfg.tint.opacity > 0) {
    tintEl.style.display    = '';
    tintEl.style.background = cfg.tint.color;
    tintEl.style.opacity    = cfg.tint.opacity / 100;
  } else {
    tintEl.style.display = 'none';
  }

  // Particles opacity
  particleCanvas.style.opacity = cfg.particles.opacity / 100;

  // Animation types on root
  root.dataset.entry = cfg.animation.entryType || 'fade';
  root.dataset.exit  = cfg.animation.exitType  || 'fade';
}

// ── Background image ──────────────────────────────────────────────────────────
function loadBgImage() {
  fetch('/api/victory-background').then(r => r.json()).then(({ url }) => {
    const bgEl = document.getElementById('vic-bg');
    if (url) bgEl.style.backgroundImage = `url('${url}?t=${Date.now()}')`;
    else     bgEl.style.backgroundImage = '';
  }).catch(() => {});
}

// ── Particle system ───────────────────────────────────────────────────────────
function initParticles() {
  PS = makePS(particleCanvas);
}

function startParticles(winnerId) {
  if (!PS) return;
  const cfg = victoryConfig?.particles || {};
  const winnerOverride = winnerId === 1 ? cfg.p1Override : cfg.p2Override;
  const density = (cfg.density ?? 100) / 100;

  const charId = _lastState ? (winnerId === 1 ? _lastState.player1?.character?.id : _lastState.player2?.character?.id) : null;
  const themeKey = charId ? CHAR_TO_THEME[charId] : null;
  const themeCfg = (winnerOverride && winnerOverride !== 'auto')
    ? { type: winnerOverride, count: 80 }
    : (themeKey ? THEME_PARTICLES[themeKey] : null);

  if (themeCfg) {
    PS.start(themeCfg.type, Math.max(1, Math.round(themeCfg.count * density)));
  }
}

function stopParticles() {
  if (PS) PS.stop();
}

// ── Détection victoire ────────────────────────────────────────────────────────
function getWinner(s) {
  const p1 = parseInt(s.player1?.score) || 0;
  const p2 = parseInt(s.player2?.score) || 0;
  if (p1 > p2) return 1;
  if (p2 > p1) return 2;
  return null;
}

// ── Affichage ─────────────────────────────────────────────────────────────────
let _lastState = null;

function showVictory(s) {
  const winner = getWinner(s);
  if (!winner) return;

  _lastState = s;

  const isP1    = winner === 1;
  const wPlayer = isP1 ? s.player1 : s.player2;
  const wc      = getThemeColor(s, wPlayer);

  root.style.setProperty('--wc', wc);
  root.classList.toggle('vic-right', !isP1);
  root.dataset.entry = victoryConfig.animation.entryType || 'fade';
  root.dataset.exit  = victoryConfig.animation.exitType  || 'fade';

  // Positionner le canvas de particules sur le côté du gagnant (comme vs-screen)
  particleCanvas.style.left = isP1 ? '0px' : '960px';

  // Scores
  const sp1 = document.getElementById('vic-score-p1');
  const sp2 = document.getElementById('vic-score-p2');
  sp1.textContent = s.player1?.score ?? 0;
  sp2.textContent = s.player2?.score ?? 0;
  sp1.style.color = isP1 ? 'var(--wc)' : 'rgba(255,255,255,0.45)';
  sp2.style.color = isP1 ? 'rgba(255,255,255,0.45)' : 'var(--wc)';

  // Joueur
  document.getElementById('vic-tag').textContent  = wPlayer.tag  || '';
  document.getElementById('vic-name').textContent = wPlayer.name || '';

  // Meta
  const metaParts = [];
  if (s.stage) metaParts.push(s.stage);
  if (s.event) metaParts.push(s.event);
  document.getElementById('vic-meta').textContent = metaParts.join('  ·  ');

  // Personnage
  const charName = wPlayer.character?.name
    ? wPlayer.character.name.replace(/\s*\/\s*/g, '-')
    : '';
  const charEnc = charName ? encodeURIComponent(charName) : '';
  const charImg = document.getElementById('vic-char-img');
  if (charName) {
    charImg.style.display = '';
    if (s.charDisplayMode === 'mural') {
      charImg.src = `/murals/chara_1_${charEnc}_mural.png`;
      charImg.onerror = () => { charImg.style.display = 'none'; };
    } else {
      const pad = String(wPlayer.stockColor ?? 0).padStart(2, '0');
      charImg.src = `/full/chara_1_${charEnc}_${pad}.png`;
      charImg.onerror = () => {
        charImg.src = `/full/chara_1_${charEnc}_00.png`;
        charImg.onerror = () => { charImg.style.display = 'none'; };
      };
    }
  } else {
    charImg.src = '';
    charImg.style.display = 'none';
  }

  // Background layer
  const bgLayer = document.getElementById('vic-bg-layer');
  bgLayer.classList.remove('vic-bg-out');
  bgLayer.classList.add('vic-bg-in');

  // Flash
  if (victoryConfig.animation.flashEnabled !== false) {
    const flashEl = document.getElementById('vic-flash');
    flashEl.classList.remove('vic-flash-anim');
    void flashEl.offsetWidth;
    flashEl.classList.add('vic-flash-anim');
  }

  // Lancer l'animation
  root.classList.remove('vic-visible', 'vic-hidden');
  void root.offsetWidth;
  root.classList.add('vic-visible');

  // Particules & confetti
  stopParticles();
  startParticles(winner);
  startConfetti(wc);

  // Auto-hide
  clearTimeout(_autoHideTimer);
  const autoHide = victoryConfig.animation.autoHide ?? 0;
  if (autoHide > 0) {
    _autoHideTimer = setTimeout(hideVictory, autoHide * 1000);
  }
}

function hideVictory() {
  clearTimeout(_autoHideTimer);
  const bgLayer = document.getElementById('vic-bg-layer');
  bgLayer.classList.remove('vic-bg-in');
  bgLayer.classList.add('vic-bg-out');

  root.classList.remove('vic-visible');
  root.classList.add('vic-hidden');
  stopConfetti();
  stopParticles();
  setTimeout(() => root.classList.remove('vic-hidden', 'vic-right'), 600);
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function rnd(a, b) { return a + Math.random() * (b - a); }

function spawnParticle(wc) {
  const palette = [wc, wc, wc, '#ffd700', '#ffffff', '#f5f5f5',
    '#ff6b6b', '#74b9ff', '#a29bfe', '#fd79a8', '#55efc4'];
  return {
    x: rnd(0, 1920), y: rnd(-20, -2),
    vx: rnd(-1.8, 1.8), vy: rnd(2.8, 6.5),
    rot: rnd(0, Math.PI * 2), rotV: rnd(-0.09, 0.09),
    w: rnd(7, 18), h: rnd(4, 11),
    color: palette[Math.floor(Math.random() * palette.length)],
    type: Math.random() < 0.22 ? 'circle' : 'rect',
    wobble: rnd(0, Math.PI * 2), wobbleV: rnd(0.03, 0.09),
  };
}

function startConfetti(wc) {
  _confettiRunning = true;
  _spawnUntil = performance.now() + 4200;
  _confettiParticles = [];

  for (let i = 0; i < 100; i++) {
    const p = spawnParticle(wc);
    p.y = rnd(-1080, 0);
    _confettiParticles.push(p);
  }

  function step(now) {
    if (!_confettiRunning) { ctx.clearRect(0, 0, 1920, 1080); return; }

    if (now < _spawnUntil && _confettiParticles.length < 380) {
      for (let i = 0; i < 5; i++) _confettiParticles.push(spawnParticle(wc));
    }

    ctx.clearRect(0, 0, 1920, 1080);

    for (let i = _confettiParticles.length - 1; i >= 0; i--) {
      const p = _confettiParticles[i];
      p.wobble += p.wobbleV;
      p.x += p.vx + Math.sin(p.wobble) * 0.9;
      p.y += p.vy;
      p.rot += p.rotV;
      p.vy += 0.04;
      if (p.y > 1110) { _confettiParticles.splice(i, 1); continue; }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.type === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }

    if (_confettiParticles.length > 0 || now < _spawnUntil) {
      _confettiRaf = requestAnimationFrame(step);
    } else {
      ctx.clearRect(0, 0, 1920, 1080);
    }
  }

  if (_confettiRaf) cancelAnimationFrame(_confettiRaf);
  _confettiRaf = requestAnimationFrame(step);
}

function stopConfetti() {
  _confettiRunning = false;
  _spawnUntil = 0;
  if (_confettiRaf) { cancelAnimationFrame(_confettiRaf); _confettiRaf = null; }
  _confettiParticles = [];
  ctx.clearRect(0, 0, 1920, 1080);
}

// ── Init ──────────────────────────────────────────────────────────────────────
initParticles();
loadBgImage();

fetch('/api/victory-config').then(r => r.json()).then(applyVictoryConfig).catch(() => {});
socket.on('victoryConfigUpdate', applyVictoryConfig);
socket.on('victoryBgUpdate', loadBgImage);

// ── Mise à jour silencieuse (même gagnant, perso/tag changé) ──────────────────
function updateWinnerDisplay(s, winner) {
  const isP1    = winner === 1;
  const wPlayer = isP1 ? s.player1 : s.player2;
  const wc      = getThemeColor(s, wPlayer);

  root.style.setProperty('--wc', wc);
  particleCanvas.style.left = isP1 ? '0px' : '960px';

  // Scores
  const sp1 = document.getElementById('vic-score-p1');
  const sp2 = document.getElementById('vic-score-p2');
  sp1.textContent = s.player1?.score ?? 0;
  sp2.textContent = s.player2?.score ?? 0;
  sp1.style.color = isP1 ? 'var(--wc)' : 'rgba(255,255,255,0.45)';
  sp2.style.color = isP1 ? 'rgba(255,255,255,0.45)' : 'var(--wc)';

  // Joueur
  document.getElementById('vic-tag').textContent  = wPlayer.tag  || '';
  document.getElementById('vic-name').textContent = wPlayer.name || '';

  // Meta
  const metaParts = [];
  if (s.stage) metaParts.push(s.stage);
  if (s.event) metaParts.push(s.event);
  document.getElementById('vic-meta').textContent = metaParts.join('  ·  ');

  // Personnage
  const charName = wPlayer.character?.name
    ? wPlayer.character.name.replace(/\s*\/\s*/g, '-')
    : '';
  const charEnc = charName ? encodeURIComponent(charName) : '';
  const charImg = document.getElementById('vic-char-img');
  if (charName) {
    charImg.style.display = '';
    if (s.charDisplayMode === 'mural') {
      charImg.src = `/murals/chara_1_${charEnc}_mural.png`;
      charImg.onerror = () => { charImg.style.display = 'none'; };
    } else {
      const pad = String(wPlayer.stockColor ?? 0).padStart(2, '0');
      charImg.src = `/full/chara_1_${charEnc}_${pad}.png`;
      charImg.onerror = () => {
        charImg.src = `/full/chara_1_${charEnc}_00.png`;
        charImg.onerror = () => { charImg.style.display = 'none'; };
      };
    }
  } else {
    charImg.src = '';
    charImg.style.display = 'none';
  }

  // Relancer les particules si le perso a changé
  const oldChar = _lastState
    ? (isP1 ? _lastState.player1?.character?.id : _lastState.player2?.character?.id)
    : null;
  const newChar = isP1 ? s.player1?.character?.id : s.player2?.character?.id;
  if (newChar !== oldChar) {
    stopParticles();
    startParticles(winner);
  }
}

// ── State ─────────────────────────────────────────────────────────────────────
function applyState(s) {
  const winner = getWinner(s);
  if (winner && winner !== _currentWinner) {
    _currentWinner = winner;
    showVictory(s);
  } else if (winner && winner === _currentWinner) {
    // Même gagnant : mettre à jour perso/tag/score sans relancer l'animation
    updateWinnerDisplay(s, winner);
    _lastState = s;
  } else if (!winner && _currentWinner !== null) {
    _currentWinner = null;
    hideVictory();
  }
}

socket.on('victoryTest', showVictory);
socket.on('victoryHide', hideVictory);

fetch('/api/state').then(r => r.json()).then(applyState).catch(() => {});
socket.on('stateUpdate', applyState);

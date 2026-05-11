// ═══════════════════════════════════════════════════
// VS SCREEN  ·  PSO – Smash Bros Ultimate Overlay
// ═══════════════════════════════════════════════════


// ── Couleur d'accent par thème ───────────────────────────────
const VS_THEME_ACCENT = {
  // Thèmes nommés
  default:    '#FFFFFF', cyberpunk:  '#00FFCC', synthwave:  '#C77DFF',
  midnight:   '#4FC3F7', egypt:      '#D4AF37', city:       '#4488FF',
  eco:        '#44BB44', water:      '#0099DD', fire:       '#FF4500',
  rainbow:    '#FF6688', trans:      '#55CCFF', pan:        '#FF8C00',
  bi:         '#9955CC', lesbian:    '#FF5555', plage:      '#FFD700',
  // Types Pokémon
  pkpsy:'#FF4DA6', pktenebres:'#705898', pkelectrik:'#F8D030',
  pkfee:'#EE99AC', pkspectre:'#705898', pkdragon:'#6F35FC',
  pkglace:'#96D9D6', pkcombat:'#C22E28', pkpoison:'#A33EA1',
  pksol:'#C6B849', pkvol:'#A98FF3', pkinsecte:'#A6B91A',
  pkroche:'#B6A136', pkacier:'#B7B7CE', pknormal:'#A8A77A',
  pkplante:'#7AC74C', pkfeu:'#EE8130', pkeau:'#6390F0',
  // Persos (CHAR_THEME_COLORS condensé)
  smario:'#E52222', sdk:'#8B4513', slink:'#5BAD20', ssamus:'#FF6A00',
  sdsamus:'#9D00FF', syoshi:'#5DCB14', skirby:'#FF8CB4', sfox:'#CC5500',
  spikachu:'#FFD700', sluigi:'#2AA000', sness:'#CC1100', sfalcon:'#FF4400',
  sjigglypuff:'#FF8CB4', speach:'#F9A8D4', sdaisy:'#FFD700', sbowser:'#009A00',
  siceclimbers:'#7AB8FF', ssheik:'#00A0C0', szelda:'#C080FF', sdrmario:'#E52222',
  spichu:'#FFD700', sfalco:'#0088CC', smarth:'#8855FF', slucina:'#CC6688',
  sylink:'#2A7040', sganondorf:'#6600AA', smewtwo:'#C070FF', sroy:'#FF3300',
  schrom:'#4488FF', sgamewatch:'#AAAAAA', smetaknight:'#4466BB', spit:'#AACC55',
  sdarkpit:'#6688AA', szss:'#CC66FF', swario:'#DDAA00', ssnake:'#448822',
  sike:'#0066CC', spktrainer:'#CC3300', sdiddy:'#BB5500', slucas:'#CC8833',
  ssonic:'#1A6BFF', sdedede:'#CC0055', solimar:'#DDAA00', slucario:'#4488CC',
  srob:'#AAAAAA', stoonlink:'#55AA22', swolf:'#6688AA', svilager:'#88CC44',
  smegaman:'#0099DD', swiifit:'#AADDAA', srosalina:'#88AAFF', slittlemac:'#FF8822',
  sgreninja:'#2266AA', spalutena:'#CCAAFF', spacman:'#FFDD00', srobin:'#CC5500',
  sshulk:'#CCAA55', sbowserjr:'#DD9900', sduckhunt:'#886644', sryu:'#FFFFFF',
  sken:'#FF6600', scloud:'#6699CC', scorrin:'#CC7755', sbayonetta:'#8888CC',
  sinkling:'#FF4499', sridley:'#8844AA', ssimon:'#CC8844', srichter:'#997744',
  skrool:'#AA6600', sisabelle:'#FFCC44', sincineroar:'#CC3366', spiranha:'#33BB33',
  sjoker:'#DD0000', shero:'#4455CC', sbanjo:'#CC9933', sterry:'#FF3300',
  sbyleth:'#996633', sminmin:'#FF6688', ssteve:'#887766', ssephiroth:'#AAAAFF',
  spyra:'#FF9900', smythra:'#FF5500', skazuya:'#5500CC', ssora:'#4477FF',
  smii_brawl:'#AA4400', smii_sword:'#7799BB', smii_gun:'#448866',
};

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── State ────────────────────────────────────────────────────
const socket = io();
let PS1 = null, PS2 = null;
let prevState = null;
let vsConfig = {
  bg:        { blur: 18, brightness: 30, saturation: 140, opacity: 100 },
  vignette:  { intensity: 100 },
  scanlines: { visible: true, opacity: 8 },
  particles: { p1Override: 'auto', p2Override: 'auto', density: 100, opacity: 100 },
  animation: { entryType: 'slide', exitType: 'fade', flashEnabled: true, autoHide: 0, duration: 700 },
  tint:      { visible: false, color: '#000000', opacity: 0 },
};
let autoHideTimer = null;

// ── Config application ───────────────────────────────────────
function applyVsConfig(cfg) {
  vsConfig = cfg;
  // Background filters
  vsBg.style.filter  = `blur(${cfg.bg.blur}px) brightness(${cfg.bg.brightness/100}) saturate(${cfg.bg.saturation/100})`;
  vsBg.style.opacity = cfg.bg.opacity / 100;
  // Vignette
  vsVignette.style.opacity = cfg.vignette.intensity / 100;
  // Scanlines
  vsScanlines.style.display = cfg.scanlines.visible ? '' : 'none';
  vsScanlines.style.opacity = cfg.scanlines.opacity / 100;
  // Tint
  const tintEl = document.getElementById('vs-tint');
  if (cfg.tint.visible && cfg.tint.opacity > 0) {
    tintEl.style.display    = '';
    tintEl.style.background = cfg.tint.color;
    tintEl.style.opacity    = cfg.tint.opacity / 100;
  } else {
    tintEl.style.display = 'none';
  }
  // Particles opacity
  const c1 = document.getElementById('vs-canvas-p1');
  const c2 = document.getElementById('vs-canvas-p2');
  if (c1) c1.style.opacity = cfg.particles.opacity / 100;
  if (c2) c2.style.opacity = cfg.particles.opacity / 100;
  // Animation types on root
  vsRoot.dataset.entry = cfg.animation.entryType;
  vsRoot.dataset.exit  = cfg.animation.exitType;
}

// ── DOM refs ─────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const p1Img  = $('vs-p1-img'),  p2Img  = $('vs-p2-img');
const p1Ph   = $('vs-p1-ph'),   p2Ph   = $('vs-p2-ph');
const p1Name = $('vs-p1-name'), p2Name = $('vs-p2-name');
const p1Tag  = $('vs-p1-tag'),  p2Tag  = $('vs-p2-tag');
const p1Char = $('vs-p1-charname'), p2Char = $('vs-p2-charname');
const p1Socials = $('vs-p1-socials'), p2Socials = $('vs-p2-socials');
const p1Bar  = $('vs-p1-bar'),  p2Bar  = $('vs-p2-bar');
const p1Side = $('vs-p1-side'), p2Side = $('vs-p2-side');
const p1Wrap = $('vs-p1-char-wrap'), p2Wrap = $('vs-p2-char-wrap');
const p1Info = $('vs-p1-info'), p2Info = $('vs-p2-info');
const vsCenter = $('vs-center');
const vsRound  = $('vs-round');
const vsStageName = $('vs-stage-name');
const vsEvent  = $('vs-event-name');
const vsS1     = $('vs-s1-score'), vsS2 = $('vs-s2-score');
const vsBg       = $('vs-bg');
const vsBgLayer  = $('vs-bg-layer');
const vsFlash    = $('vs-flash');
const vsRoot     = $('vs-root');
const vsVignette = $('vs-vignette');
const vsScanlines = $('vs-scanlines');

// ── Réseaux sociaux ──────────────────────────────────────────
const SOCIAL_META = {
  twitter: { cls: 'social-twitter', icon: '𝕏',  label: handle => handle.replace(/^@/, '') },
  twitch:  { cls: 'social-twitch',  icon: '◈', label: handle => handle },
  discord: { cls: 'social-discord', icon: '●', label: handle => handle },
  youtube: { cls: 'social-youtube', icon: '▶', label: handle => handle },
};

function renderSocials(el, socials) {
  el.innerHTML = '';
  (socials || []).forEach(raw => {
    const s = (raw || '').trim();
    if (!s) return;
    const lower = s.toLowerCase();
    let meta = null, handle = s;
    for (const [key, m] of Object.entries(SOCIAL_META)) {
      if (lower.startsWith(key)) {
        meta = m;
        handle = s.slice(key.length).replace(/^[\s@:]+/, '');
        break;
      }
    }
    if (!handle) return;
    const item = document.createElement('span');
    item.className = 'vs-social-item' + (meta ? ' ' + meta.cls : '');
    item.innerHTML = `<span class="vs-social-icon">${meta ? meta.icon : '•'}</span>${meta ? meta.label(handle) : handle}`;
    el.appendChild(item);
  });
}

// ── Particle systems init ────────────────────────────────────
function initParticles() {
  const c1 = $('vs-canvas-p1');
  const c2 = $('vs-canvas-p2');
  c1.width  = 960; c1.height = 1080;
  c2.width  = 960; c2.height = 1080;
  PS1 = makePS(c1);
  PS2 = makePS(c2);
}

function startParticles(charId1, charId2) {
  const p1Ov = vsConfig?.particles?.p1Override;
  const p2Ov = vsConfig?.particles?.p2Override;
  const density = (vsConfig?.particles?.density ?? 100) / 100;

  const key1 = CHAR_TO_THEME[charId1];
  const key2 = CHAR_TO_THEME[charId2];

  const cfg1 = (p1Ov && p1Ov !== 'auto') ? { type: p1Ov, count: 80 } : (key1 ? THEME_PARTICLES[key1] : null);
  const cfg2 = (p2Ov && p2Ov !== 'auto') ? { type: p2Ov, count: 80 } : (key2 ? THEME_PARTICLES[key2] : null);

  if (cfg1) PS1.start(cfg1.type, Math.max(1, Math.round(cfg1.count * density)));
  else       PS1.stop();
  if (cfg2) PS2.start(cfg2.type, Math.max(1, Math.round(cfg2.count * density)));
  else       PS2.stop();
}

// ── Character image ──────────────────────────────────────────
function setCharImg(imgEl, phEl, character, stockColor) {
  if (!character) {
    imgEl.style.display = 'none';
    phEl.classList.add('active');
    phEl.textContent = '?';
    return;
  }
  const color = String(stockColor ?? 0).padStart(2, '0');
  const name  = character.name.replace(/\s*\/\s*/g, '-');
  const enc   = encodeURIComponent(name);
  imgEl.src = `/full/chara_1_${enc}_${color}.png`;
  imgEl.style.display = 'block';
  phEl.classList.remove('active');
  imgEl.onerror = () => {
    imgEl.src = `/full/chara_1_${enc}_00.png`;
    imgEl.onerror = () => {
      imgEl.style.display = 'none';
      phEl.classList.add('active');
      phEl.textContent = name.charAt(0).toUpperCase();
    };
  };
}

// ── Stage background ─────────────────────────────────────────
function setStageBackground(stageName) {
  if (!stageName) { vsBg.style.backgroundImage = ''; return; }
  const encoded = encodeURIComponent(stageName);
  const img = new Image();
  img.onload = () => { vsBg.style.backgroundImage = `url('/maps/${encoded}')` || `url('/maps/${stageName}')`; };
  img.onerror = () => { vsBg.style.backgroundImage = ''; };
  img.src = `/maps/${stageName}`;
}

// ── Animations entrée / sortie ───────────────────────────────
let animTimeout = null;

function triggerAnimation() {
  if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = null; }

  const dur = vsConfig?.animation?.duration ?? 700;
  vsRoot.dataset.entry = vsConfig?.animation?.entryType || 'slide';
  vsRoot.dataset.exit  = vsConfig?.animation?.exitType  || 'fade';

  // Reset all states
  [vsBgLayer, p1Wrap, p2Wrap, p1Info, p2Info, vsCenter].forEach(el => {
    el.classList.remove('vs-in', 'vs-out');
    el.style.transition = '';
  });

  if (vsConfig?.animation?.flashEnabled !== false) doFlash();

  clearTimeout(animTimeout);
  setTimeout(() => {
    // Appliquer la durée custom via style
    const ease = 'cubic-bezier(0.22,1,0.36,1)';
    const easeB = vsConfig?.animation?.entryType === 'bounce'
      ? 'cubic-bezier(0.34,1.56,0.64,1)' : ease;
    const bgDur = Math.round(dur * 1.2);
    vsBgLayer.style.transition = `opacity ${bgDur}ms ease, transform ${bgDur}ms ${easeB}`;
    vsBgLayer.classList.add('vs-in');
    [p1Wrap, p2Wrap].forEach(el => {
      el.style.transition = `transform ${dur}ms ${easeB}, opacity ${Math.round(dur*0.65)}ms ease`;
    });
    p1Wrap.classList.add('vs-in');
    p2Wrap.classList.add('vs-in');
    setTimeout(() => {
      [p1Info, p2Info, vsCenter].forEach(el => {
        el.style.transition = `transform ${Math.round(dur*0.7)}ms ease, opacity ${Math.round(dur*0.6)}ms ease`;
      });
      p1Info.classList.add('vs-in');
      p2Info.classList.add('vs-in');
      vsCenter.classList.add('vs-in');
    }, Math.round(dur * 0.2));
  }, 50);

  // Auto-hide
  const autoHide = vsConfig?.animation?.autoHide ?? 0;
  if (autoHide > 0) {
    autoHideTimer = setTimeout(() => exitAnimation(), autoHide * 1000 + dur + 300);
  }
}

function exitAnimation() {
  if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = null; }
  PS1.stop();
  PS2.stop();
  [vsBgLayer, p1Wrap, p2Wrap, p1Info, p2Info, vsCenter].forEach(el => {
    el.classList.add('vs-out');
    el.classList.remove('vs-in');
    el.style.transition = '';
  });
}

function doFlash() {
  vsFlash.classList.remove('flash-anim');
  void vsFlash.offsetWidth;
  vsFlash.classList.add('flash-anim');
}

// ── Update from state ─────────────────────────────────────────
function update(s) {
  // Player names & tags
  p1Name.textContent = s.player1.name || 'PLAYER 1';
  p2Name.textContent = s.player2.name || 'PLAYER 2';
  p1Tag.textContent  = s.player1.tag  || '';
  p2Tag.textContent  = s.player2.tag  || '';

  // Character names
  p1Char.textContent = s.player1.character?.name || '';
  p2Char.textContent = s.player2.character?.name || '';
  renderSocials(p1Socials, s.player1.socials);
  renderSocials(p2Socials, s.player2.socials);

  // Player colors on bars
  p1Bar.style.setProperty('--pcolor', s.player1.color || '#E83030');
  p1Side.style.setProperty('--pcolor', s.player1.color || '#E83030');
  p1Tag.style.color = s.player1.color || '#E83030';
  p2Bar.style.setProperty('--pcolor', s.player2.color || '#3070E8');
  p2Side.style.setProperty('--pcolor', s.player2.color || '#3070E8');
  p2Tag.style.color = s.player2.color || '#3070E8';

  // Character images
  setCharImg(p1Img, p1Ph, s.player1.character, s.player1.stockColor);
  setCharImg(p2Img, p2Ph, s.player2.character, s.player2.stockColor);

  // Center info
  vsRound.textContent    = s.stage || '';
  vsStageName.textContent = s.currentStage || '';
  vsEvent.textContent    = s.event || '';
  vsS1.textContent       = s.player1.score ?? 0;
  vsS2.textContent       = s.player2.score ?? 0;
  $('vs-dot').style.display = (s.stage && s.currentStage) ? 'inline' : 'none';

  // Stage background
  if (!prevState || prevState.currentStage !== s.currentStage) {
    setStageBackground(s.currentStage);
  }

  // Thème overlay → accent color
  const theme = s.overlayTheme || 'default';
  let accent = VS_THEME_ACCENT[theme];
  if (!accent && theme === 'dual') {
    accent = s.player1.color || '#FFFFFF';
  }
  if (!accent) accent = '#FFFFFF';
  vsRoot.style.setProperty('--vs-accent',      accent);
  vsRoot.style.setProperty('--vs-accent-glow',  hexToRgba(accent, 0.45));
  vsRoot.style.setProperty('--vs-accent-glow2', hexToRgba(accent, 0.18));
  // Classe thème (pour éventuels overrides CSS spéciaux)
  vsRoot.className = vsRoot.className.replace(/\btheme-\S+/g, '').trim();
  if (theme !== 'default') vsRoot.classList.add('theme-' + theme);

  // Particles — restart if character changed
  const charChanged = !prevState
    || prevState.player1.character?.id !== s.player1.character?.id
    || prevState.player2.character?.id !== s.player2.character?.id;
  if (charChanged) {
    startParticles(s.player1.character?.id, s.player2.character?.id);
  }

  prevState = s;
}

// ── Custom background ─────────────────────────────────────────
const vsCustomBg = $('vs-custom-bg');

function setCustomBg(url) {
  vsCustomBg.style.backgroundImage = url ? `url('${url}?t=${Date.now()}')` : '';
}

socket.on('vsBgUpdate', ({ url }) => setCustomBg(url));

socket.on('vsConfigUpdate', cfg => {
  applyVsConfig(cfg);
  // Relancer les particules si override changé
  if (prevState) startParticles(prevState.player1?.character?.id, prevState.player2?.character?.id);
});

// ── vsScreen trigger ──────────────────────────────────────────
socket.on('vsScreenTrigger', () => {
  triggerAnimation();
});

socket.on('vsScreenHide', () => {
  exitAnimation();
});

// ── State updates ─────────────────────────────────────────────
socket.on('stateUpdate', s => {
  update(s);
});

// ── Init ──────────────────────────────────────────────────────
async function init() {
  try { initParticles(); } catch(e) { console.warn('VS particles init failed:', e); }
  try {
    const [stateRes, bgRes, cfgRes] = await Promise.all([
      fetch('/api/state'),
      fetch('/api/vs-background'),
      fetch('/api/vs-config'),
    ]);
    const s   = await stateRes.json();
    const { url } = await bgRes.json();
    const cfg = await cfgRes.json();
    applyVsConfig(cfg);
    setCustomBg(url);
    update(s);
    triggerAnimation();
  } catch(e) {
    console.error('VS Screen init failed:', e);
  }
}

init();

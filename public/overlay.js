const socket = io();
let currentState = null;

// ── Logo particules (thèmes custom) ──────────────────────────
const _lp = { parts: [], rafId: null, src: null, count: 3 };
const CUSTOM_THEMES = ['cyberpunk', 'synthwave', 'midnight', 'egypt', 'city', 'eco', 'water', 'fire',
  'pkpsy', 'pktenebres', 'pkelectrik', 'pkfee', 'pkspectre', 'pkdragon', 'pkglace', 'pkcombat',
  'pkpoison', 'pksol', 'pkvol', 'pkinsecte', 'pkroche', 'pkacier', 'pknormal', 'pkplante', 'pkfeu', 'pkeau',
  'rainbow', 'trans', 'pan', 'bi', 'lesbian', 'plage',
  'smario','sdk','slink','ssamus','sdsamus','syoshi','skirby','sfox','spikachu','sluigi',
  'sness','sfalcon','sjigglypuff','speach','sdaisy','sbowser','siceclimbers','ssheik','szelda','sdrmario',
  'spichu','sfalco','smarth','slucina','sylink','sganondorf','smewtwo','sroy','schrom','sgamewatch',
  'smetaknight','spit','sdarkpit','szss','swario','ssnake','sike','spktrainer','sdiddy','slucas',
  'ssonic','sdedede','solimar','slucario','srob','stoonlink','swolf','svilager','smegaman','swiifit',
  'srosalina','slittlemac','sgreninja','spalutena','spacman','srobin','sshulk','sbowserjr','sduckhunt','sryu',
  'sken','scloud','scorrin','sbayonetta','sinkling','sridley','ssimon','srichter','skrool','sisabelle',
  'sincineroar','spiranha','sjoker','shero','sbanjo','sterry','sbyleth','sminmin','ssteve','ssephiroth',
  'spyra','smythra','skazuya','ssora','smii_brawl','smii_sword','smii_gun'];

function _lpSetCount(n) {
  const bg = document.getElementById('theme-logo-bg');
  // Remove excess
  while (_lp.parts.length > n) {
    const p = _lp.parts.pop();
    p.el.remove();
  }
  // Add missing
  while (_lp.parts.length < n) {
    const img = document.createElement('img');
    img.style.cssText = 'position:absolute;height:28px;width:auto;pointer-events:none;opacity:0.5;display:none;';
    bg.appendChild(img);
    _lp.parts.push({ el: img, x: 0, y: 0, vx: 0, vy: 0 });
  }
  _lp.count = n;
}

function _lpStart(src, count) {
  _lpSetCount(count);
  const bg = document.getElementById('theme-logo-bg');
  _lp.parts.forEach(p => {
    p.el.src = src;
    p.el.style.display = 'block';
    const W = bg.offsetWidth  || 600;
    const H = bg.offsetHeight || 80;
    p.x = Math.random() * W;
    p.y = Math.random() * H;
    const angle = Math.random() * Math.PI * 2;
    const spd   = 0.3 + Math.random() * 0.5;
    p.vx = Math.cos(angle) * spd;
    p.vy = Math.sin(angle) * spd;
  });
  if (_lp.rafId) cancelAnimationFrame(_lp.rafId);
  (function tick() {
    const W = bg.offsetWidth;
    const H = bg.offsetHeight;
    _lp.parts.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      const iW = p.el.offsetWidth  || 40;
      const iH = p.el.offsetHeight || 28;
      if (p.x >  W + iW) p.x = -iW;
      if (p.x < -iW)     p.x =  W + iW;
      if (p.y >  H + iH) p.y = -iH;
      if (p.y < -iH)     p.y =  H + iH;
      p.el.style.left = p.x + 'px';
      p.el.style.top  = p.y + 'px';
    });
    _lp.rafId = requestAnimationFrame(tick);
  })();
}

function _lpStop() {
  if (_lp.rafId) { cancelAnimationFrame(_lp.rafId); _lp.rafId = null; }
  _lp.parts.forEach(p => { p.el.style.display = 'none'; });
}

const PS = createParticleSystem('particle-canvas', 'scoreboard');


// ── Couleurs de référence par thème personnage (pour le mode Dual) ─────────────
const CHAR_THEME_COLORS = {
  smario:      { primary:'#E52222', glow:'rgba(229,34,34,0.38)',    bg:'rgba(26,4,0,0.94)'    },
  sdk:         { primary:'#8B4513', glow:'rgba(139,69,19,0.38)',    bg:'rgba(12,6,0,0.94)'    },
  slink:       { primary:'#5BAD20', glow:'rgba(91,173,32,0.38)',    bg:'rgba(4,18,0,0.94)'    },
  ssamus:      { primary:'#FF6A00', glow:'rgba(255,106,0,0.38)',    bg:'rgba(18,6,0,0.94)'    },
  sdsamus:     { primary:'#9D00FF', glow:'rgba(157,0,255,0.38)',    bg:'rgba(10,0,20,0.94)'   },
  syoshi:      { primary:'#5DCB14', glow:'rgba(93,203,20,0.38)',    bg:'rgba(4,16,0,0.94)'    },
  skirby:      { primary:'#FF8CB4', glow:'rgba(255,140,180,0.38)',  bg:'rgba(20,4,12,0.94)'   },
  sfox:        { primary:'#CC5500', glow:'rgba(204,85,0,0.38)',     bg:'rgba(18,6,0,0.94)'    },
  spikachu:    { primary:'#FFD700', glow:'rgba(255,215,0,0.38)',    bg:'rgba(20,16,0,0.94)'   },
  sluigi:      { primary:'#2AA000', glow:'rgba(42,160,0,0.38)',     bg:'rgba(2,14,0,0.94)'    },
  sness:       { primary:'#CC1100', glow:'rgba(204,17,0,0.38)',     bg:'rgba(18,0,0,0.94)'    },
  sfalcon:     { primary:'#FF4400', glow:'rgba(255,68,0,0.38)',     bg:'rgba(20,4,0,0.94)'    },
  sjigglypuff: { primary:'#FF8CB4', glow:'rgba(255,140,180,0.38)',  bg:'rgba(20,4,12,0.94)'   },
  speach:      { primary:'#F9A8D4', glow:'rgba(249,168,212,0.38)',  bg:'rgba(20,4,14,0.94)'   },
  sdaisy:      { primary:'#FFD700', glow:'rgba(255,215,0,0.38)',    bg:'rgba(20,16,0,0.94)'   },
  sbowser:     { primary:'#009A00', glow:'rgba(0,154,0,0.38)',      bg:'rgba(0,14,0,0.94)'    },
  siceclimbers:{ primary:'#7AB8FF', glow:'rgba(122,184,255,0.38)',  bg:'rgba(4,10,20,0.94)'   },
  ssheik:      { primary:'#00A0C0', glow:'rgba(0,160,192,0.38)',    bg:'rgba(0,10,16,0.94)'   },
  szelda:      { primary:'#C080FF', glow:'rgba(192,128,255,0.38)',  bg:'rgba(10,4,20,0.94)'   },
  sdrmario:    { primary:'#E52222', glow:'rgba(229,34,34,0.38)',    bg:'rgba(26,4,0,0.94)'    },
  spichu:      { primary:'#FFD700', glow:'rgba(255,215,0,0.38)',    bg:'rgba(20,16,0,0.94)'   },
  sfalco:      { primary:'#0088CC', glow:'rgba(0,136,204,0.38)',    bg:'rgba(0,8,18,0.94)'    },
  smarth:      { primary:'#8855FF', glow:'rgba(136,85,255,0.38)',   bg:'rgba(8,4,20,0.94)'    },
  slucina:     { primary:'#CC6688', glow:'rgba(204,102,136,0.38)',  bg:'rgba(18,4,10,0.94)'   },
  sylink:      { primary:'#2A7040', glow:'rgba(42,112,64,0.38)',    bg:'rgba(2,10,4,0.94)'    },
  sganondorf:  { primary:'#6600AA', glow:'rgba(102,0,170,0.38)',    bg:'rgba(8,0,16,0.94)'    },
  smewtwo:     { primary:'#C070FF', glow:'rgba(192,112,255,0.38)',  bg:'rgba(12,4,20,0.94)'   },
  sroy:        { primary:'#FF3300', glow:'rgba(255,51,0,0.38)',     bg:'rgba(20,2,0,0.94)'    },
  schrom:      { primary:'#4488FF', glow:'rgba(68,136,255,0.38)',   bg:'rgba(2,6,20,0.94)'    },
  sgamewatch:  { primary:'#AAAAAA', glow:'rgba(170,170,170,0.28)',  bg:'rgba(4,4,4,0.94)'     },
  smetaknight: { primary:'#4466BB', glow:'rgba(68,102,187,0.38)',   bg:'rgba(2,4,16,0.94)'    },
  spit:        { primary:'#AACC55', glow:'rgba(170,204,85,0.38)',   bg:'rgba(10,14,2,0.94)'   },
  sdarkpit:    { primary:'#6688AA', glow:'rgba(102,136,170,0.38)',  bg:'rgba(4,6,12,0.94)'    },
  szss:        { primary:'#CC66FF', glow:'rgba(204,102,255,0.38)',  bg:'rgba(14,4,20,0.94)'   },
  swario:      { primary:'#DDAA00', glow:'rgba(221,170,0,0.38)',    bg:'rgba(16,12,0,0.94)'   },
  ssnake:      { primary:'#448822', glow:'rgba(68,136,34,0.38)',    bg:'rgba(4,10,2,0.94)'    },
  sike:        { primary:'#0066CC', glow:'rgba(0,102,204,0.38)',    bg:'rgba(0,6,18,0.94)'    },
  spktrainer:  { primary:'#CC3300', glow:'rgba(204,51,0,0.38)',     bg:'rgba(18,2,0,0.94)'    },
  sdiddy:      { primary:'#BB5500', glow:'rgba(187,85,0,0.38)',     bg:'rgba(16,6,0,0.94)'    },
  slucas:      { primary:'#CC8833', glow:'rgba(204,136,51,0.38)',   bg:'rgba(18,8,2,0.94)'    },
  ssonic:      { primary:'#1A6BFF', glow:'rgba(26,107,255,0.38)',   bg:'rgba(0,4,20,0.94)'    },
  sdedede:     { primary:'#CC0055', glow:'rgba(204,0,85,0.38)',     bg:'rgba(16,0,6,0.94)'    },
  solimar:     { primary:'#DDAA00', glow:'rgba(221,170,0,0.38)',    bg:'rgba(18,12,0,0.94)'   },
  slucario:    { primary:'#4488CC', glow:'rgba(68,136,204,0.38)',   bg:'rgba(2,6,18,0.94)'    },
  srob:        { primary:'#AAAAAA', glow:'rgba(170,170,170,0.28)',  bg:'rgba(10,10,10,0.94)'  },
  stoonlink:   { primary:'#55AA22', glow:'rgba(85,170,34,0.38)',    bg:'rgba(4,12,2,0.94)'    },
  swolf:       { primary:'#6688AA', glow:'rgba(102,136,170,0.38)',  bg:'rgba(4,8,14,0.94)'    },
  svilager:    { primary:'#88CC44', glow:'rgba(136,204,68,0.38)',   bg:'rgba(8,14,2,0.94)'    },
  smegaman:    { primary:'#0099DD', glow:'rgba(0,153,221,0.38)',    bg:'rgba(0,10,18,0.94)'   },
  swiifit:     { primary:'#AADDAA', glow:'rgba(170,221,170,0.28)',  bg:'rgba(10,16,10,0.94)'  },
  srosalina:   { primary:'#88AAFF', glow:'rgba(136,170,255,0.38)',  bg:'rgba(6,8,20,0.94)'    },
  slittlemac:  { primary:'#FF8822', glow:'rgba(255,136,34,0.38)',   bg:'rgba(20,8,2,0.94)'    },
  sgreninja:   { primary:'#2266AA', glow:'rgba(34,102,170,0.38)',   bg:'rgba(2,6,16,0.94)'    },
  spalutena:   { primary:'#CCAAFF', glow:'rgba(204,170,255,0.38)',  bg:'rgba(16,12,20,0.94)'  },
  spacman:     { primary:'#FFDD00', glow:'rgba(255,221,0,0.38)',    bg:'rgba(20,18,0,0.94)'   },
  srobin:      { primary:'#CC5500', glow:'rgba(204,85,0,0.38)',     bg:'rgba(16,6,0,0.94)'    },
  sshulk:      { primary:'#CCAA55', glow:'rgba(204,170,85,0.38)',   bg:'rgba(18,16,4,0.94)'   },
  sbowserjr:   { primary:'#DD9900', glow:'rgba(221,153,0,0.38)',    bg:'rgba(18,12,0,0.94)'   },
  sduckhunt:   { primary:'#886644', glow:'rgba(136,102,68,0.38)',   bg:'rgba(12,8,4,0.94)'    },
  sryu:        { primary:'#FFFFFF', glow:'rgba(255,255,255,0.22)',  bg:'rgba(6,6,10,0.94)'    },
  sken:        { primary:'#FF6600', glow:'rgba(255,102,0,0.38)',    bg:'rgba(20,6,0,0.94)'    },
  scloud:      { primary:'#6699CC', glow:'rgba(102,153,204,0.38)',  bg:'rgba(4,8,16,0.94)'    },
  scorrin:     { primary:'#CC7755', glow:'rgba(204,119,85,0.38)',   bg:'rgba(18,10,6,0.94)'   },
  sbayonetta:  { primary:'#8888CC', glow:'rgba(136,136,204,0.38)',  bg:'rgba(6,6,14,0.94)'    },
  sinkling:    { primary:'#FF4499', glow:'rgba(255,68,153,0.38)',   bg:'rgba(20,2,12,0.94)'   },
  sridley:     { primary:'#8844AA', glow:'rgba(136,68,170,0.38)',   bg:'rgba(10,2,14,0.94)'   },
  ssimon:      { primary:'#CC8844', glow:'rgba(204,136,68,0.38)',   bg:'rgba(18,12,4,0.94)'   },
  srichter:    { primary:'#997744', glow:'rgba(153,119,68,0.38)',   bg:'rgba(14,10,4,0.94)'   },
  skrool:      { primary:'#AA6600', glow:'rgba(170,102,0,0.38)',    bg:'rgba(16,8,0,0.94)'    },
  sisabelle:   { primary:'#FFCC44', glow:'rgba(255,204,68,0.38)',   bg:'rgba(20,18,2,0.94)'   },
  sincineroar: { primary:'#CC3366', glow:'rgba(204,51,102,0.38)',   bg:'rgba(18,2,8,0.94)'    },
  spiranha:    { primary:'#33BB33', glow:'rgba(51,187,51,0.38)',    bg:'rgba(2,16,2,0.94)'    },
  sjoker:      { primary:'#DD0000', glow:'rgba(221,0,0,0.38)',      bg:'rgba(18,0,0,0.94)'    },
  shero:       { primary:'#4455CC', glow:'rgba(68,85,204,0.38)',    bg:'rgba(2,4,18,0.94)'    },
  sbanjo:      { primary:'#CC9933', glow:'rgba(204,153,51,0.38)',   bg:'rgba(18,14,2,0.94)'   },
  sterry:      { primary:'#FF3300', glow:'rgba(255,51,0,0.38)',     bg:'rgba(20,2,0,0.94)'    },
  sbyleth:     { primary:'#996633', glow:'rgba(153,102,51,0.38)',   bg:'rgba(14,8,4,0.94)'    },
  sminmin:     { primary:'#FF6688', glow:'rgba(255,102,136,0.38)',  bg:'rgba(20,6,10,0.94)'   },
  ssteve:      { primary:'#887766', glow:'rgba(136,119,102,0.38)',  bg:'rgba(10,8,6,0.94)'    },
  ssephiroth:  { primary:'#AAAAFF', glow:'rgba(170,170,255,0.38)',  bg:'rgba(8,8,20,0.94)'    },
  spyra:       { primary:'#FF9900', glow:'rgba(255,153,0,0.38)',    bg:'rgba(20,14,0,0.94)'   },
  smythra:     { primary:'#FF5500', glow:'rgba(255,85,0,0.38)',     bg:'rgba(20,4,0,0.94)'    },
  skazuya:     { primary:'#5500CC', glow:'rgba(85,0,204,0.38)',     bg:'rgba(6,0,18,0.94)'    },
  ssora:       { primary:'#4477FF', glow:'rgba(68,119,255,0.38)',   bg:'rgba(2,4,20,0.94)'    },
  smii_brawl:  { primary:'#AA4400', glow:'rgba(170,68,0,0.38)',     bg:'rgba(16,4,0,0.94)'    },
  smii_sword:  { primary:'#7799BB', glow:'rgba(119,153,187,0.38)',  bg:'rgba(6,8,14,0.94)'    },
  smii_gun:    { primary:'#448866', glow:'rgba(68,136,102,0.38)',   bg:'rgba(2,10,6,0.94)'    },
  default:     { primary:'#888888', glow:'rgba(136,136,136,0.22)',  bg:'rgba(10,10,14,0.94)'  },
};


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
  const isTransparent = (s.overlayTheme || 'default') === 'transparent';
  sb.classList.toggle('hidden', !s.visible);
  sb.classList.toggle('swapped', !!s.swapped);
  sb.classList.toggle('style-slim', s.overlayStyle === 'slim');

  // Theme class
  ['default', 'cyberpunk', 'synthwave', 'midnight', 'egypt', 'city', 'eco', 'water', 'fire',
   'pkpsy', 'pktenebres', 'pkelectrik', 'pkfee', 'pkspectre', 'pkdragon', 'pkglace', 'pkcombat',
   'pkpoison', 'pksol', 'pkvol', 'pkinsecte', 'pkroche', 'pkacier', 'pknormal', 'pkplante', 'pkfeu', 'pkeau',
   'rainbow', 'trans', 'pan', 'bi', 'lesbian', 'plage',
   'smario','sdk','slink','ssamus','sdsamus','syoshi','skirby','sfox','spikachu','sluigi',
   'sness','sfalcon','sjigglypuff','speach','sdaisy','sbowser','siceclimbers','ssheik','szelda','sdrmario',
   'spichu','sfalco','smarth','slucina','sylink','sganondorf','smewtwo','sroy','schrom','sgamewatch',
   'smetaknight','spit','sdarkpit','szss','swario','ssnake','sike','spktrainer','sdiddy','slucas',
   'ssonic','sdedede','solimar','slucario','srob','stoonlink','swolf','svilager','smegaman','swiifit',
   'srosalina','slittlemac','sgreninja','spalutena','spacman','srobin','sshulk','sbowserjr','sduckhunt','sryu',
   'sken','scloud','scorrin','sbayonetta','sinkling','sridley','ssimon','srichter','skrool','sisabelle',
   'sincineroar','spiranha','sjoker','shero','sbanjo','sterry','sbyleth','sminmin','ssteve','ssephiroth',
   'spyra','smythra','skazuya','ssora','smii_brawl','smii_sword','smii_gun',
   'dual','transparent'].forEach(t => {
    sb.classList.toggle('theme-' + t, (s.overlayTheme || 'default') === t);
  });

  // ── Dual character theme — CSS vars ─────────────────────────
  const isDual = (s.overlayTheme || 'default') === 'dual';
  if (isDual) {
    const kA = s.player1.character?.id ? 's' + s.player1.character.id : 'default';
    const kB = s.player2.character?.id ? 's' + s.player2.character.id : 'default';
    // kLeft/kRight follow visual position (respects swap)
    const kLeft  = s.swapped ? kB : kA;
    const kRight = s.swapped ? kA : kB;
    const cLeft  = CHAR_THEME_COLORS[kLeft]  || CHAR_THEME_COLORS.default;
    const cRight = CHAR_THEME_COLORS[kRight] || CHAR_THEME_COLORS.default;
    sb.style.setProperty('--p1-theme-primary', cLeft.primary);
    sb.style.setProperty('--p1-theme-glow',    cLeft.glow);
    sb.style.setProperty('--p1-theme-bg',      cLeft.bg);
    sb.style.setProperty('--p2-theme-primary', cRight.primary);
    sb.style.setProperty('--p2-theme-glow',    cRight.glow);
    sb.style.setProperty('--p2-theme-bg',      cRight.bg);
  }

  // Logo particules
  const isCustomTheme = CUSTOM_THEMES.includes(s.overlayTheme || 'default');
  const lpCount = Math.min(100, Math.max(1, s.logoParticleCount || 3));
  if (isCustomTheme && s.centerLogo) {
    if (_lp.src !== s.centerLogo || _lp.count !== lpCount || !_lp.rafId) {
      _lp.src = s.centerLogo;
      _lpStart(s.centerLogo, lpCount);
    }
  } else {
    _lp.src = null;
    _lpStop();
  }

  // Canvas particules
  if (s.particlesEnabled === false) {
    if (PS.type) PS.stop();
  } else if (isDual) {
    const kA = s.player1.character?.id ? 's' + s.player1.character.id : 'default';
    const kB = s.player2.character?.id ? 's' + s.player2.character.id : 'default';
    // Respect visual swap: left side first in startDual
    const kLeft  = s.swapped ? kB : kA;
    const kRight = s.swapped ? kA : kB;
    const tpLeft  = THEME_PARTICLES[kLeft];
    const tpRight = THEME_PARTICLES[kRight];
    const typeLeft   = tpLeft?.type   || 'sparkle';
    const countLeft  = Math.round((tpLeft?.count  || 40) * 0.55);
    const typeRight  = tpRight?.type  || 'sparkle';
    const countRight = Math.round((tpRight?.count || 40) * 0.55);
    const key = `${typeLeft}|${countLeft}|${typeRight}|${countRight}`;
    if (PS.type !== '__dual__' || PS.dualKey !== key) {
      PS.startDual(typeLeft, countLeft, typeRight, countRight);
    }
  } else {
    const tpConf = THEME_PARTICLES[s.overlayTheme || 'default'];
    if (tpConf) {
      if (tpConf.type !== PS.type) PS.start(tpConf.type, tpConf.count);
    } else if (PS.type) {
      PS.stop();
    }
  }

  // Background color + opacity
  const hex = (s.sbBgColor || '#0E0E12').replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = (s.sbBgOpacity ?? 100) / 100;
  sb.style.setProperty('--sb-bg', `rgba(${r},${g},${b},${a})`);

  // Particule opacity & count scale
  const pOp = (s.particleOpacity ?? 100) / 100;
  if (PS.opacity !== pOp) PS.setOpacity(pOp);
  const pScale = (s.particleCountScale ?? 100) / 100;
  if (Math.abs(PS.countScale - pScale) > 0.001) PS.setCountScale(pScale);

  sb.style.setProperty('--sb-scale', (s.sbScale ?? 100) / 100);
  sb.style.setProperty('--sb-x', (s.sbX ?? 0) + 'px');
  sb.style.setProperty('--sb-y', (s.sbY ?? 0) + 'px');

  sb.style.setProperty('--event-text-size', `${s.eventTextSize ?? 12}px`);
  const fw = s.flagSize ?? 52;
  sb.style.setProperty('--flag-w', fw + 'px');
  sb.style.setProperty('--flag-h', Math.round(fw * 34 / 52) + 'px');
  sb.style.setProperty('--event-text-color', s.eventTextColor || '#5A5A7A');
  sb.style.setProperty('--tag-color', s.tagColor || '#E8B830');
  sb.style.setProperty('--name-color', s.nameColor || '#F0EEF8');
  sb.style.setProperty('--pronouns-color', s.pronounsColor || '#5A5A7A');

  // Colors — full layout
  const c1 = s.hidePlayerColors ? 'transparent' : s.player1.color;
  const c2 = s.hidePlayerColors ? 'transparent' : s.player2.color;
  document.getElementById('player1-block').style.setProperty('--p1-color', c1);
  document.getElementById('player2-block').style.setProperty('--p2-color', c2);
  // Colors — slim layout
  document.getElementById('player1-block-slim').style.setProperty('--p1-color', c1);
  document.getElementById('player2-block-slim').style.setProperty('--p2-color', c2);

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
  if (s.player1.character) {
    const c1 = String(s.player1.stockColor ?? 0).padStart(2, '0');
    const n1 = s.player1.character.name.replace(/\s*\/\s*/g, '-');
    p1Img.src = `/full/chara_1_${n1}_${c1}.png`;
    p1Img.style.display = 'block';
    p1Ph.style.display = 'none';
    p1Img.onerror = () => {
      p1Img.src = `/full/chara_1_${n1}_00.png`;
      p1Img.onerror = () => { p1Img.style.display = 'none'; p1Ph.style.display = 'flex'; p1Ph.textContent = n1.charAt(0); };
    };
  } else {
    p1Img.style.display = 'none';
    p1Ph.style.display = 'flex';
    p1Ph.textContent = '?';
  }

  // Stock icon — Player 1 (slim)
  const p1Stock = document.getElementById('p1-stock-icon');
  const p1Sep   = document.getElementById('p1-icon-sep');
  if (s.player1.character) {
    const color1 = String(s.player1.stockColor ?? 0).padStart(2, '0');
    const name1 = s.player1.character.name.replace(/\s*\/\s*/g, '-');
    p1Stock.src = `/Stock Icons/chara_2_${name1}_${color1}.png`;
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
  if (s.player2.character) {
    const c2 = String(s.player2.stockColor ?? 0).padStart(2, '0');
    const n2 = s.player2.character.name.replace(/\s*\/\s*/g, '-');
    p2Img.src = `/full/chara_1_${n2}_${c2}.png`;
    p2Img.style.display = 'block';
    p2Ph.style.display = 'none';
    p2Img.onerror = () => {
      p2Img.src = `/full/chara_1_${n2}_00.png`;
      p2Img.onerror = () => { p2Img.style.display = 'none'; p2Ph.style.display = 'flex'; p2Ph.textContent = n2.charAt(0); };
    };
  } else {
    p2Img.style.display = 'none';
    p2Ph.style.display = 'flex';
    p2Ph.textContent = '?';
  }

  // Stock icon — Player 2 (slim)
  const p2Stock = document.getElementById('p2-stock-icon');
  const p2Sep   = document.getElementById('p2-icon-sep');
  if (s.player2.character) {
    const color2 = String(s.player2.stockColor ?? 0).padStart(2, '0');
    const name2 = s.player2.character.name.replace(/\s*\/\s*/g, '-');
    p2Stock.src = `/Stock Icons/chara_2_${name2}_${color2}.png`;
    p2Stock.style.display = 'block';
    p2Sep.style.display = 'block';
    p2Stock.onerror = () => { p2Stock.style.display = 'none'; p2Sep.style.display = 'none'; };
  } else {
    p2Stock.style.display = 'none';
    p2Sep.style.display = 'none';
  }

  // Player flags
  const p1FlagImg = document.getElementById('p1-flag-img');
  const p2FlagImg = document.getElementById('p2-flag-img');
  if (p1FlagImg) {
    const f1 = s.player1?.flag;
    if (f1) { p1FlagImg.src = '/' + f1; p1FlagImg.style.display = 'block'; }
    else { p1FlagImg.style.display = 'none'; }
    sb.style.setProperty('--p1-flag-x', (s.player1?.flagOffsetX ?? 0) + 'px');
    sb.style.setProperty('--p1-flag-y', (s.player1?.flagOffsetY ?? 0) + 'px');
  }
  if (p2FlagImg) {
    const f2 = s.player2?.flag;
    if (f2) { p2FlagImg.src = '/' + f2; p2FlagImg.style.display = 'block'; }
    else { p2FlagImg.style.display = 'none'; }
    sb.style.setProperty('--p2-flag-x', (s.player2?.flagOffsetX ?? 0) + 'px');
    sb.style.setProperty('--p2-flag-y', (s.player2?.flagOffsetY ?? 0) + 'px');
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
  renderDots('p1-dots', s.player1.score, max, c1);
  renderDots('p2-dots', s.player2.score, max, c2);

  // ── Transparent theme — positions CSS vars ───────────────────
  if (isTransparent) {
    const pos = s.transparentPositions || {};
    function setTP(varSuffix, key, dx, dy) {
      const p = pos[key] || {};
      sb.style.setProperty('--tp-' + varSuffix + '-x', (p.x ?? dx) + 'px');
      sb.style.setProperty('--tp-' + varSuffix + '-y', (p.y ?? dy) + 'px');
    }
    setTP('event',   'event',  720,  0);
    setTP('p1-icon', 'p1Icon', 631,  28);
    setTP('p1-name', 'p1Name', 724,  50);
    setTP('score',   'score',  886,  28);
    setTP('p2-name', 'p2Name', 1056, 50);
    setTP('p2-icon', 'p2Icon', 1222, 28);
  }

  currentState = JSON.parse(JSON.stringify(s));
}

socket.on('stateUpdate', update);

PS.init();

fetch('/api/state')
  .then(r => r.json())
  .then(s => {
    document.getElementById('scoreboard').classList.add('animate-in');
    update(s);
  });

const socket = io();

const SF_THEMES = {
  'sf6-default':  { primary: '#F7B731', p1: '#3A8FFF', p2: '#FF5A3A', bg: 'rgba(10,6,2,0.95)' },
  'sf6-capcom':   { primary: '#D4A017', p1: '#2A7FFF', p2: '#FF4A2A', bg: 'rgba(8,4,2,0.97)' },
  'sf6-red':      { primary: '#FF2040', p1: '#FF2040', p2: '#2040FF', bg: 'rgba(10,2,4,0.96)' },
  'sf6-blue':     { primary: '#1A90FF', p1: '#FF8C00', p2: '#1A90FF', bg: 'rgba(2,6,14,0.96)' },
  'sf6-classic':  { primary: '#FFFFFF', p1: '#FF0000', p2: '#0000FF', bg: 'rgba(4,4,4,0.97)' },
};

const SF_PARTICLE_CONFIGS = {
  'sf6-default': { colors: ['#F7B731','#3A8FFF','#FF5A3A'], shapes: ['diamond','triangle'], count: 35, speed: 0.5 },
  'sf6-capcom':  { colors: ['#D4A017','#2A7FFF'],           shapes: ['diamond'],           count: 28, speed: 0.4 },
  'sf6-red':     { colors: ['#FF2040','#FFFFFF'],           shapes: ['triangle'],          count: 38, speed: 0.6 },
  'sf6-blue':    { colors: ['#1A90FF','#E0F0FF'],           shapes: ['circle','diamond'],  count: 30, speed: 0.45 },
  'sf6-classic': { colors: ['#FF0000','#0000FF','#FFFFFF'], shapes: ['diamond'],           count: 32, speed: 0.4 },
};

// ── Particle system ────────────────────────────────────────────────────────────
let _particles = [], _pConfig = null, _rafId = null, _canvas = null, _ctx = null;

function initParticles() {
  _canvas = document.getElementById('sf-particles');
  if (!_canvas) return;
  _ctx = _canvas.getContext('2d');
  _canvas.width = 1920; _canvas.height = 90;
  if (_rafId) cancelAnimationFrame(_rafId);
  _particles = [];
  _rafId = requestAnimationFrame(particleStep);
}

function spawnParticle(cfg) {
  const fromLeft = Math.random() < 0.5;
  const size = 2 + Math.random() * 5;
  return {
    x: fromLeft ? -size : (1920 + size),
    y: Math.random() * 90,
    vx: fromLeft ? cfg.speed*(0.4+Math.random()*0.6) : -cfg.speed*(0.4+Math.random()*0.6),
    vy: (Math.random()-0.5)*0.25,
    size,
    color: cfg.colors[Math.floor(Math.random()*cfg.colors.length)],
    shape: cfg.shapes[Math.floor(Math.random()*cfg.shapes.length)],
    alpha: 0, life: 0, maxLife: 180 + Math.random()*320,
  };
}

function drawParticle(p) {
  _ctx.save();
  _ctx.globalAlpha = p.alpha * 0.65;
  _ctx.fillStyle = p.color;
  _ctx.translate(p.x, p.y);
  _ctx.rotate(p.life * 0.006);
  _ctx.beginPath();
  if (p.shape === 'diamond') {
    _ctx.moveTo(0,-p.size); _ctx.lineTo(p.size*.6,0); _ctx.lineTo(0,p.size); _ctx.lineTo(-p.size*.6,0);
  } else if (p.shape === 'triangle') {
    _ctx.moveTo(0,-p.size); _ctx.lineTo(p.size*.866,p.size*.5); _ctx.lineTo(-p.size*.866,p.size*.5);
  } else {
    _ctx.arc(0,0,p.size*.5,0,Math.PI*2);
  }
  _ctx.closePath(); _ctx.fill(); _ctx.restore();
}

function particleStep() {
  if (!_ctx) return;
  _ctx.clearRect(0,0,1920,90);
  if (_pConfig) {
    while (_particles.length < _pConfig.count) _particles.push(spawnParticle(_pConfig));
    _particles = _particles.filter(p => {
      p.life++; p.x += p.vx; p.y += p.vy;
      const fade=30;
      p.alpha = p.life < fade ? p.life/fade : p.life > p.maxLife-fade ? (p.maxLife-p.life)/fade : 1;
      drawParticle(p);
      return p.life < p.maxLife && p.x > -30 && p.x < 1950;
    });
  }
  _rafId = requestAnimationFrame(particleStep);
}

// ── State ─────────────────────────────────────────────────────────────────────

function applyState(s) {
  if (!s) return;
  const root = document.getElementById('sf-sb');
  root.classList.toggle('hidden', !s.visible);

  const theme = SF_THEMES[s.theme] || SF_THEMES['sf6-default'];
  const p1c = s.p1?.color || theme.p1;
  const p2c = s.p2?.color || theme.p2;

  const r = document.documentElement;
  r.style.setProperty('--sf-primary', theme.primary);
  r.style.setProperty('--sf-p1', p1c);
  r.style.setProperty('--sf-p2', p2c);
  r.style.setProperty('--sf-bg', s.bgColor
    ? `rgba(${parseInt(s.bgColor.slice(1,3),16)},${parseInt(s.bgColor.slice(3,5),16)},${parseInt(s.bgColor.slice(5,7),16)},${(s.bgOpacity??90)/100})`
    : theme.bg);

  document.getElementById('sf-p1-name').textContent  = (s.p1?.name  || 'PLAYER 1').toUpperCase();
  document.getElementById('sf-p1-char').textContent  = (s.p1?.character || '—').toUpperCase();
  document.getElementById('sf-p1-score').textContent = s.p1?.score ?? 0;
  document.getElementById('sf-p1-score').style.color = p1c;

  document.getElementById('sf-p2-name').textContent  = (s.p2?.name  || 'PLAYER 2').toUpperCase();
  document.getElementById('sf-p2-char').textContent  = (s.p2?.character || '—').toUpperCase();
  document.getElementById('sf-p2-score').textContent = s.p2?.score ?? 0;
  document.getElementById('sf-p2-score').style.color = p2c;

  document.getElementById('sf-event').textContent  = (s.event  || 'CAPCOM CUP').toUpperCase();
  document.getElementById('sf-round').textContent  = s.roundNum  || 1;
  document.getElementById('sf-format').textContent = (s.matchFormat || 'Bo3').toUpperCase();

  const baseCfg = SF_PARTICLE_CONFIGS[s.theme] || SF_PARTICLE_CONFIGS['sf6-default'];
  _pConfig = { ...baseCfg, colors: [p1c, p2c, ...baseCfg.colors.slice(2)] };
}

document.addEventListener('DOMContentLoaded', initParticles);
socket.on('sfMatchUpdate', applyState);
fetch('/api/sf/match').then(r => r.json()).then(applyState).catch(() => {});

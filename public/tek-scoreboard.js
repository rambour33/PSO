const socket = io();

const TEK_THEMES = {
  'tek8-default': { primary: '#DC3232', p1: '#DC3232', p2: '#3A8FFF', bg: 'rgba(8,4,4,0.96)' },
  'tek8-dark':    { primary: '#FF0000', p1: '#FF0000', p2: '#FFFFFF', bg: 'rgba(4,2,2,0.98)' },
  'tek8-iron':    { primary: '#AAAAAA', p1: '#DDDDDD', p2: '#888888', bg: 'rgba(6,6,8,0.97)' },
  'tek8-gold':    { primary: '#C9A84C', p1: '#C9A84C', p2: '#8A6A2C', bg: 'rgba(8,6,2,0.96)' },
  'tek8-neon':    { primary: '#FF3EFF', p1: '#FF3EFF', p2: '#3EFFFF', bg: 'rgba(6,2,8,0.96)' },
};

const TEK_PARTICLE_CONFIGS = {
  'tek8-default': { colors: ['#DC3232','#FF8080','#FFFFFF'], shapes: ['triangle','diamond'], count: 38, speed: 0.55 },
  'tek8-dark':    { colors: ['#FF0000','#600000'],           shapes: ['triangle'],           count: 30, speed: 0.5 },
  'tek8-iron':    { colors: ['#AAAAAA','#DDDDDD'],           shapes: ['diamond'],            count: 25, speed: 0.35 },
  'tek8-gold':    { colors: ['#C9A84C','#FFE095'],           shapes: ['diamond','circle'],   count: 32, speed: 0.45 },
  'tek8-neon':    { colors: ['#FF3EFF','#3EFFFF'],           shapes: ['diamond','triangle'], count: 45, speed: 0.7 },
};

let _particles = [], _pConfig = null, _rafId = null, _canvas = null, _ctx = null;

function initParticles() {
  _canvas = document.getElementById('tek-particles');
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
    x: fromLeft ? -size : 1950,
    y: Math.random() * 90,
    vx: fromLeft ? cfg.speed*(0.4+Math.random()*.6) : -cfg.speed*(0.4+Math.random()*.6),
    vy: (Math.random()-.5)*.25, size,
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
  _ctx.rotate(p.life * 0.007);
  _ctx.beginPath();
  if (p.shape === 'diamond') {
    _ctx.moveTo(0,-p.size); _ctx.lineTo(p.size*.6,0); _ctx.lineTo(0,p.size); _ctx.lineTo(-p.size*.6,0);
  } else if (p.shape === 'triangle') {
    _ctx.moveTo(0,-p.size); _ctx.lineTo(p.size*.866,p.size*.5); _ctx.lineTo(-p.size*.866,p.size*.5);
  } else { _ctx.arc(0,0,p.size*.5,0,Math.PI*2); }
  _ctx.closePath(); _ctx.fill(); _ctx.restore();
}

function particleStep() {
  if (!_ctx) return;
  _ctx.clearRect(0,0,1920,90);
  if (_pConfig) {
    while (_particles.length < _pConfig.count) _particles.push(spawnParticle(_pConfig));
    _particles = _particles.filter(p => {
      p.life++; p.x += p.vx; p.y += p.vy;
      const fade = 30;
      p.alpha = p.life < fade ? p.life/fade : p.life > p.maxLife-fade ? (p.maxLife-p.life)/fade : 1;
      drawParticle(p);
      return p.life < p.maxLife && p.x > -30 && p.x < 1950;
    });
  }
  _rafId = requestAnimationFrame(particleStep);
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#','');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${alpha})`;
}

function applyState(s) {
  if (!s) return;
  const root = document.getElementById('tek-sb');
  root.classList.toggle('hidden', !s.visible);

  const theme = TEK_THEMES[s.theme] || TEK_THEMES['tek8-default'];
  const p1c = s.p1?.color || theme.p1;
  const p2c = s.p2?.color || theme.p2;

  const r = document.documentElement;
  r.style.setProperty('--tek-primary', theme.primary);
  r.style.setProperty('--tek-p1', p1c);
  r.style.setProperty('--tek-p2', p2c);
  r.style.setProperty('--tek-bg', s.bgColor ? hexToRgba(s.bgColor, (s.bgOpacity??90)/100) : theme.bg);

  document.getElementById('tek-p1-name').textContent  = (s.p1?.name  || 'PLAYER 1').toUpperCase();
  document.getElementById('tek-p1-char').textContent  = (s.p1?.character || '—').toUpperCase();
  const p1Score = document.getElementById('tek-p1-score');
  p1Score.textContent = s.p1?.score ?? 0;
  p1Score.style.color = p1c;

  document.getElementById('tek-p2-name').textContent  = (s.p2?.name  || 'PLAYER 2').toUpperCase();
  document.getElementById('tek-p2-char').textContent  = (s.p2?.character || '—').toUpperCase();
  const p2Score = document.getElementById('tek-p2-score');
  p2Score.textContent = s.p2?.score ?? 0;
  p2Score.style.color = p2c;

  document.getElementById('tek-event').textContent  = (s.event || 'TEKKEN WORLD TOUR').toUpperCase();
  document.getElementById('tek-round').textContent  = s.roundNum || 1;
  document.getElementById('tek-format').textContent = (s.matchFormat || 'Bo3').toUpperCase();

  const baseCfg = TEK_PARTICLE_CONFIGS[s.theme] || TEK_PARTICLE_CONFIGS['tek8-default'];
  _pConfig = { ...baseCfg, colors: [p1c, p2c, ...baseCfg.colors.slice(2)] };
}

document.addEventListener('DOMContentLoaded', initParticles);
socket.on('tekMatchUpdate', applyState);
fetch('/api/tek/match').then(r => r.json()).then(applyState).catch(() => {});

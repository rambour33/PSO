const socket = io();

const VAL_THEMES = {
  'valorant-default': { primary: '#FF4655', bg: 'rgba(10,10,18,0.95)' },
  'valorant-dark':    { primary: '#FF4655', bg: 'rgba(4,4,8,0.98)' },
  'valorant-night':   { primary: '#BD3944', bg: 'rgba(6,4,10,0.97)' },
  'sentinels':        { primary: '#E31937', bg: 'rgba(12,4,8,0.95)' },
  'fnatic':           { primary: '#F5821F', bg: 'rgba(12,8,4,0.96)' },
  'navi':             { primary: '#F7CF00', bg: 'rgba(10,10,4,0.96)' },
  'team-liquid':      { primary: '#009AC7', bg: 'rgba(4,10,14,0.96)' },
  'loud':             { primary: '#73E02A', bg: 'rgba(4,12,4,0.96)' },
  'cloud9':           { primary: '#00C8FF', bg: 'rgba(4,10,16,0.96)' },
  'vitality':         { primary: '#F5D000', bg: 'rgba(10,10,4,0.96)' },
  'drx':              { primary: '#00A3FF', bg: 'rgba(4,8,14,0.96)' },
  'paper-rex':        { primary: '#FF6B00', bg: 'rgba(12,8,4,0.96)' },
};

const PARTICLE_CONFIGS = {
  'valorant-default': { colors: ['#FF4655','#FFFCE8','#FF8A94'], shapes: ['diamond','triangle'], count: 40, speed: 0.4 },
  'valorant-dark':    { colors: ['#FF4655','#6B1A22'],           shapes: ['diamond'],           count: 25, speed: 0.3 },
  'valorant-night':   { colors: ['#BD3944','#7B1FA2','#FFFCE8'], shapes: ['circle','diamond'],  count: 30, speed: 0.35 },
  'sentinels':        { colors: ['#E31937','#FFFFFF','#B00020'], shapes: ['triangle'],           count: 38, speed: 0.4 },
  'fnatic':           { colors: ['#F5821F','#FFF0D4'],           shapes: ['diamond'],           count: 32, speed: 0.45 },
  'navi':             { colors: ['#F7CF00','#FFFFFF'],           shapes: ['circle','diamond'],  count: 28, speed: 0.3 },
  'team-liquid':      { colors: ['#009AC7','#E0F4FF'],           shapes: ['triangle','circle'], count: 35, speed: 0.4 },
  'loud':             { colors: ['#73E02A','#C8FF80'],           shapes: ['diamond'],           count: 42, speed: 0.5 },
  'cloud9':           { colors: ['#00C8FF','#E0F8FF'],           shapes: ['circle'],            count: 30, speed: 0.35 },
  'vitality':         { colors: ['#F5D000','#FFFCE8'],           shapes: ['diamond','triangle'],count: 35, speed: 0.4 },
  'drx':              { colors: ['#00A3FF','#C41E3A'],           shapes: ['triangle'],          count: 32, speed: 0.4 },
  'paper-rex':        { colors: ['#FF6B00','#FFB370'],           shapes: ['diamond'],           count: 45, speed: 0.6 },
};

// ── Particle system ────────────────────────────────────────────────────────────

let _particles = [];
let _pConfig   = null;
let _rafId     = null;
let _canvas    = null;
let _ctx       = null;

function initParticles() {
  _canvas = document.getElementById('val-particles');
  if (!_canvas) return;
  _ctx = _canvas.getContext('2d');
  _canvas.width  = window.innerWidth  || 1920;
  _canvas.height = window.innerHeight || 90;
  if (_rafId) cancelAnimationFrame(_rafId);
  _particles = [];
  _rafId = requestAnimationFrame(particleStep);
}

function spawnParticle(cfg) {
  const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];
  const shape = cfg.shapes[Math.floor(Math.random() * cfg.shapes.length)];
  const fromLeft = Math.random() < 0.5;
  const size = 2 + Math.random() * 5;
  return {
    x: fromLeft ? -size : (_canvas.width + size),
    y: Math.random() * _canvas.height,
    vx: fromLeft ? cfg.speed * (0.4 + Math.random() * 0.6) : -cfg.speed * (0.4 + Math.random() * 0.6),
    vy: (Math.random() - 0.5) * 0.25,
    size, color, shape, alpha: 0, life: 0,
    maxLife: 200 + Math.random() * 350,
  };
}

function drawParticle(p) {
  _ctx.save();
  _ctx.globalAlpha = p.alpha * 0.65;
  _ctx.fillStyle = p.color;
  _ctx.translate(p.x, p.y);
  _ctx.rotate(p.life * 0.005);
  _ctx.beginPath();
  if (p.shape === 'diamond') {
    _ctx.moveTo(0, -p.size); _ctx.lineTo(p.size * 0.6, 0);
    _ctx.lineTo(0, p.size);  _ctx.lineTo(-p.size * 0.6, 0);
  } else if (p.shape === 'triangle') {
    _ctx.moveTo(0, -p.size);
    _ctx.lineTo(p.size * 0.866, p.size * 0.5);
    _ctx.lineTo(-p.size * 0.866, p.size * 0.5);
  } else {
    _ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
  }
  _ctx.closePath();
  _ctx.fill();
  _ctx.restore();
}

function particleStep() {
  if (!_ctx) return;
  _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
  if (_pConfig) {
    while (_particles.length < _pConfig.count) _particles.push(spawnParticle(_pConfig));
    _particles = _particles.filter(p => {
      p.life++; p.x += p.vx; p.y += p.vy;
      const fade = 30;
      if (p.life < fade)                  p.alpha = p.life / fade;
      else if (p.life > p.maxLife - fade) p.alpha = (p.maxLife - p.life) / fade;
      else                                p.alpha = 1;
      drawParticle(p);
      return p.life < p.maxLife && p.x > -30 && p.x < _canvas.width + 30;
    });
  }
  _rafId = requestAnimationFrame(particleStep);
}

// ── Theme + state ──────────────────────────────────────────────────────────────

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${alpha})`;
}

function applyState(s) {
  if (!s) return;
  const root = document.getElementById('val-sb');
  root.classList.toggle('hidden', !s.visible);

  const theme = VAL_THEMES[s.theme] || VAL_THEMES['valorant-default'];
  const t1c   = s.team1?.color || theme.primary;
  const t2c   = s.team2?.color || '#3B71E4';
  const bgHex = s.bgColor || '#0A0A12';
  const bgA   = (s.bgOpacity ?? 95) / 100;

  const r = document.documentElement;
  r.style.setProperty('--val-primary', t1c);
  r.style.setProperty('--val-team1',   t1c);
  r.style.setProperty('--val-team2',   t2c);
  r.style.setProperty('--val-bg',      hexToRgba(bgHex, bgA));

  document.getElementById('vsb-t1-score').style.color = t1c;
  document.getElementById('vsb-t2-score').style.color = t2c;

  document.getElementById('vsb-t1-name').textContent  = (s.team1?.name  || 'TEAM ALPHA').toUpperCase();
  document.getElementById('vsb-t1-score').textContent = s.team1?.score ?? 0;
  const l1 = document.getElementById('vsb-t1-logo');
  l1.src = s.team1?.logo || '';

  document.getElementById('vsb-t2-name').textContent  = (s.team2?.name  || 'TEAM BRAVO').toUpperCase();
  document.getElementById('vsb-t2-score').textContent = s.team2?.score ?? 0;
  const l2 = document.getElementById('vsb-t2-logo');
  l2.src = s.team2?.logo || '';

  document.getElementById('vsb-event').textContent  = (s.event     || 'TOURNOI').toUpperCase();
  document.getElementById('vsb-map').textContent    = (s.mapName   || '—').toUpperCase();
  const mapNum = s.currentMap || 1;
  document.getElementById('vsb-format').textContent =
    `${(s.matchFormat || 'Bo3').toUpperCase()} • MAP ${mapNum}`;

  // Met à jour les particules selon le thème + couleurs d'équipe
  const baseCfg = PARTICLE_CONFIGS[s.theme] || PARTICLE_CONFIGS['valorant-default'];
  _pConfig = { ...baseCfg, colors: [t1c, t2c, ...baseCfg.colors.slice(2)] };
}

document.addEventListener('DOMContentLoaded', initParticles);
socket.on('valMatchUpdate', applyState);
fetch('/api/val/match').then(r => r.json()).then(applyState).catch(() => {});

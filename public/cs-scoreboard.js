const socket = io();

const CS_THEMES = {
  'cs2-default':  { primary: '#FFA200', t: '#E8B400', ct: '#5B94EB', bg: 'rgba(6,8,10,0.96)' },
  'cs2-dark':     { primary: '#CC8800', t: '#CC8800', ct: '#3A70CC', bg: 'rgba(4,6,8,0.98)' },
  'cs2-classic':  { primary: '#FFFFFF', t: '#FF8C00', ct: '#0080FF', bg: 'rgba(4,4,6,0.97)' },
  'cs2-neon':     { primary: '#00FF88', t: '#FFAA00', ct: '#00CCFF', bg: 'rgba(2,8,6,0.97)' },
  'cs2-military': { primary: '#6B7B45', t: '#8FA050', ct: '#4A6080', bg: 'rgba(4,6,4,0.97)' },
};

const CS_PARTICLE_CONFIGS = {
  'cs2-default':  { colors: ['#FFA200','#E8B400','#5B94EB'], shapes: ['diamond','circle'],   count: 30, speed: 0.4 },
  'cs2-dark':     { colors: ['#CC8800','#3A70CC'],           shapes: ['diamond'],            count: 22, speed: 0.3 },
  'cs2-classic':  { colors: ['#FF8C00','#0080FF','#FFFFFF'], shapes: ['triangle','diamond'], count: 30, speed: 0.4 },
  'cs2-neon':     { colors: ['#FFAA00','#00CCFF','#00FF88'], shapes: ['diamond','circle'],   count: 40, speed: 0.6 },
  'cs2-military': { colors: ['#8FA050','#4A6080'],           shapes: ['diamond'],            count: 18, speed: 0.25 },
};

let _particles = [], _pConfig = null, _rafId = null, _canvas = null, _ctx = null;

function initParticles() {
  _canvas = document.getElementById('cs-particles');
  if (!_canvas) return;
  _ctx = _canvas.getContext('2d');
  _canvas.width = 1920; _canvas.height = 90;
  if (_rafId) cancelAnimationFrame(_rafId);
  _particles = [];
  _rafId = requestAnimationFrame(particleStep);
}

function spawnParticle(cfg) {
  const fromLeft = Math.random() < 0.5;
  const size = 2 + Math.random() * 4;
  return {
    x: fromLeft ? -size : 1950,
    y: Math.random() * 90,
    vx: fromLeft ? cfg.speed*(0.4+Math.random()*.6) : -cfg.speed*(0.4+Math.random()*.6),
    vy: (Math.random()-.5)*.2, size,
    color: cfg.colors[Math.floor(Math.random()*cfg.colors.length)],
    shape: cfg.shapes[Math.floor(Math.random()*cfg.shapes.length)],
    alpha: 0, life: 0, maxLife: 200 + Math.random()*300,
  };
}

function drawParticle(p) {
  _ctx.save();
  _ctx.globalAlpha = p.alpha * 0.55;
  _ctx.fillStyle = p.color;
  _ctx.translate(p.x, p.y);
  _ctx.rotate(p.life * 0.004);
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
  const root = document.getElementById('cs-sb');
  root.classList.toggle('hidden', !s.visible);

  const theme = CS_THEMES[s.theme] || CS_THEMES['cs2-default'];
  const t1c = s.team1?.color || theme.t;
  const t2c = s.team2?.color || theme.ct;

  const r = document.documentElement;
  r.style.setProperty('--cs-primary', theme.primary);
  r.style.setProperty('--cs-t',  t1c);
  r.style.setProperty('--cs-ct', t2c);
  r.style.setProperty('--cs-bg', s.bgColor ? hexToRgba(s.bgColor, (s.bgOpacity??90)/100) : theme.bg);

  document.getElementById('cs-t1-name').textContent  = (s.team1?.name || 'TEAM ALPHA').toUpperCase();
  document.getElementById('cs-t1-side').textContent  = (s.team1?.side || 'T').toUpperCase();
  document.getElementById('cs-t1-side').className    = `cs-side-badge cs-side-${(s.team1?.side||'t').toLowerCase()}`;
  const s1 = document.getElementById('cs-t1-score');
  s1.textContent = s.team1?.score ?? 0; s1.style.color = t1c;
  const l1 = document.getElementById('cs-t1-logo');
  l1.src = s.team1?.logo || '';

  document.getElementById('cs-t2-name').textContent  = (s.team2?.name || 'TEAM BRAVO').toUpperCase();
  document.getElementById('cs-t2-side').textContent  = (s.team2?.side || 'CT').toUpperCase();
  document.getElementById('cs-t2-side').className    = `cs-side-badge cs-side-${(s.team2?.side||'ct').toLowerCase()}`;
  const s2 = document.getElementById('cs-t2-score');
  s2.textContent = s.team2?.score ?? 0; s2.style.color = t2c;
  const l2 = document.getElementById('cs-t2-logo');
  l2.src = s.team2?.logo || '';

  document.getElementById('cs-event').textContent        = (s.event || 'IEM KATOWICE').toUpperCase();
  document.getElementById('cs-map').textContent          = (s.mapName || 'MIRAGE').toUpperCase();
  document.getElementById('cs-round').textContent        = s.roundNum || 1;
  document.getElementById('cs-total-rounds').textContent = s.totalRounds || 24;
  document.getElementById('cs-format').textContent       = (s.matchFormat || 'Bo3').toUpperCase();

  const baseCfg = CS_PARTICLE_CONFIGS[s.theme] || CS_PARTICLE_CONFIGS['cs2-default'];
  _pConfig = { ...baseCfg, colors: [t1c, t2c, ...baseCfg.colors.slice(2)] };
}

document.addEventListener('DOMContentLoaded', initParticles);
socket.on('cs2MatchUpdate', applyState);
fetch('/api/cs2/match').then(r => r.json()).then(applyState).catch(() => {});

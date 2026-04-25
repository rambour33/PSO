const socket = io();
const root = document.getElementById('cc-root');
const layoutId = new URLSearchParams(location.search).get('layout');
let castersData = { casters: [] };
let currentShapes = [];

/* ── Dynamic value resolver ──────────────────────────────────── */
const DYNAMIC = {
  'c1.name':    s => (s.casters||[])[0]?.name    || '',
  'c1.twitter': s => (s.casters||[])[0]?.twitter || '',
  'c1.twitch':  s => (s.casters||[])[0]?.twitch  || '',
  'c1.youtube': s => (s.casters||[])[0]?.youtube || '',
  'c2.name':    s => (s.casters||[])[1]?.name    || '',
  'c2.twitter': s => (s.casters||[])[1]?.twitter || '',
  'c2.twitch':  s => (s.casters||[])[1]?.twitch  || '',
  'c2.youtube': s => (s.casters||[])[1]?.youtube || '',
};

function hexToRgba(hex, alpha) {
  const h = (hex || '#000000').replace('#', '');
  return `rgba(${parseInt(h.slice(0,2),16)||0},${parseInt(h.slice(2,4),16)||0},${parseInt(h.slice(4,6),16)||0},${alpha??1})`;
}

/* ── Geometry helpers ────────────────────────────────────────── */
const SEMI_RADIUS = {
  top:    '50% 50% 0 0 / 100% 100% 0 0',
  bottom: '0 0 50% 50% / 0 0 100% 100%',
  left:   '50% 0 0 50% / 100% 0 0 100%',
  right:  '0 50% 50% 0 / 0 100% 100% 0',
};

const SVG_DEFS = {
  'tri-up':    '50,3 97,97 3,97',
  'tri-down':  '3,3 97,3 50,97',
  'tri-left':  '97,3 97,97 3,50',
  'tri-right': '3,3 97,50 3,97',
  star:        '50,3 61,37 95,37 68,58 79,92 50,71 21,92 32,58 5,37 39,37',
  diamond:     '50,3 97,50 50,97 3,50',
  hexagon:     '50,3 97,27 97,73 50,97 3,73 3,27',
};

const GEOM_TYPES = ['circle','oval','semi-circle','triangle','star','diamond','hexagon'];

function applyGeomStyles(el, sh) {
  const bg = sh.type === 'rect'
    ? hexToRgba(sh.fill || '#0E0E12', sh.fillOpacity ?? 1)
    : hexToRgba(sh.fill || '#E8B830', sh.fillOpacity ?? 1);
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

  let key = sh.type;
  if (sh.type === 'triangle') key = 'tri-' + (sh.direction || 'up');
  const ptsStr = sh.customPoints
    ? sh.customPoints.map(([x,y]) => `${x},${y}`).join(' ')
    : SVG_DEFS[key];
  if (!ptsStr) return;

  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.cssText = 'width:100%;height:100%;display:block;position:absolute;inset:0;';
  const poly = document.createElementNS(ns, 'polygon');
  poly.setAttribute('points', ptsStr);
  poly.setAttribute('fill', bg);
  if (bw > 0) {
    poly.setAttribute('stroke', bc);
    poly.setAttribute('stroke-width', String(bw * 1.2));
    poly.setAttribute('vector-effect', 'non-scaling-stroke');
  }
  if (sh.shadow) {
    svg.style.filter = `drop-shadow(0 4px ${(sh.shadowBlur||16)*0.3}px ${sh.shadowColor||'rgba(0,0,0,0.6)'})`;
  }
  svg.appendChild(poly);
  el.style.overflow = 'visible';
  el.appendChild(svg);
}

/* ── Shape to DOM element ────────────────────────────────────── */
function shapeToEl(sh) {
  const el = document.createElement('div');
  el.className = 'cc-shape cc-shape-' + sh.type;
  el.dataset.id  = sh.id;
  el.style.left    = sh.x + 'px';
  el.style.top     = sh.y + 'px';
  el.style.width   = sh.w + 'px';
  el.style.height  = sh.h + 'px';
  el.style.opacity = sh.opacity ?? 1;

  if (sh.type === 'rect') {
    if (sh.customPoints) {
      applyGeomStyles(el, sh);
    } else {
      el.style.background   = hexToRgba(sh.fill || '#0E0E12', sh.fillOpacity ?? 1);
      el.style.borderRadius = (sh.radius || 0) + 'px';
      if ((sh.borderWidth || 0) > 0) el.style.border = `${sh.borderWidth}px solid ${sh.border || '#E8B830'}`;
      if (sh.shadow) el.style.boxShadow = `0 4px ${sh.shadowBlur||16}px ${sh.shadowColor||'rgba(0,0,0,0.6)'}`;
    }
  }

  if (GEOM_TYPES.includes(sh.type)) applyGeomStyles(el, sh);

  if (sh.type === 'text') {
    el.style.fontFamily     = `'${sh.fontFamily || 'Russo One'}', sans-serif`;
    el.style.fontSize       = (sh.fontSize || 24) + 'px';
    el.style.fontWeight     = sh.fontWeight || 'normal';
    el.style.color          = sh.textColor || '#FFFFFF';
    el.style.letterSpacing  = (sh.letterSpacing || 0) + 'px';
    el.style.textTransform  = sh.uppercase ? 'uppercase' : 'none';
    el.style.justifyContent = sh.textAlign === 'left' ? 'flex-start' : sh.textAlign === 'right' ? 'flex-end' : 'center';
    el.style.padding        = '0 ' + (sh.paddingX || 0) + 'px';
    el.style.whiteSpace     = 'nowrap';
    if (sh.shadow) el.style.textShadow = `0 2px ${sh.shadowBlur||8}px ${sh.shadowColor||'rgba(0,0,0,0.6)'}`;
    if (sh.background) {
      el.style.background   = hexToRgba(sh.fill || '#0E0E12', sh.fillOpacity ?? 0);
      el.style.borderRadius = (sh.radius || 0) + 'px';
    }

    let val;
    if (sh.template) {
      val = sh.template.replace(/\{([^}]+)\}/g, (_, k) => {
        const fn = DYNAMIC[k.trim()]; return fn ? fn(castersData) : '';
      });
      el.dataset.template = sh.template;
    } else if (sh.dynamic && DYNAMIC[sh.dynamic]) {
      val = DYNAMIC[sh.dynamic](castersData);
      el.dataset.dynamic = sh.dynamic;
    } else {
      val = sh.text || '';
    }
    el.textContent = val;
  }

  if (sh.type === 'image') {
    el.style.borderRadius = (sh.radius || 0) + 'px';
    if (sh.src) {
      const img = document.createElement('img');
      img.src = sh.src;
      img.style.objectFit    = sh.objectFit || 'cover';
      img.style.width        = '100%';
      img.style.height       = '100%';
      img.style.borderRadius = (sh.radius || 0) + 'px';
      el.appendChild(img);
    }
  }

  return el;
}

/* ── Auto-layout ─────────────────────────────────────────────── */
function applyAutoLayout(shapes) {
  shapes.forEach(sh => {
    if (sh.type !== 'text' || !sh.autoWidth) return;
    const el = root.querySelector(`[data-id="${sh.id}"]`); if (!el) return;
    el.style.width = 'fit-content';
    el.style.maxWidth = (sh.maxW || 900) + 'px';
    const measured = Math.min(sh.maxW||900, Math.max(sh.minW||50, el.scrollWidth));
    el.style.width = measured + 'px'; el.style.maxWidth = '';
    const prevW = sh.w;
    if (sh.anchorSide === 'right') { sh.x = (sh.x + prevW) - measured; el.style.left = sh.x + 'px'; }
    sh.w = measured;
  });

  shapes.forEach(sh => {
    if (!sh.linkedTo) return;
    const textSh = shapes.find(s => s.id === sh.linkedTo); if (!textSh) return;
    const pL=sh.linkPadLeft||0, pR=sh.linkPadRight||0, pT=sh.linkPadTop||0, pB=sh.linkPadBottom||0;
    sh.x=textSh.x-pL; sh.y=textSh.y-pT; sh.w=textSh.w+pL+pR; sh.h=textSh.h+pT+pB;
    const el = root.querySelector(`[data-id="${sh.id}"]`);
    if (el) { el.style.left=sh.x+'px'; el.style.top=sh.y+'px'; el.style.width=sh.w+'px'; el.style.height=sh.h+'px'; }
  });

  for (let _p = 0; _p < 6; _p++) {
    let changed = false;
    shapes.forEach(sh => {
      if (!sh.gluedTo) return;
      const target = shapes.find(s => s.id === sh.gluedTo); if (!target) return;
      const gap = sh.glueGap ?? 0;
      let nx=sh.x, ny=sh.y;
      if      (sh.glueSide==='right')  nx = target.x+target.w+gap;
      else if (sh.glueSide==='left')   nx = target.x-sh.w-gap;
      else if (sh.glueSide==='bottom') ny = target.y+target.h+gap;
      else if (sh.glueSide==='top')    ny = target.y-sh.h-gap;
      else if (sh.glueSide==='ax-l')   nx = target.x;
      else if (sh.glueSide==='ax-c')   nx = target.x+(target.w-sh.w)/2;
      else if (sh.glueSide==='ax-r')   nx = target.x+target.w-sh.w;
      else if (sh.glueSide==='ay-t')   ny = target.y;
      else if (sh.glueSide==='ay-c')   ny = target.y+(target.h-sh.h)/2;
      else if (sh.glueSide==='ay-b')   ny = target.y+target.h-sh.h;
      if (nx!==sh.x||ny!==sh.y) { sh.x=Math.round(nx); sh.y=Math.round(ny); changed=true; }
      const el = root.querySelector(`[data-id="${sh.id}"]`);
      if (el) { el.style.left=sh.x+'px'; el.style.top=sh.y+'px'; }
    });
    if (!changed) break;
  }
}

/* ── Render ─────────────────────────────────────────────────── */
function render(shapes) {
  currentShapes = shapes.map(s => ({ ...s }));
  root.innerHTML = '';
  currentShapes.forEach(sh => {
    if (sh.visible === false) return;
    root.appendChild(shapeToEl(sh));
  });
  applyAutoLayout(currentShapes);
}

/* ── Apply live casters data ─────────────────────────────────── */
function applyCastersData(s) {
  castersData = s;
  root.querySelectorAll('[data-dynamic]').forEach(el => {
    const fn = DYNAMIC[el.dataset.dynamic];
    if (fn) el.textContent = fn(s);
  });
  root.querySelectorAll('[data-template]').forEach(el => {
    el.textContent = el.dataset.template.replace(/\{([^}]+)\}/g, (_, k) => {
      const fn = DYNAMIC[k.trim()]; return fn ? fn(s) : '';
    });
  });
  if (currentShapes.length) applyAutoLayout(currentShapes);
}

/* ── Séquences ───────────────────────────────────────────────── */
const _seqPlayer = new PSOSequencePlayer(id => root.querySelector(`[data-id="${id}"]`));

function applySequences(sequences) {
  const playing = (sequences || []).find(s => s.playing);
  if (playing) {
    if (_seqPlayer.currentSeqId !== playing.id) _seqPlayer.play(playing);
  } else {
    if (_seqPlayer.running) _seqPlayer.stop();
  }
}

/* ── Init ────────────────────────────────────────────────────── */
if (layoutId) {
  fetch('/api/caster-layouts')
    .then(r => r.json())
    .then(data => {
      const layout = (data.layouts || []).find(l => l.id === layoutId);
      if (layout) { render(layout.shapes); applySequences(layout.sequences); }
    })
    .catch(() => {});
}

fetch('/api/casters').then(r => r.json()).then(applyCastersData).catch(() => {});

socket.on('castersUpdate', applyCastersData);
socket.on('casterLayoutUpdate', data => {
  if (data.id !== layoutId) return;
  render(data.shapes);
  applySequences(data.sequences);
});

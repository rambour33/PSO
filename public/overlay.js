const socket = io();
let currentState = null;

// ── Logo particules (thèmes custom) ──────────────────────────
const _lp = { parts: [], rafId: null, src: null, count: 3 };
const CUSTOM_THEMES = ['cyberpunk', 'synthwave', 'midnight', 'egypt', 'city', 'eco', 'water', 'fire',
  'pkpsy', 'pktenebres', 'pkelectrik', 'pkfee', 'pkspectre', 'pkdragon', 'pkglace', 'pkcombat',
  'pkpoison', 'pksol', 'pkvol', 'pkinsecte', 'pkroche', 'pkacier', 'pknormal', 'pkplante', 'pkfeu', 'pkeau',
  'rainbow', 'trans', 'pan', 'bi', 'lesbian', 'plage'];

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

// ── Canvas particle engine ────────────────────────────────────
const PS = (() => {
  let canvas, ctx, rafId = null, _type = null;
  const pts = [];

  // ── Factories ──────────────────────────────────────────────
  function mkSnow(W, H) {
    return { t:'snow', x:Math.random()*W, y:Math.random()*H,
      r:1+Math.random()*3.5, vx:(Math.random()-0.5)*0.5,
      vy:0.4+Math.random()*1.4, wb:Math.random()*Math.PI*2,
      wbs:0.012+Math.random()*0.025, op:0.4+Math.random()*0.6 };
  }
  function mkFire(W, H) {
    return { t:'fire', x:W*0.15+Math.random()*W*0.7, y:H+Math.random()*15,
      r:2+Math.random()*7, vx:(Math.random()-0.5)*1.4,
      vy:-(0.7+Math.random()*3), life:0.4+Math.random()*0.6,
      decay:0.007+Math.random()*0.013, hue:5+Math.random()*40 };
  }
  function mkFlame(W, H) {
    const NUM_COLS = 10;
    const col = Math.floor(Math.random() * NUM_COLS);
    const colX = W * (0.04 + col * (0.92 / (NUM_COLS - 1)));
    // Colonne pulsante : hauteur modulée par sin(temps + phase de la colonne)
    const colPhase = col * (Math.PI * 2 / NUM_COLS);
    const power = 0.45 + 0.55 * Math.pow(Math.max(0, Math.sin(Date.now()*0.0008 + colPhase)), 1.4);
    const baseH = 14 + Math.random() * 52;
    const h = baseH * (0.28 + power * 0.72);
    const w = h * (0.20 + Math.random() * 0.16);
    return { t:'flame', col, colX,
      x: colX + (Math.random()-0.5)*w*1.6, y: H + 4 + Math.random()*10,
      h, w, vy: -(0.7 + Math.random()*2.6),
      wb: Math.random()*Math.PI*2, wbs: 0.022+Math.random()*0.048,
      wba: 1.5 + Math.random()*4.5,
      life: 0.65+Math.random()*0.35, decay: 0.005+Math.random()*0.011,
      hue: 3+Math.random()*28 };
  }
  function mkRain(W, H) {
    return { t:'rain', x:Math.random()*(W+120)-60, y:-30-Math.random()*H,
      len:10+Math.random()*18, vx:-2, vy:15+Math.random()*9,
      op:0.12+Math.random()*0.3 };
  }
  function mkSand(W, H) {
    return { t:'sand', x:Math.random()*W, y:Math.random()*H,
      r:0.5+Math.random()*1.8, vx:0.2+Math.random()*1.0,
      vy:(Math.random()-0.5)*0.4, op:0.2+Math.random()*0.5,
      hue:28+Math.random()*22 };
  }
  function mkLeaf(W, H) {
    return { t:'leaf', x:Math.random()*W, y:-15-Math.random()*50,
      w:7+Math.random()*9, h:3+Math.random()*4,
      vx:(Math.random()-0.35)*1.4, vy:0.4+Math.random()*1.2,
      angle:Math.random()*Math.PI*2, spin:(Math.random()-0.5)*0.07,
      op:0.5+Math.random()*0.5, hue:85+Math.random()*55 };
  }
  function mkBubble(W, H) {
    return { t:'bubble', x:Math.random()*W, y:H+Math.random()*25,
      r:2+Math.random()*10, vx:(Math.random()-0.5)*0.6,
      vy:-(0.25+Math.random()*0.9), life:1,
      decay:0.002+Math.random()*0.007, op:0.15+Math.random()*0.45 };
  }
  function mkSparkle(W, H) {
    return { t:'sparkle', x:Math.random()*W, y:Math.random()*H,
      r:0.5+Math.random()*2.5, phase:Math.random()*Math.PI*2,
      speed:0.018+Math.random()*0.04, hue:200+Math.random()*160 };
  }
  function mkData(W, H) {
    return { t:'data', x:Math.random()*W, y:-25-Math.random()*H,
      w:1+Math.random()*3, h:7+Math.random()*16,
      vy:1.2+Math.random()*3.5, op:0.25+Math.random()*0.55,
      pink:Math.random()>0.5 };
  }
  function mkBolt(W, H) {
    return { t:'bolt', x:Math.random()*W, y:Math.random()*H,
      life:1, decay:0.025+Math.random()*0.07,
      len:10+Math.random()*44, segs:3+Math.floor(Math.random()*5),
      angle:Math.floor(Math.random()*8)*Math.PI/4+(Math.random()-0.5)*0.35,
      jitter:2+Math.random()*6, seed:Math.random()*9999,
      thick:0.5+Math.random()*1.8, branch:Math.random()>0.45 };
  }
  function mkGhost(W, H) {
    return { t:'ghost',
      x: Math.random()*W, y: Math.random()*H,
      w: 10 + Math.random()*22,
      vx: (Math.random()-0.5)*0.35,
      vy: -(0.10 + Math.random()*0.25),
      wb: Math.random()*Math.PI*2, wbs: 0.010+Math.random()*0.020,
      wba: 1.5+Math.random()*3.5,
      phase: Math.random()*Math.PI*2,
      cycleSpd: 0.006+Math.random()*0.010,
      hue: 258+Math.random()*35,
      maxOp: 0.32+Math.random()*0.44,
      eyes: Math.random()>0.20,
      mouth: Math.random()>0.40 };
  }
  function mkShell(W, H) {
    // kind: 0=nautilus, 1=coquille saint-jacques, 2=escargot, 3=écume
    const kind = Math.floor(Math.random() * 4);
    const hue = kind === 3 ? 196
              : kind === 1 && Math.random() > 0.4 ? 345 + Math.random()*22
              : 18 + Math.random()*26;
    return { t:'shell', kind,
      x:Math.random()*W, y:Math.random()*H,
      r: kind===3 ? 1.8+Math.random()*4.5 : 4+Math.random()*9,
      rot:Math.random()*Math.PI*2, spin:(Math.random()-0.5)*0.005,
      vx:(Math.random()-0.5)*0.28,
      vy: kind===3 ? -(0.25+Math.random()*0.55) : (Math.random()-0.5)*0.18,
      op: kind===3 ? 0.28+Math.random()*0.38 : 0.48+Math.random()*0.52,
      hue, phase:Math.random()*Math.PI*2, speed:0.02+Math.random()*0.03 };
  }
  function mkPride(W, H) {
    return { t:'pride', x:Math.random()*W, y:Math.random()*H,
      r:0.5+Math.random()*2.8, phase:Math.random()*Math.PI*2,
      speed:0.014+Math.random()*0.034, hue:Math.random()*360 };
  }
  function mkFlake(W, H) {
    return { t:'flake', x:Math.random()*W, y:Math.random()*H,
      r:4+Math.random()*9, vx:(Math.random()-0.5)*0.4,
      vy:0.25+Math.random()*0.85, wb:Math.random()*Math.PI*2,
      wbs:0.008+Math.random()*0.018, rot:Math.random()*Math.PI/3,
      spin:(Math.random()-0.5)*0.012, op:0.45+Math.random()*0.55 };
  }
  const FAC = { snow:mkSnow, fire:mkFire, rain:mkRain, sand:mkSand,
                leaf:mkLeaf, bubble:mkBubble, sparkle:mkSparkle, data:mkData,
                flake:mkFlake, bolt:mkBolt, pride:mkPride, shell:mkShell, flame:mkFlame,
                ghost:mkGhost };

  // ── Update ─────────────────────────────────────────────────
  function upd(p, W, H) {
    const t = p.t;
    if (t==='snow') {
      p.wb += p.wbs; p.x += p.vx + Math.sin(p.wb)*0.5; p.y += p.vy;
      if (p.y>H+10){p.y=-10;p.x=Math.random()*W;}
      if (p.x>W+10) p.x=-10; if (p.x<-10) p.x=W+10;
    } else if (t==='fire') {
      p.x += p.vx+(Math.random()-0.5)*0.5; p.y += p.vy;
      p.life -= p.decay; p.r = Math.max(0,p.r*0.997);
      if (p.life<=0||p.r<0.2) Object.assign(p, mkFire(W,H));
    } else if (t==='rain') {
      p.x += p.vx; p.y += p.vy;
      if (p.y>H+20){p.y=-20;p.x=Math.random()*(W+120)-60;}
    } else if (t==='sand') {
      p.x += p.vx; p.y += p.vy;
      if (p.x>W+10){p.x=-10;p.y=Math.random()*H;}
    } else if (t==='leaf') {
      p.x += p.vx+Math.sin(p.angle*0.5)*0.5; p.y += p.vy; p.angle += p.spin;
      if (p.y>H+20){p.y=-15;p.x=Math.random()*W;}
    } else if (t==='bubble') {
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life<=0||p.y<-20) Object.assign(p, mkBubble(W,H));
    } else if (t==='sparkle') {
      p.phase += p.speed;
    } else if (t==='data') {
      p.y += p.vy;
      if (p.y>H+20){p.y=-25-Math.random()*50;p.x=Math.random()*W;}
    } else if (t==='flake') {
      p.wb += p.wbs; p.x += p.vx+Math.sin(p.wb)*0.45; p.y += p.vy; p.rot += p.spin;
      if (p.y>H+20){p.y=-15;p.x=Math.random()*W;}
      if (p.x>W+20) p.x=-20; if (p.x<-20) p.x=W+20;
    } else if (t==='bolt') {
      p.life -= p.decay;
      if (p.life<=0) Object.assign(p, mkBolt(W,H));
    } else if (t==='pride') {
      p.phase += p.speed;
      p.hue = (p.hue + 0.35) % 360;
    } else if (t==='flame') {
      p.wb += p.wbs;
      // sway autour de la colonne
      p.x = p.colX + Math.sin(p.wb) * p.wba + (p.x - p.colX) * 0.92;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0 || p.y < -(p.h * 2)) Object.assign(p, mkFlame(W, H));
    } else if (t==='ghost') {
      p.wb += p.wbs; p.phase += p.cycleSpd;
      p.x += p.vx + Math.sin(p.wb)*p.wba;
      p.y += p.vy;
      if (p.y < -(p.w*2)) { Object.assign(p, mkGhost(W,H)); p.y = H+p.w; }
      if (p.x >  W+p.w) p.x = -p.w;
      if (p.x < -p.w)   p.x =  W+p.w;
    } else if (t==='shell') {
      p.x += p.vx; p.y += p.vy; p.rot += p.spin;
      if (p.kind === 3) { p.phase += p.speed; }
      if (p.y < -16) { p.y = H+16; p.x = Math.random()*W; }
      if (p.y > H+16) { p.y = -16; p.x = Math.random()*W; }
      if (p.x >  W+16) p.x = -16;
      if (p.x < -16)   p.x =  W+16;
    }
  }

  // ── Draw ───────────────────────────────────────────────────
  function drw(p) {
    const t = p.t;
    if (t==='snow') {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(200,230,255,${p.op})`; ctx.fill();
      if (p.r>2) {
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*2.4,0,Math.PI*2);
        ctx.fillStyle=`rgba(180,220,255,${p.op*0.10})`; ctx.fill();
      }
    } else if (t==='fire') {
      const a = Math.max(0,p.life);
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},100%,${40+a*32}%,${a*0.92})`; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r*2.8,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue+18},100%,58%,${a*0.10})`; ctx.fill();
    } else if (t==='rain') {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx*(p.len/p.vy), p.y+p.len);
      ctx.strokeStyle=`rgba(0,212,255,${p.op})`; ctx.lineWidth=1; ctx.stroke();
    } else if (t==='sand') {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},58%,68%,${p.op})`; ctx.fill();
    } else if (t==='leaf') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle);
      ctx.beginPath(); ctx.ellipse(0,0,p.w,p.h,0,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},62%,35%,${p.op})`; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-p.w,0); ctx.lineTo(p.w,0);
      ctx.strokeStyle=`hsla(${p.hue},65%,58%,${p.op*0.6})`; ctx.lineWidth=0.6; ctx.stroke();
      ctx.restore();
    } else if (t==='bubble') {
      const a = Math.max(0,p.life)*p.op;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.strokeStyle=`rgba(100,210,255,${a})`; ctx.lineWidth=1.2; ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x-p.r*0.32,p.y-p.r*0.32,p.r*0.28,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,255,255,${a*0.45})`; ctx.fill();
    } else if (t==='sparkle') {
      const a = (Math.sin(p.phase)+1)/2;
      const r = p.r*(0.4+a*0.6);
      ctx.save(); ctx.globalAlpha=a;
      ctx.strokeStyle=`hsl(${p.hue},100%,82%)`; ctx.lineWidth=r*0.7;
      ctx.beginPath();
      ctx.moveTo(p.x-r*3,p.y); ctx.lineTo(p.x+r*3,p.y);
      ctx.moveTo(p.x,p.y-r*3); ctx.lineTo(p.x,p.y+r*3);
      ctx.moveTo(p.x-r*1.8,p.y-r*1.8); ctx.lineTo(p.x+r*1.8,p.y+r*1.8);
      ctx.moveTo(p.x+r*1.8,p.y-r*1.8); ctx.lineTo(p.x-r*1.8,p.y+r*1.8);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2);
      ctx.fillStyle=`hsl(${p.hue},100%,92%)`; ctx.fill();
      ctx.restore();
    } else if (t==='data') {
      ctx.globalAlpha = p.op;
      ctx.fillStyle = p.pink ? '#FF2D78' : '#00F5FF';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      // faint glow row above
      ctx.globalAlpha = p.op * 0.25;
      ctx.fillRect(p.x-1, p.y-2, p.w+2, 3);
      ctx.globalAlpha = 1;
    } else if (t==='flame') {
      const al = Math.max(0, p.life);
      const fh = p.h * (0.35 + al * 0.65);  // hauteur décroit avec life
      const fw = p.w * (0.30 + al * 0.70);
      if (fh < 1) { ctx.globalAlpha = 1; return; }
      ctx.save();
      ctx.translate(p.x, p.y);

      // Dégradé de chaleur : rouge profond (base) → orange → jaune → blanc (pointe)
      const grd = ctx.createLinearGradient(0, 0, 0, -fh);
      grd.addColorStop(0.00, `hsla(${p.hue},    100%, 40%, ${al*0.97})`);
      grd.addColorStop(0.20, `hsla(${p.hue+10}, 100%, 50%, ${al*0.92})`);
      grd.addColorStop(0.50, `hsla(${p.hue+25}, 100%, 62%, ${al*0.72})`);
      grd.addColorStop(0.78, `hsla(${p.hue+48}, 100%, 80%, ${al*0.38})`);
      grd.addColorStop(1.00, `hsla(55, 100%, 96%, 0)`);

      // Forme flamme (bezier téardrop) — corps extérieur
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-fw,       -fh*0.18, -fw*0.88, -fh*0.62, 0, -fh);
      ctx.bezierCurveTo( fw*0.88,  -fh*0.62,  fw,      -fh*0.18, 0,  0);
      ctx.fillStyle = grd;
      ctx.fill();

      // Noyau chaud intérieur (plus lumineux)
      const cw = fw*0.48, ch = fh*0.68;
      const crd = ctx.createLinearGradient(0, -fh*0.05, 0, -fh*0.68);
      crd.addColorStop(0.0, `hsla(${p.hue+8},  100%, 65%, ${al*0.72})`);
      crd.addColorStop(0.5, `hsla(48, 100%, 88%, ${al*0.45})`);
      crd.addColorStop(1.0, `hsla(55, 100%, 96%, 0)`);
      ctx.beginPath();
      ctx.moveTo(0, -fh*0.04);
      ctx.bezierCurveTo(-cw, -fh*0.22, -cw*0.75, -fh*0.52, 0, -fh*0.68);
      ctx.bezierCurveTo( cw*0.75,-fh*0.52,  cw,  -fh*0.22, 0, -fh*0.04);
      ctx.fillStyle = crd;
      ctx.fill();

      // Halo de braise à la base
      const hrd = ctx.createRadialGradient(0, 0, 0, 0, 0, fw*1.6);
      hrd.addColorStop(0,   `hsla(${p.hue+5}, 100%, 55%, ${al*0.40})`);
      hrd.addColorStop(0.5, `hsla(${p.hue+18},100%, 45%, ${al*0.12})`);
      hrd.addColorStop(1,   `hsla(${p.hue},   100%, 40%, 0)`);
      ctx.beginPath(); ctx.arc(0, 0, fw*1.6, 0, Math.PI*2);
      ctx.fillStyle = hrd; ctx.fill();

      ctx.restore();
    } else if (t==='ghost') {
      // Apparition/disparition : sin² → visible seulement quand sin > 0 (la moitié du cycle)
      const raw  = Math.sin(p.phase);
      const fade = raw > 0 ? Math.pow(raw, 1.6) : 0;
      const al   = fade * p.maxOp;
      if (al < 0.012) { /* invisible */ } else {
        const r     = p.w / 2;
        const bodyH = p.w * 0.72;
        const scW   = p.w / 3;
        ctx.save();
        ctx.translate(p.x, p.y);

        // ── Aura extérieure ──────────────────────────────────────
        const aura = ctx.createRadialGradient(0, bodyH*0.3, 0, 0, bodyH*0.3, r*2.4);
        aura.addColorStop(0,   `hsla(${p.hue},80%,70%,${al*0.35})`);
        aura.addColorStop(0.5, `hsla(${p.hue},75%,60%,${al*0.12})`);
        aura.addColorStop(1,   `hsla(${p.hue},70%,50%,0)`);
        ctx.beginPath(); ctx.arc(0, bodyH*0.3, r*2.4, 0, Math.PI*2);
        ctx.fillStyle = aura; ctx.fill();

        // ── Forme fantôme ────────────────────────────────────────
        ctx.beginPath();
        ctx.moveTo(-r, bodyH);
        ctx.lineTo(-r, 0);
        ctx.arc(0, 0, r, Math.PI, 0);          // tête arrondie
        ctx.lineTo(r, bodyH);
        for (let i = 0; i < 3; i++) {          // 3 découpes en bas
          const fx = r - i*scW, tx = r-(i+1)*scW;
          ctx.quadraticCurveTo((fx+tx)/2, bodyH+scW*0.6, tx, bodyH);
        }
        ctx.closePath();

        // Dégradé vertical : blanc/mauve en haut → mauve foncé en bas
        const grd = ctx.createLinearGradient(0, -r, 0, bodyH);
        grd.addColorStop(0,   `hsla(${p.hue},60%,95%,${al*0.82})`);
        grd.addColorStop(0.5, `hsla(${p.hue},65%,82%,${al*0.70})`);
        grd.addColorStop(1,   `hsla(${p.hue},70%,65%,${al*0.50})`);
        ctx.fillStyle = grd; ctx.fill();

        // Contour luisant
        ctx.strokeStyle = `hsla(${p.hue},85%,88%,${al*0.55})`;
        ctx.lineWidth   = p.w*0.055; ctx.lineJoin='round'; ctx.stroke();

        // ── Yeux ────────────────────────────────────────────────
        if (p.eyes) {
          const eyeY = -r*0.18, eyeX = r*0.28, eyeR = r*0.14;
          [-eyeX, eyeX].forEach(ex => {
            // Lueur de l'œil
            ctx.beginPath(); ctx.arc(ex, eyeY, eyeR*2.2, 0, Math.PI*2);
            ctx.fillStyle = `hsla(${p.hue+30},100%,70%,${al*0.28})`; ctx.fill();
            // Œil sombre
            ctx.beginPath(); ctx.arc(ex, eyeY, eyeR, 0, Math.PI*2);
            ctx.fillStyle = `hsla(${p.hue+15},90%,28%,${al*0.85})`; ctx.fill();
            // Reflet blanc
            ctx.beginPath(); ctx.arc(ex-eyeR*0.3, eyeY-eyeR*0.3, eyeR*0.32, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255,255,255,${al*0.7})`; ctx.fill();
          });
        }

        // ── Bouche ──────────────────────────────────────────────
        if (p.mouth) {
          ctx.beginPath();
          ctx.arc(0, r*0.28, r*0.16, 0, Math.PI);
          ctx.strokeStyle = `hsla(${p.hue+15},80%,35%,${al*0.70})`;
          ctx.lineWidth = p.w*0.06; ctx.lineCap='round'; ctx.stroke();
        }

        ctx.restore();
      }
    } else if (t==='shell') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const r = p.r;
      const sf = `hsla(${p.hue},38%,88%,${p.op*0.38})`;
      const sc = `hsla(${p.hue},44%,74%,${p.op})`;
      const sd = `hsla(${p.hue},48%,58%,${p.op*0.65})`;
      ctx.globalAlpha = p.op;
      ctx.lineCap = 'round';
      if (p.kind === 3) {
        // Écume de mer — bulle qui pulse
        const fa = p.op * ((Math.sin(p.phase)+1)*0.38+0.24);
        ctx.globalAlpha = fa;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(215,245,255,${fa})`; ctx.lineWidth = 0.9; ctx.stroke();
        ctx.beginPath(); ctx.arc(-r*0.3,-r*0.3, r*0.28, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${fa*0.55})`; ctx.fill();
      } else if (p.kind === 0) {
        // Nautilus — spirale logarithmique dans un cercle
        ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
        ctx.fillStyle = sf; ctx.fill();
        ctx.strokeStyle = sc; ctx.lineWidth = r*0.11; ctx.stroke();
        ctx.beginPath();
        for (let a=0; a<=Math.PI*4.2; a+=0.09) {
          const rad = r*0.062*Math.exp(0.188*a);
          if (rad > r*0.93) break;
          if (a<0.01) ctx.moveTo(rad,0); else ctx.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);
        }
        ctx.strokeStyle = sd; ctx.lineWidth = r*0.10; ctx.stroke();
        // Centre
        ctx.beginPath(); ctx.arc(0,0,r*0.09,0,Math.PI*2);
        ctx.fillStyle = sd; ctx.fill();
      } else if (p.kind === 1) {
        // Coquille Saint-Jacques — demi-cercle + nervures
        ctx.beginPath(); ctx.arc(0,0,r,-Math.PI,0); ctx.closePath();
        ctx.fillStyle = sf; ctx.fill();
        ctx.strokeStyle = sc; ctx.lineWidth = r*0.12; ctx.stroke();
        for (let i=0; i<=7; i++) {
          const a = -Math.PI + (Math.PI/7)*i;
          ctx.beginPath(); ctx.moveTo(0,0);
          ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
          ctx.strokeStyle = sd; ctx.lineWidth = r*0.07; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(0,0,r*0.13,0,Math.PI*2);
        ctx.fillStyle = sd; ctx.fill();
      } else {
        // Escargot de mer — cercle + anneaux spiralés décalés
        ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
        ctx.fillStyle = sf; ctx.fill();
        ctx.strokeStyle = sc; ctx.lineWidth = r*0.11; ctx.stroke();
        const offsets = [[0,0,1],[r*0.10,r*0.06,0.74],[r*0.18,r*0.10,0.50]];
        offsets.forEach(([ox,oy,scale],i) => {
          const ri = r*scale*0.88;
          if (ri < 1) return;
          ctx.beginPath();
          ctx.arc(ox,oy,ri,0,Math.PI*(1.6-i*0.15));
          ctx.strokeStyle = `hsla(${p.hue},46%,60%,${p.op*(0.55-i*0.08)})`;
          ctx.lineWidth = r*0.09; ctx.stroke();
        });
        ctx.beginPath(); ctx.arc(r*0.25,r*0.14,r*0.12,0,Math.PI*2);
        ctx.fillStyle = sd; ctx.fill();
      }
      ctx.restore();
    } else if (t==='pride') {
      const a = (Math.sin(p.phase)+1)/2;
      const r = p.r*(0.4+a*0.6);
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = `hsl(${p.hue},100%,72%)`; ctx.lineWidth = r*0.7;
      ctx.beginPath();
      ctx.moveTo(p.x-r*3,p.y); ctx.lineTo(p.x+r*3,p.y);
      ctx.moveTo(p.x,p.y-r*3); ctx.lineTo(p.x,p.y+r*3);
      ctx.moveTo(p.x-r*1.8,p.y-r*1.8); ctx.lineTo(p.x+r*1.8,p.y+r*1.8);
      ctx.moveTo(p.x+r*1.8,p.y-r*1.8); ctx.lineTo(p.x-r*1.8,p.y+r*1.8);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2);
      ctx.fillStyle = `hsl(${p.hue},100%,90%)`; ctx.fill();
      ctx.restore();
    } else if (t==='bolt') {
      const al = Math.max(0, p.life);
      const ca = Math.cos(p.angle), sa = Math.sin(p.angle);
      const nx = -sa, ny = ca;          // perpendicular (for jitter)
      const sl = p.len / p.segs;
      // Build jagged points (shape is fixed per bolt via seed)
      const bpts = [[p.x, p.y]];
      for (let i = 1; i <= p.segs; i++) {
        const j = Math.sin(p.seed + i*5.31) * p.jitter * (1 - i/p.segs*0.25);
        bpts.push([p.x + ca*sl*i + nx*j, p.y + sa*sl*i + ny*j]);
      }
      const drawPath = (pts) => {
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
      };
      ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
      // outer glow
      ctx.globalAlpha = al * 0.10; ctx.lineWidth = p.thick*9;
      ctx.strokeStyle = '#F7D02C'; drawPath(bpts);
      // mid glow
      ctx.globalAlpha = al * 0.28; ctx.lineWidth = p.thick*3.5;
      ctx.strokeStyle = '#FFF59D'; drawPath(bpts);
      // core
      ctx.globalAlpha = al; ctx.lineWidth = p.thick;
      ctx.strokeStyle = `rgba(255,255,230,${al})`; drawPath(bpts);
      // branch
      if (p.branch && bpts.length >= 3) {
        const bi = Math.floor(bpts.length * 0.45);
        const [bx, by] = bpts[bi];
        const bDir = Math.cos(p.seed*3) >= 0 ? 1 : -1;
        const bAngle = p.angle + bDir * (Math.PI/6 + Math.abs(Math.sin(p.seed))*Math.PI/6);
        const bca = Math.cos(bAngle), bsa = Math.sin(bAngle);
        const bnx = -bsa, bny = bca;
        const bsl = p.len*0.38 / 3;
        const brPts = [[bx, by]];
        for (let i=1;i<=3;i++) {
          const j = Math.sin(p.seed*1.7+i*4.2) * p.jitter*0.5;
          brPts.push([bx+bca*bsl*i+bnx*j, by+bsa*bsl*i+bny*j]);
        }
        ctx.globalAlpha = al*0.22; ctx.lineWidth = p.thick*3;
        ctx.strokeStyle = '#FFF59D'; drawPath(brPts);
        ctx.globalAlpha = al*0.65; ctx.lineWidth = p.thick*0.6;
        ctx.strokeStyle = `rgba(255,255,200,${al})`; drawPath(brPts);
      }
      ctx.restore();
    } else if (t==='flake') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.op;
      ctx.strokeStyle = `rgba(210,245,255,${p.op})`;
      ctx.lineWidth = Math.max(0.5, p.r * 0.11);
      ctx.lineCap = 'round';
      const r = p.r;
      const b1 = r * 0.42, b2 = r * 0.72; // branch positions along arm
      const bl = r * 0.32;                  // branch half-length
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        const ca = Math.cos(a), sa = Math.sin(a);
        // main arm
        ctx.moveTo(0, 0);
        ctx.lineTo(ca * r, sa * r);
        // inner branches
        const x1 = ca * b1, y1 = sa * b1;
        const a1a = a + Math.PI / 3, a1b = a - Math.PI / 3;
        ctx.moveTo(x1, y1); ctx.lineTo(x1 + Math.cos(a1a)*bl*0.65, y1 + Math.sin(a1a)*bl*0.65);
        ctx.moveTo(x1, y1); ctx.lineTo(x1 + Math.cos(a1b)*bl*0.65, y1 + Math.sin(a1b)*bl*0.65);
        // outer branches
        const x2 = ca * b2, y2 = sa * b2;
        ctx.moveTo(x2, y2); ctx.lineTo(x2 + Math.cos(a1a)*bl, y2 + Math.sin(a1a)*bl);
        ctx.moveTo(x2, y2); ctx.lineTo(x2 + Math.cos(a1b)*bl, y2 + Math.sin(a1b)*bl);
      }
      ctx.stroke();
      // centre dot
      ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230,250,255,${p.op})`; ctx.fill();
      // soft glow halo
      if (r > 5) {
        ctx.globalAlpha = p.op * 0.12;
        ctx.beginPath(); ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(186,240,255,1)'; ctx.fill();
      }
      ctx.restore();
    }
  }

  // ── Loop ───────────────────────────────────────────────────
  function tick() {
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);
    for (const p of pts) { upd(p,W,H); drw(p); }
    rafId = requestAnimationFrame(tick);
  }

  function resize() {
    const sb = document.getElementById('scoreboard');
    canvas.width  = sb.offsetWidth  || 600;
    canvas.height = sb.offsetHeight || 100;
  }

  function start(type, count) {
    stop(); _type = type;
    if (!type || !FAC[type]) return;
    resize(); pts.length = 0;
    const W=canvas.width, H=canvas.height;
    for (let i=0; i<count; i++) pts.push(FAC[type](W,H));
    tick();
  }

  function stop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId=null; }
    if (ctx) ctx.clearRect(0,0,canvas.width,canvas.height);
    pts.length=0; _type=null;
  }

  function init() {
    canvas = document.getElementById('particle-canvas');
    ctx    = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }

  return { init, start, stop, resize, get type() { return _type; } };
})();

const THEME_PARTICLES = {
  cyberpunk:   { type:'data',    count:55 },
  synthwave:   { type:'sparkle', count:65 },
  midnight:    { type:'snow',    count:75 },
  egypt:       { type:'sand',    count:95 },
  city:        { type:'rain',    count:75 },
  eco:         { type:'leaf',    count:38 },
  water:       { type:'bubble',  count:55 },
  fire:        { type:'flame',   count:130 },
  pkpsy:       { type:'sparkle', count:60 },
  pktenebres:  { type:'data',    count:45 },
  pkelectrik:  { type:'bolt',    count:70 },
  pkfee:       { type:'sparkle', count:55 },
  pkspectre:   { type:'ghost',   count:22 },
  pkdragon:    { type:'fire',    count:65 },
  pkglace:     { type:'flake',   count:50 },
  pkcombat:    { type:'fire',    count:70 },
  pkpoison:    { type:'bubble',  count:50 },
  pksol:       { type:'sand',    count:90 },
  pkvol:       { type:'sparkle', count:55 },
  pkinsecte:   { type:'leaf',    count:35 },
  pkroche:     { type:'sand',    count:80 },
  pkacier:     { type:'sparkle', count:50 },
  pknormal:    { type:'sparkle', count:40 },
  pkplante:    { type:'leaf',    count:40 },
  pkfeu:       { type:'fire',    count:75 },
  pkeau:       { type:'bubble',  count:55 },
  rainbow:     { type:'pride',   count:80 },
  trans:       { type:'sparkle', count:65 },
  pan:         { type:'sparkle', count:65 },
  bi:          { type:'sparkle', count:65 },
  lesbian:     { type:'sparkle', count:65 },
  plage:       { type:'shell',   count:38 },
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
  sb.classList.toggle('hidden', !s.visible);
  sb.classList.toggle('swapped', !!s.swapped);
  sb.classList.toggle('style-slim', s.overlayStyle === 'slim');

  // Theme class
  ['default', 'cyberpunk', 'synthwave', 'midnight', 'egypt', 'city', 'eco', 'water', 'fire',
   'pkpsy', 'pktenebres', 'pkelectrik', 'pkfee', 'pkspectre', 'pkdragon', 'pkglace', 'pkcombat',
   'pkpoison', 'pksol', 'pkvol', 'pkinsecte', 'pkroche', 'pkacier', 'pknormal', 'pkplante', 'pkfeu', 'pkeau',
   'rainbow', 'trans', 'pan', 'bi', 'lesbian', 'plage'].forEach(t => {
    sb.classList.toggle('theme-' + t, (s.overlayTheme || 'default') === t);
  });

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
  const tpConf = THEME_PARTICLES[s.overlayTheme || 'default'];
  if (tpConf) {
    if (tpConf.type !== PS.type) PS.start(tpConf.type, tpConf.count);
  } else if (PS.type) {
    PS.stop();
  }

  // Background color + opacity
  const hex = (s.sbBgColor || '#0E0E12').replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = (s.sbBgOpacity ?? 100) / 100;
  sb.style.setProperty('--sb-bg', `rgba(${r},${g},${b},${a})`);
  sb.style.setProperty('--event-text-size', `${s.eventTextSize ?? 12}px`);
  sb.style.setProperty('--event-text-color', s.eventTextColor || '#5A5A7A');
  sb.style.setProperty('--tag-color', s.tagColor || '#E8B830');
  sb.style.setProperty('--name-color', s.nameColor || '#F0EEF8');
  sb.style.setProperty('--pronouns-color', s.pronounsColor || '#5A5A7A');

  // Colors — full layout
  document.getElementById('player1-block').style.setProperty('--p1-color', s.player1.color);
  document.getElementById('player2-block').style.setProperty('--p2-color', s.player2.color);
  // Colors — slim layout
  document.getElementById('player1-block-slim').style.setProperty('--p1-color', s.player1.color);
  document.getElementById('player2-block-slim').style.setProperty('--p2-color', s.player2.color);

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
  renderDots('p1-dots', s.player1.score, max, s.player1.color);
  renderDots('p2-dots', s.player2.score, max, s.player2.color);

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

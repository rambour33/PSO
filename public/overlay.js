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
  function mkCoin(W,H){return{t:'coin',x:Math.random()*W,y:H+Math.random()*20,r:3+Math.random()*6,rot:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.06,vy:-(0.25+Math.random()*.6),vx:(Math.random()-.5)*.4,op:0.5+Math.random()*.5,hue:40+Math.random()*18};}
  function mkNote(W,H){return{t:'note',x:Math.random()*W,y:H+Math.random()*20,r:3+Math.random()*5,vy:-(0.35+Math.random()*.7),vx:(Math.random()-.5)*.4,op:0.6+Math.random()*.4,rot:(Math.random()-.5)*.3,hue:280+Math.random()*80};}
  function mkPetal(W,H){return{t:'petal',x:Math.random()*W,y:-15-Math.random()*40,w:4+Math.random()*8,h:2+Math.random()*3.5,angle:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.03,vy:0.35+Math.random()*.9,vx:(Math.random()-.5)*.6,op:0.5+Math.random()*.5,hue:300+Math.random()*80};}
  function mkRing(W,H){return{t:'ring',x:Math.random()*W,y:Math.random()*H,r:Math.random()*10,maxR:12+Math.random()*22,speed:0.5+Math.random()*1.0,op:0.7+Math.random()*.3,hue:200+Math.random()*40};}
  function mkSonicRing(W,H){return{t:'sonicring',x:Math.random()*W,y:H+Math.random()*20,r:9+Math.random()*10,tilt:0.22+Math.random()*0.32,rot:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.04,vy:-(0.35+Math.random()*.7),vx:(Math.random()-.5)*.38,shimmer:Math.random()*Math.PI*2,shimmerSpd:0.055+Math.random()*.07,op:0.65+Math.random()*.35,life:1,decay:0.0025+Math.random()*.004};}
  function mkFeather(W,H){return{t:'feather',x:Math.random()*W,y:-20-Math.random()*40,len:9+Math.random()*18,angle:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.012,vy:0.2+Math.random()*.55,vx:(Math.random()-.5)*.35,op:0.4+Math.random()*.55,hue:40+Math.random()*25};}
  function mkPixel(W,H){return{t:'pixel',x:Math.random()*W,y:Math.random()*H,s:3+Math.random()*7,vy:(Math.random()-.5)*.7,vx:Math.random()*.9-.1,op:0.5+Math.random()*.5,hue:180+Math.random()*180,life:1,decay:0.004+Math.random()*.009};}
  function mkStar(W,H){return{t:'star',x:Math.random()*W,y:Math.random()*H,r:3+Math.random()*8,rot:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.018,vy:-(0.1+Math.random()*.35),vx:(Math.random()-.5)*.22,op:0.4+Math.random()*.55,hue:45+Math.random()*30,life:1,decay:0.003+Math.random()*.006};}
  function mkAura(W,H){return{t:'aura',x:Math.random()*W,y:Math.random()*H,r:4+Math.random()*10,phase:Math.random()*Math.PI*2,speed:0.022+Math.random()*.042,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,op:0.3+Math.random()*.45,hue:260+Math.random()*60};}
  function mkRune(W,H){return{t:'rune',x:Math.random()*W,y:Math.random()*H,r:4+Math.random()*9,sides:3+Math.floor(Math.random()*3),rot:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.022,vy:(Math.random()-.5)*.25,vx:(Math.random()-.5)*.22,op:0.4+Math.random()*.5,hue:200+Math.random()*160,life:1,decay:0.003+Math.random()*.005};}
  function mkSmoke(W,H){return{t:'smoke',x:Math.random()*W,y:H+Math.random()*20,r:4+Math.random()*8,vx:(Math.random()-.5)*.35,vy:-(0.45+Math.random()*.65),life:1,decay:0.005+Math.random()*.009,op:0.12+Math.random()*.2,hue:100+Math.random()*40};}
  function mkInk(W,H){return{t:'ink',x:Math.random()*W,y:Math.random()*H,r:3+Math.random()*8,rot:Math.random()*Math.PI*2,life:1,decay:0.004+Math.random()*.007,op:0.5+Math.random()*.4,hue:20+Math.random()*40,blobs:3+Math.floor(Math.random()*3)};}
  function mkHeart(W,H){return{t:'heart',x:Math.random()*W,y:H+Math.random()*20,r:3+Math.random()*7,rot:(Math.random()-.5)*.4,vy:-(0.25+Math.random()*.55),vx:(Math.random()-.5)*.28,op:0.45+Math.random()*.5,hue:340+Math.random()*30,life:1,decay:0.003+Math.random()*.006};}
  function mkKunai(W,H){return{t:'kunai',x:Math.random()*W,y:Math.random()*H,len:6+Math.random()*12,rot:Math.random()*Math.PI*2,spin:0.065+Math.random()*.085,vx:(Math.random()-.5)*.55,vy:(Math.random()-.5)*.35,op:0.5+Math.random()*.45,hue:40+Math.random()*22,life:1,decay:0.004+Math.random()*.006};}
  function mkShuriken(W,H){return{t:'shuriken',x:Math.random()*W,y:Math.random()*H,r:4+Math.random()*8,rot:Math.random()*Math.PI*2,spin:0.045+Math.random()*.065,vx:(Math.random()-.5)*.45,vy:(Math.random()-.5)*.45,op:0.4+Math.random()*.55,hue:180+Math.random()*40,life:1,decay:0.003+Math.random()*.005};}
  function mkCross(W,H){return{t:'cross',x:Math.random()*W,y:Math.random()*H,r:4+Math.random()*9,rot:(Math.random()-.5)*.25,vy:-(0.18+Math.random()*.35),vx:(Math.random()-.5)*.22,op:0.45+Math.random()*.5,hue:45+Math.random()*20,life:1,decay:0.003+Math.random()*.005};}
  function mkSpring(W,H){return{t:'spring',x:Math.random()*W,y:Math.random()*H,h:8+Math.random()*14,w:3+Math.random()*5,rot:Math.random()*Math.PI*2,vy:(Math.random()-.5)*.5,vx:(Math.random()-.5)*.35,op:0.45+Math.random()*.5,hue:0+Math.random()*20,life:1,decay:0.003+Math.random()*.005,coils:2+Math.floor(Math.random()*3)};}
  function mkBlock(W,H){return{t:'block',x:Math.random()*W,y:Math.random()*H,s:5+Math.random()*9,vy:(Math.random()-.5)*.35,vx:(Math.random()-.5)*.35,rot:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.012,op:0.45+Math.random()*.5,hue:28+Math.random()*22,life:1,decay:0.003+Math.random()*.005};}
  function mkTriforce(W,H){return{t:'triforce',x:Math.random()*W,y:Math.random()*H,r:4+Math.random()*10,rot:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.01,vy:-(0.12+Math.random()*.28),vx:(Math.random()-.5)*.22,op:0.4+Math.random()*.55,hue:45+Math.random()*15,life:1,decay:0.003+Math.random()*.005};}
  function mkKeyblade(W,H){return{t:'keyblade',x:Math.random()*W,y:Math.random()*H,len:16+Math.random()*16,rot:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.010,vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.28,op:0.45+Math.random()*.50,life:1,decay:0.0018+Math.random()*.0032};}
  function mkOrdnance(W,H){
    // kind : 0=grenade, 1=missile, 2=explosion
    const kind=Math.floor(Math.random()*3);
    const dir=Math.random()>.5?1:-1;
    return{t:'ordnance',x:Math.random()*W,y:Math.random()*H,kind,
      rot:kind===1?0:Math.random()*Math.PI*2,
      spin:kind===2?0:(Math.random()-.5)*(kind===1?.008:.04),
      vx:kind===1?dir*(1.1+Math.random()*1.4):(Math.random()-.5)*.5,
      vy:kind===1?(Math.random()-.5)*.3:(Math.random()-.5)*.45,
      size:kind===2?(10+Math.random()*14):(7+Math.random()*9),
      life:1, decay:kind===2?(.018+Math.random()*.026):(.003+Math.random()*.004),
      rays:kind===2?(6+Math.floor(Math.random()*5)):0,
      op:0.65+Math.random()*.35, dir};}
  function mkPikmin(W,H){
    // 5 types : Rouge, Jaune, Bleu, Blanc, Violet
    const cols=[[218,48,32],[232,192,28],[52,102,210],[232,232,232],[102,32,155]];
    const ci=Math.floor(Math.random()*5);
    const dir=Math.random()>.5?1:-1;
    return{t:'pikmin',x:Math.random()*W,y:Math.random()*H,s:11+Math.random()*10,
      vx:dir*(0.30+Math.random()*.45),vy:(Math.random()-.5)*.14,
      bob:Math.random()*Math.PI*2,bobSpd:0.10+Math.random()*.08,
      col:cols[ci],ci,dir,op:0.70+Math.random()*.30,life:1,decay:0.0014+Math.random()*.0028};}
  function mkMarioItem(W,H){
    // kind: 0=champignon, 1=boule de feu, 2=pièce, 3=bloc "?", 4=brique
    const kind=Math.floor(Math.random()*5);
    const dir=Math.random()>.5?1:-1;
    const mCols=[[200,48,32],[52,148,52],[52,102,210],[220,180,28]];
    const ci=Math.floor(Math.random()*4);
    const s=10+Math.random()*10;
    let x,y,vx,vy,decay;
    if(kind<=1){
      x=dir>0?-28:W+28; y=22+Math.random()*(H-44);
      vx=dir*(0.50+Math.random()*.62); vy=(Math.random()-.5)*.1; decay=0;
    } else if(kind===2){
      x=Math.random()*W; y=20+Math.random()*(H-40);
      vx=(Math.random()-.5)*.14; vy=-(0.20+Math.random()*.28); decay=0.006+Math.random()*.006;
    } else {
      x=Math.random()*W; y=Math.random()*H;
      vx=(Math.random()-.5)*.20; vy=(Math.random()-.5)*.08; decay=0.0008+Math.random()*.0012;
    }
    return{t:'marioitem',kind,x,y,vx,vy,dir,s,col:mCols[ci],ci,
      bob:Math.random()*Math.PI*2,bobSpd:0.040+Math.random()*.032,
      spin:Math.random()*Math.PI*2,spinSpd:0.10+Math.random()*.08,
      shimmer:Math.random()*Math.PI*2,shimSpd:0.055+Math.random()*.06,
      op:0.72+Math.random()*.28,life:1,decay};}
  function mkDkItem(W,H){
    // kind: 0=tuile lettre KONG, 1=tonneau DK
    const kind=Math.floor(Math.random()*2);
    const dir=Math.random()>.5?1:-1;
    const letters=['K','O','N','G'];
    const li=Math.floor(Math.random()*4);
    const s=12+Math.random()*9;
    let x,y,vx,vy,decay;
    if(kind===1){
      // Tonneaux: traversent l'écran gauche↔droite
      x=dir>0?-32:W+32; y=20+Math.random()*(H-40);
      vx=dir*(0.52+Math.random()*.62); vy=(Math.random()-.5)*.12; decay=0;
    } else {
      // Tuiles KONG: dérivent lentement
      x=Math.random()*W; y=Math.random()*H;
      vx=(Math.random()-.5)*.28; vy=(Math.random()-.5)*.18; decay=0.0008+Math.random()*.0012;
    }
    return{t:'dkitem',kind,x,y,vx,vy,dir,s,letter:letters[li],li,
      rot:Math.random()*Math.PI*2,
      spin:kind===1?(0.038+Math.random()*.038)*dir:(Math.random()-.5)*.009,
      bob:Math.random()*Math.PI*2,bobSpd:0.038+Math.random()*.028,
      shimmer:Math.random()*Math.PI*2,shimSpd:0.050+Math.random()*.055,
      op:0.74+Math.random()*.26,life:1,decay};}
  const FAC = { snow:mkSnow, fire:mkFire, rain:mkRain, sand:mkSand,
                leaf:mkLeaf, bubble:mkBubble, sparkle:mkSparkle, data:mkData,
                flake:mkFlake, bolt:mkBolt, pride:mkPride, shell:mkShell, flame:mkFlame,
                ghost:mkGhost,
                coin:mkCoin, note:mkNote, petal:mkPetal, ring:mkRing, sonicring:mkSonicRing, feather:mkFeather,
                pixel:mkPixel, star:mkStar, aura:mkAura, rune:mkRune, smoke:mkSmoke,
                ink:mkInk, heart:mkHeart, kunai:mkKunai, shuriken:mkShuriken,
                cross:mkCross, spring:mkSpring, block:mkBlock, triforce:mkTriforce,
                keyblade:mkKeyblade, pikmin:mkPikmin, ordnance:mkOrdnance, marioitem:mkMarioItem, dkitem:mkDkItem };

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
    } else if (t==='coin') {
      p.rot+=p.spin; p.x+=p.vx; p.y+=p.vy;
      if (p.y<-20) { p.y=H+10; p.x=Math.random()*W; }
    } else if (t==='note') {
      p.y+=p.vy; p.x+=p.vx;
      if (p.y<-20) { p.y=H+10; p.x=Math.random()*W; }
    } else if (t==='petal') {
      p.angle+=p.spin; p.y+=p.vy; p.x+=p.vx+Math.sin(p.angle*.4)*.5;
      if (p.y>H+20) { p.y=-15; p.x=Math.random()*W; }
    } else if (t==='ring') {
      p.r+=p.speed; p.op-=p.speed*.02;
      if (p.op<=0) { Object.assign(p, mkRing(W,H)); }
    } else if (t==='sonicring') {
      p.y+=p.vy; p.x+=p.vx; p.rot+=p.spin; p.shimmer+=p.shimmerSpd; p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkSonicRing(W,H));
    } else if (t==='feather') {
      p.angle+=p.spin; p.y+=p.vy; p.x+=p.vx;
      if (p.y>H+25) { p.y=-20; p.x=Math.random()*W; }
      if (p.x>W+20) p.x=-20; if (p.x<-20) p.x=W+20;
    } else if (t==='pixel') {
      p.x+=p.vx; p.y+=p.vy; p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkPixel(W,H));
    } else if (t==='star') {
      p.rot+=p.spin; p.y+=p.vy; p.x+=p.vx; p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkStar(W,H));
    } else if (t==='aura') {
      p.phase+=p.speed; p.x+=p.vx; p.y+=p.vy;
      if (p.x<0||p.x>W) p.vx*=-1;
      if (p.y<0||p.y>H) p.vy*=-1;
    } else if (t==='rune') {
      p.rot+=p.spin; p.x+=p.vx; p.y+=p.vy; p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkRune(W,H));
    } else if (t==='smoke') {
      p.x+=p.vx; p.y+=p.vy; p.r+=0.18; p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkSmoke(W,H));
    } else if (t==='ink') {
      p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkInk(W,H));
    } else if (t==='heart') {
      p.y+=p.vy; p.x+=p.vx; p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkHeart(W,H));
    } else if (t==='kunai') {
      p.rot+=p.spin; p.x+=p.vx; p.y+=p.vy; p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkKunai(W,H));
    } else if (t==='shuriken') {
      p.rot+=p.spin; p.x+=p.vx; p.y+=p.vy; p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkShuriken(W,H));
    } else if (t==='cross') {
      p.y+=p.vy; p.x+=p.vx; p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkCross(W,H));
    } else if (t==='spring') {
      p.y+=p.vy; p.x+=p.vx; p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkSpring(W,H));
    } else if (t==='block') {
      p.rot+=p.spin; p.x+=p.vx; p.y+=p.vy; p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkBlock(W,H));
    } else if (t==='triforce') {
      p.rot+=p.spin; p.y+=p.vy; p.x+=p.vx; p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkTriforce(W,H));
    } else if (t==='keyblade') {
      p.rot+=p.spin; p.x+=p.vx; p.y+=p.vy; p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkKeyblade(W,H));
      if (p.x<-35) p.x=W+35; if (p.x>W+35) p.x=-35;
      if (p.y<-35) p.y=H+35; if (p.y>H+35) p.y=-35;
    } else if (t==='ordnance') {
      p.rot+=p.spin; p.x+=p.vx; p.y+=p.vy; p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkOrdnance(W,H));
      if (p.x>W+30) { p.x=-30; p.y=Math.random()*H; }
      if (p.x<-30)  { p.x=W+30; p.y=Math.random()*H; }
      if (p.y>H+30) p.y=-30; if (p.y<-30) p.y=H+30;
    } else if (t==='pikmin') {
      p.bob+=p.bobSpd; p.x+=p.vx; p.y+=p.vy+Math.sin(p.bob*2)*0.14;
      p.life-=p.decay;
      if (p.life<=0) Object.assign(p, mkPikmin(W,H));
      if (p.x>W+22) { p.x=-22; p.y=Math.random()*H; }
      if (p.x<-22)  { p.x=W+22; p.y=Math.random()*H; }
      if (p.y>H+22) p.y=-22; if (p.y<-22) p.y=H+22;
    } else if (t==='marioitem') {
      p.bob+=p.bobSpd; p.spin+=p.spinSpd; p.shimmer+=p.shimSpd;
      if(p.kind<=1){
        // Champignon & boule de feu : déplacement horizontal + légère oscillation
        p.x+=p.vx; p.y+=Math.sin(p.bob)*0.22;
        if(p.x<-38||p.x>W+38) Object.assign(p,mkMarioItem(W,H));
      } else if(p.kind===2){
        // Pièce : monte doucement et disparaît
        p.x+=p.vx; p.y+=p.vy; p.life-=p.decay;
        if(p.life<=0) Object.assign(p,mkMarioItem(W,H));
      } else {
        // Blocs : dérive lente, respawn sur les bords
        p.x+=p.vx; p.y+=p.vy; p.life-=p.decay;
        if(p.life<=0) Object.assign(p,mkMarioItem(W,H));
        if(p.x<-28) p.x=W+28; if(p.x>W+28) p.x=-28;
        if(p.y<-28) p.y=H+28; if(p.y>H+28) p.y=-28;
      }
    } else if (t==='dkitem') {
      p.rot+=p.spin; p.bob+=p.bobSpd; p.shimmer+=p.shimSpd;
      if(p.kind===1){
        // Tonneau: traverse l'écran en tournant
        p.x+=p.vx; p.y+=Math.sin(p.bob)*0.18;
        if(p.x<-42||p.x>W+42) Object.assign(p,mkDkItem(W,H));
      } else {
        // Tuile KONG: dérive avec rebond sur les bords
        p.x+=p.vx; p.y+=p.vy+Math.sin(p.bob)*0.15;
        p.life-=p.decay;
        if(p.life<=0) Object.assign(p,mkDkItem(W,H));
        if(p.x<-32) p.x=W+32; if(p.x>W+32) p.x=-32;
        if(p.y<-32) p.y=H+32; if(p.y>H+32) p.y=-32;
      }
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
    } else if (t==='coin') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      const scaleX = Math.abs(Math.cos(p.rot*2));
      ctx.scale(Math.max(0.15,scaleX),1);
      ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},88%,62%,${p.op})`; ctx.fill();
      ctx.beginPath(); ctx.ellipse(0,-p.r*.28,p.r*.6,p.r*.18,0,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,255,220,${p.op*.55})`; ctx.fill();
      ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2);
      ctx.strokeStyle=`hsla(${p.hue+8},75%,45%,${p.op*.6})`; ctx.lineWidth=p.r*.12; ctx.stroke();
      ctx.restore();
    } else if (t==='note') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.fillStyle=`hsla(${p.hue},75%,72%,${p.op})`;
      ctx.strokeStyle=`hsla(${p.hue},75%,72%,${p.op})`;
      const hr=p.r*.6;
      ctx.beginPath(); ctx.ellipse(-p.r*.15,0,hr,hr*.72,-0.35,0,Math.PI*2); ctx.fill();
      ctx.lineWidth=p.r*.18; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(p.r*.45,0); ctx.lineTo(p.r*.45,-p.r*2.6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.r*.45,-p.r*2.6); ctx.quadraticCurveTo(p.r*1.2,-p.r*2.8,p.r*1.1,-p.r*1.9); ctx.stroke();
      ctx.restore();
    } else if (t==='petal') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle);
      ctx.beginPath(); ctx.ellipse(0,0,p.w,p.h,0,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},65%,72%,${p.op})`; ctx.fill();
      ctx.strokeStyle=`hsla(${p.hue+15},60%,85%,${p.op*.4})`; ctx.lineWidth=0.5; ctx.stroke();
      ctx.restore();
    } else if (t==='ring') {
      ctx.beginPath(); ctx.arc(p.x,p.y,Math.max(0,p.r),0,Math.PI*2);
      ctx.strokeStyle=`hsla(${p.hue},90%,72%,${Math.max(0,p.op)})`;
      ctx.lineWidth=1.8; ctx.stroke();
    } else if (t==='sonicring') {
      ctx.save();
      ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      const alpha=p.op*p.life;
      ctx.globalAlpha=alpha;
      const R=p.r, thickness=R*0.40, innerR=R-thickness, tY=p.tilt;
      const shim=(Math.sin(p.shimmer)+1)*0.5;
      // Gold gradient across the ring body
      const gx=ctx.createLinearGradient(-R,-R*tY,R,R*tY);
      const bright=58+Math.round(shim*18);
      gx.addColorStop(0,  `hsl(52,100%,${bright+8}%)`);
      gx.addColorStop(0.2,`hsl(46,98%,${bright}%)`);
      gx.addColorStop(0.55,`hsl(40,92%,48%)`);
      gx.addColorStop(0.82,`hsl(33,88%,37%)`);
      gx.addColorStop(1,  `hsl(28,84%,30%)`);
      // Draw donut using evenodd fill
      ctx.beginPath();
      ctx.ellipse(0,0,R,R*tY,0,0,Math.PI*2);
      ctx.ellipse(0,0,innerR,innerR*tY,0,0,Math.PI*2);
      ctx.fillStyle=gx; ctx.fill('evenodd');
      // Highlight shine on upper arc
      ctx.beginPath();
      ctx.ellipse(0,0,R-thickness*0.48,(R-thickness*0.48)*tY,0,Math.PI+0.55,Math.PI*2-0.55);
      ctx.strokeStyle=`rgba(255,252,195,${(0.22+shim*0.42)*alpha})`;
      ctx.lineWidth=thickness*0.52; ctx.stroke();
      // Outer edge subtle dark rim
      ctx.beginPath();
      ctx.ellipse(0,0,R,R*tY,0,0,Math.PI*2);
      ctx.strokeStyle=`rgba(120,60,0,${0.35*alpha})`;
      ctx.lineWidth=0.7; ctx.stroke();
      ctx.restore();
    } else if (t==='feather') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle);
      const fl=p.len;
      ctx.beginPath();
      ctx.moveTo(0,fl*.5);
      ctx.bezierCurveTo(-fl*.18,fl*.25,-fl*.16,-fl*.3,0,-fl*.5);
      ctx.bezierCurveTo(fl*.16,-fl*.3,fl*.18,fl*.25,0,fl*.5);
      ctx.fillStyle=`hsla(${p.hue},38%,82%,${p.op})`; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,fl*.5); ctx.lineTo(0,-fl*.5);
      ctx.strokeStyle=`hsla(${p.hue},25%,62%,${p.op*.45})`; ctx.lineWidth=.55; ctx.stroke();
      ctx.restore();
    } else if (t==='pixel') {
      const s2=p.s/2;
      ctx.globalAlpha=p.life*p.op;
      ctx.fillStyle=`hsl(${p.hue},78%,62%)`;
      ctx.fillRect(p.x-s2,p.y-s2,p.s,p.s);
      ctx.fillStyle=`rgba(255,255,255,${p.life*p.op*.35})`;
      ctx.fillRect(p.x-s2,p.y-s2,p.s*.45,p.s*.15);
      ctx.globalAlpha=1;
    } else if (t==='star') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.globalAlpha=p.op*p.life;
      ctx.beginPath();
      for(let i=0;i<10;i++){
        const a=i*Math.PI/5-Math.PI/2;
        const r2=i%2===0?p.r:p.r*.42;
        if(i===0) ctx.moveTo(Math.cos(a)*r2,Math.sin(a)*r2);
        else ctx.lineTo(Math.cos(a)*r2,Math.sin(a)*r2);
      }
      ctx.closePath();
      ctx.fillStyle=`hsl(${p.hue},95%,75%)`; ctx.fill();
      ctx.beginPath(); ctx.arc(0,0,p.r*.38,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},100%,95%,${p.life*.45})`; ctx.fill();
      ctx.restore(); ctx.globalAlpha=1;
    } else if (t==='aura') {
      const pulse=(Math.sin(p.phase)+1)/2;
      const rr=p.r*(0.6+pulse*.42);
      const grd=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,rr);
      grd.addColorStop(0,`hsla(${p.hue},80%,82%,${p.op*(0.5+pulse*.5)})`);
      grd.addColorStop(0.55,`hsla(${p.hue},75%,60%,${p.op*.3})`);
      grd.addColorStop(1,`hsla(${p.hue},75%,50%,0)`);
      ctx.beginPath(); ctx.arc(p.x,p.y,rr,0,Math.PI*2);
      ctx.fillStyle=grd; ctx.fill();
    } else if (t==='rune') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.globalAlpha=p.op*p.life;
      ctx.beginPath();
      for(let i=0;i<p.sides;i++){
        const a=i*(Math.PI*2/p.sides)-Math.PI/2;
        if(i===0) ctx.moveTo(Math.cos(a)*p.r,Math.sin(a)*p.r);
        else ctx.lineTo(Math.cos(a)*p.r,Math.sin(a)*p.r);
      }
      ctx.closePath();
      ctx.strokeStyle=`hsl(${p.hue},88%,68%)`; ctx.lineWidth=1.3; ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0,p.r*.5,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},100%,78%,${p.life*.28})`; ctx.fill();
      ctx.restore(); ctx.globalAlpha=1;
    } else if (t==='smoke') {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},8%,58%,${p.life*p.op})`; ctx.fill();
    } else if (t==='ink') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.globalAlpha=p.op*p.life;
      ctx.fillStyle=`hsl(${p.hue},68%,38%)`;
      ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill();
      for(let i=0;i<p.blobs;i++){
        const a=i*(Math.PI*2/p.blobs)+p.rot;
        const bx=Math.cos(a)*p.r*1.1, by=Math.sin(a)*p.r*1.1;
        ctx.beginPath(); ctx.arc(bx,by,p.r*.42,0,Math.PI*2); ctx.fill();
      }
      ctx.restore(); ctx.globalAlpha=1;
    } else if (t==='heart') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.globalAlpha=p.op*p.life;
      const hr=p.r*.55;
      ctx.beginPath();
      ctx.moveTo(0,hr*1.2);
      ctx.bezierCurveTo(-hr*3.5,hr*.2,-hr*3.5,-hr*2.5,0,-hr*2.0);
      ctx.bezierCurveTo(hr*3.5,-hr*2.5,hr*3.5,hr*.2,0,hr*1.2);
      ctx.closePath();
      ctx.fillStyle=`hsl(${p.hue},88%,65%)`; ctx.fill();
      ctx.restore(); ctx.globalAlpha=1;
    } else if (t==='kunai') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.globalAlpha=p.op*p.life;
      const kl=p.len;
      ctx.beginPath();
      ctx.moveTo(0,-kl); ctx.lineTo(kl*.2,0); ctx.lineTo(0,kl*.4); ctx.lineTo(-kl*.2,0);
      ctx.closePath();
      ctx.fillStyle=`hsl(${p.hue},62%,75%)`; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,-kl); ctx.lineTo(0,kl*.4);
      ctx.strokeStyle=`rgba(255,255,240,${p.life*.5})`; ctx.lineWidth=.6; ctx.stroke();
      ctx.restore(); ctx.globalAlpha=1;
    } else if (t==='shuriken') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.globalAlpha=p.op*p.life;
      ctx.fillStyle=`hsl(${p.hue},72%,65%)`;
      ctx.beginPath();
      for(let i=0;i<4;i++){
        const a=i*Math.PI/2;
        const x1=Math.cos(a)*p.r*.35, y1=Math.sin(a)*p.r*.35;
        const x2=Math.cos(a+Math.PI/4)*p.r*1.05, y2=Math.sin(a+Math.PI/4)*p.r*1.05;
        const x3=Math.cos(a+Math.PI/2)*p.r*.35, y3=Math.sin(a+Math.PI/2)*p.r*.35;
        if(i===0) ctx.moveTo(x1,y1); else ctx.lineTo(x1,y1);
        ctx.lineTo(x2,y2); ctx.lineTo(x3,y3);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore(); ctx.globalAlpha=1;
    } else if (t==='cross') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.globalAlpha=p.op*p.life;
      ctx.fillStyle=`hsl(${p.hue},78%,76%)`;
      const cr=p.r, cw=cr*.38;
      ctx.fillRect(-cw,-cr,cw*2,cr*2); ctx.fillRect(-cr,-cw,cr*2,cw*2);
      ctx.beginPath(); ctx.arc(0,0,cr*.42,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.hue},100%,92%,${p.life*.3})`; ctx.fill();
      ctx.restore(); ctx.globalAlpha=1;
    } else if (t==='spring') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.globalAlpha=p.op*p.life;
      ctx.strokeStyle=`hsl(${p.hue},80%,65%)`; ctx.lineWidth=1.5; ctx.lineCap='round';
      const seg=p.h/(p.coils*2);
      ctx.beginPath();
      for(let i=0;i<=p.coils*2;i++){
        const x2=(i%2===0)?-p.w:p.w, y2=-p.h/2+i*seg;
        if(i===0) ctx.moveTo(x2,y2); else ctx.lineTo(x2,y2);
      }
      ctx.stroke();
      ctx.restore(); ctx.globalAlpha=1;
    } else if (t==='block') {
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      ctx.globalAlpha=p.op*p.life;
      const bs=p.s, bh=bs*.55;
      ctx.fillStyle=`hsl(${p.hue},52%,42%)`; ctx.fillRect(-bs/2,-bs/2,bs,bs);
      ctx.fillStyle=`hsl(${p.hue},42%,60%)`;
      ctx.beginPath(); ctx.moveTo(-bs/2,-bs/2); ctx.lineTo(bs/2,-bs/2);
      ctx.lineTo(bs/2+bh*.55,-bs/2-bh*.55); ctx.lineTo(-bs/2+bh*.55,-bs/2-bh*.55);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle=`hsl(${p.hue},48%,30%)`;
      ctx.beginPath(); ctx.moveTo(bs/2,-bs/2); ctx.lineTo(bs/2,bs/2);
      ctx.lineTo(bs/2+bh*.55,bs/2-bh*.55); ctx.lineTo(bs/2+bh*.55,-bs/2-bh*.55);
      ctx.closePath(); ctx.fill();
      ctx.restore(); ctx.globalAlpha=1;
    } else if (t==='triforce') {
      // Vraie Triforce : 3 triangles équilatéraux remplis, style Zelda
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
      const al=p.op*p.life; ctx.globalAlpha=al;
      const R=p.r;

      // Sommets du grand triangle équilatéral
      // (pointé vers le haut : sommet en haut, base en bas)
      const tA=[0,-R], tB=[-R*.866,R*.5], tC=[R*.866,R*.5];
      // Points médians des côtés → délimitent les 3 sous-triangles
      const mAB=[-R*.433,-R*.25], mAC=[R*.433,-R*.25], mBC=[0,R*.5];

      // Halo de lueur dorée
      const hrd=ctx.createRadialGradient(0,R*.08,0,0,R*.08,R*1.6);
      hrd.addColorStop(0,`rgba(255,230,50,${al*.25})`);
      hrd.addColorStop(1,`rgba(200,120,0,0)`);
      ctx.beginPath(); ctx.arc(0,R*.08,R*1.6,0,Math.PI*2);
      ctx.fillStyle=hrd; ctx.fill();

      // Dessin des 3 sous-triangles
      [[tA,mAB,mAC],[mAB,tB,mBC],[mAC,mBC,tC]].forEach(([[ax,ay],[bx,by],[cx_,cy_]])=>{
        const kcx=(ax+bx+cx_)/3, kcy=(ay+by+cy_)/3; // centroïde

        // Dégradé radial : blanc-jaune au centre → or vif → or foncé
        const grd=ctx.createRadialGradient(kcx,kcy,0,kcx,kcy,R*.6);
        grd.addColorStop(0,  `rgba(255,255,200,${al})`);
        grd.addColorStop(0.3,`rgba(255,238,60,${al})`);
        grd.addColorStop(0.7,`rgba(240,190,10,${al})`);
        grd.addColorStop(1,  `rgba(200,120,0,${al})`);

        ctx.beginPath();
        ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.lineTo(cx_,cy_);
        ctx.closePath();
        ctx.fillStyle=grd; ctx.fill();

        // Contour or foncé
        ctx.strokeStyle=`rgba(185,105,0,${al*.85})`;
        ctx.lineWidth=R*.10; ctx.lineJoin='round'; ctx.stroke();

        // Reflet (petit triangle blanc vers le coin haut-gauche de chaque sous-triangle)
        const rx=(ax+kcx)/2, ry=(ay+kcy)/2;
        ctx.beginPath(); ctx.arc(rx,ry,R*.09,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${al*.35})`; ctx.fill();
      });

      ctx.restore(); ctx.globalAlpha=1;
    } else if (t==='keyblade') {
      // Kingdom Key : lame argent-bleu, garde or, dents à la pointe, porte-clés Mickey
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const al = p.op * p.life;
      ctx.globalAlpha = al;
      const l = p.len;

      // ── Halo de lueur globale ─────────────────────────────
      const glow = ctx.createRadialGradient(0,0,0,0,0,l*.7);
      glow.addColorStop(0,  `rgba(120,190,255,${al*.22})`);
      glow.addColorStop(1,  `rgba(80,140,220,0)`);
      ctx.beginPath(); ctx.ellipse(0,0,l*.7,l*.38,0,0,Math.PI*2);
      ctx.fillStyle=glow; ctx.fill();

      // ── Lame (shaft) argent-bleu ──────────────────────────
      // Corps principal
      ctx.fillStyle=`rgba(175,215,235,${al})`;
      ctx.beginPath();
      ctx.moveTo(-l*.48, -l*.055);
      ctx.lineTo( l*.24, -l*.055);
      ctx.lineTo( l*.24,  l*.055);
      ctx.lineTo(-l*.48,  l*.055);
      ctx.closePath(); ctx.fill();
      // Reflet sur la lame (bande claire en haut)
      ctx.fillStyle=`rgba(230,248,255,${al*.5})`;
      ctx.fillRect(-l*.44, -l*.044, l*.64, l*.025);

      // ── Dents de la clé (bout gauche) ─────────────────────
      // Trois dents d'inégale hauteur (M-shape comme sur l'image)
      ctx.fillStyle=`rgba(155,200,220,${al})`;
      // Dent 1 (gauche, haute)
      ctx.fillRect(-l*.48,  l*.055, l*.09, l*.20);
      // Dent 2 (milieu, courte)
      ctx.fillRect(-l*.34,  l*.055, l*.09, l*.13);
      // Dent 3 (droite, haute)
      ctx.fillRect(-l*.20,  l*.055, l*.09, l*.20);

      // ── Garde (barre verticale or) ────────────────────────
      ctx.fillStyle=`rgba(255,200,50,${al})`;
      ctx.fillRect(l*.20, -l*.22, l*.08, l*.44);
      // Ombre basse de la garde
      ctx.fillStyle=`rgba(200,140,20,${al*.6})`;
      ctx.fillRect(l*.20,  l*.12, l*.08, l*.10);

      // ── Arceau (bow) or — cadre rectangulaire ─────────────
      ctx.strokeStyle=`rgba(255,200,50,${al})`;
      ctx.lineWidth = l*.072; ctx.lineJoin='round';
      ctx.strokeRect(l*.30, -l*.165, l*.185, l*.33);
      // Reflet interne de l'arceau
      ctx.strokeStyle=`rgba(255,235,140,${al*.45})`;
      ctx.lineWidth = l*.025;
      ctx.strokeRect(l*.32, -l*.145, l*.145, l*.29);

      // ── Chaîne (porte-clés) ───────────────────────────────
      ctx.strokeStyle=`rgba(140,215,235,${al*.8})`;
      ctx.lineWidth = l*.032; ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(l*.39, l*.165);
      ctx.lineTo(l*.36, l*.30);
      ctx.lineTo(l*.30, l*.36);
      ctx.stroke();

      // ── Tête Mickey (3 cercles cyan) ─────────────────────
      // Tête principale
      ctx.fillStyle=`rgba(100,210,235,${al})`;
      ctx.beginPath(); ctx.arc(l*.27, l*.42, l*.082, 0, Math.PI*2); ctx.fill();
      // Oreille gauche
      ctx.beginPath(); ctx.arc(l*.19, l*.35, l*.050, 0, Math.PI*2); ctx.fill();
      // Oreille droite
      ctx.beginPath(); ctx.arc(l*.35, l*.35, l*.050, 0, Math.PI*2); ctx.fill();
      // Reflet sur la tête
      ctx.fillStyle=`rgba(210,248,255,${al*.5})`;
      ctx.beginPath(); ctx.arc(l*.24, l*.395, l*.030, 0, Math.PI*2); ctx.fill();

      ctx.restore(); ctx.globalAlpha=1;
    } else if (t==='pikmin') {
      const [r,g,b]=p.col; const s=p.s; const al=p.op*p.life;
      const isWhite=(p.ci===3), isYellow=(p.ci===1);
      ctx.save();
      // Décalage de marche vertical (bob)
      ctx.translate(p.x, p.y + Math.sin(p.bob)*s*.09);
      ctx.scale(p.dir, 1); // orientation gauche/droite
      ctx.globalAlpha=al;

      // ── Ombre portée ──────────────────────────────────────
      ctx.beginPath(); ctx.ellipse(0,s*.60,s*.24,s*.06,0,0,Math.PI*2);
      ctx.fillStyle=`rgba(0,0,0,${al*.28})`; ctx.fill();

      // ── Jambes (derrière le corps) ─────────────────────────
      const stepL=Math.sin(p.bob)*s*.12;  // décalage oscillant
      ctx.strokeStyle=`rgba(${r},${g},${b},${al})`;
      ctx.lineWidth=s*.115; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(-s*.10,s*.46); ctx.lineTo(-s*.16-stepL,s*.64); ctx.stroke();
      ctx.beginPath(); ctx.moveTo( s*.10,s*.46); ctx.lineTo( s*.16+stepL,s*.64); ctx.stroke();

      // ── Corps (ovale) ─────────────────────────────────────
      ctx.beginPath(); ctx.ellipse(0,s*.24,s*.27,s*.31,0,0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${al})`; ctx.fill();
      // Ventre légèrement plus clair
      ctx.beginPath(); ctx.ellipse(s*.05,s*.22,s*.16,s*.20,0.15,0,Math.PI*2);
      ctx.fillStyle=`rgba(${Math.min(255,r+55)},${Math.min(255,g+50)},${Math.min(255,b+48)},${al*.45})`; ctx.fill();

      // ── Tête (cercle principal) ────────────────────────────
      // Oreilles latérales des Pikmin Jaunes (avant la tête)
      if (isYellow) {
        ctx.fillStyle=`rgba(${r},${g},${b},${al})`;
        ctx.beginPath(); ctx.ellipse(-s*.33,-s*.14,s*.10,s*.18,-0.35,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse( s*.33,-s*.14,s*.10,s*.18, 0.35,0,Math.PI*2); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(0,-s*.13,s*.31,0,Math.PI*2);
      ctx.fillStyle=`rgba(${r},${g},${b},${al})`; ctx.fill();

      // Zone faciale avant (plus claire)
      ctx.beginPath(); ctx.ellipse(s*.08,-s*.10,s*.19,s*.23,0.2,0,Math.PI*2);
      ctx.fillStyle=`rgba(${Math.min(255,r+62)},${Math.min(255,g+56)},${Math.min(255,b+52)},${al*.55})`; ctx.fill();

      // ── Yeux ──────────────────────────────────────────────
      // Pikmin Blanc → yeux rouges, les autres → pupilles noires
      if (!isWhite) {
        // Blanc de l'œil
        ctx.beginPath(); ctx.arc(s*.10,-s*.19,s*.092,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${al})`; ctx.fill();
        // Pupille noire
        ctx.beginPath(); ctx.arc(s*.12,-s*.18,s*.055,0,Math.PI*2);
        ctx.fillStyle=`rgba(10,8,8,${al})`; ctx.fill();
        // Reflet
        ctx.beginPath(); ctx.arc(s*.10,-s*.205,s*.020,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${al*.75})`; ctx.fill();
      } else {
        // Pikmin blanc : grand œil rouge brillant
        ctx.beginPath(); ctx.arc(s*.11,-s*.18,s*.09,0,Math.PI*2);
        ctx.fillStyle=`rgba(230,40,40,${al})`; ctx.fill();
        ctx.beginPath(); ctx.arc(s*.09,-s*.20,s*.025,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,180,180,${al*.7})`; ctx.fill();
      }

      // ── Tige de la feuille ────────────────────────────────
      ctx.strokeStyle=`rgba(70,135,45,${al*.9})`;
      ctx.lineWidth=s*.072; ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(s*.02,-s*.44);
      ctx.quadraticCurveTo(s*.18,-s*.68,-s*.04,-s*.92);
      ctx.stroke();

      // ── Feuille (ellipse verte inclinée) ──────────────────
      ctx.save();
      ctx.translate(-s*.04,-s*.92);
      ctx.rotate(-0.55);
      ctx.beginPath(); ctx.ellipse(0,0,s*.17,s*.09,0,0,Math.PI*2);
      ctx.fillStyle=`rgba(68,152,48,${al})`; ctx.fill();
      // Nervure centrale de la feuille
      ctx.strokeStyle=`rgba(100,185,70,${al*.55})`; ctx.lineWidth=s*.025;
      ctx.beginPath(); ctx.moveTo(-s*.14,0); ctx.lineTo(s*.14,0); ctx.stroke();
      ctx.restore();

      ctx.restore(); ctx.globalAlpha=1;
    } else if (t==='ordnance') {
      const al=p.op*p.life; const s=p.size;
      ctx.save(); ctx.globalAlpha=al;

      if (p.kind===0) {
        // ── GRENADE (style ananas militaire) ──────────────────
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);

        // Halo de danger
        const hrd=ctx.createRadialGradient(0,0,0,0,0,s*1.4);
        hrd.addColorStop(0,`rgba(80,120,40,${al*.18})`);
        hrd.addColorStop(1,`rgba(60,90,30,0)`);
        ctx.beginPath(); ctx.arc(0,0,s*1.4,0,Math.PI*2); ctx.fillStyle=hrd; ctx.fill();

        // Corps principal (ovale olive)
        const grd=ctx.createLinearGradient(-s*.5,0,s*.5,0);
        grd.addColorStop(0,  `rgba(55,78,35,${al})`);
        grd.addColorStop(0.4,`rgba(80,108,48,${al})`);
        grd.addColorStop(0.7,`rgba(68,95,40,${al})`);
        grd.addColorStop(1,  `rgba(45,65,28,${al})`);
        ctx.beginPath(); ctx.ellipse(0,s*.05,s*.52,s*.64,0,0,Math.PI*2);
        ctx.fillStyle=grd; ctx.fill();

        // Segments (lignes horizontales + verticales = pineapple)
        ctx.strokeStyle=`rgba(38,55,22,${al*.75})`; ctx.lineWidth=s*.06;
        // 3 bandes horizontales
        for(let i=-1;i<=1;i++){
          const py=i*s*.24, rx=Math.sqrt(Math.max(0,1-(py/(s*.64))*(py/(s*.64))))*s*.52;
          ctx.beginPath(); ctx.moveTo(-rx*.9,py); ctx.lineTo(rx*.9,py); ctx.stroke();
        }
        // 4 bandes verticales
        for(let i=-1;i<=1;i+=.67){
          const px=i*s*.35, ry=Math.sqrt(Math.max(0,1-(px/(s*.52))*(px/(s*.52))))*s*.64;
          ctx.beginPath(); ctx.moveTo(px,-ry*.85); ctx.lineTo(px,ry*.85); ctx.stroke();
        }

        // Reflet sur le corps
        ctx.beginPath(); ctx.ellipse(-s*.14,-s*.18,s*.18,s*.10,-0.5,0,Math.PI*2);
        ctx.fillStyle=`rgba(130,165,90,${al*.35})`; ctx.fill();

        // Col (cylindre du dessus)
        ctx.fillStyle=`rgba(50,65,30,${al})`;
        ctx.beginPath(); ctx.ellipse(0,-s*.64,s*.16,s*.10,0,0,Math.PI*2); ctx.fill();
        ctx.fillRect(-s*.16,-s*.78,s*.32,s*.16);
        ctx.beginPath(); ctx.ellipse(0,-s*.78,s*.16,s*.10,0,0,Math.PI*2);
        ctx.fillStyle=`rgba(65,82,38,${al})`; ctx.fill();

        // Levier de sécurité (petite languette)
        ctx.fillStyle=`rgba(90,110,55,${al})`;
        ctx.fillRect(s*.14,-s*.82,s*.28,s*.08);
        ctx.beginPath(); ctx.arc(s*.42,-s*.78,s*.06,0,Math.PI*2);
        ctx.fillStyle=`rgba(75,95,45,${al})`; ctx.fill();

        // Anneau de goupille (cercle au-dessus)
        ctx.strokeStyle=`rgba(180,170,140,${al})`;
        ctx.lineWidth=s*.07; ctx.lineCap='round';
        ctx.beginPath(); ctx.arc(-s*.04,-s*.84,s*.14,-Math.PI*.9,Math.PI*.1);
        ctx.stroke();
        // Petit maillon de chaîne
        ctx.beginPath(); ctx.arc(-s*.17,-s*.84,s*.05,0,Math.PI*2); ctx.stroke();

      } else if (p.kind===1) {
        // ── MISSILE (style NIKITA / roquette) ─────────────────
        // Le missile vole horizontalement dans la direction p.dir
        ctx.translate(p.x, p.y);
        ctx.scale(p.dir, 1); // flip gauche/droite

        const len=s*3.2, rad=s*.28;

        // Trainée de fumée derrière
        for(let i=1;i<=4;i++){
          const sx=-len*.55-i*s*.5;
          ctx.beginPath(); ctx.arc(sx, (Math.sin(i*1.8)*s*.18), s*.22*(1-i*.18), 0, Math.PI*2);
          ctx.fillStyle=`rgba(160,150,120,${al*.18/i})`; ctx.fill();
        }

        // Corps principal (cylindre)
        const brd=ctx.createLinearGradient(0,-rad,0,rad);
        brd.addColorStop(0,`rgba(70,70,70,${al})`);
        brd.addColorStop(0.4,`rgba(105,105,105,${al})`);
        brd.addColorStop(1,`rgba(50,50,50,${al})`);
        ctx.beginPath();
        ctx.moveTo(-len*.5,-rad); ctx.lineTo(len*.32,-rad);
        ctx.lineTo(len*.32,rad);  ctx.lineTo(-len*.5,rad);
        ctx.closePath(); ctx.fillStyle=brd; ctx.fill();

        // Bandes militaires (2 bandes jaunes/oranges)
        ctx.fillStyle=`rgba(210,160,30,${al*.8})`;
        ctx.fillRect(-s*.2,-rad,s*.12,rad*2);
        ctx.fillRect(s*.15,-rad,s*.12,rad*2);

        // Reflet métallique sur le corps
        ctx.beginPath();
        ctx.moveTo(-len*.48,-rad*.7); ctx.lineTo(len*.30,-rad*.7);
        ctx.lineTo(len*.30,-rad*.3); ctx.lineTo(-len*.48,-rad*.3);
        ctx.closePath(); ctx.fillStyle=`rgba(180,180,180,${al*.22})`; ctx.fill();

        // Nez conique (avant = droite)
        ctx.beginPath();
        ctx.moveTo(len*.32,-rad); ctx.lineTo(len*.55, 0); ctx.lineTo(len*.32,rad);
        ctx.closePath();
        const nrd=ctx.createLinearGradient(len*.32,0,len*.55,0);
        nrd.addColorStop(0,`rgba(100,100,100,${al})`);
        nrd.addColorStop(1,`rgba(200,80,30,${al})`);
        ctx.fillStyle=nrd; ctx.fill();
        // Pointe lumineuse
        ctx.beginPath(); ctx.arc(len*.52,0,s*.06,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,150,60,${al*.7})`; ctx.fill();

        // Ailerons arrière (3 petites nageoires)
        ctx.fillStyle=`rgba(55,55,55,${al})`;
        // Aileron haut
        ctx.beginPath();
        ctx.moveTo(-len*.5,0); ctx.lineTo(-len*.5,-rad*2.4); ctx.lineTo(-len*.3,-rad);
        ctx.closePath(); ctx.fill();
        // Aileron bas
        ctx.beginPath();
        ctx.moveTo(-len*.5,0); ctx.lineTo(-len*.5,rad*2.4); ctx.lineTo(-len*.3,rad);
        ctx.closePath(); ctx.fill();
        // Aileron central (petit)
        ctx.beginPath();
        ctx.moveTo(-len*.5,0); ctx.lineTo(-len*.44,-rad*1.5); ctx.lineTo(-len*.36,-rad*.2);
        ctx.closePath(); ctx.fillStyle=`rgba(75,75,75,${al})`; ctx.fill();

        // Flamme de propulsion (arrière = gauche)
        const frd=ctx.createLinearGradient(-len*.5,0,-len*.72,0);
        frd.addColorStop(0,`rgba(255,200,50,${al*.9})`);
        frd.addColorStop(0.4,`rgba(255,100,20,${al*.6})`);
        frd.addColorStop(1,`rgba(255,60,0,0)`);
        ctx.beginPath();
        ctx.moveTo(-len*.5,-rad*.6);
        ctx.quadraticCurveTo(-len*.68,0,-len*.5,rad*.6);
        ctx.closePath(); ctx.fillStyle=frd; ctx.fill();

      } else {
        // ── EXPLOSION ─────────────────────────────────────────
        ctx.translate(p.x, p.y);
        const er=s*(1.8-p.life*.8); // rayon qui s'étend
        const af=Math.max(0,p.life);

        // Onde de choc (anneau extérieur)
        ctx.beginPath(); ctx.arc(0,0,er*1.35,0,Math.PI*2);
        ctx.strokeStyle=`rgba(255,180,60,${af*.35})`; ctx.lineWidth=s*.18; ctx.stroke();

        // Boule de feu centrale
        const fgrd=ctx.createRadialGradient(0,0,0,0,0,er*.9);
        fgrd.addColorStop(0,  `rgba(255,255,200,${af*.95})`);
        fgrd.addColorStop(0.2,`rgba(255,230,80,${af*.85})`);
        fgrd.addColorStop(0.5,`rgba(255,120,20,${af*.65})`);
        fgrd.addColorStop(0.8,`rgba(180,50,10,${af*.35})`);
        fgrd.addColorStop(1,  `rgba(80,20,5,0)`);
        ctx.beginPath(); ctx.arc(0,0,er*.9,0,Math.PI*2);
        ctx.fillStyle=fgrd; ctx.fill();

        // Rayons (éclats de l'explosion)
        ctx.lineCap='round';
        for(let i=0;i<p.rays;i++){
          const a=(i/p.rays)*Math.PI*2+(p.life*2);
          const r1=er*.45, r2=er*(1.1+Math.sin(i*3.7)*.35);
          const lw=s*(0.14+Math.sin(i*2.1)*.07);
          const hue=20+Math.sin(i*1.4)*25;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a)*r1, Math.sin(a)*r1);
          ctx.lineTo(Math.cos(a)*r2, Math.sin(a)*r2);
          ctx.strokeStyle=`hsla(${hue},100%,${55+af*30}%,${af*.75})`;
          ctx.lineWidth=lw*(0.4+af*.6); ctx.stroke();
        }

        // Fumée noire (quelques cercles sombres)
        for(let i=0;i<4;i++){
          const sa=(i/4)*Math.PI*2+1.1;
          const sr=er*(0.55+i*.18);
          ctx.beginPath(); ctx.arc(Math.cos(sa)*sr,Math.sin(sa)*sr,s*(0.22+i*.06),0,Math.PI*2);
          ctx.fillStyle=`rgba(30,20,10,${(1-af)*.35})`; ctx.fill();
        }
      }
      ctx.restore(); ctx.globalAlpha=1;
    } else if (t==='marioitem') {
      const al=p.kind===2 ? Math.max(0,Math.sin(p.life*Math.PI)*p.op) : p.op;
      ctx.save(); ctx.globalAlpha=Math.max(0,al);
      const s=p.s;
      if(p.kind===0){
        // ── CHAMPIGNON ──
        ctx.save(); ctx.translate(p.x,p.y+Math.sin(p.bob)*2.5);
        // Face beige
        ctx.beginPath(); ctx.ellipse(0,s*.55,s*.52,s*.45,0,0,Math.PI*2);
        ctx.fillStyle='rgb(210,185,140)'; ctx.fill();
        ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=0.8; ctx.stroke();
        // Yeux
        ctx.fillStyle='rgb(18,8,4)';
        ctx.beginPath(); ctx.ellipse(-s*.18,s*.50,s*.10,s*.14,-0.15,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse( s*.18,s*.50,s*.10,s*.14, 0.15,0,Math.PI*2); ctx.fill();
        // Chapeau coloré
        const [mr,mg,mb]=p.col;
        ctx.beginPath(); ctx.arc(0,0,s,0,Math.PI*2);
        ctx.fillStyle=`rgb(${mr},${mg},${mb})`; ctx.fill();
        ctx.strokeStyle='rgba(0,0,0,0.38)'; ctx.lineWidth=0.8; ctx.stroke();
        // Taches blanches
        ctx.fillStyle='rgba(255,255,255,0.88)';
        ctx.beginPath(); ctx.arc(-s*.38,-s*.14,s*.20,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc( s*.40,-s*.17,s*.17,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc( 0,-s*.58,s*.13,0,Math.PI*2); ctx.fill();
        ctx.restore();
      } else if(p.kind===1){
        // ── BOULE DE FEU ──
        ctx.save(); ctx.translate(p.x,p.y+Math.sin(p.bob)*1.5);
        const shim=(Math.sin(p.shimmer)+1)*.5;
        const td=-p.dir;
        // Queue de feu (derrière la balle)
        ctx.beginPath();
        ctx.moveTo(td*s*.75,0);
        ctx.bezierCurveTo(td*s*1.5,-s*.5,td*s*2.7,-s*.28,td*s*3.2,0);
        ctx.bezierCurveTo(td*s*2.7,s*.28,td*s*1.5,s*.5,td*s*.75,0);
        ctx.fillStyle=`rgba(255,135,10,${0.38+shim*.3})`; ctx.fill();
        // Halo externe
        const gr=ctx.createRadialGradient(0,0,s*.1,0,0,s*1.75);
        gr.addColorStop(0,`rgba(255,248,120,${0.52+shim*.22})`);
        gr.addColorStop(0.5,`rgba(255,110,0,${0.28})`);
        gr.addColorStop(1,`rgba(255,55,0,0)`);
        ctx.beginPath(); ctx.arc(0,0,s*1.75,0,Math.PI*2); ctx.fillStyle=gr; ctx.fill();
        // Noyau
        const gb=ctx.createRadialGradient(-s*.25,-s*.25,0,0,0,s);
        gb.addColorStop(0,  'hsl(58,100%,88%)');
        gb.addColorStop(0.35,'hsl(44,100%,68%)');
        gb.addColorStop(0.72,'hsl(22,100%,52%)');
        gb.addColorStop(1,  'hsl(12,95%,40%)');
        ctx.beginPath(); ctx.arc(0,0,s,0,Math.PI*2); ctx.fillStyle=gb; ctx.fill();
        ctx.restore();
      } else if(p.kind===2){
        // ── PIÈCE PIXEL ART (tourne sur elle-même) ──
        const scx=Math.abs(Math.cos(p.spin));
        if(scx>0.025){
          ctx.save(); ctx.translate(p.x,p.y); ctx.scale(scx,1);
          const cs=s;
          ctx.fillStyle='#000'; ctx.fillRect(-cs-2,-cs-2,(cs+2)*2,(cs+2)*2);
          ctx.fillStyle='rgb(222,172,0)'; ctx.fillRect(-cs,-cs,cs*2,cs*2);
          ctx.fillStyle='rgb(192,144,0)'; ctx.fillRect(-cs*.65,-cs*.65,cs*1.3,cs*1.3);
          // Reflet blanc en "D"
          ctx.fillStyle='rgb(255,252,195)';
          ctx.fillRect(-cs*.44,-cs*.58,cs*.28,cs*1.16);
          ctx.fillRect(-cs*.44,-cs*.58,cs*.44,cs*.16);
          ctx.fillRect(-cs*.44, cs*.42,cs*.44,cs*.16);
          // Bord gauche or
          ctx.fillStyle='rgb(222,172,0)'; ctx.fillRect(-cs,-cs*.74,cs*.22,cs*1.48);
          ctx.restore();
        }
      } else if(p.kind===3){
        // ── BLOC "?" ──
        ctx.save(); ctx.translate(p.x,p.y);
        const qs=s;
        ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(-qs+3,-qs+3,qs*2,qs*2);
        const qg=ctx.createLinearGradient(-qs,-qs,qs*.5,qs);
        qg.addColorStop(0,'rgb(255,224,52)');
        qg.addColorStop(0.5,'rgb(240,190,20)');
        qg.addColorStop(1,'rgb(200,152,8)');
        ctx.fillStyle=qg; ctx.fillRect(-qs,-qs,qs*2,qs*2);
        ctx.strokeStyle='rgba(60,28,0,0.85)'; ctx.lineWidth=1.8; ctx.strokeRect(-qs,-qs,qs*2,qs*2);
        for(const [bx,by] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
          ctx.beginPath(); ctx.arc(bx*qs*.72,by*qs*.72,qs*.13,0,Math.PI*2);
          ctx.fillStyle='rgb(80,38,0)'; ctx.fill();
        }
        ctx.font=`bold ${Math.round(qs*1.3)}px Arial`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillStyle='#fff'; ctx.shadowColor='rgba(0,0,0,0.55)'; ctx.shadowBlur=2;
        ctx.fillText('?',0,qs*.08); ctx.shadowBlur=0;
        ctx.restore();
      } else {
        // ── BRIQUE ──
        ctx.save(); ctx.translate(p.x,p.y);
        const bs=s;
        ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.fillRect(-bs+3,-bs+3,bs*2,bs*2);
        const bg=ctx.createLinearGradient(-bs,-bs,bs*.4,bs);
        bg.addColorStop(0,'rgb(215,125,72)');
        bg.addColorStop(0.5,'rgb(188,96,50)');
        bg.addColorStop(1,'rgb(158,74,34)');
        ctx.fillStyle=bg; ctx.fillRect(-bs,-bs,bs*2,bs*2);
        ctx.strokeStyle='rgba(75,26,8,0.9)'; ctx.lineWidth=1.5; ctx.strokeRect(-bs,-bs,bs*2,bs*2);
        // Joints de mortier
        ctx.strokeStyle='rgba(65,22,6,0.8)'; ctx.lineWidth=1.2;
        ctx.beginPath(); ctx.moveTo(-bs,-bs*.05); ctx.lineTo(bs,-bs*.05); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-bs, bs*.50); ctx.lineTo(bs, bs*.50); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,-bs); ctx.lineTo(0,-bs*.05); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-bs*.5,-bs*.05); ctx.lineTo(-bs*.5,bs*.50); ctx.stroke();
        ctx.beginPath(); ctx.moveTo( bs*.5,-bs*.05); ctx.lineTo( bs*.5,bs*.50); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,bs*.50); ctx.lineTo(0,bs); ctx.stroke();
        // Reflet biseau (haut-gauche)
        ctx.strokeStyle='rgba(240,158,108,0.52)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(-bs+1,-bs+1); ctx.lineTo(bs-1,-bs+1); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-bs+1,-bs+1); ctx.lineTo(-bs+1,bs-1); ctx.stroke();
        ctx.restore();
      }
      ctx.restore(); ctx.globalAlpha=1;
    } else if (t==='dkitem') {
      ctx.save(); ctx.globalAlpha=p.op;
      const s=p.s;
      if(p.kind===0){
        // ── TUILE LETTRE KONG ──
        ctx.save();
        ctx.translate(p.x, p.y+Math.sin(p.bob)*2.2); ctx.rotate(p.rot);
        const ts=s;
        const shim=(Math.sin(p.shimmer)+1)*.5;
        // Ombre portée
        ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(-ts+3,-ts+3,ts*2,ts*2);
        // Corps rouge foncé
        const tg=ctx.createLinearGradient(-ts,-ts,ts*.45,ts);
        tg.addColorStop(0,'rgb(190,46,10)'); tg.addColorStop(0.5,'rgb(163,32,8)'); tg.addColorStop(1,'rgb(128,22,5)');
        ctx.fillStyle=tg; ctx.fillRect(-ts,-ts,ts*2,ts*2);
        // Cadre orange/or épais (bordure intérieure)
        ctx.strokeStyle='rgba(230,135,22,0.96)'; ctx.lineWidth=ts*.22;
        ctx.strokeRect(-ts+ts*.1,-ts+ts*.1,(ts-ts*.1)*2,(ts-ts*.1)*2);
        // Contour extérieur sombre
        ctx.strokeStyle='rgba(75,13,0,0.90)'; ctx.lineWidth=1.5;
        ctx.strokeRect(-ts,-ts,ts*2,ts*2);
        // Ombre 3D de la lettre (décalage bas-droite)
        ctx.font=`bold ${Math.round(ts*1.55)}px "Arial Black", Impact, sans-serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillStyle='rgba(105,52,0,0.88)'; ctx.fillText(p.letter,ts*.1,ts*.1);
        // Lettre dorée gradient
        const lg=ctx.createLinearGradient(0,-ts*.65,0,ts*.65);
        lg.addColorStop(0,  `hsl(52,100%,${Math.round(76+shim*13)}%)`);
        lg.addColorStop(0.4,`hsl(46,98%, ${Math.round(60+shim*10)}%)`);
        lg.addColorStop(0.8,'hsl(37,92%,47%)');
        lg.addColorStop(1,  'hsl(30,86%,37%)');
        ctx.fillStyle=lg; ctx.fillText(p.letter,0,0);
        ctx.restore();
      } else {
        // ── TONNEAU DK (rotation 360° axe vertical) ──
        const scx=Math.cos(p.rot);
        if(Math.abs(scx)>0.02){
          ctx.save();
          ctx.translate(p.x, p.y+Math.sin(p.bob)*1.8); ctx.scale(scx,1);
          const bw=s, bh=s*1.08;
          // Ombre
          ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(-bw+2,-bh+2,bw*2,bh*2);
          // Corps brun (gradient gauche→droite pour donner arrondi cylindrique)
          const bg=ctx.createLinearGradient(-bw,0,bw,0);
          bg.addColorStop(0,   'rgb(102,50,17)');
          bg.addColorStop(0.18,'rgb(162,92,42)');
          bg.addColorStop(0.5, 'rgb(178,105,50)');
          bg.addColorStop(0.82,'rgb(148,78,33)');
          bg.addColorStop(1,   'rgb(95,45,14)');
          ctx.fillStyle=bg; ctx.fillRect(-bw,-bh,bw*2,bh*2);
          // Grain de bois (lignes verticales légères)
          ctx.strokeStyle='rgba(72,32,8,0.32)'; ctx.lineWidth=0.85;
          for(let i=-2;i<=2;i++){
            if(i===0) continue;
            const lx=i*bw*.33;
            ctx.beginPath(); ctx.moveTo(lx,-bh); ctx.lineTo(lx+bw*.04,bh); ctx.stroke();
          }
          // Cerceaux noirs (haut, milieu, bas)
          const bnd=bh*.17; ctx.fillStyle='rgb(17,12,8)';
          ctx.fillRect(-bw,-bh,     bw*2,bnd);    // haut
          ctx.fillRect(-bw,-bnd*.5, bw*2,bnd);    // milieu
          ctx.fillRect(-bw,bh-bnd,  bw*2,bnd);    // bas
          // "DK" sur la face avant seulement
          if(scx>0){
            ctx.font=`bold ${Math.round(bw*.9)}px Impact, "Arial Black", sans-serif`;
            ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.strokeStyle='rgb(248,210,22)'; ctx.lineWidth=bw*.13; ctx.lineJoin='round';
            ctx.strokeText('DK',0,bh*.1);
            ctx.fillStyle='rgb(212,34,18)'; ctx.fillText('DK',0,bh*.1);
          }
          // Reflet de lumière (haut)
          const rg=ctx.createLinearGradient(-bw,-bh,0,-bh*.22);
          rg.addColorStop(0,'rgba(255,200,130,0.26)'); rg.addColorStop(1,'rgba(255,200,130,0)');
          ctx.fillStyle=rg; ctx.fillRect(-bw,-bh,bw*2,bh*.52);
          // Bordure extérieure
          ctx.strokeStyle='rgba(50,20,5,0.82)'; ctx.lineWidth=1.5;
          ctx.strokeRect(-bw,-bh,bw*2,bh*2);
          ctx.restore();
        }
      }
      ctx.restore(); ctx.globalAlpha=1;
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
  smario:      { type:'marioitem', count:50 },
  sdk:         { type:'dkitem',    count:40 },
  slink:       { type:'triforce',  count:50 },
  ssamus:      { type:'ring',      count:55 },
  sdsamus:     { type:'ring',      count:55 },
  syoshi:      { type:'petal',     count:50 },
  skirby:      { type:'star',      count:55 },
  sfox:        { type:'ring',      count:60 },
  spikachu:    { type:'bolt',      count:70 },
  sluigi:      { type:'ghost',     count:20 },
  sness:       { type:'aura',      count:45 },
  sfalcon:     { type:'flame',     count:100 },
  sjigglypuff: { type:'note',      count:40 },
  speach:      { type:'petal',     count:50 },
  sdaisy:      { type:'petal',     count:50 },
  sbowser:     { type:'flame',     count:110 },
  siceclimbers:{ type:'flake',     count:50 },
  ssheik:      { type:'kunai',     count:45 },
  szelda:      { type:'triforce',  count:45 },
  sdrmario:    { type:'pixel',     count:55 },
  spichu:      { type:'bolt',      count:65 },
  sfalco:      { type:'ring',      count:55 },
  smarth:      { type:'sparkle',   count:55 },
  slucina:     { type:'sparkle',   count:55 },
  sylink:      { type:'leaf',      count:40 },
  sganondorf:  { type:'aura',      count:40 },
  smewtwo:     { type:'aura',      count:40 },
  sroy:        { type:'flame',     count:100 },
  schrom:      { type:'sparkle',   count:55 },
  sgamewatch:  { type:'pixel',     count:55 },
  smetaknight: { type:'feather',   count:40 },
  spit:        { type:'feather',   count:40 },
  sdarkpit:    { type:'feather',   count:40 },
  szss:        { type:'ring',      count:55 },
  swario:      { type:'coin',      count:60 },
  ssnake:      { type:'ordnance',  count:22 },
  sike:        { type:'flame',     count:110 },
  spktrainer:  { type:'ring',      count:50 },
  sdiddy:      { type:'leaf',      count:40 },
  slucas:      { type:'aura',      count:40 },
  ssonic:      { type:'sonicring',  count:45 },
  sdedede:     { type:'star',      count:50 },
  solimar:     { type:'pikmin',    count:25 },
  slucario:    { type:'aura',      count:40 },
  srob:        { type:'ring',      count:55 },
  stoonlink:   { type:'leaf',      count:40 },
  swolf:       { type:'shuriken',  count:45 },
  svilager:    { type:'petal',     count:45 },
  smegaman:    { type:'pixel',     count:55 },
  swiifit:     { type:'ring',      count:50 },
  srosalina:   { type:'star',      count:55 },
  slittlemac:  { type:'ring',      count:55 },
  sgreninja:   { type:'shuriken',  count:45 },
  spalutena:   { type:'feather',   count:40 },
  spacman:     { type:'pixel',     count:60 },
  srobin:      { type:'rune',      count:40 },
  sshulk:      { type:'ring',      count:55 },
  sbowserjr:   { type:'smoke',     count:50 },
  sduckhunt:   { type:'feather',   count:40 },
  sryu:        { type:'ring',      count:55 },
  sken:        { type:'flame',     count:100 },
  scloud:      { type:'rune',      count:40 },
  scorrin:     { type:'feather',   count:40 },
  sbayonetta:  { type:'feather',   count:40 },
  sinkling:    { type:'ink',       count:45 },
  sridley:     { type:'flame',     count:110 },
  ssimon:      { type:'cross',     count:45 },
  srichter:    { type:'cross',     count:45 },
  skrool:      { type:'coin',      count:60 },
  sisabelle:   { type:'heart',     count:45 },
  sincineroar: { type:'flame',     count:110 },
  spiranha:    { type:'petal',     count:50 },
  sjoker:      { type:'shuriken',  count:45 },
  shero:       { type:'rune',      count:40 },
  sbanjo:      { type:'feather',   count:40 },
  sterry:      { type:'ring',      count:55 },
  sbyleth:     { type:'rune',      count:40 },
  sminmin:     { type:'spring',    count:45 },
  ssteve:      { type:'block',     count:45 },
  ssephiroth:  { type:'feather',   count:40 },
  spyra:       { type:'flame',     count:100 },
  smythra:     { type:'bolt',      count:65 },
  skazuya:     { type:'aura',      count:40 },
  ssora:       { type:'keyblade',  count:30 },
  smii_brawl:  { type:'ring',      count:50 },
  smii_sword:  { type:'sparkle',   count:50 },
  smii_gun:    { type:'ring',      count:50 },
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
   'rainbow', 'trans', 'pan', 'bi', 'lesbian', 'plage',
   'smario','sdk','slink','ssamus','sdsamus','syoshi','skirby','sfox','spikachu','sluigi',
   'sness','sfalcon','sjigglypuff','speach','sdaisy','sbowser','siceclimbers','ssheik','szelda','sdrmario',
   'spichu','sfalco','smarth','slucina','sylink','sganondorf','smewtwo','sroy','schrom','sgamewatch',
   'smetaknight','spit','sdarkpit','szss','swario','ssnake','sike','spktrainer','sdiddy','slucas',
   'ssonic','sdedede','solimar','slucario','srob','stoonlink','swolf','svilager','smegaman','swiifit',
   'srosalina','slittlemac','sgreninja','spalutena','spacman','srobin','sshulk','sbowserjr','sduckhunt','sryu',
   'sken','scloud','scorrin','sbayonetta','sinkling','sridley','ssimon','srichter','skrool','sisabelle',
   'sincineroar','spiranha','sjoker','shero','sbanjo','sterry','sbyleth','sminmin','ssteve','ssephiroth',
   'spyra','smythra','skazuya','ssora','smii_brawl','smii_sword','smii_gun'].forEach(t => {
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

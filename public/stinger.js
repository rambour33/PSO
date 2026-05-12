(function () {
  'use strict';

  const THEME_COLORS = {
    default:     { primary: '#E8B830', glow: 'rgba(232,184,48,0.55)',   accent: '#D4001A'  },
    cyberpunk:   { primary: '#00F5FF', glow: 'rgba(0,245,255,0.6)',     accent: '#FF2D78'  },
    synthwave:   { primary: '#FF6EC7', glow: 'rgba(255,110,199,0.6)',   accent: '#C77DFF'  },
    midnight:    { primary: '#4488FF', glow: 'rgba(68,136,255,0.55)',   accent: '#88AAFF'  },
    egypt:       { primary: '#D4A017', glow: 'rgba(212,160,23,0.6)',    accent: '#C0392B'  },
    city:        { primary: '#A0C4D8', glow: 'rgba(160,196,216,0.5)',   accent: '#5A8FAA'  },
    eco:         { primary: '#6BC96C', glow: 'rgba(107,201,108,0.55)',  accent: '#A8E063'  },
    water:       { primary: '#29B6F6', glow: 'rgba(41,182,246,0.55)',   accent: '#0288D1'  },
    fire:        { primary: '#FF6B00', glow: 'rgba(255,107,0,0.65)',    accent: '#FFD700'  },
    rainbow:     { primary: '#FF6EC7', glow: 'rgba(255,110,199,0.5)',   accent: '#00F5FF'  },
    trans:       { primary: '#55CDFC', glow: 'rgba(85,205,252,0.55)',   accent: '#F7A8B8'  },
    pan:         { primary: '#FF218C', glow: 'rgba(255,33,140,0.55)',   accent: '#FFD800'  },
    bi:          { primary: '#9B59D0', glow: 'rgba(155,89,208,0.55)',   accent: '#FF218C'  },
    lesbian:     { primary: '#FF4500', glow: 'rgba(255,69,0,0.55)',     accent: '#FF9A56'  },
    plage:       { primary: '#F4D35E', glow: 'rgba(244,211,94,0.55)',   accent: '#3CAEA3'  },
    smario:      { primary: '#E52222', glow: 'rgba(229,34,34,0.6)',     accent: '#FFD700'  },
    sdk:         { primary: '#7B3F00', glow: 'rgba(123,63,0,0.6)',      accent: '#E52222'  },
    slink:       { primary: '#D4A017', glow: 'rgba(212,160,23,0.6)',    accent: '#2E8B57'  },
    ssamus:      { primary: '#FF8C00', glow: 'rgba(255,140,0,0.6)',     accent: '#8B0000'  },
    sdsamus:     { primary: '#9400D3', glow: 'rgba(148,0,211,0.6)',     accent: '#FF8C00'  },
    syoshi:      { primary: '#6BC96C', glow: 'rgba(107,201,108,0.6)',   accent: '#E52222'  },
    skirby:      { primary: '#FF69B4', glow: 'rgba(255,105,180,0.6)',   accent: '#FFD700'  },
    sfox:        { primary: '#FF8C00', glow: 'rgba(255,140,0,0.6)',     accent: '#C0C0C0'  },
    spikachu:    { primary: '#FFD700', glow: 'rgba(255,215,0,0.65)',    accent: '#FF6600'  },
    sluigi:      { primary: '#4CAF50', glow: 'rgba(76,175,80,0.6)',     accent: '#9C27B0'  },
    ssonic:      { primary: '#1E90FF', glow: 'rgba(30,144,255,0.65)',   accent: '#E52222'  },
    sjoker:      { primary: '#E52222', glow: 'rgba(229,34,34,0.65)',    accent: '#FFD700'  },
    ssephiroth:  { primary: '#C0C0C0', glow: 'rgba(192,192,192,0.5)',   accent: '#8B0000'  },
    spyra:       { primary: '#FF4500', glow: 'rgba(255,69,0,0.6)',      accent: '#FFD700'  },
    smythra:     { primary: '#FFD700', glow: 'rgba(255,215,0,0.6)',     accent: '#FF8C00'  },
    sbayonetta:  { primary: '#6A0DAD', glow: 'rgba(106,13,173,0.6)',    accent: '#FFD700'  },
    sinkling:    { primary: '#FF6600', glow: 'rgba(255,102,0,0.6)',     accent: '#8B00FF'  },
    sridley:     { primary: '#9400D3', glow: 'rgba(148,0,211,0.6)',     accent: '#8B0000'  },
    sbyleth:     { primary: '#228B22', glow: 'rgba(34,139,34,0.6)',     accent: '#8B0000'  },
    sminmin:     { primary: '#E52222', glow: 'rgba(229,34,34,0.6)',     accent: '#1E90FF'  },
    skazuya:     { primary: '#8B0000', glow: 'rgba(139,0,0,0.65)',      accent: '#FFD700'  },
    ssora:       { primary: '#4169E1', glow: 'rgba(65,105,225,0.6)',    accent: '#FFD700'  },
    dual:        { primary: '#E8B830', glow: 'rgba(232,184,48,0.5)',    accent: '#D4001A'  },
    transparent: { primary: '#E8B830', glow: 'rgba(232,184,48,0.4)',    accent: '#D4001A'  },
  };

  const RAINBOW_BAR_COLORS = [
    '#FF0000','#FF4500','#FF8C00','#FFD700',
    '#88CC00','#00BB44','#00AACC','#4466FF',
    '#8833EE','#CC22AA','#FF2266','#FF0000',
  ];

  const THEME_BAR_COLORS = {
    rainbow: i => RAINBOW_BAR_COLORS[i % RAINBOW_BAR_COLORS.length],
    trans:   i => ['#55CDFC','#F7A8B8','#FFFFFF','#F7A8B8','#55CDFC'][i % 5],
    pan:     i => ['#FF218C','#FFD800','#21B1FF'][i % 3],
    bi:      i => ['#9B59D0','#9B59D0','#FF218C','#1E90FF','#1E90FF'][i % 5],
    lesbian: i => ['#FF4500','#FF9A56','#FFFFFF','#D462A6','#A50062'][i % 5],
  };

  const SPEEDS = {
    fast:   { dur: 320, stagger: 28, hold: 60  },
    normal: { dur: 420, stagger: 40, hold: 80  },
    slow:   { dur: 600, stagger: 55, hold: 120 },
  };

  const EASE_IN  = 'cubic-bezier(0.86, 0, 0.07, 1)';
  const EASE_OUT = 'cubic-bezier(0.19, 1, 0.22, 1)';

  let config  = { bars: 8, speed: 'normal', style: 'bars-h', logoUrl: '', logoSize: 200, bgImageUrl: '' };
  let theme   = 'default';
  let resolvedPrimary = THEME_COLORS.default.primary;
  let isPlaying = false;
  let barEls  = [];
  let logoNatW = 0, logoNatH = 0;

  /* ── Logo préchargement ──────────────────────────────────── */
  function preloadLogo(url) {
    return new Promise(resolve => {
      if (!url) { logoNatW = logoNatH = 0; resolve(); return; }
      const img = new Image();
      img.onload  = () => { logoNatW = img.naturalWidth; logoNatH = img.naturalHeight; resolve(); };
      img.onerror = () => { logoNatW = logoNatH = 0; resolve(); };
      img.src = url;
    });
  }

  function getLogoDisplaySize() {
    const h = config.logoSize || 200;
    if (!logoNatW || !logoNatH) return { w: h, h };
    return { w: Math.round(h * logoNatW / logoNatH), h };
  }

  /* Calcule le background CSS d'une barre pour afficher la tranche du logo.
     Les barres utilisent left:-8% / right:-8% (H) ou top:-8% / bottom:-8% (V)
     — la position du background est donc décalée de ce padding. */
  function getBarBg(i, isV, explicitColor) {
    const base     = explicitColor || resolvedPrimary;
    const logoUrl  = config.effectiveLogoUrl || config.logoUrl;
    const bgUrl    = config.bgImageUrl;

    const layers = [];

    if (logoUrl) {
      const PAD_H = 0.08 * 1920;
      const PAD_V = 0.08 * 1080;
      const { w: lw, h: lh } = getLogoDisplaySize();
      const n = Math.max(1, config.bars);
      const logoX = (1920 - lw) / 2;
      const logoY = (1080 - lh) / 2;
      let bgX, bgY;
      if (isV) {
        bgX = logoX - i * (1920 / n);
        bgY = logoY + PAD_V;
      } else {
        bgX = logoX + PAD_H;
        bgY = logoY - i * (1080 / n);
      }
      layers.push(`url('${logoUrl}') ${Math.round(bgX)}px ${Math.round(bgY)}px / ${lw}px ${lh}px no-repeat`);
    }

    if (bgUrl) {
      const n = Math.max(1, config.bars);
      const PAD_H = 0.08 * 1920;
      const PAD_V = 0.08 * 1080;
      let bgX, bgY;
      if (isV) {
        bgX = -(i * (1920 / n));
        bgY = PAD_V;
      } else {
        bgX = PAD_H;
        bgY = -(i * (1080 / n));
      }
      layers.push(`url('${bgUrl}') ${Math.round(bgX)}px ${Math.round(bgY)}px / 1920px 1080px no-repeat`);
    }

    layers.push(base);
    return layers.join(', ');
  }

  /* ── Image de fond ──────────────────────────────────────── */
  function applyBgImage() {
    const el = document.getElementById('stinger-bg');
    if (!el) return;
    el.style.backgroundImage = config.bgImageUrl ? `url('${config.bgImageUrl}')` : 'none';
  }

  /* ── Thème ───────────────────────────────────────────────── */
  function applyTheme(t) {
    theme = t || 'default';
    const c = THEME_COLORS[theme] || THEME_COLORS.default;
    resolvedPrimary = c.primary;
    const root = document.getElementById('stinger-root');
    root.style.setProperty('--st-primary', c.primary);
    root.style.setProperty('--st-glow',    c.glow);
    root.style.setProperty('--st-accent',  c.accent);
    root.className = 'theme-' + theme;
    recolorBars();
  }

  function recolorBars() {
    const isV    = config.style === 'bars-v';
    const colorFn = THEME_BAR_COLORS[theme];
    barEls.forEach((el, i) => {
      const explicit = colorFn ? colorFn(i) : null;
      el.style.background = getBarBg(i, isV, explicit);
    });
  }

  /* ── Construction des barres ──────────────────────────────── */
  function buildBars() {
    const container = document.getElementById('stinger-bars');
    container.innerHTML = '';
    barEls = [];

    if (config.style === 'flash') return;

    const isV = config.style === 'bars-v';
    const n   = Math.max(2, Math.min(20, config.bars || 8));

    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'st-bar';

      if (isV) {
        const w = 1920 / n;
        el.style.cssText = `width:${w}px;left:${i * w}px;top:-8%;bottom:-8%;transform:translateY(-120%) skewY(-8deg);`;
      } else {
        const h = 1080 / n;
        el.style.cssText = `height:${h}px;top:${i * h}px;left:-8%;right:-8%;transform:translateX(-120%) skewX(-8deg);`;
      }

      container.appendChild(el);
      barEls.push(el);
    }

    recolorBars();
  }

  /* ── Animation flash ─────────────────────────────────────── */
  function triggerFlash() {
    const sp    = SPEEDS[config.speed] || SPEEDS.normal;
    const flash = document.getElementById('stinger-flash');
    flash.style.transition = `opacity ${sp.dur * 0.4}ms ease-in`;
    flash.style.opacity    = '0.88';
    setTimeout(() => {
      flash.style.transition = `opacity ${sp.dur * 0.6}ms ease-out`;
      flash.style.opacity    = '0';
      setTimeout(() => { isPlaying = false; }, sp.dur * 0.6 + 50);
    }, sp.dur * 0.4 + sp.hold);
  }

  /* ── Animation barres ────────────────────────────────────── */
  function triggerBars() {
    const isV  = config.style === 'bars-v';
    const skew = isV ? 'skewY(-8deg)' : 'skewX(-8deg)';
    const sp   = SPEEDS[config.speed] || SPEEDS.normal;
    const n    = barEls.length;

    barEls.forEach((el, i) => {
      setTimeout(() => {
        el.style.transition = `transform ${sp.dur}ms ${EASE_IN}`;
        el.style.transform  = `${isV ? 'translateY' : 'translateX'}(0%) ${skew}`;
      }, i * sp.stagger);
    });

    const outStart = sp.dur + (n - 1) * sp.stagger + sp.hold;
    barEls.forEach((el, i) => {
      setTimeout(() => {
        el.style.transition = `transform ${sp.dur}ms ${EASE_OUT}`;
        el.style.transform  = `${isV ? 'translateY' : 'translateX'}(120%) ${skew}`;
      }, outStart + i * sp.stagger);
    });

    setTimeout(() => {
      const skewOff = isV ? 'skewY(-8deg)' : 'skewX(-8deg)';
      barEls.forEach(el => {
        el.style.transition = 'none';
        el.style.transform  = `${isV ? 'translateY' : 'translateX'}(-120%) ${skewOff}`;
      });
      isPlaying = false;
    }, outStart + sp.dur + (n - 1) * sp.stagger + 80);
  }

  /* ── Déclenchement ───────────────────────────────────────── */
  function effectiveLogo() { return config.effectiveLogoUrl || config.logoUrl || ''; }

  function trigger(incomingConfig) {
    if (incomingConfig) {
      const needRebuild = incomingConfig.bars             !== config.bars
                       || incomingConfig.style            !== config.style
                       || incomingConfig.effectiveLogoUrl !== config.effectiveLogoUrl
                       || incomingConfig.logoSize         !== config.logoSize;
      Object.assign(config, incomingConfig);
      if (needRebuild) { preloadLogo(effectiveLogo()).then(buildBars); return; }
    }
    if (isPlaying) return;
    isPlaying = true;
    if (config.style === 'flash') triggerFlash();
    else triggerBars();
  }

  /* ── Réseau ──────────────────────────────────────────────── */
  const socket = io();

  Promise.all([
    fetch('/api/state').then(r => r.json()).catch(() => ({})),
    fetch('/api/stinger').then(r => r.json()).catch(() => ({})),
  ]).then(([state, cfg]) => {
    Object.assign(config, cfg);
    applyTheme(state.overlayTheme || 'default');
    applyBgImage();
    preloadLogo(effectiveLogo()).then(buildBars);
  });

  socket.on('stateUpdate',    s   => applyTheme(s.overlayTheme || 'default'));
  socket.on('stingerConfig',  cfg => {
    const needRebuild = cfg.bars             !== config.bars
                      || cfg.style           !== config.style
                      || cfg.effectiveLogoUrl !== config.effectiveLogoUrl
                      || cfg.logoSize        !== config.logoSize
                      || cfg.bgImageUrl      !== config.bgImageUrl;
    Object.assign(config, cfg);
    applyBgImage();
    if (needRebuild) preloadLogo(effectiveLogo()).then(buildBars);
    else recolorBars();
  });
  socket.on('stingerTrigger', cfg => {
    const needRebuild = cfg && (cfg.bars !== config.bars || cfg.style !== config.style
                              || cfg.effectiveLogoUrl !== config.effectiveLogoUrl
                              || cfg.logoSize         !== config.logoSize);
    if (needRebuild) {
      Object.assign(config, cfg);
      preloadLogo(effectiveLogo()).then(() => { buildBars(); if (!isPlaying) { isPlaying = true; triggerBars(); } });
    } else {
      if (cfg) Object.assign(config, cfg);
      if (!isPlaying) { isPlaying = true; config.style === 'flash' ? triggerFlash() : triggerBars(); }
    }
  });

  function totalDuration() {
    if (config.style === 'flash') { const sp = SPEEDS[config.speed]||SPEEDS.normal; return sp.dur + sp.hold; }
    const sp = SPEEDS[config.speed] || SPEEDS.normal;
    return sp.dur * 2 + (config.bars - 1) * sp.stagger * 2 + sp.hold;
  }

  /* ── Prévisualisation auto (?preview=1) ──────────────────── */
  const params = new URLSearchParams(location.search);
  if (params.get('preview') === '1') {
    const loop = () => setTimeout(() => {
      if (!isPlaying) { isPlaying = true; config.style === 'flash' ? triggerFlash() : triggerBars(); }
      loop();
    }, totalDuration() + 1200);
    setTimeout(() => {
      isPlaying = true;
      config.style === 'flash' ? triggerFlash() : triggerBars();
      loop();
    }, 800);
  }

})();

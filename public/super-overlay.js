(function () {
  'use strict';

  const root    = document.getElementById('so-root');
  const bgEl    = document.getElementById('so-bg');
  const bgImgEl = document.getElementById('so-bg-img');

  // /super-overlay/N  →  fixed scene N (1-based in URL, 0-based internally)
  const m = window.location.pathname.match(/\/super-overlay\/(\d+)$/);
  const fixedIdx = m ? parseInt(m[1], 10) - 1 : null;

  /* ── Calques ──────────────────────────────────────────────────── */
  const layerEls = {};

  function getOrCreate(layer) {
    if (layerEls[layer.id]) return layerEls[layer.id];
    const el  = document.createElement('div');
    el.id     = 'so-layer-' + layer.id;
    el.className = 'so-layer so-hidden';
    const fr  = document.createElement('iframe');
    fr.src       = layer.url;
    fr.scrolling = 'no';
    fr.title     = layer.label || layer.id;
    el.appendChild(fr);
    root.appendChild(el);
    return (layerEls[layer.id] = el);
  }

  /* ── Appliquer une scène ──────────────────────────────────────── */
  function applyScene(scene) {
    if (!scene) return;

    // Fond couleur
    bgEl.style.background = (scene.bgColor && scene.bgColor !== 'transparent')
      ? scene.bgColor
      : 'transparent';

    // Fond image
    if (scene.bgImage) {
      const isTile = scene.bgImageMode === 'tile';
      bgImgEl.style.display          = 'block';
      bgImgEl.style.backgroundImage  = `url('${scene.bgImage}')`;
      bgImgEl.style.backgroundSize   = isTile ? 'auto'      : 'cover';
      bgImgEl.style.backgroundRepeat = isTile ? 'repeat'    : 'no-repeat';
      bgImgEl.style.mixBlendMode     = scene.bgImageBlend  || 'normal';
      bgImgEl.style.opacity          = (scene.bgImageOpacity ?? 100) / 100;
    } else {
      bgImgEl.style.display = 'none';
    }

    // Calques
    const active = new Set();
    const sorted = (scene.layers || []).slice().sort((a, b) => a.order - b.order);

    sorted.forEach((layer, i) => {
      const el = getOrCreate(layer);
      el.style.left   = (layer.x || 0) + 'px';
      el.style.top    = (layer.y || 0) + 'px';
      el.style.zIndex = i + 1;
      el.style.opacity = layer.visible ? (layer.opacity ?? 1) : 1;
      el.classList.toggle('so-hidden', !layer.visible);
      active.add(layer.id);
    });

    // Masquer les calques absents de la scène
    Object.keys(layerEls).forEach(id => {
      if (!active.has(id)) layerEls[id].classList.add('so-hidden');
    });
  }

  /* ── Socket ───────────────────────────────────────────────────── */
  const socket = io();

  if (fixedIdx !== null) {
    // Mode scène fixe : toujours afficher la scène N
    const fromFull = state => applyScene(state?.scenes?.[fixedIdx]);
    fetch('/api/super').then(r => r.json()).then(fromFull).catch(() => {});
    socket.on('superStateUpdate', fromFull);

  } else {
    // Mode scène active : suit la scène sélectionnée dans le Studio
    const fromFull  = state => applyScene(state?.scenes?.[state?.activeScene]);
    const fromScene = scene => applyScene(scene);
    fetch('/api/super').then(r => r.json()).then(fromFull).catch(() => {});
    socket.on('superUpdate',      fromScene);
    socket.on('superStateUpdate', fromFull);
  }

})();

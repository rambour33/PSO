(function () {
  'use strict';

  const root = document.getElementById('pso-root');

  // ── Création des 9 conteneurs de scène ───────────────────────
  const scenes = [];
  for (let i = 0; i < 9; i++) {
    const el    = document.createElement('div');
    const bgEl  = document.createElement('div');
    const bgImg = document.createElement('div');
    el.className    = 'pso-scene';
    el.id           = 'pso-scene-' + i;
    el.style.zIndex = i + 1;
    bgEl.className  = 'pso-scene-bg';
    bgImg.className = 'pso-scene-bgimg';
    el.appendChild(bgEl);
    el.appendChild(bgImg);
    root.appendChild(el);
    scenes.push({ el, bgEl, bgImg, layers: {} });
  }

  // ── Rendu d'un calque ─────────────────────────────────────────
  function getOrCreate(scene, layer) {
    if (scene.layers[layer.id]) return scene.layers[layer.id];
    const el = document.createElement('div');
    el.className = 'pso-layer pso-hidden';
    const fr = document.createElement('iframe');
    fr.src       = layer.url;
    fr.scrolling = 'no';
    fr.title     = layer.label || layer.id;
    el.appendChild(fr);
    scene.el.appendChild(el);
    return (scene.layers[layer.id] = el);
  }

  // ── Rendu d'une scène ─────────────────────────────────────────
  function applyScene(sceneData, scene) {
    if (!sceneData || !scene) return;

    // Fond couleur
    scene.bgEl.style.background = (sceneData.bgColor && sceneData.bgColor !== 'transparent')
      ? sceneData.bgColor : 'transparent';

    // Fond image
    if (sceneData.bgImage) {
      const isTile = sceneData.bgImageMode === 'tile';
      scene.bgImg.style.display          = 'block';
      scene.bgImg.style.backgroundImage  = `url('${sceneData.bgImage}')`;
      scene.bgImg.style.backgroundSize   = isTile ? 'auto'   : 'cover';
      scene.bgImg.style.backgroundRepeat = isTile ? 'repeat' : 'no-repeat';
      scene.bgImg.style.mixBlendMode     = sceneData.bgImageBlend || 'normal';
      scene.bgImg.style.opacity          = (sceneData.bgImageOpacity ?? 100) / 100;
    } else {
      scene.bgImg.style.display = 'none';
    }

    // Calques
    const active = new Set();
    const sorted = (sceneData.layers || []).slice().sort((a, b) => a.order - b.order);
    sorted.forEach((layer, i) => {
      const el = getOrCreate(scene, layer);
      el.style.left    = (layer.x || 0) + 'px';
      el.style.top     = (layer.y || 0) + 'px';
      el.style.zIndex  = i + 2;
      el.style.opacity = layer.visible ? (layer.opacity ?? 1) : 1;
      el.classList.toggle('pso-hidden', !layer.visible);
      active.add(layer.id);
    });

    Object.keys(scene.layers).forEach(id => {
      if (!active.has(id)) scene.layers[id].classList.add('pso-hidden');
    });
  }

  // ── Mise à jour de toutes les scènes ──────────────────────────
  function applyState(state) {
    if (!state || !state.scenes) return;
    state.scenes.forEach((sceneData, i) => {
      if (scenes[i]) applyScene(sceneData, scenes[i]);
    });
  }

  // ── Visibilité d'une scène ────────────────────────────────────
  function setVisible(idx, visible) {
    if (scenes[idx]) scenes[idx].el.style.display = visible ? 'block' : 'none';
  }

  // ── Socket ────────────────────────────────────────────────────
  const socket = io();

  // Contenu des scènes
  socket.on('superStateUpdate', applyState);

  // Visibilité contrôlée par le système de transitions
  socket.on('overlayShow', function (data) {
    const m = (data.id || '').match(/^custom-scene-(\d)$/);
    if (m) setVisible(parseInt(m[1]), true);
  });

  socket.on('overlayHide', function (data) {
    const m = (data.id || '').match(/^custom-scene-(\d)$/);
    if (m) setVisible(parseInt(m[1]), false);
  });

  socket.on('transitionsUpdate', function (states) {
    for (let i = 0; i < 9; i++) {
      const t = states['custom-scene-' + i];
      if (t !== undefined) setVisible(i, t.visible);
    }
  });

  // ── Init ──────────────────────────────────────────────────────
  socket.on('connect', function () {
    // Contenu
    fetch('/api/super').then(r => r.json()).then(applyState).catch(() => {});
    // Visibilité initiale
    fetch('/api/transitions').then(r => r.json()).then(function (states) {
      for (let i = 0; i < 9; i++) {
        const t = states['custom-scene-' + i];
        if (t) setVisible(i, t.visible);
      }
    }).catch(() => {});
  });

})();

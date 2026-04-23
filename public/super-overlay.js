/**
 * super-overlay.js
 * Empile les overlays PSO en calques iframes.
 *
 * Mode scène fixe  : URL /super-overlay/N  → affiche toujours la scène N
 * Mode scène active: URL /super-overlay    → suit la scène active du Studio
 */
(function () {
  'use strict';

  const root = document.getElementById('so-root');
  const bgEl = document.getElementById('so-bg');

  // Détecte si l'URL contient un numéro de scène (/super-overlay/3 → idx 2)
  const pathMatch     = window.location.pathname.match(/\/super-overlay\/(\d+)/);
  const fixedSceneIdx = pathMatch ? (parseInt(pathMatch[1], 10) - 1) : null;

  /* ── Créer / récupérer un calque ────────────────────────────── */
  function getOrCreate(layer) {
    let el = document.getElementById('so-layer-' + layer.id);
    if (!el) {
      el = document.createElement('div');
      el.id        = 'so-layer-' + layer.id;
      el.className = 'so-layer so-hidden';
      const iframe     = document.createElement('iframe');
      iframe.src       = layer.url;
      iframe.scrolling = 'no';
      iframe.title     = layer.label;
      el.appendChild(iframe);
      root.appendChild(el);
    }
    return el;
  }

  /* ── Appliquer l'état d'une scène ───────────────────────────── */
  function applyState(s) {
    if (bgEl) {
      bgEl.style.background = (s.bgColor && s.bgColor !== 'transparent')
        ? s.bgColor : 'transparent';
    }
    const sorted = (s.layers || []).slice().sort((a, b) => a.order - b.order);
    sorted.forEach((layer, idx) => {
      const el = getOrCreate(layer);
      el.style.left    = (layer.x || 0) + 'px';
      el.style.top     = (layer.y || 0) + 'px';
      el.style.zIndex  = idx;
      el.style.opacity = layer.visible ? (layer.opacity ?? 1) : 0;
      el.classList.toggle('so-hidden', !layer.visible);
    });
  }

  /* ── Socket.IO ───────────────────────────────────────────────── */
  const socket = io();

  if (fixedSceneIdx !== null) {
    /* Mode scène fixe : toujours afficher la scène N */
    function applyFromFullState(state) {
      const scene = state.scenes && state.scenes[fixedSceneIdx];
      if (scene) applyState(scene);
    }
    fetch('/api/super').then(r => r.json()).then(applyFromFullState).catch(() => {});
    socket.on('superStateUpdate', applyFromFullState);
  } else {
    /* Mode scène active : suit la scène sélectionnée dans le Studio */
    socket.on('superUpdate', s => {
      try { applyState(s); } catch (e) { console.error('[super-overlay]', e); }
    });
  }

})();

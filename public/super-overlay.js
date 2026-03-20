/**
 * super-overlay.js
 * Empile les overlays PSO en calques iframes.
 * Reçoit : superUpdate { bgColor, layers[] }
 */
(function () {
  'use strict';

  const root = document.getElementById('so-root');
  const bgEl = document.getElementById('so-bg');

  /* ── Créer / récupérer un calque ────────────────────────────── */
  function getOrCreate(layer) {
    let el = document.getElementById('so-layer-' + layer.id);
    if (!el) {
      el = document.createElement('div');
      el.id        = 'so-layer-' + layer.id;
      el.className = 'so-layer so-hidden';

      const iframe = document.createElement('iframe');
      iframe.src      = layer.url;
      iframe.scrolling = 'no';
      iframe.title     = layer.label;
      el.appendChild(iframe);
      root.appendChild(el);
    }
    return el;
  }

  /* ── Appliquer l'état ────────────────────────────────────────── */
  function applyState(s) {
    /* Fond */
    if (bgEl) {
      bgEl.style.background = (s.bgColor && s.bgColor !== 'transparent')
        ? s.bgColor
        : 'transparent';
    }

    /* Calques triés par order (bas = 0) */
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
  socket.on('superUpdate', s => {
    try { applyState(s); } catch (e) { console.error('[super-overlay]', e); }
  });

})();

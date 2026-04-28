/**
 * super-overlay.js
 * Empile les overlays PSO en calques iframes.
 *
 * Mode scène fixe  : URL /super-overlay/N  → affiche toujours la scène N
 * Mode scène active: URL /super-overlay    → suit la scène active du Studio
 */
(function () {
  'use strict';

  const root    = document.getElementById('so-root');
  const bgEl    = document.getElementById('so-bg');
  const bgImgEl = document.getElementById('so-bg-img');

  // Détecte si l'URL contient un numéro de scène (/super-overlay/3 → idx 2)
  const pathMatch     = window.location.pathname.match(/\/super-overlay\/(\d+)/);
  const fixedSceneIdx = pathMatch ? (parseInt(pathMatch[1], 10) - 1) : null;

  /* ── Système de particules ───────────────────────────────────── */
  const PS = (typeof createParticleSystem === 'function')
    ? createParticleSystem('so-particle-canvas', 'so-root')
    : null;

  let _currentTheme = 'default';

  function applyParticles(s) {
    if (!PS) return;
    const enabled = s.bgParticlesEnabled === true;
    if (!enabled) { if (PS.type) PS.stop(); return; }

    const tp = (window.THEME_PARTICLES || {})[_currentTheme];
    if (!tp) { if (PS.type) PS.stop(); return; }

    if (tp.type !== PS.type) PS.start(tp.type, tp.count);
    PS.setOpacity((s.bgParticlesOpacity ?? 100) / 100);
    PS.setCountScale((s.bgParticlesCount ?? 100) / 100);
  }

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
    if (bgImgEl) {
      if (s.bgImage) {
        const isImg = s.bgImageMode === 'image';
        bgImgEl.style.display            = 'block';
        bgImgEl.style.backgroundImage    = `url('${s.bgImage}')`;
        bgImgEl.style.backgroundSize     = isImg ? 'cover' : 'auto';
        bgImgEl.style.backgroundRepeat   = isImg ? 'no-repeat' : 'repeat';
        bgImgEl.style.backgroundPosition = 'center';
        bgImgEl.style.mixBlendMode       = s.bgImageBlend || 'normal';
        bgImgEl.style.opacity            = (s.bgImageOpacity ?? 100) / 100;
      } else {
        bgImgEl.style.display = 'none';
        bgImgEl.style.backgroundImage = '';
      }
    }
    applyParticles(s);
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

  // Suivi du thème actif (pour les particules)
  let _lastSceneState = null;
  socket.on('stateUpdate', ms => {
    if (!ms || !ms.overlayTheme) return;
    _currentTheme = ms.overlayTheme;
    if (_lastSceneState) applyParticles(_lastSceneState);
  });

  if (fixedSceneIdx !== null) {
    /* Mode scène fixe : toujours afficher la scène N */
    function applyFromFullState(state) {
      const scene = state.scenes && state.scenes[fixedSceneIdx];
      if (scene) { _lastSceneState = scene; applyState(scene); }
    }
    fetch('/api/super').then(r => r.json()).then(applyFromFullState).catch(() => {});
    fetch('/api/state').then(r => r.json()).then(ms => { if (ms) _currentTheme = ms.overlayTheme || 'default'; }).catch(() => {});
    socket.on('superStateUpdate', applyFromFullState);
  } else {
    /* Mode scène active : suit la scène sélectionnée dans le Studio */
    fetch('/api/state').then(r => r.json()).then(ms => { if (ms) _currentTheme = ms.overlayTheme || 'default'; }).catch(() => {});
    socket.on('superUpdate', s => {
      try { _lastSceneState = s; applyState(s); } catch (e) { console.error('[super-overlay]', e); }
    });
  }

})();

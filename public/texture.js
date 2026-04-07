/**
 * texture.js — texture de fond des overlays PSO
 * Injecte un div de texture à l'intérieur de chaque .pso-surface,
 * sans toucher aux zones transparentes autour des overlays.
 */
(function () {
  var TEXTURE_CLASS = 'pso-texture-layer';

  function injectLayers() {
    document.querySelectorAll('.pso-surface').forEach(function (el) {
      if (el.querySelector('.' + TEXTURE_CLASS)) return; // déjà injecté
      var div = document.createElement('div');
      div.className = TEXTURE_CLASS;
      div.style.cssText = [
        'position:absolute',
        'inset:0',
        'pointer-events:none',
        'z-index:0',
        'background-position:0 0',
        'opacity:0',
        'transition:opacity 0.4s',
      ].join(';');
      el.insertBefore(div, el.firstChild);
      // S'assurer que le conteneur est en position relative
      var pos = getComputedStyle(el).position;
      if (pos === 'static') el.style.position = 'relative';
    });
  }

  function apply(s) {
    var layers = document.querySelectorAll('.' + TEXTURE_CLASS);
    if (!layers.length) return;

    if (!s || !s.overlayTexture) {
      layers.forEach(function (d) {
        d.style.opacity = '0';
        d.style.backgroundImage = 'none';
      });
      return;
    }

    var size  = s.overlayTextureSize  || 'repeat';
    var blend = s.overlayTextureBlend || 'normal';
    var op    = s.overlayTextureOpacity != null ? s.overlayTextureOpacity : 50;

    layers.forEach(function (d) {
      d.style.backgroundImage = 'url(' + s.overlayTexture + ')';
      d.style.mixBlendMode    = blend;
      d.style.opacity         = (op / 100).toFixed(2);

      if (size === 'cover' || size === 'contain') {
        d.style.backgroundSize     = size;
        d.style.backgroundRepeat   = 'no-repeat';
        d.style.backgroundPosition = 'center';
      } else {
        d.style.backgroundSize     = 'auto';
        d.style.backgroundRepeat   = 'repeat';
        d.style.backgroundPosition = '0 0';
      }
    });
  }

  // Injecter dès que le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLayers);
  } else {
    injectLayers();
  }

  // État initial + mises à jour live
  fetch('/api/state')
    .then(function (r) { return r.json(); })
    .then(function (s) { injectLayers(); apply(s); })
    .catch(function () {});

  var socket = io();
  socket.on('stateUpdate', apply);
})();

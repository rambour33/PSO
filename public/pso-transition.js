/**
 * pso-transition.js
 * Moteur d'animations entrée / sortie pour les overlays PSO.
 *
 * Chaque overlay déclare sa config via window.PSO_T :
 *   window.PSO_T = { id: 'scoreboard', root: '#scoreboard' }
 *
 * Le reste (animIn, animOut, dur, visible) vient du serveur via /api/transitions/:id
 */
(function () {
  'use strict';

  const cfg = window.PSO_T || {};
  const overlayId = cfg.id;
  if (!overlayId) return;

  const rootSel = cfg.root || 'body';

  /* Correspondance type → noms keyframe */
  const KEYFRAMES = {
    'fade':        { in: 'pso-in-fade',        out: 'pso-out-fade'        },
    'slide-up':    { in: 'pso-in-slide-up',    out: 'pso-out-slide-up'    },
    'slide-down':  { in: 'pso-in-slide-down',  out: 'pso-out-slide-down'  },
    'slide-left':  { in: 'pso-in-slide-left',  out: 'pso-out-slide-left'  },
    'slide-right': { in: 'pso-in-slide-right', out: 'pso-out-slide-right' },
    'scale':       { in: 'pso-in-scale',       out: 'pso-out-scale'       },
    'zoom':        { in: 'pso-in-zoom',        out: 'pso-out-zoom'        },
    'blur':        { in: 'pso-in-blur',        out: 'pso-out-blur'        },
  };

  function getEl() {
    return document.querySelector(rootSel) || document.body;
  }

  function runAnim(el, kf, dur, ease, onEnd) {
    el.style.animation = 'none';
    el.offsetHeight; // force reflow pour redémarrer l'anim
    el.style.animation = kf + ' ' + dur + 'ms ' + ease + ' forwards';
    if (onEnd) {
      el.addEventListener('animationend', onEnd, { once: true });
    }
  }

  function show(animIn, dur) {
    const el = getEl();
    el.style.pointerEvents = '';
    const kf = (KEYFRAMES[animIn] || KEYFRAMES['fade']).in;
    runAnim(el, kf, dur, 'cubic-bezier(0.22,1,0.36,1)');
  }

  function hide(animOut, dur) {
    const el = getEl();
    const kf = (KEYFRAMES[animOut] || KEYFRAMES['fade']).out;
    runAnim(el, kf, dur, 'ease-in', function () {
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    });
  }

  /* ── Initialisation ────────────────────────────────── */
  let _animIn  = 'fade';
  let _animOut = 'fade';
  let _dur     = 500;

  function applyServerCfg(data) {
    _animIn  = data.animIn  || 'fade';
    _animOut = data.animOut || 'fade';
    _dur     = data.dur     ?? 500;

    if (data.visible === false) {
      const el = getEl();
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      el.style.animation = 'none';
    } else {
      const el = getEl();
      el.style.opacity = '';
      el.style.pointerEvents = '';
    }
  }

  /* ── Socket ────────────────────────────────────────── */
  function connectSocket() {
    if (typeof io === 'undefined') return;
    const socket = io();

    socket.on('overlayShow', function (data) {
      if (data.id !== overlayId) return;
      _animIn  = data.animIn  || _animIn;
      _animOut = data.animOut || _animOut;
      _dur     = data.dur     ?? _dur;
      show(_animIn, _dur);
    });

    socket.on('overlayHide', function (data) {
      if (data.id !== overlayId) return;
      _animIn  = data.animIn  || _animIn;
      _animOut = data.animOut || _animOut;
      _dur     = data.dur     ?? _dur;
      hide(_animOut, _dur);
    });

    socket.on('transitionsUpdate', function (all) {
      if (all[overlayId]) applyServerCfg(all[overlayId]);
    });
  }

  /* Charge l'état initial depuis le serveur */
  fetch('/api/transitions/' + overlayId)
    .then(function (r) { return r.json(); })
    .then(applyServerCfg)
    .catch(function () {});

  /* La socket est initialisée après le DOMContentLoaded ou immédiatement */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connectSocket);
  } else {
    connectSocket();
  }
})();

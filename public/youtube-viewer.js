/**
 * youtube-viewer.js
 * Overlay standalone compteur de viewers YouTube.
 * Reçoit : stateUpdate (thème) + youtube-viewers (viewers/live)
 */
(function () {
  'use strict';

  let prevCount = null;

  function formatViewers(n) {
    if (n === null || n === undefined) return '–';
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1).replace('.0', '') + 'k';
    return String(n);
  }

  function updateViewers({ viewers, live }) {
    const overlay   = document.getElementById('viewer-overlay');
    const number    = document.getElementById('viewer-number');
    const liveLabel = document.getElementById('live-label');

    overlay.classList.toggle('live',    !!live);
    overlay.classList.toggle('offline', !live);
    liveLabel.textContent = live ? 'EN DIRECT' : 'HORS LIGNE';

    const formatted = formatViewers(viewers);
    if (number.textContent !== formatted) {
      number.textContent = formatted;
      if (prevCount !== null) {
        number.classList.remove('pop');
        void number.offsetWidth;
        number.classList.add('pop');
      }
    }
    prevCount = viewers;
  }

  const socket = io();
  socket.on('youtube-viewers', (data) => {
    try { updateViewers(data); } catch(e) { console.error('[yt-viewer]', e); }
  });

})();

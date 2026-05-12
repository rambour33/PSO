(function () {
  'use strict';

  const root = document.getElementById('ss-root');
  const wrappers = [];

  for (let i = 0; i < 9; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ss-scene';
    wrapper.id = 'ss-scene-' + i;
    wrapper.style.display = 'none';

    const iframe = document.createElement('iframe');
    iframe.src = '/super-overlay/' + (i + 1);
    iframe.scrolling = 'no';
    iframe.title = 'Scène ' + (i + 1);
    iframe.loading = 'eager';

    wrapper.appendChild(iframe);
    root.appendChild(wrapper);
    wrappers.push(wrapper);
  }

  function setVisible(idx, visible) {
    const el = wrappers[idx];
    if (el) el.style.display = visible ? 'block' : 'none';
  }

  const socket = io();

  socket.on('overlayShow', function (data) {
    const m = (data.id || '').match(/^custom-scene-(\d)$/);
    if (m) setVisible(parseInt(m[1]), true);
  });

  socket.on('overlayHide', function (data) {
    const m = (data.id || '').match(/^custom-scene-(\d)$/);
    if (m) setVisible(parseInt(m[1]), false);
  });

  socket.on('transitionsUpdate', function (states) {
    for (var i = 0; i < 9; i++) {
      var t = states['custom-scene-' + i];
      if (t !== undefined) setVisible(i, t.visible);
    }
  });

  socket.on('connect', function () {
    fetch('/api/transitions').then(function (r) { return r.json(); }).then(function (states) {
      for (var i = 0; i < 9; i++) {
        var t = states['custom-scene-' + i];
        if (t) setVisible(i, t.visible);
      }
    }).catch(function () {});
  });

})();

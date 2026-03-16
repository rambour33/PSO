// ─── Flag Picker ──────────────────────────────────────────────────────────────

(function () {
  // Country code → French name via browser Intl API
  const countryNames = new Intl.DisplayNames(['fr'], { type: 'region' });

  function getCountryName(code) {
    try { return countryNames.of(code); } catch { return code; }
  }

  let flagsData = []; // [{ code, files[] }]

  // ── Load flag index ──────────────────────────────────────────────────────────

  async function loadFlags() {
    try {
      const res = await fetch('/api/flags');
      flagsData = await res.json();
    } catch (e) {
      console.warn('flag-picker: impossible de charger les drapeaux', e);
    }
  }

  // ── Picker factory ───────────────────────────────────────────────────────────

  function setupPicker(playerNum) {
    const searchEl  = document.getElementById(`p${playerNum}-flag-search`);
    const dropEl    = document.getElementById(`p${playerNum}-flag-dropdown`);
    const hiddenEl  = document.getElementById(`p${playerNum}-flag`);
    const previewEl = document.getElementById(`p${playerNum}-flag-preview`);
    const clearBtn  = document.getElementById(`p${playerNum}-flag-clear`);
    if (!searchEl) return;

    function hideDrop() { dropEl.style.display = 'none'; dropEl.innerHTML = ''; }

    function selectFlag(path) {
      hiddenEl.value = path;
      if (path) {
        previewEl.src = '/' + path;
        previewEl.style.display = 'block';
        // Extract file label for the search box
        const parts = path.split('/');
        const file  = parts[parts.length - 1].replace('.png', '');
        const country = parts[1] || '';
        searchEl.value = `[${country}] ${file}`;
      } else {
        previewEl.src = '';
        previewEl.style.display = 'none';
        searchEl.value = '';
      }
      hideDrop();
      // Notify control.js
      searchEl.dispatchEvent(new Event('flagchange', { bubbles: true }));
      if (typeof buildStateFromForm === 'function' && typeof emitState === 'function') {
        emitState(buildStateFromForm());
      }
    }

    function renderDrop(countries) {
      dropEl.innerHTML = '';
      if (!countries.length) {
        dropEl.innerHTML = '<div class="flag-drop-empty">Aucun résultat</div>';
        dropEl.style.display = 'block';
        return;
      }
      countries.forEach(({ code, files }) => {
        const name = getCountryName(code);

        const section = document.createElement('div');
        section.className = 'flag-drop-section';

        const header = document.createElement('div');
        header.className = 'flag-drop-header';
        header.textContent = `${code} — ${name}`;
        section.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'flag-drop-grid';

        files.forEach(file => {
          const path = `state_flag/${code}/${file}`;
          const img = document.createElement('img');
          img.src = '/' + path;
          img.className = 'flag-drop-img';
          img.title = `${code} / ${file.replace('.png', '')}`;
          img.loading = 'lazy';
          img.addEventListener('mousedown', ev => {
            ev.preventDefault();
            selectFlag(path);
          });
          grid.appendChild(img);
        });

        section.appendChild(grid);
        dropEl.appendChild(section);
      });
      dropEl.style.display = 'block';
    }

    searchEl.addEventListener('focus', () => {
      const q = searchEl.value.trim();
      // If nothing typed yet, don't open until user types
      if (q && !q.startsWith('[')) showFiltered(q);
    });

    searchEl.addEventListener('input', () => {
      const q = searchEl.value.trim().toLowerCase();
      if (!q) { hideDrop(); return; }
      showFiltered(q);
    });

    function showFiltered(q) {
      const filtered = flagsData.filter(({ code }) => {
        const name = getCountryName(code).toLowerCase();
        return code.toLowerCase().includes(q) || name.includes(q);
      });
      renderDrop(filtered);
    }

    searchEl.addEventListener('keydown', e => {
      if (e.key === 'Escape') hideDrop();
    });

    clearBtn.addEventListener('click', () => selectFlag(''));

    document.addEventListener('click', e => {
      const wrap = document.getElementById(`p${playerNum}-flag-wrap`);
      if (wrap && !wrap.contains(e.target)) hideDrop();
    });
  }

  // ── Restore flag from saved state ────────────────────────────────────────────

  window.flagPickerRestore = function (playerNum, path) {
    const hiddenEl  = document.getElementById(`p${playerNum}-flag`);
    const previewEl = document.getElementById(`p${playerNum}-flag-preview`);
    const searchEl  = document.getElementById(`p${playerNum}-flag-search`);
    if (!hiddenEl) return;
    hiddenEl.value = path || '';
    if (path) {
      previewEl.src = '/' + path;
      previewEl.style.display = 'block';
      const parts = path.split('/');
      const file  = parts[parts.length - 1].replace('.png', '');
      const country = parts[1] || '';
      searchEl.value = `[${country}] ${file}`;
    } else {
      previewEl.src = '';
      previewEl.style.display = 'none';
      searchEl.value = '';
    }
  };

  // ── Init ─────────────────────────────────────────────────────────────────────

  loadFlags().then(() => {
    setupPicker(1);
    setupPicker(2);
  });

})();

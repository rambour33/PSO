/* ── Éléments libres — overlay transparent indépendant ──────────── */

/* Config de chaque élément :
   - key       : identifiant unique
   - el        : référence DOM
   - apply(s)  : met à jour le contenu depuis matchState
   - applySize : applique la taille (fontSize ou width selon le type)
*/

const ELEMENTS = {

  // ── Joueur 1 ────────────────────────────────────────────────────
  p1char: {
    el: null,
    apply(s) {
      const img = document.getElementById('sel-p1char-img');
      if (!img) return;
      const c = s.player1?.character;
      if (c) {
        const color = String(s.player1?.stockColor ?? 0).padStart(2, '0');
        const name  = c.name.replace(/\s*\/\s*/g, '-');
        img.src = `/full/chara_1_${name}_${color}.png`;
        img.style.display = 'block';
        img.onerror = () => {
          img.src = `/full/chara_1_${name}_00.png`;
          img.onerror = () => { img.style.display = 'none'; };
        };
      } else {
        img.style.display = 'none';
      }
    },
    applySize(w) {
      const img = document.getElementById('sel-p1char-img');
      if (img) img.style.width = w + 'px';
    },
  },

  p1flag: {
    el: null,
    apply(s) {
      const img = document.getElementById('sel-p1flag-img');
      if (!img) return;
      const f = s.player1?.flag;
      if (f) { img.src = '/' + f; img.style.display = 'block'; }
      else    { img.style.display = 'none'; }
    },
    applySize(w) {
      const img = document.getElementById('sel-p1flag-img');
      if (img) img.style.width = w + 'px';
    },
  },

  p1tag: {
    el: null,
    apply(s) {
      if (this.el) {
        this.el.textContent = s.player1?.tag || '';
        this.el.style.color = s.tagColor || '#E8B830';
      }
    },
    applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; },
  },

  p1name: {
    el: null,
    apply(s) {
      if (this.el) {
        this.el.textContent = s.player1?.name || '';
        this.el.style.color = s.nameColor || '#F0EEF8';
      }
    },
    applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; },
  },

  p1pronouns: {
    el: null,
    apply(s) {
      if (this.el) {
        this.el.textContent = s.player1?.pronouns || '';
        this.el.style.color = s.pronounsColor || '#8888aa';
      }
    },
    applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; },
  },

  p1seed: {
    el: null,
    apply(s) {
      if (this.el) {
        const seed = s.player1?.seeding;
        this.el.textContent = seed != null ? `#${seed}` : '';
      }
    },
    applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; },
  },

  p1score: {
    el: null,
    apply(s) {
      if (this.el) {
        this.el.textContent = String(s.player1?.score ?? 0);
        this.el.style.color = s.player1?.color || '#E83030';
        this.el.style.textShadow = `0 0 30px ${s.player1?.color || '#E83030'}, 0 3px 12px rgba(0,0,0,0.9)`;
      }
    },
    applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; },
  },

  // ── Joueur 2 ────────────────────────────────────────────────────
  p2char: {
    el: null,
    apply(s) {
      const img = document.getElementById('sel-p2char-img');
      if (!img) return;
      const c = s.player2?.character;
      if (c) {
        const color = String(s.player2?.stockColor ?? 0).padStart(2, '0');
        const name  = c.name.replace(/\s*\/\s*/g, '-');
        img.src = `/full/chara_1_${name}_${color}.png`;
        img.style.display = 'block';
        img.onerror = () => {
          img.src = `/full/chara_1_${name}_00.png`;
          img.onerror = () => { img.style.display = 'none'; };
        };
      } else {
        img.style.display = 'none';
      }
    },
    applySize(w) {
      const img = document.getElementById('sel-p2char-img');
      if (img) img.style.width = w + 'px';
    },
  },

  p2flag: {
    el: null,
    apply(s) {
      const img = document.getElementById('sel-p2flag-img');
      if (!img) return;
      const f = s.player2?.flag;
      if (f) { img.src = '/' + f; img.style.display = 'block'; }
      else    { img.style.display = 'none'; }
    },
    applySize(w) {
      const img = document.getElementById('sel-p2flag-img');
      if (img) img.style.width = w + 'px';
    },
  },

  p2tag: {
    el: null,
    apply(s) {
      if (this.el) {
        this.el.textContent = s.player2?.tag || '';
        this.el.style.color = s.tagColor || '#E8B830';
      }
    },
    applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; },
  },

  p2name: {
    el: null,
    apply(s) {
      if (this.el) {
        this.el.textContent = s.player2?.name || '';
        this.el.style.color = s.nameColor || '#F0EEF8';
      }
    },
    applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; },
  },

  p2pronouns: {
    el: null,
    apply(s) {
      if (this.el) {
        this.el.textContent = s.player2?.pronouns || '';
        this.el.style.color = s.pronounsColor || '#8888aa';
      }
    },
    applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; },
  },

  p2seed: {
    el: null,
    apply(s) {
      if (this.el) {
        const seed = s.player2?.seeding;
        this.el.textContent = seed != null ? `#${seed}` : '';
      }
    },
    applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; },
  },

  p2score: {
    el: null,
    apply(s) {
      if (this.el) {
        this.el.textContent = String(s.player2?.score ?? 0);
        this.el.style.color = s.player2?.color || '#3070E8';
        this.el.style.textShadow = `0 0 30px ${s.player2?.color || '#3070E8'}, 0 3px 12px rgba(0,0,0,0.9)`;
      }
    },
    applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; },
  },

  // ── Infos match ─────────────────────────────────────────────────
  event: {
    el: null,
    apply(s) { if (this.el) this.el.textContent = s.event || ''; },
    applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; },
  },

  phase: {
    el: null,
    apply(s) { if (this.el) this.el.textContent = s.stage || ''; },
    applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; },
  },

  format: {
    el: null,
    apply(s) { if (this.el) this.el.textContent = s.format || ''; },
    applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; },
  },
};

/* ── Init DOM refs ──────────────────────────────────────────────── */

const DOM_MAP = {
  p1char: 'sel-p1char', p1flag: 'sel-p1flag', p1tag: 'sel-p1tag',
  p1name: 'sel-p1name', p1pronouns: 'sel-p1pronouns', p1seed: 'sel-p1seed',
  p1score: 'sel-p1score',
  p2char: 'sel-p2char', p2flag: 'sel-p2flag', p2tag: 'sel-p2tag',
  p2name: 'sel-p2name', p2pronouns: 'sel-p2pronouns', p2seed: 'sel-p2seed',
  p2score: 'sel-p2score',
  event: 'sel-event', phase: 'sel-phase', format: 'sel-format',
};

for (const [key, id] of Object.entries(DOM_MAP)) {
  ELEMENTS[key].el = document.getElementById(id);
}

/* ── État courant ────────────────────────────────────────────────── */

let matchState = null;
let elState    = null;

/* ── Applique les positions / visibilités ────────────────────────── */

function applyElState(s) {
  if (!s) return;
  elState = s;

  const root = document.getElementById('sel-root');
  if (root) root.style.opacity = s.visible === false ? '0' : '1';

  const els = s.elements || {};
  for (const [key, conf] of Object.entries(els)) {
    const def = ELEMENTS[key];
    if (!def?.el) continue;

    // Position : centré sur (x, y)
    def.el.style.left = (conf.x ?? 0) + 'px';
    def.el.style.top  = (conf.y ?? 0) + 'px';

    // Visibilité
    def.el.classList.toggle('hidden', conf.visible === false);

    // Taille
    if (conf.size != null) def.applySize(conf.size);
  }
}

/* ── Applique le contenu depuis matchState ───────────────────────── */

function applyMatchState(s) {
  if (!s) return;
  matchState = s;
  for (const def of Object.values(ELEMENTS)) {
    def.apply(matchState);
  }
}

/* ── Chargement initial ──────────────────────────────────────────── */

fetch('/api/elements-overlay').then(r => r.json()).then(applyElState).catch(() => {});
fetch('/api/state').then(r => r.json()).then(applyMatchState).catch(() => {});

/* ── Socket ──────────────────────────────────────────────────────── */

try {
  const socket = io();
  socket.on('elementsOverlayUpdate', applyElState);
  socket.on('stateUpdate', applyMatchState);
} catch(e) {}

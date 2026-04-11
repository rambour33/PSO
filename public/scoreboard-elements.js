/* ── Éléments libres — overlay transparent indépendant ──────────── */

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

  // Contenu seulement — les couleurs viennent des CSS vars du thème
  p1tag:      { el: null, apply(s) { if (this.el) this.el.textContent = s.player1?.tag      || ''; }, applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; } },
  p1name:     { el: null, apply(s) { if (this.el) this.el.textContent = s.player1?.name     || ''; }, applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; } },
  p1pronouns: { el: null, apply(s) { if (this.el) this.el.textContent = s.player1?.pronouns || ''; }, applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; } },
  p1seed:     { el: null, apply(s) { if (this.el) { const v = s.player1?.seeding; this.el.textContent = v != null ? `#${v}` : ''; } }, applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; } },
  p1score:    { el: null, apply(s) { if (this.el) this.el.textContent = String(s.player1?.score ?? 0); }, applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; } },

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

  p2tag:      { el: null, apply(s) { if (this.el) this.el.textContent = s.player2?.tag      || ''; }, applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; } },
  p2name:     { el: null, apply(s) { if (this.el) this.el.textContent = s.player2?.name     || ''; }, applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; } },
  p2pronouns: { el: null, apply(s) { if (this.el) this.el.textContent = s.player2?.pronouns || ''; }, applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; } },
  p2seed:     { el: null, apply(s) { if (this.el) { const v = s.player2?.seeding; this.el.textContent = v != null ? `#${v}` : ''; } }, applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; } },
  p2score:    { el: null, apply(s) { if (this.el) this.el.textContent = String(s.player2?.score ?? 0); }, applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; } },

  // ── Infos match ─────────────────────────────────────────────────
  event:  { el: null, apply(s) { if (this.el) this.el.textContent = s.event  || ''; }, applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; } },
  phase:  { el: null, apply(s) { if (this.el) this.el.textContent = s.stage  || ''; }, applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; } },
  format: { el: null, apply(s) { if (this.el) this.el.textContent = s.format || ''; }, applySize(sz) { if (this.el) this.el.style.fontSize = sz + 'px'; } },
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

/* ── Mode élément unique (?el=xxx) ──────────────────────────────── */

const SINGLE_KEY = new URLSearchParams(location.search).get('el') || null;

/* ── État courant ────────────────────────────────────────────────── */

let matchState = null;
let elState    = null;

/* ── Applique le thème via CSS vars sur #sel-root ───────────────── */

function applyThemeVars(s) {
  const root = document.getElementById('sel-root');
  if (!root) return;

  const theme    = s.overlayTheme || 'default';
  const isCustom = theme === 'custom';
  const ct       = (isCustom && s.customTheme) ? s.customTheme : {};

  // ── Couleurs de texte ──────────────────────────────────────────
  // Pour le thème custom, ct.nameColor etc. priment sur s.nameColor
  root.style.setProperty('--sel-tag-color',    ct.tagColor      || s.tagColor      || '#E8B830');
  root.style.setProperty('--sel-name-color',   ct.nameColor     || s.nameColor     || '#F0EEF8');
  root.style.setProperty('--sel-pron-color',   ct.pronounsColor || s.pronounsColor || '#5A5A7A');
  root.style.setProperty('--sel-event-color',  ct.eventColor    || s.eventTextColor || '#EAB830');
  root.style.setProperty('--sel-event-size',  (s.eventTextSize  || 12) + 'px');

  // ── Couleurs joueurs ───────────────────────────────────────────
  // custom theme peut avoir ses propres p1Color/p2Color
  const p1c = (isCustom && ct.p1Color) ? ct.p1Color : (s.player1?.color || '#E83030');
  const p2c = (isCustom && ct.p2Color) ? ct.p2Color : (s.player2?.color || '#3070E8');
  // custom theme peut avoir une scoreColor unique (même pour les deux scores)
  const scoreColor = isCustom && ct.scoreColor ? ct.scoreColor : null;
  root.style.setProperty('--sel-p1-color',  scoreColor || p1c);
  root.style.setProperty('--sel-p2-color',  scoreColor || p2c);
  root.style.setProperty('--sel-p1-glow',   scoreColor || p1c);
  root.style.setProperty('--sel-p2-glow',   scoreColor || p2c);

  // ── Police & taille (thème custom uniquement) ──────────────────
  if (isCustom && ct.fontFamily) {
    root.style.setProperty('--sel-font',    `'${ct.fontFamily}', 'Russo One', sans-serif`);
    // Chargement Google Font si nécessaire
    if (ct.fontFamily !== 'Russo One') {
      let lnk = document.getElementById('sel-gfont');
      const fp  = ct.fontFamily.replace(/ /g, '+');
      const url = `https://fonts.googleapis.com/css2?family=${fp}:wght@400;700&display=swap`;
      if (!lnk) {
        lnk = document.createElement('link');
        lnk.id = 'sel-gfont'; lnk.rel = 'stylesheet';
        document.head.appendChild(lnk);
      }
      if (lnk.href !== url) lnk.href = url;
    }
  } else {
    root.style.removeProperty('--sel-font');
  }

  if (isCustom && ct.nameFontSize) {
    root.style.setProperty('--sel-name-size', ct.nameFontSize + 'px');
  } else {
    root.style.removeProperty('--sel-name-size');
  }

  if (isCustom && ct.letterSpacing != null) {
    root.style.setProperty('--sel-letter-spacing', ct.letterSpacing + 'px');
  } else {
    root.style.removeProperty('--sel-letter-spacing');
  }

  // ── Taille du tag (si le thème custom a un nameFontSize, le tag est légèrement plus petit) ──
  if (isCustom && ct.nameFontSize) {
    root.style.setProperty('--sel-tag-size', Math.round(ct.nameFontSize * 0.7) + 'px');
  } else {
    root.style.removeProperty('--sel-tag-size');
  }
}

/* ── Applique les positions / visibilités ────────────────────────── */

function applyElState(s) {
  if (!s) return;
  elState = s;

  if (!SINGLE_KEY) {
    const root = document.getElementById('sel-root');
    if (root) root.style.opacity = s.visible === false ? '0' : '1';
  }

  const els = s.elements || {};
  for (const [key, conf] of Object.entries(els)) {
    const def = ELEMENTS[key];
    if (!def?.el) continue;

    if (SINGLE_KEY) {
      def.el.classList.toggle('hidden', key !== SINGLE_KEY);
    } else {
      def.el.classList.toggle('hidden', conf.visible === false);
    }

    def.el.style.left = (conf.x ?? 0) + 'px';
    def.el.style.top  = (conf.y ?? 0) + 'px';

    if (conf.size != null) def.applySize(conf.size);
  }
}

/* ── Applique le contenu + thème depuis matchState ──────────────── */

function applyMatchState(s) {
  if (!s) return;
  matchState = s;
  applyThemeVars(s);
  for (const def of Object.values(ELEMENTS)) {
    def.apply(s);
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

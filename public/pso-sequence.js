/**
 * pso-sequence.js — Moteur de séquence PSO
 * Affiche des éléments un par un avec animations entrée/sortie.
 *
 * Usage :
 *   const player = new PSOSequencePlayer(id => root.querySelector(`[data-id="${id}"]`));
 *   player.play(seq);   // seq = { items, animIn, animOut, transitionDur, hold, loop }
 *   player.stop();
 */
class PSOSequencePlayer {
  constructor(getEl) {
    this._getEl   = getEl;
    this._timer   = null;
    this._running = false;
    this._seq     = null;
    this._idx     = 0;
  }

  /* ── Keyframe maps ──────────────────────────────────────── */
  static _KF_IN = {
    'fade':        'pso-in-fade',
    'slide-up':    'pso-in-slide-up',
    'slide-down':  'pso-in-slide-down',
    'slide-left':  'pso-in-slide-left',
    'slide-right': 'pso-in-slide-right',
    'scale':       'pso-in-scale',
    'zoom':        'pso-in-zoom',
    'blur':        'pso-in-blur',
  };
  static _KF_OUT = {
    'fade':        'pso-out-fade',
    'slide-up':    'pso-out-slide-up',
    'slide-down':  'pso-out-slide-down',
    'slide-left':  'pso-out-slide-left',
    'slide-right': 'pso-out-slide-right',
    'scale':       'pso-out-scale',
    'zoom':        'pso-out-zoom',
    'blur':        'pso-out-blur',
  };

  /* ── Helpers ────────────────────────────────────────────── */
  _kfIn(type)  { return PSOSequencePlayer._KF_IN[type]  || 'pso-in-fade'; }
  _kfOut(type) { return PSOSequencePlayer._KF_OUT[type] || 'pso-out-fade'; }

  _setHidden(el) {
    el.style.animation    = 'none';
    el.style.opacity      = '0';
    el.style.pointerEvents = 'none';
  }

  _hideAll() {
    (this._seq?.items || []).forEach(item => {
      const el = this._getEl(item.shapeId);
      if (el) this._setHidden(el);
    });
  }

  /* ── Animation helper ───────────────────────────────────── */
  _animate(el, kf, dur, ease) {
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = `${kf} ${dur}ms ${ease} forwards`;
  }

  /* ── Main step ──────────────────────────────────────────── */
  _step() {
    if (!this._running || !this._seq) return;
    const seq   = this._seq;
    const items = seq.items || [];

    if (this._idx >= items.length) {
      if (seq.loop !== false) { this._idx = 0; this._step(); }
      else { this._running = false; }
      return;
    }

    const item = items[this._idx];
    const animIn  = item.animIn       || seq.animIn       || 'fade';
    const animOut = item.animOut      || seq.animOut      || 'fade';
    const dur     = item.transitionDur ?? seq.transitionDur ?? 500;
    const hold    = item.hold          ?? seq.hold          ?? 3000;

    const el = this._getEl(item.shapeId);
    if (!el) {
      this._idx++;
      this._step();
      return;
    }

    /* Entrée */
    el.style.opacity       = '';
    el.style.pointerEvents = '';
    this._animate(el, this._kfIn(animIn), dur, 'cubic-bezier(0.22,1,0.36,1)');

    /* Attente → sortie → suivant */
    this._timer = setTimeout(() => {
      if (!this._running) return;
      this._animate(el, this._kfOut(animOut), dur, 'ease-in');
      el.addEventListener('animationend', () => {
        if (!this._running) return;
        this._setHidden(el);
        this._idx++;
        if (this._idx >= items.length) {
          if (seq.loop !== false) { this._idx = 0; this._step(); }
          else { this._running = false; }
        } else {
          this._step();
        }
      }, { once: true });
    }, hold);
  }

  /* ── Public API ─────────────────────────────────────────── */
  play(seq) {
    this.stop();
    if (!seq || !(seq.items?.length)) return;
    this._seq     = seq;
    this._running = true;
    this._idx     = 0;
    this._hideAll();
    this._step();
  }

  stop() {
    this._running = false;
    clearTimeout(this._timer);
    this._timer = null;
    if (this._seq) this._hideAll();
    this._seq = null;
    this._idx = 0;
  }

  get running()      { return this._running; }
  get currentSeqId() { return this._seq?.id ?? null; }
}

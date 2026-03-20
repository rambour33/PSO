const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const RULESETS_FILE      = path.join(__dirname, 'data', 'rulesets.json');
const THEME_PRESETS_FILE = path.join(__dirname, 'data', 'theme-presets.json');

function loadThemePresets() {
  try {
    if (!fs.existsSync(THEME_PRESETS_FILE)) return [];
    return JSON.parse(fs.readFileSync(THEME_PRESETS_FILE, 'utf8'));
  } catch { return []; }
}

function saveThemePresets(list) {
  fs.writeFileSync(THEME_PRESETS_FILE, JSON.stringify(list, null, 2));
}

function loadRulesets() {
  try {
    if (!fs.existsSync(path.dirname(RULESETS_FILE))) {
      fs.mkdirSync(path.dirname(RULESETS_FILE), { recursive: true });
    }
    if (!fs.existsSync(RULESETS_FILE)) return [];
    return JSON.parse(fs.readFileSync(RULESETS_FILE, 'utf8'));
  } catch { return []; }
}

function saveRulesets(list) {
  fs.writeFileSync(RULESETS_FILE, JSON.stringify(list, null, 2));
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json({ limit: '25mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── State ────────────────────────────────────────────────────────────────────

let matchState = {
  player1: { name: 'PLAYER 1', score: 0, character: null, color: '#E83030', tag: '', pronouns: '', stockColor: 0, flag: '', flagOffsetX: 0, flagOffsetY: 0 },
  player2: { name: 'PLAYER 2', score: 0, character: null, color: '#3070E8', tag: '', pronouns: '', stockColor: 0, flag: '', flagOffsetX: 0, flagOffsetY: 0 },
  format: 'Bo3',
  customWins: 2,
  event: 'TOURNAMENT',
  stage: 'Grand Final',
  currentStage: '',
  centerLogo: '',
  swapped: false,
  overlayStyle: 'full',
  sbBgColor: '#0E0E12',
  sbBgOpacity: 100,
  eventTextSize: 12,
  eventTextColor: '#EAB830',
  tagColor: '#E8B830',
  nameColor: '#F0EEF8',
  pronounsColor: '#5A5A7A',
  overlayTheme: 'default',
  logoParticleCount: 3,
  particleOpacity: 100,
  particleCountScale: 100,
  particlesEnabled: true,
  visible: true,
  sbScale: 100,
  sbX: 0,
  sbY: 0,
  transparentPositions: {
    event:  { x: 720,  y: 0  },
    p1Icon: { x: 631,  y: 28 },
    p1Name: { x: 724,  y: 50 },
    score:  { x: 886,  y: 28 },
    p2Name: { x: 1056, y: 50 },
    p2Icon: { x: 1222, y: 28 },
  }
};

let characterList = [
  { id: 'mario',           name: 'Mario',               image: '' },
  { id: 'donkey_kong',     name: 'Donkey Kong',          image: '' },
  { id: 'link',            name: 'Link',                 image: '' },
  { id: 'samus',           name: 'Samus',                image: '' },
  { id: 'dark_samus',      name: 'Dark Samus',           image: '' },
  { id: 'yoshi',           name: 'Yoshi',                image: '' },
  { id: 'kirby',           name: 'Kirby',                image: '' },
  { id: 'fox',             name: 'Fox',                  image: '' },
  { id: 'pikachu',         name: 'Pikachu',              image: '' },
  { id: 'luigi',           name: 'Luigi',                image: '' },
  { id: 'ness',            name: 'Ness',                 image: '' },
  { id: 'captain_falcon',  name: 'Captain Falcon',       image: '' },
  { id: 'jigglypuff',      name: 'Jigglypuff',           image: '' },
  { id: 'peach',           name: 'Peach',                image: '' },
  { id: 'daisy',           name: 'Daisy',                image: '' },
  { id: 'bowser',          name: 'Bowser',               image: '' },
  { id: 'ice_climbers',    name: 'Ice Climbers',         image: '' },
  { id: 'sheik',           name: 'Sheik',                image: '' },
  { id: 'zelda',           name: 'Zelda',                image: '' },
  { id: 'dr_mario',        name: 'Dr. Mario',            image: '' },
  { id: 'pichu',           name: 'Pichu',                image: '' },
  { id: 'falco',           name: 'Falco',                image: '' },
  { id: 'marth',           name: 'Marth',                image: '' },
  { id: 'lucina',          name: 'Lucina',               image: '' },
  { id: 'young_link',      name: 'Young Link',           image: '' },
  { id: 'ganondorf',       name: 'Ganondorf',            image: '' },
  { id: 'mewtwo',          name: 'Mewtwo',               image: '' },
  { id: 'roy',             name: 'Roy',                  image: '' },
  { id: 'chrom',           name: 'Chrom',                image: '' },
  { id: 'mr_game_watch',   name: 'Mr. Game & Watch',     image: '' },
  { id: 'meta_knight',     name: 'Meta Knight',          image: '' },
  { id: 'pit',             name: 'Pit',                  image: '' },
  { id: 'dark_pit',        name: 'Dark Pit',             image: '' },
  { id: 'zero_suit_samus', name: 'Zero Suit Samus',      image: '' },
  { id: 'wario',           name: 'Wario',                image: '' },
  { id: 'snake',           name: 'Snake',                image: '' },
  { id: 'ike',             name: 'Ike',                  image: '' },
  { id: 'pokemon_trainer', name: 'Pokémon Trainer',      image: '' },
  { id: 'diddy_kong',      name: 'Diddy Kong',           image: '' },
  { id: 'lucas',           name: 'Lucas',                image: '' },
  { id: 'sonic',           name: 'Sonic',                image: '' },
  { id: 'king_dedede',     name: 'King Dedede',          image: '' },
  { id: 'olimar',          name: 'Olimar',               image: '' },
  { id: 'lucario',         name: 'Lucario',              image: '' },
  { id: 'rob',             name: 'R.O.B.',               image: '' },
  { id: 'toon_link',       name: 'Toon Link',            image: '' },
  { id: 'wolf',            name: 'Wolf',                 image: '' },
  { id: 'villager',        name: 'Villager',             image: '' },
  { id: 'mega_man',        name: 'Mega Man',             image: '' },
  { id: 'wii_fit_trainer', name: 'Wii Fit Trainer',      image: '' },
  { id: 'rosalina',        name: 'Rosalina & Luma',      image: '' },
  { id: 'little_mac',      name: 'Little Mac',           image: '' },
  { id: 'greninja',        name: 'Greninja',             image: '' },
  { id: 'mii_brawler',     name: 'Mii Brawler',          image: '' },
  { id: 'mii_swordfighter',name: 'Mii Swordfighter',     image: '' },
  { id: 'mii_gunner',      name: 'Mii Gunner',           image: '' },
  { id: 'palutena',        name: 'Palutena',             image: '' },
  { id: 'pac_man',         name: 'Pac-Man',              image: '' },
  { id: 'robin',           name: 'Robin',                image: '' },
  { id: 'shulk',           name: 'Shulk',                image: '' },
  { id: 'bowser_jr',       name: 'Bowser Jr.',           image: '' },
  { id: 'duck_hunt',       name: 'Duck Hunt',            image: '' },
  { id: 'ryu',             name: 'Ryu',                  image: '' },
  { id: 'ken',             name: 'Ken',                  image: '' },
  { id: 'cloud',           name: 'Cloud',                image: '' },
  { id: 'corrin',          name: 'Corrin',               image: '' },
  { id: 'bayonetta',       name: 'Bayonetta',            image: '' },
  { id: 'inkling',         name: 'Inkling',              image: '' },
  { id: 'ridley',          name: 'Ridley',               image: '' },
  { id: 'simon',           name: 'Simon',                image: '' },
  { id: 'richter',         name: 'Richter',              image: '' },
  { id: 'king_k_rool',     name: 'King K. Rool',         image: '' },
  { id: 'isabelle',        name: 'Isabelle',             image: '' },
  { id: 'incineroar',      name: 'Incineroar',           image: '' },
  { id: 'piranha_plant',   name: 'Piranha Plant',        image: '' },
  { id: 'joker',           name: 'Joker',                image: '' },
  { id: 'hero',            name: 'Hero',                 image: '' },
  { id: 'banjo_kazooie',   name: 'Banjo & Kazooie',      image: '' },
  { id: 'terry',           name: 'Terry',                image: '' },
  { id: 'byleth',          name: 'Byleth',               image: '' },
  { id: 'min_min',         name: 'Min Min',              image: '' },
  { id: 'steve',           name: 'Steve',                image: '' },
  { id: 'sephiroth',       name: 'Sephiroth',            image: '' },
  { id: 'pyra_mythra',     name: 'Pyra-Mythra',          image: '' },
  { id: 'kazuya',          name: 'Kazuya',               image: '' },
  { id: 'sora',            name: 'Sora',                 image: '' },
];

let rulesetState = {
  stages: [],
  banPatternGame1: '2-2',
  banPatternGame2: '1',
  firstBanner: 1,
  stageClause: false,
};

let castersState = {
  visible: false,
  layout: 'row',
  bgColor: '#0E0E12',
  bgOpacity: 100,
  casters: [
    { name: '', twitter: '', twitch: '', youtube: '' },
    { name: '', twitter: '', twitch: '', youtube: '' },
  ],
};

let playerStatsState = {
  visible: false,
  playerName: '',
  playerTag: '',
  playerColor: '#E8B830',
  eventName: '',
  wins: 0,
  losses: 0,
  topCharacters: [],  // [{ name, image, games }]
  allMatches: [],   // [{ round, opponentName, opponentTag, result, score, opponentScore }]
  nextMatch: null,  // { round, opponentName, opponentTag, state } ou null
};

// ─── Veto helpers ─────────────────────────────────────────────────────────────

function generateVetoSequence(pattern, firstBanner) {
  const seq = [];
  const parts = String(pattern).split('-').map(n => parseInt(n)).filter(n => n > 0);
  let current = firstBanner === 2 ? 2 : 1;
  for (const count of parts) {
    for (let i = 0; i < count; i++) {
      seq.push({ action: 'ban', player: current, mapId: null });
    }
    current = current === 1 ? 2 : 1;
  }
  seq.push({ action: 'decider', player: 0, mapId: null });
  return seq;
}

function makeVetoState(gameNumber = 1, playedStageIds = [], visible = true) {
  const pattern = gameNumber === 1 ? rulesetState.banPatternGame1 : rulesetState.banPatternGame2;
  const stages = rulesetState.stages
    .filter(s => !rulesetState.stageClause || !playedStageIds.includes(s.id))
    .map(s => ({ ...s, status: 'available' }));
  return {
    stages,
    sequence: generateVetoSequence(pattern, rulesetState.firstBanner),
    currentStep: 0,
    player1Name: matchState.player1.name,
    player2Name: matchState.player2.name,
    player1Color: matchState.player1.color,
    player2Color: matchState.player2.color,
    banPatternGame1: rulesetState.banPatternGame1,
    banPatternGame2: rulesetState.banPatternGame2,
    firstBanner: rulesetState.firstBanner,
    stageClause: rulesetState.stageClause,
    gameNumber,
    playedStageIds,
    done: false,
    visible,
  };
}

let vetoState = makeVetoState();

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/', (req, res) => res.redirect('/control'));
app.get('/overlay', (req, res) => res.sendFile(path.join(__dirname, 'public', 'overlay.html')));
app.get('/overlay-slim', (req, res) => res.redirect('/overlay'));
app.get('/stageveto', (req, res) => res.sendFile(path.join(__dirname, 'public', 'stageveto.html')));
app.get('/casters', (req, res) => res.sendFile(path.join(__dirname, 'public', 'casters.html')));
app.get('/control', (req, res) => res.sendFile(path.join(__dirname, 'public', 'control.html')));
app.get('/vs-screen', (req, res) => res.sendFile(path.join(__dirname, 'public', 'vs-screen.html')));
app.get('/player-stats', (req, res) => res.sendFile(path.join(__dirname, 'public', 'player-stats.html')));
app.get('/twitch-layout', (req, res) => res.sendFile(path.join(__dirname, 'public', 'twitch-layout.html')));
app.get('/twitch-viewer', (req, res) => res.sendFile(path.join(__dirname, 'public', 'twitch-viewer.html')));
app.get('/ticker', (req, res) => res.sendFile(path.join(__dirname, 'public', 'ticker.html')));
app.get('/frames', (req, res) => res.sendFile(path.join(__dirname, 'public', 'frames.html')));
app.get('/stream-title',  (req, res) => res.sendFile(path.join(__dirname, 'public', 'stream-title.html')));
app.get('/super-overlay', (req, res) => res.sendFile(path.join(__dirname, 'public', 'super-overlay.html')));

// ─── Titre du stream ──────────────────────────────────────────────────────────

let titleState = {
  visible:     false,
  title:       '',
  subtitle:    '',
  tag:         'LIVE',
  showTag:     false,
  showSubtitle:true,
  position:    'tl',      // tl, tc, tr, ml, mc, mr, bl, bc, br, custom
  x:           60,
  y:           60,
  maxWidth:    700,
  fontSize:    38,
  fontSizeSub: 17,
  bgOpacity:   94,        // 0-100
  animation:   'slide',   // slide, drop, bounce, fade, none
  align:       'left',    // left, center, right
};

app.get('/api/title', (req, res) => res.json(titleState));

app.post('/api/title', (req, res) => {
  const bools   = ['visible','showTag','showSubtitle'];
  const numbers = ['x','y','maxWidth','fontSize','fontSizeSub','bgOpacity'];
  const strings = ['title','subtitle','tag','position','animation','align'];
  bools.forEach(k   => { if (req.body[k] !== undefined) titleState[k] = !!req.body[k]; });
  numbers.forEach(k => { if (req.body[k] !== undefined) titleState[k] = Number(req.body[k]); });
  strings.forEach(k => { if (req.body[k] !== undefined) titleState[k] = String(req.body[k]); });
  io.emit('titleUpdate', titleState);
  res.json({ ok: true });
});

// ─── Super Overlay ──────────────────────────────────────────────────────────────

let superState = {
  bgColor: 'transparent',
  layers: [
    { id: 'overlay',            label: 'Overlay principal',  url: '/overlay',            visible: false, x: 0, y: 0, opacity: 1.0, order: 0  },
    { id: 'stageveto',          label: 'Stage Veto',         url: '/stageveto',          visible: false, x: 0, y: 0, opacity: 1.0, order: 1  },
    { id: 'casters',            label: 'Casters',            url: '/casters',            visible: false, x: 0, y: 0, opacity: 1.0, order: 2  },
    { id: 'vs-screen',          label: 'VS Screen',          url: '/vs-screen',          visible: false, x: 0, y: 0, opacity: 1.0, order: 3  },
    { id: 'player-stats',       label: 'Stats joueurs',      url: '/player-stats',       visible: false, x: 0, y: 0, opacity: 1.0, order: 4  },
    { id: 'twitch-layout',      label: 'Twitch Layout',      url: '/twitch-layout',      visible: false, x: 0, y: 0, opacity: 1.0, order: 5  },
    { id: 'twitch-viewer',      label: 'Viewers Twitch',     url: '/twitch-viewer',      visible: false, x: 0, y: 0, opacity: 1.0, order: 6  },
    { id: 'ticker',             label: 'Bandeau',            url: '/ticker',             visible: false, x: 0, y: 0, opacity: 1.0, order: 7  },
    { id: 'frames',             label: 'Cadres',             url: '/frames',             visible: false, x: 0, y: 0, opacity: 1.0, order: 8  },
    { id: 'h2h',                label: 'H2H',                url: '/h2h',                visible: false, x: 0, y: 0, opacity: 1.0, order: 9  },
    { id: 'tournament-history', label: 'Historique tournoi', url: '/tournament-history', visible: false, x: 0, y: 0, opacity: 1.0, order: 10 },
    { id: 'stream-title',       label: 'Titre du stream',   url: '/stream-title',       visible: false, x: 0, y: 0, opacity: 1.0, order: 11 },
  ],
};

app.get('/api/super', (req, res) => res.json(superState));

app.post('/api/super', (req, res) => {
  const { bgColor, layers } = req.body;
  if (bgColor !== undefined) superState.bgColor = String(bgColor);
  if (Array.isArray(layers)) {
    layers.forEach(incoming => {
      const t = superState.layers.find(l => l.id === incoming.id);
      if (!t) return;
      if (incoming.visible  !== undefined) t.visible  = !!incoming.visible;
      if (incoming.x        !== undefined) t.x        = Number(incoming.x);
      if (incoming.y        !== undefined) t.y        = Number(incoming.y);
      if (incoming.opacity  !== undefined) t.opacity  = Math.max(0, Math.min(1, Number(incoming.opacity)));
      if (incoming.order    !== undefined) t.order    = Number(incoming.order);
    });
  }
  io.emit('superUpdate', superState);
  res.json({ ok: true });
});

// ─── Cadres (multi-frame overlay) ─────────────────────────────────────────────

let framesState = {
  count: 1,
  frames: [
    { visible: true, x: 40,  y: 40,  width: 560, height: 420, label: '', showBg: false },
    { visible: true, x: 640, y: 40,  width: 560, height: 420, label: '', showBg: false },
    { visible: true, x: 640, y: 500, width: 560, height: 420, label: '', showBg: false },
  ],
};

app.get('/api/frames', (req, res) => res.json(framesState));

app.post('/api/frames', (req, res) => {
  const { count, frames } = req.body;
  if (count !== undefined) framesState.count = Math.max(1, Math.min(3, Number(count)));
  if (Array.isArray(frames)) {
    frames.forEach((f, i) => {
      if (!framesState.frames[i]) return;
      const t = framesState.frames[i];
      if (f.visible  !== undefined) t.visible  = !!f.visible;
      if (f.x        !== undefined) t.x        = Number(f.x);
      if (f.y        !== undefined) t.y        = Number(f.y);
      if (f.width    !== undefined) t.width    = Math.max(50, Number(f.width));
      if (f.height   !== undefined) t.height   = Math.max(50, Number(f.height));
      if (f.label    !== undefined) t.label    = String(f.label).slice(0, 40);
      if (f.showBg   !== undefined) t.showBg   = !!f.showBg;
    });
  }
  io.emit('framesUpdate', framesState);
  res.json({ ok: true });
});

// ─── Ticker (bandeau défilant) ─────────────────────────────────────────────────

let tickerState = {
  visible:   false,
  position:  'bottom',   // 'top' | 'bottom'
  label:     'INFO',
  separator: '◆',
  speed:     80,          // px/s
  messages:  [],
};

app.get('/api/ticker', (req, res) => res.json(tickerState));

app.post('/api/ticker', (req, res) => {
  const { visible, position, label, separator, speed, messages } = req.body;
  if (visible   !== undefined) tickerState.visible   = !!visible;
  if (position  !== undefined) tickerState.position  = position;
  if (label     !== undefined) tickerState.label     = String(label).slice(0, 20);
  if (separator !== undefined) tickerState.separator = String(separator).slice(0, 8);
  if (speed     !== undefined) tickerState.speed     = Math.max(20, Math.min(400, Number(speed)));
  if (messages  !== undefined) tickerState.messages  = (Array.isArray(messages) ? messages : []).map(m => String(m).trim()).filter(Boolean);
  io.emit('tickerUpdate', tickerState);
  res.json({ ok: true });
});

// ─── Twitch Viewers ────────────────────────────────────────────────────────────

let twitchState = {
  channel: '',
  clientId: '',
  clientSecret: '',
  viewers: null,      // null = hors ligne / inconnu
  live: false,
  _token: null,
  _tokenExpiry: 0,
};

async function twitchGetToken() {
  if (twitchState._token && Date.now() < twitchState._tokenExpiry - 60000) {
    return twitchState._token;
  }
  const { clientId, clientSecret } = twitchState;
  if (!clientId || !clientSecret) throw new Error('Identifiants Twitch manquants');
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`,
    { method: 'POST' }
  );
  const data = await res.json();
  if (!data.access_token) throw new Error('Token Twitch invalide : ' + JSON.stringify(data));
  twitchState._token = data.access_token;
  twitchState._tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return twitchState._token;
}

async function twitchFetchViewers() {
  const { channel, clientId } = twitchState;
  if (!channel || !clientId) return;
  try {
    const token = await twitchGetToken();
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(channel)}`,
      { headers: { 'Client-Id': clientId, 'Authorization': `Bearer ${token}` } }
    );
    const data = await res.json();
    const stream = data.data && data.data[0];
    const viewers = stream ? stream.viewer_count : null;
    const live    = !!stream;
    if (viewers !== twitchState.viewers || live !== twitchState.live) {
      twitchState.viewers = viewers;
      twitchState.live    = live;
      io.emit('twitch-viewers', { viewers, live, channel });
    }
  } catch (e) {
    console.error('[twitch viewers]', e.message);
  }
}

let _twitchInterval = null;

function twitchStartPolling() {
  if (_twitchInterval) clearInterval(_twitchInterval);
  twitchFetchViewers();
  _twitchInterval = setInterval(twitchFetchViewers, 60000);
}

// Routes config Twitch
app.get('/api/twitch/config', (req, res) => {
  const cfg = getConfig();
  res.json({
    channel:      cfg.twitchChannel      || '',
    clientId:     cfg.twitchClientId     || '',
    hasSecret:    !!cfg.twitchClientSecret,
    viewers:      twitchState.viewers,
    live:         twitchState.live,
  });
});

app.post('/api/twitch/config', (req, res) => {
  const { channel, clientId, clientSecret } = req.body;
  const cfg = getConfig();
  if (channel    !== undefined) { cfg.twitchChannel      = channel;      twitchState.channel      = channel; }
  if (clientId   !== undefined) { cfg.twitchClientId     = clientId;     twitchState.clientId     = clientId; }
  if (clientSecret !== undefined && clientSecret !== '') {
    cfg.twitchClientSecret = clientSecret;
    twitchState.clientSecret = clientSecret;
  }
  twitchState._token       = null; // reset token
  twitchState._tokenExpiry = 0;
  saveConfig(cfg);
  if (twitchState.channel && twitchState.clientId && twitchState.clientSecret) {
    twitchStartPolling();
  }
  res.json({ ok: true });
});

// Initialisation au démarrage
(function () {
  const cfg = getConfig();
  twitchState.channel      = cfg.twitchChannel      || '';
  twitchState.clientId     = cfg.twitchClientId     || '';
  twitchState.clientSecret = cfg.twitchClientSecret || '';
  if (twitchState.channel && twitchState.clientId && twitchState.clientSecret) {
    twitchStartPolling();
  }
})();

app.get('/api/casters', (req, res) => res.json(castersState));

app.get('/api/player-stats', (req, res) => res.json(playerStatsState));
app.post('/api/player-stats', (req, res) => {
  playerStatsState = { ...playerStatsState, ...req.body };
  io.emit('playerStatsUpdate', playerStatsState);
  res.json(playerStatsState);
});

app.get('/api/state', (req, res) => res.json(matchState));
app.post('/api/state', (req, res) => {
  matchState = { ...matchState, ...req.body };
  io.emit('stateUpdate', matchState);
  res.json(matchState);
});

app.get('/api/veto', (req, res) => res.json(vetoState));
app.post('/api/veto', (req, res) => {
  vetoState = { ...vetoState, ...req.body };
  io.emit('vetoUpdate', vetoState);
  res.json(vetoState);
});
app.post('/api/veto/reset', (req, res) => {
  vetoState = makeVetoState();
  io.emit('vetoUpdate', vetoState);
  res.json(vetoState);
});

app.get('/api/characters', (req, res) => res.json(characterList));
app.post('/api/characters', (req, res) => {
  characterList = req.body;
  io.emit('characterUpdate', characterList);
  res.json(characterList);
});

app.get('/api/ruleset', (req, res) => res.json(rulesetState));
app.post('/api/ruleset', (req, res) => {
  rulesetState = { ...rulesetState, ...req.body };
  vetoState = makeVetoState();
  io.emit('rulesetUpdate', rulesetState);
  io.emit('vetoUpdate', vetoState);
  res.json(rulesetState);
});

app.get('/api/rulesets/saved', (req, res) => res.json(loadRulesets()));

app.post('/api/rulesets/saved', (req, res) => {
  const { name, ruleset } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const list = loadRulesets().filter(r => r.name !== name);
  list.push({ name, ruleset });
  saveRulesets(list);
  res.json(list);
});

app.delete('/api/rulesets/saved/:name', (req, res) => {
  const list = loadRulesets().filter(r => r.name !== decodeURIComponent(req.params.name));
  saveRulesets(list);
  res.json(list);
});

// ── Theme presets ──────────────────────────────────────────────────────────────

app.get('/api/theme-presets', (req, res) => res.json(loadThemePresets()));

app.post('/api/theme-presets', (req, res) => {
  const { name, preset } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const list = loadThemePresets().filter(p => p.name !== name);
  list.push({ name, preset });
  saveThemePresets(list);
  res.json(list);
});

app.delete('/api/theme-presets/:name', (req, res) => {
  const list = loadThemePresets().filter(p => p.name !== decodeURIComponent(req.params.name));
  saveThemePresets(list);
  res.json(list);
});

// ─── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  socket.emit('stateUpdate', matchState);
  socket.emit('vetoUpdate', vetoState);
  socket.emit('rulesetUpdate', rulesetState);
  socket.emit('characterUpdate', characterList);
  socket.emit('castersUpdate', castersState);
  socket.emit('playerStatsUpdate', playerStatsState);
  socket.emit('tournamentHistoryUpdate', tournamentHistoryState);
  socket.emit('h2hUpdate', h2hState);
  socket.emit('twitch-viewers', { viewers: twitchState.viewers, live: twitchState.live, channel: twitchState.channel });
  socket.emit('tickerUpdate', tickerState);
  socket.emit('framesUpdate', framesState);
  socket.emit('superUpdate', superState);
  socket.emit('titleUpdate', titleState);

  // Déclenche l'animation d'entrée sur la VS screen
  socket.on('triggerVsScreen', () => {
    io.emit('vsScreenTrigger');
  });

  socket.on('updateState', (data) => {
    matchState = { ...matchState, ...data };
    io.emit('stateUpdate', matchState);
  });

  socket.on('updateVeto', (data) => {
    vetoState = { ...vetoState, ...data };
    io.emit('vetoUpdate', vetoState);
  });

  socket.on('updateRuleset', (data) => {
    rulesetState = { ...rulesetState, ...data };
    vetoState = makeVetoState();
    io.emit('rulesetUpdate', rulesetState);
    io.emit('vetoUpdate', vetoState);
  });

  socket.on('updateCharacters', (data) => {
    characterList = data;
    io.emit('characterUpdate', characterList);
  });

  socket.on('updateCasters', (data) => {
    castersState = { ...castersState, ...data };
    io.emit('castersUpdate', castersState);
  });

  socket.on('vetoAction', ({ stageId }) => {
    const step = vetoState.sequence[vetoState.currentStep];
    if (!step || step.action === 'decider') return;
    const stage = vetoState.stages.find(s => s.id === stageId);
    if (!stage || stage.status !== 'available') return;

    stage.status = step.player === 1 ? 'banned_p1' : 'banned_p2';
    step.mapId = stageId;
    vetoState.currentStep++;

    const next = vetoState.sequence[vetoState.currentStep];
    if (next && next.action === 'decider') {
      const remaining = vetoState.stages.find(s => s.status === 'available');
      if (remaining) {
        remaining.status = 'selected';
        next.mapId = remaining.id;
        vetoState.currentStep++;
        vetoState.done = true;
        matchState.currentStage = remaining.name;
        io.emit('stateUpdate', matchState);
      }
    }

    io.emit('vetoUpdate', vetoState);
  });

  socket.on('vetoNextGame', () => {
    const selected = vetoState.stages.find(s => s.status === 'selected');
    const newPlayed = [...(vetoState.playedStageIds || [])];
    if (selected) newPlayed.push(selected.id);
    vetoState = makeVetoState(vetoState.gameNumber + 1, newPlayed, vetoState.visible);
    io.emit('vetoUpdate', vetoState);
  });
});

// ─── start.gg API ─────────────────────────────────────────────────────────────

const CONFIG_FILE = path.join(__dirname, 'config.json');

function getConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {}
  return {};
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
}

async function startggQuery(query, variables = {}) {
  const cfg = getConfig();
  const apiKey = cfg.startggApiKey;
  if (!apiKey) throw new Error('Clé API start.gg non configurée');
  const res = await fetch('https://api.start.gg/gql/alpha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ query, variables })
  });
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data;
}

app.get('/api/startgg/config', (req, res) => {
  const cfg = getConfig();
  res.json({ hasKey: !!cfg.startggApiKey });
});

app.post('/api/startgg/config', (req, res) => {
  const cfg = getConfig();
  cfg.startggApiKey = req.body.apiKey;
  saveConfig(cfg);
  res.json({ ok: true });
});

app.get('/api/startgg/tournament/:slug', async (req, res) => {
  try {
    const data = await startggQuery(`
      query TournamentQuery($slug: String!) {
        tournament(slug: $slug) {
          id name slug
          events { id name numEntrants }
        }
      }
    `, { slug: req.params.slug });
    if (!data.tournament) return res.status(404).json({ error: 'Tournoi introuvable' });
    res.json(data.tournament);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/startgg/event/:id/entrants', async (req, res) => {
  try {
    const data = await startggQuery(`
      query EventEntrants($eventId: ID!, $page: Int!) {
        event(id: $eventId) {
          id name
          entrants(query: { page: $page, perPage: 100 }) {
            pageInfo { total totalPages }
            nodes {
              id name
              participants { gamerTag prefix }
            }
          }
        }
      }
    `, { eventId: parseInt(req.params.id), page: parseInt(req.query.page || 1) });
    if (!data.event) return res.status(404).json({ error: 'Évènement introuvable' });
    res.json(data.event);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.get('/api/startgg/event/:id/sets', async (req, res) => {
  try {
    const data = await startggQuery(`
      query EventSets($eventId: ID!) {
        event(id: $eventId) {
          id name
          sets(filters: { state: [2] }, perPage: 20, sortType: RECENT) {
            nodes {
              id fullRoundText state
              slots {
                entrant { name participants { gamerTag prefix } }
                standing { stats { score { value } } }
              }
            }
          }
        }
      }
    `, { eventId: parseInt(req.params.id) });
    if (!data.event) return res.status(404).json({ error: 'Évènement introuvable' });
    res.json(data.event);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Mapping start.gg SSBU character IDs → internal character IDs
const SSBU_CHAR_MAP = {
  1260:'mario', 1261:'donkey_kong', 1262:'link', 1263:'samus', 1264:'dark_samus',
  1265:'yoshi', 1266:'kirby', 1267:'fox', 1268:'pikachu', 1269:'luigi',
  1270:'ness', 1271:'captain_falcon', 1272:'jigglypuff', 1273:'peach', 1274:'daisy',
  1275:'bowser', 1276:'ice_climbers', 1277:'sheik', 1278:'zelda', 1279:'dr_mario',
  1280:'pichu', 1281:'falco', 1282:'marth', 1283:'lucina', 1284:'young_link',
  1285:'ganondorf', 1286:'mewtwo', 1287:'roy', 1288:'chrom', 1289:'mr_game_watch',
  1290:'meta_knight', 1291:'pit', 1292:'dark_pit', 1293:'zero_suit_samus', 1294:'wario',
  1295:'snake', 1296:'ike', 1297:'pokemon_trainer', 1298:'diddy_kong', 1299:'lucas',
  1300:'sonic', 1301:'king_dedede', 1302:'olimar', 1303:'lucario', 1304:'rob',
  1305:'toon_link', 1306:'wolf', 1307:'villager', 1308:'mega_man', 1309:'wii_fit_trainer',
  1310:'rosalina', 1311:'little_mac', 1312:'greninja', 1313:'mii_brawler',
  1314:'mii_swordfighter', 1315:'mii_gunner', 1316:'palutena', 1317:'pac_man',
  1318:'robin', 1319:'shulk', 1320:'bowser_jr', 1321:'duck_hunt', 1322:'ryu',
  1323:'ken', 1324:'cloud', 1325:'corrin', 1326:'bayonetta', 1327:'inkling',
  1328:'ridley', 1329:'simon', 1330:'richter', 1331:'king_k_rool', 1332:'isabelle',
  1333:'incineroar', 1334:'piranha_plant', 1335:'joker', 1336:'hero',
  1337:'banjo_kazooie', 1338:'terry', 1339:'byleth', 1340:'min_min', 1341:'steve',
  1342:'sephiroth', 1343:'pyra_mythra', 1344:'pyra_mythra', 1345:'kazuya', 1346:'sora',
};

app.get('/api/startgg/event/:id/player-stats/:entrantId', async (req, res) => {
  try {
    // IDs kept as strings — start.gg GraphQL ID type accepts both string and int
    const eventId  = req.params.id;
    const entrantId = req.params.entrantId;

    let allSets = [];
    let page = 1;
    let totalPages = 1;
    let eventName = '';
    let playerName = '';
    let playerTag = '';
    let playerId = null;

    while (page <= totalPages) {
      const data = await startggQuery(`
        query PlayerStats($eventId: ID!, $entrantId: ID!, $page: Int!) {
          event(id: $eventId) {
            id name
            sets(
              filters: { entrantIds: [$entrantId] }
              perPage: 50
              page: $page
              sortType: RECENT
            ) {
              pageInfo { total totalPages }
              nodes {
                id fullRoundText state winnerId
                slots {
                  entrant {
                    id name
                    participants { gamerTag prefix player { id } }
                  }
                  standing { stats { score { value } } }
                }
                games {
                  winnerId
                  selections {
                    entrant { id }
                    selectionType
                    selectionValue
                  }
                }
              }
            }
          }
        }
      `, { eventId, entrantId, page });

      if (!data.event) return res.status(404).json({ error: 'Évènement introuvable' });
      eventName = data.event.name;
      totalPages = data.event.sets?.pageInfo?.totalPages || 1;
      allSets = allSets.concat(data.event.sets?.nodes || []);
      page++;
    }

    // Séparer sets terminés (state 3) et prochain match (state 1=appelé, 2=actif)
    const completedSets = allSets.filter(s => s.state === 3);
    const upcomingSets  = allSets.filter(s => s.state === 1 || s.state === 2);

    // Extract player name + playerId depuis les sets terminés ou à venir
    const allForInfo = [...completedSets, ...upcomingSets];
    for (const set of allForInfo) {
      const mySlot = (set.slots || []).find(s => String(s.entrant?.id) === String(entrantId));
      if (mySlot?.entrant?.participants?.[0]) {
        playerName = mySlot.entrant.participants[0].gamerTag || mySlot.entrant.name || '';
        playerTag  = mySlot.entrant.participants[0].prefix || '';
        playerId   = mySlot.entrant.participants[0].player?.id || null;
        break;
      }
    }

    // Compute wins/losses sur sets terminés
    let wins = 0, losses = 0;
    for (const set of completedSets) {
      if (String(set.winnerId) === String(entrantId)) wins++;
      else losses++;
    }

    // Compute top characters from game-level selections
    const charCounts = {};
    for (const set of completedSets) {
      for (const game of (set.games || [])) {
        for (const sel of (game.selections || [])) {
          if (String(sel.entrant?.id) === String(entrantId) && sel.selectionType === 'CHARACTER') {
            const charId = sel.selectionValue;
            charCounts[charId] = (charCounts[charId] || 0) + 1;
          }
        }
      }
    }

    const topCharacters = Object.entries(charCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([charId, games]) => {
        const internalId = SSBU_CHAR_MAP[parseInt(charId)];
        const charEntry  = internalId ? characterList.find(c => c.id === internalId) : null;
        return {
          charId: parseInt(charId),
          name:  charEntry?.name || `Perso #${charId}`,
          image: internalId ? `/Stock Icons/chara_2_${internalId}_00.png` : '',
          games,
        };
      });

    // Tous les matchs joués (les plus récents en premier)
    function slotInfo(set) {
      const mySlot  = (set.slots || []).find(s => String(s.entrant?.id) === String(entrantId));
      const oppSlot = (set.slots || []).find(s => String(s.entrant?.id) !== String(entrantId));
      return { mySlot, oppSlot };
    }

    const allMatches = completedSets.map(set => {
      const { mySlot, oppSlot } = slotInfo(set);
      const isWin    = String(set.winnerId) === String(entrantId);
      const myScore  = mySlot?.standing?.stats?.score?.value ?? null;
      const oppScore = oppSlot?.standing?.stats?.score?.value ?? null;
      const oppName  = oppSlot?.entrant?.participants?.[0]?.gamerTag
                     || oppSlot?.entrant?.name || '?';
      const oppTag   = oppSlot?.entrant?.participants?.[0]?.prefix || '';
      return {
        round:        set.fullRoundText || '',
        opponentName: oppName,
        opponentTag:  oppTag,
        result:       isWin ? 'W' : 'L',
        score:        myScore  !== null ? Math.max(0, myScore)  : undefined,
        opponentScore: oppScore !== null ? Math.max(0, oppScore) : undefined,
      };
    });

    // Prochain match (premier set appelé ou actif)
    let nextMatch = null;
    if (upcomingSets.length > 0) {
      const next = upcomingSets[0];
      const { oppSlot } = slotInfo(next);
      const oppName = oppSlot?.entrant?.participants?.[0]?.gamerTag
                    || oppSlot?.entrant?.name || 'TBD';
      const oppTag  = oppSlot?.entrant?.participants?.[0]?.prefix || '';
      nextMatch = {
        round:        next.fullRoundText || '',
        opponentName: oppName,
        opponentTag:  oppTag,
        state:        next.state,
      };
    }

    res.json({ playerName, playerTag, eventName, wins, losses, topCharacters, allMatches, nextMatch });
  } catch (e) {
    console.error('[player-stats]', e.message);
    res.status(400).json({ error: e.message });
  }
});

// ─── H2H State & API ─────────────────────────────────────────────────────────

let h2hState = {
  visible: false,
  player1: { name: '', tag: '', color: '#E83030', currentStats: { wins:0, losses:0, winRate:0, topChars:[] } },
  player2: { name: '', tag: '', color: '#3070E8', currentStats: { wins:0, losses:0, winRate:0, topChars:[] } },
  h2h: { player1Wins:0, player2Wins:0, totalSets:0, topCharsP1:[], topCharsP2:[], sets:[] },
};

app.get('/h2h', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'h2h.html')));

app.get('/api/h2h', (req, res) => res.json(h2hState));
app.post('/api/h2h', (req, res) => {
  h2hState = { ...h2hState, ...req.body };
  io.emit('h2hUpdate', h2hState);
  res.json(h2hState);
});

// Calcule et retourne les stats H2H pour deux entrants d'un même event
app.get('/api/startgg/event/:eventId/h2h/:entrant1Id/:entrant2Id', async (req, res) => {
  try {
    const { eventId, entrant1Id, entrant2Id } = req.params;
    const tournamentLimit = req.query.limitTournaments ? parseInt(req.query.limitTournaments) : null;

    // ── Helpers ──────────────────────────────────────────────────────────────

    function extractInfo(slots, entrantId) {
      const slot = (slots || []).find(s => String(s.entrant?.id) === String(entrantId));
      if (!slot) return null;
      const p = slot.entrant?.participants?.[0];
      return {
        name:     p?.gamerTag || slot.entrant?.name || '',
        tag:      p?.prefix   || '',
        playerId: p?.player?.id || null,
      };
    }

    function mapChars(counts) {
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1]).slice(0, 3)
        .map(([id, games]) => {
          const internal = SSBU_CHAR_MAP[parseInt(id)];
          const entry    = internal ? characterList.find(c => c.id === internal) : null;
          return {
            name:  entry?.name || `Perso #${id}`,
            image: internal ? `/Stock Icons/chara_2_${internal}_00.png` : '',
            games,
          };
        });
    }

    function computeStats(entrantId, sets) {
      let wins = 0, losses = 0;
      const chars = {};
      for (const set of sets) {
        if (String(set.winnerId) === String(entrantId)) wins++; else losses++;
        for (const game of (set.games || []))
          for (const sel of (game.selections || []))
            if (String(sel.entrant?.id) === String(entrantId) && sel.selectionType === 'CHARACTER')
              chars[sel.selectionValue] = (chars[sel.selectionValue] || 0) + 1;
      }
      return { wins, losses, winRate: wins + losses > 0 ? Math.round(wins / (wins + losses) * 100) : 0, topChars: mapChars(chars) };
    }

    // ── 1. Sets du tournoi en cours pour les deux entrants ───────────────────

    let page = 1, totalPages = 1;
    let allCurrentSets = [];
    let p1Info = null, p2Info = null;
    let eventName = '';

    while (page <= totalPages) {
      const d = await startggQuery(`
        query CurrentSets($eventId: ID!, $e1: ID!, $e2: ID!, $page: Int!) {
          event(id: $eventId) {
            name
            sets(filters: { entrantIds: [$e1, $e2] }, perPage: 50, page: $page) {
              pageInfo { totalPages }
              nodes {
                id fullRoundText state winnerId
                slots {
                  entrant { id name participants { gamerTag prefix player { id } } }
                  standing { stats { score { value } } }
                }
                games {
                  winnerId
                  selections { entrant { id } selectionType selectionValue }
                }
              }
            }
          }
        }
      `, { eventId, e1: entrant1Id, e2: entrant2Id, page });

      if (!d.event) return res.status(404).json({ error: 'Évènement introuvable' });
      eventName  = d.event.name;
      totalPages = d.event.sets?.pageInfo?.totalPages || 1;
      allCurrentSets = allCurrentSets.concat(d.event.sets?.nodes || []);
      page++;
    }

    const completedCurrent = allCurrentSets.filter(s => s.state === 3);

    // Extraire infos joueurs depuis n'importe quel set
    for (const set of completedCurrent) {
      if (!p1Info) p1Info = extractInfo(set.slots, entrant1Id);
      if (!p2Info) p2Info = extractInfo(set.slots, entrant2Id);
      if (p1Info && p2Info) break;
    }
    // Fallback : chercher dans les sets non terminés si un des joueurs est inconnu
    if (!p1Info || !p2Info) {
      for (const set of allCurrentSets) {
        if (!p1Info) p1Info = extractInfo(set.slots, entrant1Id);
        if (!p2Info) p2Info = extractInfo(set.slots, entrant2Id);
        if (p1Info && p2Info) break;
      }
    }
    if (!p1Info || !p2Info)
      return res.status(404).json({ error: 'Infos joueurs introuvables dans cet évènement' });

    // Stats individuelles dans le tournoi en cours
    const p1CurrentSets = completedCurrent.filter(s =>
      (s.slots||[]).some(sl => String(sl.entrant?.id) === String(entrant1Id)));
    const p2CurrentSets = completedCurrent.filter(s =>
      (s.slots||[]).some(sl => String(sl.entrant?.id) === String(entrant2Id)));

    // H2H dans le tournoi en cours (sets où les deux joueurs s'affrontent)
    const h2hCurrentSets = completedCurrent.filter(s => {
      const ids = (s.slots||[]).map(sl => String(sl.entrant?.id));
      return ids.includes(String(entrant1Id)) && ids.includes(String(entrant2Id));
    });

    // ── 2. H2H historique via player.sets paginé ─────────────────────────────

    const historicalH2H = [];

    if (p1Info.playerId) {
      let page = 1;
      const seenTournaments = new Set();
      let stopPaging = false;
      while (!stopPaging) {
        const stData = await startggQuery(`
          query P1Sets($playerId: ID!, $page: Int!) {
            player(id: $playerId) {
              sets(page: $page, perPage: 20, filters: { state: [3] }) {
                pageInfo { totalPages }
                nodes {
                  id fullRoundText winnerId
                  event { id name tournament { id name } }
                  slots {
                    entrant { id name participants { gamerTag prefix } }
                    standing { stats { score { value } } }
                  }
                  games {
                    winnerId
                    selections { entrant { id } selectionType selectionValue }
                  }
                }
              }
            }
          }
        `, { playerId: p1Info.playerId, page });

        const setsPage  = stData.player?.sets;
        const nodes     = setsPage?.nodes || [];
        const totalPages = setsPage?.pageInfo?.totalPages || 1;

        for (const set of nodes) {
          if (String(set.event?.id) === String(eventId)) continue;
          const tId = set.event?.tournament?.id || set.event?.id;
          if (tId) seenTournaments.add(String(tId));
          if (tournamentLimit && seenTournaments.size > tournamentLimit) {
            stopPaging = true;
            break;
          }
          const p1Slot  = (set.slots||[]).find(sl => {
            const tag = sl.entrant?.participants?.[0]?.gamerTag || sl.entrant?.name || '';
            return tag.toLowerCase() === p1Info.name.toLowerCase();
          });
          const oppSlot = (set.slots||[]).find(sl => {
            const tag = sl.entrant?.participants?.[0]?.gamerTag || sl.entrant?.name || '';
            return tag.toLowerCase() === p2Info.name.toLowerCase();
          });
          if (!p1Slot || !oppSlot) continue;
          historicalH2H.push({
            set,
            p1EntrantId:    p1Slot.entrant?.id,
            p2EntrantId:    oppSlot.entrant?.id,
            tournamentName: set.event?.tournament?.name || set.event?.name || '',
            eventName:      set.event?.name || '',
          });
        }

        if (page >= totalPages) break;
        page++;
      }
    }

    // ── 3. Compiler tous les sets H2H ────────────────────────────────────────

    const allH2H = [
      ...h2hCurrentSets.map(set => ({
        set, p1EntrantId: entrant1Id, p2EntrantId: entrant2Id,
        tournamentName: eventName, eventName, isCurrent: true,
      })),
      ...historicalH2H.map(h => ({ ...h, isCurrent: false })),
    ];

    let h2hWins1 = 0, h2hWins2 = 0;
    const h2hChars1 = {}, h2hChars2 = {};

    const h2hSets = allH2H.map(({ set, p1EntrantId, p2EntrantId, tournamentName, eventName: evName, isCurrent }) => {
      const p1Slot = (set.slots||[]).find(sl => String(sl.entrant?.id) === String(p1EntrantId));
      const p2Slot = (set.slots||[]).find(sl => String(sl.entrant?.id) !== String(p1EntrantId));
      const p1Won  = String(set.winnerId) === String(p1EntrantId);
      if (p1Won) h2hWins1++; else h2hWins2++;

      for (const game of (set.games||[])) {
        for (const sel of (game.selections||[])) {
          if (sel.selectionType !== 'CHARACTER') continue;
          const bucket = String(sel.entrant?.id) === String(p1EntrantId) ? h2hChars1 : h2hChars2;
          bucket[sel.selectionValue] = (bucket[sel.selectionValue] || 0) + 1;
        }
      }

      const s1 = p1Slot?.standing?.stats?.score?.value ?? null;
      const s2 = p2Slot?.standing?.stats?.score?.value ?? null;
      return {
        tournamentName,
        eventName: evName,
        isCurrent,
        round:   set.fullRoundText || '',
        winner:  p1Won ? 1 : 2,
        score1:  s1 !== null ? Math.max(0, s1) : undefined,
        score2:  s2 !== null ? Math.max(0, s2) : undefined,
      };
    });

    res.json({
      eventName,
      player1: { name: p1Info.name, tag: p1Info.tag, currentStats: computeStats(entrant1Id, p1CurrentSets) },
      player2: { name: p2Info.name, tag: p2Info.tag, currentStats: computeStats(entrant2Id, p2CurrentSets) },
      h2h: {
        player1Wins: h2hWins1,
        player2Wins: h2hWins2,
        totalSets:   h2hWins1 + h2hWins2,
        topCharsP1:  mapChars(h2hChars1),
        topCharsP2:  mapChars(h2hChars2),
        sets: h2hSets,
      },
    });
  } catch (e) {
    console.error('[h2h]', e.message);
    res.status(400).json({ error: e.message });
  }
});

// ─── Tournament History State & API ──────────────────────────────────────────

let tournamentHistoryState = {
  visible: false,
  playerName: '',
  playerTag: '',
  playerColor: '#E8B830',
  tournaments: [], // [{ tournamentName, eventName, placement, numEntrants, startAt, sets[] }]
};

app.get('/tournament-history', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'tournament-history.html')));

app.get('/api/tournament-history', (req, res) => res.json(tournamentHistoryState));
app.post('/api/tournament-history', (req, res) => {
  tournamentHistoryState = { ...tournamentHistoryState, ...req.body };
  io.emit('tournamentHistoryUpdate', tournamentHistoryState);
  res.json(tournamentHistoryState);
});

// Récupère l'historique des anciens tournois via entrantId + eventId
app.get('/api/startgg/event/:id/player-history/:entrantId', async (req, res) => {
  try {
    const eventId   = req.params.id;
    const entrantId = req.params.entrantId;

    // 1) Récupérer le playerId depuis les sets du tournoi en cours
    let playerId   = null;
    let playerName = '';
    let playerTag  = '';

    const setsData = await startggQuery(`
      query GetPlayerId($eventId: ID!, $entrantId: ID!) {
        event(id: $eventId) {
          sets(filters: { entrantIds: [$entrantId] }, perPage: 1, page: 1) {
            nodes {
              slots {
                entrant {
                  id name
                  participants { gamerTag prefix player { id } }
                }
              }
            }
          }
        }
      }
    `, { eventId, entrantId });

    const firstSet = setsData.event?.sets?.nodes?.[0];
    if (firstSet) {
      const mySlot = (firstSet.slots || []).find(s => String(s.entrant?.id) === String(entrantId));
      if (mySlot?.entrant?.participants?.[0]) {
        playerName = mySlot.entrant.participants[0].gamerTag || mySlot.entrant.name || '';
        playerTag  = mySlot.entrant.participants[0].prefix || '';
        playerId   = mySlot.entrant.participants[0].player?.id || null;
      }
    }

    if (!playerId) return res.status(404).json({ error: 'playerId introuvable pour cet entrant' });

    // 2) Récupérer les standings récents (hors tournoi en cours)
    const standingsData = await startggQuery(`
      query PlayerStandings($playerId: ID!) {
        player(id: $playerId) {
          recentStandings(limit: 15) {
            placement
            entrant {
              id
              event {
                id name numEntrants
                tournament { name startAt }
              }
            }
          }
        }
      }
    `, { playerId });

    const standings = (standingsData.player?.recentStandings || [])
      .filter(s => String(s.entrant?.event?.id) !== String(eventId));

    // 3) Pour chaque tournoi, récupérer les sets joués
    const tournaments = [];
    for (const standing of standings.slice(0, 8)) {
      const evId  = standing.entrant?.event?.id;
      const entId = standing.entrant?.id;
      if (!evId || !entId) continue;

      try {
        const evSets = await startggQuery(`
          query EventHistory($eventId: ID!, $entrantId: ID!) {
            event(id: $eventId) {
              sets(
                filters: { entrantIds: [$entrantId], state: [3] }
                perPage: 50
                sortType: RECENT
              ) {
                nodes {
                  id fullRoundText winnerId
                  slots {
                    entrant { id name participants { gamerTag prefix } }
                    standing { stats { score { value } } }
                  }
                }
              }
            }
          }
        `, { eventId: evId, entrantId: entId });

        const sets = (evSets.event?.sets?.nodes || []).map(set => {
          const mySlot  = (set.slots || []).find(s => String(s.entrant?.id) === String(entId));
          const oppSlot = (set.slots || []).find(s => String(s.entrant?.id) !== String(entId));
          const isWin   = String(set.winnerId) === String(entId);
          const myScore  = mySlot?.standing?.stats?.score?.value ?? null;
          const oppScore = oppSlot?.standing?.stats?.score?.value ?? null;
          return {
            round:        set.fullRoundText || '',
            opponentName: oppSlot?.entrant?.participants?.[0]?.gamerTag || oppSlot?.entrant?.name || '?',
            opponentTag:  oppSlot?.entrant?.participants?.[0]?.prefix || '',
            result:       isWin ? 'W' : 'L',
            score:        myScore  !== null ? Math.max(0, myScore)  : undefined,
            opponentScore: oppScore !== null ? Math.max(0, oppScore) : undefined,
          };
        });

        tournaments.push({
          tournamentName: standing.entrant?.event?.tournament?.name || standing.entrant?.event?.name || '',
          eventName:      standing.entrant?.event?.name || '',
          placement:      standing.placement || null,
          numEntrants:    standing.entrant?.event?.numEntrants || null,
          startAt:        standing.entrant?.event?.tournament?.startAt || null,
          sets,
        });
      } catch (e) {
        console.error('[history] sets error for event', evId, e.message);
      }
    }

    res.json({ playerName, playerTag, tournaments });
  } catch (e) {
    console.error('[player-history]', e.message);
    res.status(400).json({ error: e.message });
  }
});

// ─── VS Background API ───────────────────────────────────────────────────────

const BG_DIR = path.join(__dirname, 'public', 'background');
const BG_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];

function getVsBgUrl() {
  if (!fs.existsSync(BG_DIR)) return null;
  for (const ext of BG_EXTS) {
    if (fs.existsSync(path.join(BG_DIR, 'vs-background' + ext)))
      return '/background/vs-background' + ext;
  }
  return null;
}

app.get('/api/vs-background', (req, res) => {
  res.json({ url: getVsBgUrl() });
});

app.post('/api/vs-background', (req, res) => {
  const { filename, data } = req.body;
  if (!data) return res.status(400).json({ error: 'data required' });
  const ext = (path.extname(filename || '').toLowerCase()) || '.png';
  if (!BG_EXTS.includes(ext)) return res.status(400).json({ error: 'Format non supporté' });
  if (!fs.existsSync(BG_DIR)) fs.mkdirSync(BG_DIR, { recursive: true });
  // Supprimer l'ancien fichier quelle que soit son extension
  BG_EXTS.forEach(e => {
    const old = path.join(BG_DIR, 'vs-background' + e);
    if (fs.existsSync(old)) fs.unlinkSync(old);
  });
  fs.writeFileSync(path.join(BG_DIR, 'vs-background' + ext), Buffer.from(data, 'base64'));
  const url = '/background/vs-background' + ext;
  io.emit('vsBgUpdate', { url });
  res.json({ url });
});

app.delete('/api/vs-background', (req, res) => {
  BG_EXTS.forEach(e => {
    const f = path.join(BG_DIR, 'vs-background' + e);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
  io.emit('vsBgUpdate', { url: null });
  res.json({ ok: true });
});

// ─── Flags API ───────────────────────────────────────────────────────────────

app.get('/api/flags', (req, res) => {
  const flagsDir = path.join(__dirname, 'public', 'state_flag');
  try {
    const countries = fs.readdirSync(flagsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(d => ({
        code: d.name,
        files: fs.readdirSync(path.join(flagsDir, d.name))
          .filter(f => /\.png$/i.test(f))
          .sort()
      }));
    res.json(countries);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = 3002;
server.listen(PORT, () => {
  console.log('');
  console.log('🎮 PSO démarré !');
  console.log('   Overlay scoreboard → http://localhost:' + PORT + '/overlay');
  console.log('   Overlay slim       → http://localhost:' + PORT + '/overlay-slim');
  console.log('   Overlay veto       → http://localhost:' + PORT + '/stageveto');
  console.log('   Overlay casters    → http://localhost:' + PORT + '/casters');
  console.log('   Overlay stats      → http://localhost:' + PORT + '/player-stats');
  console.log('   Overlay historique → http://localhost:' + PORT + '/tournament-history');
  console.log('   Overlay H2H        → http://localhost:' + PORT + '/h2h');
  console.log('   Contrôle           → http://localhost:' + PORT + '/control');
  console.log('');
});

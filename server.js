const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const RULESETS_FILE = path.join(__dirname, 'data', 'rulesets.json');

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

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── State ────────────────────────────────────────────────────────────────────

let matchState = {
  player1: { name: 'PLAYER 1', score: 0, character: null, color: '#E83030', tag: '', pronouns: '', stockColor: 0 },
  player2: { name: 'PLAYER 2', score: 0, character: null, color: '#3070E8', tag: '', pronouns: '', stockColor: 0 },
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
  visible: true
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

app.get('/api/casters', (req, res) => res.json(castersState));

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

// ─── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  socket.emit('stateUpdate', matchState);
  socket.emit('vetoUpdate', vetoState);
  socket.emit('rulesetUpdate', rulesetState);
  socket.emit('characterUpdate', characterList);
  socket.emit('castersUpdate', castersState);

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

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = 3002;
server.listen(PORT, () => {
  console.log('');
  console.log('🎮 PSO démarré !');
  console.log('   Overlay scoreboard → http://localhost:' + PORT + '/overlay');
  console.log('   Overlay slim       → http://localhost:' + PORT + '/overlay-slim');
  console.log('   Overlay veto       → http://localhost:' + PORT + '/stageveto');
  console.log('   Overlay casters    → http://localhost:' + PORT + '/casters');
  console.log('   Contrôle           → http://localhost:' + PORT + '/control');
  console.log('');
});

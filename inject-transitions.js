/**
 * inject-transitions.js
 * Injecte pso-transition.css et pso-transition.js dans chaque overlay HTML.
 * Exécuter une seule fois : node inject-transitions.js
 */
const fs   = require('fs');
const path = require('path');

const PUB  = path.join(__dirname, 'public');

/* Mapping overlay → { id, root } */
const OVERLAYS = [
  { file: 'overlay.html',             id: 'scoreboard',          root: '#scoreboard'       },
  { file: 'overlay-slim.html',        id: 'scoreboard-slim',     root: '#scoreboard'       },
  { file: 'scoreboard-elements.html', id: 'scoreboard-elements', root: '#sel-root'         },
  { file: 'casters.html',             id: 'casters',             root: '#casters-root'     },
  { file: 'stageveto.html',           id: 'stageveto',           root: '#veto-root'        },
  { file: 'ticker.html',              id: 'ticker',              root: '#ticker-root'      },
  { file: 'cam.html',                 id: 'cam',                 root: '#cam-root'         },
  { file: 'frames.html',              id: 'frames',              root: '#frames-root'      },
  { file: 'stream-title.html',        id: 'stream-title',        root: '#title-root'       },
  { file: 'h2h.html',                 id: 'h2h',                 root: '#h2h-overlay'      },
  { file: 'player-stats.html',        id: 'player-stats',        root: '#stats-overlay'    },
  { file: 'tournament-history.html',  id: 'tournament-history',  root: '#history-overlay'  },
  { file: 'bracket.html',             id: 'bracket',             root: '#bracket-root'     },
  { file: 'top8.html',                id: 'top8',                root: '#top8-root'        },
  { file: 'timer.html',               id: 'timer',               root: '#timer-body'       },
  { file: 'twitch-layout.html',       id: 'twitch-layout',       root: '#twitch-layout'    },
  { file: 'twitch-chat.html',         id: 'twitch-chat',         root: '#chat-overlay'     },
  { file: 'twitch-viewer.html',       id: 'twitch-viewer',       root: '#viewer-overlay'   },
  { file: 'youtube-chat.html',        id: 'youtube-chat',        root: '#yt-overlay'       },
  { file: 'combined-chat.html',       id: 'combined-chat',       root: '#cc-overlay'       },
];

const CSS_LINK    = '  <link rel="stylesheet" href="/pso-transition.css" />';
const ALREADY_CSS = '/pso-transition.css';
const ALREADY_JS  = 'pso-transition.js';

let ok = 0, skip = 0, err = 0;

for (const ov of OVERLAYS) {
  const fp = path.join(PUB, ov.file);
  if (!fs.existsSync(fp)) {
    console.warn('  ⚠  Not found: ' + ov.file);
    err++;
    continue;
  }

  let html = fs.readFileSync(fp, 'utf8');

  if (html.includes(ALREADY_JS)) {
    console.log('  ↩  Already injected: ' + ov.file);
    skip++;
    continue;
  }

  /* 1. Injecter le lien CSS avant </head> */
  if (!html.includes(ALREADY_CSS)) {
    html = html.replace('</head>', CSS_LINK + '\n</head>');
  }

  /* 2. Injecter config + script avant </body> */
  const configBlock =
    '  <script>window.PSO_T = { id: \'' + ov.id + '\', root: \'' + ov.root + '\' };</script>\n' +
    '  <script src="/pso-transition.js"></script>\n';

  html = html.replace('</body>', configBlock + '</body>');

  fs.writeFileSync(fp, html, 'utf8');
  console.log('  ✓  ' + ov.file + '  →  id=' + ov.id);
  ok++;
}

console.log('\nTerminé : ' + ok + ' injectés, ' + skip + ' ignorés, ' + err + ' erreurs.');

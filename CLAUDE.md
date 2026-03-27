# PSO — Overlay Smash Bros Ultimate

## Stack technique
- **Serveur** : Node.js + Express + Socket.IO (`server.js`, port 3002)
- **Frontend** : Vanilla JS + HTML + CSS, pas de bundler
- **Démarrage** : `npm start` ou `start.bat`
- **Config persistante** : `config.json` (lu/écrit via `getConfig()` / `saveConfig()`)

## Architecture

### Panneau de contrôle
- `public/control.html` — UI complète, onglets : Scoreboard · Personnages · Ticker · Layouts Twitch · Cadres · Cam · Titre · Studio · etc.
- `public/control.js` — toute la logique client du panneau
- `public/control.css` — styles du panneau

### Overlays OBS (1920×1080, fond transparent)
| Fichier | Description |
|---|---|
| `overlay.html/css/js` | Scoreboard principal |
| `overlay-slim.html/css/js` | Scoreboard slim |
| `ticker.html/css/js` | Bandeau défilant |
| `cam.html/css/js` | Overlay caméra bas-centre |
| `frames.html/css/js` | Cadres multi (jusqu'à 6) |
| `twitch-layout.html/css/js` | Layout Twitch (barre bas) |
| `twitch-viewer.html/css/js` | Compteur viewers standalone |
| `twitch-chat.html/css/js` | Chat Twitch overlay |
| `stream-title.html/css/js` | Titre du stream |
| `vs-screen.html/css/js` | Écran VS |
| `super-overlay.html/css/js` | Composition de tous les overlays (Studio) |
| `casters.html/css/js` | Commentateurs |
| `h2h.html/css/js` | Head-to-head |
| `player-stats.html/css/js` | Stats joueur |
| `tournament-history.html/css/js` | Historique tournoi |
| `stageveto.html/css/js` | Stage veto |

### Communication
- **Socket.IO** : le serveur émet des events, les overlays écoutent
- **REST** : `/api/*` pour lire/écrire l'état (GET/POST/PATCH/DELETE)
- Events principaux : `stateUpdate`, `framesUpdate`, `camUpdate`, `twitch-viewers`, `twitchChatMessage`, `twitch-auth-status`

## Conventions importantes

### Thèmes
- Variable CSS `--cam-primary`, `--fr-primary`, `--tw-primary` etc. selon l'overlay
- Chaque overlay a sa propre `THEME_COLORS` map identique
- Le thème actif est dans `matchState.overlayTheme`

### Cadres (frames)
- Coordonnées X/Y = **centre** du cadre (pas coin supérieur-gauche)
- CSS : `transform: translate(-50%, -50%)` sur `.pso-frame`
- 6 cadres max, DOM dans `frames.html` (frame-0 à frame-5)
- Slider "Taille" contrôle la largeur, la hauteur suit via `data-ratio`

### Ticker
- Boucle RAF avec `_offsetX` et copies multiples pour seamless loop
- Ne jamais `return` sans appeler `requestAnimationFrame(step)` (tue la boucle)
- `_trackWidth = 0` → mesure lazy dans le RAF

### Studio (Super Overlay)
- Calques dans `superLocal.layers` triés par `order`
- Drag direct sur le canvas : overlays `.sc-drag-overlay` pleine taille (1920×1080 scalé)
- Scale dynamique : `studioScale = containerWidth / 1920`
- Position en coords 1920px, convertie avec `* studioScale` pour l'affichage

### Twitch
- **App Access Token** (Client Credentials) : viewers uniquement → `twitchState`
- **User Access Token** (OAuth broadcaster) : abonnés, prédictions → `twitchUserAuth`
- OAuth callback : `http://localhost:3002/auth/twitch/callback` (doit être dans les Redirect URIs Twitch)
- Scopes : `channel:read:subscriptions channel:manage:predictions channel:read:predictions moderator:read:followers bits:read`
- Tokens sauvegardés dans `config.json` sous `twitchUserToken`

## Patterns récurrents

### Envoi d'état avec debounce
```js
let _debounce = null;
function send() {
  clearTimeout(_debounce);
  _debounce = setTimeout(() => {
    fetch('/api/xxx', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(local) });
  }, 120);
}
```

### Sync slider ↔ number input
```js
range.addEventListener('input', () => { num.value = range.value; });
num.addEventListener('input', () => { range.value = num.value; });
```

### Overlay reçoit l'état initial + live via socket
```js
fetch('/api/xxx').then(r => r.json()).then(applyState).catch(() => {});
socket.on('xxxUpdate', applyState);
```

## Préférences utilisateur
- Langue : **français** pour tous les labels UI
- Pas de bundler, pas de framework — vanilla uniquement
- Changements en temps réel sans bouton "Appliquer" quand possible
- Sliders préférés aux champs number bruts

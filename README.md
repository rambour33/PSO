# PSO — Smash Bros Ultimate Streaming Overlay

Overlay de stream pour tournois Smash Bros Ultimate. Scoreboard, stage veto, casters, stock icons.

---

## Prérequis

### 1. Installer Node.js

Télécharge et installe **Node.js** (version 18 ou supérieure) :
👉 https://nodejs.org/en/download

Vérifie l'installation dans un terminal :
```bash
node --version
npm --version
```

---

## Installation

### 2. Cloner le dépôt

```bash
git clone https://github.com/rambour33/PSO.git
cd PSO
```

Ou télécharge le ZIP depuis GitHub → **Code → Download ZIP**, puis extrais-le.

### 3. Installer les dépendances

```bash
npm install
```

Cela installe automatiquement :
- **express** — serveur web
- **socket.io** — communication temps réel entre le panneau de contrôle et les overlays

---

## Lancer le serveur

```bash
node server.js
```

Le serveur démarre sur le port **3002**. Tu verras dans le terminal :

```
🎮 PSO démarré !
   Overlay scoreboard → http://localhost:3002/overlay
   Overlay veto       → http://localhost:3002/stageveto
   Overlay casters    → http://localhost:3002/casters
   Contrôle           → http://localhost:3002/control
```

---

## Utilisation

| URL | Description |
|-----|-------------|
| `http://localhost:3002/control` | Panneau de contrôle |
| `http://localhost:3002/overlay` | Scoreboard (Full / Slim) |
| `http://localhost:3002/stageveto` | Overlay Stage Veto |
| `http://localhost:3002/casters` | Overlay Casters |

### Dans OBS

Ajoute une **Source Navigateur** pour chaque overlay avec les URLs ci-dessus.
Taille recommandée : **1920 × 1080**.

---

## Stock Icons

Place tes icônes de personnages dans le dossier `public/Stock Icons/`.

Nommage attendu :
```
chara_2_Mario_00.png        ← Mario couleur 1
chara_2_Mario_01.png        ← Mario couleur 2
chara_2_Donkey Kong_00.png  ← Donkey Kong couleur 1
...
```

Format : `chara_2_{Nom du personnage}_{00 à 07}.png` (jusqu'à 8 couleurs par personnage).

---

## Structure du projet

```
PSO/
├── server.js           ← Serveur Node.js
├── package.json
├── data/               ← Rulesets sauvegardés (créé automatiquement)
└── public/
    ├── control.html/js/css     ← Panneau de contrôle
    ├── overlay.html/js/css     ← Scoreboard Full + Slim
    ├── stageveto.html/js/css   ← Stage Veto
    ├── casters.html/js/css     ← Overlay Casters
    └── Stock Icons/            ← Icônes de personnages
```

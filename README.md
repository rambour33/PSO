# PSO — Smash Bros Ultimate Streaming Overlay

Système d'overlays complet pour tournois Smash Bros Ultimate.
Scoreboard Full/Slim, Stage Veto avec banlist interactive, Casters, stock icons et personnalisation avancée.

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

Installe automatiquement :
- **express** — serveur web
- **socket.io** — communication temps réel entre le panneau de contrôle et les overlays

---

## Lancer le serveur

```bash
node server.js
```

Le serveur démarre sur le port **3002** :

```
🎮 PSO démarré !
   Overlay scoreboard → http://localhost:3002/overlay
   Overlay veto       → http://localhost:3002/stageveto
   Overlay casters    → http://localhost:3002/casters
   Contrôle           → http://localhost:3002/control
```

---

## URLs

| URL | Description |
|-----|-------------|
| `http://localhost:3002/control` | Panneau de contrôle |
| `http://localhost:3002/overlay` | Scoreboard (Full / Slim) |
| `http://localhost:3002/stageveto` | Overlay Stage Veto (1920×1080) |
| `http://localhost:3002/casters` | Overlay Casters |

### Dans OBS

Ajoute une **Source Navigateur** pour chaque overlay avec les URLs ci-dessus.
Taille recommandée : **1920 × 1080**.

---

## Panneau de contrôle

Le panneau est divisé en **4 onglets** :

### Onglet Match

- **Scoreboard** : noms des joueurs, tags, pronoms, couleurs, personnages, scores, format de match (Bo3/Bo5/custom), bouton ⇄ pour inverser les joueurs
- **Casters** : noms + réseaux sociaux (Twitter, Twitch, YouTube) pour 2 casters
- Boutons **Afficher / Masquer** et liens directs vers les overlays OBS

### Onglet Stage Veto

Gestion en direct du veto de stages :

- **Shifumi** : tire au sort le premier bannisseur (relance automatiquement en cas d'égalité après 2s)
- **Premier bannisseur** : sélection manuelle J1 / J2
- **Grille de stages** : affiche toutes les maps du ruleset actif, clic pour banner
- **Barre de séquence** : visualisation des étapes (BAN / SELECT)
- Boutons **Jeu suivant** (relance le veto avec la séquence jeux suivants), **Reset**, **Afficher/Masquer**

### Onglet Ruleset

Construction et gestion du ruleset :

- **Séquence jeu 1** : builder visuel — clique sur `+ J1` / `+ J2` pour définir qui banni combien (ex: J1×2 → J2×2). Chaque bloc est ajustable avec `−` / `+` / `×`
- **Séquence jeux suivants** : même builder pour les games 2, 3, 4...
- **Stage clause** : case à cocher — quand activée, les stages déjà joués ne peuvent plus être sélectionnés dans les jeux suivants
- **Liste des stages** : stages actifs dans le ruleset (Starter / Counterpick), supprimables
- **Ajouter un stage** : bouton ouvrant une grille visuelle de 10 colonnes avec toutes les maps disponibles et leurs images
- **Appliquer le ruleset** : envoie la configuration au veto
- **Sauvegarder / Charger** : sauvegarde des rulesets nommés en JSON (`data/rulesets.json`), chargement et suppression

### Onglet Customisation

- **Style d'affichage** : Full (scoreboard complet) ou Slim (barre compacte)
- **Barre événement** : taille et couleur du texte de l'événement
- **Textes joueurs** : couleurs du tag, du nom, des pronoms
- **Fond de l'overlay** : couleur et opacité du fond des scoreboards
- **Overlay Casters** : couleur et opacité du fond des cartes casters, disposition (côte à côte / empilé)

---

## Overlays

### Scoreboard (`/overlay`)

Deux modes dans le même fichier :

| Mode | Description |
|------|-------------|
| **Full** | Scoreboard complet avec portraits, tags, noms, pronoms, scores |
| **Slim** | Barre compacte avec noms, scores et stock icons |

Le mode Slim affiche les **stock icons** 64×64px aux extrémités avec un séparateur visuel.

### Stage Veto (`/stageveto`)

Overlay 1920×1080 affichant :
- Header avec les noms des joueurs et l'étape en cours (BAN / SÉLECTIONNÉ)
- Grille de toutes les maps avec images, statut (disponible / banni / sélectionné)
- Barre de progression de la séquence de bans

### Casters (`/casters`)

Affiche les informations des 2 casters (nom + réseaux sociaux).

---

## Stock Icons

Place les icônes dans `public/Stock Icons/` et les arts full dans `public/full/`.

**Nommage attendu :**
```
public/Stock Icons/chara_2_Mario_00.png       ← Mario couleur 1
public/Stock Icons/chara_2_Mario_07.png       ← Mario couleur 8
public/Stock Icons/chara_2_Donkey Kong_00.png
public/Stock Icons/chara_2_Pyra-Mythra_00.png

public/full/chara_1_Mario_00.png              ← Art full Mario couleur 1
public/full/chara_1_Donkey Kong_00.png
```

Format : `chara_2_{Nom}_{00 à 07}.png` pour les icônes, `chara_1_{Nom}_{00 à 07}.png` pour les arts full.
Les arts full sont utilisés dans le sélecteur de personnages du panneau de contrôle.

---

## Maps

Place les images de stages dans `public/maps/`.

**Nommage attendu :**
```
SSBU-Battlefield.png
SSBU-Final_Destination.jpg
SSBU-Smashville.png
...
```

Les images sont automatiquement associées aux stages dans le sélecteur visuel.

---

## Séquences de bans

Le système de ban suit la logique Smash Ultimate :

- **Jeu 1** : séquence définie manuellement (ex: `J1×2 → J2×2` pour un ruleset 5 stages)
- **Jeux suivants** : séquence différente (ex: `J1×1` — le gagnant banni 1)
- **Stage clause** : un stage joué ne peut pas être rejoué dans le même set
- **Shifumi** : détermine aléatoirement qui banni en premier (avec relance automatique en cas d'égalité)

Exemples de séquences courantes :

| Format | Séquence jeu 1 | Séquence suivants | Stages requis |
|--------|---------------|-------------------|---------------|
| Bo3 standard | J1×2 → J2×2 | J1×1 | 5 |
| Bo5 standard | J1×3 → J2×4 | J1×1 | 8 |

---

## Structure du projet

```
PSO/
├── server.js                   ← Serveur Node.js (Express + Socket.io)
├── package.json
├── data/                       ← Rulesets sauvegardés (créé automatiquement)
│   └── rulesets.json
└── public/
    ├── control.html/js/css     ← Panneau de contrôle (4 onglets)
    ├── overlay.html/js/css     ← Scoreboard Full + Slim
    ├── stageveto.html/js/css   ← Stage Veto 1920×1080
    ├── casters.html/js/css     ← Overlay Casters
    ├── Stock Icons/            ← Icônes 64×64 (chara_2_*)
    ├── full/                   ← Arts full personnages (chara_1_*)
    └── maps/                   ← Images des stages (SSBU-*)
```

---

## Mise à jour

Pour récupérer les dernières modifications depuis GitHub :

```bash
git pull
```

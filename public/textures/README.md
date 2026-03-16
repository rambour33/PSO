# Textures SVG — PSO

Textures tileable au format SVG, utilisables comme `background-image` en CSS.

## Usage CSS

```css
/* Texture simple par-dessus un fond existant */
.mon-element::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/textures/noise.svg');
  background-repeat: repeat;
  background-size: auto;
  pointer-events: none;
  z-index: 1;
  opacity: 0.5;       /* ajuster selon le thème */
  mix-blend-mode: overlay; /* optionnel, donne de la profondeur */
}

/* Vignette (non tileable, couvre tout l'élément) */
.mon-element::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/textures/vignette.svg');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  pointer-events: none;
}
```

## Catalogue

| Fichier | Taille tile | Description | Usage recommandé |
|---------|-------------|-------------|------------------|
| `noise.svg` | 200×200 | Grain / bruit fractal | overlay subtil sur tous les thèmes |
| `scanlines.svg` | 1×4 | Lignes horizontales CRT | thèmes cyberpunk / retro |
| `grid.svg` | 20×20 | Grille fine | thèmes cyberpunk / data |
| `grid-large.svg` | 60×60 | Grille large avec subdivisions | thèmes city / cyberpunk |
| `hexgrid.svg` | 34.641×60 | Grille hexagonale (mathématiquement exacte) | thèmes sci-fi / pkacier / synthwave |
| `carbon.svg` | 4×8 | Fibre de carbone | thèmes sombres / méca |
| `dots.svg` | 8×8 | Matrice de points | halftone / rétro |
| `dots-large.svg` | 16×16 | Points plus espacés en quinconce | fond élégant |
| `diagonal.svg` | 8×8 | Hachures 45° | thèmes danger / fire |
| `crosshatch.svg` | 10×10 | Hachures croisées | thèmes classiques |
| `circuit.svg` | 80×80 | Traces de circuit imprimé | thèmes cyberpunk / data / pkacier |
| `topography.svg` | 120×120 | Lignes de contour / topographique | thèmes nature / eau / eco |
| `stars.svg` | 100×100 | Champ d'étoiles avec éclat | thèmes midnight / space |
| `triangles.svg` | 40×34.641 | Grille triangulaire | thèmes géométriques |
| `vignette.svg` | 1920×1080 | Vignette radiale | tous les overlays (non tileable) |

## Paramètres de taille recommandés

```css
/* Pour les petites textures répétitives */
background-size: auto;           /* utilise la taille native SVG */

/* Pour agrandir sans pixelisation (SVG = vectoriel) */
background-size: 40px 40px;     /* double la taille de grid.svg */

/* Vignette */
background-size: 100% 100%;
background-repeat: no-repeat;
```

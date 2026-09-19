# TELLUS Assets

Ce dossier contient les assets (images, icônes) pour l'application TELLUS.

## Structure

```
assets/
├── icons/          # Icônes de l'application
├── images/         # Images de l'application
└── README.md       # Ce fichier
```

## Icônes requises

### Icône principale
- **logo.png** (150x150px) - Logo TELLUS pour l'écran d'accueil
- **favicon.ico** (32x32px) - Favicon pour le navigateur
- **ic_stat_icon_config_sample** (24x24px) - Icône de notification (Configuration Capacitor)

### Icônes SVG
Les icônes SVG sont déjà intégrées directement dans le code HTML et n'ont pas besoin de fichiers séparés.

## Images requises

### Écran de chargement
- **logo.png** (120x120px) - Logo pour l'écran de chargement

### Header
- **logo.png** (40x40px) - Logo pour l'en-tête de l'application

### Placeholder images
- **placeholder-avatar.png** (80x80px) - Avatar par défaut pour les profils
- **placeholder-land.png** (400x300px) - Image par défaut pour les terrains

## Instructions pour créer les assets

### 1. Logo TELLUS
- Créer un logo représentant la gestion foncière
- Utiliser les couleurs de l'application (vert: #2E7D32)
- Formats requis: PNG (fond transparent)
- Tailles: 40x40px, 120x120px, 150x150px

### 2. Icône de notification
- Créer une icône simple pour les notifications
- Couleur: #488AFF (bleu)
- Taille: 24x24px
- Format: PNG avec fond transparent

### 3. Favicon
- Basé sur le logo TELLUS
- Taille: 32x32px
- Format: ICO

### 4. Images placeholder
- Créer des images neutres pour les avatars et terrains
- Utiliser des couleurs subtiles
- Formats: PNG

## Outils recommandés

- **Figma**: Pour créer les designs
- **Canva**: Pour des templates rapides
- **GIMP**: Pour l'édition d'images (gratuit)
- **Adobe Illustrator**: Pour les vecteurs
- **Photoshop**: Pour l'édition d'images

## Compression des images

Pour optimiser les performances de l'application:

1. **Logo**: Utiliser PNG avec compression
2. **Photos**: Utiliser JPEG avec qualité 80%
3. **Icônes**: Utiliser SVG quand possible

Utilisez des outils comme:
- TinyPNG (https://tinypng.com/)
- ImageOptim (Mac)
- FileOptimizer (Windows)

## Intégration

Une fois les assets créés:

1. Placez les fichiers dans les dossiers appropriés
2. Vérifiez les chemins dans le code HTML
3. Testez l'affichage sur différents appareils
4. Optimisez si nécessaire

## Notes

- Tous les assets doivent être optimisés pour le mobile
- Privilégier les formats vectoriels (SVG) pour les icônes
- Maintenir une cohérence visuelle avec le guide de style
- Tester l'affichage sur différents tailles d'écran
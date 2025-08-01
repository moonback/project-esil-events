# Configuration Mapbox

## Installation

Les packages Mapbox ont été installés automatiquement :
- `react-map-gl` : Composants React pour Mapbox GL JS
- `mapbox-gl` : Bibliothèque JavaScript Mapbox GL
- `@types/mapbox-gl` : Types TypeScript

## Configuration

### 1. Obtenir un token Mapbox

1. Créez un compte sur [Mapbox](https://www.mapbox.com/)
2. Accédez à votre dashboard
3. Créez un token d'accès public
4. Copiez le token

### 2. Configurer le token

Créez un fichier `.env` à la racine du projet et ajoutez :

```env
VITE_MAPBOX_TOKEN=pk.eyJ1IjoiZXNpbC1hZG1pbiIsImEiOiJjbGV4YW1wbGUifQ.example
```

Remplacez `pk.eyJ1IjoiZXNpbC1hZG1pbiIsImEiOiJjbGV4YW1wbGUifQ.example` par votre vrai token Mapbox.

### 3. Redémarrer le serveur

Après avoir ajouté le token, redémarrez le serveur de développement :

```bash
npm run dev
```

## Fonctionnalités

La carte Mapbox intégrée offre :

### 🗺️ **Vues multiples**
- **Missions** : Points colorés selon le statut (complète, en cours, non assignée)
- **Techniciens** : Localisation des techniciens avec statut de disponibilité
- **Itinéraires** : Routes optimisées avec numérotation

### 🎛️ **Contrôles**
- **Navigation** : Zoom, déplacement, géolocalisation
- **Plein écran** : Vue plein écran de la carte
- **Styles** : Changement de style de carte (streets, satellite, dark, light, outdoors)

### 📍 **Marqueurs interactifs**
- **Taille dynamique** : S'adapte au nombre de techniciens requis
- **Couleurs contextuelles** : Statut visuel immédiat
- **Popups détaillés** : Informations complètes au clic
- **Sélection** : Mise en évidence de la mission sélectionnée

### 🛣️ **Itinéraires**
- **Routes GeoJSON** : Lignes d'itinéraire avec styles personnalisés
- **Points numérotés** : Ordre de passage des missions
- **Optimisation** : Calcul automatique des centres de gravité

### 🎨 **Styles personnalisés**
- **Popups** : Design cohérent avec l'interface
- **Contrôles** : Style arrondi et ombré
- **Animations** : Transitions fluides et effets de survol

## Utilisation

La carte est automatiquement intégrée dans l'onglet "Terrain" du dashboard admin. Elle se centre automatiquement sur les missions disponibles et s'adapte au contenu.

## Personnalisation

Vous pouvez modifier les styles et comportements dans :
- `src/lib/mapbox-config.ts` : Configuration générale
- `src/components/ui/mapbox-map.tsx` : Logique de la carte
- `src/components/admin/TerrainTab.tsx` : Intégration dans l'interface 
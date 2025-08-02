# Géocodage Automatique des Missions

## Vue d'ensemble

Le système de géocodage automatique permet de convertir automatiquement les adresses de mission en coordonnées géographiques (latitude et longitude) pour l'affichage sur la carte interactive.

## Fonctionnalités

### 🎯 Géocodage Automatique
- **Déclenchement automatique** : Le géocodage se lance automatiquement 1 seconde après la saisie d'une adresse
- **Debounce intelligent** : Évite les appels API inutiles pendant la frappe
- **Retry automatique** : Jusqu'à 3 tentatives en cas d'échec avec backoff exponentiel

### 🎛️ Géocodage Manuel
- **Bouton de géocodage manuel** : Permet de relancer le géocodage à tout moment
- **Feedback visuel** : Indicateur de chargement et messages d'état

### 📍 Validation et Affichage
- **Validation des coordonnées** : Vérification que les coordonnées sont dans les plages valides
- **Aperçu en temps réel** : Affichage des coordonnées trouvées avec l'adresse complète
- **Gestion d'erreurs** : Messages d'erreur clairs en cas d'échec

## Architecture Technique

### Services

#### `GeocodingService` (`src/lib/geocoding.ts`)
```typescript
class GeocodingService {
  // Géocodage d'une adresse avec retry
  static async geocodeAddressWithRetry(address: string, maxRetries: number)
  
  // Validation des coordonnées
  static validateCoordinates(latitude: number, longitude: number)
  
  // Calcul de distance entre deux points
  static calculateDistance(lat1, lon1, lat2, lon2)
}
```

#### `useGeocoding` Hook (`src/lib/useGeocoding.ts`)
```typescript
function useGeocoding(options: UseGeocodingOptions) {
  return {
    // État
    address, latitude, longitude, loading, error, displayName
    
    // Actions
    updateAddress, geocodeManually, reset
    
    // Utilitaires
    hasCoordinates, isValidCoordinates
  }
}
```

### Composants UI

#### `GeocodingPreview` (`src/components/ui/geocoding-preview.tsx`)
- Affiche l'état du géocodage (chargement, succès, erreur)
- Montre les coordonnées trouvées et l'adresse complète
- Interface utilisateur intuitive avec icônes et couleurs

#### `MissionDialog` (Intégration)
- Intégration du hook `useGeocoding`
- Synchronisation automatique entre l'adresse et les coordonnées
- Interface de saisie avec feedback en temps réel

## API Utilisée

### Nominatim (OpenStreetMap)
- **URL** : `https://nominatim.openstreetmap.org/search`
- **Gratuit** : Pas de clé API requise
- **Limitations** : 
  - 1 requête par seconde maximum
  - Limité à la France (`countrycodes: 'fr'`)
  - Résultats en français (`accept_language: 'fr'`)

### Paramètres de Requête
```typescript
const params = {
  q: address.trim(),           // Adresse à géocoder
  format: 'json',             // Format de réponse
  limit: '1',                 // Un seul résultat
  addressdetails: '1',        // Détails de l'adresse
  countrycodes: 'fr',         // Limiter à la France
  accept_language: 'fr'       // Résultats en français
}
```

## Flux de Données

1. **Saisie d'adresse** → `MissionDialog`
2. **Debounce** → Attendre 1 seconde après la dernière frappe
3. **Appel API** → `GeocodingService.geocodeAddressWithRetry()`
4. **Traitement** → Validation et formatage des coordonnées
5. **Mise à jour UI** → Affichage des résultats dans `GeocodingPreview`
6. **Synchronisation** → Mise à jour des champs latitude/longitude

## Gestion d'Erreurs

### Types d'Erreurs
- **Adresse vide** : Aucune action
- **Aucun résultat** : Message "Aucun résultat trouvé pour cette adresse"
- **Erreur réseau** : Message "Erreur lors du géocodage. Veuillez réessayer."
- **Coordonnées invalides** : Validation automatique

### Stratégie de Retry
```typescript
// Backoff exponentiel
const delay = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s...
```

## Avantages

### ✅ Pour les Utilisateurs
- **Simplicité** : Pas besoin de saisir manuellement les coordonnées
- **Précision** : Coordonnées exactes pour l'affichage sur la carte
- **Feedback immédiat** : Voir les résultats en temps réel
- **Fiabilité** : Retry automatique en cas d'échec

### ✅ Pour les Développeurs
- **Réutilisable** : Hook `useGeocoding` utilisable partout
- **Maintenable** : Code modulaire et bien documenté
- **Extensible** : Facile d'ajouter d'autres services de géocodage
- **Testable** : Fonctions pures et séparation des responsabilités

## Améliorations Futures

### 🔮 Fonctionnalités Avancées
- **Géocodage inversé** : Convertir coordonnées en adresse
- **Suggestions d'adresses** : Autocomplétion pendant la saisie
- **Historique** : Sauvegarder les adresses fréquemment utilisées
- **Géolocalisation** : Détecter la position actuelle de l'utilisateur

### 🔮 Services Alternatifs
- **Google Maps API** : Plus précis mais payant
- **Here Maps API** : Alternative gratuite avec limites
- **BAN (Base Adresse Nationale)** : Données officielles françaises

### 🔮 Optimisations
- **Cache local** : Éviter les requêtes répétées
- **Préchargement** : Géocoder les adresses populaires
- **Compression** : Réduire la taille des requêtes

## Utilisation

### Dans un Composant
```typescript
import { useGeocoding } from '@/lib/useGeocoding'

function MonComposant() {
  const {
    address,
    latitude,
    longitude,
    loading,
    error,
    updateAddress,
    geocodeManually
  } = useGeocoding({
    debounceMs: 1000,
    autoGeocode: true,
    maxRetries: 3
  })

  return (
    <div>
      <input 
        value={address}
        onChange={(e) => updateAddress(e.target.value)}
        placeholder="Saisissez une adresse"
      />
      <button onClick={geocodeManually}>
        Géocoder
      </button>
    </div>
  )
}
```

### Avec le Composant Preview
```typescript
import { GeocodingPreview } from '@/components/ui/geocoding-preview'

<GeocodingPreview
  latitude={latitude}
  longitude={longitude}
  loading={loading}
  error={error}
  displayName={displayName}
/>
```

## Configuration

### Variables d'Environnement
Aucune variable d'environnement requise pour Nominatim.

### Options du Hook
```typescript
interface UseGeocodingOptions {
  debounceMs?: number    // Délai avant géocodage (défaut: 1000ms)
  autoGeocode?: boolean  // Géocodage automatique (défaut: true)
  maxRetries?: number    // Nombre de tentatives (défaut: 3)
}
```

## Tests

### Tests Unitaires Recommandés
- `GeocodingService.geocodeAddress()` avec différents types d'adresses
- `GeocodingService.validateCoordinates()` avec coordonnées valides/invalides
- `useGeocoding` hook avec différents scénarios
- `GeocodingPreview` avec tous les états possibles

### Tests d'Intégration
- Flux complet de création de mission avec géocodage
- Gestion des erreurs réseau
- Performance avec de nombreuses requêtes

---

*Cette documentation est mise à jour automatiquement avec les évolutions du système de géocodage.* 
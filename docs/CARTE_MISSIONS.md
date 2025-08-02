# Carte Interactive des Missions

## Vue d'ensemble

Cette fonctionnalité permet d'afficher toutes les missions sur une carte interactive, facilitant ainsi la visualisation géographique et la planification des interventions.

## Fonctionnalités

### 1. Carte Interactive
- **Affichage des missions** : Chaque mission est représentée par un marqueur coloré sur la carte
- **Icônes personnalisées** : Chaque type de mission a sa propre couleur et icône
- **Centrage automatique** : La carte se centre automatiquement sur toutes les missions
- **Bouton de recentrage** : Permet de recentrer la carte sur toutes les missions

### 2. Marqueurs Colorés par Type
- **Livraison jeux** : Vert (#10B981)
- **Presta sono** : Bleu (#3B82F6)
- **DJ** : Violet (#8B5CF6)
- **Manutention** : Orange (#F59E0B)
- **Déplacement** : Rouge (#EF4444)

### 3. Popups Informatifs
Chaque marqueur affiche un popup avec :
- **Titre de la mission**
- **Type avec badge coloré**
- **Forfait en euros**
- **Description** (si disponible)
- **Dates de début et fin**
- **Localisation**
- **Nombre de personnes requises**
- **Statut des assignations**
- **Boutons d'action** (Voir, Modifier)

### 4. Statistiques en Temps Réel
En-tête avec 4 cartes de statistiques :
- **Total missions** : Nombre total de missions avec coordonnées
- **Missions complètes** : Missions avec tous les techniciens assignés
- **En attente** : Missions nécessitant encore des assignations
- **CA total** : Chiffre d'affaires total des missions affichées

### 5. Mission Sélectionnée
- **Panneau détaillé** : Affichage complet des informations de la mission sélectionnée
- **Actions rapides** : Boutons pour voir les détails ou modifier la mission
- **Statut visuel** : Badge indiquant le statut des assignations

## Utilisation

### Accès à la Carte
1. Aller dans le dashboard administrateur
2. Cliquer sur l'onglet "Carte" (icône de carte)
3. La carte se charge automatiquement avec toutes les missions

### Navigation
- **Zoom** : Utiliser la molette de souris ou les boutons +/-
- **Déplacement** : Cliquer et glisser pour déplacer la carte
- **Sélection** : Cliquer sur un marqueur pour voir les détails
- **Recentrage** : Utiliser le bouton "Recentrer" pour voir toutes les missions

### Actions Disponibles
- **Voir les détails** : Afficher la page complète de la mission
- **Modifier** : Ouvrir le dialogue de modification
- **Fermer** : Fermer le panneau de mission sélectionnée

## Implémentation Technique

### Dépendances
- **Leaflet** : Bibliothèque de cartographie open-source
- **React-Leaflet** : Intégration React pour Leaflet
- **OpenStreetMap** : Tiles de carte gratuits

### Structure des Données
```typescript
interface Mission {
  id: string
  title: string
  type: MissionType
  location: string
  latitude: number | null
  longitude: number | null
  date_start: string
  date_end: string
  forfeit: number
  required_people: number
  // ... autres champs
}
```

### Composants
- `MissionsMapTab.tsx` : Composant principal de la carte
- `MapCenter` : Composant pour centrer la carte
- `getMissionIcon` : Fonction pour créer les icônes personnalisées

### Migration Base de Données
```sql
-- Ajout des coordonnées géographiques
ALTER TABLE missions 
ADD COLUMN latitude numeric(10, 8),
ADD COLUMN longitude numeric(11, 8);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_missions_coordinates ON missions(latitude, longitude);

-- Contrainte de validation
ALTER TABLE missions 
ADD CONSTRAINT valid_coordinates 
CHECK (
  (latitude IS NULL AND longitude IS NULL) OR 
  (latitude IS NOT NULL AND longitude IS NOT NULL AND 
   latitude BETWEEN -90 AND 90 AND 
   longitude BETWEEN -180 AND 180)
);
```

## Avantages

### 1. Visualisation Géographique
- **Vue d'ensemble** : Voir toutes les missions en un coup d'œil
- **Planification** : Identifier les zones d'activité
- **Optimisation** : Planifier les déplacements efficacement

### 2. Interface Intuitive
- **Marqueurs colorés** : Identification rapide du type de mission
- **Popups informatifs** : Accès rapide aux informations essentielles
- **Navigation fluide** : Zoom et déplacement intuitifs

### 3. Intégration Complète
- **Synchronisation temps réel** : Mise à jour automatique des données
- **Actions directes** : Modifier ou voir les détails depuis la carte
- **Responsive** : Fonctionne sur mobile et desktop

### 4. Statistiques Contextuelles
- **Métriques en temps réel** : Statistiques basées sur les missions affichées
- **Statut des assignations** : Vue d'ensemble de l'état des missions
- **Chiffre d'affaires** : Suivi financier géographique

## Configuration

### Variables d'Environnement
Aucune configuration supplémentaire requise - utilise OpenStreetMap gratuitement.

### Styles CSS
Les styles Leaflet sont importés automatiquement :
```css
@import 'leaflet/dist/leaflet.css';
```

### Responsive Design
- **Desktop** : Carte en pleine largeur avec panneau latéral
- **Mobile** : Carte adaptée avec navigation tactile
- **Tablet** : Interface hybride optimisée

## Prochaines Améliorations

### Fonctionnalités Futures
- [ ] **Filtrage par type** : Afficher uniquement certains types de missions
- [ ] **Recherche géographique** : Trouver des missions par zone
- [ ] **Itinéraires** : Calculer les trajets entre missions
- [ ] **Clustering** : Grouper les marqueurs proches
- [ ] **Export PDF** : Générer des cartes pour impression

### Optimisations Techniques
- [ ] **Cache des tiles** : Améliorer les performances de chargement
- [ ] **Lazy loading** : Charger les missions à la demande
- [ ] **WebGL** : Rendu accéléré pour de grandes quantités de données

---

*Dernière mise à jour : Décembre 2024* 
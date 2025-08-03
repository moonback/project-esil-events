# Gestion des Véhicules de l'Entreprise

## Vue d'ensemble

La fonctionnalité de gestion des véhicules permet aux administrateurs de gérer la flotte de véhicules de l'entreprise et d'assigner des véhicules aux missions. Les techniciens peuvent également consulter les véhicules assignés à leurs missions.

## Fonctionnalités principales

### 1. Gestion de la flotte de véhicules

#### Types de véhicules supportés
- **Camion** : Pour les gros transports et équipements
- **Fourgon** : Pour les transports moyens
- **Utilitaire** : Pour les transports polyvalents
- **Voiture** : Pour les déplacements légers

#### Informations gérées par véhicule
- Nom du véhicule
- Type de véhicule
- Plaque d'immatriculation (unique)
- Modèle
- Année de fabrication
- Capacité en personnes
- Type de carburant
- Statut (disponible, en maintenance, hors service, en mission)
- Notes et commentaires

### 2. Statuts des véhicules

- **Disponible** : Véhicule prêt à être assigné
- **En maintenance** : Véhicule en réparation
- **Hors service** : Véhicule inutilisable
- **En mission** : Véhicule actuellement assigné à une mission

### 3. Assignation des véhicules aux missions

#### Processus d'assignation
1. L'administrateur sélectionne une mission
2. Il ouvre le dialogue d'assignation de véhicules
3. Il peut voir les véhicules disponibles et déjà assignés
4. Il peut assigner/désassigner des véhicules avec des notes optionnelles
5. Le statut du véhicule est automatiquement mis à jour

#### Contraintes
- Seuls les véhicules disponibles peuvent être assignés
- Un véhicule peut être assigné à plusieurs missions simultanément
- Le statut est automatiquement géré selon les assignations

## Interface utilisateur

### Dashboard Administrateur

#### Onglet "Véhicules"
- **Vue d'ensemble** : Liste de tous les véhicules avec leurs informations
- **Ajout de véhicule** : Formulaire complet pour créer un nouveau véhicule
- **Modification** : Édition des informations d'un véhicule existant
- **Suppression** : Suppression d'un véhicule (avec confirmation)
- **Filtrage** : Par type, statut, capacité, etc.

#### Gestion des assignations
- **Dialogue d'assignation** : Interface dédiée pour assigner des véhicules aux missions
- **Vue des véhicules assignés** : Affichage des véhicules déjà assignés à une mission
- **Notes d'assignation** : Possibilité d'ajouter des notes pour chaque assignation

### Dashboard Technicien

#### Onglet "Véhicules"
- **Vue des véhicules assignés** : Liste des véhicules assignés aux missions du technicien
- **Informations détaillées** : Toutes les informations sur les véhicules
- **Organisation par mission** : Véhicules groupés par mission

## Structure de la base de données

### Table `vehicles`
```sql
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type vehicle_type NOT NULL,
  license_plate text UNIQUE NOT NULL,
  model text NOT NULL,
  year integer,
  capacity integer,
  fuel_type text,
  status vehicle_status DEFAULT 'disponible',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Table `mission_vehicles`
```sql
CREATE TABLE mission_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(mission_id, vehicle_id)
);
```

### Types énumérés
```sql
CREATE TYPE vehicle_type AS ENUM ('camion', 'fourgon', 'utilitaire', 'voiture');
CREATE TYPE vehicle_status AS ENUM ('disponible', 'en_maintenance', 'hors_service', 'en_mission');
```

## Sécurité et permissions

### Politiques RLS (Row Level Security)

#### Véhicules
- **Administrateurs** : Accès complet (CRUD)
- **Techniciens** : Lecture seule des véhicules disponibles

#### Assignations de véhicules
- **Administrateurs** : Accès complet
- **Techniciens** : Lecture des véhicules assignés à leurs missions

## Utilisation

### Pour les administrateurs

1. **Gérer la flotte**
   - Accéder à l'onglet "Véhicules" dans le dashboard admin
   - Ajouter de nouveaux véhicules avec toutes les informations
   - Modifier les informations existantes
   - Supprimer des véhicules obsolètes

2. **Assigner des véhicules aux missions**
   - Ouvrir une mission existante
   - Cliquer sur "Assigner des véhicules"
   - Sélectionner les véhicules disponibles
   - Ajouter des notes si nécessaire
   - Confirmer l'assignation

3. **Suivre l'utilisation**
   - Voir le statut de chaque véhicule
   - Consulter les assignations par mission
   - Gérer les maintenances

### Pour les techniciens

1. **Consulter les véhicules assignés**
   - Accéder à l'onglet "Véhicules" dans le dashboard technicien
   - Voir les véhicules assignés à leurs missions
   - Consulter les informations détaillées

2. **Planifier les missions**
   - Connaître les véhicules disponibles pour chaque mission
   - Voir les caractéristiques (capacité, type, etc.)

## Avantages

### Pour l'entreprise
- **Gestion centralisée** : Tous les véhicules dans un seul endroit
- **Traçabilité** : Historique des assignations
- **Optimisation** : Meilleure utilisation de la flotte
- **Maintenance** : Suivi des véhicules en maintenance

### Pour les techniciens
- **Visibilité** : Connaissance des véhicules assignés
- **Planification** : Anticipation des besoins
- **Efficacité** : Informations centralisées

### Pour les missions
- **Logistique améliorée** : Véhicules appropriés selon les besoins
- **Flexibilité** : Possibilité d'assigner plusieurs véhicules
- **Notes** : Instructions spéciales par véhicule

## Évolutions futures

### Fonctionnalités envisagées
- **Planification automatique** : Suggestion de véhicules selon les besoins
- **Maintenance préventive** : Alertes de maintenance
- **Consommation** : Suivi du carburant et des coûts
- **GPS** : Intégration de localisation en temps réel
- **Notifications** : Alertes pour les assignations et changements de statut

### Améliorations techniques
- **API REST** : Endpoints pour intégration externe
- **Export** : Rapports et exports de données
- **Mobile** : Application mobile dédiée
- **IoT** : Intégration avec les véhicules connectés 
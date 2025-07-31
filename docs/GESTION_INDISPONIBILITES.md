# Gestion des Indisponibilités des Techniciens

## Vue d'ensemble

Le système permet maintenant aux techniciens de gérer leurs indisponibilités en plus de leurs disponibilités. Cette fonctionnalité améliore la planification et évite les conflits d'horaires.

## Nouvelles Fonctionnalités

### 1. Table `unavailability`

Une nouvelle table a été ajoutée à la base de données pour stocker les périodes d'indisponibilité :

```sql
CREATE TABLE unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_unavailability_time_range CHECK (end_time > start_time)
);
```

### 2. Interface Utilisateur Améliorée

#### Onglets Séparés
- **Onglet Disponibilités** : Gestion des périodes de disponibilité
- **Onglet Indisponibilités** : Gestion des périodes d'indisponibilité

#### Statistiques Enrichies
- Nombre de disponibilités et heures totales
- Nombre d'indisponibilités et heures totales
- Taux de disponibilité en pourcentage
- Statistiques du mois en cours

#### Calendrier Unifié
- Affichage des disponibilités en vert
- Affichage des indisponibilités en rouge
- Affichage des missions acceptées en bleu
- Vue mois, semaine ou liste

### 3. Validation des Conflits

Le système vérifie automatiquement les conflits :
- Impossible d'ajouter une disponibilité sur une période d'indisponibilité
- Impossible d'ajouter une indisponibilité sur une période de disponibilité
- Messages d'erreur explicites en cas de conflit

### 4. Formulaire d'Indisponibilité

Les techniciens peuvent ajouter des indisponibilités avec :
- Date et heure de début
- Date et heure de fin
- Raison optionnelle (congés, formation, rendez-vous médical, etc.)

## Utilisation

### Pour les Techniciens

1. **Accéder à l'onglet Disponibilité** dans leur tableau de bord
2. **Basculer entre les onglets** "Disponibilités" et "Indisponibilités"
3. **Ajouter une indisponibilité** :
   - Cliquer sur "Ajouter" dans l'onglet Indisponibilités
   - Remplir les dates de début et fin
   - Optionnellement ajouter une raison
   - Valider

4. **Visualiser le planning** :
   - Calendrier avec toutes les périodes
   - Couleurs distinctes pour chaque type d'événement
   - Statistiques en temps réel

### Pour les Administrateurs

Les administrateurs peuvent voir toutes les indisponibilités des techniciens pour une meilleure planification des missions.

## Avantages

1. **Planification Améliorée** : Les administrateurs peuvent voir les indisponibilités lors de l'assignation des missions
2. **Éviter les Conflits** : Le système empêche les assignations sur des périodes d'indisponibilité
3. **Transparence** : Les techniciens peuvent clairement indiquer leurs contraintes
4. **Flexibilité** : Possibilité d'ajouter des raisons pour justifier les indisponibilités

## Migration

Pour appliquer les changements :

1. Exécuter la migration : `supabase/migrations/20250731130001_add_unavailability.sql`
2. Redémarrer l'application
3. Les techniciens peuvent immédiatement commencer à utiliser les nouvelles fonctionnalités

## Code Modifié

### Fichiers Principaux
- `src/components/technician/AvailabilityTab.tsx` : Interface principale
- `src/types/database.ts` : Types TypeScript
- `src/components/technician/TechnicianAgendaTab.tsx` : Affichage dans l'agenda

### Nouvelles Fonctionnalités
- Gestion des onglets (disponibilités/indisponibilités)
- Validation des conflits temporels
- Statistiques enrichies
- Interface utilisateur améliorée 
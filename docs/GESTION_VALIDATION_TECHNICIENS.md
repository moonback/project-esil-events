# Gestion de la Validation des Techniciens et Annulation Automatique des Demandes

## Vue d'ensemble

Cette fonctionnalité permet de gérer la validation des techniciens et d'annuler automatiquement les demandes en attente lorsque le nombre de techniciens validés requis est atteint.

## Fonctionnalités principales

### 1. Validation des Techniciens

- **Champ `is_validated`** : Ajout d'un champ boolean dans la table `users` pour marquer les techniciens comme validés
- **Interface d'administration** : Boutons de validation/dévalidation dans l'onglet Techniciens
- **Filtres** : Possibilité de filtrer les techniciens par statut de validation
- **Statistiques** : Affichage du nombre de techniciens validés dans les statistiques globales

### 2. Annulation Automatique des Demandes

- **Triggers automatiques** : Annulation automatique des demandes en attente quand :
  - Un technicien validé accepte une mission et que le nombre de techniciens validés requis est atteint
  - Un technicien est validé et que cela permet d'atteindre le nombre requis pour ses missions acceptées

### 3. Interface de Gestion

- **Onglet Assignations** : Nouvel onglet dans le dashboard admin pour gérer les assignations
- **Annulation manuelle** : Possibilité d'annuler manuellement les demandes en attente
- **Statut en temps réel** : Affichage du nombre de techniciens validés acceptés vs requis

## Structure de la Base de Données

### Migration `20250731130002_add_technician_validation.sql`

```sql
-- Ajout du champ is_validated à la table users
ALTER TABLE users 
ADD COLUMN is_validated boolean DEFAULT false;

-- Index pour améliorer les performances
CREATE INDEX idx_users_is_validated ON users(is_validated);
CREATE INDEX idx_users_role_validated ON users(role, is_validated);
```

### Fonctions et Triggers

#### Fonction `cancel_pending_assignments()`
```sql
-- Annule automatiquement les demandes en attente quand le nombre de techniciens validés est suffisant
CREATE OR REPLACE FUNCTION cancel_pending_assignments()
RETURNS TRIGGER AS $$
-- Logique d'annulation automatique
```

#### Fonction `check_and_cancel_pending_on_validation()`
```sql
-- Vérifie et annule les demandes existantes quand un technicien est validé
CREATE OR REPLACE FUNCTION check_and_cancel_pending_on_validation()
RETURNS TRIGGER AS $$
-- Logique de vérification lors de la validation
```

## Interface Utilisateur

### Onglet Techniciens

1. **Bouton de validation** : Icône UserCheck/UserX pour valider/dévalider
2. **Badge de statut** : Affichage du statut de validation
3. **Filtre de validation** : Filtrage par techniciens validés/non validés
4. **Statistiques** : Compteur de techniciens validés

### Onglet Assignations

1. **Vue des missions** : Affichage de toutes les missions avec leurs assignations
2. **Statut des techniciens validés** : Compteur validés/requis pour chaque mission
3. **Bouton d'annulation manuelle** : Annulation manuelle des demandes en attente
4. **Badges de statut** : Statut des assignations et validation des techniciens

## Logique Métier

### Conditions d'annulation automatique

1. **Acceptation d'un technicien validé** :
   - Un technicien validé accepte une mission
   - Le nombre de techniciens validés acceptés atteint `required_people`
   - Toutes les demandes en attente sont automatiquement annulées

2. **Validation d'un technicien** :
   - Un technicien est validé par l'administrateur
   - Ce technicien a des missions acceptées
   - La validation permet d'atteindre le nombre requis pour certaines missions
   - Les demandes en attente pour ces missions sont annulées

### Calcul du nombre de techniciens validés

```sql
-- Compter les techniciens validés acceptés pour une mission
SELECT COUNT(*) 
FROM mission_assignments ma
JOIN users u ON ma.technician_id = u.id
WHERE ma.mission_id = ? 
  AND ma.status = 'accepté'
  AND u.is_validated = true
```

## Utilisation

### Pour l'Administrateur

1. **Valider un technicien** :
   - Aller dans l'onglet Techniciens
   - Cliquer sur l'icône UserCheck à côté du technicien
   - Le technicien est marqué comme validé

2. **Gérer les assignations** :
   - Aller dans l'onglet Assignations
   - Voir le statut des techniciens validés pour chaque mission
   - Annuler manuellement les demandes si nécessaire

3. **Surveiller l'annulation automatique** :
   - Les demandes sont automatiquement annulées quand les conditions sont remplies
   - Des notifications apparaissent pour confirmer les actions

### Pour les Techniciens

1. **Demandes en attente** : Les demandes peuvent être automatiquement annulées
2. **Notifications** : Ils reçoivent des notifications quand leurs demandes sont annulées
3. **Statut de validation** : Ils peuvent voir leur statut de validation dans leur profil

## Avantages

1. **Optimisation automatique** : Réduction manuelle du travail d'administration
2. **Priorisation des techniciens validés** : Les techniciens validés ont la priorité
3. **Gestion efficace** : Évite les conflits et les sur-assignations
4. **Transparence** : Interface claire pour comprendre le processus

## Configuration

### Variables d'environnement

Aucune variable d'environnement spécifique n'est requise pour cette fonctionnalité.

### Permissions

- **Administrateurs** : Peuvent valider/dévalider les techniciens et annuler manuellement les demandes
- **Techniciens** : Peuvent voir leur statut de validation et recevoir des notifications

## Maintenance

### Logs

Les actions d'annulation automatique sont loggées avec des messages informatifs :
```
Annulation automatique des demandes en attente pour la mission X: Y techniciens validés sur Z requis
```

### Monitoring

- Surveiller le nombre de techniciens validés
- Vérifier que l'annulation automatique fonctionne correctement
- Contrôler les performances des triggers

## Évolutions futures

1. **Critères de validation** : Ajouter des critères spécifiques pour la validation
2. **Historique des validations** : Traçabilité des actions de validation
3. **Notifications avancées** : Notifications plus détaillées pour les techniciens
4. **Statistiques de validation** : Métriques sur l'efficacité du système 
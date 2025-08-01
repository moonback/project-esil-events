# Gestion des Paiements - Documentation

## Vue d'ensemble

Cette fonctionnalité permet à l'administrateur de créer des paiements à partir de plusieurs missions acceptées d'un technicien, et offre aux techniciens une vue détaillée de leurs rémunérations.

## Fonctionnalités Administrateur

### 1. Création de Paiements Multiples

**Composant :** `CreatePaymentDialog`

**Fonctionnalités :**
- Sélection de plusieurs missions acceptées d'un technicien
- Calcul automatique du montant total basé sur les forfaits
- Possibilité de définir un montant personnalisé
- Ajout de notes pour chaque paiement
- Filtrage des missions déjà facturées

**Interface :**
- Dialog modal avec interface intuitive
- Liste des missions acceptées avec cases à cocher
- Résumé en temps réel du montant total
- Validation avant création

**Accès :**
- Depuis l'onglet "Facturation" via le bouton "Créer un paiement"
- Depuis l'onglet "Techniciens" via le bouton "+" sur chaque technicien

### 2. Gestion des Paiements

**Composant :** `AdminBillingTab`

**Fonctionnalités :**
- Liste de tous les paiements avec filtres
- Mise à jour du statut (en attente → validé → payé)
- Suppression de paiements
- Statistiques en temps réel
- Filtrage par technicien et statut

**Statuts de paiement :**
- `en_attente` : Paiement créé, en attente de validation
- `validé` : Paiement validé par l'administrateur
- `payé` : Paiement effectué

### 3. Résumé des Paiements

**Composant :** `PaymentSummaryCard`

**Fonctionnalités :**
- Statistiques globales des paiements
- Liste des paiements récents
- Alertes pour les paiements en attente
- Navigation vers la vue détaillée

## Fonctionnalités Technicien

### 1. Vue Détaillée des Paiements

**Composant :** `TechnicianBillingTab`

**Fonctionnalités :**
- Liste de tous les paiements du technicien
- Filtrage par statut
- Vue détaillée extensible pour chaque paiement
- Informations complètes sur les missions
- Historique des paiements

**Détails affichés :**
- Informations de la mission (titre, lieu, dates, type)
- Montant et statut du paiement
- Notes administratives
- Dates de création et de paiement
- Statut en temps réel

### 2. Résumé Personnel

**Composant :** `PaymentSummaryCard` (version technicien)

**Fonctionnalités :**
- Statistiques personnelles
- Paiements récents
- Alertes de statut
- Montants par catégorie

## Structure des Données

### Table `billing`

```sql
CREATE TABLE billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  status billing_status DEFAULT 'en_attente',
  payment_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(mission_id, technician_id)
);
```

### Types TypeScript

```typescript
export type BillingStatus = 'en_attente' | 'validé' | 'payé'

export type Billing = {
  id: string
  mission_id: string
  technician_id: string
  amount: number
  status: BillingStatus
  payment_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type BillingWithDetails = Billing & {
  missions: Mission
  users: User
}
```

## Workflow de Paiement

### 1. Création par l'Administrateur

1. L'administrateur sélectionne un technicien
2. Le système récupère toutes les missions acceptées non facturées
3. L'administrateur sélectionne les missions à inclure
4. Le système calcule automatiquement le montant total
5. L'administrateur peut ajuster le montant ou ajouter des notes
6. Le système crée un enregistrement `billing` pour chaque mission

### 2. Validation et Paiement

1. Le paiement est créé avec le statut `en_attente`
2. L'administrateur peut valider le paiement (statut `validé`)
3. Une fois le paiement effectué, l'administrateur marque comme `payé`
4. La date de paiement est automatiquement enregistrée

### 3. Suivi par le Technicien

1. Le technicien voit ses paiements dans l'onglet "Facturation"
2. Chaque paiement affiche le statut en temps réel
3. Le technicien peut consulter les détails de chaque paiement
4. Les statistiques personnelles sont mises à jour automatiquement

## Composants UI

### CreatePaymentDialog
- Interface de sélection des missions
- Calcul en temps réel des montants
- Validation des données
- Gestion des erreurs

### PaymentSummaryCard
- Affichage des statistiques
- Liste des paiements récents
- Alertes de statut
- Navigation vers la vue détaillée

### TechnicianBillingTab
- Liste complète des paiements
- Filtrage et tri
- Vue détaillée extensible
- Informations contextuelles

## Sécurité et Permissions

### Row Level Security (RLS)

```sql
-- Les techniciens ne peuvent voir que leurs propres paiements
CREATE POLICY "Technicians can view own billings"
  ON billing FOR SELECT
  TO authenticated
  USING (auth.uid() = technician_id);

-- Les administrateurs peuvent voir tous les paiements
CREATE POLICY "Admins can view all billings"
  ON billing FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

### Validation des Données

- Vérification que les missions sont bien acceptées
- Contrôle des montants (positifs)
- Validation des dates
- Protection contre les doublons

## Notifications et Alertes

### Administrateur
- Alertes pour les paiements en attente de validation
- Notifications pour les paiements validés en cours de traitement
- Statistiques en temps réel

### Technicien
- Alertes pour les nouveaux paiements
- Notifications de changement de statut
- Résumé des rémunérations

## Améliorations Futures

1. **Export PDF** : Génération de factures PDF
2. **Notifications Push** : Alertes en temps réel
3. **Historique détaillé** : Suivi des modifications
4. **Paiements groupés** : Création de paiements pour plusieurs techniciens
5. **Intégration bancaire** : Connexion avec les systèmes de paiement
6. **Rapports avancés** : Analytics et reporting

## Utilisation

### Pour l'Administrateur

1. Aller dans l'onglet "Facturation"
2. Cliquer sur "Créer un paiement"
3. Sélectionner un technicien
4. Choisir les missions à facturer
5. Ajuster le montant si nécessaire
6. Ajouter des notes optionnelles
7. Valider la création

### Pour le Technicien

1. Aller dans l'onglet "Facturation"
2. Consulter le résumé des rémunérations
3. Cliquer sur "Détails" pour voir les informations complètes
4. Filtrer par statut si nécessaire
5. Suivre l'évolution des paiements

## Support Technique

Pour toute question ou problème :
- Consulter les logs de la console
- Vérifier les permissions RLS
- Contrôler la cohérence des données
- Tester avec des données de test 
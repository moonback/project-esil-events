# Fiche de Contact des Techniciens

## Vue d'ensemble

Cette fonctionnalité permet de gérer les informations de contact complètes des techniciens, incluant les coordonnées personnelles et les contacts d'urgence.

## Fonctionnalités ajoutées

### 1. Base de données

#### Nouveaux champs dans la table `users` :
- `email` : Email de contact du technicien
- `address` : Adresse complète du technicien
- `notes` : Notes additionnelles sur le technicien

#### Migration SQL :
```sql
-- Migration pour ajouter des informations de contact supplémentaires aux techniciens
ALTER TABLE users 
ADD COLUMN email text,
ADD COLUMN address text,
ADD COLUMN notes text;
```

### 2. Interface Administrateur

#### Onglet Techniciens (`TechniciansTab.tsx`)
- **Bouton de contact** : Icône de contact à côté de chaque technicien
- **Dialogue de contact** : Fenêtre modale pour voir/modifier les informations
- **Vue détaillée** : Affichage des informations de contact dans la vue étendue

#### Composant `TechnicianContactDialog.tsx`
- **Informations personnelles** : Nom, téléphone, email, adresse
- **Notes** : Informations importantes (allergies, préférences, etc.)
- **Mode édition** : Possibilité de modifier les informations
- **Validation** : Vérification des données avant sauvegarde

### 3. Interface Technicien

#### Nouvel onglet "Mon Profil" (`TechnicianProfileTab.tsx`)
- **Gestion personnelle** : Les techniciens peuvent modifier leurs propres informations
- **Interface intuitive** : Formulaire organisé en sections
- **Sauvegarde sécurisée** : Mise à jour des données avec validation

### 4. Composants UI

#### `Textarea.tsx`
- Composant de zone de texte pour les notes
- Style cohérent avec le design system
- Support des états disabled et focus

## Utilisation

### Pour les Administrateurs

1. **Accéder aux fiches de contact** :
   - Aller dans l'onglet "Techniciens"
   - Cliquer sur l'icône de contact (👤) à côté d'un technicien
   - Le dialogue s'ouvre avec toutes les informations

2. **Modifier les informations** :
   - Cliquer sur "Modifier" dans le dialogue
   - Remplir les champs souhaités
   - Cliquer sur "Sauvegarder"

3. **Voir les informations dans la vue détaillée** :
   - Activer la "Vue détaillée" dans l'onglet Techniciens
   - Les informations de contact apparaissent dans la section détaillée

### Pour les Techniciens

1. **Accéder à son profil** :
   - Aller dans l'onglet "Mon Profil" du dashboard
   - Toutes les informations personnelles sont affichées

2. **Modifier ses informations** :
   - Cliquer sur "Modifier mes informations"
   - Remplir les champs souhaités
   - Cliquer sur "Sauvegarder"

## Structure des données

### Type User (étendu)
```typescript
interface User {
  id: string
  role: 'admin' | 'technicien'
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
```

## Sécurité

- **RLS (Row Level Security)** : Les techniciens ne peuvent modifier que leurs propres informations
- **Validation** : Vérification des données côté client et serveur
- **Permissions** : Seuls les administrateurs peuvent voir toutes les fiches de contact

## Améliorations futures

1. **Import/Export** : Possibilité d'importer/exporter les fiches de contact
2. **Notifications** : Alertes en cas de modification des informations importantes
3. **Historique** : Suivi des modifications des informations de contact
4. **Photos** : Ajout de photos de profil des techniciens
5. **Documents** : Upload de documents (CV, certificats, etc.)

## Fichiers modifiés/créés

### Nouveaux fichiers :
- `supabase/migrations/20250731130000_add_contact_info.sql`
- `src/components/admin/TechnicianContactDialog.tsx`
- `src/components/technician/TechnicianProfileTab.tsx`
- `src/components/ui/textarea.tsx`
- `FICHE_CONTACT_TECHNICIENS.md`

### Fichiers modifiés :
- `src/types/database.ts` : Ajout des nouveaux champs
- `src/components/admin/TechniciansTab.tsx` : Intégration du dialogue de contact
- `src/components/technician/TechnicianDashboard.tsx` : Ajout de l'onglet profil 
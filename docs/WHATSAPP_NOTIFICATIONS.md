# Notifications WhatsApp - Guide d'implémentation

## Vue d'ensemble

Ce guide explique comment implémenter et configurer les notifications WhatsApp automatiques lors de l'assignation de techniciens à des missions.

## Fonctionnalités

- ✅ Notifications automatiques lors de l'assignation
- ✅ Messages personnalisés avec détails de la mission
- ✅ Historique des notifications avec statuts
- ✅ Interface de test des notifications
- ✅ Gestion des erreurs et retry
- ✅ Support des templates WhatsApp Business API

## Configuration

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Configuration WhatsApp Business API
VITE_WHATSAPP_API_URL=https://graph.facebook.com/v18.0/votre_numero_telephone/messages
VITE_WHATSAPP_API_TOKEN=votre_token_acces_whatsapp_business_api
```

### 2. Configuration WhatsApp Business API

#### Étape 1 : Créer un compte WhatsApp Business API
1. Allez sur [Meta for Developers](https://developers.facebook.com/)
2. Créez une nouvelle application
3. Ajoutez le produit "WhatsApp Business API"
4. Configurez votre numéro de téléphone WhatsApp Business

#### Étape 2 : Obtenir les tokens d'accès
1. Dans votre application Meta, allez dans "WhatsApp > Getting Started"
2. Copiez votre `Phone Number ID`
3. Générez un `Permanent Access Token`
4. Configurez votre webhook (optionnel)

#### Étape 3 : Créer les templates de messages
1. Dans WhatsApp Business Manager, créez des templates :
   - `mission_assignment` : Pour les nouvelles assignations
   - `mission_reminder` : Pour les rappels de mission

### 3. Migration de base de données

Exécutez la migration pour créer la table des notifications :

```sql
-- Migration: 20250731130002_add_whatsapp_notifications.sql
-- Cette migration crée la table whatsapp_notifications
```

## Utilisation

### 1. Assignation avec notifications

Lors de l'assignation d'un technicien à une mission :

1. Ouvrez le dialogue d'assignation
2. Sélectionnez les techniciens
3. Cochez "Envoyer les notifications WhatsApp"
4. Cliquez sur "Assigner"

Les notifications seront envoyées automatiquement à tous les techniciens sélectionnés.

### 2. Test des notifications

1. Allez dans l'onglet "Notifications" du tableau de bord admin
2. Cliquez sur "Test"
3. Sélectionnez un technicien
4. Entrez un message de test (optionnel)
5. Cliquez sur "Envoyer le test"

### 3. Historique des notifications

L'onglet "Notifications" affiche :
- Liste des notifications envoyées
- Statut de livraison (envoyé, livré, échec)
- Détails des messages
- Possibilité de vérifier le statut en temps réel

## Structure du code

### Services

#### `src/lib/whatsappService.ts`
Service principal pour l'envoi des notifications WhatsApp.

**Méthodes principales :**
- `sendMissionAssignmentNotification()` : Envoie une notification d'assignation
- `sendMissionReminderNotification()` : Envoie un rappel de mission
- `checkNotificationStatus()` : Vérifie le statut de livraison

#### `src/lib/useWhatsAppNotifications.ts`
Hook React pour gérer les notifications côté frontend.

**Fonctionnalités :**
- Gestion des notifications en lot
- Récupération de l'historique
- Gestion des erreurs avec toasts

### Composants

#### `src/components/admin/AssignTechniciansDialog.tsx`
Dialogue d'assignation avec option d'envoi de notifications.

#### `src/components/admin/WhatsAppNotificationsTab.tsx`
Onglet pour afficher l'historique des notifications.

#### `src/components/admin/WhatsAppTestDialog.tsx`
Dialogue de test des notifications.

### Base de données

#### Table `whatsapp_notifications`
```sql
CREATE TABLE whatsapp_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_phone text NOT NULL,
  message text NOT NULL,
  mission_id uuid NOT NULL REFERENCES missions(id),
  technician_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'delivered')),
  whatsapp_message_id text,
  error_message text,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

## Messages et templates

### Template d'assignation
```
🎯 Nouvelle mission assignée !

📋 Mission: {mission_title}
🏷️ Type: {mission_type}
📍 Lieu: {mission_location}
📅 Début: {mission_start_date}
📅 Fin: {mission_end_date}
💰 Rémunération: {mission_forfeit}€

Connectez-vous à votre espace technicien pour accepter ou refuser cette mission.

Merci de votre confiance !
```

### Template de rappel
```
⏰ Rappel de mission !

📋 Mission: {mission_title}
📍 Lieu: {mission_location}
📅 Date: {mission_start_date}

N'oubliez pas de vous présenter à l'heure prévue.

Bon travail !
```

## Gestion des erreurs

### Types d'erreurs courantes

1. **Numéro de téléphone manquant**
   - Vérifiez que le technicien a un numéro de téléphone enregistré
   - Affiche un toast d'erreur

2. **Erreur d'API WhatsApp**
   - Token d'accès invalide
   - Numéro de téléphone non autorisé
   - Quota dépassé

3. **Erreur de réseau**
   - Problème de connexion
   - Timeout de l'API

### Logs et monitoring

Les erreurs sont :
- Loggées dans la console
- Enregistrées dans la base de données
- Affichées via des toasts utilisateur

## Sécurité

### Variables d'environnement
- Les tokens d'API ne sont jamais exposés côté client
- Utilisation de variables d'environnement Vite

### Validation des données
- Vérification du format des numéros de téléphone
- Validation des données de mission
- Sanitisation des messages

### Permissions
- Seuls les admins peuvent envoyer des notifications
- Les techniciens peuvent voir leurs propres notifications

## Performance

### Optimisations
- Envoi en lot pour plusieurs techniciens
- Gestion asynchrone des notifications
- Cache des statuts de livraison
- Pagination de l'historique

### Monitoring
- Suivi des taux de livraison
- Détection des échecs
- Métriques de performance

## Tests

### Tests unitaires
```typescript
// Test du service WhatsApp
describe('WhatsAppService', () => {
  it('should send assignment notification', async () => {
    const service = new WhatsAppService()
    const result = await service.sendMissionAssignmentNotification(
      '+33123456789',
      testTemplate
    )
    expect(result).toBe(true)
  })
})
```

### Tests d'intégration
1. Test avec un vrai numéro WhatsApp
2. Vérification des templates
3. Test des erreurs d'API

## Déploiement

### Prérequis
- Compte WhatsApp Business API actif
- Tokens d'accès configurés
- Variables d'environnement définies

### Étapes
1. Configurez les variables d'environnement
2. Exécutez la migration de base de données
3. Testez avec un numéro de téléphone réel
4. Vérifiez les logs d'erreur

## Support

### Dépannage

**Problème : Les notifications ne s'envoient pas**
1. Vérifiez les variables d'environnement
2. Testez la connexion à l'API WhatsApp
3. Vérifiez les logs d'erreur

**Problème : Messages non livrés**
1. Vérifiez le format du numéro de téléphone
2. Assurez-vous que le numéro est autorisé
3. Vérifiez les templates WhatsApp

### Contact
Pour toute question ou problème, consultez la documentation WhatsApp Business API ou contactez l'équipe de développement. 
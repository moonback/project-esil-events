# Intégration WhatsApp pour les Notifications de Missions

## Vue d'ensemble

Cette fonctionnalité permet l'envoi automatique de messages WhatsApp aux techniciens lorsqu'ils reçoivent une mission proposée, ainsi que des confirmations et des rappels automatiques.

## Fonctionnalités

### 1. Notifications automatiques
- **Proposition de mission** : Message envoyé automatiquement quand un technicien est assigné à une mission
- **Confirmation d'acceptation** : Message de confirmation quand un technicien accepte une mission
- **Rappels automatiques** : Rappels envoyés aux techniciens qui n'ont pas encore répondu

### 2. Types de messages

#### Proposition de mission
```
🎯 Nouvelle mission proposée !

Bonjour [Nom du technicien],

Une nouvelle mission vous a été proposée :

🎯 [Titre de la mission]
📅 [Date de début] - [Date de fin]
📍 [Localisation]
💰 [Montant]€
👥 [Nombre de personnes] personne(s) requise(s)
📝 [Description si disponible]

Veuillez répondre rapidement pour accepter ou refuser cette mission.

Merci !
```

#### Confirmation d'acceptation
```
✅ Mission acceptée !

🎯 [Titre de la mission]
📅 [Date de début] - [Date de fin]
📍 [Localisation]
💰 [Montant]€
👥 [Nombre de personnes] personne(s) requise(s)

Merci pour votre engagement !
```

#### Rappel automatique
```
⏰ Rappel - Mission en attente

🎯 [Titre de la mission]
📅 [Date de début] - [Date de fin]
📍 [Localisation]
💰 [Montant]€

Veuillez répondre à cette proposition dans les plus brefs délais.
Merci !
```

## Configuration

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Configuration WhatsApp Business API
VITE_WHATSAPP_PHONE_NUMBER_ID=votre_phone_number_id
VITE_WHATSAPP_ACCESS_TOKEN=votre_access_token
```

### 2. Configuration WhatsApp Business API

1. **Créer un compte Facebook Business**
2. **Configurer WhatsApp Business API**
3. **Obtenir le Phone Number ID**
4. **Générer un Access Token permanent**

### 3. Interface de configuration

L'application inclut une interface de configuration accessible depuis le dashboard administrateur :

- **Bouton WhatsApp** : Dans le header du dashboard
- **Test de connexion** : Vérifier que l'API fonctionne
- **Test d'envoi** : Envoyer un message de test
- **Statut de configuration** : Voir si le service est configuré

## Implémentation technique

### 1. Service WhatsApp (`src/lib/whatsapp.ts`)

```typescript
export class WhatsAppService {
  // Envoie un message de proposition de mission
  static async sendMissionProposal(phoneNumber: string, data: MissionNotificationData): Promise<boolean>
  
  // Envoie une confirmation d'acceptation
  static async sendMissionAccepted(phoneNumber: string, data: MissionNotificationData): Promise<boolean>
  
  // Envoie un rappel automatique
  static async sendMissionReminder(phoneNumber: string, data: MissionNotificationData): Promise<boolean>
  
  // Vérifie si le service est configuré
  static isConfigured(): boolean
  
  // Teste la connexion
  static async testConnection(): Promise<boolean>
}
```

### 2. Service de rappels (`src/lib/whatsappReminders.ts`)

```typescript
export class WhatsAppRemindersService {
  // Envoie des rappels pour les missions en attente depuis 2h
  static async sendPendingReminders(): Promise<void>
  
  // Envoie des rappels urgents pour les missions en attente depuis 24h
  static async sendUrgentReminders(): Promise<void>
  
  // Vérifie et envoie tous les rappels nécessaires
  static async checkAndSendReminders(): Promise<void>
  
  // Démarre le service de rappels automatiques
  static startAutomaticReminders(): void
  
  // Obtient les statistiques des rappels
  static async getReminderStats(): Promise<ReminderStats>
}
```

### 3. Intégration dans les composants

#### Assignation de techniciens (`AssignTechniciansDialog.tsx`)
```typescript
// Envoi automatique lors de l'assignation
if (WhatsAppService.isConfigured()) {
  const success = await WhatsAppService.sendMissionProposal(
    technician.phone,
    notificationData
  )
}
```

#### Réponse des techniciens (`ProposedMissionsTab.tsx`)
```typescript
// Confirmation lors de l'acceptation
if (status === 'accepté' && WhatsAppService.isConfigured()) {
  const success = await WhatsAppService.sendMissionAccepted(
    profile.phone,
    notificationData
  )
}
```

## Flux de notifications

### 1. Assignation d'une mission
1. L'administrateur assigne un technicien à une mission
2. Le système crée une assignation avec le statut "proposé"
3. Un message WhatsApp est automatiquement envoyé au technicien
4. Le technicien reçoit la notification sur son téléphone

### 2. Réponse du technicien
1. Le technicien accepte ou refuse la mission dans l'application
2. Si acceptée, une confirmation WhatsApp est envoyée
3. Une entrée de facturation est créée automatiquement

### 3. Rappels automatiques
1. **Après 2 heures** : Premier rappel pour les missions non répondues
2. **Après 24 heures** : Rappel urgent pour les missions toujours en attente
3. Les rappels sont envoyés toutes les 30 minutes

## Gestion des erreurs

### 1. Erreurs courantes
- **Service non configuré** : Aucun message envoyé, log d'avertissement
- **Numéro de téléphone manquant** : Skip du technicien, log d'avertissement
- **Erreur API** : Log d'erreur détaillé, tentative de récupération

### 2. Logs et monitoring
```typescript
// Exemples de logs
console.log('Message WhatsApp envoyé avec succès à Jean Dupont')
console.error('Échec de l\'envoi du message WhatsApp à Marie Martin')
console.warn('Service WhatsApp non configuré. Les messages ne seront pas envoyés.')
```

## Sécurité et conformité

### 1. Protection des données
- Les numéros de téléphone sont formatés automatiquement
- Les tokens d'accès sont stockés de manière sécurisée
- Aucune donnée sensible n'est exposée dans les logs

### 2. Conformité RGPD
- Les techniciens peuvent désactiver les notifications
- Les données sont supprimées à la demande
- Consentement explicite pour les notifications

## Tests et validation

### 1. Test de connexion
- Vérification de la configuration
- Test de l'API WhatsApp Business
- Validation des paramètres

### 2. Test d'envoi
- Envoi de message de test
- Validation du format du numéro
- Vérification de la réception

### 3. Test des rappels
- Simulation de missions en attente
- Test des rappels automatiques
- Validation des délais

## Maintenance et support

### 1. Monitoring
- Surveiller les logs d'erreur
- Vérifier les taux de succès
- Analyser les statistiques d'envoi

### 2. Mise à jour
- Maintenir les tokens d'accès
- Mettre à jour les templates de messages
- Optimiser les délais de rappel

### 3. Support utilisateur
- Guide de configuration
- FAQ sur les notifications
- Support technique pour les problèmes

## Avantages

### 1. Amélioration de la communication
- **Notifications instantanées** : Les techniciens sont informés immédiatement
- **Réactivité accrue** : Réponses plus rapides aux propositions
- **Réduction des oublis** : Rappels automatiques pour les missions en attente

### 2. Optimisation du workflow
- **Automatisation** : Envoi automatique des notifications
- **Suivi en temps réel** : Statut des notifications tracé
- **Efficacité** : Moins de suivi manuel nécessaire

### 3. Expérience utilisateur
- **Interface familière** : WhatsApp est largement utilisé
- **Notifications push** : Alertes instantanées sur mobile
- **Messages riches** : Emojis et formatage pour une meilleure lisibilité

## Prochaines améliorations

### 1. Fonctionnalités avancées
- [ ] **Templates personnalisables** : Messages adaptés selon le type de mission
- [ ] **Notifications de groupe** : Messages pour les équipes
- [ ] **Statuts de livraison** : Notifications de progression
- [ ] **Intégration calendrier** : Ajout automatique aux agendas

### 2. Optimisations techniques
- [ ] **Queue de messages** : Gestion des envois en lot
- [ ] **Retry automatique** : Nouvelle tentative en cas d'échec
- [ ] **Métriques avancées** : Statistiques détaillées d'envoi
- [ ] **Webhooks** : Réception des réponses WhatsApp

### 3. Expérience utilisateur
- [ ] **Préférences de notification** : Choix des types de messages
- [ ] **Horaires de notification** : Respect des heures de repos
- [ ] **Langues multiples** : Support de plusieurs langues
- [ ] **Accessibilité** : Support des lecteurs d'écran

---

*Dernière mise à jour : Décembre 2024* 
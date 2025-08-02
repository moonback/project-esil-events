# Service d'Email - Documentation

## Vue d'ensemble

Le service d'email permet d'envoyer automatiquement des notifications aux techniciens suite aux différentes actions dans l'application (assignations, réponses aux missions, paiements, etc.).

## Configuration

### Variables d'environnement

Ajoutez les variables suivantes dans votre fichier `.env` :

```env
# Configuration SMTP
VITE_SMTP_HOST=mail.dresscodeia.fr
VITE_SMTP_PORT=465
VITE_SMTP_USER=client@dresscodeia.fr
VITE_SMTP_PASSWORD=votre_mot_de_passe_smtp
VITE_SMTP_FROM=client@dresscodeia.fr
VITE_SMTP_FROM_NAME=Esil-events
```

### Configuration requise

- **Serveur SMTP** : mail.dresscodeia.fr
- **Port** : 465 (SSL/TLS)
- **Authentification** : Utilisateur et mot de passe requis
- **Sécurité** : Connexion sécurisée (SSL/TLS)

## Fonctionnalités

### 1. Statut de connexion en temps réel

Le statut de connexion SMTP est affiché dans le header pour les administrateurs :
- ✅ **Connecté** : Icône verte avec indicateur de connexion
- ❌ **Déconnecté** : Icône rouge avec alerte
- 🔄 **Vérification** : Animation de chargement pendant la vérification

### 2. Templates d'emails

#### Mission proposée
- **Déclencheur** : Assignation d'un technicien à une mission
- **Contenu** : Détails de la mission, lieu, date, forfait
- **Action** : Lien vers l'espace technicien

#### Mission acceptée
- **Déclencheur** : Acceptation d'une mission par le technicien
- **Contenu** : Confirmation avec détails de la mission
- **Action** : Préparation de l'intervention

#### Mission refusée
- **Déclencheur** : Refus d'une mission par le technicien
- **Contenu** : Confirmation du refus
- **Action** : Proposition à d'autres techniciens

#### Paiement créé
- **Déclencheur** : Création d'un paiement par l'administrateur
- **Contenu** : Montant total et missions concernées
- **Action** : Suivi du paiement

### 3. Test de configuration

Un outil de test intégré permet de :
- Vérifier la connexion SMTP
- Afficher la configuration actuelle
- Envoyer un email de test
- Diagnostiquer les problèmes de configuration

## Utilisation

### Pour les Administrateurs

1. **Vérifier le statut SMTP** :
   - Le statut est visible dans le header
   - Cliquer sur l'icône de test pour ouvrir le dialogue de test

2. **Tester la configuration** :
   - Ouvrir le dialogue de test SMTP
   - Saisir une adresse email de test
   - Envoyer un email de test
   - Vérifier la réception

3. **Emails automatiques** :
   - Les emails sont envoyés automatiquement lors des assignations
   - Les emails sont envoyés lors de la création de paiements

### Pour les Techniciens

1. **Réception d'emails** :
   - Email automatique lors de l'assignation à une mission
   - Email de confirmation lors de l'acceptation/refus
   - Email de notification lors de la création d'un paiement

2. **Contenu des emails** :
   - Informations détaillées sur les missions
   - Liens vers l'espace technicien
   - Statut de connexion SMTP inclus

## Architecture technique

### Service d'email (`src/services/emailService.ts`)

```typescript
// Singleton pattern pour le service
export class EmailService {
  private static instance: EmailService
  private isConnected: boolean = false

  // Vérification de la connexion
  private async verifyConnection(): Promise<void>

  // Envoi d'emails
  public async sendEmail(emailData: EmailData): Promise<boolean>

  // Templates prédéfinis
  public static getMissionAssignmentTemplate()
  public static getMissionAcceptedTemplate()
  public static getMissionRejectedTemplate()
  public static getPaymentCreatedTemplate()
}
```

### Hook d'utilisation (`useEmailService`)

```typescript
export const useEmailService = () => {
  return {
    sendEmail,
    isConnected,
    sendMissionAssignment,
    sendMissionAccepted,
    sendMissionRejected,
    sendPaymentCreated
  }
}
```

### Composant de statut (`src/components/ui/smtp-status.tsx`)

```typescript
export function SmtpStatus({ className, showDetails }: SmtpStatusProps) {
  // Affichage du statut de connexion
  // Vérification automatique toutes les 30 secondes
}
```

## Intégration dans l'application

### 1. Assignation de techniciens

```typescript
// Dans AssignTechniciansDialog.tsx
const { sendMissionAssignment } = useEmailService()

// Après création des assignations
for (const assignment of newAssignments) {
  const technician = technicians.find(t => t.id === assignment.technician_id)
  if (technician && technician.email) {
    await sendMissionAssignment(technician, mission, assignment)
  }
}
```

### 2. Réponses aux missions

```typescript
// Dans ProposedMissionsTab.tsx
const { sendMissionAccepted, sendMissionRejected } = useEmailService()

// Après mise à jour du statut
if (status === 'accepté') {
  await sendMissionAccepted(profile, assignment.missions)
} else {
  await sendMissionRejected(profile, assignment.missions)
}
```

### 3. Création de paiements

```typescript
// Dans CreatePaymentDialog.tsx
const { sendPaymentCreated } = useEmailService()

// Après création des paiements
await sendPaymentCreated(selectedTechnician, totalAmount, selectedMissionsData)
```

## Gestion des erreurs

### 1. Connexion SMTP

- **Vérification automatique** : Toutes les 30 secondes
- **Logs détaillés** : Console pour le debugging
- **Fallback** : Application continue de fonctionner même si SMTP échoue

### 2. Envoi d'emails

- **Gestion d'erreur** : Try/catch pour chaque envoi
- **Logs** : Succès et erreurs dans la console
- **Non-bloquant** : Les erreurs d'email n'empêchent pas les actions

### 3. Validation

- **Adresse email** : Vérification du format
- **Connexion** : Vérification avant envoi
- **Contenu** : Validation des templates

## Sécurité

### 1. Variables d'environnement

- **Configuration** : Toutes les données sensibles dans `.env`
- **Exclusion** : Fichier `.env` dans `.gitignore`
- **Documentation** : Template dans `env.example`

### 2. Authentification SMTP

- **SSL/TLS** : Connexion sécurisée obligatoire
- **Credentials** : Stockage sécurisé des identifiants
- **Validation** : Vérification de la connexion

### 3. Contenu des emails

- **Pas de données sensibles** : Aucune information critique dans les emails
- **Templates sécurisés** : Validation du contenu
- **Statut de connexion** : Information non-sensible incluse

## Monitoring et debugging

### 1. Logs de console

```javascript
// Connexion SMTP
✅ Connexion SMTP établie
❌ Erreur de connexion SMTP: [détails]

// Envoi d'emails
✅ Email envoyé: [messageId]
❌ Erreur lors de l'envoi de l'email: [détails]
```

### 2. Test de configuration

- **Interface graphique** : Dialogue de test intégré
- **Vérification en temps réel** : Statut de connexion
- **Test d'envoi** : Email de test personnalisable

### 3. Diagnostic

- **Configuration** : Affichage des paramètres SMTP
- **Connexion** : Test de connectivité
- **Envoi** : Test d'envoi d'email

## Améliorations futures

### 1. Fonctionnalités avancées

- [ ] **Notifications push** : Intégration avec les notifications navigateur
- [ ] **Templates personnalisables** : Interface d'édition des templates
- [ ] **Historique des emails** : Log des emails envoyés
- [ ] **Retry automatique** : Nouvelle tentative en cas d'échec

### 2. Optimisations

- [ ] **Queue d'emails** : Gestion de file d'attente
- [ ] **Rate limiting** : Limitation du nombre d'emails
- [ ] **Cache SMTP** : Réutilisation des connexions
- [ ] **Monitoring avancé** : Métriques détaillées

### 3. Intégrations

- [ ] **Webhooks** : Notifications vers d'autres services
- [ ] **API externe** : Intégration avec des services d'email
- [ ] **SMS** : Notifications par SMS
- [ ] **Calendrier** : Intégration avec les calendriers

## Support technique

### Problèmes courants

1. **Connexion SMTP échoue** :
   - Vérifier les credentials dans `.env`
   - Vérifier la connectivité réseau
   - Vérifier les paramètres du serveur SMTP

2. **Emails non reçus** :
   - Vérifier les dossiers spam
   - Tester avec une adresse email différente
   - Vérifier les logs de console

3. **Erreurs d'envoi** :
   - Vérifier la configuration SMTP
   - Tester la connexion
   - Vérifier les permissions

### Commandes utiles

```bash
# Vérifier les variables d'environnement
echo $VITE_SMTP_HOST
echo $VITE_SMTP_PORT

# Tester la connectivité SMTP
telnet mail.dresscodeia.fr 465

# Vérifier les logs
npm run dev
```

---

*Dernière mise à jour : Décembre 2024* 
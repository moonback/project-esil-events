# Service Email - Notifications Automatiques

## Vue d'ensemble

Le service email permet d'envoyer automatiquement des notifications aux techniciens lors de différents événements dans l'application ESIL.

## Fonctionnalités

### Types de notifications supportés

1. **Mission assignée** (`mission_assigned`)
   - Envoyée quand un admin assigne une mission à un technicien
   - Contient les détails de la mission (titre, type, date, lieu, forfait)

2. **Mission acceptée** (`mission_accepted`)
   - Envoyée quand un technicien accepte une mission
   - Confirmation de l'acceptation avec les détails

3. **Mission refusée** (`mission_rejected`)
   - Envoyée quand un technicien refuse une mission
   - Notification à l'admin

4. **Paiement reçu** (`payment_received`)
   - Envoyée quand un paiement est validé
   - Confirmation du montant reçu

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env` dans `supabase/functions/email-service/` avec les variables suivantes :

```env
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM=noreply@esil.com

# URL du frontend
FRONTEND_URL=http://localhost:5173
```

### 2. Configuration Gmail (exemple)

Pour utiliser Gmail comme serveur SMTP :

1. Activez l'authentification à 2 facteurs sur votre compte Gmail
2. Générez un mot de passe d'application :
   - Allez dans les paramètres de votre compte Google
   - Sécurité > Connexion à Google > Mots de passe d'application
   - Créez un nouveau mot de passe pour "Mail"
3. Utilisez ce mot de passe dans `SMTP_PASSWORD`

### 3. Déploiement

```bash
# Déployer la fonction Edge
npx supabase functions deploy email-service

# Définir les variables d'environnement
npx supabase secrets set SMTP_HOST=smtp.gmail.com
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USERNAME=votre-email@gmail.com
npx supabase secrets set SMTP_PASSWORD=votre-mot-de-passe-app
npx supabase secrets set SMTP_FROM=noreply@esil.com
npx supabase secrets set FRONTEND_URL=https://votre-domaine.com
```

## Utilisation dans le code

### Service client

```typescript
import { EmailService } from '@/lib/emailService'

// Envoyer une notification de mission assignée
await EmailService.sendMissionAssignmentNotification(
  technicianId, 
  missionId
)

// Envoyer une notification de mission acceptée
await EmailService.sendMissionAcceptedNotification(
  technicianId, 
  missionId
)

// Envoyer une notification de mission refusée
await EmailService.sendMissionRejectedNotification(
  technicianId, 
  missionId
)

// Envoyer une notification de paiement
await EmailService.sendPaymentReceivedNotification(
  technicianId, 
  missionId, 
  amount
)
```

### Hook React

```typescript
import { useEmailService } from '@/lib/emailService'

function MonComposant() {
  const { sendMissionAssignmentNotification } = useEmailService()
  
  const handleAssignMission = async () => {
    try {
      await sendMissionAssignmentNotification(technicianId, missionId)
      console.log('Notification envoyée avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error)
    }
  }
}
```

## Templates d'emails

### Mission assignée

- **Sujet** : "Nouvelle mission : [Titre de la mission]"
- **Contenu** : Détails de la mission avec bouton pour accéder à l'interface
- **Style** : Design moderne avec couleurs ESIL

### Mission acceptée

- **Sujet** : "Mission acceptée : [Titre de la mission]"
- **Contenu** : Confirmation avec rappel des détails
- **Style** : Design vert pour indiquer l'acceptation

## Intégration dans l'application

### Assignation de techniciens

Le service est automatiquement appelé dans `AssignTechniciansDialog.tsx` quand :
- Un admin assigne des techniciens à une mission
- Les notifications sont envoyées en parallèle à tous les techniciens assignés

### Réponse aux missions

Le service est appelé dans `ProposedMissionsTab.tsx` quand :
- Un technicien accepte une mission
- Un technicien refuse une mission

## Gestion des erreurs

- Les erreurs d'envoi d'email ne bloquent pas les opérations principales
- Les erreurs sont loggées dans la console pour le débogage
- Le service continue de fonctionner même si les emails échouent

## Tests

### Test local

```bash
# Démarrer Supabase localement
npx supabase start

# Tester la fonction
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/email-service' \
  --header 'Authorization: Bearer [votre-token]' \
  --header 'Content-Type: application/json' \
  --data '{
    "type": "mission_assigned",
    "data": {
      "technicianId": "technician-id",
      "missionId": "mission-id"
    }
  }'
```

### Test en production

```bash
# Déployer et tester
npx supabase functions deploy email-service
npx supabase functions invoke email-service --body '{
  "type": "mission_assigned",
  "data": {
    "technicianId": "technician-id",
    "missionId": "mission-id"
  }
}'
```

## Sécurité

- Les variables d'environnement sensibles sont stockées dans Supabase Secrets
- Les emails sont envoyés depuis une adresse dédiée (noreply@esil.com)
- Les liens dans les emails pointent vers l'application sécurisée
- Validation des données d'entrée dans la fonction Edge

## Maintenance

### Logs

Les logs sont disponibles dans :
- Console Supabase pour les fonctions Edge
- Console du navigateur pour les appels côté client

### Monitoring

- Surveiller les taux de livraison des emails
- Vérifier les erreurs SMTP
- Tester régulièrement les templates d'emails

## Support

En cas de problème :
1. Vérifier les logs dans la console Supabase
2. Tester la configuration SMTP
3. Vérifier les variables d'environnement
4. Contacter l'équipe de développement 
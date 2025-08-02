# 🚀 Déploiement Rapide - Service Email

## Prérequis

1. **Compte Supabase** configuré
2. **CLI Supabase** installé : `npm install -g supabase`
3. **Compte email** avec SMTP configuré (Gmail recommandé)

## Configuration SMTP (Gmail)

### 1. Activer l'authentification à 2 facteurs
- Allez sur https://myaccount.google.com/security
- Activez "Validation en 2 étapes"

### 2. Générer un mot de passe d'application
- Allez sur https://myaccount.google.com/apppasswords
- Sélectionnez "Mail" et votre appareil
- Copiez le mot de passe généré

## Déploiement

### 1. Connexion à Supabase
```bash
npx supabase login
```

### 2. Lier le projet
```bash
npx supabase link --project-ref VOTRE_PROJECT_REF
```

### 3. Déployer la fonction
```bash
npx supabase functions deploy email-service
```

### 4. Configurer les variables d'environnement
```bash
# Configuration SMTP
npx supabase secrets set SMTP_HOST=smtp.gmail.com
npx supabase secrets set SMTP_PORT=587
npx supabase secrets set SMTP_USERNAME=votre-email@gmail.com
npx supabase secrets set SMTP_PASSWORD=votre-mot-de-passe-app
npx supabase secrets set SMTP_FROM=noreply@esil.com

# URL du frontend
npx supabase secrets set FRONTEND_URL=https://votre-domaine.com
```

### 5. Tester le service
```bash
# Test local
npm run test:email

# Test avec données réelles
npm run test:email:real
```

## Utilisation

### Dans le code
```typescript
import { EmailService } from '@/lib/emailService'

// Envoyer une notification
await EmailService.sendMissionAssignmentNotification(
  technicianId, 
  missionId
)
```

### Types de notifications
- `mission_assigned` : Mission assignée à un technicien
- `mission_accepted` : Mission acceptée par un technicien
- `mission_rejected` : Mission refusée par un technicien
- `payment_received` : Paiement reçu

## Monitoring

### Logs
```bash
# Voir les logs en temps réel
npx supabase functions logs email-service --follow
```

### Statuts
- Les notifications d'email apparaissent dans l'interface
- Statut détaillé : envoyés/échoués/total
- Taux de succès affiché

## Dépannage

### Erreur SMTP
- Vérifiez les identifiants Gmail
- Assurez-vous que l'authentification à 2 facteurs est activée
- Utilisez un mot de passe d'application, pas votre mot de passe principal

### Erreur de déploiement
```bash
# Redéployer
npx supabase functions deploy email-service --no-verify-jwt

# Vérifier les logs
npx supabase functions logs email-service
```

### Test local
```bash
# Démarrer Supabase localement
npx supabase start

# Tester
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/email-service' \
  --header 'Authorization: Bearer [votre-token]' \
  --header 'Content-Type: application/json' \
  --data '{
    "type": "mission_assigned",
    "data": {
      "technicianId": "test-id",
      "missionId": "test-id"
    }
  }'
```

## Sécurité

- ✅ Variables d'environnement sécurisées
- ✅ Validation des données d'entrée
- ✅ Gestion d'erreurs robuste
- ✅ Logs détaillés pour le débogage

## Support

En cas de problème :
1. Vérifiez les logs : `npx supabase functions logs email-service`
2. Testez localement : `npm run test:email`
3. Vérifiez la configuration SMTP
4. Consultez la documentation complète : `docs/SERVICE_EMAIL.md` 
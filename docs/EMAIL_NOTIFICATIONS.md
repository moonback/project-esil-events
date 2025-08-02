# 📧 Notifications Email Automatiques

## Vue d'ensemble

Cette fonctionnalité permet d'envoyer automatiquement des emails de notification aux techniciens lorsqu'ils sont assignés à une mission. Les emails sont envoyés via un serveur SMTP configuré dans les variables d'environnement.

## Fonctionnalités

### 1. Envoi Automatique d'Emails
- **Déclenchement automatique** lors de l'assignation d'un technicien à une mission
- **Template HTML moderne** avec design responsive
- **Version texte** pour les clients email qui ne supportent pas HTML
- **Gestion des erreurs** avec notifications utilisateur

### 2. Contenu des Emails
Chaque email contient :
- **Titre de la mission** avec icône
- **Type de mission** avec badge coloré
- **Lieu de la mission** avec icône de localisation
- **Dates de début et fin** formatées en français
- **Forfait** en euros
- **Description** (si disponible)
- **Bouton d'action** pour accéder à l'espace technicien

### 3. Gestion des Erreurs
- **Notifications toast** pour informer l'utilisateur
- **Comptage des emails envoyés/échoués**
- **Messages d'erreur détaillés** par technicien
- **Continuation du processus** même si certains emails échouent

## Configuration

### Variables d'Environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_application
SMTP_FROM=Esil-events <votre_email@gmail.com>

# URL de l'application (pour les liens dans les emails)
VITE_APP_URL=https://votre-app.com
```

### Configuration Gmail

Pour utiliser Gmail comme serveur SMTP :

1. **Activer l'authentification à 2 facteurs** sur votre compte Gmail
2. **Générer un mot de passe d'application** :
   - Aller dans les paramètres Google
   - Sécurité → Connexion à Google → Mots de passe d'application
   - Créer un nouveau mot de passe pour "Mail"
3. **Utiliser ce mot de passe** dans `SMTP_PASS`

### Configuration Supabase

1. **Déployer la fonction Edge** :
   ```bash
   supabase functions deploy send-email
   ```

2. **Configurer les variables d'environnement** dans Supabase :
   ```bash
   supabase secrets set SMTP_HOST=smtp.gmail.com
   supabase secrets set SMTP_PORT=587
   supabase secrets set SMTP_USER=votre_email@gmail.com
   supabase secrets set SMTP_PASS=votre_mot_de_passe_application
   supabase secrets set SMTP_FROM=Esil-events <votre_email@gmail.com>
   ```

## Implémentation Technique

### 1. Fonction Supabase Edge (`send-email`)

```typescript
// supabase/functions/send-email/index.ts
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

serve(async (req) => {
  const { type, data } = await req.json()
  
  if (type === 'mission_assignment') {
    // Envoi de l'email de notification
    const client = new SmtpClient()
    await client.connectTLS({
      hostname: Deno.env.get('SMTP_HOST'),
      port: parseInt(Deno.env.get('SMTP_PORT')),
      username: Deno.env.get('SMTP_USER'),
      password: Deno.env.get('SMTP_PASS'),
    })
    
    await client.send({
      from: Deno.env.get('SMTP_FROM'),
      to: data.technicianEmail,
      subject: `🎯 Nouvelle mission : ${data.missionTitle}`,
      html: generateEmailTemplate(data)
    })
  }
})
```

### 2. Service Email Frontend

```typescript
// src/lib/emailService.ts
export class EmailService {
  static async sendMissionAssignmentEmail(data: MissionAssignmentEmailData) {
    const { data: response, error } = await supabase.functions.invoke('send-email', {
      body: { type: 'mission_assignment', data }
    })
    
    return { success: !error, error: error?.message }
  }
  
  static async sendBulkMissionAssignmentEmails(technicians, mission) {
    // Envoi en lot avec gestion des erreurs
  }
}
```

### 3. Intégration dans les Composants

```typescript
// Dans AssignTechniciansDialog.tsx et MissionDialog.tsx
const handleAssign = async () => {
  // Créer les assignations
  await supabase.from('mission_assignments').insert(assignments)
  
  // Envoyer les emails
  const emailResult = await EmailService.sendBulkMissionAssignmentEmails(
    assignedTechnicians,
    mission
  )
  
  // Afficher les résultats
  if (emailResult.sent > 0) {
    useToast().showSuccess('Assignation réussie', `${emailResult.sent} technicien(s) notifié(s)`)
  }
}
```

## Template Email

### Design HTML
- **Header** avec gradient et titre
- **Carte de mission** avec toutes les informations
- **Bouton d'action** pour accéder à l'espace technicien
- **Footer** avec informations de contact

### Version Texte
- **Format simple** pour compatibilité maximale
- **Informations essentielles** de la mission
- **Instructions claires** pour l'action

## Gestion des Erreurs

### Types d'Erreurs
1. **Erreur de connexion SMTP** : Serveur inaccessible
2. **Erreur d'authentification** : Identifiants incorrects
3. **Erreur d'envoi** : Email rejeté par le serveur
4. **Erreur de template** : Problème de génération d'email

### Stratégies de Gestion
- **Retry automatique** pour les erreurs temporaires
- **Logging détaillé** pour le debugging
- **Notifications utilisateur** pour les erreurs critiques
- **Continuation du processus** même en cas d'échec

## Tests

### Test Manuel
1. **Créer une mission** avec des techniciens assignés
2. **Vérifier la réception** des emails
3. **Tester les liens** dans les emails
4. **Vérifier le formatage** sur différents clients email

### Test Automatique
```typescript
// Test de la fonction Edge
const response = await fetch('/functions/v1/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'mission_assignment',
    data: testEmailData
  })
})
```

## Sécurité

### Bonnes Pratiques
- **Variables d'environnement** pour les secrets
- **Validation des données** avant envoi
- **Rate limiting** pour éviter le spam
- **Logs sécurisés** sans informations sensibles

### Configuration Sécurisée
- **TLS obligatoire** pour les connexions SMTP
- **Authentification forte** avec mots de passe d'application
- **Validation des adresses email** avant envoi

## Maintenance

### Monitoring
- **Logs d'envoi** dans Supabase
- **Métriques de succès/échec**
- **Alertes** en cas de problème

### Mise à Jour
- **Templates d'email** modifiables
- **Configuration SMTP** flexible
- **Nouveaux types d'emails** facilement ajoutables

---

*Dernière mise à jour : Décembre 2024* 
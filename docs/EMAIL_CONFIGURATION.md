# 📧 Configuration des Emails - Esil-events

## 🎯 Vue d'ensemble

Ce document explique comment configurer l'envoi automatique d'emails de notification aux techniciens lors de leur assignation à une mission.

## ✨ Fonctionnalités

- **Envoi automatique** d'emails lors de l'assignation d'un technicien
- **Emails en lot** pour plusieurs techniciens assignés simultanément
- **Template HTML moderne** avec design responsive
- **Notifications toast** pour informer l'administrateur du statut d'envoi
- **Test de configuration** intégré dans l'interface administrateur

## 🔧 Configuration SMTP

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Configuration SMTP
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=votre_email@gmail.com
VITE_SMTP_PASS=votre_mot_de_passe_app
VITE_SMTP_FROM=noreply@esil-events.com
VITE_APP_URL=https://votre-app.vercel.app
```

### 2. Configuration Gmail

Pour utiliser Gmail comme serveur SMTP :

1. **Activez l'authentification à 2 facteurs** sur votre compte Gmail
2. **Générez un mot de passe d'application** :
   - Allez dans les paramètres de votre compte Google
   - Sécurité → Authentification à 2 facteurs
   - Mots de passe d'application → Générer
3. **Utilisez ce mot de passe** dans `VITE_SMTP_PASS`

### 3. Configuration Vercel

Pour déployer sur Vercel, configurez les variables d'environnement :

```bash
vercel env add VITE_SMTP_HOST
vercel env add VITE_SMTP_PORT
vercel env add VITE_SMTP_USER
vercel env add VITE_SMTP_PASS
vercel env add VITE_SMTP_FROM
vercel env add VITE_APP_URL
```

## 📧 Structure des Emails

### Template d'assignation

Les emails contiennent :
- **En-tête** avec logo et salutation personnalisée
- **Carte de mission** avec titre et type
- **Détails complets** : lieu, dates, forfait, description
- **Bouton d'action** pour accéder à l'espace technicien
- **Pied de page** avec informations de contact

### Exemple d'email

```
🎉 Esil-events
Bonjour [Nom du technicien] !

Vous avez été assigné(e) à une nouvelle mission !

[Card de mission]
Mission : Installation sonorisation mariage
Type : Presta sono

[Détails]
📍 Lieu : Château de Versailles
📅 Début : Samedi 15 juin 2024 à 14:00
⏰ Fin : Samedi 15 juin 2024 à 22:00
💰 Forfait : 500 €
📝 Description : Installation complète sonorisation...

Action requise : Veuillez vous connecter à votre espace technicien pour accepter ou refuser cette mission.

🔗 Accéder à mon espace

---
Cet email a été envoyé automatiquement par le système Esil-events.
Pour toute question, contactez L'équipe Esil-events.
© 2024 Esil-events - Tous droits réservés
```

## 🚀 Utilisation

### 1. Assignation de techniciens

1. **Ouvrez le dialogue d'assignation** depuis la liste des missions
2. **Sélectionnez les techniciens** à assigner
3. **Cliquez sur "Assigner"** - les emails seront envoyés automatiquement
4. **Notifications** s'affichent pour confirmer l'envoi

### 2. Test de configuration

1. **Allez dans l'onglet "Test"** du dashboard administrateur
2. **Cliquez sur "Tester l'envoi d'emails"**
3. **Saisissez une adresse email de test**
4. **Vérifiez la réception** de l'email de test

## 🔍 Dépannage

### Erreurs courantes

#### "Erreur de configuration SMTP"
- Vérifiez les variables d'environnement
- Testez la connexion SMTP
- Vérifiez les paramètres de sécurité Gmail

#### "Email non envoyé"
- Vérifiez que le technicien a une adresse email
- Contrôlez les logs de l'API
- Testez avec une adresse email valide

#### "Erreur de connexion"
- Vérifiez l'URL de l'API dans `emailClient.ts`
- Contrôlez la configuration Vercel
- Vérifiez les variables d'environnement en production

### Logs de débogage

Les logs d'erreur sont disponibles dans :
- **Console navigateur** pour les erreurs côté client
- **Logs Vercel** pour les erreurs côté serveur
- **Notifications toast** pour les erreurs utilisateur

## 📁 Structure des fichiers

```
src/
├── lib/
│   ├── emailService.ts      # Service d'email côté client
│   └── emailClient.ts       # Client pour l'API email
├── components/
│   └── admin/
│       ├── AssignTechniciansDialog.tsx  # Intégration emails
│       └── TestEmailDialog.tsx          # Test de configuration
└── api/
    └── send-email.ts        # API route Vercel
```

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne stockez jamais** les mots de passe en clair
2. **Utilisez des variables d'environnement** pour les secrets
3. **Limitez l'accès** aux emails de test
4. **Validez les adresses email** avant envoi
5. **Loggez les erreurs** pour le débogage

### Configuration sécurisée

```env
# Production
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=notifications@votre-domaine.com
VITE_SMTP_PASS=[mot_de_passe_app_généré]
VITE_SMTP_FROM=noreply@votre-domaine.com
VITE_APP_URL=https://votre-app.vercel.app
```

## 🎨 Personnalisation

### Modifier le template

Le template HTML est dans `emailService.ts` :

```typescript
private generateAssignmentEmailContent(data: {
  technicianName: string
  missionTitle: string
  // ... autres propriétés
}): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <!-- Template HTML personnalisé -->
  `
}
```

### Ajouter de nouveaux types d'emails

1. **Créez une nouvelle méthode** dans `EmailService`
2. **Ajoutez le template** correspondant
3. **Intégrez l'appel** dans le composant approprié

## 📊 Monitoring

### Métriques à surveiller

- **Taux de succès** des envois d'emails
- **Temps de réponse** de l'API
- **Erreurs SMTP** fréquentes
- **Utilisation** de la fonctionnalité

### Alertes recommandées

- **Échec d'envoi** > 5% sur 1h
- **Temps de réponse** > 10s
- **Erreurs SMTP** répétées
- **Quota d'emails** atteint

---

**Esil-events** - Système d'emails automatiques pour une communication efficace avec les techniciens 🚀 
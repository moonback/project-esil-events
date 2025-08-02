# 📧 Système d'Envoi d'Emails Automatiques

## Vue d'ensemble

Le système d'envoi d'emails automatiques permet d'envoyer des notifications par email pour toutes les actions importantes de l'application Esil-events. Il utilise votre propre serveur SMTP pour garantir la sécurité et la fiabilité des envois.

## 🚀 Fonctionnalités

### Types d'emails automatiques

1. **Assignation de missions** : Notification aux techniciens quand une mission leur est assignée
2. **Acceptation/Refus de missions** : Confirmation aux techniciens de leurs décisions
3. **Création de paiements** : Notification de création d'un nouveau paiement
4. **Validation de paiements** : Confirmation de validation d'un paiement
5. **Paiement effectué** : Notification de paiement finalisé
6. **Mise à jour des disponibilités** : Confirmation de modification des disponibilités
7. **Création d'indisponibilités** : Confirmation d'enregistrement d'indisponibilité

### Templates d'emails

Chaque type d'email dispose d'un template HTML personnalisé avec :
- Design professionnel et responsive
- Informations détaillées sur l'action
- Couleurs et icônes appropriées
- Version texte pour compatibilité

## ⚙️ Configuration SMTP

### Accès à la configuration

1. Connectez-vous en tant qu'administrateur
2. Dans le dashboard, cliquez sur le bouton **"SMTP"** dans la barre d'actions
3. Remplissez les informations de votre serveur SMTP

### Paramètres requis

- **Serveur SMTP** : Adresse de votre serveur (ex: smtp.gmail.com)
- **Port** : Port de connexion (ex: 587 pour TLS, 465 pour SSL)
- **Connexion sécurisée** : Cochez pour TLS/SSL
- **Nom d'utilisateur** : Votre adresse email
- **Mot de passe** : Votre mot de passe ou mot de passe d'application

### Configurations recommandées

#### Gmail
```
Serveur : smtp.gmail.com
Port : 587
Sécurisé : Oui (TLS)
Utilisateur : votre@gmail.com
Mot de passe : Mot de passe d'application (pas le mot de passe principal)
```

#### Outlook/Hotmail
```
Serveur : smtp-mail.outlook.com
Port : 587
Sécurisé : Oui (TLS)
Utilisateur : votre@outlook.com
Mot de passe : Votre mot de passe
```

#### Yahoo
```
Serveur : smtp.mail.yahoo.com
Port : 587
Sécurisé : Oui (TLS)
Utilisateur : votre@yahoo.com
Mot de passe : Votre mot de passe
```

#### OVH
```
Serveur : ssl0.ovh.net
Port : 465
Sécurisé : Oui (SSL)
Utilisateur : votre@votredomaine.com
Mot de passe : Votre mot de passe
```

## 🔧 Architecture technique

### Composants principaux

1. **`EmailService`** (`src/lib/emailService.ts`)
   - Service singleton pour l'envoi d'emails
   - Gestion des templates HTML
   - Configuration SMTP
   - Fallback en cas d'erreur

2. **`useEmailNotifications`** (`src/lib/useEmailNotifications.ts`)
   - Hook React pour les notifications
   - Gestion des erreurs
   - Intégration avec le système de toast

3. **`SMTPConfigDialog`** (`src/components/admin/SMTPConfigDialog.tsx`)
   - Interface de configuration SMTP
   - Test de connexion
   - Validation des paramètres

### Intégration dans l'application

#### Assignation de techniciens
```typescript
// Dans AssignTechniciansDialog.tsx
const { sendMissionAssignedEmail } = useEmailNotifications()

// Après création des assignations
for (const technicianId of selectedTechnicians) {
  const technician = technicians.find(t => t.id === technicianId)
  if (technician && technician.email) {
    await sendMissionAssignedEmail(mission, technician)
  }
}
```

#### Réponse aux missions
```typescript
// Dans ProposedMissionsTab.tsx
const { sendMissionAcceptedEmail, sendMissionRejectedEmail } = useEmailNotifications()

// Après mise à jour du statut
if (status === 'accepté') {
  await sendMissionAcceptedEmail(assignment.missions, profile)
} else {
  await sendMissionRejectedEmail(assignment.missions, profile)
}
```

#### Création de paiements
```typescript
// Dans CreatePaymentDialog.tsx
const { sendPaymentCreatedEmail } = useEmailNotifications()

// Après création du paiement
await sendPaymentCreatedEmail(billingWithMission, selectedTechnician)
```

## 📧 Templates d'emails

### Structure des templates

Chaque template contient :
- **Sujet** : Descriptif de l'action
- **HTML** : Version formatée avec styles
- **Texte** : Version texte simple

### Exemple de template

```typescript
mission_assigned: (mission: Mission, technician: User) => ({
  subject: `Nouvelle mission assignée : ${mission.title}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #667eea;">Nouvelle mission assignée</h2>
      <p>Bonjour ${technician.name},</p>
      <p>Une nouvelle mission vous a été assignée :</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${mission.title}</h3>
        <p><strong>Type :</strong> ${mission.type}</p>
        <p><strong>Lieu :</strong> ${mission.location}</p>
        <p><strong>Date de début :</strong> ${new Date(mission.date_start).toLocaleString('fr-FR')}</p>
        <p><strong>Date de fin :</strong> ${new Date(mission.date_end).toLocaleString('fr-FR')}</p>
        <p><strong>Forfait :</strong> ${mission.forfeit}€</p>
      </div>
      
      <p>Veuillez vous connecter à votre tableau de bord pour accepter ou refuser cette mission.</p>
      
      <p>Cordialement,<br>L'équipe Esil-events</p>
    </div>
  `,
  text: `
    Nouvelle mission assignée : ${mission.title}
    
    Type : ${mission.type}
    Lieu : ${mission.location}
    Date de début : ${new Date(mission.date_start).toLocaleString('fr-FR')}
    Date de fin : ${new Date(mission.date_end).toLocaleString('fr-FR')}
    Forfait : ${mission.forfeit}€
    
    Veuillez vous connecter à votre tableau de bord pour accepter ou refuser cette mission.
  `
})
```

## 🔒 Sécurité

### Protection des données

- **Chiffrement** : Utilisation de TLS/SSL pour les connexions SMTP
- **Authentification** : Vérification des identifiants SMTP
- **Validation** : Vérification des adresses email avant envoi
- **Logs** : Enregistrement des tentatives d'envoi (sans données sensibles)

### Bonnes pratiques

1. **Utilisez des mots de passe d'application** pour Gmail
2. **Activez l'authentification à deux facteurs** sur votre compte email
3. **Vérifiez régulièrement** les logs d'envoi
4. **Testez la configuration** avant utilisation en production

## 🚨 Dépannage

### Problèmes courants

#### Erreur d'authentification
```
Erreur : 535 Authentication failed
Solution : Vérifiez vos identifiants et activez l'authentification à deux facteurs
```

#### Erreur de connexion
```
Erreur : Connection timeout
Solution : Vérifiez le serveur SMTP et le port
```

#### Emails non reçus
```
Problème : Emails envoyés mais non reçus
Solution : Vérifiez les dossiers spam et les filtres
```

### Test de configuration

1. Cliquez sur **"Tester la connexion"** dans le dialogue SMTP
2. Vérifiez les logs dans la console du navigateur
3. Envoyez un email de test à votre propre adresse

### Logs et monitoring

Les logs d'envoi sont disponibles dans :
- **Console du navigateur** : Erreurs détaillées
- **Notifications toast** : Statut des envois
- **Base de données** : Historique des actions (optionnel)

## 📈 Performance

### Optimisations

- **Envoi asynchrone** : Les emails sont envoyés en arrière-plan
- **Gestion d'erreur** : Retry automatique en cas d'échec
- **Fallback** : Utilisation de Supabase Edge Functions si disponible
- **Cache** : Configuration SMTP mise en cache

### Métriques

- **Taux de livraison** : Suivi des emails envoyés/reçus
- **Temps de réponse** : Latence d'envoi
- **Erreurs** : Types et fréquences d'erreurs

## 🔄 Maintenance

### Tâches régulières

1. **Vérification des logs** : Contrôler les erreurs d'envoi
2. **Test de configuration** : Valider la connexion SMTP
3. **Mise à jour des templates** : Adapter le contenu si nécessaire
4. **Sauvegarde de configuration** : Exporter les paramètres SMTP

### Mise à jour

Pour ajouter un nouveau type d'email :

1. Ajouter le type dans `EmailType`
2. Créer le template dans `emailTemplates`
3. Ajouter la méthode dans `EmailService`
4. Intégrer dans le composant concerné

## 📞 Support

Pour toute question ou problème :

1. **Vérifiez la configuration SMTP**
2. **Consultez les logs d'erreur**
3. **Testez avec un autre serveur SMTP**
4. **Contactez le support technique**

---

*Dernière mise à jour : Décembre 2024* 
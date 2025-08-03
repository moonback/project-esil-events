# 🗓️ Intégration Google Calendar pour les Missions

## Vue d'ensemble

Cette fonctionnalité permet d'intégrer Google Calendar à votre application Esil-events pour envoyer automatiquement les missions aux techniciens via des événements Google Calendar avec invitations par email.

## 🚀 Fonctionnalités

### 1. **Création Automatique d'Événements**
- Création automatique d'événements Google Calendar lors de la création de missions
- Envoi d'invitations par email aux techniciens assignés
- Rappels automatiques (24h et 1h avant l'événement)

### 2. **Synchronisation des Données**
- Mise à jour automatique des événements lors de la modification de missions
- Suppression automatique des événements lors de la suppression de missions
- Gestion des conflits de planning

### 3. **Interface Utilisateur**
- Configuration Google Calendar dans le dashboard administrateur
- Option d'envoi d'invitations lors de la création de missions
- Statut de connexion visible en temps réel

## 🔧 Configuration

### 1. **Créer un Projet Google Cloud Console**

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google Calendar :
   - Allez dans "APIs & Services" > "Library"
   - Recherchez "Google Calendar API"
   - Cliquez sur "Enable"

### 2. **Créer des Identifiants OAuth 2.0**

1. Allez dans "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configurez l'écran de consentement OAuth :
   - Nom de l'application : "Esil-events"
   - Email de support : votre email
   - Domaines autorisés : votre domaine
4. Créez un client OAuth 2.0 :
   - Type : "Web application"
   - Nom : "Esil-events Web Client"
   - URIs de redirection autorisés :
     - `http://localhost:5173/auth/google/callback` (développement)
     - `https://votre-domaine.com/auth/google/callback` (production)

### 3. **Configurer les Variables d'Environnement**

Ajoutez ces variables à votre fichier `.env` :

```env
# Configuration Google Calendar API
VITE_GOOGLE_CLIENT_ID=votre_client_id_google
VITE_GOOGLE_CLIENT_SECRET=votre_client_secret_google
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
```

## 📋 Utilisation

### 1. **Connexion à Google Calendar**

1. Allez dans le dashboard administrateur
2. Accédez à la section "Configuration Google Calendar"
3. Cliquez sur "Se connecter à Google Calendar"
4. Autorisez l'application à accéder à votre Google Calendar
5. Vous serez redirigé vers le dashboard avec la connexion établie

### 2. **Création de Missions avec Invitations**

1. Créez une nouvelle mission comme d'habitude
2. Assignez des techniciens à la mission
3. Cochez l'option "Créer un événement Google Calendar et envoyer les invitations"
4. Soumettez le formulaire
5. Les techniciens recevront automatiquement une invitation par email

### 3. **Gestion des Événements**

- **Création** : Les événements sont créés automatiquement lors de la création de missions
- **Modification** : Les événements sont mis à jour lors de la modification de missions
- **Suppression** : Les événements sont supprimés lors de la suppression de missions

## 🔧 Implémentation Technique

### 1. **Service Google Calendar** (`src/lib/googleCalendar.ts`)

```typescript
class GoogleCalendarService {
  // Initialisation de l'authentification
  async initialize(): Promise<boolean>
  
  // Création d'événements
  async createMissionEvent(mission: Mission, technicians: User[]): Promise<string | null>
  
  // Mise à jour d'événements
  async updateMissionEvent(eventId: string, mission: Mission, technicians: User[]): Promise<boolean>
  
  // Suppression d'événements
  async deleteMissionEvent(eventId: string): Promise<boolean>
}
```

### 2. **Hook React** (`src/lib/useGoogleCalendar.ts`)

```typescript
export function useGoogleCalendar(): UseGoogleCalendarReturn {
  // Gestion de l'état de connexion
  // Gestion des erreurs
  // Actions pour créer/modifier/supprimer des événements
}
```

### 3. **Composants UI**

- `GoogleCalendarSettings.tsx` : Configuration de la connexion
- `GoogleCalendarCallback.tsx` : Gestion du callback d'authentification
- Intégration dans `MissionDialog.tsx` : Option d'envoi d'invitations

## 📧 Format des Invitations

### Événement Google Calendar

```typescript
{
  summary: "Mission: [Titre de la mission]",
  description: `
Type: [Type de mission]
Localisation: [Adresse]
Forfait: [Montant]€
Personnes requises: [Nombre]
Description: [Description optionnelle]

Mission créée via Esil-events
  `,
  start: { dateTime: "2024-01-15T09:00:00", timeZone: "Europe/Paris" },
  end: { dateTime: "2024-01-15T17:00:00", timeZone: "Europe/Paris" },
  attendees: [
    { email: "technicien@example.com", displayName: "Nom du technicien" }
  ],
  reminders: {
    useDefault: false,
    overrides: [
      { method: "email", minutes: 1440 }, // 24h avant
      { method: "popup", minutes: 60 }    // 1h avant
    ]
  }
}
```

## 🔒 Sécurité

### 1. **Authentification OAuth 2.0**
- Utilisation du flux d'autorisation OAuth 2.0
- Stockage sécurisé des tokens dans le localStorage
- Gestion automatique de l'expiration des tokens

### 2. **Permissions**
- Accès en lecture/écriture aux calendriers
- Envoi d'invitations par email
- Gestion des événements

### 3. **Données Personnelles**
- Les emails des techniciens sont utilisés uniquement pour les invitations
- Aucune donnée personnelle n'est stockée en dehors de Google Calendar

## 🚨 Dépannage

### Problèmes Courants

1. **Erreur "Invalid Client"**
   - Vérifiez que le Client ID et Client Secret sont corrects
   - Assurez-vous que l'API Google Calendar est activée

2. **Erreur "Redirect URI Mismatch"**
   - Vérifiez que l'URI de redirection est correctement configuré
   - Assurez-vous que le domaine correspond à votre configuration

3. **Invitations non reçues**
   - Vérifiez que les techniciens ont des adresses email valides
   - Vérifiez les spams/indésirables
   - Assurez-vous que l'option d'envoi est cochée

4. **Événements non créés**
   - Vérifiez la connexion Google Calendar
   - Vérifiez les permissions du calendrier
   - Consultez les logs de la console

### Logs de Debug

```javascript
// Activer les logs de debug
localStorage.setItem('google_calendar_debug', 'true')

// Vérifier le statut de connexion
console.log('Google Calendar Status:', googleCalendarService.isAuthenticated())
```

## 📈 Métriques

### Statistiques d'Utilisation
- Nombre d'événements créés
- Nombre d'invitations envoyées
- Taux de réponse des techniciens
- Temps de création d'événements

### Monitoring
- Surveillance des erreurs d'API
- Monitoring des performances
- Alertes en cas de problème

## 🔄 Prochaines Améliorations

### Fonctionnalités Futures
- [ ] Synchronisation bidirectionnelle (modifications dans Google Calendar)
- [ ] Templates d'événements personnalisables
- [ ] Intégration avec d'autres calendriers (Outlook, Apple Calendar)
- [ ] Rappels personnalisables par technicien
- [ ] Export de calendriers pour impression

### Optimisations Techniques
- [ ] Cache des événements pour améliorer les performances
- [ ] Gestion des quotas API Google
- [ ] Retry automatique en cas d'échec
- [ ] Webhooks pour les mises à jour en temps réel

---

*Dernière mise à jour : Décembre 2024* 
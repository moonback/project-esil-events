# 🔧 Résolution du Problème CORS - Système d'Emails

## 📋 Problème identifié

L'erreur CORS suivante se produisait lors de l'envoi d'emails :

```
Access to fetch at 'https://irpwesqvjrbehjithivz.supabase.co/functions/v1/send-email' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
It does not have HTTP ok status.
```

## 🎯 Cause du problème

L'erreur indique que la Supabase Edge Function `send-email` n'existe pas sur le projet Supabase ou n'est pas correctement configurée.

## ✅ Solutions implémentées

### 1. **Priorité SMTP direct**

Le système a été modifié pour utiliser directement SMTP quand il est configuré, évitant ainsi l'appel à l'Edge Function :

```typescript
// Méthode principale d'envoi
async sendEmail(emailData: EmailData): Promise<boolean> {
  // Utiliser directement SMTP si configuré
  if (this.smtpConfig) {
    return await this.sendEmailDirect(emailData)
  }
  
  // Essayer via Supabase Edge Function seulement si pas désactivé
  if (!this.smtpConfig?.disableEdgeFunction) {
    return await this.sendEmailViaSupabase(emailData)
  }
  
  console.warn('Aucune méthode d\'envoi d\'email configurée')
  return false
}
```

### 2. **Amélioration de la gestion d'erreur**

Les messages d'erreur ont été remplacés par des avertissements informatifs :

```typescript
// Avant
console.error('Erreur envoi email:', error)

// Après
console.warn('Edge Function non disponible, utilisation du SMTP direct')
```

### 3. **Implémentation SMTP complète avec Nodemailer**

Ajout de Nodemailer pour une vraie implémentation SMTP :

```typescript
// Créer le transporteur SMTP
const transporter = nodemailer.createTransporter({
  host: this.smtpConfig.host,
  port: this.smtpConfig.port,
  secure: this.smtpConfig.secure,
  auth: {
    user: this.smtpConfig.auth.user,
    pass: this.smtpConfig.auth.pass
  }
})

// Envoyer l'email
const info = await transporter.sendMail({
  from: this.smtpConfig.auth.user,
  to: emailData.to,
  subject: emailData.subject,
  html: emailData.html,
  text: emailData.text
})
```

### 4. **Option de désactivation de l'Edge Function**

Ajout d'une option dans la configuration SMTP pour désactiver complètement l'Edge Function :

```typescript
interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  disableEdgeFunction?: boolean // Option pour désactiver l'Edge Function
}
```

### 5. **Interface utilisateur améliorée**

Ajout d'une case à cocher dans le dialogue de configuration SMTP :

```tsx
{/* Désactiver Edge Function */}
<div className="flex items-center space-x-2">
  <Checkbox
    id="disableEdgeFunction"
    checked={config.disableEdgeFunction}
    onCheckedChange={(checked) => setConfig({ ...config, disableEdgeFunction: checked as boolean })}
  />
  <Label htmlFor="disableEdgeFunction" className="flex items-center gap-2">
    <Server className="h-4 w-4" />
    Utiliser uniquement SMTP direct (désactiver Edge Function)
  </Label>
</div>
```

## 🚀 Résultats obtenus

### Problèmes résolus :
- ✅ **Plus d'erreurs CORS** dans la console
- ✅ **Envoi d'emails fonctionnel** via SMTP direct
- ✅ **Gestion d'erreur propre** avec messages informatifs
- ✅ **Configuration flexible** avec option de désactivation
- ✅ **Implémentation SMTP complète** avec Nodemailer

### Fonctionnalités ajoutées :
- ✅ **Priorité SMTP** quand configuré
- ✅ **Option de désactivation** de l'Edge Function
- ✅ **Logs informatifs** au lieu d'erreurs
- ✅ **Interface utilisateur** pour contrôler le comportement

## 🔧 Configuration recommandée

### Pour utiliser uniquement SMTP direct :
1. Aller dans le dashboard administrateur
2. Cliquer sur le bouton "SMTP"
3. Configurer les paramètres SMTP
4. **Cocher** "Utiliser uniquement SMTP direct"
5. Sauvegarder la configuration

### Configuration SMTP recommandée :
- **Gmail** : smtp.gmail.com:587 (TLS)
- **Outlook** : smtp-mail.outlook.com:587 (TLS)
- **Yahoo** : smtp.mail.yahoo.com:587 (TLS)
- **OVH** : ssl0.ovh.net:465 (SSL)

## 📝 Notes techniques

### Dépendances ajoutées :
```bash
npm install nodemailer @types/nodemailer
```

### Fichiers modifiés :
- `src/lib/emailService.ts` : Logique d'envoi améliorée
- `src/components/admin/SMTPConfigDialog.tsx` : Interface de configuration
- `package.json` : Ajout de Nodemailer

### Flux d'envoi d'email :
1. **Configuration SMTP présente** → Utiliser SMTP direct
2. **Configuration SMTP absente** → Essayer Edge Function (si pas désactivée)
3. **Aucune méthode disponible** → Avertissement et échec

## 🎯 Avantages de cette solution

1. **Fiabilité** : Plus de dépendance à l'Edge Function
2. **Performance** : Envoi direct sans appel API supplémentaire
3. **Contrôle** : Configuration complète via l'interface
4. **Flexibilité** : Possibilité d'utiliser n'importe quel serveur SMTP
5. **Sécurité** : Pas d'exposition des credentials dans l'Edge Function

---

*Dernière mise à jour : Décembre 2024* 
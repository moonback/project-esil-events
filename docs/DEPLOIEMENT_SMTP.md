# Guide de Configuration et Dépannage SMTP

## Problème actuel
Les emails ne s'envoient pas car la fonction Supabase `send-email` utilise actuellement une simulation au lieu d'un vrai service SMTP.

## Solution

### 1. Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
# Configuration Supabase
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anonyme_supabase

# Configuration SMTP
VITE_SMTP_HOST=mail.dresscodeia.fr
VITE_SMTP_PORT=465
VITE_SMTP_USER=client@dresscodeia.fr
VITE_SMTP_PASSWORD=votre_mot_de_passe_smtp
VITE_SMTP_FROM=client@dresscodeia.fr
VITE_SMTP_FROM_NAME=Esil-events
```

### 2. Configuration des variables d'environnement Supabase

Dans votre projet Supabase, allez dans **Settings > Environment variables** et ajoutez :

```env
SMTP_HOST=mail.dresscodeia.fr
SMTP_PORT=465
SMTP_USER=client@dresscodeia.fr
SMTP_PASSWORD=votre_mot_de_passe_smtp
```

### 3. Déploiement de la fonction Supabase

```bash
# Dans le dossier du projet
cd supabase/functions/send-email
supabase functions deploy send-email
```

### 4. Test de la configuration

1. Connectez-vous à l'interface admin
2. Cliquez sur l'icône d'email dans la barre de navigation
3. Utilisez le dialogue de test SMTP pour envoyer un email de test

## Dépannage

### Erreur "SMTP déconnecté"

**Causes possibles :**
- Variables d'environnement manquantes
- Identifiants SMTP incorrects
- Port SMTP bloqué
- Serveur SMTP indisponible

**Solutions :**
1. Vérifiez que toutes les variables d'environnement sont définies
2. Testez la connexion SMTP avec un client email
3. Vérifiez les logs de la fonction Supabase

### Erreur "Email non envoyé"

**Causes possibles :**
- Fonction Supabase non déployée
- Erreur dans la configuration nodemailer
- Problème de CORS

**Solutions :**
1. Redéployez la fonction Supabase
2. Vérifiez les logs dans Supabase Dashboard
3. Testez avec un service SMTP alternatif

### Configuration alternative avec Gmail

Si vous préférez utiliser Gmail :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_d_application
```

**Note :** Pour Gmail, utilisez un "mot de passe d'application" généré dans les paramètres de sécurité.

### Configuration avec SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=votre_clé_api_sendgrid
```

## Vérification des logs

Pour voir les logs de la fonction Supabase :

1. Allez dans Supabase Dashboard
2. Cliquez sur **Functions**
3. Sélectionnez la fonction `send-email`
4. Vérifiez les logs dans l'onglet **Logs**

## Test manuel de la fonction

Vous pouvez tester la fonction directement via l'API Supabase :

```javascript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    emailData: {
      to: 'test@example.com',
      subject: 'Test SMTP',
      html: '<p>Test email</p>',
      text: 'Test email'
    }
  }
})

console.log('Résultat:', data, error)
```

## Problèmes courants

### 1. Erreur "Cannot find module 'nodemailer'"
- Assurez-vous que le fichier `deno.json` contient l'import nodemailer
- Redéployez la fonction après modification

### 2. Erreur "SMTP connection failed"
- Vérifiez les identifiants SMTP
- Testez la connexion avec un client email
- Vérifiez que le port n'est pas bloqué

### 3. Emails non reçus
- Vérifiez le dossier spam
- Testez avec une adresse email différente
- Vérifiez les logs de la fonction

## Support

Si les problèmes persistent :
1. Vérifiez les logs Supabase
2. Testez avec un service SMTP différent
3. Contactez l'équipe de support 
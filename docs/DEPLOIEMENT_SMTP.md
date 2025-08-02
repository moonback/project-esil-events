# Guide de déploiement du service SMTP

## 1. Installation de Supabase CLI

### Windows (PowerShell)
```powershell
# Installer via npm
npm install -g supabase

# Ou via winget
winget install Supabase.CLI
```

### macOS
```bash
# Installer via Homebrew
brew install supabase/tap/supabase

# Ou via npm
npm install -g supabase
```

### Linux
```bash
# Installer via npm
npm install -g supabase
```

## 2. Configuration du projet

### Connexion à Supabase
```bash
supabase login
```

### Lier le projet
```bash
# Remplacer YOUR_PROJECT_ID par l'ID de votre projet Supabase
supabase link --project-ref YOUR_PROJECT_ID
```

## 3. Configuration des variables d'environnement

### Dans le dashboard Supabase :
1. Allez dans **Settings** > **Edge Functions**
2. Ajoutez les variables suivantes :

```bash
SMTP_HOST=mail.dresscodeia.fr
SMTP_PORT=465
SMTP_USER=client@dresscodeia.fr
SMTP_PASSWORD=votre_mot_de_passe_smtp
SMTP_FROM=client@dresscodeia.fr
SMTP_FROM_NAME=Esil-events
```

## 4. Déploiement de la fonction

```bash
# Déployer la fonction send-email
supabase functions deploy send-email

# Vérifier que la fonction est déployée
supabase functions list
```

## 5. Test de la fonction

Une fois déployée, vous pouvez tester la fonction via l'interface d'administration de l'application.

## 6. Vérification des logs

```bash
# Voir les logs de la fonction
supabase functions logs send-email

# Voir les logs en temps réel
supabase functions logs send-email --follow
```

## 7. Mise à jour de la fonction

Après modification du code de la fonction :

```bash
supabase functions deploy send-email
```

## Dépannage

### Erreur CORS
Si vous obtenez une erreur CORS, vérifiez que :
1. La fonction est bien déployée
2. Les variables d'environnement sont configurées
3. L'URL de votre projet Supabase est correcte

### Erreur de connexion SMTP
Vérifiez que :
1. Les identifiants SMTP sont corrects
2. Le port 465 est ouvert
3. L'authentification SSL est activée

## Support

Pour plus d'informations, consultez la documentation Supabase :
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Variables d'environnement](https://supabase.com/docs/guides/functions/config) 
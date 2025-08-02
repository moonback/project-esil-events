# Configuration SMTP pour Supabase Edge Functions

## Variables d'environnement requises

Pour que le service d'email fonctionne correctement, vous devez configurer les variables d'environnement suivantes dans votre projet Supabase :

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

### Variables d'environnement côté client :

Dans votre fichier `.env` :

```bash
# Configuration SMTP
VITE_SMTP_HOST=mail.dresscodeia.fr
VITE_SMTP_PORT=465
VITE_SMTP_USER=client@dresscodeia.fr
VITE_SMTP_PASSWORD=votre_mot_de_passe_smtp
VITE_SMTP_FROM=client@dresscodeia.fr
VITE_SMTP_FROM_NAME=Esil-events
```

## Déploiement de la fonction

1. Assurez-vous d'avoir installé Supabase CLI
2. Connectez-vous à votre projet : `supabase login`
3. Liez votre projet : `supabase link --project-ref YOUR_PROJECT_ID`
4. Déployez la fonction : `supabase functions deploy send-email`

## Test de la configuration

Une fois déployée, vous pouvez tester la fonction via l'interface d'administration de l'application.

## Sécurité

- Ne partagez jamais les mots de passe SMTP
- Utilisez des variables d'environnement pour toutes les informations sensibles
- Vérifiez régulièrement les logs de la fonction pour détecter d'éventuelles anomalies 
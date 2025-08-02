
# Esil-events - Application de gestion d'événements

Application React/TypeScript pour la gestion d'événements avec interface admin et technicien.

## 🚀 Installation

```bash
npm install
```

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

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

## 📧 Configuration SMTP

### Problème : Les emails ne s'envoient pas

**Solution :**

1. **Configurez les variables d'environnement Supabase :**
   - Allez dans votre projet Supabase Dashboard
   - Settings > Environment variables
   - Ajoutez les variables SMTP :
   ```env
   SMTP_HOST=mail.dresscodeia.fr
   SMTP_PORT=465
   SMTP_USER=client@dresscodeia.fr
   SMTP_PASSWORD=votre_mot_de_passe_smtp
   ```

2. **Déployez la fonction Supabase :**
   ```bash
   cd supabase/functions/send-email
   supabase functions deploy send-email
   ```

3. **Testez la configuration :**
   ```bash
   npm run test:smtp
   ```

4. **Testez via l'interface :**
   - Connectez-vous en tant qu'admin
   - Cliquez sur l'icône email dans la barre de navigation
   - Utilisez le dialogue de test SMTP

### Test de la configuration SMTP

```bash
# Test local
npm run test:smtp

# Test avec une adresse email spécifique
TEST_EMAIL=votre-email@example.com npm run test:smtp
```

## 🛠️ Développement

```bash
npm run dev
```

## 📚 Documentation

- [Guide de configuration SMTP](docs/DEPLOIEMENT_SMTP.md)
- [Améliorations de l'application](docs/AMELIORATIONS.md)
- [Fonctionnalités](docs/NOUVELLES_FONCTIONNALITES.md)

## 🐛 Dépannage

### Erreur "toast is not a function"
- ✅ **Corrigé** : Le problème était dans l'utilisation du hook `useToast`
- Les notifications toast fonctionnent maintenant correctement

### Emails non envoyés
- Vérifiez la configuration SMTP dans Supabase Dashboard
- Testez avec le script de test SMTP
- Consultez le guide de dépannage SMTP

## 📝 Fonctionnalités

- Interface admin et technicien
- Gestion des missions et disponibilités
- Système de paiements
- Notifications par email
- Interface responsive
- Calendrier interactif

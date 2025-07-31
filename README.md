# EventPro - Plateforme de Gestion Événementielle

Une plateforme complète pour la gestion d'agences événementielles avec interface admin et technicien.

## 🚀 Fonctionnalités

### Interface Administrateur
- **Gestion des missions** : Création, modification, suppression et assignation de techniciens
- **Suivi des techniciens** : Vue d'ensemble des performances et statistiques
- **Planning visuel** : Calendrier interactif avec vue d'ensemble des missions
- **Facturation complète** : Gestion des paiements et validation des rémunérations

### Interface Technicien
- **Disponibilités** : Gestion interactive des créneaux de disponibilité
- **Missions proposées** : Acceptation/refus des missions assignées
- **Facturation personnelle** : Consultation des rémunérations
- **Agenda personnel** : Vue des missions acceptées et disponibilités

## 🛠 Stack Technique

- **Frontend** : React 18, TypeScript, TailwindCSS
- **État global** : Zustand
- **UI Components** : Radix UI, Custom components
- **Calendrier** : React Big Calendar
- **Backend** : Supabase (PostgreSQL + Auth + API REST)
- **Sécurité** : Row Level Security (RLS)

## 📋 Prérequis

- Node.js 18+
- Compte Supabase
- npm ou yarn

## ⚙️ Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd eventpro
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Supabase**
   - Créer un projet Supabase
   - Exécuter le script SQL dans `supabase/migrations/init_schema.sql`
   - Copier `.env.example` vers `.env`
   - Remplir les variables d'environnement :

```env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_clé_anonyme
```

4. **Données de test** (optionnel)
```sql
-- Créer des utilisateurs de test
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('admin-uuid', 'admin@test.com', 'encrypted_password', now(), now(), now()),
  ('tech-uuid', 'tech@test.com', 'encrypted_password', now(), now(), now());

INSERT INTO users (id, role, name, phone)
VALUES 
  ('admin-uuid', 'admin', 'Admin Test', '0123456789'),
  ('tech-uuid', 'technicien', 'Technicien Test', '0987654321');
```

## 🚀 Lancement

```bash
# Développement
npm run dev

# Build de production
npm run build

# Aperçu de production
npm run preview
```

## 🏗 Architecture du Projet

```
src/
├── components/
│   ├── admin/           # Composants interface admin
│   ├── auth/            # Authentification
│   ├── layout/          # Layout et navigation
│   ├── technician/      # Composants interface technicien
│   └── ui/              # Composants UI réutilisables
├── lib/
│   ├── supabase.ts      # Configuration Supabase
│   └── utils.ts         # Utilitaires
├── store/
│   ├── authStore.ts     # État d'authentification
│   └── missionsStore.ts # État des missions
├── types/
│   └── database.ts      # Types TypeScript
└── App.tsx
```

## 🔐 Sécurité

- **Row Level Security (RLS)** activé sur toutes les tables
- **Policies SQL** pour isolation des données par rôle
- **Authentification Supabase** avec gestion des sessions
- **Validation côté client et serveur**

## 📱 Responsive Design

- **Mobile-first** avec breakpoints adaptés
- **Navigation intuitive** sur tous les écrans
- **Calendrier responsive** avec adaptation mobile
- **Formulaires optimisés** pour mobile et desktop

## 🎨 Design System

- **Palette de couleurs** cohérente (bleu/indigo primaire)
- **Composants accessible** avec Radix UI
- **Animations fluides** et micro-interactions
- **Typography** hiérarchisée et lisible

## 🚀 Déploiement

### Frontend (Netlify/Vercel)
```bash
npm run build
# Déployer le dossier dist/
```

### Base de données
- Supabase hébergé (recommandé)
- Variables d'environnement configurées

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e
```

## 📈 Performance

- **Lazy loading** des composants
- **Memoization** des calculs coûteux
- **Optimisation des requêtes** Supabase
- **Cache intelligent** des données

## 🐛 Debugging

- **Logs détaillés** en développement
- **Gestion d'erreurs** centralisée
- **Messages d'erreur** explicites
- **Fallbacks** pour les états de chargement

## 📝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🆘 Support

- **Documentation** : [GitHub Wiki](lien-vers-wiki)
- **Issues** : [GitHub Issues](lien-vers-issues)
- **Email** : support@eventpro.com

## 🔄 Roadmap

- [ ] Notifications push
- [ ] Export PDF des factures
- [ ] API mobile
- [ ] Integration calendrier externe
- [ ] Système de chat intégré
- [ ] Analytics avancées

---

**EventPro** - Plateforme de gestion événementielle moderne et intuitive.
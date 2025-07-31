# EventPro - Plateforme de Gestion Événementielle Moderne

Une plateforme complète et moderne pour la gestion d'agences événementielles avec interface admin et technicien, dotée d'un design contemporain et d'animations fluides.

## 🎨 Design Moderne

### ✨ Caractéristiques Visuelles
- **Gradients dynamiques** : Utilisation de dégradés modernes pour une esthétique contemporaine
- **Animations fluides** : Transitions et micro-interactions pour une expérience utilisateur optimale
- **Glassmorphism** : Effets de transparence et de flou pour un look moderne
- **Particules animées** : Éléments visuels subtils en arrière-plan
- **Responsive design** : Interface adaptée à tous les écrans
- **Mode sombre/clair** : Support des thèmes pour une expérience personnalisée

### 🎯 Composants UI Améliorés
- **Boutons avec gradients** : Variantes colorées et animées
- **Cartes modernes** : Ombres douces et effets de survol
- **Badges stylisés** : Indicateurs de statut avec gradients
- **Formulaires élégants** : Champs avec icônes et animations
- **Calendrier interactif** : Interface de planning moderne

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
- **UI Components** : Radix UI, Custom components avec gradients
- **Calendrier** : React Big Calendar avec design personnalisé
- **Animations** : CSS animations et transitions fluides
- **Backend** : Supabase (PostgreSQL + Auth + API REST)
- **Sécurité** : Row Level Security (RLS)

## 🎨 Palette de Couleurs

### Gradients Principaux
- **Primaire** : `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Secondaire** : `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`
- **Succès** : `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`
- **Avertissement** : `linear-gradient(135deg, #fa709a 0%, #fee140 100%)`
- **Danger** : `linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)`

### Couleurs de Base
- **Indigo** : `#3b82f6` (Primaire)
- **Purple** : `#8b5cf6` (Secondaire)
- **Pink** : `#ec4899` (Accent)
- **Green** : `#10b981` (Succès)
- **Yellow** : `#f59e0b` (Avertissement)
- **Red** : `#ef4444` (Danger)

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
│   ├── auth/            # Authentification avec design moderne
│   ├── layout/          # Layout et navigation avec gradients
│   ├── technician/      # Composants interface technicien
│   └── ui/              # Composants UI réutilisables avec animations
├── lib/
│   ├── supabase.ts      # Configuration Supabase
│   └── utils.ts         # Utilitaires et fonctions de formatage
├── store/
│   ├── authStore.ts     # État d'authentification
│   └── missionsStore.ts # État des missions
├── types/
│   └── database.ts      # Types TypeScript
└── App.tsx              # Composant principal avec animations
```

## 🎨 Système de Design

### Animations Disponibles
- `animate-fade-in-up` : Apparition depuis le bas
- `animate-slide-in-right` : Glissement depuis la droite
- `animate-pulse-slow` : Pulsation lente
- `animate-bounce-slow` : Rebond lent
- `animate-scale-in` : Zoom d'entrée
- `animate-rotate-in` : Rotation d'entrée

### Composants avec Gradients
- **Boutons** : `variant="gradient-primary"`, `variant="gradient-success"`
- **Badges** : `variant="gradient-primary"`, `variant="gradient-warning"`
- **Cartes** : `CardGradient`, `CardGlass`

### Effets Visuels
- **Glassmorphism** : `glass` class pour effets de transparence
- **Neon Glow** : `neon-glow` class pour effets lumineux
- **Soft Shadows** : Ombres douces avec `shadow-soft`, `shadow-medium`

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

- **Palette de couleurs** cohérente avec gradients modernes
- **Composants accessible** avec Radix UI
- **Animations fluides** et micro-interactions
- **Typography** hiérarchisée et lisible
- **Espacement** cohérent avec système de design

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
- **Animations optimisées** avec GPU

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

- [ ] Mode sombre/clair
- [ ] Notifications push avec animations
- [ ] Export PDF des factures
- [ ] API mobile
- [ ] Integration calendrier externe
- [ ] Système de chat intégré
- [ ] Analytics avancées
- [ ] Animations 3D avec Three.js
- [ ] PWA avec cache intelligent

---

**EventPro** - Plateforme de gestion événementielle moderne et intuitive avec design contemporain.
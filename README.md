# Esil-events - Plateforme de Gestion Événementielle Moderne

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
- **Suivi des techniciens** : Vue d'ensemble des performances et statistiques avec statut de disponibilité en temps réel
- **Planning visuel** : Calendrier interactif avec vue d'ensemble des missions
- **Facturation complète** : Gestion des paiements et validation des rémunérations
- **Visualisation de la disponibilité** : Badges de statut et filtrage des techniciens par disponibilité
- **Gestion des indisponibilités** : Vue des périodes d'indisponibilité des techniciens avec leurs raisons

### Interface Technicien
- **Gestion des disponibilités** : Interface à onglets pour gérer les créneaux de disponibilité et d'indisponibilité
- **Missions proposées** : Acceptation/refus des missions assignées avec détection automatique des conflits
- **Facturation personnelle** : Consultation des rémunérations
- **Agenda personnel** : Vue des missions acceptées, disponibilités et indisponibilités
- **Validation des conflits** : Détection automatique des conflits entre missions et indisponibilités

## 🛠 Stack Technique

- **Frontend** : React 18, TypeScript, TailwindCSS
- **État global** : Zustand
- **UI Components** : Radix UI, Custom components avec gradients
- **Calendrier** : FullCalendar avec design personnalisé
- **Animations** : CSS animations et transitions fluides
- **Backend** : Supabase (PostgreSQL + Auth + API REST)
- **Sécurité** : Row Level Security (RLS)
- **Validation** : Zod pour la validation des schémas
- **Gestion des dates** : date-fns avec support français

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
cd Esil-events
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

-- Créer des disponibilités et indisponibilités de test
INSERT INTO availability (id, technician_id, start_time, end_time)
VALUES 
  ('avail-1', 'tech-uuid', '2024-01-15 09:00:00', '2024-01-15 17:00:00'),
  ('avail-2', 'tech-uuid', '2024-01-16 10:00:00', '2024-01-16 18:00:00');

INSERT INTO unavailability (id, technician_id, start_time, end_time, reason)
VALUES 
  ('unavail-1', 'tech-uuid', '2024-01-17 12:00:00', '2024-01-17 14:00:00', 'Pause déjeuner');
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
│   ├── utils.ts         # Utilitaires et fonctions de formatage
│   ├── validation.ts    # Validation centralisée avec Zod
│   └── useToast.ts      # Hook pour les notifications
├── store/
│   ├── authStore.ts     # État d'authentification
│   ├── adminStore.ts    # État de l'interface admin
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
- **Validation des conflits** : Détection automatique des conflits de planning
- **Gestion des indisponibilités** : Validation des périodes avec prévention des conflits

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
- **Badges de statut** : Indicateurs visuels pour la disponibilité des techniciens
- **Interface à onglets** : Navigation claire entre disponibilités et indisponibilités

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
- **Calculs en temps réel** : Statut de disponibilité calculé dynamiquement
- **Filtrage optimisé** : Recherche et filtrage des techniciens par disponibilité

## 🐛 Debugging

- **Logs détaillés** en développement
- **Gestion d'erreurs** centralisée
- **Messages d'erreur** explicites
- **Fallbacks** pour les états de chargement
- **Validation des conflits** : Messages d'erreur clairs pour les conflits de planning
- **Notifications toast** : Feedback immédiat pour toutes les actions utilisateur

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
- **Email** : support@Esil-events.com

## 🔄 Roadmap

### ✅ Fonctionnalités Récemment Ajoutées
- [x] Gestion des indisponibilités pour les techniciens
- [x] Visualisation de la disponibilité pour les administrateurs
- [x] Détection automatique des conflits de planning
- [x] Système de notifications toast
- [x] Validation centralisée avec Zod
- [x] Filtrage des techniciens par disponibilité

### 🚧 Fonctionnalités en Développement
- [ ] Mode sombre/clair
- [ ] Notifications push avec animations
- [ ] Export PDF des factures
- [ ] API mobile
- [ ] Integration calendrier externe
- [ ] Système de chat intégré
- [ ] Analytics avancées
- [ ] Animations 3D avec Three.js
- [ ] PWA avec cache intelligent

## 🆕 Nouvelles Fonctionnalités

### Gestion des Indisponibilités
- **Interface unifiée** : Les techniciens peuvent gérer leurs disponibilités et indisponibilités dans une interface à onglets
- **Validation intelligente** : Détection automatique des conflits entre disponibilités et indisponibilités
- **Raisons personnalisées** : Possibilité d'ajouter des raisons pour les périodes d'indisponibilité

### Visualisation de la Disponibilité
- **Statut en temps réel** : Calcul automatique du statut de disponibilité basé sur les périodes déclarées
- **Badges visuels** : Indicateurs colorés avec icônes pour chaque statut (disponible, indisponible, disponible bientôt, statut inconnu)
- **Filtrage intelligent** : Possibilité de filtrer les techniciens par leur statut de disponibilité
- **Statistiques globales** : Compteur de techniciens disponibles dans le tableau de bord administrateur

### Détection des Conflits
- **Validation automatique** : Vérification des conflits lors de l'acceptation de missions
- **Messages explicites** : Explication claire des conflits détectés
- **Prévention des erreurs** : Empêche l'acceptation de missions conflictuelles

---

**Esil-events** - Plateforme de gestion événementielle moderne et intuitive avec design contemporain et gestion avancée des disponibilités.
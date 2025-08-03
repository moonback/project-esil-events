
# 🎉 Esil-events – Plateforme de Gestion Événementielle Moderne

Esil-events est une plateforme **tout-en-un** pour les agences événementielles, offrant une **interface d'administration** et une **interface technicien** dans un design moderne, fluide et responsive.  
Elle permet de **planifier, gérer et suivre** facilement les missions et disponibilités des techniciens avec un système de facturation intégré et un système de notifications avancé.

## ✨ Points Forts

- 🎨 **Design contemporain** avec **gradients dynamiques**, **glassmorphism**, **animations fluides** et **mode sombre/clair**.  
- 📅 **Gestion intelligente des missions et disponibilités** avec détection automatique des conflits.  
- 💼 **Facturation complète** avec vue calendrier, filtres avancés et recherche intelligente.  
- 🔔 **Système de notifications avancé** avec paiements en lot et rémunérations en temps réel.
- 📱 **Interface responsive** optimisée pour mobile, tablette et desktop.  
- 🔐 **Sécurité avancée** grâce à Supabase et Row Level Security.  
- 🚀 **Performance optimisée** avec lazy loading, cache intelligent et calculs en temps réel.  
- ⚡ **Validation robuste** avec gestion d'erreurs et notifications toast.  

## 🖌️ Design & Expérience Utilisateur

### 🎨 Caractéristiques Visuelles
- Dégradés modernes et dynamiques  
- Effets **glassmorphism** et **neon glow**  
- Particules animées en arrière-plan  
- Composants UI avec **soft shadows** et transitions douces  
- Mode sombre/clair personnalisable  
- **Navigation bottom** responsive avec icônes

### 🧩 Composants UI Améliorés
- Boutons et badges avec gradients  
- Cartes modernes avec hover effects  
- Formulaires élégants avec animations  
- Calendrier interactif et responsive  
- Notifications toast pour un feedback instantané  
- Filtres avancés avec recherche en temps réel  
- **Menu flottant** avec actions rapides
- **Indicateurs de statut** en temps réel

## 🚀 Fonctionnalités

### 👑 Interface Administrateur

#### 📋 Gestion des Missions
- **Création et édition** de missions avec validation avancée
- **Assignation intelligente** des techniciens avec détection de conflits
- **Visualisation du planning** global avec calendrier interactif
- **Filtrage avancé** par type, statut, date et technicien
- **Détection automatique** des conflits de planning
- **Gestion des indisponibilités** des techniciens

#### 💰 Système de Facturation Avancé
- **Vue calendrier** pour la planification des paiements
- **Filtres avancés** par date, montant, technicien, statut
- **Recherche intelligente** dans les factures
- **Statistiques en temps réel** (total, moyenne, paiements par statut)
- **Gestion des statuts** : En attente → Validé → Payé
- **Export et reporting** des données de facturation
- **Paiements en lot** pour régler plusieurs factures en une fois
- **Notifications automatiques** aux techniciens lors des paiements

#### 🔔 Système de Notifications
- **Notifications en temps réel** pour les paiements
- **Paiements en lot** avec notifications détaillées
- **Historique des notifications** avec gestion des statuts
- **Interface de test** pour vérifier le système de notifications
- **Debugging avancé** pour diagnostiquer les problèmes

#### 👥 Gestion des Techniciens
- **Profil complet** avec informations de contact
- **Gestion des disponibilités** et indisponibilités
- **Historique des missions** et performances
- **Système de notifications** pour les nouvelles assignations

### 👷 Interface Technicien

#### 📅 Gestion des Disponibilités
- **Onglets séparés** pour disponibilités et indisponibilités
- **Calendrier interactif** avec vue mensuelle/semaine/jour
- **Détection de conflits** automatique lors de la création
- **Gestion des périodes** d'indisponibilité avec raisons
- **Validation en temps réel** des créneaux

#### 🎯 Missions et Planning
- **Acceptation/refus** de missions avec détection des conflits
- **Agenda personnel** avec planning clair et détaillé
- **Vue calendrier** et liste des missions acceptées
- **Notifications** pour les nouvelles propositions
- **Statut de disponibilité** calculé en temps réel

#### 💳 Facturation et Rémunération
- **Consultation des rémunérations** avec historique
- **Statistiques personnelles** (total gagné, missions complétées)
- **Filtrage par période** et statut de paiement
- **Détails des missions** avec montants et dates
- **Section "Mes Rémunérations"** avec notifications de paiement en lot
- **Historique des paiements** avec détails complets

#### 🔔 Notifications Personnelles
- **Onglet Notifications** dédié avec gestion des statuts
- **Marquage comme lu** individuel ou en lot
- **Suppression** des notifications obsolètes
- **Filtrage** par type de notification
- **Statistiques** des notifications non lues

#### 👤 Profil Technicien Amélioré
- **Statistiques personnelles** (missions, revenus, note moyenne)
- **Informations personnelles** modifiables
- **Historique des missions récentes**
- **Section "Mes Rémunérations"** avec notifications de paiement
- **Facturations récentes** avec statuts
- **Statut de validation** du compte

## 🛠️ Stack Technique

- **Frontend** : React 18 + TypeScript + TailwindCSS  
- **UI** : Radix UI + composants custom avec gradients  
- **État global** : Zustand  
- **Calendrier** : FullCalendar (personnalisé)  
- **Backend** : Supabase (PostgreSQL + Auth + API REST)  
- **Sécurité** : RLS + Policies SQL  
- **Validation** : Zod + validation personnalisée  
- **Dates** : date-fns (support français)  
- **Notifications** : Système toast personnalisé + notifications en temps réel
- **Paiements** : Système de paiements en lot avec notifications

## 🎨 Palette de Couleurs

- **Primaire** → `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`  
- **Secondaire** → `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`  
- **Succès** → `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`  
- **Avertissement** → `linear-gradient(135deg, #fa709a 0%, #fee140 100%)`  
- **Danger** → `linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)`  

## 📋 Prérequis

- Node.js 18+  
- Compte Supabase  
- npm ou yarn installé  

## ⚙️ Installation

```bash
git clone <repository-url>
cd Esil-events
npm install
```

Configurer Supabase :
1. Créer un projet Supabase  
2. Exécuter les migrations dans `supabase/migrations/`  
3. Copier `.env.example` → `.env` et remplir les clés :  

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_TOAST_DURATION=5000
```

## 🏗️ Architecture du Projet

```
src/
├── components/    # UI et pages
│   ├── admin/     # Interface administrateur
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminAgendaTab.tsx
│   │   ├── AdminBillingTab.tsx
│   │   ├── MissionsTab.tsx
│   │   ├── TechniciansTab.tsx
│   │   ├── AssignTechniciansDialog.tsx
│   │   ├── BulkPaymentDialog.tsx
│   │   ├── MissionDialog.tsx
│   │   ├── BillingCalendarView.tsx
│   │   ├── AdvancedBillingFilters.tsx
│   │   ├── TestNotifications.tsx
│   │   └── DebugNotifications.tsx
│   ├── technician/ # Interface technicien
│   │   ├── TechnicianDashboard.tsx
│   │   ├── TechnicianAgendaTab.tsx
│   │   ├── TechnicianBillingTab.tsx
│   │   ├── TechnicianProfileTab.tsx
│   │   ├── AvailabilityTab.tsx
│   │   ├── ProposedMissionsTab.tsx
│   │   └── NotificationsTab.tsx
│   ├── auth/      # Authentification
│   └── ui/        # Composants UI réutilisables
│       ├── floating-actions.tsx
│       ├── notification.tsx
│       └── ...
├── lib/           # Supabase, utils, hooks, validation
├── store/         # État global (Zustand)
├── types/         # Types TypeScript
└── App.tsx
```

## 🔐 Sécurité

- **Row Level Security** activé sur toutes les tables  
- **Policies SQL** par rôle (admin, technicien)  
- **Authentification Supabase** + gestion des sessions  
- **Validation Zod** côté client et serveur  
- **Conflits de planning** détectés automatiquement  
- **Validation des formulaires** avec gestion d'erreurs  
- **Fonctions RPC** pour les opérations sensibles

## 💰 Système de Facturation

### Fonctionnalités Avancées
- **Vue calendrier** avec planification des paiements
- **Filtres avancés** par date, montant, technicien, statut
- **Recherche intelligente** dans les factures
- **Statistiques en temps réel** (total, moyenne, paiements par statut)
- **Gestion des statuts** : En attente → Validé → Payé
- **Export et reporting** des données de facturation
- **Paiements en lot** pour régler plusieurs factures en une fois
- **Notifications automatiques** aux techniciens lors des paiements

### Interface Utilisateur
- **Vue liste** et **vue calendrier** interchangeables
- **Indicateurs visuels** pour les différents statuts
- **Détails enrichis** avec nom du technicien et mission
- **Actions rapides** pour validation et paiement
- **Notifications toast** pour les actions importantes
- **Bouton "Paiement en Lot"** pour les paiements groupés

## 🔔 Système de Notifications

### Fonctionnalités
- **Notifications en temps réel** pour les paiements
- **Paiements en lot** avec notifications détaillées
- **Historique des notifications** avec gestion des statuts
- **Interface de test** pour vérifier le système
- **Debugging avancé** pour diagnostiquer les problèmes
- **Marquage comme lu** individuel ou en lot
- **Suppression** des notifications obsolètes

### Types de Notifications
- **Paiement** : Notifications de paiement en lot
- **Mission** : Nouvelles assignations de missions
- **Système** : Notifications générales
- **Info** : Informations importantes

## 📅 Gestion des Disponibilités

### Fonctionnalités
- **Onglets séparés** pour disponibilités et indisponibilités
- **Calendrier interactif** avec vue mensuelle/semaine/jour
- **Détection de conflits** automatique lors de la création
- **Gestion des périodes** d'indisponibilité avec raisons
- **Validation en temps réel** des créneaux

### Interface
- **Vue calendrier** avec événements colorés
- **Formulaires de création** avec validation
- **Gestion des conflits** avec alertes visuelles
- **Statistiques** de disponibilité

## 🛠️ Tests

```bash
npm run test       # Tests unitaires
npm run test:e2e   # Tests end-to-end
```

## 📆 Roadmap

✅ **Déjà en place :**
- Gestion des indisponibilités avec détection de conflits
- Système de facturation avancé avec vue calendrier
- Filtres avancés et recherche intelligente
- Validation robuste avec gestion d'erreurs
- Notifications toast pour le feedback utilisateur
- Interface moderne avec animations et gradients
- Gestion des assignations avec détection de conflits
- Calendrier interactif pour les techniciens
- **Système de notifications avancé**
- **Paiements en lot avec notifications**
- **Section "Mes Rémunérations" pour les techniciens**
- **Navigation bottom responsive**
- **Interface de test et debugging des notifications**
- **Profil technicien amélioré avec statistiques**

🚧 **En développement :**
- Mode sombre/clair automatique
- Notifications push animées
- Export PDF des factures
- API mobile + intégration calendrier externe
- Chat intégré & analytics avancées
- Animations 3D (Three.js)
- PWA avec cache intelligent
- Système de rapports avancés
- Intégration avec des services de paiement
- **Notifications push en temps réel**
- **Système de badges pour les notifications non lues**
- **Export des données de facturation**

## 🤝 Contribution

1. Fork le projet  
2. `git checkout -b feature/NouvelleFeature`  
3. Commit (`git commit -m 'Add: NouvelleFeature'`)  
4. Push (`git push origin feature/NouvelleFeature`)  
5. Créer une Pull Request  

## 📄 Licence

Projet sous licence MIT – voir [LICENSE](LICENSE).  

## 🆘 Support

- [📚 Documentation](#)  
- [🐛 Issues](#)  
- ✉️ support@esil-events.com  

---

**Esil-events** - La plateforme moderne pour la gestion événementielle 🚀

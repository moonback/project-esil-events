# 🎉 Esil-Events
## Plateforme de Gestion du Personnel Événementiel

> **Une solution tout-en-un** pour les agences événementielles avec interface d'administration et interface technicien dans un design moderne, fluide et responsive.

---

## 🌟 Vue d'Ensemble

Esil-Events révolutionne la gestion du personnel événementiel en offrant une plateforme complète qui permet de **planifier, gérer et suivre** facilement les missions et disponibilités des techniciens avec un système de facturation intégré et des notifications avancées.

### 🎯 Objectifs Principaux
- Optimiser la planification des missions
- Automatiser la gestion des disponibilités
- Simplifier la facturation et les paiements
- Améliorer la communication équipe

---

## ✨ Points Forts

### 🎨 Design & Expérience Utilisateur
- **Design contemporain** avec gradients dynamiques, glassmorphism et animations fluides
- **Mode sombre/clair** personnalisable avec transitions douces
- **Interface responsive** optimisée pour tous les écrans
- **Navigation bottom** avec icônes intuitives
- **Particules animées** et effets visuels immersifs

### 🚀 Performance & Sécurité
- **Performance optimisée** avec lazy loading et cache intelligent
- **Sécurité avancée** via Supabase et Row Level Security
- **Validation robuste** avec gestion d'erreurs complète
- **Calculs en temps réel** pour une réactivité maximale

### 🔧 Fonctionnalités Avancées
- **Gestion intelligente** des missions avec détection automatique des conflits
- **Facturation complète** avec vue calendrier et filtres avancés
- **Système de notifications** en temps réel avec paiements en lot
- **Recherche intelligente** et filtrage avancé

---

## 🛠️ Architecture Technique

### Stack Principal
| Technologie | Version | Usage |
|------------|---------|-------|
| **React** | 18+ | Framework frontend principal |
| **TypeScript** | Latest | Typage statique et sécurité |
| **TailwindCSS** | Latest | Styles et design system |
| **Supabase** | Latest | Backend, auth et base de données |
| **Zustand** | Latest | État global de l'application |

### Outils Spécialisés
- **Radix UI** - Composants accessibles
- **FullCalendar** - Gestion des calendriers
- **Zod** - Validation des schémas
- **date-fns** - Manipulation des dates (support français)

---

## 🏗️ Structure du Projet

```
src/
├── 📁 components/           # Composants UI et pages
│   ├── 👑 admin/           # Interface administrateur
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminAgendaTab.tsx
│   │   ├── AdminBillingTab.tsx
│   │   ├── MissionsTab.tsx
│   │   ├── TechniciansTab.tsx
│   │   └── ...
│   ├── 👷 technician/      # Interface technicien
│   │   ├── TechnicianDashboard.tsx
│   │   ├── AvailabilityTab.tsx
│   │   ├── NotificationsTab.tsx
│   │   └── ...
│   ├── 🔐 auth/           # Authentification
│   └── 🎨 ui/             # Composants réutilisables
├── 📚 lib/                # Utilitaires et hooks
├── 🗄️ store/             # État global (Zustand)
├── 📝 types/              # Types TypeScript
└── App.tsx
```

---

## 👑 Interface Administrateur

### 📋 Gestion des Missions
| Fonctionnalité | Description |
|----------------|-------------|
| **Création intelligente** | Formulaires avec validation avancée |
| **Assignation automatique** | Détection de conflits et suggestions |
| **Planning global** | Vue calendrier interactive |
| **Filtrage avancé** | Par type, statut, date, technicien |
| **Gestion des conflits** | Détection automatique et résolution |

### 💰 Système de Facturation Avancé

#### Vue d'Ensemble
- **Vue calendrier** pour planification des paiements
- **Statistiques en temps réel** (total, moyenne, statuts)
- **Filtres intelligents** par date, montant, technicien
- **Recherche avancée** dans toutes les factures
- **Export et reporting** des données complètes

#### Workflow des Paiements
```
En attente → Validé → Payé
    ↓         ↓       ↓
Création   Validation  Paiement
```

#### Fonctionnalités Spéciales
- **Paiements en lot** pour traiter plusieurs factures
- **Notifications automatiques** aux techniciens
- **Historique complet** des transactions
- **Actions rapides** pour validation et paiement

### 🔔 Système de Notifications

#### Types de Notifications
| Type | Usage | Priorité |
|------|-------|----------|
| **Paiement** | Notifications de règlement | Haute |
| **Mission** | Nouvelles assignations | Moyenne |
| **Système** | Alertes générales | Variable |
| **Info** | Communications diverses | Basse |

#### Fonctionnalités
- Notifications en temps réel
- Interface de test et debugging
- Historique avec gestion des statuts
- Marquage lu/non lu en lot
- Suppression intelligente

---

## 👷 Interface Technicien

### 📅 Gestion des Disponibilités

#### Organisation
- **Onglets séparés** : Disponibilités / Indisponibilités
- **Calendrier interactif** : Vue mensuelle/semaine/jour
- **Validation temps réel** des créneaux
- **Gestion des conflits** avec alertes visuelles

#### Fonctionnalités Avancées
- Détection automatique des conflits
- Périodes d'indisponibilité avec raisons
- Calcul du statut de disponibilité
- Statistiques personnelles de disponibilité

### 🎯 Missions et Planning

#### Gestion des Missions
- **Acceptation/Refus** avec gestion des conflits
- **Agenda personnel** clair et détaillé
- **Vue calendrier** et liste des missions
- **Notifications** pour nouvelles propositions

### 💳 Section "Mes Rémunérations"

#### Vue d'Ensemble
- **Historique complet** des paiements
- **Statistiques personnelles** (revenus, missions)
- **Filtrage par période** et statut
- **Détails enrichis** des missions

#### Notifications de Paiement
- Notifications en lot détaillées
- Historique des paiements avec statuts
- Alertes en temps réel
- Suivi des montants et dates

### 🔔 Notifications Personnelles
- Onglet dédié avec gestion complète
- Marquage lu/non lu individuel ou en lot
- Suppression des notifications obsolètes
- Filtrage par type et priorité
- Statistiques des notifications non lues

---

## 🎨 Design System

### Palette de Couleurs
| Usage | Gradient |
|-------|----------|
| **Primaire** | `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` |
| **Secondaire** | `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)` |
| **Succès** | `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)` |
| **Avertissement** | `linear-gradient(135deg, #fa709a 0%, #fee140 100%)` |
| **Danger** | `linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)` |

### Effets Visuels
- **Glassmorphism** - Transparence et flou
- **Neon Glow** - Effets lumineux
- **Soft Shadows** - Ombres douces
- **Micro-animations** - Transitions fluides
- **Particules animées** - Arrière-plan dynamique

---

## ⚙️ Installation et Configuration

### Prérequis
- Node.js 18+
- Compte Supabase actif
- npm ou yarn installé

### Installation Rapide
```bash
# Cloner le repository
git clone <repository-url>
cd Esil-events

# Installer les dépendances
npm install

# Configuration environnement
cp .env.example .env
# Remplir les variables Supabase
```

### Variables d'Environnement
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_TOAST_DURATION=5000
```

### Configuration Supabase
1. Créer un nouveau projet Supabase
2. Exécuter les migrations : `supabase/migrations/`
3. Configurer les Row Level Security policies
4. Activer l'authentification

---

## 🔐 Sécurité

### Mesures Principales
| Niveau | Sécurité |
|--------|----------|
| **Base de données** | Row Level Security + Policies SQL |
| **Authentification** | Supabase Auth + gestion des sessions |
| **Validation** | Zod côté client et serveur |
| **Opérations** | Fonctions RPC pour actions sensibles |

### Protections Automatiques
- Détection des conflits de planning
- Validation des formulaires en temps réel
- Gestion des erreurs robuste
- Contrôle d'accès par rôle (admin/technicien)

---

## 🧪 Tests et Qualité

### Types de Tests
```bash
npm run test       # Tests unitaires
npm run test:e2e   # Tests end-to-end
npm run lint       # Vérification du code
npm run type-check # Vérification TypeScript
```

### Outils de Qualité
- **ESLint** - Analyse statique du code
- **Prettier** - Formatage automatique
- **TypeScript** - Vérification de types
- **Husky** - Git hooks pour la qualité

---

## 📈 Roadmap

### ✅ Fonctionnalités Actuelles
- [x] Gestion complète des missions et disponibilités
- [x] Système de facturation avancé avec vue calendrier
- [x] Notifications en temps réel avec paiements en lot
- [x] Interface responsive avec design moderne
- [x] Sécurité avancée et validation robuste
- [x] Profils techniciens avec statistiques
- [x] Section "Mes Rémunérations" complète

---

## 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">

**Esil-Events** - *La plateforme moderne pour la gestion événementielle* 🚀

Made with ❤️ by the Esil-Events Team

[🌐 Site Web](#) • [📖 Documentation](#) • [🐛 Issues](#) • [💬 Support](#)

</div>


# 🎉 Esil-events – Plateforme de Gestion Événementielle Moderne

Esil-events est une plateforme **tout-en-un** pour les agences événementielles, offrant une **interface d'administration** et une **interface technicien** dans un design moderne, fluide et responsive.  
Elle permet de **planifier, gérer et suivre** facilement les missions et disponibilités des techniciens avec un système de facturation intégré.

## ✨ Points Forts

- 🎨 **Design contemporain** avec **gradients dynamiques**, **glassmorphism**, **animations fluides** et **mode sombre/clair**.  
- 📅 **Gestion intelligente des missions et disponibilités** avec détection automatique des conflits.  
- 💼 **Facturation complète** pour administrateurs et techniciens.  
- 📱 **Interface responsive** optimisée pour mobile, tablette et desktop.  
- 🔐 **Sécurité avancée** grâce à Supabase et Row Level Security.  
- 🚀 **Performance optimisée** avec lazy loading, cache intelligent et calculs en temps réel.
- 🗺️ **Carte interactive Mapbox** pour la gestion terrain et l'optimisation des tournées.

## 🖌️ Design & Expérience Utilisateur

### 🎨 Caractéristiques Visuelles
- Dégradés modernes et dynamiques  
- Effets **glassmorphism** et **neon glow**  
- Particules animées en arrière-plan  
- Composants UI avec **soft shadows** et transitions douces  
- Mode sombre/clair personnalisable  

### 🧩 Composants UI Améliorés
- Boutons et badges avec gradients  
- Cartes modernes avec hover effects  
- Formulaires élégants avec animations  
- Calendrier interactif et responsive  
- Notifications toast pour un feedback instantané  

## 🚀 Fonctionnalités

### 👑 Interface Administrateur
- Création et gestion des missions  
- Assignation et suivi des techniciens  
- Visualisation du planning global avec calendrier  
- Gestion des paiements et facturations  
- Filtrage intelligent et badges de disponibilité  
- Gestion des périodes d'indisponibilité  
- **🗺️ Carte interactive Mapbox** avec gestion terrain et optimisation des tournées

### 👷 Interface Technicien
- Gestion des disponibilités et indisponibilités via onglets  
- Acceptation/refus de missions avec détection des conflits  
- Agenda personnel avec planning clair  
- Consultation des rémunérations  
- Statut de disponibilité calculé en temps réel  

### 🗺️ Gestion Terrain (Nouveau)
- **Carte interactive Mapbox** avec vues multiples (missions, techniciens, itinéraires)
- **Marqueurs dynamiques** avec taille adaptée au nombre de techniciens requis
- **Popups détaillés** avec informations complètes des missions
- **Itinéraires optimisés** avec routes GeoJSON et numérotation
- **Contrôles avancés** : zoom, géolocalisation, plein écran, changement de style
- **Statistiques terrain** : missions actives, distance totale, durée moyenne

## 🛠️ Stack Technique

- **Frontend** : React 18 + TypeScript + TailwindCSS  
- **UI** : Radix UI + composants custom avec gradients  
- **État global** : Zustand  
- **Calendrier** : FullCalendar (personnalisé)  
- **Backend** : Supabase (PostgreSQL + Auth + API REST)  
- **Sécurité** : RLS + Policies SQL  
- **Validation** : Zod  
- **Dates** : date-fns (support français)
- **🗺️ Cartes** : Mapbox GL JS + react-map-gl

## 🎨 Palette de Couleurs

- **Primaire** → `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`  
- **Secondaire** → `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`  
- **Succès** → `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`  
- **Avertissement** → `linear-gradient(135deg, #fa709a 0%, #fee140 100%)`  
- **Danger** → `linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)`  

## 📋 Prérequis

- Node.js 18+  
- Compte Supabase  
- Compte Mapbox (pour la carte interactive)
- npm ou yarn installé  

## ⚙️ Installation

```bash
git clone <repository-url>
cd Esil-events
npm install
```

Configurer Supabase :
1. Créer un projet Supabase  
2. Exécuter `supabase/migrations/init_schema.sql`  
3. Copier `.env.example` → `.env` et remplir les clés :  

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_MAPBOX_TOKEN=your_mapbox_token
```

### 🗺️ Configuration Mapbox

1. Créez un compte sur [Mapbox](https://www.mapbox.com/)
2. Obtenez un token d'accès public
3. Ajoutez le token dans votre fichier `.env`
4. Consultez `docs/MAPBOX_SETUP.md` pour plus de détails

## 🏗️ Architecture du Projet

```
src/
├── components/    # UI et pages
│   ├── admin/
│   ├── technician/
│   ├── auth/
│   └── ui/
├── lib/           # Supabase, utils, hooks, mapbox-config
├── store/         # État global
├── types/         # Types TS
└── App.tsx
```

## 🔐 Sécurité

- Row Level Security activé  
- Policies SQL par rôle (admin, technicien)  
- Authentification Supabase + gestion des sessions  
- Validation Zod côté client et serveur  
- Conflits de planning détectés automatiquement  

## 🛠️ Tests

```bash
npm run test       # Tests unitaires
npm run test:e2e   # Tests end-to-end
```

## 📆 Roadmap

✅ Déjà en place :
- Gestion des indisponibilités  
- Détection automatique des conflits  
- Visualisation de la disponibilité  
- Système de notifications  
- Filtrage avancé  
- **🗺️ Carte interactive Mapbox** avec gestion terrain

🚧 En développement :
- Mode sombre/clair  
- Notifications push animées  
- Export PDF des factures  
- API mobile + intégration calendrier externe  
- Chat intégré & analytics avancées  
- Animations 3D (Three.js)  
- PWA avec cache intelligent  

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

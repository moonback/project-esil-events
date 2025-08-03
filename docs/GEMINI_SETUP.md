# Configuration de l'API Gemini pour l'optimisation d'itinéraires

## 🚀 Vue d'ensemble

L'application utilise l'API Gemini de Google pour générer des itinéraires optimisés et réalistes pour les techniciens. Cette fonctionnalité permet de :

- Calculer des distances précises entre les missions
- Optimiser l'ordre des missions pour minimiser le temps de trajet
- Estimer les coûts de carburant
- Fournir des temps de trajet réalistes selon le mode de transport

## 🔧 Configuration

### 1. Obtenir une clé API Gemini

1. Allez sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Create API Key"
4. Copiez la clé générée

### 2. Configurer l'environnement

Créez un fichier `.env` à la racine du projet avec :

```env
# Supabase (déjà configuré)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini API
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 3. Redémarrer l'application

```bash
npm run dev
```

## 🎯 Fonctionnalités

### Optimisation intelligente

L'IA Gemini analyse vos missions et génère un itinéraire optimal en considérant :

- **Distance minimale** : Algorithme du plus proche voisin
- **Ordre logique** : Optimisation de la séquence des missions
- **Temps de trajet** : Calculs réalistes selon le mode de transport
- **Coûts** : Estimation des frais de carburant

### Modes de transport supportés

1. **Voiture** : 50 km/h (vitesse moyenne en ville)
2. **À pied** : 5 km/h (marche normale)
3. **Vélo** : 15 km/h (cyclisme urbain)
4. **Transport** : 25 km/h (bus/métro)

### Interface utilisateur

- **Bouton "Optimiser avec IA"** : Lance l'optimisation
- **Indicateur de chargement** : Pendant la génération
- **Statistiques détaillées** : Distance, temps, coûts
- **Itinéraire segmenté** : Chaque étape avec distance et temps
- **Ordre recommandé** : Séquence optimale des missions

## 🔄 Fallback automatique

Si l'API Gemini n'est pas disponible ou échoue, l'application utilise automatiquement :

- Calculs locaux avec la formule de Haversine
- Algorithme du plus proche voisin
- Estimations de temps et coûts basées sur des moyennes

## 📊 Exemple de réponse Gemini

```json
{
  "totalDistance": 45.2,
  "estimatedTime": 67,
  "fuelCost": 6.78,
  "route": [
    {
      "from": "Dépôt Mantes-la-Ville",
      "to": "Mission 1",
      "distance": 12.3,
      "time": 15,
      "mode": "driving"
    },
    {
      "from": "Mission 1",
      "to": "Mission 2",
      "distance": 8.7,
      "time": 10,
      "mode": "driving"
    }
  ],
  "optimizedOrder": ["Mission 1", "Mission 2", "Mission 3"]
}
```

## 🛠️ Dépannage

### Erreur "API Key invalide"
- Vérifiez que la clé API est correctement configurée
- Assurez-vous que la clé a les permissions nécessaires

### Erreur "Rate limit exceeded"
- L'API Gemini a des limites de requêtes
- Attendez quelques minutes avant de relancer

### Fallback activé
- Vérifiez les logs dans la console
- L'application continue de fonctionner avec les calculs locaux

## 🔒 Sécurité

- La clé API est stockée côté client (Vite)
- Utilisez des variables d'environnement
- Ne committez jamais la clé API dans le code

## 📈 Améliorations futures

- [ ] Intégration avec Google Maps Directions API
- [ ] Optimisation multi-objectifs (temps + coût)
- [ ] Prise en compte du trafic en temps réel
- [ ] Historique des itinéraires optimisés
- [ ] Export des itinéraires en PDF 
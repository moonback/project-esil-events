# Visibilité de la Disponibilité des Techniciens pour les Administrateurs

## Vue d'ensemble

Cette fonctionnalité permet aux administrateurs de voir en temps réel le statut de disponibilité de tous les techniciens, facilitant ainsi la planification et l'assignation des missions.

## Fonctionnalités

### 1. Statut de Disponibilité en Temps Réel

Les administrateurs peuvent voir le statut de disponibilité de chaque technicien avec des indicateurs visuels clairs :

- **Disponible** (vert) : Le technicien est actuellement disponible
- **Indisponible** (rouge) : Le technicien a déclaré une indisponibilité
- **Disponible bientôt** (bleu) : Le technicien sera disponible dans les prochaines 24h
- **Statut inconnu** (gris) : Aucune information de disponibilité

### 2. Filtrage par Disponibilité

Les administrateurs peuvent filtrer les techniciens selon leur statut :
- Tous les techniciens
- Techniciens disponibles uniquement
- Techniciens indisponibles uniquement
- Techniciens avec statut inconnu

### 3. Statistiques de Disponibilité

Un nouveau widget affiche le nombre de techniciens actuellement disponibles dans les statistiques globales.

### 4. Vue Détaillée des Disponibilités

Dans la vue détaillée de chaque technicien, les administrateurs peuvent voir :
- Les périodes de disponibilité (avec horaires)
- Les périodes d'indisponibilité (avec horaires et raisons)
- Le statut actuel avec explication

## Implémentation Technique

### Types de Données

```typescript
// Statut de disponibilité calculé
type AvailabilityStatus = {
  status: 'disponible' | 'indisponible' | 'disponible_soon' | 'unknown'
  text: string
  color: string
  icon: LucideIcon
  reason: string
}
```

### Fonction de Calcul du Statut

```typescript
const getAvailabilityStatus = (technician: TechnicianWithStats) => {
  const now = new Date()
  const currentTime = now.getTime()
  
  // Vérifier les indisponibilités actuelles
  const currentUnavailability = technician.unavailabilities?.find(unavail => {
    const start = parseISO(unavail.start_time)
    const end = parseISO(unavail.end_time)
    return currentTime >= start.getTime() && currentTime <= end.getTime()
  })
  
  if (currentUnavailability) {
    return {
      status: 'indisponible',
      text: 'Indisponible',
      color: 'bg-red-100 text-red-800',
      icon: Ban,
      reason: currentUnavailability.reason || 'Indisponible'
    }
  }
  
  // Vérifier les disponibilités actuelles
  const currentAvailability = technician.availabilities?.find(avail => {
    const start = parseISO(avail.start_time)
    const end = parseISO(avail.end_time)
    return currentTime >= start.getTime() && currentTime <= end.getTime()
  })
  
  if (currentAvailability) {
    return {
      status: 'disponible',
      text: 'Disponible',
      color: 'bg-green-100 text-green-800',
      icon: CheckCircle2,
      reason: 'Disponible maintenant'
    }
  }
  
  // Vérifier les disponibilités futures
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const futureAvailability = technician.availabilities?.find(avail => {
    const start = parseISO(avail.start_time)
    return start.getTime() <= tomorrow.getTime() && start.getTime() > currentTime
  })
  
  if (futureAvailability) {
    return {
      status: 'disponible_soon',
      text: 'Disponible bientôt',
      color: 'bg-blue-100 text-blue-800',
      icon: Clock4,
      reason: `Disponible le ${format(parseISO(futureAvailability.start_time), 'dd/MM à HH:mm', { locale: fr })}`
    }
  }
  
  return {
    status: 'unknown',
    text: 'Statut inconnu',
    color: 'bg-gray-100 text-gray-800',
    icon: AlertTriangle,
    reason: 'Aucune disponibilité définie'
  }
}
```

### Filtrage des Techniciens

```typescript
const filteredTechnicians = technicians.filter(tech => {
  // Filtre par recherche
  const matchesSearch = tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       tech.phone?.includes(searchTerm)
  
  if (!matchesSearch) return false
  
  // Filtre par disponibilité
  if (availabilityFilter !== 'all') {
    const availabilityStatus = getAvailabilityStatus(tech)
    if (availabilityFilter === 'available' && availabilityStatus.status !== 'disponible') return false
    if (availabilityFilter === 'unavailable' && availabilityStatus.status !== 'indisponible') return false
    if (availabilityFilter === 'unknown' && availabilityStatus.status !== 'unknown') return false
  }
  
  return true
})
```

## Interface Utilisateur

### Badge de Statut

Chaque technicien affiche un badge coloré indiquant son statut de disponibilité avec une icône et un texte explicatif.

### Filtres

- **Trier par** : Nom, nombre de missions, revenus, note moyenne
- **Ordre** : Croissant ou décroissant
- **Disponibilité** : Tous, disponibles, indisponibles, statut inconnu

### Vue Détaillée

Dans la vue détaillée de chaque technicien :
- Section "Disponibilités" avec les périodes de disponibilité
- Section "Indisponibilités" avec les périodes d'indisponibilité et leurs raisons
- Statut actuel avec explication détaillée

## Avantages

1. **Planification Améliorée** : Les administrateurs peuvent rapidement identifier les techniciens disponibles
2. **Assignation Optimisée** : Facilite l'assignation des missions aux techniciens disponibles
3. **Visibilité Complète** : Vue d'ensemble de la disponibilité de l'équipe
4. **Filtrage Intelligent** : Possibilité de filtrer selon les besoins spécifiques
5. **Informations Contextuelles** : Raisons des indisponibilités pour une meilleure compréhension

## Fichiers Modifiés

- `src/components/admin/TechniciansTab.tsx` : Interface principale avec affichage et filtrage
- `src/store/adminStore.ts` : Récupération des indisponibilités dans le store
- `src/types/database.ts` : Types mis à jour pour inclure les indisponibilités

## Utilisation

1. **Accéder à l'onglet Techniciens** dans le dashboard administrateur
2. **Voir les badges de statut** sur chaque carte de technicien
3. **Utiliser les filtres** pour afficher uniquement les techniciens disponibles
4. **Cliquer sur "Plus"** pour voir les détails de disponibilité
5. **Consulter les statistiques** pour voir le nombre de techniciens disponibles

Cette fonctionnalité améliore significativement la capacité des administrateurs à gérer efficacement les ressources humaines et à optimiser l'assignation des missions. 
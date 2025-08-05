import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isValid, subHours } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
}

export function formatDateLong(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// Fonction pour formater les horaires de mission en tenant compte du fuseau horaire local
export function formatMissionTimeRange(startDate: string, endDate: string): string {
  try {
    // Conversion des dates UTC en heure locale et soustraction de 2 heures
    const start = subHours(parseISO(startDate), 2)
    const end = subHours(parseISO(endDate), 2)
    
    if (!isValid(start) || !isValid(end)) {
      return 'Horaires non disponibles'
    }
    
    // Formatage avec date-fns pour une meilleure gestion des fuseaux horaires
    const startFormatted = format(start, 'dd/MM/yyyy HH:mm', { locale: fr })
    const endFormatted = format(end, 'HH:mm', { locale: fr })
    
    return `${startFormatted} - ${endFormatted}`
  } catch (error) {
    console.error('Erreur lors du formatage des horaires:', error)
    return 'Horaires non disponibles'
  }
}

// Fonction pour formater uniquement les heures (sans la date)
export function formatMissionHours(startDate: string, endDate: string): string {
  try {
    // Soustraction de 2 heures aux horaires
    const start = subHours(parseISO(startDate), 2)
    const end = subHours(parseISO(endDate), 2)
    
    if (!isValid(start) || !isValid(end)) {
      return 'Heures non disponibles'
    }
    
    const startFormatted = format(start, 'HH:mm', { locale: fr })
    const endFormatted = format(end, 'HH:mm', { locale: fr })
    
    return `${startFormatted} - ${endFormatted}`
  } catch (error) {
    console.error('Erreur lors du formatage des heures:', error)
    return 'Heures non disponibles'
  }
}

// Fonction pour obtenir la durée d'une mission
export function getMissionDuration(startDate: string, endDate: string): string {
  try {
    // Soustraction de 2 heures aux horaires pour le calcul de la durée
    const start = subHours(parseISO(startDate), 2)
    const end = subHours(parseISO(endDate), 2)
    
    if (!isValid(start) || !isValid(end)) {
      return 'Durée non disponible'
    }
    
    const durationMs = end.getTime() - start.getTime()
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60))
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (durationHours > 0) {
      return `${durationHours}h${durationMinutes > 0 ? ` ${durationMinutes}min` : ''}`
    } else {
      return `${durationMinutes}min`
    }
  } catch (error) {
    console.error('Erreur lors du calcul de la durée:', error)
    return 'Durée non disponible'
  }
}

export function getMissionTypeColor(type: string): string {
  const colors = {
    'Livraison jeux': 'bg-blue-100 text-blue-800',
    'Presta sono': 'bg-green-100 text-green-800',
    'DJ': 'bg-purple-100 text-purple-800',
    'Manutention': 'bg-orange-100 text-orange-800',
    'Déplacement': 'bg-gray-100 text-gray-800'
  }
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

export function getStatusColor(status: string): string {
  const colors = {
    'proposé': 'bg-yellow-100 text-yellow-800',
    'accepté': 'bg-green-100 text-green-800',
    'refusé': 'bg-red-100 text-red-800',
    'en_attente': 'bg-yellow-100 text-yellow-800',
    'validé': 'bg-blue-100 text-blue-800',
    'payé': 'bg-green-100 text-green-800'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}
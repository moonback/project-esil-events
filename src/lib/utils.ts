import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function getMissionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'Livraison jeux': 'bg-blue-100 text-blue-800',
    'Presta sono': 'bg-green-100 text-green-800',
    'DJ': 'bg-purple-100 text-purple-800',
    'Manutention': 'bg-orange-100 text-orange-800',
    'Déplacement': 'bg-gray-100 text-gray-800'
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'proposé': 'bg-yellow-100 text-yellow-800',
    'accepté': 'bg-green-100 text-green-800',
    'refusé': 'bg-red-100 text-red-800',
    'en_attente': 'bg-yellow-100 text-yellow-800',
    'validé': 'bg-blue-100 text-blue-800',
    'payé': 'bg-green-100 text-green-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getVehicleTypeLabel(type: string | null): string {
  const labels: Record<string, string> = {
    'voiture_particuliere': 'Voiture particulière',
    'camionnette': 'Camionnette',
    'camion': 'Camion',
    'fourgon': 'Fourgon',
    'remorque': 'Remorque',
    'moto': 'Moto',
    'velo': 'Vélo',
    'aucun': 'Aucun véhicule'
  }
  return labels[type || ''] || 'Non spécifié'
}

export function getPriorityLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    'low': 'Faible',
    'normal': 'Normal',
    'high': 'Élevée',
    'urgent': 'Urgente'
  }
  return labels[level] || 'Normal'
}

export function getPriorityLevelColor(level: string): string {
  const colors: Record<string, string> = {
    'low': 'bg-gray-100 text-gray-800',
    'normal': 'bg-blue-100 text-blue-800',
    'high': 'bg-orange-100 text-orange-800',
    'urgent': 'bg-red-100 text-red-800'
  }
  return colors[level] || 'bg-blue-100 text-blue-800'
}

export function getVehicleTypeIcon(type: string | null): string {
  const icons: Record<string, string> = {
    'voiture_particuliere': '🚗',
    'camionnette': '🚐',
    'camion': '🚛',
    'fourgon': '🚚',
    'remorque': '🚛',
    'moto': '🏍️',
    'velo': '🚲',
    'aucun': '🚶'
  }
  return icons[type || ''] || '❓'
}

// Fonctions pour les véhicules de l'entreprise
export function getVehicleStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'disponible': 'Disponible',
    'en_mission': 'En mission',
    'maintenance': 'En maintenance',
    'hors_service': 'Hors service'
  }
  return labels[status] || 'Inconnu'
}

export function getVehicleStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'disponible': 'bg-green-100 text-green-800',
    'en_mission': 'bg-blue-100 text-blue-800',
    'maintenance': 'bg-orange-100 text-orange-800',
    'hors_service': 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getVehicleStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    'disponible': '✅',
    'en_mission': '🚛',
    'maintenance': '🔧',
    'hors_service': '❌'
  }
  return icons[status] || '❓'
}

export function getVehicleCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'voiture_particuliere': 'Voiture particulière',
    'camionnette': 'Camionnette',
    'camion': 'Camion',
    'fourgon': 'Fourgon',
    'remorque': 'Remorque',
    'moto': 'Moto',
    'velo': 'Vélo'
  }
  return labels[category] || 'Inconnu'
}

export function getVehicleCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'voiture_particuliere': '🚗',
    'camionnette': '🚐',
    'camion': '🚛',
    'fourgon': '🚚',
    'remorque': '🚛',
    'moto': '🏍️',
    'velo': '🚲'
  }
  return icons[category] || '❓'
}

export function getFuelTypeLabel(fuelType: string | null): string {
  const labels: Record<string, string> = {
    'essence': 'Essence',
    'diesel': 'Diesel',
    'electrique': 'Électrique',
    'hybride': 'Hybride',
    'gpl': 'GPL'
  }
  return labels[fuelType || ''] || 'Non spécifié'
}

export function getFuelTypeIcon(fuelType: string | null): string {
  const icons: Record<string, string> = {
    'essence': '⛽',
    'diesel': '⛽',
    'electrique': '⚡',
    'hybride': '🔋',
    'gpl': '⛽'
  }
  return icons[fuelType || ''] || '❓'
}

export function formatMileage(mileage: number): string {
  return new Intl.NumberFormat('fr-FR').format(mileage) + ' km'
}

export function formatPayload(payload: number): string {
  return new Intl.NumberFormat('fr-FR').format(payload) + ' kg'
}

export function formatVolume(volume: number): string {
  return new Intl.NumberFormat('fr-FR').format(volume) + ' m³'
}

export function formatFuelCapacity(capacity: number): string {
  return new Intl.NumberFormat('fr-FR').format(capacity) + ' L'
}

export function isVehicleAvailable(vehicle: any): boolean {
  return vehicle.status === 'disponible'
}

export function isVehicleInMaintenance(vehicle: any): boolean {
  return vehicle.status === 'maintenance'
}

export function isVehicleExpired(vehicle: any, field: 'insurance' | 'registration'): boolean {
  const dateField = field === 'insurance' ? 'insurance_expiry_date' : 'registration_expiry_date'
  if (!vehicle[dateField]) return false
  
  const expiryDate = new Date(vehicle[dateField])
  const today = new Date()
  return expiryDate < today
}

export function getDaysUntilExpiry(vehicle: any, field: 'insurance' | 'registration'): number {
  const dateField = field === 'insurance' ? 'insurance_expiry_date' : 'registration_expiry_date'
  if (!vehicle[dateField]) return -1
  
  const expiryDate = new Date(vehicle[dateField])
  const today = new Date()
  const diffTime = expiryDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

export function getMaintenanceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'preventive': 'Maintenance préventive',
    'corrective': 'Maintenance corrective',
    'inspection': 'Inspection'
  }
  return labels[type] || type
}

export function getMaintenanceTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'preventive': 'bg-blue-100 text-blue-800',
    'corrective': 'bg-red-100 text-red-800',
    'inspection': 'bg-yellow-100 text-yellow-800'
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}
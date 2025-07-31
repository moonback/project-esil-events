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
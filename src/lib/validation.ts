import { z } from 'zod'

// Schémas de validation
export const missionSchema = z.object({
  type: z.enum(['Livraison jeux', 'Presta sono', 'DJ', 'Manutention', 'Déplacement']),
  title: z.string().min(1, 'Le titre est requis').max(100, 'Le titre ne peut pas dépasser 100 caractères'),
  description: z.string().optional(),
  date_start: z.string().min(1, 'La date de début est requise'),
  date_end: z.string().min(1, 'La date de fin est requise'),
  location: z.string().min(1, 'Le lieu est requis').max(200, 'Le lieu ne peut pas dépasser 200 caractères'),
  forfeit: z.number().positive('Le forfait doit être supérieur à 0').max(10000, 'Le forfait ne peut pas dépasser 10 000€')
})

export const userSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'technicien'])
})

export const availabilitySchema = z.object({
  start_time: z.string().min(1, 'L\'heure de début est requise'),
  end_time: z.string().min(1, 'L\'heure de fin est requise')
})

// Validation des dates
export const validateMissionDates = (dateStart: string, dateEnd: string) => {
  const start = new Date(dateStart)
  const end = new Date(dateEnd)
  const now = new Date()

  if (start >= end) {
    return { isValid: false, error: 'La date de fin doit être postérieure à la date de début' }
  }

  if (start < now) {
    return { isValid: false, error: 'La date de début ne peut pas être dans le passé' }
  }

  return { isValid: true, error: null }
}

// Validation des heures de disponibilité
export const validateAvailabilityTimes = (startTime: string, endTime: string) => {
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)

  if (start >= end) {
    return { isValid: false, error: 'L\'heure de fin doit être postérieure à l\'heure de début' }
  }

  return { isValid: true, error: null }
}

// Validation des conflits de planning
export const checkPlanningConflict = (
  newStart: Date,
  newEnd: Date,
  existingMissions: Array<{ date_start: string; date_end: string }>
) => {
  for (const mission of existingMissions) {
    const existingStart = new Date(mission.date_start)
    const existingEnd = new Date(mission.date_end)

    // Vérifier si les périodes se chevauchent
    if (newStart < existingEnd && newEnd > existingStart) {
      return {
        hasConflict: true,
        conflictingMission: mission
      }
    }
  }

  return { hasConflict: false, conflictingMission: null }
}

// Validation des emails
export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validation des mots de passe
export const validatePassword = (password: string) => {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const errors = []
  if (password.length < minLength) errors.push(`Au moins ${minLength} caractères`)
  if (!hasUpperCase) errors.push('Au moins une majuscule')
  if (!hasLowerCase) errors.push('Au moins une minuscule')
  if (!hasNumbers) errors.push('Au moins un chiffre')
  if (!hasSpecialChar) errors.push('Au moins un caractère spécial')

  return {
    isValid: errors.length === 0,
    errors,
    strength: Math.max(0, 5 - errors.length)
  }
}

// Validation des montants
export const validateAmount = (amount: number) => {
  if (amount <= 0) return { isValid: false, error: 'Le montant doit être supérieur à 0' }
  if (amount > 10000) return { isValid: false, error: 'Le montant ne peut pas dépasser 10 000€' }
  return { isValid: true, error: null }
}

// Validation des numéros de téléphone
export const validatePhone = (phone: string) => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/
  return phoneRegex.test(phone)
} 
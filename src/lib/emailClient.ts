import { Mission, User } from '../types/database'

interface EmailRequest {
  technician: {
    id: string
    name: string
    email: string
  }
  mission: {
    id: string
    title: string
    type: string
    location: string
    date_start: string
    date_end: string
    forfeit: number
    description?: string
  }
  adminName?: string
}

interface EmailResponse {
  success: boolean
  messageId?: string
  message?: string
  error?: string
  details?: string
}

export class EmailClient {
  private apiUrl: string

  constructor() {
    this.apiUrl = import.meta.env.VITE_APP_URL 
      ? `${import.meta.env.VITE_APP_URL}/api/send-email`
      : '/api/send-email'
  }

  /**
   * Envoie un email de notification d'assignation
   */
  async sendAssignmentNotification(
    technician: User,
    mission: Mission,
    adminName?: string
  ): Promise<EmailResponse> {
    try {
      if (!technician.email) {
        return {
          success: false,
          error: 'Aucune adresse email pour ce technicien'
        }
      }

      const requestData: EmailRequest = {
        technician: {
          id: technician.id,
          name: technician.name,
          email: technician.email
        },
        mission: {
          id: mission.id,
          title: mission.title,
          type: mission.type,
          location: mission.location,
          date_start: mission.date_start,
          date_end: mission.date_end,
          forfeit: mission.forfeit,
          description: mission.description
        },
        adminName
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result: EmailResponse = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Erreur lors de l\'envoi de l\'email',
          details: result.details
        }
      }

      return result
    } catch (error) {
      console.error('Erreur lors de l\'appel à l\'API email:', error)
      return {
        success: false,
        error: 'Erreur de connexion au serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }

  /**
   * Envoie des emails en lot pour plusieurs techniciens
   */
  async sendBulkAssignmentNotifications(
    technicians: User[],
    mission: Mission,
    adminName?: string
  ): Promise<{
    success: EmailResponse[]
    failed: Array<{ technician: User; error: string }>
  }> {
    const results = {
      success: [] as EmailResponse[],
      failed: [] as Array<{ technician: User; error: string }>
    }

    // Envoyer les emails en parallèle
    const promises = technicians.map(async (technician) => {
      try {
        const result = await this.sendAssignmentNotification(technician, mission, adminName)
        if (result.success) {
          results.success.push(result)
        } else {
          results.failed.push({
            technician,
            error: result.error || 'Erreur inconnue'
          })
        }
      } catch (error) {
        results.failed.push({
          technician,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        })
      }
    })

    await Promise.all(promises)
    return results
  }
}

// Instance singleton
export const emailClient = new EmailClient() 
import { supabase } from './supabase'

interface MissionAssignmentEmailData {
  technicianEmail: string
  technicianName: string
  missionTitle: string
  missionType: string
  missionLocation: string
  missionDateStart: string
  missionDateEnd: string
  missionForfeit: number
  missionDescription?: string
}

export class EmailService {
  /**
   * Envoie un email de notification d'assignation de mission
   */
  static async sendMissionAssignmentEmail(data: MissionAssignmentEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: response, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'mission_assignment',
          data
        }
      })

      if (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error)
        return { success: false, error: error.message }
      }

      if (response?.success) {
        return { success: true }
      } else {
        return { success: false, error: response?.error || 'Erreur inconnue lors de l\'envoi de l\'email' }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }
    }
  }

  /**
   * Envoie des emails de notification à plusieurs techniciens
   */
  static async sendBulkMissionAssignmentEmails(
    technicians: Array<{ id: string; email: string; name: string }>,
    mission: {
      title: string
      type: string
      location: string
      date_start: string
      date_end: string
      forfeit: number
      description?: string
    }
  ): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
    const results = await Promise.allSettled(
      technicians.map(technician =>
        this.sendMissionAssignmentEmail({
          technicianEmail: technician.email,
          technicianName: technician.name,
          missionTitle: mission.title,
          missionType: mission.type,
          missionLocation: mission.location,
          missionDateStart: mission.date_start,
          missionDateEnd: mission.date_end,
          missionForfeit: mission.forfeit,
          missionDescription: mission.description
        })
      )
    )

    const sent = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length

    const failed = results.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && !result.value.success)
    ).length

    const errors = results
      .map((result, index) => {
        if (result.status === 'rejected') {
          return `Technicien ${technicians[index].name}: ${result.reason}`
        }
        if (result.status === 'fulfilled' && !result.value.success) {
          return `Technicien ${technicians[index].name}: ${result.value.error}`
        }
        return null
      })
      .filter(Boolean) as string[]

    return {
      success: sent > 0,
      sent,
      failed,
      errors
    }
  }
} 
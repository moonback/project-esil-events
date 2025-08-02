import { supabase } from './supabase'
import { WhatsAppService } from './whatsapp'
import type { Mission, MissionAssignment, User } from '@/types/database'

interface ReminderData {
  assignment: MissionAssignment
  mission: Mission
  technician: User
}

export class WhatsAppRemindersService {
  /**
   * Envoie des rappels pour les missions en attente de réponse
   */
  static async sendPendingReminders(): Promise<void> {
    try {
      // Récupérer toutes les assignations en statut "proposé" depuis plus de 2 heures
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      
      const { data: pendingAssignments, error } = await supabase
        .from('mission_assignments')
        .select(`
          *,
          missions (*),
          users (*)
        `)
        .eq('status', 'proposé')
        .lt('assigned_at', twoHoursAgo)

      if (error) {
        console.error('Erreur lors de la récupération des assignations en attente:', error)
        return
      }

      if (!pendingAssignments || pendingAssignments.length === 0) {
        console.log('Aucune assignation en attente nécessitant un rappel')
        return
      }

      console.log(`${pendingAssignments.length} rappels à envoyer`)

      // Envoyer les rappels
      for (const assignment of pendingAssignments) {
        const mission = assignment.missions as Mission
        const technician = assignment.users as User

        if (!technician.phone) {
          console.warn(`Technicien ${technician.name} n'a pas de numéro de téléphone`)
          continue
        }

        try {
          const notificationData = {
            technicianName: technician.name,
            missionTitle: mission.title,
            missionType: mission.type,
            dateStart: mission.date_start,
            dateEnd: mission.date_end,
            location: mission.location,
            forfeit: mission.forfeit,
            requiredPeople: mission.required_people,
            description: mission.description || undefined
          }

          const success = await WhatsAppService.sendMissionReminder(
            technician.phone,
            notificationData
          )

          if (success) {
            console.log(`Rappel envoyé avec succès à ${technician.name}`)
          } else {
            console.error(`Échec de l'envoi du rappel à ${technician.name}`)
          }
        } catch (error) {
          console.error(`Erreur lors de l'envoi du rappel à ${technician.name}:`, error)
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des rappels:', error)
    }
  }

  /**
   * Envoie des rappels pour les missions en attente depuis plus de 24h
   */
  static async sendUrgentReminders(): Promise<void> {
    try {
      // Récupérer toutes les assignations en statut "proposé" depuis plus de 24 heures
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      
      const { data: urgentAssignments, error } = await supabase
        .from('mission_assignments')
        .select(`
          *,
          missions (*),
          users (*)
        `)
        .eq('status', 'proposé')
        .lt('assigned_at', oneDayAgo)

      if (error) {
        console.error('Erreur lors de la récupération des assignations urgentes:', error)
        return
      }

      if (!urgentAssignments || urgentAssignments.length === 0) {
        console.log('Aucune assignation urgente nécessitant un rappel')
        return
      }

      console.log(`${urgentAssignments.length} rappels urgents à envoyer`)

      // Envoyer les rappels urgents
      for (const assignment of urgentAssignments) {
        const mission = assignment.missions as Mission
        const technician = assignment.users as User

        if (!technician.phone) {
          console.warn(`Technicien ${technician.name} n'a pas de numéro de téléphone`)
          continue
        }

        try {
          const notificationData = {
            technicianName: technician.name,
            missionTitle: mission.title,
            missionType: mission.type,
            dateStart: mission.date_start,
            dateEnd: mission.date_end,
            location: mission.location,
            forfeit: mission.forfeit,
            requiredPeople: mission.required_people,
            description: mission.description || undefined
          }

          const success = await WhatsAppService.sendMissionReminder(
            technician.phone,
            notificationData
          )

          if (success) {
            console.log(`Rappel urgent envoyé avec succès à ${technician.name}`)
          } else {
            console.error(`Échec de l'envoi du rappel urgent à ${technician.name}`)
          }
        } catch (error) {
          console.error(`Erreur lors de l'envoi du rappel urgent à ${technician.name}:`, error)
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des rappels urgents:', error)
    }
  }

  /**
   * Vérifie et envoie tous les rappels nécessaires
   */
  static async checkAndSendReminders(): Promise<void> {
    console.log('Vérification des rappels WhatsApp...')
    
    // Envoyer les rappels normaux (après 2h)
    await this.sendPendingReminders()
    
    // Envoyer les rappels urgents (après 24h)
    await this.sendUrgentReminders()
    
    console.log('Vérification des rappels terminée')
  }

  /**
   * Démarre le service de rappels automatiques
   */
  static startAutomaticReminders(): void {
    // Vérifier toutes les 30 minutes
    const interval = setInterval(() => {
      this.checkAndSendReminders()
    }, 30 * 60 * 1000) // 30 minutes

    // Vérifier immédiatement au démarrage
    this.checkAndSendReminders()

    // Retourner la fonction de nettoyage
    return () => clearInterval(interval)
  }

  /**
   * Obtient les statistiques des rappels
   */
  static async getReminderStats(): Promise<{
    pendingCount: number
    urgentCount: number
    totalPending: number
  }> {
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      // Compter les assignations en attente depuis plus de 2h
      const { count: pendingCount } = await supabase
        .from('mission_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'proposé')
        .lt('assigned_at', twoHoursAgo)

      // Compter les assignations en attente depuis plus de 24h
      const { count: urgentCount } = await supabase
        .from('mission_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'proposé')
        .lt('assigned_at', oneDayAgo)

      // Compter toutes les assignations en attente
      const { count: totalPending } = await supabase
        .from('mission_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'proposé')

      return {
        pendingCount: pendingCount || 0,
        urgentCount: urgentCount || 0,
        totalPending: totalPending || 0
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de rappels:', error)
      return {
        pendingCount: 0,
        urgentCount: 0,
        totalPending: 0
      }
    }
  }
} 
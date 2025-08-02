import { useState, useCallback } from 'react'
import { supabase } from './supabase'
import { whatsappService } from './whatsappService'
import { useToast } from './useToast'
import type { Mission, User, WhatsAppNotification } from '@/types/database'

interface NotificationTemplate {
  missionTitle: string
  missionType: string
  missionLocation: string
  missionStartDate: string
  missionEndDate: string
  missionForfeit: number
  missionId: string
  technicianId: string
  adminName?: string
}

export function useWhatsAppNotifications() {
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<WhatsAppNotification[]>([])
  const { showToast } = useToast()

  /**
   * Envoie une notification WhatsApp pour une nouvelle assignation
   */
  const sendAssignmentNotification = useCallback(async (
    technician: User,
    mission: Mission,
    adminName?: string
  ): Promise<boolean> => {
    if (!technician.phone) {
      showToast('Erreur', 'Le technicien n\'a pas de numéro de téléphone enregistré', 'error')
      return false
    }

    setLoading(true)
    try {
      const template: NotificationTemplate = {
        missionTitle: mission.title,
        missionType: mission.type,
        missionLocation: mission.location,
        missionStartDate: new Date(mission.date_start).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        missionEndDate: new Date(mission.date_end).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        missionForfeit: mission.forfeit,
        missionId: mission.id,
        technicianId: technician.id,
        adminName
      }

      const success = await whatsappService.sendMissionAssignmentNotification(
        technician.phone,
        template
      )

      if (success) {
        showToast(
          'Notification envoyée',
          `Notification WhatsApp envoyée à ${technician.name}`,
          'success'
        )
      } else {
        showToast(
          'Erreur',
          `Échec de l'envoi de la notification à ${technician.name}`,
          'error'
        )
      }

      return success
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error)
      showToast(
        'Erreur',
        'Erreur lors de l\'envoi de la notification WhatsApp',
        'error'
      )
      return false
    } finally {
      setLoading(false)
    }
  }, [showToast])

  /**
   * Envoie des notifications à plusieurs techniciens
   */
  const sendBulkAssignmentNotifications = useCallback(async (
    technicians: User[],
    mission: Mission,
    adminName?: string
  ): Promise<{ success: number; failed: number }> => {
    setLoading(true)
    let successCount = 0
    let failedCount = 0

    try {
      const promises = technicians.map(technician => 
        sendAssignmentNotification(technician, mission, adminName)
      )

      const results = await Promise.allSettled(promises)
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          successCount++
        } else {
          failedCount++
        }
      })

      if (successCount > 0) {
        showToast(
          'Notifications envoyées',
          `${successCount} notification(s) envoyée(s) avec succès${failedCount > 0 ? `, ${failedCount} échec(s)` : ''}`,
          'success'
        )
      } else {
        showToast(
          'Erreur',
          'Aucune notification n\'a pu être envoyée',
          'error'
        )
      }

      return { success: successCount, failed: failedCount }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications:', error)
      showToast(
        'Erreur',
        'Erreur lors de l\'envoi des notifications WhatsApp',
        'error'
      )
      return { success: 0, failed: technicians.length }
    } finally {
      setLoading(false)
    }
  }, [sendAssignmentNotification, showToast])

  /**
   * Récupère l'historique des notifications
   */
  const fetchNotifications = useCallback(async (filters?: {
    technicianId?: string
    missionId?: string
    status?: 'sent' | 'failed' | 'delivered'
    limit?: number
  }) => {
    try {
      let query = supabase
        .from('whatsapp_notifications')
        .select('*')
        .order('sent_at', { ascending: false })

      if (filters?.technicianId) {
        query = query.eq('technician_id', filters.technicianId)
      }

      if (filters?.missionId) {
        query = query.eq('mission_id', filters.missionId)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setNotifications(data || [])
      return data
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error)
      showToast(
        'Erreur',
        'Erreur lors de la récupération de l\'historique des notifications',
        'error'
      )
      return []
    }
  }, [showToast])

  /**
   * Vérifie le statut de livraison d'une notification
   */
  const checkNotificationStatus = useCallback(async (messageId: string): Promise<'sent' | 'delivered' | 'failed'> => {
    try {
      const status = await whatsappService.checkNotificationStatus(messageId)
      
      // Mettre à jour le statut dans la base de données si nécessaire
      if (status === 'delivered') {
        await supabase
          .from('whatsapp_notifications')
          .update({ 
            status: 'delivered',
            delivered_at: new Date().toISOString()
          })
          .eq('whatsapp_message_id', messageId)
      }

      return status
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error)
      return 'failed'
    }
  }, [])

  /**
   * Envoie un rappel pour une mission
   */
  const sendReminderNotification = useCallback(async (
    technician: User,
    mission: Mission
  ): Promise<boolean> => {
    if (!technician.phone) {
      showToast('Erreur', 'Le technicien n\'a pas de numéro de téléphone enregistré', 'error')
      return false
    }

    setLoading(true)
    try {
      const template: NotificationTemplate = {
        missionTitle: mission.title,
        missionType: mission.type,
        missionLocation: mission.location,
        missionStartDate: new Date(mission.date_start).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        missionEndDate: new Date(mission.date_end).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        missionForfeit: mission.forfeit,
        missionId: mission.id,
        technicianId: technician.id
      }

      const success = await whatsappService.sendMissionReminderNotification(
        technician.phone,
        template
      )

      if (success) {
        showToast(
          'Rappel envoyé',
          `Rappel WhatsApp envoyé à ${technician.name}`,
          'success'
        )
      } else {
        showToast(
          'Erreur',
          `Échec de l'envoi du rappel à ${technician.name}`,
          'error'
        )
      }

      return success
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel:', error)
      showToast(
        'Erreur',
        'Erreur lors de l\'envoi du rappel WhatsApp',
        'error'
      )
      return false
    } finally {
      setLoading(false)
    }
  }, [showToast])

  return {
    loading,
    notifications,
    sendAssignmentNotification,
    sendBulkAssignmentNotifications,
    fetchNotifications,
    checkNotificationStatus,
    sendReminderNotification
  }
} 
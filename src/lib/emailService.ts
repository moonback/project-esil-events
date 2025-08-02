import { supabase } from './supabase'

export interface EmailNotificationData {
  type: 'mission_assigned' | 'mission_accepted' | 'mission_rejected' | 'payment_received'
  data: {
    technicianId: string
    missionId: string
    [key: string]: any
  }
}

export interface EmailResponse {
  success: boolean
  message: string
}

/**
 * Service pour envoyer des notifications email via Supabase Edge Functions
 */
export class EmailService {
  private static async callEmailFunction(notification: EmailNotificationData): Promise<EmailResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('email-service', {
        body: notification
      })

      if (error) {
        console.error('Erreur lors de l\'appel de la fonction email:', error)
        return {
          success: false,
          message: error.message || 'Erreur lors de l\'envoi de l\'email'
        }
      }

      return data as EmailResponse
    } catch (error) {
      console.error('Erreur dans EmailService:', error)
      return {
        success: false,
        message: 'Erreur de connexion au service email'
      }
    }
  }

  /**
   * Envoyer une notification de mission assignée
   */
  static async sendMissionAssignmentNotification(
    technicianId: string,
    missionId: string
  ): Promise<EmailResponse> {
    return this.callEmailFunction({
      type: 'mission_assigned',
      data: {
        technicianId,
        missionId
      }
    })
  }

  /**
   * Envoyer une notification de mission acceptée
   */
  static async sendMissionAcceptedNotification(
    technicianId: string,
    missionId: string
  ): Promise<EmailResponse> {
    return this.callEmailFunction({
      type: 'mission_accepted',
      data: {
        technicianId,
        missionId
      }
    })
  }

  /**
   * Envoyer une notification de mission refusée
   */
  static async sendMissionRejectedNotification(
    technicianId: string,
    missionId: string
  ): Promise<EmailResponse> {
    return this.callEmailFunction({
      type: 'mission_rejected',
      data: {
        technicianId,
        missionId
      }
    })
  }

  /**
   * Envoyer une notification de paiement reçu
   */
  static async sendPaymentReceivedNotification(
    technicianId: string,
    missionId: string,
    amount: number
  ): Promise<EmailResponse> {
    return this.callEmailFunction({
      type: 'payment_received',
      data: {
        technicianId,
        missionId,
        amount
      }
    })
  }
}

/**
 * Hook pour utiliser le service email dans les composants React
 */
export const useEmailService = () => {
  const sendNotification = async (
    type: EmailNotificationData['type'],
    data: EmailNotificationData['data']
  ): Promise<EmailResponse> => {
    return EmailService.callEmailFunction({ type, data })
  }

  return {
    sendMissionAssignmentNotification: EmailService.sendMissionAssignmentNotification,
    sendMissionAcceptedNotification: EmailService.sendMissionAcceptedNotification,
    sendMissionRejectedNotification: EmailService.sendMissionRejectedNotification,
    sendPaymentReceivedNotification: EmailService.sendPaymentReceivedNotification,
    sendNotification
  }
} 
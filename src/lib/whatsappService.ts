import { supabase } from './supabase'

interface WhatsAppMessage {
  to: string
  message: string
  missionId: string
  technicianId: string
}

interface NotificationTemplate {
  missionTitle: string
  missionType: string
  missionLocation: string
  missionStartDate: string
  missionEndDate: string
  missionForfeit: number
  adminName?: string
}

export class WhatsAppService {
  private static instance: WhatsAppService
  private apiUrl: string
  private apiToken: string

  constructor() {
    // Configuration depuis les variables d'environnement
    this.apiUrl = import.meta.env.VITE_WHATSAPP_API_URL || ''
    this.apiToken = import.meta.env.VITE_WHATSAPP_API_TOKEN || ''
  }

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService()
    }
    return WhatsAppService.instance
  }

  /**
   * Envoie une notification WhatsApp pour une nouvelle assignation de mission
   */
  async sendMissionAssignmentNotification(
    technicianPhone: string,
    template: NotificationTemplate
  ): Promise<boolean> {
    try {
      const message = this.createAssignmentMessage(template)
      
      const response = await fetch(`${this.apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(technicianPhone),
          type: 'template',
          template: {
            name: 'mission_assignment',
            language: {
              code: 'fr'
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: template.missionTitle
                  },
                  {
                    type: 'text',
                    text: template.missionType
                  },
                  {
                    type: 'text',
                    text: template.missionLocation
                  },
                  {
                    type: 'text',
                    text: template.missionStartDate
                  },
                  {
                    type: 'text',
                    text: template.missionEndDate
                  },
                  {
                    type: 'text',
                    text: `${template.missionForfeit}€`
                  }
                ]
              }
            ]
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur WhatsApp API: ${response.status}`)
      }

      const result = await response.json()
      
      // Enregistrer la notification dans la base de données
      await this.saveNotification({
        technician_phone: technicianPhone,
        message: message,
        mission_id: template.missionId,
        technician_id: template.technicianId,
        status: 'sent',
        whatsapp_message_id: result.messages?.[0]?.id
      })

      return true
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification WhatsApp:', error)
      
      // Enregistrer l'échec dans la base de données
      await this.saveNotification({
        technician_phone: technicianPhone,
        message: this.createAssignmentMessage(template),
        mission_id: template.missionId,
        technician_id: template.technicianId,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Erreur inconnue'
      })

      return false
    }
  }

  /**
   * Envoie une notification de rappel pour une mission
   */
  async sendMissionReminderNotification(
    technicianPhone: string,
    template: NotificationTemplate
  ): Promise<boolean> {
    try {
      const message = this.createReminderMessage(template)
      
      const response = await fetch(`${this.apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(technicianPhone),
          type: 'template',
          template: {
            name: 'mission_reminder',
            language: {
              code: 'fr'
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: template.missionTitle
                  },
                  {
                    type: 'text',
                    text: template.missionLocation
                  },
                  {
                    type: 'text',
                    text: template.missionStartDate
                  }
                ]
              }
            ]
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur WhatsApp API: ${response.status}`)
      }

      return true
    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel WhatsApp:', error)
      return false
    }
  }

  /**
   * Crée le message pour une nouvelle assignation
   */
  private createAssignmentMessage(template: NotificationTemplate): string {
    return `🎯 Nouvelle mission assignée !

📋 Mission: ${template.missionTitle}
🏷️ Type: ${template.missionType}
📍 Lieu: ${template.missionLocation}
📅 Début: ${template.missionStartDate}
📅 Fin: ${template.missionEndDate}
💰 Rémunération: ${template.missionForfeit}€

Connectez-vous à votre espace technicien pour accepter ou refuser cette mission.

Merci de votre confiance !`
  }

  /**
   * Crée le message de rappel
   */
  private createReminderMessage(template: NotificationTemplate): string {
    return `⏰ Rappel de mission !

📋 Mission: ${template.missionTitle}
📍 Lieu: ${template.missionLocation}
📅 Date: ${template.missionStartDate}

N'oubliez pas de vous présenter à l'heure prévue.

Bon travail !`
  }

  /**
   * Formate le numéro de téléphone pour WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    // Supprimer tous les caractères non numériques
    const cleaned = phone.replace(/\D/g, '')
    
    // Ajouter l'indicatif pays si nécessaire
    if (cleaned.startsWith('33')) {
      return cleaned
    } else if (cleaned.startsWith('0')) {
      return '33' + cleaned.substring(1)
    } else {
      return '33' + cleaned
    }
  }

  /**
   * Enregistre la notification dans la base de données
   */
  private async saveNotification(notification: {
    technician_phone: string
    message: string
    mission_id: string
    technician_id: string
    status: 'sent' | 'failed'
    whatsapp_message_id?: string
    error_message?: string
  }) {
    try {
      const { error } = await supabase
        .from('whatsapp_notifications')
        .insert({
          technician_phone: notification.technician_phone,
          message: notification.message,
          mission_id: notification.mission_id,
          technician_id: notification.technician_id,
          status: notification.status,
          whatsapp_message_id: notification.whatsapp_message_id,
          error_message: notification.error_message,
          sent_at: new Date().toISOString()
        })

      if (error) {
        console.error('Erreur lors de l\'enregistrement de la notification:', error)
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la notification:', error)
    }
  }

  /**
   * Vérifie le statut d'une notification
   */
  async checkNotificationStatus(messageId: string): Promise<'sent' | 'delivered' | 'failed'> {
    try {
      const response = await fetch(`${this.apiUrl}/messages/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        }
      })

      if (!response.ok) {
        throw new Error(`Erreur lors de la vérification: ${response.status}`)
      }

      const result = await response.json()
      return result.status
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error)
      return 'failed'
    }
  }
}

export const whatsappService = WhatsAppService.getInstance() 
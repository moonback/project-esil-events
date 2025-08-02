interface WhatsAppMessage {
  to: string
  message: string
  type: 'text' | 'template'
  template?: {
    name: string
    language: string
    components?: any[]
  }
}

interface MissionNotificationData {
  technicianName: string
  missionTitle: string
  missionType: string
  dateStart: string
  dateEnd: string
  location: string
  forfeit: number
  requiredPeople: number
  description?: string
}

export class WhatsAppService {
  private static readonly API_URL = 'https://graph.facebook.com/v18.0'
  private static readonly PHONE_NUMBER_ID = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID
  private static readonly ACCESS_TOKEN = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN

  /**
   * Envoie un message WhatsApp à un technicien pour une mission proposée
   */
  static async sendMissionProposal(
    phoneNumber: string,
    data: MissionNotificationData
  ): Promise<boolean> {
    try {
      // Formater le numéro de téléphone (supprimer les espaces et ajouter l'indicatif si nécessaire)
      const formattedPhone = this.formatPhoneNumber(phoneNumber)
      
      // Créer le message
      const message = this.createMissionProposalMessage(data)
      
      // Envoyer le message
      const response = await fetch(`${this.API_URL}/${this.PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: message
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Erreur WhatsApp:', error)
        return false
      }

      console.log('Message WhatsApp envoyé avec succès à', formattedPhone)
      return true

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message WhatsApp:', error)
      return false
    }
  }

  /**
   * Envoie un message de confirmation quand un technicien accepte une mission
   */
  static async sendMissionAccepted(
    phoneNumber: string,
    data: MissionNotificationData
  ): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber)
      
      const message = `✅ Mission acceptée !

🎯 ${data.missionTitle}
📅 ${this.formatDate(data.dateStart)} - ${this.formatDate(data.dateEnd)}
📍 ${data.location}
💰 ${data.forfeit}€
👥 ${data.requiredPeople} personne(s) requise(s)

Merci pour votre engagement !`

      const response = await fetch(`${this.API_URL}/${this.PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: message
          }
        })
      })

      return response.ok

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la confirmation WhatsApp:', error)
      return false
    }
  }

  /**
   * Envoie un message de rappel pour les missions en attente
   */
  static async sendMissionReminder(
    phoneNumber: string,
    data: MissionNotificationData
  ): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber)
      
      const message = `⏰ Rappel - Mission en attente

🎯 ${data.missionTitle}
📅 ${this.formatDate(data.dateStart)} - ${this.formatDate(data.dateEnd)}
📍 ${data.location}
💰 ${data.forfeit}€

Veuillez répondre à cette proposition dans les plus brefs délais.
Merci !`

      const response = await fetch(`${this.API_URL}/${this.PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: message
          }
        })
      })

      return response.ok

    } catch (error) {
      console.error('Erreur lors de l\'envoi du rappel WhatsApp:', error)
      return false
    }
  }

  /**
   * Crée le message de proposition de mission
   */
  private static createMissionProposalMessage(data: MissionNotificationData): string {
    const description = data.description ? `\n📝 ${data.description}` : ''
    
    return `🎯 Nouvelle mission proposée !

Bonjour ${data.technicianName},

Une nouvelle mission vous a été proposée :

🎯 ${data.missionTitle}
📅 ${this.formatDate(data.dateStart)} - ${this.formatDate(data.dateEnd)}
📍 ${data.location}
💰 ${data.forfeit}€
👥 ${data.requiredPeople} personne(s) requise(s)${description}

Veuillez répondre rapidement pour accepter ou refuser cette mission.

Merci !`
  }

  /**
   * Formate un numéro de téléphone pour WhatsApp
   */
  private static formatPhoneNumber(phone: string): string {
    // Supprimer tous les caractères non numériques
    let cleaned = phone.replace(/\D/g, '')
    
    // Ajouter l'indicatif français si absent
    if (cleaned.startsWith('0')) {
      cleaned = '33' + cleaned.substring(1)
    }
    
    // Ajouter le préfixe WhatsApp
    return cleaned
  }

  /**
   * Formate une date pour l'affichage
   */
  private static formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Vérifie si le service WhatsApp est configuré
   */
  static isConfigured(): boolean {
    return !!(this.PHONE_NUMBER_ID && this.ACCESS_TOKEN)
  }

  /**
   * Teste la connexion WhatsApp
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_URL}/${this.PHONE_NUMBER_ID}`, {
        headers: {
          'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
        }
      })
      
      return response.ok
    } catch (error) {
      console.error('Erreur de test de connexion WhatsApp:', error)
      return false
    }
  }
} 
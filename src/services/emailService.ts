import { supabase } from '../lib/supabase'
import { User, Mission, MissionAssignment } from '../types/database'

// Interfaces pour les templates d'email
interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface EmailData {
  to: string
  template: EmailTemplate
  attachments?: any[]
}

// Service d'email principal
export class EmailService {
  private static instance: EmailService
  private isConnected: boolean = false

  private constructor() {
    this.verifyConnection()
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  // Vérification de la connexion SMTP
  private async verifyConnection(): Promise<void> {
    try {
      // Test de connexion via l'API Supabase
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          emailData: {
            to: 'test@example.com',
            subject: 'Test de connexion',
            html: '<p>Test de connexion SMTP</p>',
            text: 'Test de connexion SMTP'
          }
        }
      })

      if (error) {
        throw error
      }

      this.isConnected = true
      console.log('✅ Connexion SMTP établie')
    } catch (error) {
      this.isConnected = false
      console.error('❌ Erreur de connexion SMTP:', error)
    }
  }

  // Obtenir le statut de connexion
  public getConnectionStatus(): boolean {
    return this.isConnected
  }

  // Envoyer un email
  public async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          emailData: {
            to: emailData.to,
            subject: emailData.template.subject,
            html: emailData.template.html,
            text: emailData.template.text,
            from: import.meta.env.VITE_SMTP_FROM || 'client@dresscodeia.fr',
            fromName: import.meta.env.VITE_SMTP_FROM_NAME || 'Esil-events'
          }
        }
      })

      if (error) {
        throw error
      }

      console.log('✅ Email envoyé:', data?.messageId)
      return true
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
      return false
    }
  }

  // Templates d'emails statiques
  static generateMissionAssignmentEmail(technician: User, mission: Mission, assignment: MissionAssignment): EmailTemplate {
    const missionDate = new Date(mission.date_start).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return {
      subject: `Nouvelle mission assignée - ${mission.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Nouvelle mission assignée</h2>
          <p>Bonjour ${technician.name},</p>
          <p>Une nouvelle mission vous a été assignée :</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">${mission.title}</h3>
            <p><strong>Date :</strong> ${missionDate}</p>
            <p><strong>Lieu :</strong> ${mission.location}</p>
            <p><strong>Description :</strong> ${mission.description}</p>
            <p><strong>Rémunération :</strong> ${mission.forfeit}€</p>
          </div>
          
          <p>Veuillez vous connecter à votre espace technicien pour accepter ou refuser cette mission.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              Cet email a été envoyé automatiquement par le système Esil-events.
            </p>
          </div>
        </div>
      `,
      text: `
Nouvelle mission assignée

Bonjour ${technician.name},

Une nouvelle mission vous a été assignée :

${mission.title}
Date : ${missionDate}
Lieu : ${mission.location}
Description : ${mission.description}
Rémunération : ${mission.forfeit}€

Veuillez vous connecter à votre espace technicien pour accepter ou refuser cette mission.

---
Cet email a été envoyé automatiquement par le système Esil-events.
      `
    }
  }

  static generateMissionAcceptedEmail(technician: User, mission: Mission): EmailTemplate {
    const missionDate = new Date(mission.date_start).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return {
      subject: `Mission acceptée - ${mission.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">Mission acceptée</h2>
          <p>Bonjour ${technician.name},</p>
          <p>Votre acceptation de la mission a été enregistrée avec succès :</p>
          
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="color: #1e293b; margin-top: 0;">${mission.title}</h3>
            <p><strong>Date :</strong> ${missionDate}</p>
            <p><strong>Lieu :</strong> ${mission.location}</p>
            <p><strong>Rémunération :</strong> ${mission.forfeit}€</p>
          </div>
          
          <p>La mission est maintenant confirmée dans votre agenda. N'oubliez pas de vous présenter à l'heure prévue.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              Cet email a été envoyé automatiquement par le système Esil-events.
            </p>
          </div>
        </div>
      `,
      text: `
Mission acceptée

Bonjour ${technician.name},

Votre acceptation de la mission a été enregistrée avec succès :

${mission.title}
Date : ${missionDate}
Lieu : ${mission.location}
Rémunération : ${mission.forfeit}€

La mission est maintenant confirmée dans votre agenda. N'oubliez pas de vous présenter à l'heure prévue.

---
Cet email a été envoyé automatiquement par le système Esil-events.
      `
    }
  }

  static generateMissionRejectedEmail(technician: User, mission: Mission): EmailTemplate {
    const missionDate = new Date(mission.date_start).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return {
      subject: `Mission refusée - ${mission.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">Mission refusée</h2>
          <p>Bonjour ${technician.name},</p>
          <p>Votre refus de la mission a été enregistré :</p>
          
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="color: #1e293b; margin-top: 0;">${mission.title}</h3>
            <p><strong>Date :</strong> ${missionDate}</p>
            <p><strong>Lieu :</strong> ${mission.location}</p>
            <p><strong>Rémunération :</strong> ${mission.forfeit}€</p>
          </div>
          
          <p>Cette mission a été retirée de votre agenda. D'autres missions vous seront proposées selon vos disponibilités.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              Cet email a été envoyé automatiquement par le système Esil-events.
            </p>
          </div>
        </div>
      `,
      text: `
Mission refusée

Bonjour ${technician.name},

Votre refus de la mission a été enregistré :

${mission.title}
Date : ${missionDate}
Lieu : ${mission.location}
Rémunération : ${mission.forfeit}€

Cette mission a été retirée de votre agenda. D'autres missions vous seront proposées selon vos disponibilités.

---
Cet email a été envoyé automatiquement par le système Esil-events.
      `
    }
  }

  static generatePaymentCreatedEmail(technician: User, amount: number, missions: Mission[]): EmailTemplate {
    const missionsList = missions.map(mission => 
      `- ${mission.title} (${new Date(mission.date_start).toLocaleDateString('fr-FR')}) : ${mission.forfeit}€`
    ).join('\n')

    return {
      subject: `Nouveau paiement créé - ${amount}€`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">Nouveau paiement créé</h2>
          <p>Bonjour ${technician.name},</p>
          <p>Un nouveau paiement a été créé pour vos missions :</p>
          
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="color: #1e293b; margin-top: 0;">Détails du paiement</h3>
            <p><strong>Montant total :</strong> ${amount}€</p>
            <p><strong>Nombre de missions :</strong> ${missions.length}</p>
            
            <div style="margin-top: 15px;">
              <h4 style="color: #374151; margin-bottom: 10px;">Missions incluses :</h4>
              <ul style="margin: 0; padding-left: 20px;">
                ${missions.map(mission => 
                  `<li>${mission.title} (${new Date(mission.date_start).toLocaleDateString('fr-FR')}) : ${mission.forfeit}€</li>`
                ).join('')}
              </ul>
            </div>
          </div>
          
          <p>Le paiement sera traité selon les modalités définies dans votre contrat.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              Cet email a été envoyé automatiquement par le système Esil-events.
            </p>
          </div>
        </div>
      `,
      text: `
Nouveau paiement créé

Bonjour ${technician.name},

Un nouveau paiement a été créé pour vos missions :

Détails du paiement
Montant total : ${amount}€
Nombre de missions : ${missions.length}

Missions incluses :
${missionsList}

Le paiement sera traité selon les modalités définies dans votre contrat.

---
Cet email a été envoyé automatiquement par le système Esil-events.
      `
    }
  }
}

// Hook pour utiliser le service d'email
export const useEmailService = () => {
  const emailService = EmailService.getInstance()
  
  return {
    sendEmail: emailService.sendEmail.bind(emailService),
    isConnected: emailService.getConnectionStatus(),
    
    // Méthodes spécialisées
    sendMissionAssignment: async (technician: User, mission: Mission, assignment: MissionAssignment) => {
      if (!technician.email) {
        console.error('❌ Impossible d\'envoyer l\'email: adresse email manquante')
        return false
      }
      const template = EmailService.generateMissionAssignmentEmail(technician, mission, assignment)
      return emailService.sendEmail({
        to: technician.email,
        template
      })
    },

    sendMissionAccepted: async (technician: User, mission: Mission) => {
      if (!technician.email) {
        console.error('❌ Impossible d\'envoyer l\'email: adresse email manquante')
        return false
      }
      const template = EmailService.generateMissionAcceptedEmail(technician, mission)
      return emailService.sendEmail({
        to: technician.email,
        template
      })
    },

    sendMissionRejected: async (technician: User, mission: Mission) => {
      if (!technician.email) {
        console.error('❌ Impossible d\'envoyer l\'email: adresse email manquante')
        return false
      }
      const template = EmailService.generateMissionRejectedEmail(technician, mission)
      return emailService.sendEmail({
        to: technician.email,
        template
      })
    },

    sendPaymentCreated: async (technician: User, amount: number, missions: Mission[]) => {
      if (!technician.email) {
        console.error('❌ Impossible d\'envoyer l\'email: adresse email manquante')
        return false
      }
      const template = EmailService.generatePaymentCreatedEmail(technician, amount, missions)
      return emailService.sendEmail({
        to: technician.email,
        template
      })
    }
  }
} 
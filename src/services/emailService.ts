import nodemailer from 'nodemailer'
import { User, Mission, MissionAssignment } from '../types/database'

// Types pour les emails
export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface EmailData {
  to: string
  template: EmailTemplate
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

// Configuration SMTP
const smtpConfig = {
  host: import.meta.env.VITE_SMTP_HOST || 'mail.dresscodeia.fr',
  port: parseInt(import.meta.env.VITE_SMTP_PORT || '465'),
  secure: true, // true pour le port 465, false pour les autres ports
  auth: {
    user: import.meta.env.VITE_SMTP_USER || 'client@dresscodeia.fr',
    pass: import.meta.env.VITE_SMTP_PASSWORD || ''
  }
}

// Création du transporteur SMTP
const transporter = nodemailer.createTransporter(smtpConfig)

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
      await transporter.verify()
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
    if (!this.isConnected) {
      console.error('❌ Impossible d\'envoyer l\'email: SMTP non connecté')
      return false
    }

    try {
      const mailOptions = {
        from: `"${import.meta.env.VITE_SMTP_FROM_NAME || 'Esil-events'}" <${import.meta.env.VITE_SMTP_FROM || 'client@dresscodeia.fr'}>`,
        to: emailData.to,
        subject: emailData.template.subject,
        text: emailData.template.text,
        html: emailData.template.html,
        attachments: emailData.attachments
      }

      const info = await transporter.sendMail(mailOptions)
      console.log('✅ Email envoyé:', info.messageId)
      return true
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
      return false
    }
  }

  // Templates d'emails pour les différentes notifications
  public static getMissionAssignmentTemplate(
    technician: User,
    mission: Mission,
    assignment: MissionAssignment
  ): EmailTemplate {
    const missionDate = new Date(mission.date_start).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return {
      subject: `Nouvelle mission proposée - ${mission.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Esil-events</h1>
            <p style="margin: 10px 0 0 0;">Nouvelle mission proposée</p>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333;">Bonjour ${technician.name},</h2>
            
            <p>Une nouvelle mission vous a été proposée :</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #667eea; margin-top: 0;">${mission.title}</h3>
              <p><strong>Type :</strong> ${mission.type}</p>
              <p><strong>Date :</strong> ${missionDate}</p>
              <p><strong>Lieu :</strong> ${mission.location}</p>
              <p><strong>Forfait :</strong> ${mission.forfeit}€</p>
              ${mission.description ? `<p><strong>Description :</strong> ${mission.description}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/technician" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Voir les détails
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Connectez-vous à votre espace technicien pour accepter ou refuser cette mission.
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>Cet email a été envoyé automatiquement par le système Esil-events</p>
            <p>Statut de connexion: ${this.isConnected ? 'Connecté' : 'Non connecté'}</p>
          </div>
        </div>
      `,
      text: `
        Nouvelle mission proposée - ${mission.title}
        
        Bonjour ${technician.name},
        
        Une nouvelle mission vous a été proposée :
        
        Titre: ${mission.title}
        Type: ${mission.type}
        Date: ${missionDate}
        Lieu: ${mission.location}
        Forfait: ${mission.forfeit}€
        ${mission.description ? `Description: ${mission.description}` : ''}
        
        Connectez-vous à votre espace technicien pour accepter ou refuser cette mission.
        
        Statut de connexion: ${this.isConnected ? 'Connecté' : 'Non connecté'}
      `
    }
  }

  public static getMissionAcceptedTemplate(
    technician: User,
    mission: Mission
  ): EmailTemplate {
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Esil-events</h1>
            <p style="margin: 10px 0 0 0;">Mission acceptée</p>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333;">Bonjour ${technician.name},</h2>
            
            <p>Votre mission a été acceptée avec succès :</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #4facfe;">
              <h3 style="color: #4facfe; margin-top: 0;">${mission.title}</h3>
              <p><strong>Type :</strong> ${mission.type}</p>
              <p><strong>Date :</strong> ${missionDate}</p>
              <p><strong>Lieu :</strong> ${mission.location}</p>
              <p><strong>Forfait :</strong> ${mission.forfeit}€</p>
              ${mission.description ? `<p><strong>Description :</strong> ${mission.description}</p>` : ''}
            </div>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #2d5a2d;">
                ✅ Mission confirmée - Préparez-vous pour cette intervention !
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              N'oubliez pas de consulter les détails de la mission dans votre espace technicien.
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>Cet email a été envoyé automatiquement par le système Esil-events</p>
            <p>Statut de connexion: ${this.isConnected ? 'Connecté' : 'Non connecté'}</p>
          </div>
        </div>
      `,
      text: `
        Mission acceptée - ${mission.title}
        
        Bonjour ${technician.name},
        
        Votre mission a été acceptée avec succès :
        
        Titre: ${mission.title}
        Type: ${mission.type}
        Date: ${missionDate}
        Lieu: ${mission.location}
        Forfait: ${mission.forfeit}€
        ${mission.description ? `Description: ${mission.description}` : ''}
        
        Mission confirmée - Préparez-vous pour cette intervention !
        
        Statut de connexion: ${this.isConnected ? 'Connecté' : 'Non connecté'}
      `
    }
  }

  public static getMissionRejectedTemplate(
    technician: User,
    mission: Mission
  ): EmailTemplate {
    return {
      subject: `Mission refusée - ${mission.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Esil-events</h1>
            <p style="margin: 10px 0 0 0;">Mission refusée</p>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333;">Bonjour ${technician.name},</h2>
            
            <p>Vous avez refusé la mission suivante :</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #fa709a;">
              <h3 style="color: #fa709a; margin-top: 0;">${mission.title}</h3>
              <p><strong>Type :</strong> ${mission.type}</p>
              <p><strong>Lieu :</strong> ${mission.location}</p>
              <p><strong>Forfait :</strong> ${mission.forfeit}€</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                ℹ️ Cette mission a été refusée et sera proposée à d'autres techniciens.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              D'autres missions vous seront proposées prochainement.
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>Cet email a été envoyé automatiquement par le système Esil-events</p>
            <p>Statut de connexion: ${this.isConnected ? 'Connecté' : 'Non connecté'}</p>
          </div>
        </div>
      `,
      text: `
        Mission refusée - ${mission.title}
        
        Bonjour ${technician.name},
        
        Vous avez refusé la mission suivante :
        
        Titre: ${mission.title}
        Type: ${mission.type}
        Lieu: ${mission.location}
        Forfait: ${mission.forfeit}€
        
        Cette mission a été refusée et sera proposée à d'autres techniciens.
        D'autres missions vous seront proposées prochainement.
        
        Statut de connexion: ${this.isConnected ? 'Connecté' : 'Non connecté'}
      `
    }
  }

  public static getPaymentCreatedTemplate(
    technician: User,
    amount: number,
    missions: Mission[]
  ): EmailTemplate {
    const totalAmount = amount.toFixed(2)
    const missionList = missions.map(m => `- ${m.title} (${m.forfeit}€)`).join('\n')

    return {
      subject: `Nouveau paiement créé - ${totalAmount}€`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Esil-events</h1>
            <p style="margin: 10px 0 0 0;">Nouveau paiement</p>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333;">Bonjour ${technician.name},</h2>
            
            <p>Un nouveau paiement a été créé pour vos missions :</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #667eea; margin-top: 0;">Montant total : ${totalAmount}€</h3>
              <p><strong>Missions concernées :</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${missions.map(m => `<li>${m.title} (${m.forfeit}€)</li>`).join('')}
              </ul>
            </div>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #2d5a2d;">
                💰 Le paiement sera traité dans les plus brefs délais.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Consultez votre espace technicien pour suivre l'état de vos paiements.
            </p>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p>Cet email a été envoyé automatiquement par le système Esil-events</p>
            <p>Statut de connexion: ${this.isConnected ? 'Connecté' : 'Non connecté'}</p>
          </div>
        </div>
      `,
      text: `
        Nouveau paiement créé - ${totalAmount}€
        
        Bonjour ${technician.name},
        
        Un nouveau paiement a été créé pour vos missions :
        
        Montant total: ${totalAmount}€
        Missions concernées:
        ${missionList}
        
        Le paiement sera traité dans les plus brefs délais.
        Consultez votre espace technicien pour suivre l'état de vos paiements.
        
        Statut de connexion: ${this.isConnected ? 'Connecté' : 'Non connecté'}
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
    sendMissionAssignment: async (technician: User, mission: Mission, assignment: MissionAssignment) => {
      const template = EmailService.getMissionAssignmentTemplate(technician, mission, assignment)
      return await emailService.sendEmail({
        to: technician.email || '',
        template
      })
    },
    sendMissionAccepted: async (technician: User, mission: Mission) => {
      const template = EmailService.getMissionAcceptedTemplate(technician, mission)
      return await emailService.sendEmail({
        to: technician.email || '',
        template
      })
    },
    sendMissionRejected: async (technician: User, mission: Mission) => {
      const template = EmailService.getMissionRejectedTemplate(technician, mission)
      return await emailService.sendEmail({
        to: technician.email || '',
        template
      })
    },
    sendPaymentCreated: async (technician: User, amount: number, missions: Mission[]) => {
      const template = EmailService.getPaymentCreatedTemplate(technician, amount, missions)
      return await emailService.sendEmail({
        to: technician.email || '',
        template
      })
    }
  }
} 
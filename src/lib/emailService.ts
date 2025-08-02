import { supabase } from './supabase'
import type { User, Mission, MissionAssignment, Billing } from '@/types/database'

// Configuration SMTP
interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

// Types d'emails
export type EmailType = 
  | 'mission_assigned'
  | 'mission_accepted'
  | 'mission_rejected'
  | 'payment_created'
  | 'payment_validated'
  | 'payment_paid'
  | 'availability_updated'
  | 'unavailability_created'

// Interface pour les données d'email
interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

// Templates d'emails
const emailTemplates = {
  mission_assigned: (mission: Mission, technician: User) => ({
    subject: `Nouvelle mission assignée : ${mission.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Nouvelle mission assignée</h2>
        <p>Bonjour ${technician.name},</p>
        <p>Une nouvelle mission vous a été assignée :</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${mission.title}</h3>
          <p><strong>Type :</strong> ${mission.type}</p>
          <p><strong>Lieu :</strong> ${mission.location}</p>
          <p><strong>Date de début :</strong> ${new Date(mission.date_start).toLocaleString('fr-FR')}</p>
          <p><strong>Date de fin :</strong> ${new Date(mission.date_end).toLocaleString('fr-FR')}</p>
          <p><strong>Forfait :</strong> ${mission.forfeit}€</p>
          ${mission.description ? `<p><strong>Description :</strong> ${mission.description}</p>` : ''}
        </div>
        
        <p>Veuillez vous connecter à votre tableau de bord pour accepter ou refuser cette mission.</p>
        
        <p>Cordialement,<br>L'équipe Esil-events</p>
      </div>
    `,
    text: `
      Nouvelle mission assignée : ${mission.title}
      
      Type : ${mission.type}
      Lieu : ${mission.location}
      Date de début : ${new Date(mission.date_start).toLocaleString('fr-FR')}
      Date de fin : ${new Date(mission.date_end).toLocaleString('fr-FR')}
      Forfait : ${mission.forfeit}€
      ${mission.description ? `Description : ${mission.description}` : ''}
      
      Veuillez vous connecter à votre tableau de bord pour accepter ou refuser cette mission.
    `
  }),

  mission_accepted: (mission: Mission, technician: User) => ({
    subject: `Mission acceptée : ${mission.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4facfe;">Mission acceptée</h2>
        <p>Bonjour ${technician.name},</p>
        <p>Vous avez accepté la mission suivante :</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${mission.title}</h3>
          <p><strong>Type :</strong> ${mission.type}</p>
          <p><strong>Lieu :</strong> ${mission.location}</p>
          <p><strong>Date de début :</strong> ${new Date(mission.date_start).toLocaleString('fr-FR')}</p>
          <p><strong>Date de fin :</strong> ${new Date(mission.date_end).toLocaleString('fr-FR')}</p>
          <p><strong>Forfait :</strong> ${mission.forfeit}€</p>
        </div>
        
        <p>Merci pour votre engagement !</p>
        
        <p>Cordialement,<br>L'équipe Esil-events</p>
      </div>
    `,
    text: `
      Mission acceptée : ${mission.title}
      
      Type : ${mission.type}
      Lieu : ${mission.location}
      Date de début : ${new Date(mission.date_start).toLocaleString('fr-FR')}
      Date de fin : ${new Date(mission.date_end).toLocaleString('fr-FR')}
      Forfait : ${mission.forfeit}€
      
      Merci pour votre engagement !
    `
  }),

  mission_rejected: (mission: Mission, technician: User) => ({
    subject: `Mission refusée : ${mission.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #fa709a;">Mission refusée</h2>
        <p>Bonjour ${technician.name},</p>
        <p>Vous avez refusé la mission suivante :</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${mission.title}</h3>
          <p><strong>Type :</strong> ${mission.type}</p>
          <p><strong>Lieu :</strong> ${mission.location}</p>
          <p><strong>Date de début :</strong> ${new Date(mission.date_start).toLocaleString('fr-FR')}</p>
          <p><strong>Date de fin :</strong> ${new Date(mission.date_end).toLocaleString('fr-FR')}</p>
          <p><strong>Forfait :</strong> ${mission.forfeit}€</p>
        </div>
        
        <p>Nous comprenons. D'autres missions vous seront proposées prochainement.</p>
        
        <p>Cordialement,<br>L'équipe Esil-events</p>
      </div>
    `,
    text: `
      Mission refusée : ${mission.title}
      
      Type : ${mission.type}
      Lieu : ${mission.location}
      Date de début : ${new Date(mission.date_start).toLocaleString('fr-FR')}
      Date de fin : ${new Date(mission.date_end).toLocaleString('fr-FR')}
      Forfait : ${mission.forfeit}€
      
      Nous comprenons. D'autres missions vous seront proposées prochainement.
    `
  }),

  payment_created: (billing: Billing & { missions: Mission }, technician: User) => ({
    subject: `Nouveau paiement créé : ${billing.missions.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Nouveau paiement créé</h2>
        <p>Bonjour ${technician.name},</p>
        <p>Un nouveau paiement a été créé pour la mission suivante :</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${billing.missions.title}</h3>
          <p><strong>Type :</strong> ${billing.missions.type}</p>
          <p><strong>Lieu :</strong> ${billing.missions.location}</p>
          <p><strong>Montant :</strong> ${billing.amount}€</p>
          <p><strong>Statut :</strong> En attente</p>
          ${billing.notes ? `<p><strong>Notes :</strong> ${billing.notes}</p>` : ''}
        </div>
        
        <p>Le paiement sera traité dans les plus brefs délais.</p>
        
        <p>Cordialement,<br>L'équipe Esil-events</p>
      </div>
    `,
    text: `
      Nouveau paiement créé : ${billing.missions.title}
      
      Type : ${billing.missions.type}
      Lieu : ${billing.missions.location}
      Montant : ${billing.amount}€
      Statut : En attente
      ${billing.notes ? `Notes : ${billing.notes}` : ''}
      
      Le paiement sera traité dans les plus brefs délais.
    `
  }),

  payment_validated: (billing: Billing & { missions: Mission }, technician: User) => ({
    subject: `Paiement validé : ${billing.missions.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4facfe;">Paiement validé</h2>
        <p>Bonjour ${technician.name},</p>
        <p>Votre paiement pour la mission suivante a été validé :</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${billing.missions.title}</h3>
          <p><strong>Type :</strong> ${billing.missions.type}</p>
          <p><strong>Lieu :</strong> ${billing.missions.location}</p>
          <p><strong>Montant :</strong> ${billing.amount}€</p>
          <p><strong>Statut :</strong> Validé</p>
          ${billing.notes ? `<p><strong>Notes :</strong> ${billing.notes}</p>` : ''}
        </div>
        
        <p>Le paiement sera effectué prochainement.</p>
        
        <p>Cordialement,<br>L'équipe Esil-events</p>
      </div>
    `,
    text: `
      Paiement validé : ${billing.missions.title}
      
      Type : ${billing.missions.type}
      Lieu : ${billing.missions.location}
      Montant : ${billing.amount}€
      Statut : Validé
      ${billing.notes ? `Notes : ${billing.notes}` : ''}
      
      Le paiement sera effectué prochainement.
    `
  }),

  payment_paid: (billing: Billing & { missions: Mission }, technician: User) => ({
    subject: `Paiement effectué : ${billing.missions.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4facfe;">Paiement effectué</h2>
        <p>Bonjour ${technician.name},</p>
        <p>Votre paiement pour la mission suivante a été effectué :</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${billing.missions.title}</h3>
          <p><strong>Type :</strong> ${billing.missions.type}</p>
          <p><strong>Lieu :</strong> ${billing.missions.location}</p>
          <p><strong>Montant :</strong> ${billing.amount}€</p>
          <p><strong>Statut :</strong> Payé</p>
          <p><strong>Date de paiement :</strong> ${billing.payment_date ? new Date(billing.payment_date).toLocaleString('fr-FR') : 'N/A'}</p>
          ${billing.notes ? `<p><strong>Notes :</strong> ${billing.notes}</p>` : ''}
        </div>
        
        <p>Merci pour votre travail !</p>
        
        <p>Cordialement,<br>L'équipe Esil-events</p>
      </div>
    `,
    text: `
      Paiement effectué : ${billing.missions.title}
      
      Type : ${billing.missions.type}
      Lieu : ${billing.missions.location}
      Montant : ${billing.amount}€
      Statut : Payé
      Date de paiement : ${billing.payment_date ? new Date(billing.payment_date).toLocaleString('fr-FR') : 'N/A'}
      ${billing.notes ? `Notes : ${billing.notes}` : ''}
      
      Merci pour votre travail !
    `
  }),

  availability_updated: (technician: User, availabilityCount: number) => ({
    subject: `Disponibilités mises à jour`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4facfe;">Disponibilités mises à jour</h2>
        <p>Bonjour ${technician.name},</p>
        <p>Vos disponibilités ont été mises à jour avec succès.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Nombre de périodes de disponibilité :</strong> ${availabilityCount}</p>
        </div>
        
        <p>Vous recevrez des propositions de missions en fonction de vos disponibilités.</p>
        
        <p>Cordialement,<br>L'équipe Esil-events</p>
      </div>
    `,
    text: `
      Disponibilités mises à jour
      
      Nombre de périodes de disponibilité : ${availabilityCount}
      
      Vous recevrez des propositions de missions en fonction de vos disponibilités.
    `
  }),

  unavailability_created: (technician: User, unavailabilityCount: number) => ({
    subject: `Indisponibilité enregistrée`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #fa709a;">Indisponibilité enregistrée</h2>
        <p>Bonjour ${technician.name},</p>
        <p>Votre indisponibilité a été enregistrée avec succès.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Nombre de périodes d'indisponibilité :</strong> ${unavailabilityCount}</p>
        </div>
        
        <p>Aucune mission ne vous sera proposée pendant ces périodes.</p>
        
        <p>Cordialement,<br>L'équipe Esil-events</p>
      </div>
    `,
    text: `
      Indisponibilité enregistrée
      
      Nombre de périodes d'indisponibilité : ${unavailabilityCount}
      
      Aucune mission ne vous sera proposée pendant ces périodes.
    `
  })
}

// Service d'envoi d'emails
export class EmailService {
  private static instance: EmailService
  private smtpConfig: SMTPConfig | null = null

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  // Configuration du SMTP
  configureSMTP(config: SMTPConfig) {
    this.smtpConfig = config
  }

  // Envoi d'email via Supabase Edge Function
  private async sendEmailViaSupabase(emailData: EmailData): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        }
      })

      if (error) {
        console.error('Erreur envoi email:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Erreur envoi email:', error)
      return false
    }
  }

  // Envoi d'email avec SMTP direct (fallback)
  private async sendEmailDirect(emailData: EmailData): Promise<boolean> {
    if (!this.smtpConfig) {
      console.error('Configuration SMTP manquante')
      return false
    }

    try {
      // Ici vous pouvez utiliser nodemailer ou une autre librairie SMTP
      // Pour l'instant, on simule l'envoi
      console.log('Envoi email via SMTP:', {
        to: emailData.to,
        subject: emailData.subject
      })
      
      return true
    } catch (error) {
      console.error('Erreur envoi SMTP:', error)
      return false
    }
  }

  // Méthode principale d'envoi
  async sendEmail(emailData: EmailData): Promise<boolean> {
    // Essayer d'abord via Supabase Edge Function
    const success = await this.sendEmailViaSupabase(emailData)
    
    if (!success && this.smtpConfig) {
      // Fallback vers SMTP direct
      return await this.sendEmailDirect(emailData)
    }
    
    return success
  }

  // Envoi d'email basé sur le type
  async sendNotificationEmail(
    type: EmailType,
    recipient: User,
    data: any
  ): Promise<boolean> {
    if (!recipient.email) {
      console.warn('Aucune adresse email pour le destinataire')
      return false
    }

    const template = emailTemplates[type]
    if (!template) {
      console.error(`Template non trouvé pour le type: ${type}`)
      return false
    }

    const emailContent = template(data, recipient)
    
    return await this.sendEmail({
      to: recipient.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })
  }

  // Méthodes spécifiques pour chaque type d'action
  async sendMissionAssignedEmail(mission: Mission, technician: User): Promise<boolean> {
    return await this.sendNotificationEmail('mission_assigned', technician, mission)
  }

  async sendMissionAcceptedEmail(mission: Mission, technician: User): Promise<boolean> {
    return await this.sendNotificationEmail('mission_accepted', technician, mission)
  }

  async sendMissionRejectedEmail(mission: Mission, technician: User): Promise<boolean> {
    return await this.sendNotificationEmail('mission_rejected', technician, mission)
  }

  async sendPaymentCreatedEmail(billing: Billing & { missions: Mission }, technician: User): Promise<boolean> {
    return await this.sendNotificationEmail('payment_created', technician, billing)
  }

  async sendPaymentValidatedEmail(billing: Billing & { missions: Mission }, technician: User): Promise<boolean> {
    return await this.sendNotificationEmail('payment_validated', technician, billing)
  }

  async sendPaymentPaidEmail(billing: Billing & { missions: Mission }, technician: User): Promise<boolean> {
    return await this.sendNotificationEmail('payment_paid', technician, billing)
  }

  async sendAvailabilityUpdatedEmail(technician: User, availabilityCount: number): Promise<boolean> {
    return await this.sendNotificationEmail('availability_updated', technician, { availabilityCount })
  }

  async sendUnavailabilityCreatedEmail(technician: User, unavailabilityCount: number): Promise<boolean> {
    return await this.sendNotificationEmail('unavailability_created', technician, { unavailabilityCount })
  }
}

// Instance singleton
export const emailService = EmailService.getInstance() 
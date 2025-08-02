// Service d'envoi d'emails automatique
// Utilise SMTP direct ou Supabase Edge Function comme fallback

interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  disableEdgeFunction?: boolean
}

interface EmailData {
  to: string
  subject: string
  html: string
  text: string
}

type EmailType = 
  | 'technician_assigned'
  | 'mission_accepted'
  | 'mission_rejected'
  | 'payment_created'
  | 'payment_validated'
  | 'payment_completed'
  | 'availability_created'
  | 'unavailability_created'

// Templates d'emails
const emailTemplates = {
  technician_assigned: {
    subject: 'Nouvelle mission assignée',
    html: (data: any) => `
      <h2>Nouvelle mission assignée</h2>
      <p>Bonjour ${data.technicianName},</p>
      <p>Une nouvelle mission vous a été assignée :</p>
      <ul>
        <li><strong>Mission :</strong> ${data.missionTitle}</li>
        <li><strong>Date :</strong> ${data.missionDate}</li>
        <li><strong>Lieu :</strong> ${data.missionLocation}</li>
        <li><strong>Description :</strong> ${data.missionDescription}</li>
      </ul>
      <p>Connectez-vous à votre tableau de bord pour plus de détails.</p>
    `,
    text: (data: any) => `
      Nouvelle mission assignée
      
      Bonjour ${data.technicianName},
      
      Une nouvelle mission vous a été assignée :
      - Mission : ${data.missionTitle}
      - Date : ${data.missionDate}
      - Lieu : ${data.missionLocation}
      - Description : ${data.missionDescription}
      
      Connectez-vous à votre tableau de bord pour plus de détails.
    `
  },
  mission_accepted: {
    subject: 'Mission acceptée',
    html: (data: any) => `
      <h2>Mission acceptée</h2>
      <p>La mission "${data.missionTitle}" a été acceptée par ${data.technicianName}.</p>
      <p><strong>Détails :</strong></p>
      <ul>
        <li>Date : ${data.missionDate}</li>
        <li>Lieu : ${data.missionLocation}</li>
      </ul>
    `,
    text: (data: any) => `
      Mission acceptée
      
      La mission "${data.missionTitle}" a été acceptée par ${data.technicianName}.
      
      Détails :
      - Date : ${data.missionDate}
      - Lieu : ${data.missionLocation}
    `
  },
  mission_rejected: {
    subject: 'Mission refusée',
    html: (data: any) => `
      <h2>Mission refusée</h2>
      <p>La mission "${data.missionTitle}" a été refusée par ${data.technicianName}.</p>
      <p><strong>Raison :</strong> ${data.reason || 'Aucune raison spécifiée'}</p>
    `,
    text: (data: any) => `
      Mission refusée
      
      La mission "${data.missionTitle}" a été refusée par ${data.technicianName}.
      
      Raison : ${data.reason || 'Aucune raison spécifiée'}
    `
  },
  payment_created: {
    subject: 'Nouveau paiement créé',
    html: (data: any) => `
      <h2>Nouveau paiement créé</h2>
      <p>Un nouveau paiement a été créé pour ${data.technicianName}.</p>
      <ul>
        <li><strong>Montant :</strong> ${data.amount}€</li>
        <li><strong>Mission :</strong> ${data.missionTitle}</li>
        <li><strong>Date de création :</strong> ${data.createdDate}</li>
      </ul>
    `,
    text: (data: any) => `
      Nouveau paiement créé
      
      Un nouveau paiement a été créé pour ${data.technicianName}.
      
      - Montant : ${data.amount}€
      - Mission : ${data.missionTitle}
      - Date de création : ${data.createdDate}
    `
  },
  payment_validated: {
    subject: 'Paiement validé',
    html: (data: any) => `
      <h2>Paiement validé</h2>
      <p>Le paiement de ${data.amount}€ pour ${data.technicianName} a été validé.</p>
      <ul>
        <li><strong>Mission :</strong> ${data.missionTitle}</li>
        <li><strong>Date de validation :</strong> ${data.validatedDate}</li>
      </ul>
    `,
    text: (data: any) => `
      Paiement validé
      
      Le paiement de ${data.amount}€ pour ${data.technicianName} a été validé.
      
      - Mission : ${data.missionTitle}
      - Date de validation : ${data.validatedDate}
    `
  },
  payment_completed: {
    subject: 'Paiement complété',
    html: (data: any) => `
      <h2>Paiement complété</h2>
      <p>Le paiement de ${data.amount}€ pour ${data.technicianName} a été complété.</p>
      <ul>
        <li><strong>Mission :</strong> ${data.missionTitle}</li>
        <li><strong>Date de complétion :</strong> ${data.completedDate}</li>
      </ul>
    `,
    text: (data: any) => `
      Paiement complété
      
      Le paiement de ${data.amount}€ pour ${data.technicianName} a été complété.
      
      - Mission : ${data.missionTitle}
      - Date de complétion : ${data.completedDate}
    `
  },
  availability_created: {
    subject: 'Nouvelle disponibilité créée',
    html: (data: any) => `
      <h2>Nouvelle disponibilité créée</h2>
      <p>${data.technicianName} a créé une nouvelle période de disponibilité.</p>
      <ul>
        <li><strong>Du :</strong> ${data.startDate}</li>
        <li><strong>Au :</strong> ${data.endDate}</li>
        <li><strong>Type :</strong> ${data.type}</li>
      </ul>
    `,
    text: (data: any) => `
      Nouvelle disponibilité créée
      
      ${data.technicianName} a créé une nouvelle période de disponibilité.
      
      - Du : ${data.startDate}
      - Au : ${data.endDate}
      - Type : ${data.type}
    `
  },
  unavailability_created: {
    subject: 'Nouvelle indisponibilité créée',
    html: (data: any) => `
      <h2>Nouvelle indisponibilité créée</h2>
      <p>${data.technicianName} a créé une nouvelle période d'indisponibilité.</p>
      <ul>
        <li><strong>Du :</strong> ${data.startDate}</li>
        <li><strong>Au :</strong> ${data.endDate}</li>
        <li><strong>Raison :</strong> ${data.reason}</li>
      </ul>
    `,
    text: (data: any) => `
      Nouvelle indisponibilité créée
      
      ${data.technicianName} a créé une nouvelle période d'indisponibilité.
      
      - Du : ${data.startDate}
      - Au : ${data.endDate}
      - Raison : ${data.reason}
    `
  }
}

class EmailService {
  private static instance: EmailService
  private smtpConfig: SMTPConfig | null = null

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  // Configuration SMTP
  configureSMTP(config: SMTPConfig): void {
    this.smtpConfig = config
    console.log('Configuration SMTP mise à jour:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user
    })
  }

  // Envoi d'email avec SMTP direct (browser-compatible)
  private async sendEmailDirect(emailData: EmailData): Promise<boolean> {
    if (!this.smtpConfig) {
      console.error('Configuration SMTP manquante')
      return false
    }

    try {
      // TODO: Implémenter l'envoi réel via EmailJS ou service similaire
      // 
      // Option 1: EmailJS (recommandé)
      // - Installer: npm install @emailjs/browser
      // - Configurer dans .env: VITE_EMAILJS_PUBLIC_KEY, VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID
      // - Exemple d'implémentation:
      //   import emailjs from '@emailjs/browser'
      //   const result = await emailjs.send(
      //     process.env.VITE_EMAILJS_SERVICE_ID!,
      //     process.env.VITE_EMAILJS_TEMPLATE_ID!,
      //     {
      //       to_email: emailData.to,
      //       subject: emailData.subject,
      //       message: emailData.html,
      //       from_name: 'Esil Events'
      //     },
      //     process.env.VITE_EMAILJS_PUBLIC_KEY!
      //   )
      //
      // Option 2: SendGrid API
      // - Utiliser l'API REST de SendGrid avec fetch
      // - Configurer: VITE_SENDGRID_API_KEY
      //
      // Option 3: Resend
      // - Service moderne et simple
      // - Configurer: VITE_RESEND_API_KEY
      
      // Pour l'instant, on simule l'envoi et on log les détails
      console.log('Simulation envoi email SMTP:', {
        from: this.smtpConfig.auth.user,
        to: emailData.to,
        subject: emailData.subject,
        smtp: {
          host: this.smtpConfig.host,
          port: this.smtpConfig.port,
          secure: this.smtpConfig.secure
        }
      })

      // TODO: Remplacer par l'implémentation réelle ci-dessus
      return true
    } catch (error) {
      console.error('Erreur envoi SMTP:', error)
      return false
    }
  }

  // Envoi via Supabase Edge Function
  private async sendEmailViaSupabase(emailData: EmailData): Promise<boolean> {
    try {
      const { supabase } = await import('./supabase')
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        }
      })

      if (error) {
        console.warn('Edge Function non disponible:', error.message)
        return false
      }

      console.log('Email envoyé via Edge Function:', data)
      return true
    } catch (error) {
      console.warn('Erreur Edge Function:', error)
      return false
    }
  }

  // Méthode principale d'envoi
  async sendEmail(emailData: EmailData): Promise<boolean> {
    // Utiliser directement SMTP si configuré et pas désactivé
    if (this.smtpConfig && !this.smtpConfig.disableEdgeFunction) {
      return await this.sendEmailDirect(emailData)
    }
    
    // Essayer via Supabase Edge Function si pas de config SMTP ou si Edge Function activée
    if (!this.smtpConfig || !this.smtpConfig.disableEdgeFunction) {
      return await this.sendEmailViaSupabase(emailData)
    }
    
    console.warn('Aucune méthode d\'envoi d\'email configurée')
    return false
  }

  // Méthodes spécifiques pour chaque type d'email
  async sendTechnicianAssignedEmail(technicianEmail: string, data: any): Promise<boolean> {
    const template = emailTemplates.technician_assigned
    return await this.sendEmail({
      to: technicianEmail,
      subject: template.subject,
      html: template.html(data),
      text: template.text(data)
    })
  }

  async sendMissionAcceptedEmail(adminEmail: string, data: any): Promise<boolean> {
    const template = emailTemplates.mission_accepted
    return await this.sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html(data),
      text: template.text(data)
    })
  }

  async sendMissionRejectedEmail(adminEmail: string, data: any): Promise<boolean> {
    const template = emailTemplates.mission_rejected
    return await this.sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html(data),
      text: template.text(data)
    })
  }

  async sendPaymentCreatedEmail(technicianEmail: string, data: any): Promise<boolean> {
    const template = emailTemplates.payment_created
    return await this.sendEmail({
      to: technicianEmail,
      subject: template.subject,
      html: template.html(data),
      text: template.text(data)
    })
  }

  async sendPaymentValidatedEmail(technicianEmail: string, data: any): Promise<boolean> {
    const template = emailTemplates.payment_validated
    return await this.sendEmail({
      to: technicianEmail,
      subject: template.subject,
      html: template.html(data),
      text: template.text(data)
    })
  }

  async sendPaymentCompletedEmail(technicianEmail: string, data: any): Promise<boolean> {
    const template = emailTemplates.payment_completed
    return await this.sendEmail({
      to: technicianEmail,
      subject: template.subject,
      html: template.html(data),
      text: template.text(data)
    })
  }

  async sendAvailabilityCreatedEmail(adminEmail: string, data: any): Promise<boolean> {
    const template = emailTemplates.availability_created
    return await this.sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html(data),
      text: template.text(data)
    })
  }

  async sendUnavailabilityCreatedEmail(adminEmail: string, data: any): Promise<boolean> {
    const template = emailTemplates.unavailability_created
    return await this.sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html(data),
      text: template.text(data)
    })
  }
}

export const emailService = EmailService.getInstance() 
import nodemailer from 'nodemailer'
import { Mission, User } from '../types/database'

interface EmailConfig {
  host: string
  port: number
  user: string
  pass: string
  from: string
  appUrl: string
}

interface AssignmentEmailData {
  technician: User
  mission: Mission
  adminName?: string
}

export class EmailService {
  private transporter: nodemailer.Transporter
  private config: EmailConfig

  constructor() {
    this.config = {
      host: import.meta.env.VITE_SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(import.meta.env.VITE_SMTP_PORT || '587'),
      user: import.meta.env.VITE_SMTP_USER || '',
      pass: import.meta.env.VITE_SMTP_PASS || '',
      from: import.meta.env.VITE_SMTP_FROM || 'noreply@esil-events.com',
      appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5173'
    }

    this.transporter = nodemailer.createTransporter({
      host: this.config.host,
      port: this.config.port,
      secure: false, // true pour 465, false pour les autres ports
      auth: {
        user: this.config.user,
        pass: this.config.pass,
      },
    })
  }

  /**
   * Envoie un email de notification d'assignation à un technicien
   */
  async sendAssignmentNotification(data: AssignmentEmailData): Promise<boolean> {
    try {
      const { technician, mission, adminName } = data

      if (!technician.email) {
        console.warn(`Aucune adresse email pour le technicien ${technician.name}`)
        return false
      }

      const missionStartDate = new Date(mission.date_start)
      const missionEndDate = new Date(mission.date_end)
      
      const emailContent = this.generateAssignmentEmailContent({
        technicianName: technician.name,
        missionTitle: mission.title,
        missionType: mission.type,
        missionLocation: mission.location,
        missionStartDate: missionStartDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        missionEndDate: missionEndDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        missionForfeit: mission.forfeit,
        missionDescription: mission.description || 'Aucune description fournie',
        adminName: adminName || 'L\'équipe Esil-events',
        appUrl: this.config.appUrl
      })

      const mailOptions = {
        from: `"Esil-events" <${this.config.from}>`,
        to: technician.email,
        subject: `🎯 Nouvelle mission assignée : ${mission.title}`,
        html: emailContent
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Email envoyé avec succès:', result.messageId)
      return true
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error)
      return false
    }
  }

  /**
   * Génère le contenu HTML de l'email d'assignation
   */
  private generateAssignmentEmailContent(data: {
    technicianName: string
    missionTitle: string
    missionType: string
    missionLocation: string
    missionStartDate: string
    missionEndDate: string
    missionForfeit: number
    missionDescription: string
    adminName: string
    appUrl: string
  }): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvelle mission assignée</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #667eea;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
          }
          .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
          }
          .mission-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .mission-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .mission-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .detail-label {
            font-weight: bold;
            color: #495057;
          }
          .detail-value {
            color: #6c757d;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
          .highlight {
            color: #667eea;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎉 Esil-events</div>
            <div class="greeting">Bonjour ${data.technicianName} !</div>
          </div>

          <p>Vous avez été assigné(e) à une nouvelle mission !</p>

          <div class="mission-card">
            <div class="mission-title">${data.missionTitle}</div>
            <p>Type : ${data.missionType}</p>
          </div>

          <div class="mission-details">
            <div class="detail-row">
              <span class="detail-label">📍 Lieu :</span>
              <span class="detail-value">${data.missionLocation}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📅 Début :</span>
              <span class="detail-value">${data.missionStartDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">⏰ Fin :</span>
              <span class="detail-value">${data.missionEndDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">💰 Forfait :</span>
              <span class="detail-value">${data.missionForfeit.toLocaleString('fr-FR')} €</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📝 Description :</span>
              <span class="detail-value">${data.missionDescription}</span>
            </div>
          </div>

          <p><strong>Action requise :</strong> Veuillez vous connecter à votre espace technicien pour accepter ou refuser cette mission.</p>

          <div style="text-align: center;">
            <a href="${data.appUrl}" class="cta-button">
              🔗 Accéder à mon espace
            </a>
          </div>

          <div class="footer">
            <p>Cet email a été envoyé automatiquement par le système Esil-events.</p>
            <p>Pour toute question, contactez ${data.adminName}.</p>
            <p>© 2024 Esil-events - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Vérifie la configuration SMTP
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      console.log('Configuration SMTP valide')
      return true
    } catch (error) {
      console.error('Erreur de configuration SMTP:', error)
      return false
    }
  }
}

// Instance singleton
export const emailService = new EmailService() 
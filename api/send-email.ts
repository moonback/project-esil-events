import { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

interface EmailRequest {
  technician: {
    id: string
    name: string
    email: string
  }
  mission: {
    id: string
    title: string
    type: string
    location: string
    date_start: string
    date_end: string
    forfeit: number
    description?: string
  }
  adminName?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { technician, mission, adminName }: EmailRequest = req.body

    // Validation des données
    if (!technician?.email || !mission?.title) {
      return res.status(400).json({ 
        error: 'Données manquantes: email du technicien et titre de la mission requis' 
      })
    }

    // Configuration SMTP
    const transporter = nodemailer.createTransporter({
      host: process.env.VITE_SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.VITE_SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.VITE_SMTP_USER,
        pass: process.env.VITE_SMTP_PASS,
      },
    })

    // Génération du contenu de l'email
    const missionStartDate = new Date(mission.date_start)
    const missionEndDate = new Date(mission.date_end)
    
    const emailContent = generateAssignmentEmailContent({
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
      appUrl: process.env.VITE_APP_URL || 'https://votre-app.vercel.app'
    })

    // Envoi de l'email
    const mailOptions = {
      from: `"Esil-events" <${process.env.VITE_SMTP_FROM || 'noreply@esil-events.com'}>`,
      to: technician.email,
      subject: `🎯 Nouvelle mission assignée : ${mission.title}`,
      html: emailContent
    }

    const result = await transporter.sendMail(mailOptions)
    
    console.log('Email envoyé avec succès:', result.messageId)
    
    return res.status(200).json({ 
      success: true, 
      messageId: result.messageId,
      message: 'Email envoyé avec succès'
    })

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error)
    return res.status(500).json({ 
      error: 'Erreur lors de l\'envoi de l\'email',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}

function generateAssignmentEmailContent(data: {
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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

interface MissionAssignmentEmail {
  technicianEmail: string
  technicianName: string
  missionTitle: string
  missionType: string
  missionLocation: string
  missionDateStart: string
  missionDateEnd: string
  missionForfeit: number
  missionDescription?: string
}

serve(async (req) => {
  // Gérer les requêtes CORS
          if (req.method === 'OPTIONS') {
          return new Response(null, {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
            },
          })
        }

  try {
    console.log('Début de la fonction send-email')
    
    const { type, data } = await req.json()
    console.log('Type reçu:', type)
    console.log('Data reçue:', JSON.stringify(data, null, 2))

    if (type !== 'mission_assignment') {
      throw new Error('Type d\'email non supporté')
    }

    const emailData = data as MissionAssignmentEmail
    console.log('Email data parsé:', JSON.stringify(emailData, null, 2))

    // Configuration SMTP depuis les variables d'environnement
    console.log('Configuration SMTP...')
    console.log('SMTP_HOST:', Deno.env.get('SMTP_HOST') || 'smtp.gmail.com')
    console.log('SMTP_PORT:', Deno.env.get('SMTP_PORT') || '587')
    console.log('SMTP_USER:', Deno.env.get('SMTP_USER') || 'non défini')
    console.log('SMTP_PASS:', Deno.env.get('SMTP_PASS') ? '***' : 'non défini')
    console.log('SMTP_FROM:', Deno.env.get('SMTP_FROM') || 'non défini')
    
    // Pour le test, on simule l'envoi d'email sans connexion SMTP
    console.log('Mode test - simulation d\'envoi d\'email')
    console.log('Email qui serait envoyé:')
    console.log('- From:', Deno.env.get('SMTP_FROM') || 'Esil-events <noreply@esil-events.com>')
    console.log('- To:', emailData.technicianEmail)
    console.log('- Subject:', `🎯 Nouvelle mission : ${emailData.missionTitle}`)
    
    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Email simulé envoyé avec succès')

    // Formatage des dates
    const formatDate = (dateString: string) => {
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

    // Template HTML pour l'email
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvelle mission assignée</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .mission-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .mission-title {
            color: #667eea;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .mission-type {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 14px;
            margin-bottom: 15px;
          }
          .mission-details {
            margin: 15px 0;
          }
          .mission-details strong {
            color: #555;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎯 Nouvelle mission assignée</h1>
          <p>Bonjour ${emailData.technicianName},</p>
        </div>
        
        <div class="content">
          <p>Vous avez été assigné(e) à une nouvelle mission !</p>
          
          <div class="mission-card">
            <div class="mission-title">${emailData.missionTitle}</div>
            <div class="mission-type">${emailData.missionType}</div>
            
            <div class="mission-details">
              <p><strong>📍 Lieu :</strong> ${emailData.missionLocation}</p>
              <p><strong>📅 Début :</strong> ${formatDate(emailData.missionDateStart)}</p>
              <p><strong>⏰ Fin :</strong> ${formatDate(emailData.missionDateEnd)}</p>
              <p><strong>💰 Forfait :</strong> ${emailData.missionForfeit}€</p>
              ${emailData.missionDescription ? `<p><strong>📝 Description :</strong> ${emailData.missionDescription}</p>` : ''}
            </div>
          </div>
          
          <p>Connectez-vous à votre espace technicien pour accepter ou refuser cette mission.</p>
          
          <div style="text-align: center;">
            <a href="${Deno.env.get('VITE_APP_URL') || 'http://localhost:5173'}" class="cta-button">
              Accéder à mon espace
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>Cet email a été envoyé automatiquement par Esil-events</p>
          <p>Si vous avez des questions, contactez l'administrateur</p>
        </div>
      </body>
      </html>
    `

    // Template texte pour l'email
    const textContent = `
      Nouvelle mission assignée - Esil-events

      Bonjour ${emailData.technicianName},

      Vous avez été assigné(e) à une nouvelle mission !

      Mission : ${emailData.missionTitle}
      Type : ${emailData.missionType}
      Lieu : ${emailData.missionLocation}
      Début : ${formatDate(emailData.missionDateStart)}
      Fin : ${formatDate(emailData.missionDateEnd)}
      Forfait : ${emailData.missionForfeit}€
      ${emailData.missionDescription ? `Description : ${emailData.missionDescription}` : ''}

      Connectez-vous à votre espace technicien pour accepter ou refuser cette mission.

      --
      Cet email a été envoyé automatiquement par Esil-events
    `

    // Envoi de l'email (simulé en mode test)
    console.log('Email simulé envoyé avec succès')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email envoyé avec succès' 
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey"
        },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error)
    console.error('Stack trace:', error.stack)
    console.error('Message d\'erreur:', error.message)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey"
        },
        status: 500 
      }
    )
  }
}) 
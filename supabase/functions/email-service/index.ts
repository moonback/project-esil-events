// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuration SMTP
const SMTP_CONFIG = {
  host: Deno.env.get('SMTP_HOST') || 'smtp.gmail.com',
  port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
  username: Deno.env.get('SMTP_USERNAME') || '',
  password: Deno.env.get('SMTP_PASSWORD') || '',
  secure: false,
  from: Deno.env.get('SMTP_FROM') || 'noreply@esil.com'
}

// Types pour les notifications
interface EmailNotification {
  to: string
  subject: string
  html: string
  text?: string
}

interface MissionAssignmentData {
  technicianId: string
  missionId: string
  missionTitle: string
  missionType: string
  missionDate: string
  missionLocation: string
  forfeit: number
}

// Fonction pour envoyer un email via SMTP
async function sendEmail(notification: EmailNotification): Promise<boolean> {
  try {
    const { to, subject, html, text } = notification
    
    // Construction du message SMTP
    const message = [
      `From: ${SMTP_CONFIG.from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      html
    ].join('\r\n')

    // Connexion SMTP (simulation - dans un vrai environnement, utilisez une librairie SMTP)
    console.log(`Envoi d'email à: ${to}`)
    console.log(`Sujet: ${subject}`)
    
    // Pour l'instant, on simule l'envoi
    // En production, utilisez une vraie librairie SMTP comme nodemailer
    return true
  } catch (error) {
    console.error('Erreur lors de l\'envoi d\'email:', error)
    return false
  }
}

// Templates d'emails
function createMissionAssignmentEmail(data: MissionAssignmentData): EmailNotification {
  const { missionTitle, missionType, missionDate, missionLocation, forfeit } = data
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Nouvelle mission assignée</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .mission-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 Nouvelle mission assignée</h1>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p>Une nouvelle mission vous a été assignée. Voici les détails :</p>
          
          <div class="mission-details">
            <h3>${missionTitle}</h3>
            <p><strong>Type :</strong> ${missionType}</p>
            <p><strong>Date :</strong> ${new Date(missionDate).toLocaleDateString('fr-FR')}</p>
            <p><strong>Lieu :</strong> ${missionLocation}</p>
            <p><strong>Forfait :</strong> ${forfeit}€</p>
          </div>
          
          <p>Connectez-vous à votre espace technicien pour accepter ou refuser cette mission.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/technician" class="button">
              Voir la mission
            </a>
          </div>
          
          <p>Cordialement,<br>L'équipe ESIL</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return {
    to: data.technicianId, // Sera remplacé par l'email du technicien
    subject: `Nouvelle mission : ${missionTitle}`,
    html
  }
}

function createMissionAcceptedEmail(data: MissionAssignmentData): EmailNotification {
  const { missionTitle, missionType, missionDate, missionLocation, forfeit } = data
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Mission acceptée</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .mission-details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Mission acceptée</h1>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p>Votre mission a été acceptée avec succès !</p>
          
          <div class="mission-details">
            <h3>${missionTitle}</h3>
            <p><strong>Type :</strong> ${missionType}</p>
            <p><strong>Date :</strong> ${new Date(missionDate).toLocaleDateString('fr-FR')}</p>
            <p><strong>Lieu :</strong> ${missionLocation}</p>
            <p><strong>Forfait :</strong> ${forfeit}€</p>
          </div>
          
          <p>Préparez-vous pour cette mission et n'oubliez pas de confirmer votre présence.</p>
          
          <p>Cordialement,<br>L'équipe ESIL</p>
        </div>
        <div class="footer">
          <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return {
    to: data.technicianId,
    subject: `Mission acceptée : ${missionTitle}`,
    html
  }
}

// Fonction principale pour gérer les notifications
async function handleEmailNotification(type: string, data: any): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let notification: EmailNotification | null = null

    switch (type) {
      case 'mission_assigned':
        // Récupérer les détails de la mission et du technicien
        const { data: missionData } = await supabase
          .from('missions')
          .select('*')
          .eq('id', data.missionId)
          .single()

        const { data: technicianData } = await supabase
          .from('users')
          .select('email, name')
          .eq('id', data.technicianId)
          .single()

        if (!missionData || !technicianData?.email) {
          return { success: false, message: 'Données manquantes pour l\'envoi d\'email' }
        }

        notification = createMissionAssignmentEmail({
          technicianId: technicianData.email,
          missionId: data.missionId,
          missionTitle: missionData.title,
          missionType: missionData.type,
          missionDate: missionData.date_start,
          missionLocation: missionData.location,
          forfeit: missionData.forfeit
        })
        break

      case 'mission_accepted':
        // Logique similaire pour les missions acceptées
        const { data: acceptedMissionData } = await supabase
          .from('missions')
          .select('*')
          .eq('id', data.missionId)
          .single()

        const { data: acceptedTechnicianData } = await supabase
          .from('users')
          .select('email, name')
          .eq('id', data.technicianId)
          .single()

        if (!acceptedMissionData || !acceptedTechnicianData?.email) {
          return { success: false, message: 'Données manquantes pour l\'envoi d\'email' }
        }

        notification = createMissionAcceptedEmail({
          technicianId: acceptedTechnicianData.email,
          missionId: data.missionId,
          missionTitle: acceptedMissionData.title,
          missionType: acceptedMissionData.type,
          missionDate: acceptedMissionData.date_start,
          missionLocation: acceptedMissionData.location,
          forfeit: acceptedMissionData.forfeit
        })
        break

      default:
        return { success: false, message: 'Type de notification non supporté' }
    }

    if (notification) {
      const emailSent = await sendEmail(notification)
      return {
        success: emailSent,
        message: emailSent ? 'Email envoyé avec succès' : 'Erreur lors de l\'envoi de l\'email'
      }
    }

    return { success: false, message: 'Aucune notification à envoyer' }
  } catch (error) {
    console.error('Erreur dans handleEmailNotification:', error)
    return { success: false, message: 'Erreur interne du serveur' }
  }
}

// Endpoint principal
Deno.serve(async (req) => {
  // Gestion CORS
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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { type, data } = await req.json()
    
    if (!type || !data) {
      return new Response(JSON.stringify({ error: 'Type et données requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const result = await handleEmailNotification(type, data)

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    console.error('Erreur dans l\'endpoint:', error)
    return new Response(JSON.stringify({ error: 'Erreur interne du serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

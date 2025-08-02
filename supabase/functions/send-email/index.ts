// @ts-ignore: Deno types not available in Node.js environment
/// <reference types="https://deno.land/x/deno@v1.40.4/lib.deno.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from "nodemailer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  to: string
  subject: string
  html: string
  text: string
  from?: string
  fromName?: string
}

serve(async (req) => {
  // Gestion des requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { emailData } = await req.json()

    // Configuration SMTP depuis les variables d'environnement
    const smtpConfig = {
      host: Deno.env.get('SMTP_HOST') || 'mail.dresscodeia.fr',
      port: parseInt(Deno.env.get('SMTP_PORT') || '465'),
      secure: true,
      auth: {
        user: Deno.env.get('SMTP_USER') || 'client@dresscodeia.fr',
        pass: Deno.env.get('SMTP_PASSWORD') || ''
      }
    }

    // Création du transporteur SMTP
    const transporter = nodemailer.createTransport(smtpConfig)

    // Vérification de la connexion SMTP
    await transporter.verify()

    // Préparation de l'email
    const mailOptions = {
      from: `${emailData.fromName || 'Esil-events'} <${emailData.from || smtpConfig.auth.user}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    }

    // Envoi de l'email
    const info = await transporter.sendMail(mailOptions)

    console.log('✅ Email envoyé avec succès:', info.messageId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email envoyé avec succès',
        messageId: info.messageId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 
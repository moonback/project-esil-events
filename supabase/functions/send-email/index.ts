// @ts-ignore: Deno types not available in Node.js environment
/// <reference types="https://deno.land/x/deno@v1.40.4/lib.deno.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
      user: Deno.env.get('SMTP_USER') || 'client@dresscodeia.fr',
      pass: Deno.env.get('SMTP_PASSWORD') || ''
    }

    console.log('📧 Tentative d\'envoi d\'email:', {
      to: emailData.to,
      subject: emailData.subject,
      from: emailData.from || smtpConfig.user
    })

    // Pour l'instant, on simule l'envoi d'email
    // En production, vous pouvez utiliser un service comme SendGrid, Mailgun, etc.
    console.log('✅ Email simulé envoyé avec succès')

    // Simulation d'un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 1000))

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email envoyé avec succès (simulation)',
        messageId: `msg_${Date.now()}`
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
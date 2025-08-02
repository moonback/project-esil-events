#!/usr/bin/env node

/**
 * Script de test SMTP pour vérifier la configuration
 * Usage: node scripts/test-smtp.js
 */

import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Configuration du chemin pour .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '..', '.env.local')

console.log('🔍 Chargement du fichier .env.local...')
console.log(`  Chemin: ${envPath}`)

dotenv.config({ path: envPath })

async function testSMTP() {
  console.log('🔧 Test de configuration SMTP...\n')

  // Configuration SMTP
  const smtpConfig = {
    host: process.env.VITE_SMTP_HOST || 'mail.dresscodeia.fr',
    port: parseInt(process.env.VITE_SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.VITE_SMTP_USER || 'client@dresscodeia.fr',
      pass: process.env.VITE_SMTP_PASSWORD || ''
    }
  }

  console.log('📋 Configuration SMTP:')
  console.log(`  Host: ${smtpConfig.host}`)
  console.log(`  Port: ${smtpConfig.port}`)
  console.log(`  User: ${smtpConfig.auth.user}`)
  console.log(`  Secure: ${smtpConfig.secure}`)
  console.log(`  Password: ${smtpConfig.auth.pass ? '***' : 'Non défini'}`)
  console.log('')

  try {
    // Création du transporteur
    console.log('🔌 Création du transporteur SMTP...')
    const transporter = nodemailer.createTransport(smtpConfig)
    console.log('✅ Transporteur créé')

    // Test de connexion
    console.log('🔍 Test de connexion...')
    await transporter.verify()
    console.log('✅ Connexion SMTP réussie!\n')

    // Test d'envoi d'email
    console.log('📧 Test d\'envoi d\'email...')
    const testEmail = process.env.TEST_EMAIL || 'test@example.com'
    console.log(`  Destinataire: ${testEmail}`)
    
    const mailOptions = {
      from: `${process.env.VITE_SMTP_FROM_NAME || 'Esil-events'} <${process.env.VITE_SMTP_FROM || smtpConfig.auth.user}>`,
      to: testEmail,
      subject: 'Test SMTP - Esil-events',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Test SMTP - Esil-events</h2>
          <p>Ceci est un email de test pour vérifier la configuration SMTP.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0;">Détails du test</h3>
            <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
            <p><strong>Serveur :</strong> ${smtpConfig.host}</p>
            <p><strong>Port :</strong> ${smtpConfig.port}</p>
          </div>
          <p>Si vous recevez cet email, la configuration SMTP fonctionne correctement.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              Cet email a été envoyé automatiquement par le système Esil-events.
            </p>
          </div>
        </div>
      `,
      text: `
Test SMTP - Esil-events

Ceci est un email de test pour vérifier la configuration SMTP.

Détails du test :
Date : ${new Date().toLocaleString('fr-FR')}
Serveur : ${smtpConfig.host}
Port : ${smtpConfig.port}

Si vous recevez cet email, la configuration SMTP fonctionne correctement.

---
Cet email a été envoyé automatiquement par le système Esil-events.
      `
    }

    console.log('📤 Envoi de l\'email...')
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email envoyé avec succès!')
    console.log(`  Message ID: ${info.messageId}`)
    console.log(`  Destinataire: ${testEmail}`)
    console.log('')

    // Fermeture de la connexion
    console.log('🔌 Fermeture de la connexion...')
    transporter.close()
    console.log('✅ Connexion SMTP fermée.')

  } catch (error) {
    console.error('❌ Erreur lors du test SMTP:')
    console.error(`  Message: ${error.message}`)
    
    if (error.code) {
      console.error(`  Code d'erreur: ${error.code}`)
    }
    
    if (error.command) {
      console.error(`  Commande: ${error.command}`)
    }
    
    console.log('\n💡 Suggestions de dépannage:')
    console.log('  1. Vérifiez les variables d\'environnement dans .env.local')
    console.log('  2. Vérifiez les identifiants SMTP')
    console.log('  3. Testez la connexion avec un client email')
    console.log('  4. Vérifiez que le port n\'est pas bloqué')
    
    process.exit(1)
  }
}

// Exécution du test
console.log('🚀 Démarrage du test SMTP...')
testSMTP().catch(error => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
}) 
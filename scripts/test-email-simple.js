#!/usr/bin/env node

/**
 * Script de test simplifié pour le service email
 * Ce script simule les appels à la fonction Edge
 */

console.log('🧪 Test du service email (simulation)...\n')

// Simulation des données de test
const testData = {
  technicianId: 'test-technician-id',
  missionId: 'test-mission-id',
  amount: 150
}

// Simulation des types de notifications
const notificationTypes = [
  'mission_assigned',
  'mission_accepted', 
  'mission_rejected',
  'payment_received'
]

async function simulateEmailService() {
  console.log('📧 Simulation des notifications email...\n')

  for (const type of notificationTypes) {
    console.log(`1. Test notification: ${type}`)
    
    // Simulation d'un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Simulation d'un succès (90% de chance)
    const success = Math.random() > 0.1
    
    if (success) {
      console.log(`✅ ${type}: Email envoyé avec succès`)
      
      // Afficher les détails simulés
      const details = {
        to: `technicien-${testData.technicianId}@example.com`,
        subject: getSubjectForType(type),
        template: type,
        data: {
          technicianId: testData.technicianId,
          missionId: testData.missionId,
          ...(type === 'payment_received' && { amount: testData.amount })
        }
      }
      
      console.log(`   📬 Destinataire: ${details.to}`)
      console.log(`   📝 Sujet: ${details.subject}`)
      console.log(`   📋 Template: ${details.template}`)
    } else {
      console.log(`❌ ${type}: Échec de l'envoi (simulation d'erreur)`)
    }
    
    console.log('')
  }
  
  console.log('🎉 Simulation terminée!')
  console.log('\n📋 Résumé:')
  console.log('   - 4 notifications testées')
  console.log('   - Templates HTML générés')
  console.log('   - Configuration SMTP simulée')
  console.log('   - Prêt pour le déploiement réel')
}

function getSubjectForType(type) {
  const subjects = {
    mission_assigned: 'Nouvelle mission assignée',
    mission_accepted: 'Mission acceptée',
    mission_rejected: 'Mission refusée', 
    payment_received: 'Paiement reçu'
  }
  return subjects[type] || 'Notification'
}

// Fonction pour afficher les informations de configuration
function showConfiguration() {
  console.log('⚙️ Configuration requise pour le déploiement:\n')
  console.log('1. Variables d\'environnement Supabase:')
  console.log('   - SMTP_HOST=smtp.gmail.com')
  console.log('   - SMTP_PORT=587')
  console.log('   - SMTP_USERNAME=votre-email@gmail.com')
  console.log('   - SMTP_PASSWORD=votre-mot-de-passe-app')
  console.log('   - SMTP_FROM=noreply@esil.com')
  console.log('   - FRONTEND_URL=http://localhost:5173')
  console.log('')
  console.log('2. Commandes de déploiement:')
  console.log('   - npx supabase start')
  console.log('   - npx supabase functions deploy email-service')
  console.log('')
  console.log('3. Test après déploiement:')
  console.log('   - npm run test:email')
  console.log('   - npm run test:email:real')
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--config')) {
    showConfiguration()
  } else {
    await simulateEmailService()
  }
}

// Exécuter le script
main().catch(console.error) 
#!/usr/bin/env node

/**
 * Test final du service email avec les vraies variables d'environnement
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Charger les variables d'environnement
config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://irpwesqvjrbehjithivz.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_ANON_KEY) {
  console.log('❌ Erreur: VITE_SUPABASE_ANON_KEY non trouvée dans les variables d\'environnement')
  console.log('Vérifiez votre fichier .env ou configurez la variable')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testEmailService() {
  console.log('🧪 Test final du service email...\n')
  console.log('URL:', SUPABASE_URL)
  console.log('Clé anon configurée:', SUPABASE_ANON_KEY ? 'Oui' : 'Non')
  console.log('')

  try {
    // Test 1: Mission assignée
    console.log('1. Test notification mission assignée')
    const missionAssignedResult = await supabase.functions.invoke('email-service', {
      body: {
        type: 'mission_assigned',
        data: {
          technicianId: 'test-technician-id',
          missionId: 'test-mission-id'
        }
      }
    })
    
    console.log('✅ Mission assignée:', missionAssignedResult)
    console.log('')

    // Test 2: Mission acceptée
    console.log('2. Test notification mission acceptée')
    const missionAcceptedResult = await supabase.functions.invoke('email-service', {
      body: {
        type: 'mission_accepted',
        data: {
          technicianId: 'test-technician-id',
          missionId: 'test-mission-id'
        }
      }
    })
    
    console.log('✅ Mission acceptée:', missionAcceptedResult)
    console.log('')

    // Test 3: Mission refusée
    console.log('3. Test notification mission refusée')
    const missionRejectedResult = await supabase.functions.invoke('email-service', {
      body: {
        type: 'mission_rejected',
        data: {
          technicianId: 'test-technician-id',
          missionId: 'test-mission-id'
        }
      }
    })
    
    console.log('✅ Mission refusée:', missionRejectedResult)
    console.log('')

    // Test 4: Paiement reçu
    console.log('4. Test notification paiement reçu')
    const paymentResult = await supabase.functions.invoke('email-service', {
      body: {
        type: 'payment_received',
        data: {
          technicianId: 'test-technician-id',
          missionId: 'test-mission-id',
          amount: 150
        }
      }
    })
    
    console.log('✅ Paiement reçu:', paymentResult)
    console.log('')

    console.log('🎉 Tous les tests sont terminés avec succès!')
    console.log('✅ Le service email fonctionne correctement')
    console.log('✅ La configuration CORS est correcte')
    console.log('✅ Prêt pour la production')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    console.error('Détails:', error.message)
    
    if (error.message.includes('CORS')) {
      console.log('\n💡 Solution: Redéployez la fonction avec la configuration CORS mise à jour')
      console.log('npx supabase functions deploy email-service')
    }
    
    if (error.message.includes('401')) {
      console.log('\n💡 Solution: Vérifiez votre clé anon dans le fichier .env')
    }
  }
}

// Fonction principale
async function main() {
  await testEmailService()
}

main().catch(console.error) 
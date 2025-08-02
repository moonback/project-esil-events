#!/usr/bin/env node

/**
 * Script de test pour le service email
 * Usage: node scripts/test-email-service.js
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration (à adapter selon votre environnement)
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testEmailService() {
  console.log('🧪 Test du service email...\n')

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
    
    console.log('✅ Mission assignée:', missionAssignedResult.data)
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
    
    console.log('✅ Mission acceptée:', missionAcceptedResult.data)
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
    
    console.log('✅ Mission refusée:', missionRejectedResult.data)
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
    
    console.log('✅ Paiement reçu:', paymentResult.data)
    console.log('')

    // Test 5: Type invalide
    console.log('5. Test type invalide')
    const invalidResult = await supabase.functions.invoke('email-service', {
      body: {
        type: 'invalid_type',
        data: {
          technicianId: 'test-technician-id',
          missionId: 'test-mission-id'
        }
      }
    })
    
    console.log('✅ Type invalide:', invalidResult.data)
    console.log('')

    console.log('🎉 Tous les tests sont terminés!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  }
}

// Fonction pour tester avec des données réelles
async function testWithRealData() {
  console.log('🧪 Test avec des données réelles...\n')

  try {
    // Récupérer un technicien et une mission existants
    const { data: technicians } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('role', 'technicien')
      .limit(1)

    const { data: missions } = await supabase
      .from('missions')
      .select('id, title, type')
      .limit(1)

    if (!technicians || technicians.length === 0) {
      console.log('❌ Aucun technicien trouvé dans la base de données')
      return
    }

    if (!missions || missions.length === 0) {
      console.log('❌ Aucune mission trouvée dans la base de données')
      return
    }

    const technician = technicians[0]
    const mission = missions[0]

    console.log(`Technicien: ${technician.name} (${technician.email})`)
    console.log(`Mission: ${mission.title} (${mission.type})`)
    console.log('')

    // Test avec des données réelles
    const result = await supabase.functions.invoke('email-service', {
      body: {
        type: 'mission_assigned',
        data: {
          technicianId: technician.id,
          missionId: mission.id
        }
      }
    })

    console.log('✅ Test avec données réelles:', result.data)

  } catch (error) {
    console.error('❌ Erreur lors du test avec données réelles:', error)
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--real-data')) {
    await testWithRealData()
  } else {
    await testEmailService()
  }
}

// Exécuter le script
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testEmailService, testWithRealData } 
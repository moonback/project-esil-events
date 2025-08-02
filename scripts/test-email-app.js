#!/usr/bin/env node

/**
 * Test qui simule l'appel de l'application
 */

import { createClient } from '@supabase/supabase-js'

// Configuration (remplacez par vos vraies valeurs)
const SUPABASE_URL = 'https://irpwesqvjrbehjithivz.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'VOTRE_CLE_ANON_ICI'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testEmailService() {
  console.log('🧪 Test du service email (simulation app)...\n')

  if (SUPABASE_ANON_KEY === 'VOTRE_CLE_ANON_ICI') {
    console.log('❌ Erreur: Veuillez configurer VITE_SUPABASE_ANON_KEY')
    console.log('Ou remplacez la valeur dans ce script')
    return
  }

  try {
    // Test 1: Mission assignée (comme dans AssignTechniciansDialog)
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

    // Test 2: Mission acceptée (comme dans ProposedMissionsTab)
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

    console.log('🎉 Tests terminés!')
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
    console.error('Détails:', error.message)
    
    if (error.message.includes('CORS')) {
      console.log('\n💡 Solution: La fonction a été mise à jour avec la configuration CORS correcte.')
      console.log('Redéployez la fonction: npx supabase functions deploy email-service')
    }
  }
}

// Fonction principale
async function main() {
  await testEmailService()
}

main().catch(console.error) 
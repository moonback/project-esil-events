#!/usr/bin/env node

/**
 * Test direct de la fonction email-service
 */

// Utiliser les vraies variables d'environnement
const SUPABASE_URL = 'https://irpwesqvjrbehjithivz.supabase.co'
// Note: Vous devrez remplacer cette clé par votre vraie clé anon
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'VOTRE_CLE_ANON_ICI'

async function testEmailFunction() {
  console.log('🧪 Test direct de la fonction email-service...\n')
  console.log('URL:', SUPABASE_URL)
  console.log('Clé anon configurée:', SUPABASE_ANON_KEY ? 'Oui' : 'Non')

  if (SUPABASE_ANON_KEY === 'VOTRE_CLE_ANON_ICI') {
    console.log('❌ Erreur: Veuillez configurer VITE_SUPABASE_ANON_KEY dans votre .env')
    console.log('Ou remplacez la valeur dans ce script par votre vraie clé anon')
    return
  }

  const testData = {
    type: 'mission_assigned',
    data: {
      technicianId: 'test-technician-id',
      missionId: 'test-mission-id'
    }
  }

  try {
    console.log('📤 Envoi de la requête...')
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/email-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-client-info': 'supabase-js/2.53.0'
      },
      body: JSON.stringify(testData)
    })

    console.log(`📊 Status: ${response.status}`)
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Réponse:', data)
    } else {
      const errorText = await response.text()
      console.log('❌ Erreur:', errorText)
    }

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
  }
}

// Test avec des données réelles si disponibles
async function testWithRealData() {
  console.log('\n🧪 Test avec des données réelles...\n')

  // Simuler des données réelles
  const realData = {
    type: 'mission_assigned',
    data: {
      technicianId: '12345678-1234-1234-1234-123456789012', // ID fictif
      missionId: '87654321-4321-4321-4321-210987654321'   // ID fictif
    }
  }

  try {
    console.log('📤 Envoi de la requête avec données réelles...')
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/email-service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'x-client-info': 'supabase-js/2.53.0'
      },
      body: JSON.stringify(realData)
    })

    console.log(`📊 Status: ${response.status}`)

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Réponse avec données réelles:', data)
    } else {
      const errorText = await response.text()
      console.log('❌ Erreur avec données réelles:', errorText)
    }

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message)
  }
}

// Fonction principale
async function main() {
  await testEmailFunction()
  await testWithRealData()
}

main().catch(console.error) 
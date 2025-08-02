#!/usr/bin/env node

/**
 * Test avec des données réelles de la base de données
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Charger les variables d'environnement
config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://irpwesqvjrbehjithivz.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_ANON_KEY) {
  console.log('❌ Erreur: VITE_SUPABASE_ANON_KEY non trouvée')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testWithRealData() {
  console.log('🧪 Test avec des données réelles de la base...\n')

  try {
    // Récupérer un technicien existant
    console.log('📋 Récupération des techniciens...')
    const { data: technicians, error: techError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'technicien')
      .limit(1)

    if (techError) {
      console.error('❌ Erreur lors de la récupération des techniciens:', techError)
      return
    }

    if (!technicians || technicians.length === 0) {
      console.log('❌ Aucun technicien trouvé dans la base de données')
      console.log('💡 Créez d\'abord un technicien via l\'interface admin')
      return
    }

    // Récupérer une mission existante
    console.log('📋 Récupération des missions...')
    const { data: missions, error: missionError } = await supabase
      .from('missions')
      .select('id, title, type, date_start, location, forfeit')
      .limit(1)

    if (missionError) {
      console.error('❌ Erreur lors de la récupération des missions:', missionError)
      return
    }

    if (!missions || missions.length === 0) {
      console.log('❌ Aucune mission trouvée dans la base de données')
      console.log('💡 Créez d\'abord une mission via l\'interface admin')
      return
    }

    const technician = technicians[0]
    const mission = missions[0]

    console.log(`✅ Technicien trouvé: ${technician.name} (${technician.email})`)
    console.log(`✅ Mission trouvée: ${mission.title} (${mission.type})`)
    console.log('')

    // Test avec des données réelles
    console.log('📧 Test notification mission assignée avec données réelles...')
    const result = await supabase.functions.invoke('email-service', {
      body: {
        type: 'mission_assigned',
        data: {
          technicianId: technician.id,
          missionId: mission.id
        }
      }
    })

    if (result.error) {
      console.log('❌ Erreur:', result.error.message)
      
      // Afficher plus de détails sur l'erreur
      if (result.response) {
        const errorText = await result.response.text()
        console.log('📋 Détails de l\'erreur:', errorText)
      }
    } else {
      console.log('✅ Succès:', result.data)
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  }
}

// Fonction principale
async function main() {
  await testWithRealData()
}

main().catch(console.error) 
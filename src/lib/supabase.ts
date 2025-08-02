import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Vérification des variables d'environnement
if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'votre_url_supabase' || 
    supabaseAnonKey === 'votre_clé_anonyme_supabase') {
  console.error('❌ Variables Supabase non configurées. Veuillez configurer VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local')
  throw new Error('Variables Supabase non configurées')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper pour vérifier si l'utilisateur est admin
export const isAdmin = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
    
  return userProfile?.role === 'admin'
}
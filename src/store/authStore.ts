import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { User as UserProfile } from '@/types/database'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, name: string, role: 'admin' | 'technicien') => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    try {
      // Vérifier la session actuelle
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Récupérer le profil utilisateur
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        set({
          user: session.user,
          profile,
          loading: false
        })
      } else {
        set({ loading: false })
      }

      // Écouter les changements d'authentification
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          set({
            user: session.user,
            profile,
            loading: false
          })
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            profile: null,
            loading: false
          })
        }
      })
    } catch (error) {
      console.error('Erreur d\'initialisation auth:', error)
      set({ loading: false })
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        set({
          user: data.user,
          profile,
          loading: false
        })
      }

      return {}
    } catch (error) {
      return { error: 'Erreur de connexion' }
    }
  },

  signUp: async (email: string, password: string, name: string, role: 'admin' | 'technicien') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        // Créer le profil utilisateur immédiatement
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert([{
              id: data.user.id,
              name,
              role
            }])

          if (profileError) {
            console.error('Erreur lors de la création du profil:', profileError)
            return { error: 'Erreur lors de la création du profil utilisateur' }
          }
        } catch (err) {
          console.error('Erreur lors de la création du profil:', err)
          return { error: 'Erreur lors de la création du profil utilisateur' }
        }
      }

      return {}
    } catch (error) {
      return { error: 'Erreur lors de l\'inscription' }
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut()
      set({
        user: null,
        profile: null,
        loading: false
      })
    } catch (error) {
      console.error('Erreur de déconnexion:', error)
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const { profile } = get()
    if (!profile) return

    try {
      const { data: updatedProfile } = await supabase
        .from('users')
        .update(data)
        .eq('id', profile.id)
        .select()
        .single()

      if (updatedProfile) {
        set({ profile: updatedProfile })
      }
    } catch (error) {
      console.error('Erreur de mise à jour du profil:', error)
    }
  }
}))
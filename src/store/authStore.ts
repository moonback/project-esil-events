import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { User as UserProfile } from '@/types/database'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  isAuthenticated: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, name: string, role: 'admin' | 'technicien') => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      loading: true,
      isAuthenticated: false,

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
              loading: false,
              isAuthenticated: true
            })
          } else {
            set({ 
              loading: false, 
              isAuthenticated: false,
              user: null,
              profile: null
            })
          }

          // Écouter les changements d'authentification
          supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change:', event, session?.user?.id)
            
            if (event === 'SIGNED_IN' && session?.user) {
              const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single()

              set({
                user: session.user,
                profile,
                loading: false,
                isAuthenticated: true
              })
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                profile: null,
                loading: false,
                isAuthenticated: false
              })
            }
          })
        } catch (error) {
          console.error('Erreur d\'initialisation auth:', error)
          set({ 
            loading: false, 
            isAuthenticated: false,
            user: null,
            profile: null
          })
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
              loading: false,
              isAuthenticated: true
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
              }
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
          console.log('Déconnexion en cours...')
          await supabase.auth.signOut()
          
          // Nettoyer immédiatement l'état local
          set({
            user: null,
            profile: null,
            loading: false,
            isAuthenticated: false
          })
          
          // Nettoyer les autres stores
          get().clearAuth()
          
          console.log('Déconnexion terminée')
        } catch (error) {
          console.error('Erreur de déconnexion:', error)
          // Même en cas d'erreur, nettoyer l'état local
          set({
            user: null,
            profile: null,
            loading: false,
            isAuthenticated: false
          })
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
      },

      clearAuth: () => {
        // Cette fonction sera utilisée pour nettoyer les autres stores
        console.log('Nettoyage de l\'état d\'authentification')
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        console.log('Auth store rehydrated:', state)
      }
    }
  )
)
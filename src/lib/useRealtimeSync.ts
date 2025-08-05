import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminStore } from '@/store/adminStore'
import { useMissionsStore } from '@/store/missionsStore'

export function useRealtimeSync() {
  const { refreshData, resetStore: resetAdminStore } = useAdminStore()
  const { refreshMissions, resetStore: resetMissionsStore } = useMissionsStore()
  const isSubscribed = useRef(false)

  useEffect(() => {
    if (isSubscribed.current) return

    isSubscribed.current = true

    // Écouter les changements sur les missions
    const missionsSubscription = supabase
      .channel('missions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'missions'
        },
        (payload) => {
          console.log('Changement détecté sur les missions:', payload.eventType)
          refreshMissions()
        }
      )
      .subscribe()

    // Écouter les changements sur les assignations de missions
    const assignmentsSubscription = supabase
      .channel('mission_assignments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mission_assignments'
        },
        (payload) => {
          console.log('Changement détecté sur les assignations:', payload.eventType)
          // Rafraîchir immédiatement les missions quand les assignations changent
          refreshMissions()
        }
      )
      .subscribe()

    // Écouter les changements sur les utilisateurs (techniciens)
    const usersSubscription = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('Changement détecté sur les utilisateurs:', payload.eventType)
          refreshData()
        }
      )
      .subscribe()

    // Écouter les changements sur les facturations
    const billingSubscription = supabase
      .channel('billing_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'billing'
        },
        (payload) => {
          console.log('Changement détecté sur les facturations:', payload.eventType)
          refreshData()
        }
      )
      .subscribe()

    // Écouter les changements sur les disponibilités
    const availabilitySubscription = supabase
      .channel('availability_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'availability'
        },
        (payload) => {
          console.log('Changement détecté sur les disponibilités:', payload.eventType)
          refreshData()
        }
      )
      .subscribe()

    // Écouter les changements d'authentification
    const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Changement d\'authentification détecté:', event)
      
      if (event === 'SIGNED_OUT') {
        // Nettoyer les stores lors de la déconnexion
        resetAdminStore()
        resetMissionsStore()
      }
    })

    return () => {
      isSubscribed.current = false
      supabase.removeChannel(missionsSubscription)
      supabase.removeChannel(assignmentsSubscription)
      supabase.removeChannel(usersSubscription)
      supabase.removeChannel(billingSubscription)
      supabase.removeChannel(availabilitySubscription)
      
      // Nettoyer l'écouteur d'authentification
      if (authSubscription.data.subscription) {
        authSubscription.data.subscription.unsubscribe()
      }
    }
  }, [refreshData, refreshMissions, resetAdminStore, resetMissionsStore])

  return {
    isSubscribed: isSubscribed.current
  }
} 
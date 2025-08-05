import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminStore } from '@/store/adminStore'

export function useRealtimeSync() {
  const { refreshData, refreshMissions } = useAdminStore()
  const isSubscribed = useRef(false)
  const lastRefreshTime = useRef<{ [key: string]: number }>({})

  useEffect(() => {
    if (isSubscribed.current) {
      console.log('🔄 useRealtimeSync: Déjà souscrit, ignoré')
      return
    }

    isSubscribed.current = true
    console.log('🔄 Initialisation de la synchronisation en temps réel')

    // Fonction helper pour éviter les appels trop fréquents
    const debouncedRefresh = (key: string, refreshFn: () => void) => {
      const now = Date.now()
      const lastTime = lastRefreshTime.current[key] || 0
      if (now - lastTime > 1000) { // Debounce de 1 seconde
        console.log(`🔄 Changement détecté sur ${key}`)
        lastRefreshTime.current[key] = now
        refreshFn()
      }
    }

    // Écouter les changements sur les missions
    const missionsSubscription = supabase
      .channel('missions_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'missions' },
        (payload) => {
          console.log('🔄 Changement détecté sur les missions:', payload.eventType)
          debouncedRefresh('missions', refreshMissions)
        }
      )
      .subscribe()

    // Écouter les changements sur les assignations de missions
    const assignmentsSubscription = supabase
      .channel('mission_assignments_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mission_assignments' },
        (payload) => {
          console.log('🔄 Changement détecté sur les assignations:', payload.eventType)
          debouncedRefresh('assignments', refreshMissions)
        }
      )
      .subscribe()

    // Écouter les changements sur les utilisateurs (techniciens)
    const usersSubscription = supabase
      .channel('users_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('🔄 Changement détecté sur les utilisateurs:', payload.eventType)
          debouncedRefresh('users', refreshData)
        }
      )
      .subscribe()

    // Écouter les changements sur les facturations
    const billingSubscription = supabase
      .channel('billing_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'billing' },
        (payload) => {
          console.log('🔄 Changement détecté sur les facturations:', payload.eventType)
          debouncedRefresh('billing', refreshData)
        }
      )
      .subscribe()

    // Écouter les changements sur les disponibilités
    const availabilitySubscription = supabase
      .channel('availability_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'availability' },
        (payload) => {
          console.log('🔄 Changement détecté sur les disponibilités:', payload.eventType)
          debouncedRefresh('availability', refreshData)
        }
      )
      .subscribe()

    // Écouter les changements sur les indisponibilités
    const unavailabilitySubscription = supabase
      .channel('unavailability_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'unavailability' },
        (payload) => {
          console.log('🔄 Changement détecté sur les indisponibilités:', payload.eventType)
          debouncedRefresh('unavailability', refreshData)
        }
      )
      .subscribe()

    return () => {
      console.log('🔄 Nettoyage de la synchronisation en temps réel')
      isSubscribed.current = false
      supabase.removeChannel(missionsSubscription)
      supabase.removeChannel(assignmentsSubscription)
      supabase.removeChannel(usersSubscription)
      supabase.removeChannel(billingSubscription)
      supabase.removeChannel(availabilitySubscription)
      supabase.removeChannel(unavailabilitySubscription)
    }
  }, []) // Suppression des dépendances qui causaient les re-rendus infinis

  return { isSubscribed: isSubscribed.current }
} 
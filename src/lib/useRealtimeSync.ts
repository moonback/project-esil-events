import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminStore } from '@/store/adminStore'

export function useRealtimeSync() {
  const { refreshData, refreshMissions } = useAdminStore()
  const isSubscribed = useRef(false)
  const lastRefreshTime = useRef<{ [key: string]: number }>({})

  useEffect(() => {
    if (isSubscribed.current) {
      return
    }

    isSubscribed.current = true

    // Fonction helper pour éviter les appels trop fréquents
    const debouncedRefresh = (key: string, refreshFn: () => void) => {
      const now = Date.now()
      const lastTime = lastRefreshTime.current[key] || 0
      if (now - lastTime > 1000) { // Debounce de 1 seconde
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
          debouncedRefresh('unavailability', refreshData)
        }
      )
      .subscribe()

    return () => {
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
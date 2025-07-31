import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminStore } from '@/store/adminStore'

export function useRealtimeSync() {
  const { refreshData } = useAdminStore()
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
        () => {
          console.log('Changement détecté sur les missions')
          refreshData()
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
        () => {
          console.log('Changement détecté sur les assignations')
          refreshData()
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
        () => {
          console.log('Changement détecté sur les utilisateurs')
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
        () => {
          console.log('Changement détecté sur les facturations')
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
        () => {
          console.log('Changement détecté sur les disponibilités')
          refreshData()
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
    }
  }, [refreshData])

  return {
    isSubscribed: isSubscribed.current
  }
} 
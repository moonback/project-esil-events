import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, BillingWithDetails, MissionWithAssignments } from '@/types/database'

interface AdminState {
  // États de chargement
  loading: {
    missions: boolean
    technicians: boolean
    billings: boolean
  }
  
  // Données
  missions: MissionWithAssignments[]
  technicians: User[]
  billings: BillingWithDetails[]
  
  // Synchronisation
  lastSync: Date | null
  isConnected: boolean
  
  // Statistiques
  stats: {
    missions: {
      total: number
      byType: Record<string, number>
      totalRevenue: number
      assignedCount: number
    }
    technicians: {
      total: number
      available: number
      busy: number
    }
    billings: {
      totalAmount: number
      pendingAmount: number
      validatedAmount: number
      paidAmount: number
    }
  }
  
  // Actions
  fetchAllData: () => Promise<void>
  fetchMissions: () => Promise<void>
  fetchTechnicians: () => Promise<void>
  fetchBillings: () => Promise<void>
  refreshData: () => Promise<void>
  refreshMissions: () => Promise<void>
  clearData: () => void
  setConnectionStatus: (isConnected: boolean) => void
}

export const useAdminStore = create<AdminState>((set, get) => ({
  loading: {
    missions: false,
    technicians: false,
    billings: false
  },
  
  missions: [],
  technicians: [],
  billings: [],
  
  // Synchronisation
  lastSync: null,
  isConnected: true,
  
  stats: {
    missions: {
      total: 0,
      byType: {},
      totalRevenue: 0,
      assignedCount: 0
    },
    technicians: {
      total: 0,
      available: 0,
      busy: 0
    },
    billings: {
      totalAmount: 0,
      pendingAmount: 0,
      validatedAmount: 0,
      paidAmount: 0
    }
  },

  fetchAllData: async () => {
    set(state => ({
      loading: {
        missions: true,
        technicians: true,
        billings: true
      }
    }))

    try {
      await Promise.all([
        get().fetchMissions(),
        get().fetchTechnicians(),
        get().fetchBillings()
      ])
      
      set({ lastSync: new Date() })
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  },

  fetchMissions: async () => {
    set(state => ({ loading: { ...state.loading, missions: true } }))
    
    try {
      const { data, error } = await supabase
        .from('missions')
        .select(`
          *,
          mission_assignments (
            *,
            users (*)
          )
        `)
        .order('date_start', { ascending: true })

      if (error) throw error

      const missions = data || []
      
      // Calculer les statistiques
      const stats = {
        total: missions.length,
        byType: missions.reduce((acc, mission) => {
          acc[mission.type] = (acc[mission.type] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        totalRevenue: missions.reduce((sum, mission) => sum + mission.forfeit, 0),
        assignedCount: missions.filter(m => m.mission_assignments?.length > 0).length
      }

      set(state => ({
        missions,
        loading: { ...state.loading, missions: false },
        stats: { ...state.stats, missions: stats }
      }))
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error)
      set(state => ({ 
        loading: { ...state.loading, missions: false },
        missions: []
      }))
    }
  },

  fetchTechnicians: async () => {
    set(state => ({ loading: { ...state.loading, technicians: true } }))
    
    try {
      // Récupérer les techniciens avec leurs statistiques
      const { data: technicians, error: techError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'technicien')
        .order('name')

      if (techError) throw techError

      // Récupérer les assignations de missions pour calculer les statistiques
      const { data: assignments, error: assignError } = await supabase
        .from('mission_assignments')
        .select(`
          *,
          missions (
            id,
            title,
            date_start,
            date_end,
            forfeit,
            type
          ),
          users (
            id,
            name
          )
        `)

      if (assignError) throw assignError

      // Récupérer les facturations
      const { data: billings, error: billingError } = await supabase
        .from('billing')
        .select(`
          *,
          missions (
            id,
            title,
            date_start,
            date_end
          ),
          users (
            id,
            name
          )
        `)

      if (billingError) throw billingError

      // Récupérer les disponibilités
      const { data: availabilities, error: availError } = await supabase
        .from('availability')
        .select('*')
        .order('start_time', { ascending: true })

      if (availError) throw availError

      // Calculer les statistiques pour chaque technicien
      const techniciansWithStats = technicians.map(tech => {
        const techAssignments = assignments.filter(assign => assign.technician_id === tech.id)
        const techBillings = billings.filter(billing => billing.technician_id === tech.id)
        const techAvailabilities = availabilities.filter(avail => avail.technician_id === tech.id)

        // Calculer les statistiques des missions
        const totalAssignments = techAssignments.length
        const acceptedAssignments = techAssignments.filter(a => a.status === 'accepté').length
        const pendingAssignments = techAssignments.filter(a => a.status === 'proposé').length
        const rejectedAssignments = techAssignments.filter(a => a.status === 'refusé').length

        // Calculer les revenus totaux
        const totalRevenue = techBillings.reduce((sum, billing) => sum + billing.amount, 0)

        // Calculer les heures totales (approximation basée sur les missions acceptées)
        const totalHours = techAssignments
          .filter(a => a.status === 'accepté')
          .reduce((sum, assignment) => {
            if (assignment.missions?.date_start && assignment.missions?.date_end) {
              const start = new Date(assignment.missions.date_start)
              const end = new Date(assignment.missions.date_end)
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
              return sum + Math.max(0, hours)
            }
            return sum + 4 // Valeur par défaut de 4 heures si pas de dates
          }, 0)

        // Calculer la note moyenne (pour l'instant, valeur par défaut)
        const averageRating = 4.2 // À améliorer quand on aura un système de notation

        return {
          ...tech,
          stats: {
            totalAssignments,
            acceptedAssignments,
            pendingAssignments,
            rejectedAssignments,
            totalRevenue,
            averageRating,
            totalHours: Math.round(totalHours),
            availabilityCount: techAvailabilities.length
          },
          recentMissions: techAssignments
            .filter(a => a.status === 'accepté')
            .slice(0, 5)
            .map(assignment => ({
              ...assignment.missions,
              assignment
            })),
          availabilities: techAvailabilities,
          billings: techBillings
        }
      })

      // Calculer les statistiques globales
      const stats = {
        total: techniciansWithStats.length,
        available: techniciansWithStats.filter(t => t.stats.availabilityCount > 0).length,
        busy: techniciansWithStats.filter(t => t.stats.totalAssignments > 0).length
      }

      set(state => ({
        technicians: techniciansWithStats,
        loading: { ...state.loading, technicians: false },
        stats: { ...state.stats, technicians: stats }
      }))
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens:', error)
      set(state => ({ 
        loading: { ...state.loading, technicians: false },
        technicians: []
      }))
    }
  },

  fetchBillings: async () => {
    set(state => ({ loading: { ...state.loading, billings: true } }))
    
    try {
      const { data, error } = await supabase
        .from('billing')
        .select(`
          *,
          missions (
            title,
            type,
            date_start,
            date_end
          ),
          users (
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const billings = data as BillingWithDetails[] || []
      
      // Calculer les statistiques
      const stats = billings.reduce((acc, billing) => {
        acc.totalAmount += billing.amount
        
        switch (billing.status) {
          case 'en_attente':
            acc.pendingAmount += billing.amount
            break
          case 'validé':
            acc.validatedAmount += billing.amount
            break
          case 'payé':
            acc.paidAmount += billing.amount
            break
        }
        
        return acc
      }, {
        totalAmount: 0,
        pendingAmount: 0,
        validatedAmount: 0,
        paidAmount: 0
      })

      set(state => ({
        billings,
        loading: { ...state.loading, billings: false },
        stats: { ...state.stats, billings: stats }
      }))
    } catch (error) {
      console.error('Erreur lors du chargement des facturations:', error)
      set(state => ({ 
        loading: { ...state.loading, billings: false },
        billings: []
      }))
    }
  },

  refreshData: async () => {
    await get().fetchAllData()
  },

  refreshMissions: async () => {
    await get().fetchMissions()
  },

  clearData: () => {
    set({
      missions: [],
      technicians: [],
      billings: [],
      loading: {
        missions: false,
        technicians: false,
        billings: false
      },
      lastSync: null,
      isConnected: true,
      stats: {
        missions: {
          total: 0,
          byType: {},
          totalRevenue: 0,
          assignedCount: 0
        },
        technicians: {
          total: 0,
          available: 0,
          busy: 0
        },
        billings: {
          totalAmount: 0,
          pendingAmount: 0,
          validatedAmount: 0,
          paidAmount: 0
        }
      }
    })
  },

  setConnectionStatus: (isConnected: boolean) => {
    set({ isConnected })
  }
})) 
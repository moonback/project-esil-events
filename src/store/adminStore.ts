import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User, BillingWithDetails, MissionWithAssignments, TechnicianWithStats } from '@/types/database'

interface AdminState {
  // États de chargement
  loading: {
    missions: boolean
    technicians: boolean
    billings: boolean
  }
  
  // Données
  missions: MissionWithAssignments[]
  technicians: TechnicianWithStats[]
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
  deleteAllMissions: () => Promise<void>
  createTestMissions: () => Promise<void>
  setConnectionStatus: (isConnected: boolean) => void
  validateTechnician: (technicianId: string, isValidated: boolean) => Promise<void>
  cancelPendingAssignments: (missionId: string) => Promise<void>
  deleteTechnician: (technicianId: string) => Promise<void>
  resetStore: () => void
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
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

          set({
            lastSync: new Date(),
            loading: {
              missions: false,
              technicians: false,
              billings: false
            }
          })
        } catch (error) {
          console.error('Erreur lors du chargement des données:', error)
          set({
            loading: {
              missions: false,
              technicians: false,
              billings: false
            }
          })
        }
      },

      fetchMissions: async () => {
        set(state => ({
          loading: { ...state.loading, missions: true }
        }))

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

          set(state => ({
            missions: data || [],
            loading: { ...state.loading, missions: false }
          }))
        } catch (error) {
          console.error('Erreur lors du chargement des missions:', error)
          set(state => ({
            loading: { ...state.loading, missions: false }
          }))
        }
      },

      fetchTechnicians: async () => {
        set(state => ({
          loading: { ...state.loading, technicians: true }
        }))

        try {
          const { data, error } = await supabase
            .from('users')
            .select(`
              *,
              mission_assignments (
                *,
                missions (*)
              )
            `)
            .eq('role', 'technicien')
            .order('name', { ascending: true })

          if (error) throw error

          // Calculer les statistiques pour chaque technicien
          const techniciansWithStats = (data || []).map(technician => {
            const assignments = technician.mission_assignments || []
            const completedMissions = assignments.filter(a => a.status === 'completed').length
            const pendingMissions = assignments.filter(a => a.status === 'pending').length
            const totalRevenue = assignments
              .filter(a => a.status === 'completed')
              .reduce((sum, a) => sum + (a.missions?.forfeit || 0), 0)

            return {
              ...technician,
              stats: {
                completedMissions,
                pendingMissions,
                totalRevenue
              }
            }
          })

          set(state => ({
            technicians: techniciansWithStats,
            loading: { ...state.loading, technicians: false }
          }))
        } catch (error) {
          console.error('Erreur lors du chargement des techniciens:', error)
          set(state => ({
            loading: { ...state.loading, technicians: false }
          }))
        }
      },

      fetchBillings: async () => {
        set(state => ({
          loading: { ...state.loading, billings: true }
        }))

        try {
          const { data, error } = await supabase
            .from('billing')
            .select(`
              *,
              missions (*),
              users (*)
            `)
            .order('created_at', { ascending: false })

          if (error) throw error

          set(state => ({
            billings: data || [],
            loading: { ...state.loading, billings: false }
          }))
        } catch (error) {
          console.error('Erreur lors du chargement des facturations:', error)
          set(state => ({
            loading: { ...state.loading, billings: false }
          }))
        }
      },

      refreshData: async () => {
        console.log('Actualisation des données...')
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
          lastSync: null,
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

      deleteAllMissions: async () => {
        try {
          const { error } = await supabase
            .from('missions')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000')

          if (error) throw error

          set({ missions: [] })
          console.log('Toutes les missions ont été supprimées')
        } catch (error) {
          console.error('Erreur lors de la suppression des missions:', error)
        }
      },

      createTestMissions: async () => {
        const testMissions = [
          {
            title: 'Installation système son',
            description: 'Installation complète du système de son pour l\'événement',
            location: 'Salle de conférence A',
            date_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            date_end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
            forfeit: 500,
            type: 'installation',
            required_people: 2
          },
          {
            title: 'Maintenance éclairage',
            description: 'Maintenance préventive du système d\'éclairage',
            location: 'Salle principale',
            date_start: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            date_end: new Date(Date.now() + 48 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
            forfeit: 300,
            type: 'maintenance',
            required_people: 1
          }
        ]

        try {
          const { data, error } = await supabase
            .from('missions')
            .insert(testMissions)
            .select()

          if (error) throw error

          console.log('Missions de test créées:', data)
          await get().fetchMissions()
        } catch (error) {
          console.error('Erreur lors de la création des missions de test:', error)
        }
      },

      setConnectionStatus: (isConnected: boolean) => {
        set({ isConnected })
      },

      validateTechnician: async (technicianId: string, isValidated: boolean) => {
        try {
          const { error } = await supabase
            .from('users')
            .update({ is_validated: isValidated })
            .eq('id', technicianId)

          if (error) throw error

          // Rafraîchir la liste des techniciens
          await get().fetchTechnicians()
        } catch (error) {
          console.error('Erreur lors de la validation du technicien:', error)
        }
      },

      cancelPendingAssignments: async (missionId: string) => {
        try {
          const { error } = await supabase
            .from('mission_assignments')
            .update({ status: 'cancelled' })
            .eq('mission_id', missionId)
            .eq('status', 'pending')

          if (error) throw error

          // Rafraîchir les données
          await get().fetchMissions()
        } catch (error) {
          console.error('Erreur lors de l\'annulation des assignations:', error)
        }
      },

      deleteTechnician: async (technicianId: string) => {
        try {
          // Supprimer d'abord les assignations
          const { error: assignmentsError } = await supabase
            .from('mission_assignments')
            .delete()
            .eq('user_id', technicianId)

          if (assignmentsError) throw assignmentsError

          // Supprimer le technicien
          const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', technicianId)

          if (error) throw error

          // Rafraîchir la liste
          await get().fetchTechnicians()
        } catch (error) {
          console.error('Erreur lors de la suppression du technicien:', error)
        }
      },

      resetStore: () => {
        set({
          missions: [],
          technicians: [],
          billings: [],
          lastSync: null,
          isConnected: true,
          loading: {
            missions: false,
            technicians: false,
            billings: false
          },
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
      }
    }),
    {
      name: 'admin-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        missions: state.missions,
        technicians: state.technicians,
        billings: state.billings,
        lastSync: state.lastSync ? state.lastSync.toISOString() : null,
        stats: state.stats
      }),
      onRehydrateStorage: () => (state) => {
        // Convertir la chaîne de date en objet Date lors de la réhydratation
        if (state && state.lastSync && typeof state.lastSync === 'string') {
          state.lastSync = new Date(state.lastSync)
        }
        console.log('Admin store rehydrated:', state)
      }
    }
  )
) 
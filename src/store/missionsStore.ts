import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { Mission, MissionWithAssignments, MissionAssignment } from '@/types/database'

interface MissionsState {
  missions: MissionWithAssignments[]
  loading: boolean
  error: string | null
  fetchMissions: () => Promise<void>
  createMission: (mission: Omit<Mission, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<void>
  updateMission: (id: string, data: Partial<Mission>) => Promise<void>
  deleteMission: (id: string) => Promise<void>
  assignTechnicians: (missionId: string, technicianIds: string[]) => Promise<void>
  updateAssignmentStatus: (assignmentId: string, status: MissionAssignment['status']) => Promise<void>
  cancelPendingAssignmentsForMission: (missionId: string) => Promise<void>
  clearError: () => void
  resetStore: () => void
  refreshMissions: () => Promise<void>
}

export const useMissionsStore = create<MissionsState>()(
  persist(
    (set, get) => ({
      missions: [],
      loading: false,
      error: null,

      fetchMissions: async () => {
        set({ loading: true, error: null })
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

          set({ missions: data || [], loading: false })
        } catch (error) {
          console.error('Erreur lors du chargement des missions:', error)
          set({ 
            loading: false, 
            error: 'Erreur lors du chargement des missions. Veuillez réessayer.' 
          })
        }
      },

      refreshMissions: async () => {
        console.log('Rafraîchissement des missions...')
        await get().fetchMissions()
      },

      createMission: async (missionData) => {
        set({ loading: true, error: null })
        try {
          // Validation côté client
          if (!missionData.title?.trim()) {
            throw new Error('Le titre de la mission est requis')
          }
          if (!missionData.location?.trim()) {
            throw new Error('Le lieu de la mission est requis')
          }
          if (missionData.forfeit <= 0) {
            throw new Error('Le forfait doit être supérieur à 0')
          }
          if (!missionData.date_start || !missionData.date_end) {
            throw new Error('Les dates de début et de fin sont requises')
          }
          
          const startDate = new Date(missionData.date_start)
          const endDate = new Date(missionData.date_end)
          
          if (startDate >= endDate) {
            throw new Error('La date de fin doit être postérieure à la date de début')
          }
          if (startDate < new Date()) {
            throw new Error('La date de début ne peut pas être dans le passé')
          }

          const { data: { user } } = await supabase.auth.getUser()
          
          const { data, error } = await supabase
            .from('missions')
            .insert([{
              ...missionData,
              created_by: user?.id
            }])
            .select()
            .single()

          if (error) throw error

          console.log('Mission created:', data)
          
          // Rafraîchir la liste
          get().fetchMissions()
          
          return data
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de la mission'
          console.error('Erreur lors de la création de la mission:', error)
          set({ 
            loading: false, 
            error: errorMessage 
          })
          throw error
        }
      },

      updateMission: async (id: string, data: Partial<Mission>) => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase
            .from('missions')
            .update(data)
            .eq('id', id)

          if (error) throw error

          // Rafraîchir la liste
          get().fetchMissions()
        } catch (error) {
          console.error('Erreur lors de la mise à jour de la mission:', error)
          set({ 
            loading: false, 
            error: 'Erreur lors de la mise à jour de la mission' 
          })
        }
      },

      deleteMission: async (id: string) => {
        set({ loading: true, error: null })
        try {
          // Supprimer d'abord les assignations
          const { error: assignmentsError } = await supabase
            .from('mission_assignments')
            .delete()
            .eq('mission_id', id)

          if (assignmentsError) throw assignmentsError

          // Supprimer la mission
          const { error } = await supabase
            .from('missions')
            .delete()
            .eq('id', id)

          if (error) throw error

          // Rafraîchir la liste
          get().fetchMissions()
        } catch (error) {
          console.error('Erreur lors de la suppression de la mission:', error)
          set({ 
            loading: false, 
            error: 'Erreur lors de la suppression de la mission' 
          })
        }
      },

      assignTechnicians: async (missionId: string, technicianIds: string[]) => {
        set({ loading: true, error: null })
        try {
          const assignments = technicianIds.map(technicianId => ({
            mission_id: missionId,
            user_id: technicianId,
            status: 'pending'
          }))

          const { error } = await supabase
            .from('mission_assignments')
            .insert(assignments)

          if (error) throw error

          // Rafraîchir la liste immédiatement
          await get().fetchMissions()
        } catch (error) {
          console.error('Erreur lors de l\'assignation des techniciens:', error)
          set({ 
            loading: false, 
            error: 'Erreur lors de l\'assignation des techniciens' 
          })
        }
      },

      updateAssignmentStatus: async (assignmentId: string, status: MissionAssignment['status']) => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase
            .from('mission_assignments')
            .update({ 
              status,
              responded_at: new Date().toISOString()
            })
            .eq('id', assignmentId)

          if (error) throw error

          // Rafraîchir la liste immédiatement
          await get().fetchMissions()
        } catch (error) {
          console.error('Erreur lors de la mise à jour du statut:', error)
          set({ 
            loading: false, 
            error: 'Erreur lors de la mise à jour du statut' 
          })
        }
      },

      cancelPendingAssignmentsForMission: async (missionId: string) => {
        set({ loading: true, error: null })
        try {
          const { error } = await supabase
            .from('mission_assignments')
            .update({ 
              status: 'cancelled',
              responded_at: new Date().toISOString()
            })
            .eq('mission_id', missionId)
            .eq('status', 'pending')

          if (error) throw error

          // Rafraîchir la liste immédiatement
          await get().fetchMissions()
        } catch (error) {
          console.error('Erreur lors de l\'annulation des assignations:', error)
          set({ 
            loading: false, 
            error: 'Erreur lors de l\'annulation des assignations' 
          })
        }
      },

      clearError: () => {
        set({ error: null })
      },

      resetStore: () => {
        set({
          missions: [],
          loading: false,
          error: null
        })
      }
    }),
    {
      name: 'missions-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        missions: state.missions
      }),
      onRehydrateStorage: () => (state) => {
        console.log('Missions store rehydrated:', state)
      }
    }
  )
)
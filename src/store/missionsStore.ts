import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Mission, MissionWithAssignments, MissionAssignment } from '@/types/database'

interface MissionsState {
  missions: MissionWithAssignments[]
  loading: boolean
  fetchMissions: () => Promise<void>
  createMission: (mission: Omit<Mission, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<void>
  updateMission: (id: string, data: Partial<Mission>) => Promise<void>
  deleteMission: (id: string) => Promise<void>
  assignTechnicians: (missionId: string, technicianIds: string[]) => Promise<void>
  updateAssignmentStatus: (assignmentId: string, status: MissionAssignment['status']) => Promise<void>
}

export const useMissionsStore = create<MissionsState>((set, get) => ({
  missions: [],
  loading: false,

  fetchMissions: async () => {
    set({ loading: true })
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
      set({ loading: false })
    }
  },

  createMission: async (missionData) => {
    try {
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
      console.error('Erreur lors de la création de la mission:', error)
      throw error
    }
  },

  updateMission: async (id, data) => {
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
      throw error
    }
  },

  deleteMission: async (id) => {
    try {
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Rafraîchir la liste
      get().fetchMissions()
    } catch (error) {
      console.error('Erreur lors de la suppression de la mission:', error)
      throw error
    }
  },

  assignTechnicians: async (missionId, technicianIds) => {
    try {
      // Supprimer les anciennes assignations
      await supabase
        .from('mission_assignments')
        .delete()
        .eq('mission_id', missionId)

      // Créer les nouvelles assignations
      const assignments = technicianIds.map(technicianId => ({
        mission_id: missionId,
        technician_id: technicianId,
        status: 'proposé' as const
      }))

      const { error } = await supabase
        .from('mission_assignments')
        .insert(assignments)

      if (error) throw error

      // Rafraîchir la liste
      get().fetchMissions()
    } catch (error) {
      console.error('Erreur lors de l\'assignation des techniciens:', error)
      throw error
    }
  },

  updateAssignmentStatus: async (assignmentId, status) => {
    try {
      const { error } = await supabase
        .from('mission_assignments')
        .update({ 
          status,
          responded_at: new Date().toISOString()
        })
        .eq('id', assignmentId)

      if (error) throw error

      // Rafraîchir la liste
      get().fetchMissions()
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      throw error
    }
  }
}))
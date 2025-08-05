import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Mission, MissionWithAssignments, MissionAssignment } from '@/types/database'

interface MissionsState {
  missions: MissionWithAssignments[]
  loading: boolean
  error: string | null
  lastFetched: number | null
  cacheValid: boolean
  fetchMissions: (force?: boolean) => Promise<void>
  createMission: (mission: Omit<Mission, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<void>
  updateMission: (id: string, data: Partial<Mission>) => Promise<void>
  deleteMission: (id: string) => Promise<void>
  assignTechnicians: (missionId: string, technicianIds: string[]) => Promise<void>
  updateAssignmentStatus: (assignmentId: string, status: MissionAssignment['status']) => Promise<void>
  cancelPendingAssignmentsForMission: (missionId: string) => Promise<void>
  clearError: () => void
  invalidateCache: () => void
  isDataStale: () => boolean
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useMissionsStore = create<MissionsState>((set, get) => ({
  missions: [],
  loading: false,
  error: null,
  lastFetched: null,
  cacheValid: false,

  isDataStale: () => {
    const { lastFetched } = get()
    if (!lastFetched) return true
    return Date.now() - lastFetched > CACHE_DURATION
  },

  invalidateCache: () => {
    set({ cacheValid: false, lastFetched: null })
  },

  fetchMissions: async (force = false) => {
    const { cacheValid, isDataStale } = get()
    
    // Si les données sont en cache et pas expirées, ne pas recharger
    if (!force && cacheValid && !isDataStale()) {
      console.log('📊 Utilisation du cache pour les missions')
      return
    }

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

      set({ 
        missions: data || [], 
        loading: false, 
        lastFetched: Date.now(),
        cacheValid: true
      })
      console.log('📊 Missions chargées et mises en cache')
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error)
      set({ 
        loading: false, 
        error: 'Erreur lors du chargement des missions. Veuillez réessayer.' 
      })
    }
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
      
      // Invalider le cache et rafraîchir la liste
      get().invalidateCache()
      get().fetchMissions(true)
      
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

  updateMission: async (id, data) => {
    set({ loading: true, error: null })
    try {
      // Validation côté client pour les mises à jour
      if (data.title !== undefined && !data.title.trim()) {
        throw new Error('Le titre de la mission est requis')
      }
      if (data.location !== undefined && !data.location.trim()) {
        throw new Error('Le lieu de la mission est requis')
      }
      if (data.forfeit !== undefined && data.forfeit <= 0) {
        throw new Error('Le forfait doit être supérieur à 0')
      }
      if (data.date_start && data.date_end) {
        const startDate = new Date(data.date_start)
        const endDate = new Date(data.date_end)
        
        if (startDate >= endDate) {
          throw new Error('La date de fin doit être postérieure à la date de début')
        }
      }

      const { error } = await supabase
        .from('missions')
        .update(data)
        .eq('id', id)

      if (error) throw error

      // Invalider le cache et rafraîchir la liste
      get().invalidateCache()
      get().fetchMissions(true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la mission'
      console.error('Erreur lors de la mise à jour de la mission:', error)
      set({ 
        loading: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  deleteMission: async (id) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Invalider le cache et rafraîchir la liste
      get().invalidateCache()
      get().fetchMissions(true)
    } catch (error) {
      console.error('Erreur lors de la suppression de la mission:', error)
      set({ 
        loading: false, 
        error: 'Erreur lors de la suppression de la mission. Veuillez réessayer.' 
      })
      throw error
    }
  },

  assignTechnicians: async (missionId, technicianIds) => {
    set({ loading: true, error: null })
    try {
      // Supprimer les anciennes assignations
      await supabase
        .from('mission_assignments')
        .delete()
        .eq('mission_id', missionId)

      // Créer les nouvelles assignations
      if (technicianIds.length > 0) {
        const assignments = technicianIds.map(technicianId => ({
          mission_id: missionId,
          technician_id: technicianId,
          status: 'proposé' as const
        }))

        const { error } = await supabase
          .from('mission_assignments')
          .insert(assignments)

        if (error) throw error
      }

      // Invalider le cache et rafraîchir la liste
      get().invalidateCache()
      get().fetchMissions(true)
    } catch (error) {
      console.error('Erreur lors de l\'assignation des techniciens:', error)
      set({ 
        loading: false, 
        error: 'Erreur lors de l\'assignation des techniciens. Veuillez réessayer.' 
      })
      throw error
    }
  },

  updateAssignmentStatus: async (assignmentId, status) => {
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

      // Invalider le cache et rafraîchir la liste
      get().invalidateCache()
      get().fetchMissions(true)
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      set({ 
        loading: false, 
        error: 'Erreur lors de la mise à jour du statut. Veuillez réessayer.' 
      })
      throw error
    }
  },

  clearError: () => {
    set({ error: null })
  },

  cancelPendingAssignmentsForMission: async (missionId: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('mission_assignments')
        .update({ 
          status: 'refusé',
          responded_at: new Date().toISOString(),
          cancelled_by_admin: true
        })
        .eq('mission_id', missionId)
        .eq('status', 'proposé')

      if (error) throw error

      // Invalider le cache et rafraîchir la liste
      get().invalidateCache()
      get().fetchMissions(true)
    } catch (error) {
      console.error('Erreur lors de l\'annulation des demandes en attente:', error)
      set({ 
        loading: false, 
        error: 'Erreur lors de l\'annulation des demandes en attente. Veuillez réessayer.' 
      })
      throw error
    }
  }
}))
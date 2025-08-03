import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { Vehicle, VehicleStatus, VehicleType } from '../types/database'

interface VehiclesState {
  vehicles: Vehicle[]
  loading: boolean
  error: string | null
  
  // Actions
  fetchVehicles: () => Promise<void>
  fetchAvailableVehicles: () => Promise<Vehicle[]>
  createVehicle: (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>
  deleteVehicle: (id: string) => Promise<void>
  assignVehicleToMission: (missionId: string, vehicleId: string, notes?: string) => Promise<void>
  unassignVehicleFromMission: (missionId: string, vehicleId: string) => Promise<void>
  getMissionVehicles: (missionId: string) => Promise<Vehicle[]>
  clearError: () => void
}

export const useVehiclesStore = create<VehiclesState>((set, get) => ({
  vehicles: [],
  loading: false,
  error: null,

  fetchVehicles: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('name')

      if (error) throw error

      set({ vehicles: data || [], loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des véhicules'
      console.error('Erreur lors du chargement des véhicules:', error)
      set({ 
        loading: false, 
        error: errorMessage 
      })
    }
  },

  fetchAvailableVehicles: async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'disponible')
        .order('name')

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules disponibles:', error)
      return []
    }
  },

  createVehicle: async (vehicleData) => {
    set({ loading: true, error: null })
    try {
      // Validation côté client
      if (!vehicleData.name?.trim()) {
        throw new Error('Le nom du véhicule est requis')
      }
      if (!vehicleData.license_plate?.trim()) {
        throw new Error('La plaque d\'immatriculation est requise')
      }
      if (!vehicleData.model?.trim()) {
        throw new Error('Le modèle du véhicule est requis')
      }
      if (vehicleData.capacity && vehicleData.capacity <= 0) {
        throw new Error('La capacité doit être supérieure à 0')
      }

      const { error } = await supabase
        .from('vehicles')
        .insert(vehicleData)

      if (error) throw error

      // Rafraîchir la liste
      get().fetchVehicles()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du véhicule'
      console.error('Erreur lors de la création du véhicule:', error)
      set({ 
        loading: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  updateVehicle: async (id, data) => {
    set({ loading: true, error: null })
    try {
      // Validation côté client
      if (data.name !== undefined && !data.name.trim()) {
        throw new Error('Le nom du véhicule est requis')
      }
      if (data.license_plate !== undefined && !data.license_plate.trim()) {
        throw new Error('La plaque d\'immatriculation est requise')
      }
      if (data.model !== undefined && !data.model.trim()) {
        throw new Error('Le modèle du véhicule est requis')
      }
      if (data.capacity !== undefined && data.capacity <= 0) {
        throw new Error('La capacité doit être supérieure à 0')
      }

      const { error } = await supabase
        .from('vehicles')
        .update(data)
        .eq('id', id)

      if (error) throw error

      // Rafraîchir la liste
      get().fetchVehicles()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du véhicule'
      console.error('Erreur lors de la mise à jour du véhicule:', error)
      set({ 
        loading: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  deleteVehicle: async (id) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Rafraîchir la liste
      get().fetchVehicles()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression du véhicule'
      console.error('Erreur lors de la suppression du véhicule:', error)
      set({ 
        loading: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  assignVehicleToMission: async (missionId, vehicleId, notes) => {
    set({ loading: true, error: null })
    try {
      // Vérifier si le véhicule est disponible
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('status')
        .eq('id', vehicleId)
        .single()

      if (!vehicle || vehicle.status !== 'disponible') {
        throw new Error('Le véhicule n\'est pas disponible')
      }

      // Assigner le véhicule à la mission
      const { error: assignmentError } = await supabase
        .from('mission_vehicles')
        .insert({
          mission_id: missionId,
          vehicle_id: vehicleId,
          notes
        })

      if (assignmentError) throw assignmentError

      // Mettre à jour le statut du véhicule
      const { error: updateError } = await supabase
        .from('vehicles')
        .update({ status: 'en_mission' })
        .eq('id', vehicleId)

      if (updateError) throw updateError

      set({ loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'assignation du véhicule'
      console.error('Erreur lors de l\'assignation du véhicule:', error)
      set({ 
        loading: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  unassignVehicleFromMission: async (missionId, vehicleId) => {
    set({ loading: true, error: null })
    try {
      // Supprimer l'assignation
      const { error: deleteError } = await supabase
        .from('mission_vehicles')
        .delete()
        .eq('mission_id', missionId)
        .eq('vehicle_id', vehicleId)

      if (deleteError) throw deleteError

      // Vérifier si le véhicule est encore assigné à d'autres missions
      const { data: otherAssignments } = await supabase
        .from('mission_vehicles')
        .select('id')
        .eq('vehicle_id', vehicleId)

      // Si plus d'assignations, remettre le véhicule en disponible
      if (!otherAssignments || otherAssignments.length === 0) {
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({ status: 'disponible' })
          .eq('id', vehicleId)

        if (updateError) throw updateError
      }

      set({ loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la désassignation du véhicule'
      console.error('Erreur lors de la désassignation du véhicule:', error)
      set({ 
        loading: false, 
        error: errorMessage 
      })
      throw error
    }
  },

  getMissionVehicles: async (missionId) => {
    try {
      const { data, error } = await supabase
        .from('mission_vehicles')
        .select(`
          vehicles (*)
        `)
        .eq('mission_id', missionId)

      if (error) throw error

      return data?.map(item => item.vehicles) || []
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules de la mission:', error)
      return []
    }
  },

  clearError: () => set({ error: null })
})) 
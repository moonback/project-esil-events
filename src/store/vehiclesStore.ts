import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { 
  CompanyVehicle, 
  VehicleAssignment, 
  VehicleMaintenance, 
  VehicleDriver,
  CompanyVehicleWithDetails 
} from '../types/database'

interface VehiclesState {
  vehicles: CompanyVehicle[]
  vehicleAssignments: VehicleAssignment[]
  vehicleMaintenance: VehicleMaintenance[]
  vehicleDrivers: VehicleDriver[]
  loading: boolean
  error: string | null
  
  // Actions
  fetchVehicles: () => Promise<void>
  fetchVehicleAssignments: () => Promise<void>
  fetchVehicleMaintenance: () => Promise<void>
  fetchVehicleDrivers: () => Promise<void>
  
  addVehicle: (vehicle: Omit<CompanyVehicle, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateVehicle: (id: string, updates: Partial<CompanyVehicle>) => Promise<void>
  deleteVehicle: (id: string) => Promise<void>
  
  assignVehicleToMission: (vehicleId: string, missionId: string, assignedBy: string) => Promise<void>
  returnVehicle: (vehicleId: string, missionId: string) => Promise<void>
  
  addMaintenance: (maintenance: Omit<VehicleMaintenance, 'id' | 'created_at'>) => Promise<void>
  updateMaintenance: (id: string, updates: Partial<VehicleMaintenance>) => Promise<void>
  deleteMaintenance: (id: string) => Promise<void>
  
  addDriver: (driver: Omit<VehicleDriver, 'id' | 'authorized_at'>) => Promise<void>
  removeDriver: (vehicleId: string, driverId: string) => Promise<void>
  
  getAvailableVehicles: () => CompanyVehicle[]
  getVehicleById: (id: string) => CompanyVehicle | undefined
  getVehicleWithDetails: (id: string) => Promise<CompanyVehicleWithDetails | null>
  
  clearError: () => void
}

export const useVehiclesStore = create<VehiclesState>((set, get) => ({
  vehicles: [],
  vehicleAssignments: [],
  vehicleMaintenance: [],
  vehicleDrivers: [],
  loading: false,
  error: null,

  fetchVehicles: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('company_vehicles')
        .select('*')
        .order('name')

      if (error) throw error
      set({ vehicles: data || [] })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors du chargement des véhicules' })
    } finally {
      set({ loading: false })
    }
  },

  fetchVehicleAssignments: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .select(`
          *,
          missions (*),
          users (*)
        `)
        .order('assigned_at', { ascending: false })

      if (error) throw error
      set({ vehicleAssignments: data || [] })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors du chargement des assignations' })
    } finally {
      set({ loading: false })
    }
  },

  fetchVehicleMaintenance: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('vehicle_maintenance')
        .select('*')
        .order('performed_at', { ascending: false })

      if (error) throw error
      set({ vehicleMaintenance: data || [] })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors du chargement des maintenances' })
    } finally {
      set({ loading: false })
    }
  },

  fetchVehicleDrivers: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('vehicle_drivers')
        .select(`
          *,
          users (*)
        `)
        .order('authorized_at', { ascending: false })

      if (error) throw error
      set({ vehicleDrivers: data || [] })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors du chargement des conducteurs' })
    } finally {
      set({ loading: false })
    }
  },

  addVehicle: async (vehicle) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('company_vehicles')
        .insert(vehicle)
        .select()
        .single()

      if (error) throw error
      
      const { vehicles } = get()
      set({ vehicles: [...vehicles, data] })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du véhicule' })
    } finally {
      set({ loading: false })
    }
  },

  updateVehicle: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('company_vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      const { vehicles } = get()
      set({ 
        vehicles: vehicles.map(v => v.id === id ? data : v)
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du véhicule' })
    } finally {
      set({ loading: false })
    }
  },

  deleteVehicle: async (id) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('company_vehicles')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      const { vehicles } = get()
      set({ vehicles: vehicles.filter(v => v.id !== id) })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors de la suppression du véhicule' })
    } finally {
      set({ loading: false })
    }
  },

  assignVehicleToMission: async (vehicleId, missionId, assignedBy) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .insert({
          vehicle_id: vehicleId,
          mission_id: missionId,
          assigned_by: assignedBy
        })
        .select()
        .single()

      if (error) throw error
      
      const { vehicleAssignments } = get()
      set({ vehicleAssignments: [data, ...vehicleAssignments] })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors de l\'assignation du véhicule' })
    } finally {
      set({ loading: false })
    }
  },

  returnVehicle: async (vehicleId, missionId) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('vehicle_assignments')
        .update({ returned_at: new Date().toISOString() })
        .eq('vehicle_id', vehicleId)
        .eq('mission_id', missionId)
        .select()
        .single()

      if (error) throw error
      
      const { vehicleAssignments } = get()
      set({ 
        vehicleAssignments: vehicleAssignments.map(va => 
          va.vehicle_id === vehicleId && va.mission_id === missionId ? data : va
        )
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors du retour du véhicule' })
    } finally {
      set({ loading: false })
    }
  },

  addMaintenance: async (maintenance) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('vehicle_maintenance')
        .insert(maintenance)
        .select()
        .single()

      if (error) throw error
      
      const { vehicleMaintenance } = get()
      set({ vehicleMaintenance: [data, ...vehicleMaintenance] })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la maintenance' })
    } finally {
      set({ loading: false })
    }
  },

  updateMaintenance: async (id, updates) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('vehicle_maintenance')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      
      const { vehicleMaintenance } = get()
      set({ 
        vehicleMaintenance: vehicleMaintenance.map(m => m.id === id ? data : m)
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour de la maintenance' })
    } finally {
      set({ loading: false })
    }
  },

  deleteMaintenance: async (id) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('vehicle_maintenance')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      const { vehicleMaintenance } = get()
      set({ vehicleMaintenance: vehicleMaintenance.filter(m => m.id !== id) })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la maintenance' })
    } finally {
      set({ loading: false })
    }
  },

  addDriver: async (driver) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('vehicle_drivers')
        .insert(driver)
        .select()
        .single()

      if (error) throw error
      
      const { vehicleDrivers } = get()
      set({ vehicleDrivers: [data, ...vehicleDrivers] })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du conducteur' })
    } finally {
      set({ loading: false })
    }
  },

  removeDriver: async (vehicleId, driverId) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('vehicle_drivers')
        .delete()
        .eq('vehicle_id', vehicleId)
        .eq('driver_id', driverId)

      if (error) throw error
      
      const { vehicleDrivers } = get()
      set({ 
        vehicleDrivers: vehicleDrivers.filter(vd => 
          !(vd.vehicle_id === vehicleId && vd.driver_id === driverId)
        )
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors de la suppression du conducteur' })
    } finally {
      set({ loading: false })
    }
  },

  getAvailableVehicles: () => {
    const { vehicles } = get()
    return vehicles.filter(v => v.status === 'disponible')
  },

  getVehicleById: (id) => {
    const { vehicles } = get()
    return vehicles.find(v => v.id === id)
  },

  getVehicleWithDetails: async (id) => {
    try {
      const { data, error } = await supabase
        .from('company_vehicles')
        .select(`
          *,
          vehicle_assignments (
            *,
            missions (*),
            users (*)
          ),
          vehicle_maintenance (*),
          vehicle_drivers (
            *,
            users (*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors du chargement des détails du véhicule' })
      return null
    }
  },

  clearError: () => set({ error: null })
})) 
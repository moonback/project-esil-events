export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: 'admin' | 'technicien'
          name: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'admin' | 'technicien'
          name: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'technicien'
          name?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      availability: {
        Row: {
          id: string
          technician_id: string
          start_time: string
          end_time: string
          created_at: string
        }
        Insert: {
          id?: string
          technician_id: string
          start_time: string
          end_time: string
          created_at?: string
        }
        Update: {
          id?: string
          technician_id?: string
          start_time?: string
          end_time?: string
          created_at?: string
        }
      }
      missions: {
        Row: {
          mission_assignments: any
          id: string
          type: 'Livraison jeux' | 'Presta sono' | 'DJ' | 'Manutention' | 'Déplacement'
          title: string
          description: string | null
          date_start: string
          date_end: string
          location: string
          forfeit: number
          required_people: number
          vehicle_required: boolean
          vehicle_type: 'voiture_particuliere' | 'camionnette' | 'camion' | 'fourgon' | 'remorque' | 'moto' | 'velo' | 'aucun' | null
          vehicle_details: string | null
          equipment_required: string | null
          special_requirements: string | null
          contact_person: string | null
          contact_phone: string | null
          priority_level: 'low' | 'normal' | 'high' | 'urgent'
          weather_dependent: boolean
          setup_time_minutes: number
          teardown_time_minutes: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'Livraison jeux' | 'Presta sono' | 'DJ' | 'Manutention' | 'Déplacement'
          title: string
          description?: string | null
          date_start: string
          date_end: string
          location: string
          forfeit: number
          required_people?: number
          vehicle_required?: boolean
          vehicle_type?: 'voiture_particuliere' | 'camionnette' | 'camion' | 'fourgon' | 'remorque' | 'moto' | 'velo' | 'aucun' | null
          vehicle_details?: string | null
          equipment_required?: string | null
          special_requirements?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          priority_level?: 'low' | 'normal' | 'high' | 'urgent'
          weather_dependent?: boolean
          setup_time_minutes?: number
          teardown_time_minutes?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'Livraison jeux' | 'Presta sono' | 'DJ' | 'Manutention' | 'Déplacement'
          title?: string
          description?: string | null
          date_start?: string
          date_end?: string
          location?: string
          forfeit?: number
          required_people?: number
          vehicle_required?: boolean
          vehicle_type?: 'voiture_particuliere' | 'camionnette' | 'camion' | 'fourgon' | 'remorque' | 'moto' | 'velo' | 'aucun' | null
          vehicle_details?: string | null
          equipment_required?: string | null
          special_requirements?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          priority_level?: 'low' | 'normal' | 'high' | 'urgent'
          weather_dependent?: boolean
          setup_time_minutes?: number
          teardown_time_minutes?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mission_assignments: {
        Row: {
          id: string
          mission_id: string
          technician_id: string
          status: 'proposé' | 'accepté' | 'refusé'
          assigned_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          mission_id: string
          technician_id: string
          status?: 'proposé' | 'accepté' | 'refusé'
          assigned_at?: string
          responded_at?: string | null
        }
        Update: {
          id?: string
          mission_id?: string
          technician_id?: string
          status?: 'proposé' | 'accepté' | 'refusé'
          assigned_at?: string
          responded_at?: string | null
        }
      }
      billing: {
        Row: {
          id: string
          mission_id: string
          technician_id: string
          amount: number
          status: 'en_attente' | 'validé' | 'payé'
          payment_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          mission_id: string
          technician_id: string
          amount: number
          status?: 'en_attente' | 'validé' | 'payé'
          payment_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          mission_id?: string
          technician_id?: string
          amount?: number
          status?: 'en_attente' | 'validé' | 'payé'
          payment_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      company_vehicles: {
        Row: {
          id: string
          name: string
          category: 'voiture_particuliere' | 'camionnette' | 'camion' | 'fourgon' | 'remorque' | 'moto' | 'velo'
          brand: string
          model: string
          year: number | null
          license_plate: string | null
          vin: string | null
          fuel_type: 'essence' | 'diesel' | 'electrique' | 'hybride' | 'gpl' | null
          fuel_capacity: number | null
          max_payload: number | null
          max_volume: number | null
          status: 'disponible' | 'en_mission' | 'maintenance' | 'hors_service'
          current_mileage: number
          last_maintenance_date: string | null
          next_maintenance_date: string | null
          insurance_expiry_date: string | null
          registration_expiry_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: 'voiture_particuliere' | 'camionnette' | 'camion' | 'fourgon' | 'remorque' | 'moto' | 'velo'
          brand: string
          model: string
          year?: number | null
          license_plate?: string | null
          vin?: string | null
          fuel_type?: 'essence' | 'diesel' | 'electrique' | 'hybride' | 'gpl' | null
          fuel_capacity?: number | null
          max_payload?: number | null
          max_volume?: number | null
          status?: 'disponible' | 'en_mission' | 'maintenance' | 'hors_service'
          current_mileage?: number
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          insurance_expiry_date?: string | null
          registration_expiry_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: 'voiture_particuliere' | 'camionnette' | 'camion' | 'fourgon' | 'remorque' | 'moto' | 'velo'
          brand?: string
          model?: string
          year?: number | null
          license_plate?: string | null
          vin?: string | null
          fuel_type?: 'essence' | 'diesel' | 'electrique' | 'hybride' | 'gpl' | null
          fuel_capacity?: number | null
          max_payload?: number | null
          max_volume?: number | null
          status?: 'disponible' | 'en_mission' | 'maintenance' | 'hors_service'
          current_mileage?: number
          last_maintenance_date?: string | null
          next_maintenance_date?: string | null
          insurance_expiry_date?: string | null
          registration_expiry_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicle_assignments: {
        Row: {
          id: string
          vehicle_id: string
          mission_id: string
          assigned_by: string
          assigned_at: string
          returned_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          vehicle_id: string
          mission_id: string
          assigned_by: string
          assigned_at?: string
          returned_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string
          mission_id?: string
          assigned_by?: string
          assigned_at?: string
          returned_at?: string | null
          notes?: string | null
        }
      }
      vehicle_maintenance: {
        Row: {
          id: string
          vehicle_id: string
          maintenance_type: string
          description: string
          cost: number | null
          performed_by: string | null
          performed_at: string
          next_maintenance_date: string | null
          mileage_at_maintenance: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          maintenance_type: string
          description: string
          cost?: number | null
          performed_by?: string | null
          performed_at: string
          next_maintenance_date?: string | null
          mileage_at_maintenance?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          maintenance_type?: string
          description?: string
          cost?: number | null
          performed_by?: string | null
          performed_at?: string
          next_maintenance_date?: string | null
          mileage_at_maintenance?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      vehicle_drivers: {
        Row: {
          id: string
          vehicle_id: string
          driver_id: string
          license_type: string | null
          license_expiry_date: string | null
          authorized_at: string
          authorized_by: string
          notes: string | null
        }
        Insert: {
          id?: string
          vehicle_id: string
          driver_id: string
          license_type?: string | null
          license_expiry_date?: string | null
          authorized_at?: string
          authorized_by: string
          notes?: string | null
        }
        Update: {
          id?: string
          vehicle_id?: string
          driver_id?: string
          license_type?: string | null
          license_expiry_date?: string | null
          authorized_at?: string
          authorized_by?: string
          notes?: string | null
        }
      }
    }
  }
}

export type UserRole = Database['public']['Tables']['users']['Row']['role']
export type MissionType = Database['public']['Tables']['missions']['Row']['type']
export type AssignmentStatus = Database['public']['Tables']['mission_assignments']['Row']['status']
export type BillingStatus = Database['public']['Tables']['billing']['Row']['status']
export type VehicleType = Database['public']['Tables']['missions']['Row']['vehicle_type']
export type PriorityLevel = Database['public']['Tables']['missions']['Row']['priority_level']
export type VehicleStatus = Database['public']['Tables']['company_vehicles']['Row']['status']
export type VehicleCategory = Database['public']['Tables']['company_vehicles']['Row']['category']
export type FuelType = Database['public']['Tables']['company_vehicles']['Row']['fuel_type']

export type User = Database['public']['Tables']['users']['Row']
export type Availability = Database['public']['Tables']['availability']['Row']
export type Mission = Database['public']['Tables']['missions']['Row']
export type MissionAssignment = Database['public']['Tables']['mission_assignments']['Row']
export type Billing = Database['public']['Tables']['billing']['Row']
export type CompanyVehicle = Database['public']['Tables']['company_vehicles']['Row']
export type VehicleAssignment = Database['public']['Tables']['vehicle_assignments']['Row']
export type VehicleMaintenance = Database['public']['Tables']['vehicle_maintenance']['Row']
export type VehicleDriver = Database['public']['Tables']['vehicle_drivers']['Row']

// Types avec relations
export type MissionWithAssignments = Mission & {
  mission_assignments: (MissionAssignment & {
    users: User
  })[]
}

export type BillingWithDetails = Billing & {
  missions: Mission
  users: User
}

export type CompanyVehicleWithDetails = CompanyVehicle & {
  vehicle_assignments: (VehicleAssignment & {
    missions: Mission
    users: User
  })[]
  vehicle_maintenance: VehicleMaintenance[]
  vehicle_drivers: (VehicleDriver & {
    users: User
  })[]
}
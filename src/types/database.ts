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
          email: string | null
          address: string | null
          notes: string | null
          is_validated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'admin' | 'technicien'
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          is_validated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'technicien'
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          is_validated?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          name: string
          type: 'camion' | 'fourgon' | 'utilitaire' | 'voiture'
          license_plate: string
          model: string
          year: number | null
          capacity: number | null
          fuel_type: string | null
          status: 'disponible' | 'en_maintenance' | 'hors_service' | 'en_mission'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'camion' | 'fourgon' | 'utilitaire' | 'voiture'
          license_plate: string
          model: string
          year?: number | null
          capacity?: number | null
          fuel_type?: string | null
          status?: 'disponible' | 'en_maintenance' | 'hors_service' | 'en_mission'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'camion' | 'fourgon' | 'utilitaire' | 'voiture'
          license_plate?: string
          model?: string
          year?: number | null
          capacity?: number | null
          fuel_type?: string | null
          status?: 'disponible' | 'en_maintenance' | 'hors_service' | 'en_mission'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mission_vehicles: {
        Row: {
          id: string
          mission_id: string
          vehicle_id: string
          assigned_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          mission_id: string
          vehicle_id: string
          assigned_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          mission_id?: string
          vehicle_id?: string
          assigned_at?: string
          notes?: string | null
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
      unavailability: {
        Row: {
          id: string
          technician_id: string
          start_time: string
          end_time: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          technician_id: string
          start_time: string
          end_time: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          technician_id?: string
          start_time?: string
          end_time?: string
          reason?: string | null
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
          latitude: number | null
          longitude: number | null
          forfeit: number
          required_people: number
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
          latitude?: number | null
          longitude?: number | null
          forfeit: number
          required_people?: number
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
          latitude?: number | null
          longitude?: number | null
          forfeit?: number
          required_people?: number
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
          cancelled_by_admin: boolean
        }
        Insert: {
          id?: string
          mission_id: string
          technician_id: string
          status?: 'proposé' | 'accepté' | 'refusé'
          assigned_at?: string
          responded_at?: string | null
          cancelled_by_admin?: boolean
        }
        Update: {
          id?: string
          mission_id?: string
          technician_id?: string
          status?: 'proposé' | 'accepté' | 'refusé'
          assigned_at?: string
          responded_at?: string | null
          cancelled_by_admin?: boolean
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
    }
  }
}

export type UserRole = Database['public']['Tables']['users']['Row']['role']
export type MissionType = Database['public']['Tables']['missions']['Row']['type']
export type AssignmentStatus = Database['public']['Tables']['mission_assignments']['Row']['status']
export type BillingStatus = Database['public']['Tables']['billing']['Row']['status']
export type VehicleType = Database['public']['Tables']['vehicles']['Row']['type']
export type VehicleStatus = Database['public']['Tables']['vehicles']['Row']['status']

export type User = Database['public']['Tables']['users']['Row']
export type Availability = Database['public']['Tables']['availability']['Row']
export type Unavailability = Database['public']['Tables']['unavailability']['Row']
export type Mission = Database['public']['Tables']['missions']['Row']
export type MissionAssignment = Database['public']['Tables']['mission_assignments']['Row']
export type Billing = Database['public']['Tables']['billing']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type MissionVehicle = Database['public']['Tables']['mission_vehicles']['Row']

// Types avec relations
export type MissionWithAssignments = Mission & {
  mission_assignments: (MissionAssignment & {
    users: User
  })[]
}

export type MissionWithVehicles = Mission & {
  mission_vehicles: (MissionVehicle & {
    vehicles: Vehicle
  })[]
}

export type BillingWithDetails = Billing & {
  missions: Mission
  users: User
}

export type VehicleWithMissions = Vehicle & {
  mission_vehicles: (MissionVehicle & {
    missions: Mission
  })[]
}

// Types pour les statistiques des techniciens
export type TechnicianStats = {
  totalAssignments: number
  acceptedAssignments: number
  pendingAssignments: number
  rejectedAssignments: number
  totalRevenue: number
  totalHours: number
  availabilityCount: number
}

export type TechnicianWithStats = User & {
  stats: TechnicianStats
  recentMissions: (Mission & { assignment: MissionAssignment })[]
  availabilities: Availability[]
  unavailabilities: Unavailability[]
  billings: Billing[]
}
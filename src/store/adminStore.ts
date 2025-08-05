import { create } from 'zustand'
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
  
  // Cache et persistance
  lastFetched: {
    missions: number | null
    technicians: number | null
    billings: number | null
  }
  cacheValid: {
    missions: boolean
    technicians: boolean
    billings: boolean
  }
  
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
  fetchMissions: (force?: boolean) => Promise<void>
  fetchTechnicians: (force?: boolean) => Promise<void>
  fetchBillings: (force?: boolean) => Promise<void>
  refreshData: () => Promise<void>
  refreshMissions: () => Promise<void>
  clearData: () => void
  deleteAllMissions: () => Promise<void>
  createTestMissions: () => Promise<void>
  setConnectionStatus: (isConnected: boolean) => void
  validateTechnician: (technicianId: string, isValidated: boolean) => Promise<void>
  cancelPendingAssignments: (missionId: string) => Promise<void>
  deleteTechnician: (technicianId: string) => Promise<void>
  
  // Gestion du cache
  invalidateCache: (type?: 'missions' | 'technicians' | 'billings') => void
  isDataStale: (type: 'missions' | 'technicians' | 'billings') => boolean
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const useAdminStore = create<AdminState>((set, get) => ({
  loading: {
    missions: false,
    technicians: false,
    billings: false
  },
  
  missions: [],
  technicians: [],
  billings: [],
  
  // Cache et persistance
  lastFetched: {
    missions: null,
    technicians: null,
    billings: null
  },
  cacheValid: {
    missions: false,
    technicians: false,
    billings: false
  },
  
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

  isDataStale: (type) => {
    const { lastFetched } = get()
    const lastFetchedTime = lastFetched[type]
    if (!lastFetchedTime) return true
    return Date.now() - lastFetchedTime > CACHE_DURATION
  },

  invalidateCache: (type) => {
    if (type) {
      set(state => ({
        cacheValid: {
          ...state.cacheValid,
          [type]: false
        },
        lastFetched: {
          ...state.lastFetched,
          [type]: null
        }
      }))
    } else {
      set({
        cacheValid: {
          missions: false,
          technicians: false,
          billings: false
        },
        lastFetched: {
          missions: null,
          technicians: null,
          billings: null
        }
      })
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

  fetchMissions: async (force?: boolean) => {
    if (!force && !get().isDataStale('missions')) {
      return
    }

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
        stats: { ...state.stats, missions: stats },
        lastFetched: { ...state.lastFetched, missions: Date.now() },
        cacheValid: { ...state.cacheValid, missions: true }
      }))
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error)
      set(state => ({ 
        loading: { ...state.loading, missions: false },
        missions: []
      }))
    }
  },

  fetchTechnicians: async (force?: boolean) => {
    if (!force && !get().isDataStale('technicians')) {
      return
    }

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

      // Récupérer les indisponibilités
      const { data: unavailabilities, error: unavailError } = await supabase
        .from('unavailability')
        .select('*')
        .order('start_time', { ascending: true })

      if (unavailError) throw unavailError

      // Calculer les statistiques pour chaque technicien
      const techniciansWithStats = technicians.map(tech => {
        const techAssignments = assignments.filter(assign => assign.technician_id === tech.id)
        const techBillings = billings.filter(billing => billing.technician_id === tech.id)
        const techAvailabilities = availabilities.filter(avail => avail.technician_id === tech.id)
        const techUnavailabilities = unavailabilities.filter(unavail => unavail.technician_id === tech.id)

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

        return {
          ...tech,
          stats: {
            totalAssignments,
            acceptedAssignments,
            pendingAssignments,
            rejectedAssignments,
            totalRevenue,
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
          unavailabilities: techUnavailabilities,
          billings: techBillings
        }
      })

      // Calculer les statistiques globales
      const stats = {
        total: techniciansWithStats.length,
        available: techniciansWithStats.filter(t => {
          // Un technicien est considéré comme disponible par défaut
          // sauf s'il a des indisponibilités explicites
          return t.unavailabilities.length === 0
        }).length,
        busy: techniciansWithStats.filter(t => t.stats.totalAssignments > 0).length
      }

      set(state => ({
        technicians: techniciansWithStats,
        loading: { ...state.loading, technicians: false },
        stats: { ...state.stats, technicians: stats },
        lastFetched: { ...state.lastFetched, technicians: Date.now() },
        cacheValid: { ...state.cacheValid, technicians: true }
      }))
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens:', error)
      set(state => ({ 
        loading: { ...state.loading, technicians: false },
        technicians: []
      }))
    }
  },

  fetchBillings: async (force?: boolean) => {
    if (!force && !get().isDataStale('billings')) {
      return
    }

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
        stats: { ...state.stats, billings: stats },
        lastFetched: { ...state.lastFetched, billings: Date.now() },
        cacheValid: { ...state.cacheValid, billings: true }
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

  deleteAllMissions: async () => {
    set(state => ({ loading: { ...state.loading, missions: true } }))
    
    try {
      // Supprimer d'abord toutes les assignations de missions
      const { error: assignmentsError } = await supabase
        .from('mission_assignments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Condition pour éviter l'erreur si la table est vide

      if (assignmentsError) throw assignmentsError

      // Supprimer toutes les missions
      const { error: missionsError } = await supabase
        .from('missions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Condition pour éviter l'erreur si la table est vide

      if (missionsError) throw missionsError

      // Mettre à jour l'état local immédiatement pour une meilleure UX
      set(state => ({
        missions: [],
        loading: { ...state.loading, missions: false },
        stats: {
          ...state.stats,
          missions: {
            total: 0,
            byType: {},
            totalRevenue: 0,
            assignedCount: 0
          }
        }
      }))
      
      console.log('Toutes les missions ont été supprimées avec succès')
    } catch (error) {
      console.error('Erreur lors de la suppression de toutes les missions:', error)
      throw error
    } finally {
      set(state => ({ loading: { ...state.loading, missions: false } }))
    }
  },

  createTestMissions: async () => {
    set(state => ({ loading: { ...state.loading, missions: true } }))
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Créer 5 missions de test avec des données variées
      const testMissions = [
        {
          title: 'Livraison jeux - Anniversaire',
          description: 'Installation et animation de jeux en bois pour anniversaire enfants',
          type: 'Livraison jeux',
          location: 'Boulogne-Billancourt - Parc Edmond de Rothschild',
          latitude: 48.8333,
          longitude: 2.2500,
          date_start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // +5 jours
          date_end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // +4h
          forfeit: 120,
          required_people: 2,
          created_by: user?.id
        },
        {
          title: 'Soirée DJ - Club',
          description: 'Animation DJ pour soirée en club',
          type: 'DJ',
          location: 'Saint-Denis - Stade de France',
          latitude: 48.9244,
          longitude: 2.3604,
          date_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 jours
          date_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(), // +6h
          forfeit: 200,
          required_people: 1,
          created_by: user?.id
        },
        {
          title: 'Sonorisation - Concert',
          description: 'Installation et gestion son pour concert live',
          type: 'Presta sono',
          location: 'Versailles - Château de Versailles',
          latitude: 48.8044,
          longitude: 2.1232,
          date_start: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), // +12 jours
          date_end: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(), // +5h
          forfeit: 350,
          required_people: 3,
          created_by: user?.id
        },
        {
          title: 'Déménagement matériel',
          description: 'Transport de matériel entre deux entrepôts',
          type: 'Manutention',
          location: 'Nanterre - La Défense',
          latitude: 48.8900,
          longitude: 2.2400,
          date_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 jours
          date_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(), // +8h
          forfeit: 180,
          required_people: 4,
          created_by: user?.id
        },
        {
          title: 'Transport sono - Festival',
          description: 'Transport et installation système son pour festival',
          type: 'Déplacement',
          location: 'Créteil - Centre commercial Créteil Soleil',
          latitude: 48.7911,
          longitude: 2.4658,
          date_start: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // +8 jours
          date_end: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // +3h
          forfeit: 150,
          required_people: 2,
          created_by: user?.id
        },
        {
          title: 'Animation DJ - Mariage',
          description: 'Animation musicale pour mariage avec système son et éclairage',
          type: 'DJ',
          location: 'Fontainebleau - Château de Fontainebleau',
          latitude: 48.4026,
          longitude: 2.6997,
          date_start: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // +10 jours
          date_end: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(), // +8h
          forfeit: 300,
          required_people: 2,
          created_by: user?.id
        },
        {
          title: 'Livraison jeux - Festival',
          description: 'Installation et animation de jeux en bois pour festival familial',
          type: 'Livraison jeux',
          location: 'Saint-Germain-en-Laye - Château de Saint-Germain',
          latitude: 48.8974,
          longitude: 2.0954,
          date_start: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // +21 jours
          date_end: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(), // +10h
          forfeit: 250,
          required_people: 4,
          created_by: user?.id
        },
        {
          title: 'Sonorisation - Conférence',
          description: 'Installation et gestion du système son pour conférence d\'entreprise',
          type: 'Presta sono',
          location: 'Évry - Cathédrale de la Résurrection',
          latitude: 48.6300,
          longitude: 2.4300,
          date_start: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // +4 jours
          date_end: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(), // +6h
          forfeit: 280,
          required_people: 2,
          created_by: user?.id
        },
        {
          title: 'Manutention - Festival',
          description: 'Installation et démontage des structures pour festival de musique',
          type: 'Manutention',
          location: 'Melun - Île Saint-Étienne',
          latitude: 48.5400,
          longitude: 2.6600,
          date_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // +2 jours
          date_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(), // +12h
          forfeit: 400,
          required_people: 6,
          created_by: user?.id
        },
        {
          title: 'Transport matériel - Salon',
          description: 'Transport et installation du matériel pour salon professionnel',
          type: 'Déplacement',
          location: 'Villepinte - Parc des Expositions',
          latitude: 48.9583,
          longitude: 2.5417,
          date_start: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // +15 jours
          date_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(), // +5h
          forfeit: 220,
          required_people: 3,
          created_by: user?.id
        }
      ]

      // Insérer les missions de test
      const { data: createdMissions, error } = await supabase
        .from('missions')
        .insert(testMissions)
        .select()

      if (error) throw error

      // Rafraîchir les données
      await get().fetchMissions()
      
      console.log('5 missions de test ont été créées avec succès')
    } catch (error) {
      console.error('Erreur lors de la création des missions de test:', error)
      throw error
    } finally {
      set(state => ({ loading: { ...state.loading, missions: false } }))
    }
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
      },
      lastFetched: {
        missions: null,
        technicians: null,
        billings: null
      },
      cacheValid: {
        missions: false,
        technicians: false,
        billings: false
      }
    })
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

      // Invalider le cache et rafraîchir la liste des techniciens
      get().invalidateCache('technicians')
      await get().fetchTechnicians(true)
      
      console.log(`Technicien ${technicianId} ${isValidated ? 'validé' : 'dévalidé'} avec succès`)
    } catch (error) {
      console.error('Erreur lors de la validation du technicien:', error)
      throw error
    }
  },

  cancelPendingAssignments: async (missionId: string) => {
    try {
      const { error } = await supabase
        .from('mission_assignments')
        .update({ 
          status: 'refusé',
          responded_at: new Date().toISOString()
        })
        .eq('mission_id', missionId)
        .eq('status', 'proposé')

      if (error) throw error

      // Invalider le cache et rafraîchir les données
      get().invalidateCache('missions')
      await get().fetchMissions(true)
      
      console.log(`Demandes en attente annulées pour la mission ${missionId}`)
    } catch (error) {
      console.error('Erreur lors de l\'annulation des demandes en attente:', error)
      throw error
    }
  },

  deleteTechnician: async (technicianId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', technicianId)
        .eq('role', 'technicien')

      if (error) throw error

      // Invalider le cache et rafraîchir la liste des techniciens
      get().invalidateCache('technicians')
      await get().fetchTechnicians(true)
      
      console.log(`Technicien ${technicianId} supprimé avec succès`)
    } catch (error) {
      console.error('Erreur lors de la suppression du technicien:', error)
      throw error
    }
  }
})) 
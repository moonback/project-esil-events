import { useState, useEffect, useCallback } from 'react'
import { googleCalendarService } from './googleCalendar'
import type { Mission, User } from '@/types/database'

export interface UseGoogleCalendarReturn {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  calendars: Array<{ id: string; summary: string }>
  connect: () => void
  disconnect: () => void
  refreshAuthStatus: () => Promise<void>
  createMissionEvent: (mission: Mission, technicians: User[]) => Promise<string | null>
  updateMissionEvent: (eventId: string, mission: Mission, technicians: User[]) => Promise<boolean>
  deleteMissionEvent: (eventId: string) => Promise<boolean>
  refreshCalendars: () => Promise<void>
}

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [calendars, setCalendars] = useState<Array<{ id: string; summary: string }>>([])

  // Fonction pour rafraîchir l'état d'authentification
  const refreshAuthStatus = useCallback(async () => {
    try {
      setError(null)
      const isConnected = await googleCalendarService.initialize()
      setIsAuthenticated(isConnected)
      
      if (isConnected) {
        await refreshCalendars()
      }
    } catch (err) {
      setError('Erreur lors de la vérification de l\'authentification')
      console.error(err)
    }
  }, [])

  // Initialiser le service
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const isConnected = await googleCalendarService.initialize()
        setIsAuthenticated(isConnected)
        
        if (isConnected) {
          await refreshCalendars()
        }
      } catch (err) {
        setError('Erreur lors de l\'initialisation de Google Calendar')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    initializeService()
  }, [])

  // Vérifier l'état d'authentification quand la page devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isLoading) {
        refreshAuthStatus()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshAuthStatus, isLoading])

  // Se connecter à Google Calendar
  const connect = useCallback(() => {
    try {
      setError(null)
      const authUrl = googleCalendarService.generateAuthUrl()
      window.location.href = authUrl
    } catch (err) {
      setError('Erreur lors de la génération de l\'URL d\'authentification')
      console.error(err)
    }
  }, [])

  // Se déconnecter
  const disconnect = useCallback(() => {
    try {
      googleCalendarService.logout()
      setIsAuthenticated(false)
      setCalendars([])
      setError(null)
    } catch (err) {
      setError('Erreur lors de la déconnexion')
      console.error(err)
    }
  }, [])

  // Créer un événement pour une mission
  const createMissionEvent = useCallback(async (
    mission: Mission, 
    technicians: User[]
  ): Promise<string | null> => {
    try {
      setError(null)
      setIsLoading(true)
      
      const eventId = await googleCalendarService.createMissionEvent(mission, technicians)
      
      if (eventId) {
        // Mettre à jour la mission avec l'ID de l'événement Google Calendar
        // Cette logique peut être ajoutée ici si nécessaire
      }
      
      return eventId
    } catch (err) {
      const errorMessage = 'Erreur lors de la création de l\'événement Google Calendar'
      setError(errorMessage)
      console.error(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Mettre à jour un événement
  const updateMissionEvent = useCallback(async (
    eventId: string,
    mission: Mission,
    technicians: User[]
  ): Promise<boolean> => {
    try {
      setError(null)
      setIsLoading(true)
      
      const success = await googleCalendarService.updateMissionEvent(eventId, mission, technicians)
      return success
    } catch (err) {
      const errorMessage = 'Erreur lors de la mise à jour de l\'événement Google Calendar'
      setError(errorMessage)
      console.error(err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Supprimer un événement
  const deleteMissionEvent = useCallback(async (eventId: string): Promise<boolean> => {
    try {
      setError(null)
      setIsLoading(true)
      
      const success = await googleCalendarService.deleteMissionEvent(eventId)
      return success
    } catch (err) {
      const errorMessage = 'Erreur lors de la suppression de l\'événement Google Calendar'
      setError(errorMessage)
      console.error(err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Rafraîchir la liste des calendriers
  const refreshCalendars = useCallback(async () => {
    try {
      setError(null)
      const calendarsList = await googleCalendarService.listCalendars()
      setCalendars(calendarsList)
    } catch (err) {
      setError('Erreur lors de la récupération des calendriers')
      console.error(err)
    }
  }, [])

  return {
    isAuthenticated,
    isLoading,
    error,
    calendars,
    connect,
    disconnect,
    refreshAuthStatus,
    createMissionEvent,
    updateMissionEvent,
    deleteMissionEvent,
    refreshCalendars
  }
} 
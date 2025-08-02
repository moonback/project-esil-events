import { useState, useEffect, useCallback } from 'react'
import { GeocodingService } from './geocoding'

interface GeocodingState {
  latitude: number | null
  longitude: number | null
  loading: boolean
  error: string | null
  displayName: string | null
}

interface UseGeocodingOptions {
  debounceMs?: number
  autoGeocode?: boolean
  maxRetries?: number
}

/**
 * Hook personnalisé pour gérer le géocodage d'adresses
 */
export function useGeocoding(options: UseGeocodingOptions = {}) {
  const {
    debounceMs = 1000,
    autoGeocode = true,
    maxRetries = 3
  } = options

  const [state, setState] = useState<GeocodingState>({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
    displayName: null
  })

  const [address, setAddress] = useState<string>('')

  // Fonction de géocodage
  const geocodeAddress = useCallback(async (addressToGeocode: string) => {
    if (!addressToGeocode?.trim()) {
      setState(prev => ({
        ...prev,
        latitude: null,
        longitude: null,
        loading: false,
        error: null,
        displayName: null
      }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await GeocodingService.geocodeAddressWithRetry(
        addressToGeocode, 
        maxRetries
      )
      
      if (result) {
        setState({
          latitude: result.latitude,
          longitude: result.longitude,
          loading: false,
          error: null,
          displayName: result.display_name
        })
        console.log('Géocodage réussi:', result)
      } else {
        setState(prev => ({
          ...prev,
          latitude: null,
          longitude: null,
          loading: false,
          error: 'Aucun résultat trouvé pour cette adresse',
          displayName: null
        }))
        console.warn('Aucun résultat de géocodage trouvé pour:', addressToGeocode)
      }
    } catch (error) {
      console.error('Erreur lors du géocodage:', error)
      setState(prev => ({
        ...prev,
        latitude: null,
        longitude: null,
        loading: false,
        error: 'Erreur lors du géocodage. Veuillez réessayer.',
        displayName: null
      }))
    }
  }, [maxRetries])

  // Debounce pour le géocodage automatique
  useEffect(() => {
    if (!autoGeocode || !address?.trim()) return

    const timeoutId = setTimeout(() => {
      geocodeAddress(address)
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [address, autoGeocode, debounceMs, geocodeAddress])

  // Fonction pour mettre à jour l'adresse
  const updateAddress = useCallback((newAddress: string) => {
    setAddress(newAddress)
  }, [])

  // Fonction pour géocoder manuellement
  const geocodeManually = useCallback(() => {
    if (address?.trim()) {
      geocodeAddress(address)
    }
  }, [address, geocodeAddress])

  // Fonction pour réinitialiser
  const reset = useCallback(() => {
    setAddress('')
    setState({
      latitude: null,
      longitude: null,
      loading: false,
      error: null,
      displayName: null
    })
  }, [])

  return {
    // État
    address,
    latitude: state.latitude,
    longitude: state.longitude,
    loading: state.loading,
    error: state.error,
    displayName: state.displayName,
    
    // Actions
    updateAddress,
    geocodeManually,
    reset,
    
    // Utilitaires
    hasCoordinates: state.latitude !== null && state.longitude !== null,
    isValidCoordinates: state.latitude !== null && 
                      state.longitude !== null && 
                      GeocodingService.validateCoordinates(state.latitude, state.longitude)
  }
} 
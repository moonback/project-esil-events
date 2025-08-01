import { MAPBOX_CONFIG } from './mapbox-config'

export interface GeocodingResult {
  coordinates: [number, number] // [longitude, latitude]
  placeName: string
  confidence: number
}

export interface GeocodingError {
  error: string
  message: string
}

/**
 * Convertit une adresse en coordonnées GPS en utilisant l'API Mapbox
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | GeocodingError> {
  try {
    // Nettoyer l'adresse
    const cleanAddress = address.trim()
    if (!cleanAddress) {
      return {
        error: 'EMPTY_ADDRESS',
        message: 'L\'adresse ne peut pas être vide'
      }
    }

    // Construire l'URL de l'API Mapbox
    const encodedAddress = encodeURIComponent(cleanAddress)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_CONFIG.accessToken}&country=FR&language=fr&limit=1`

    const response = await fetch(url)
    
    if (!response.ok) {
      return {
        error: 'API_ERROR',
        message: `Erreur API: ${response.status} ${response.statusText}`
      }
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      return {
        error: 'NO_RESULTS',
        message: `Aucun résultat trouvé pour l'adresse: ${cleanAddress}`
      }
    }

    const feature = data.features[0]
    const [longitude, latitude] = feature.center

    return {
      coordinates: [longitude, latitude],
      placeName: feature.place_name_fr || feature.place_name,
      confidence: feature.relevance
    }
  } catch (error) {
    console.error('Erreur de géocodage:', error)
    return {
      error: 'NETWORK_ERROR',
      message: 'Erreur de connexion lors du géocodage'
    }
  }
}

/**
 * Convertit des coordonnées GPS en adresse (géocodage inverse)
 */
export async function reverseGeocode(coordinates: [number, number]): Promise<GeocodingResult | GeocodingError> {
  try {
    const [longitude, latitude] = coordinates
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_CONFIG.accessToken}&country=FR&language=fr&limit=1`

    const response = await fetch(url)
    
    if (!response.ok) {
      return {
        error: 'API_ERROR',
        message: `Erreur API: ${response.status} ${response.statusText}`
      }
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      return {
        error: 'NO_RESULTS',
        message: 'Aucune adresse trouvée pour ces coordonnées'
      }
    }

    const feature = data.features[0]

    return {
      coordinates: [longitude, latitude],
      placeName: feature.place_name_fr || feature.place_name,
      confidence: feature.relevance
    }
  } catch (error) {
    console.error('Erreur de géocodage inverse:', error)
    return {
      error: 'NETWORK_ERROR',
      message: 'Erreur de connexion lors du géocodage inverse'
    }
  }
}

/**
 * Valide si une adresse est géocodable
 */
export async function validateAddress(address: string): Promise<boolean> {
  const result = await geocodeAddress(address)
  return !('error' in result) && result.confidence > 0.5
}

/**
 * Suggestions d'adresses basées sur une recherche
 */
export async function getAddressSuggestions(query: string): Promise<string[]> {
  try {
    const encodedQuery = encodeURIComponent(query)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_CONFIG.accessToken}&country=FR&language=fr&limit=5`

    const response = await fetch(url)
    
    if (!response.ok) {
      return []
    }

    const data = await response.json()

    if (!data.features) {
      return []
    }

    return data.features.map((feature: any) => 
      feature.place_name_fr || feature.place_name
    )
  } catch (error) {
    console.error('Erreur lors de la recherche d\'adresses:', error)
    return []
  }
} 
interface GeocodingResult {
  latitude: number
  longitude: number
  display_name: string
}

interface NominatimResponse {
  lat: string
  lon: string
  display_name: string
}

/**
 * Service de géocodage utilisant l'API Nominatim (OpenStreetMap)
 * Convertit une adresse en coordonnées géographiques
 */
export class GeocodingService {
  private static readonly BASE_URL = 'https://nominatim.openstreetmap.org/search'
  private static readonly USER_AGENT = 'ESIL-Missions-App/1.0'

  /**
   * Convertit une adresse en coordonnées géographiques
   * @param address - L'adresse à géocoder
   * @returns Promise<GeocodingResult | null> - Les coordonnées ou null si non trouvé
   */
  static async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    if (!address?.trim()) {
      console.warn('Adresse vide pour le géocodage')
      return null
    }

    try {
      // Construire l'URL avec les paramètres
      const params = new URLSearchParams({
        q: address.trim(),
        format: 'json',
        limit: '1',
        addressdetails: '1',
        countrycodes: 'fr', // Limiter à la France
        accept_language: 'fr' // Résultats en français
      })

      const url = `${this.BASE_URL}?${params.toString()}`

      // Effectuer la requête avec un User-Agent approprié
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        console.error(`Erreur HTTP ${response.status}: ${response.statusText}`)
        return null
      }

      const data: NominatimResponse[] = await response.json()

      if (!data || data.length === 0) {
        console.warn(`Aucun résultat trouvé pour l'adresse: ${address}`)
        return null
      }

      const result = data[0]
      
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        display_name: result.display_name
      }
    } catch (error) {
      console.error('Erreur lors du géocodage:', error)
      return null
    }
  }

  /**
   * Géocode une adresse avec retry en cas d'échec
   * @param address - L'adresse à géocoder
   * @param maxRetries - Nombre maximum de tentatives (défaut: 3)
   * @returns Promise<GeocodingResult | null>
   */
  static async geocodeAddressWithRetry(
    address: string, 
    maxRetries: number = 3
  ): Promise<GeocodingResult | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.geocodeAddress(address)
        if (result) {
          return result
        }
        
        // Attendre avant la prochaine tentative (backoff exponentiel)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s...
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error) {
        console.error(`Tentative ${attempt} échouée:`, error)
        if (attempt === maxRetries) {
          throw error
        }
      }
    }

    return null
  }

  /**
   * Valide des coordonnées géographiques
   * @param latitude - Latitude
   * @param longitude - Longitude
   * @returns boolean - True si les coordonnées sont valides
   */
  static validateCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180 &&
      !isNaN(latitude) && !isNaN(longitude)
    )
  }

  /**
   * Calcule la distance entre deux points (formule de Haversine)
   * @param lat1 - Latitude du premier point
   * @param lon1 - Longitude du premier point
   * @param lat2 - Latitude du deuxième point
   * @param lon2 - Longitude du deuxième point
   * @returns number - Distance en kilomètres
   */
  static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371 // Rayon de la Terre en km
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    return R * c
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
} 
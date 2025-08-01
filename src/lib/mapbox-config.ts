// Configuration Mapbox
export const MAPBOX_CONFIG = {
  // Remplacez par votre token Mapbox réel
  accessToken: process.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXNpbC1hZG1pbiIsImEiOiJjbGV4YW1wbGUifQ.example',
  
  // Styles de carte disponibles
  styles: {
    streets: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    dark: 'mapbox://styles/mapbox/dark-v11',
    light: 'mapbox://styles/mapbox/light-v11',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12'
  },
  
  // Coordonnées par défaut (Paris)
  defaultCenter: {
    longitude: 2.3522,
    latitude: 48.8566,
    zoom: 10
  },
  
  // Limites de zoom
  zoomLimits: {
    min: 8,
    max: 18
  }
}

// Types pour les coordonnées
export interface Coordinates {
  longitude: number
  latitude: number
}

// Types pour les marqueurs
export interface MapMarker {
  id: string
  coordinates: [number, number] // [longitude, latitude]
  type: 'mission' | 'technician'
  data: any
  color?: string
  size?: number
}

// Types pour les itinéraires
export interface Route {
  id: string
  name: string
  coordinates: [number, number][]
  color: string
  missions: string[]
} 
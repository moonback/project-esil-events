// Configuration Mapbox
export const MAPBOX_CONFIG = {
  accessToken: import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiYmxhY2tzcGlkZXI2NjYiLCJhIjoiY21kb2lzejVpMDJnNTJtczNsZGgwZHJmdiJ9.d8jxWkU9Vs3GhbDt9FRAsA',
  styles: {
    streets: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    dark: 'mapbox://styles/mapbox/dark-v11',
    light: 'mapbox://styles/mapbox/light-v11',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12'
  },
  defaultCenter: {
    longitude: 2.3522,
    latitude: 48.8566,
    zoom: 10
  },
  zoomLimits: {
    min: 8,
    max: 18
  }
}

// Types for coordinates, markers, and routes
export interface Coordinates {
  longitude: number
  latitude: number
}

export interface MapMarker {
  id: string
  coordinates: [number, number] // [longitude, latitude]
  type: 'mission' | 'technician'
  data: any
  color?: string
  size?: number
}

export interface Route {
  id: string
  name: string
  coordinates: [number, number][]
  color: string
  missions: string[]
} 
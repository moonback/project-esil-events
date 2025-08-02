import React from 'react'
import { MapPin, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

interface GeocodingPreviewProps {
  latitude: number | null
  longitude: number | null
  loading: boolean
  error: string | null
  displayName: string | null
}

export function GeocodingPreview({
  latitude,
  longitude,
  loading,
  error,
  displayName
}: GeocodingPreviewProps) {
  if (loading) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm text-blue-700">Géocodage en cours...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <span className="text-sm text-red-700">{error}</span>
      </div>
    )
  }

  if (latitude && longitude) {
    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">Coordonnées trouvées</span>
        </div>
        
        <div className="text-xs text-gray-600 space-y-1">
          <div>
            <strong>Latitude:</strong> {latitude.toFixed(6)}
          </div>
          <div>
            <strong>Longitude:</strong> {longitude.toFixed(6)}
          </div>
          {displayName && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <strong>Adresse complète:</strong>
              <br />
              {displayName}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
      <MapPin className="h-4 w-4 text-gray-500" />
      <span className="text-sm text-gray-600">
        Saisissez une adresse pour obtenir les coordonnées
      </span>
    </div>
  )
} 
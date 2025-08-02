import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import type { Mission } from '@/types/database'

interface GeocodingDialogProps {
  mission: Mission | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCoordinatesUpdated: () => void
}

interface GeocodingResult {
  lat: number
  lon: number
  display_name: string
}

export function GeocodingDialog({ mission, open, onOpenChange, onCoordinatesUpdated }: GeocodingDialogProps) {
  // Vérifier que mission n'est pas null
  if (!mission || !open) return null

  const [searchQuery, setSearchQuery] = useState(mission.location || '')
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedResult, setSelectedResult] = useState<GeocodingResult | null>(null)

  useEffect(() => {
    if (open && mission) {
      setSearchQuery(mission.location || '')
      setSearchResults([])
      setSelectedResult(null)
    }
  }, [open, mission])

  const searchLocation = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      // Utiliser l'API Nominatim d'OpenStreetMap pour la géocodification
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`
      )
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.map((item: any) => ({
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          display_name: item.display_name
        })))
      } else {
        console.error('Erreur lors de la recherche de localisation')
      }
    } catch (error) {
      console.error('Erreur lors de la géocodification:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const updateMissionCoordinates = async () => {
    if (!selectedResult) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('missions')
        .update({
          latitude: selectedResult.lat,
          longitude: selectedResult.lon
        })
        .eq('id', mission.id)

      if (error) throw error

      onCoordinatesUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour des coordonnées:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchLocation()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <CardTitle>Ajouter des coordonnées</CardTitle>
          </div>
          <p className="text-sm text-gray-600">
            Mission: {mission.title}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Recherche */}
          <div className="space-y-2">
            <Label htmlFor="location-search">Adresse ou lieu</Label>
            <div className="flex space-x-2">
              <Input
                id="location-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Entrez une adresse..."
                className="flex-1"
              />
              <Button
                onClick={searchLocation}
                disabled={isSearching || !searchQuery.trim()}
                size="sm"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Résultats de recherche</Label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedResult === result
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {result.display_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Lat: {result.lat.toFixed(6)}, Lon: {result.lon.toFixed(6)}
                        </p>
                      </div>
                      {selectedResult === result && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coordonnées actuelles */}
          {mission.latitude && mission.longitude && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Coordonnées actuelles
                </span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Lat: {mission.latitude}, Lon: {mission.longitude}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Annuler
            </Button>
            
            {selectedResult && (
              <Button
                onClick={updateMissionCoordinates}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Mise à jour...
                  </>
                ) : (
                  'Ajouter les coordonnées'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
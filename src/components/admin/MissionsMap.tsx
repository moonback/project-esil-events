import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingOverlay } from '@/components/ui/loading'
import { MapPin, Filter, RefreshCw, Calendar, DollarSign, Users, X } from 'lucide-react'
import { useAdminStore } from '@/store/adminStore'
import type { Mission } from '@/types/database'

interface MissionsMapProps {
  className?: string
}

const getMissionTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'Livraison jeux': 'bg-blue-100 text-blue-800',
    'Presta sono': 'bg-green-100 text-green-800',
    'DJ': 'bg-purple-100 text-purple-800',
    'Manutention': 'bg-orange-100 text-orange-800',
    'Déplacement': 'bg-red-100 text-red-800',
    'default': 'bg-gray-100 text-gray-800'
  }
  return colors[type] || colors.default
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

// Coordonnées de Paris pour centrer la carte
const PARIS_COORDS = { lat: 48.8566, lng: 2.3522 }

// Fonction pour convertir les coordonnées en position CSS
const coordsToPosition = (lat: number, lng: number) => {
  // Conversion simple pour l'affichage
  const latOffset = (lat - PARIS_COORDS.lat) * 1000
  const lngOffset = (lng - PARIS_COORDS.lng) * 1000
  
  return {
    left: `${50 + lngOffset}%`,
    top: `${50 - latOffset}%`
  }
}

export function MissionsMap({ className }: MissionsMapProps) {
  const { missions, loading } = useAdminStore()
  
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)

  // Filtrer les missions selon les critères
  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      const typeMatch = selectedType === 'all' || mission.type === selectedType
      const hasLocation = mission.latitude && mission.longitude
      
      return typeMatch && hasLocation
    })
  }, [missions, selectedType, selectedStatus])

  // Obtenir les types uniques
  const uniqueTypes = useMemo(() => {
    const types = [...new Set(missions.map(m => m.type))]
    return types.sort()
  }, [missions])

  // Statistiques de la carte
  const mapStats = useMemo(() => {
    const total = missions.length
    const withLocation = missions.filter(m => m.latitude && m.longitude).length
    const filtered = filteredMissions.length
    
    return { total, withLocation, filtered }
  }, [missions, filteredMissions])

  const handleResetView = () => {
    setSelectedMission(null)
  }

  const handleMarkerClick = (mission: Mission) => {
    setSelectedMission(mission)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <CardTitle>Carte des Missions</CardTitle>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtres</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetView}
              className="flex items-center space-x-1"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </Button>
          </div>
        </div>
        
        {/* Statistiques */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Total: {mapStats.total}</span>
          <span>Avec localisation: {mapStats.withLocation}</span>
          <span>Affichées: {mapStats.filtered}</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <LoadingOverlay loading={loading.missions} text="Chargement de la carte...">
          <div className="relative">
            {/* Filtres */}
            {showFilters && (
              <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg border max-w-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Filtres</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Type de mission
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">Tous les types</option>
                      {uniqueTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {/* Carte */}
            <div className="h-96 w-full relative bg-gray-100 rounded-lg overflow-hidden">
              {/* Image de carte de fond */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-20"
                style={{
                  backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><circle cx="50" cy="50" r="2" fill="%23d1d5db"/><circle cx="30" cy="30" r="1" fill="%23d1d5db"/><circle cx="70" cy="40" r="1" fill="%23d1d5db"/><circle cx="20" cy="70" r="1" fill="%23d1d5db"/><circle cx="80" cy="80" r="1" fill="%23d1d5db"/></svg>')`
                }}
              />
              
              {/* Marqueurs */}
              {filteredMissions.map((mission) => {
                if (!mission.latitude || !mission.longitude) return null
                
                const position = coordsToPosition(mission.latitude, mission.longitude)
                const typeColor = getMissionTypeColor(mission.type).split(' ')[0]
                
                return (
                  <div
                    key={mission.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                    style={position}
                    onClick={() => handleMarkerClick(mission)}
                  >
                    <div 
                      className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${typeColor.replace('bg-', 'bg-')}`}
                      title={`${mission.title} - ${mission.type}`}
                    />
                  </div>
                )
              })}
              
              {/* Popup pour la mission sélectionnée */}
              {selectedMission && (
                <div className="absolute top-4 right-4 z-20 bg-white p-4 rounded-lg shadow-lg border max-w-xs">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {selectedMission.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMission(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3" />
                      <span>{selectedMission.location}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(selectedMission.date_start).toLocaleDateString()} - {new Date(selectedMission.date_end).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-3 w-3" />
                      <span>{formatCurrency(selectedMission.forfeit)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Users className="h-3 w-3" />
                      <span>{selectedMission.required_people || 1} technicien(s)</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <Badge className={getMissionTypeColor(selectedMission.type)}>
                      {selectedMission.type}
                    </Badge>
                  </div>
                </div>
              )}
              
              {/* Légende */}
              <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg border text-xs">
                <div className="font-medium mb-2">Légende</div>
                <div className="space-y-1">
                  {uniqueTypes.map(type => (
                    <div key={type} className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getMissionTypeColor(type).split(' ')[0].replace('bg-', 'bg-')}`} />
                      <span>{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </LoadingOverlay>
      </CardContent>
    </Card>
  )
} 
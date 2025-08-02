import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { useAdminStore } from '@/store/adminStore'
import { MissionWithAssignments } from '@/types/database'
import { formatCurrency, formatDate, getMissionTypeColor } from '@/lib/utils'
import { 
  MapPin, 
  Calendar, 
  Users, 
  Euro, 
  Eye, 
  Edit, 
  Users as UsersIcon,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'

// Import des styles Leaflet
import 'leaflet/dist/leaflet.css'

// Correction pour les icônes Leaflet
delete (Icon.Default.prototype as any)._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MissionsMapTabProps {
  onViewMission?: (mission: MissionWithAssignments) => void
  onEditMission?: (mission: MissionWithAssignments) => void
}

// Composant pour centrer la carte sur les missions
function MapCenter({ missions }: { missions: MissionWithAssignments[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (missions.length > 0) {
      const missionsWithCoords = missions.filter(m => m.latitude && m.longitude)
      if (missionsWithCoords.length > 0) {
        const bounds = missionsWithCoords.map(m => [m.latitude!, m.longitude!])
        map.fitBounds(bounds as any, { padding: [20, 20] })
      }
    }
  }, [missions, map])
  
  return null
}

// Icônes personnalisées pour chaque type de mission
const getMissionIcon = (type: string) => {
  const iconColors = {
    'Livraison jeux': '#10B981', // vert
    'Presta sono': '#3B82F6',    // bleu
    'DJ': '#8B5CF6',             // violet
    'Manutention': '#F59E0B',    // orange
    'Déplacement': '#EF4444'     // rouge
  }
  
  const color = iconColors[type as keyof typeof iconColors] || '#6B7280'
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
      </svg>
    `)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  })
}

export function MissionsMapTab({ onViewMission, onEditMission }: MissionsMapTabProps) {
  const { missions, loading } = useAdminStore()
  const [selectedMission, setSelectedMission] = useState<MissionWithAssignments | null>(null)
  const [mapKey, setMapKey] = useState(0)

  // Filtrer les missions avec coordonnées
  const missionsWithCoords = missions.filter(m => m.latitude && m.longitude)

  const handleMissionClick = (mission: MissionWithAssignments) => {
    setSelectedMission(mission)
  }

  const handleViewMission = (mission: MissionWithAssignments) => {
    onViewMission?.(mission)
  }

  const handleEditMission = (mission: MissionWithAssignments) => {
    onEditMission?.(mission)
  }

  const getAssignmentStatus = (mission: MissionWithAssignments) => {
    const accepted = mission.mission_assignments?.filter(a => a.status === 'accepté').length || 0
    const pending = mission.mission_assignments?.filter(a => a.status === 'proposé').length || 0
    const total = mission.required_people

    if (accepted >= total) {
      return { status: 'complete', text: 'Complète', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    } else if (accepted > 0) {
      return { status: 'partial', text: `${accepted}/${total} assignés`, color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    } else if (pending > 0) {
      return { status: 'pending', text: `${pending} en attente`, color: 'bg-blue-100 text-blue-800', icon: Clock }
    } else {
      return { status: 'empty', text: 'Aucun assigné', color: 'bg-gray-100 text-gray-800', icon: XCircle }
    }
  }

  if (loading.missions) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading text="Chargement de la carte..." />
      </div>
    )
  }

  if (missionsWithCoords.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-900">Aucune mission avec coordonnées</h3>
          <p className="text-gray-600">
            Les missions n'ont pas encore de coordonnées géographiques.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total missions</p>
                <p className="text-2xl font-bold text-gray-900">{missionsWithCoords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UsersIcon className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Missions complètes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {missionsWithCoords.filter(m => {
                    const accepted = m.mission_assignments?.filter(a => a.status === 'accepté').length || 0
                    return accepted >= m.required_people
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {missionsWithCoords.filter(m => {
                    const accepted = m.mission_assignments?.filter(a => a.status === 'accepté').length || 0
                    return accepted < m.required_people
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Euro className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">CA total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(missionsWithCoords.reduce((sum, m) => sum + m.forfeit, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Carte des Missions</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMapKey(prev => prev + 1)}
            >
              Recentrer
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-96 w-full">
            <MapContainer
              key={mapKey}
              center={[48.8566, 2.3522]} // Paris
              zoom={10}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              <MapCenter missions={missionsWithCoords} />
              
              {missionsWithCoords.map((mission) => {
                const assignmentStatus = getAssignmentStatus(mission)
                
                return (
                  <Marker
                    key={mission.id}
                    position={[mission.latitude!, mission.longitude!]}
                    icon={getMissionIcon(mission.type)}
                    eventHandlers={{
                      click: () => handleMissionClick(mission)
                    }}
                  >
                    <Popup>
                      <div className="space-y-3 min-w-64">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{mission.title}</h3>
                            <Badge 
                              variant="secondary" 
                              className="mt-1"
                              style={{ backgroundColor: getMissionTypeColor(mission.type) }}
                            >
                              {mission.type}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-emerald-600">
                              {formatCurrency(mission.forfeit)}
                            </p>
                          </div>
                        </div>

                        {mission.description && (
                          <p className="text-sm text-gray-600">{mission.description}</p>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">
                              {formatDate(mission.date_start)} - {formatDate(mission.date_end)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{mission.location}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">
                              {mission.required_people} personne(s) requise(s)
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-sm">
                            <assignmentStatus.icon className="h-4 w-4 text-gray-500" />
                            <Badge className={assignmentStatus.color}>
                              {assignmentStatus.text}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex space-x-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewMission(mission)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditMission(mission)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Mission sélectionnée */}
      {selectedMission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mission Sélectionnée</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMission(null)}
              >
                Fermer
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedMission.title}</h3>
                  <p className="text-sm text-gray-600">{selectedMission.location}</p>
                </div>
                <Badge 
                  variant="secondary"
                  style={{ backgroundColor: getMissionTypeColor(selectedMission.type) }}
                >
                  {selectedMission.type}
                </Badge>
              </div>

              {selectedMission.description && (
                <p className="text-gray-700">{selectedMission.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Date</p>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedMission.date_start)} - {formatDate(selectedMission.date_end)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Forfait</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(selectedMission.forfeit)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Personnes requises</p>
                  <p className="text-sm text-gray-900">{selectedMission.required_people}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Statut</p>
                  <Badge className={getAssignmentStatus(selectedMission).color}>
                    {getAssignmentStatus(selectedMission).text}
                  </Badge>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleViewMission(selectedMission)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir les détails
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleEditMission(selectedMission)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
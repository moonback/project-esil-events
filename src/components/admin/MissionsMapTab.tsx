import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { Input } from '@/components/ui/input'
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
  XCircle,
  Search,
  Filter,
  Map,
  SortAsc,
  SortDesc,
  AlertTriangle,
  TrendingUp,
  Warehouse
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

// Définition des dépôts
const DEPOTS = [
  {
    id: 'mantes-la-ville',
    name: 'Dépôt Mantes-la-Ville',
    address: '7 rue de la Cellophane, 78711 Mantes-la-Ville',
    latitude: 48.9733,
    longitude: 1.7075,
    type: 'départ',
    description: 'Dépôt principal pour les missions de livraison et prestations'
  }
]

// Icône pour les dépôts
const getDepotIcon = () => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="12" width="24" height="16" fill="#1F2937" stroke="white" stroke-width="2"/>
        <rect x="8" y="16" width="4" height="8" fill="white"/>
        <rect x="20" y="16" width="4" height="8" fill="white"/>
        <path d="M4 12L16 4L28 12" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="8" r="2" fill="#F59E0B"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  })
}

interface MissionsMapTabProps {
  onViewMission?: (mission: MissionWithAssignments) => void
  onEditMission?: (mission: MissionWithAssignments) => void
  isModalOpen?: boolean
}

// Composant pour centrer la carte sur les missions et dépôts
function MapCenter({ missions }: { missions: MissionWithAssignments[] }) {
  const map = useMap()
  
  useEffect(() => {
    const allPoints = [
      // Missions avec coordonnées
      ...missions.filter(m => m.latitude && m.longitude).map(m => [m.latitude!, m.longitude!]),
      // Dépôts
      ...DEPOTS.map(depot => [depot.latitude, depot.longitude])
    ]
    
    if (allPoints.length > 0) {
      map.fitBounds(allPoints as any, { padding: [20, 20] })
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

export function MissionsMapTab({ onViewMission, onEditMission, isModalOpen = false }: MissionsMapTabProps) {
  const { missions, loading } = useAdminStore()
  const [selectedMission, setSelectedMission] = useState<MissionWithAssignments | null>(null)
  const [mapKey, setMapKey] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'forfeit' | 'title'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Filtrer les missions avec coordonnées
  const missionsWithCoords = missions.filter(m => m.latitude && m.longitude)

  // Ajuster le z-index de la carte quand un modal est ouvert
  useEffect(() => {
    const mapContainer = document.querySelector('.leaflet-container') as HTMLElement
    if (mapContainer) {
      if (isModalOpen) {
        mapContainer.style.zIndex = '1'
      } else {
        mapContainer.style.zIndex = '400'
      }
    }
  }, [isModalOpen])

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
    const accepted = mission.mission_assignments?.filter((a: any) => a.status === 'accepté').length || 0
    const pending = mission.mission_assignments?.filter((a: any) => a.status === 'proposé').length || 0
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

  // Filtrer et trier les missions selon les critères
  const filteredAndSortedMissions = missionsWithCoords
    .filter(mission => {
      const matchesSearch = mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mission.location.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = selectedType === 'all' || mission.type === selectedType
      const assignmentStatus = getAssignmentStatus(mission)
      const matchesStatus = selectedStatus === 'all' || assignmentStatus.status === selectedStatus
      
      return matchesSearch && matchesType && matchesStatus
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
          break
        case 'forfeit':
          comparison = a.forfeit - b.forfeit
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Obtenir les types uniques
  const missionTypes = Array.from(new Set(missionsWithCoords.map(m => m.type)))

  // Calculer les statistiques
  const stats = {
    total: missionsWithCoords.length,
    complete: missionsWithCoords.filter(m => {
      const accepted = m.mission_assignments?.filter((a: any) => a.status === 'accepté').length || 0
      return accepted >= m.required_people
    }).length,
    urgent: missionsWithCoords.filter(m => {
      const today = new Date()
      const missionDate = new Date(m.date_start)
      const daysDiff = Math.ceil((missionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff <= 3 && daysDiff >= 0
    }).length,
    depots: DEPOTS.length
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
    <div className="h-full flex flex-col lg:flex-row gap-4">
      {/* Panneau de gauche - Liste des missions */}
      <div className="lg:w-1/2 flex flex-col space-y-4">
        {/* En-tête avec statistiques */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Total</p>
                  <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <UsersIcon className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Complètes</p>
                  <p className="text-lg font-bold text-gray-900">{stats.complete}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Urgentes</p>
                  <p className="text-lg font-bold text-gray-900">{stats.urgent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Warehouse className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Dépôts</p>
                  <p className="text-lg font-bold text-gray-900">{stats.depots}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et tri */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Rechercher une mission..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              <div className="flex space-x-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Tous les types</option>
                  {missionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="complete">Complètes</option>
                  <option value="partial">Partiellement assignées</option>
                  <option value="pending">En attente</option>
                  <option value="empty">Non assignées</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Trier par:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'forfeit' | 'title')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="date">Date</option>
                  <option value="forfeit">Forfait</option>
                  <option value="title">Titre</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des missions */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Missions ({filteredAndSortedMissions.length})</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedType('all')
                  setSelectedStatus('all')
                  setSortBy('date')
                  setSortOrder('asc')
                }}
              >
                Réinitialiser
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              {filteredAndSortedMissions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Aucune mission trouvée
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {filteredAndSortedMissions.map((mission) => {
                    const assignmentStatus = getAssignmentStatus(mission)
                    const today = new Date()
                    const missionDate = new Date(mission.date_start)
                    const daysDiff = Math.ceil((missionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    const isUrgent = daysDiff <= 3 && daysDiff >= 0
                    
                    return (
                      <div
                        key={mission.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedMission?.id === mission.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        } ${isUrgent ? 'border-red-300 bg-red-50' : ''}`}
                        onClick={() => handleMissionClick(mission)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {mission.title}
                              </h3>
                              {isUrgent && (
                                <Badge variant="destructive" className="text-xs">
                                  Urgent
                                </Badge>
                              )}
                              <Badge 
                                variant="secondary" 
                                className="shrink-0"
                                style={{ backgroundColor: getMissionTypeColor(mission.type) }}
                              >
                                {mission.type}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{mission.location}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(mission.date_start)}</span>
                                {isUrgent && (
                                  <span className="text-red-600 font-medium">
                                    (dans {daysDiff} jour{daysDiff > 1 ? 's' : ''})
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Users className="h-3 w-3" />
                                <span>{mission.required_people} personne(s)</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right ml-2">
                            <p className="text-sm font-bold text-emerald-600">
                              {formatCurrency(mission.forfeit)}
                            </p>
                            <Badge className={`text-xs mt-1 ${assignmentStatus.color}`}>
                              {assignmentStatus.text}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewMission(mission)
                            }}
                            className="flex-1"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditMission(mission)
                            }}
                            className="flex-1"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Modifier
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carte à droite */}
      <div className="lg:w-1/2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Map className="h-5 w-5" />
                <span>Carte des Missions et Dépôts</span>
              </span>
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
            <div className="h-96 w-full relative">
              {/* Légende de la carte */}
              <div className="absolute top-2 left-2 z-[1000] bg-white rounded-lg shadow-lg p-3 text-xs">
                <div className="font-semibold mb-2">Légende</div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-gray-600 border-2 border-white"></div>
                    <span>Dépôts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                    <span>Livraison jeux</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                    <span>Presta sono</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white"></div>
                    <span>DJ</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></div>
                    <span>Manutention</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                    <span>Déplacement</span>
                  </div>
                </div>
              </div>
              
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
                
                <MapCenter missions={filteredAndSortedMissions} />
                
                {/* Marqueurs des dépôts */}
                {DEPOTS.map((depot) => (
                  <Marker
                    key={depot.id}
                    position={[depot.latitude, depot.longitude]}
                    icon={getDepotIcon()}
                  >
                    <Popup>
                      <div className="space-y-3 min-w-64">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{depot.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="bg-gray-600 text-white">
                                {depot.type}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <Warehouse className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>

                        <p className="text-sm text-gray-600">{depot.description}</p>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{depot.address}</span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                
                {/* Marqueurs des missions */}
                {filteredAndSortedMissions.map((mission) => {
                  const assignmentStatus = getAssignmentStatus(mission)
                  const today = new Date()
                  const missionDate = new Date(mission.date_start)
                  const daysDiff = Math.ceil((missionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  const isUrgent = daysDiff <= 3 && daysDiff >= 0
                  
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
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge 
                                  variant="secondary" 
                                  style={{ backgroundColor: getMissionTypeColor(mission.type) }}
                                >
                                  {mission.type}
                                </Badge>
                                {isUrgent && (
                                  <Badge variant="destructive" className="text-xs">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
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
                              {isUrgent && (
                                <span className="text-red-600 font-medium">
                                  (dans {daysDiff} jour{daysDiff > 1 ? 's' : ''})
                                </span>
                              )}
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
      </div>
    </div>
  )
} 
import React, { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, CircleMarker, ZoomControl, ScaleControl, AttributionControl, Polyline } from 'react-leaflet'
import { Icon, LatLngBounds } from 'leaflet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loading } from '@/components/ui/loading'
import { Input } from '@/components/ui/input'
import { useAdminStore } from '@/store/adminStore'
import { MissionWithAssignments } from '@/types/database'
import { formatCurrency, formatDate, getMissionTypeColor, formatMissionTimeRange, formatMissionHours, getMissionDuration } from '@/lib/utils'
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
  Warehouse,
  Navigation,
  Layers,
  Target,
  Route,
  Info,
  Settings,
  Maximize,
  Minimize,
  ArrowLeft
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
    description: 'Dépôt principal ',
    radius: 90000 // 90km de rayon de service
  }
]

// Interface pour les détails d'itinéraire
interface RouteDetails {
  distance: string
  duration: string
  instructions: string[]
  waypoints: [number, number][]
}

// Fonction pour calculer l'itinéraire entre deux points
const calculateRoute = async (from: [number, number], to: [number, number]): Promise<RouteDetails> => {
  try {
    // Utilisation de l'API OSRM pour le routage
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&steps=true&annotations=true`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.routes && data.routes[0]) {
      const route = data.routes[0]
      const distance = (route.distance / 1000).toFixed(1) // km
      const duration = Math.round(route.duration / 60) // minutes
      
      // Extraire les instructions de navigation
      const instructions: string[] = []
      if (route.legs && route.legs[0] && route.legs[0].steps) {
        route.legs[0].steps.forEach((step: any, index: number) => {
          if (index > 0 && step.maneuver && step.maneuver.instruction) {
            instructions.push(step.maneuver.instruction)
          }
        })
      }
      
      // Extraire les waypoints pour dessiner la route
      const waypoints: [number, number][] = []
      if (route.geometry && route.geometry.coordinates) {
        route.geometry.coordinates.forEach((coord: number[]) => {
          waypoints.push([coord[1], coord[0]]) // [lat, lng]
        })
      }
      
      return {
        distance: `${distance} km`,
        duration: `${duration} min`,
        instructions: instructions.slice(0, 5), // Limiter à 5 instructions principales
        waypoints
      }
    }
  } catch (error) {
    console.error('Erreur lors du calcul d\'itinéraire:', error)
  }
  
  // Fallback si l'API échoue
  const distance = Math.sqrt(
    Math.pow((to[0] - from[0]) * 111, 2) + 
    Math.pow((to[1] - from[1]) * 111 * Math.cos(from[0] * Math.PI / 180), 2)
  ).toFixed(1)
  
  return {
    distance: `${distance} km`,
    duration: `${Math.round(parseFloat(distance) * 2)} min`,
    instructions: ['Prendre la route principale', 'Suivre les panneaux de direction'],
    waypoints: [from, to]
  }
}

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

// Icônes personnalisées pour chaque type de mission avec animation pour les urgents
const getMissionIcon = (type: string, isUrgent: boolean = false) => {
  const iconColors = {
    'Livraison jeux': '#10B981', // vert
    'Presta sono': '#3B82F6',    // bleu
    'DJ': '#8B5CF6',             // violet
    'Manutention': '#F59E0B',    // orange
    'Déplacement': '#EF4444'     // rouge
  }
  
  const color = iconColors[type as keyof typeof iconColors] || '#6B7280'
  const urgentColor = '#EF4444'
  const finalColor = isUrgent ? urgentColor : color
  
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="${finalColor}" stroke="white" stroke-width="2"/>
        <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
        ${isUrgent ? `<circle cx="12" cy="12" r="8" fill="none" stroke="white" stroke-width="1" stroke-dasharray="2,2"/>` : ''}
      </svg>
    `)}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  })
}

// Composant pour les contrôles de carte personnalisés
function MapControls({ onToggleLayers, onToggleRadius, onToggleRoutes }: {
  onToggleLayers: () => void
  onToggleRadius: () => void
  onToggleRoutes: () => void
}) {
  const [showLayers, setShowLayers] = useState(true)
  const [showRadius, setShowRadius] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false)

  return (
    <div className="absolute top-2 right-2 z-[1000] space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setShowLayers(!showLayers)
          onToggleLayers()
        }}
        className={`bg-white shadow-lg ${showLayers ? 'ring-2 ring-blue-500' : ''}`}
        title="Afficher/Masquer les couches"
      >
        <Layers className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setShowRadius(!showRadius)
          onToggleRadius()
        }}
        className={`bg-white shadow-lg ${showRadius ? 'ring-2 ring-orange-500' : ''}`}
        title="Afficher/Masquer les rayons de service"
      >
        <Target className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setShowRoutes(!showRoutes)
          onToggleRoutes()
        }}
        className={`bg-white shadow-lg ${showRoutes ? 'ring-2 ring-green-500' : ''}`}
        title="Afficher/Masquer les itinéraires"
      >
        <Route className="h-4 w-4" />
      </Button>
    </div>
  )
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
  const [showRadius, setShowRadius] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false)
  const [showLayers, setShowLayers] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedMissionForRoute, setSelectedMissionForRoute] = useState<MissionWithAssignments | null>(null)
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [showMissionDetails, setShowMissionDetails] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

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

  // Calculer l'itinéraire quand une mission est sélectionnée
  useEffect(() => {
    if (showRoutes && selectedMissionForRoute && DEPOTS.length > 0) {
      setRouteLoading(true)
      const depot = DEPOTS[0]
      calculateRoute(
        [depot.latitude, depot.longitude],
        [selectedMissionForRoute.latitude!, selectedMissionForRoute.longitude!]
      ).then(details => {
        setRouteDetails(details)
        setRouteLoading(false)
      }).catch(() => {
        setRouteLoading(false)
      })
    } else {
      setRouteDetails(null)
    }
  }, [selectedMissionForRoute, showRoutes])

  const handleMissionClick = (mission: MissionWithAssignments) => {
    // Si on clique sur la même mission et que les détails sont déjà affichés, on les ferme
    if (selectedMission?.id === mission.id && showMissionDetails) {
      setShowMissionDetails(false)
      setSelectedMission(null)
      if (showRoutes) {
        setSelectedMissionForRoute(null)
      }
    } else {
      // Sinon, on affiche les détails de la nouvelle mission
      setSelectedMission(mission)
      setShowMissionDetails(true)
      if (showRoutes) {
        setSelectedMissionForRoute(mission)
      }
    }
  }

  const handleBackToList = () => {
    setShowMissionDetails(false)
    setSelectedMission(null)
  }

  const handleViewMission = (mission: MissionWithAssignments) => {
    onViewMission?.(mission)
  }

  const handleEditMission = (mission: MissionWithAssignments) => {
    onEditMission?.(mission)
  }

  const handleToggleLayers = () => {
    setShowLayers(!showLayers)
  }

  const handleToggleRadius = () => {
    setShowRadius(!showRadius)
  }

  const handleToggleRoutes = () => {
    setShowRoutes(!showRoutes)
    if (!showRoutes) {
      // Activer le mode itinéraire
      setSelectedMissionForRoute(null)
      setRouteDetails(null)
    } else {
      // Désactiver le mode itinéraire
      setSelectedMissionForRoute(null)
      setRouteDetails(null)
    }
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

  // Calculer les missions urgentes pour les marqueurs spéciaux
  const urgentMissions = useMemo(() => {
    return filteredAndSortedMissions.filter(m => {
      const today = new Date()
      const missionDate = new Date(m.date_start)
      const daysDiff = Math.ceil((missionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff <= 3 && daysDiff >= 0
    })
  }, [filteredAndSortedMissions])

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
    <div className={`h-full flex flex-col lg:flex-row gap-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Panneau de gauche - Liste des missions ou détails de mission */}
      <div className={`${isFullscreen ? 'hidden' : 'lg:w-1/2'} flex flex-col space-y-4`}>
        {showMissionDetails && selectedMission ? (
          // Affichage des détails de la mission sélectionnée
          <div className="space-y-4">
            {/* En-tête avec bouton retour */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToList}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Retour à la liste
                  </Button>
                  <Badge 
                    variant="secondary" 
                    style={{ backgroundColor: getMissionTypeColor(selectedMission.type) }}
                  >
                    {selectedMission.type}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Détails de la mission */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedMission.title}</span>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const today = new Date()
                      const missionDate = new Date(selectedMission.date_start)
                      const daysDiff = Math.ceil((missionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                      const isUrgent = daysDiff <= 3 && daysDiff >= 0
                      return isUrgent && (
                        <Badge variant="destructive" className="text-xs">
                          Urgent
                        </Badge>
                      )
                    })()}
                    <Badge variant="secondary" className="text-lg font-bold text-emerald-600">
                      {formatCurrency(selectedMission.forfeit)}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                {selectedMission.description && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600">{selectedMission.description}</p>
                  </div>
                )}

                {/* Informations de base */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Date de début</span>
                    </div>
                    <p className="text-gray-600">{formatDate(selectedMission.date_start)}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Date de fin</span>
                    </div>
                    <p className="text-gray-600">{formatDate(selectedMission.date_end)}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Localisation</span>
                    </div>
                    <p className="text-gray-600">{selectedMission.location}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Personnes requises</span>
                    </div>
                    <p className="text-gray-600">{selectedMission.required_people} personne(s)</p>
                  </div>
                </div>

                {/* Horaires de mission avec gestion UTC */}
                <div className="space-y-3 pt-2 border-t">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>Horaires de la mission</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Horaires complets</span>
                      </div>
                      <p className="text-gray-600 font-medium">
                        {formatMissionTimeRange(selectedMission.date_start, selectedMission.date_end)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Heures uniquement</span>
                      </div>
                      <p className="text-gray-600 font-medium">
                        {formatMissionHours(selectedMission.date_start, selectedMission.date_end)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Durée totale</span>
                      </div>
                      <p className="text-gray-600 font-medium">
                        {getMissionDuration(selectedMission.date_start, selectedMission.date_end)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Fuseau horaire</span>
                      </div>
                      <p className="text-gray-600">
                        Heure locale (conversion automatique UTC)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statut des assignations */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Statut des assignations</h4>
                  <div className="space-y-2">
                    {(() => {
                      const assignmentStatus = getAssignmentStatus(selectedMission)
                      return (
                        <div className="flex items-center space-x-2">
                          <assignmentStatus.icon className="h-4 w-4 text-gray-500" />
                          <Badge className={assignmentStatus.color}>
                            {assignmentStatus.text}
                          </Badge>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
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
              </CardContent>
            </Card>
          </div>
        ) : (
          // Affichage de la liste des missions (code existant)
          <>

            {/* Barre de recherche */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Rechercher une mission..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2"
                  >
                    <Filter className="h-4 w-4" />
                    {showFilters ? 'Masquer' : 'Filtres'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filtres avancés */}
            {showFilters && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
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
            )}

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
                                    <Clock className="h-3 w-3" />
                                    <span className="font-medium">
                                      {formatMissionHours(mission.date_start, mission.date_end)}
                                    </span>
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
          </>
        )}
      </div>

      {/* Carte à droite */}
      <div className={`${isFullscreen ? 'w-full' : 'lg:w-1/2'}`}>
        <Card className={`h-full ${isFullscreen ? 'border-0 shadow-none' : ''}`}>
          <CardHeader className={`${isFullscreen ? 'p-4 border-b bg-gray-50' : ''}`}>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Map className="h-5 w-5" />
                <span>Carte des Missions et Dépôts</span>
                {urgentMissions.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {urgentMissions.length} urgentes
                  </Badge>
                )}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMapKey(prev => prev + 1)}
                >
                  Recentrer
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className={`p-0 ${isFullscreen ? 'h-[calc(100vh-80px)]' : ''}`}>
            <div className={`w-full relative ${isFullscreen ? 'h-full' : 'h-96'}`}>
              {/* Légende de la carte améliorée */}
              <div className="absolute top-2 left-2 z-[1000] bg-white rounded-lg shadow-lg p-3 text-xs max-w-48">
                <div className="font-semibold mb-2 flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>Légende</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-600 border-2 border-white rounded"></div>
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
                  {urgentMissions.length > 0 && (
                    <div className="flex items-center space-x-2 mt-2 pt-2 border-t">
                      <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-pulse"></div>
                      <span className="text-red-600 font-medium">Urgentes</span>
                    </div>
                  )}
                  {showRoutes && (
                    <div className="flex items-center space-x-2 mt-2 pt-2 border-t">
                      <div className="w-4 h-4 bg-green-500 border-2 border-white"></div>
                      <span className="text-green-600 font-medium">Itinéraires</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notification pour le mode itinéraire */}
              {showRoutes && (
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-[1000] bg-green-100 border border-green-300 rounded-lg px-4 py-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Route className="h-4 w-4 text-green-600" />
                    <span className="text-green-800 font-medium">Mode itinéraire activé - Cliquez sur une mission</span>
                  </div>
                </div>
              )}

              {/* Panneau d'informations d'itinéraire */}
              {showRoutes && selectedMissionForRoute && routeDetails && (
                <div className="absolute bottom-2 left-2 z-[1000] bg-white rounded-lg shadow-lg p-4 max-w-80">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Itinéraire vers la mission</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMissionForRoute(null)}
                        className="h-6 w-6 p-0"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Départ: {DEPOTS[0].name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">Arrivée: {selectedMissionForRoute.title}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{routeDetails.distance}</div>
                        <div className="text-xs text-gray-600">Distance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{routeDetails.duration}</div>
                        <div className="text-xs text-gray-600">Durée estimée</div>
                      </div>
                    </div>
                    
                    {routeDetails.instructions.length > 0 && (
                      <div className="pt-2 border-t">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions de navigation:</h4>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {routeDetails.instructions.map((instruction, index) => (
                            <div key={index} className="flex items-start space-x-2 text-xs">
                              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">
                                {index + 1}
                              </div>
                              <span className="text-gray-700 flex-1">{instruction}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Indicateur de chargement d'itinéraire */}
              {showRoutes && selectedMissionForRoute && routeLoading && (
                <div className="absolute bottom-2 left-2 z-[1000] bg-white rounded-lg shadow-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    <span className="text-sm text-gray-600">Calcul de l'itinéraire...</span>
                  </div>
                </div>
              )}
              
              <MapContainer
                key={mapKey}
                center={[48.8566, 2.3522]} // Paris
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <ZoomControl position="bottomright" />
                <ScaleControl position="bottomleft" />
                <AttributionControl position="bottomright" />
                
                <MapCenter missions={filteredAndSortedMissions} />
                
                {/* Cercles de rayon des dépôts */}
                {showRadius && DEPOTS.map((depot) => (
                  <Circle
                    key={`radius-${depot.id}`}
                    center={[depot.latitude, depot.longitude]}
                    radius={depot.radius}
                    pathOptions={{
                      color: '#F59E0B',
                      fillColor: '#F59E0B',
                      fillOpacity: 0.1,
                      weight: 2
                    }}
                  />
                ))}

                {/* Lignes d'itinéraire vers les missions sélectionnées */}
                {showRoutes && selectedMissionForRoute && routeDetails && (
                  <>
                    {/* Route détaillée avec waypoints */}
                    <Polyline
                      key={`route-${selectedMissionForRoute.id}`}
                      positions={routeDetails.waypoints}
                      pathOptions={{
                        color: '#10B981',
                        weight: 4,
                        opacity: 0.8,
                        dashArray: '10, 5'
                      }}
                    />
                    
                    {/* Marqueurs de début et fin d'itinéraire */}
                    <Marker
                      position={[DEPOTS[0].latitude, DEPOTS[0].longitude]}
                      icon={new Icon({
                        iconUrl: `data:image/svg+xml;base64,${btoa(`
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#10B981" stroke="white" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">D</text>
                          </svg>
                        `)}`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                      })}
                    >
                      <Popup>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-gray-900">Départ</h3>
                          <p className="text-sm text-gray-600">{DEPOTS[0].name}</p>
                          <div className="text-xs text-gray-500">
                            <div>Distance: {routeDetails.distance}</div>
                            <div>Durée: {routeDetails.duration}</div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                    
                    <Marker
                      position={[selectedMissionForRoute.latitude!, selectedMissionForRoute.longitude!]}
                      icon={new Icon({
                        iconUrl: `data:image/svg+xml;base64,${btoa(`
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill="#EF4444" stroke="white" stroke-width="2"/>
                            <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">A</text>
                          </svg>
                        `)}`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                      })}
                    >
                      <Popup>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-gray-900">Arrivée</h3>
                          <p className="text-sm text-gray-600">{selectedMissionForRoute.title}</p>
                          <div className="text-xs text-gray-500">
                            <div>Distance: {routeDetails.distance}</div>
                            <div>Durée: {routeDetails.duration}</div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </>
                )}
                
                {/* Marqueurs des dépôts */}
                {showLayers && DEPOTS.map((depot) => (
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
                          {showRadius && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Target className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">Rayon de service: 50km</span>
                            </div>
                          )}
                          {showRoutes && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Route className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700">Cliquez sur une mission pour voir l'itinéraire</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                
                {/* Marqueurs des missions avec animation pour les urgents */}
                {showLayers && filteredAndSortedMissions.map((mission) => {
                  const assignmentStatus = getAssignmentStatus(mission)
                  const today = new Date()
                  const missionDate = new Date(mission.date_start)
                  const daysDiff = Math.ceil((missionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  const isUrgent = daysDiff <= 3 && daysDiff >= 0
                  const isSelectedForRoute = selectedMissionForRoute?.id === mission.id
                  
                  return (
                    <Marker
                      key={mission.id}
                      position={[mission.latitude!, mission.longitude!]}
                      icon={getMissionIcon(mission.type, isUrgent)}
                      eventHandlers={{
                        click: () => handleMissionClick(mission)
                      }}
                    >
                      {/* Cercle de sélection pour les itinéraires */}
                      {showRoutes && isSelectedForRoute && (
                        <Circle
                          center={[mission.latitude!, mission.longitude!]}
                          radius={1000}
                          pathOptions={{
                            color: '#10B981',
                            fillColor: '#10B981',
                            fillOpacity: 0.2,
                            weight: 3
                          }}
                        />
                      )}
                      
                      {/* Popup seulement en mode plein écran */}
                      {isFullscreen && (
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
                                    <Badge variant="destructive" className="text-xs animate-pulse">
                                      Urgent
                                    </Badge>
                                  )}
                                  {isSelectedForRoute && (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                      Itinéraire sélectionné
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
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-700 font-medium">
                                  {formatMissionHours(mission.date_start, mission.date_end)}
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

                              {showRoutes && (
                                <div className="pt-2 border-t">
                                  <div className="flex items-center space-x-2 text-sm">
                                    <Route className="h-4 w-4 text-green-600" />
                                    <span className="text-green-700 font-medium">Itinéraire disponible</span>
                                  </div>
                                  {routeDetails && selectedMissionForRoute?.id === mission.id && (
                                    <div className="mt-2 space-y-1 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Distance:</span>
                                        <span className="font-medium">{routeDetails.distance}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Durée:</span>
                                        <span className="font-medium">{routeDetails.duration}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
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
                      )}
                    </Marker>
                  )
                })}
              </MapContainer>
              
              {/* Contrôles de carte personnalisés */}
              <MapControls
                onToggleLayers={handleToggleLayers}
                onToggleRadius={handleToggleRadius}
                onToggleRoutes={handleToggleRoutes}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
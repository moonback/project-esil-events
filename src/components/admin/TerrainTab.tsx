import React, { useState, useMemo, useEffect } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, Users, Calendar, Navigation, Route, 
  Car, Clock, TrendingUp, Activity, Filter,
  Layers, Target, Zap, Settings, RefreshCw
} from 'lucide-react'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import type { Mission, MissionWithAssignments } from '@/types/database'
import { MapboxMap } from '@/components/ui/mapbox-map'

// Composant de carte interactive avec Mapbox
const InteractiveMap = ({ 
  missions, 
  technicians, 
  selectedMission,
  onMissionSelect 
}: {
  missions: MissionWithAssignments[]
  technicians: any[]
  selectedMission: MissionWithAssignments | null
  onMissionSelect: (mission: MissionWithAssignments) => void
}) => {
  const [mapView, setMapView] = useState<'missions' | 'technicians' | 'routes'>('missions')

  return (
    <Card className="h-96">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Carte interactive</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={mapView === 'missions' ? 'default' : 'outline'}
              onClick={() => setMapView('missions')}
            >
              <MapPin className="h-4 w-4 mr-1" />
              Missions
            </Button>
            <Button
              size="sm"
              variant={mapView === 'technicians' ? 'default' : 'outline'}
              onClick={() => setMapView('technicians')}
            >
              <Users className="h-4 w-4 mr-1" />
              Techniciens
            </Button>
            <Button
              size="sm"
              variant={mapView === 'routes' ? 'default' : 'outline'}
              onClick={() => setMapView('routes')}
            >
              <Route className="h-4 w-4 mr-1" />
              Itinéraires
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 h-80">
        <MapboxMap
          missions={missions}
          technicians={technicians}
          selectedMission={selectedMission}
          onMissionSelect={onMissionSelect}
          mapView={mapView}
        />
      </CardContent>
    </Card>
  )
}

// Composant d'optimisation des tournées
const RouteOptimization = ({ missions }: { missions: MissionWithAssignments[] }) => {
  const [optimizationType, setOptimizationType] = useState<'distance' | 'time' | 'efficiency'>('distance')
  const [isOptimizing, setIsOptimizing] = useState(false)

  const handleOptimize = () => {
    setIsOptimizing(true)
    // Simulation de l'optimisation
    setTimeout(() => setIsOptimizing(false), 2000)
  }

  const optimizedRoutes = useMemo(() => {
    // Simulation d'itinéraires optimisés
    return [
      {
        id: 1,
        name: 'Tournée Matin',
        missions: missions.slice(0, 3),
        distance: '12.5 km',
        duration: '2h 30min',
        efficiency: '85%'
      },
      {
        id: 2,
        name: 'Tournée Après-midi',
        missions: missions.slice(3, 6),
        distance: '8.2 km',
        duration: '1h 45min',
        efficiency: '92%'
      }
    ]
  }, [missions])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Optimisation des tournées</CardTitle>
          <div className="flex items-center space-x-2">
            <select
              value={optimizationType}
              onChange={(e) => setOptimizationType(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="distance">Distance</option>
              <option value="time">Temps</option>
              <option value="efficiency">Efficacité</option>
            </select>
            <Button
              size="sm"
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isOptimizing ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-1" />
              )}
              Optimiser
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {optimizedRoutes.map((route) => (
            <div key={route.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{route.name}</h4>
                <Badge className="bg-emerald-100 text-emerald-800">
                  {route.efficiency} efficace
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-blue-500" />
                  <span>{route.distance}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>{route.duration}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-emerald-500" />
                  <span>{route.missions.length} missions</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {route.missions.map((mission) => (
                    <Badge key={mission.id} variant="outline" className="text-xs">
                      {mission.title}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Composant de statistiques terrain
const TerrainStats = ({ missions, technicians }: { missions: any[], technicians: any[] }) => {
  const stats = useMemo(() => {
    const activeMissions = missions.filter(m => 
      m.mission_assignments?.some((a: any) => a.status === 'accepté')
    )
    const totalDistance = missions.length * 15.5 // Simulation
    const avgDuration = missions.length * 2.5 // Simulation

    return {
      activeMissions: activeMissions.length,
      totalDistance: `${totalDistance.toFixed(1)} km`,
      avgDuration: `${avgDuration.toFixed(1)}h`,
      techniciansInField: technicians.filter(t => t.available).length
    }
  }, [missions, technicians])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Missions actives</p>
              <p className="text-xl font-bold text-gray-900">{stats.activeMissions}</p>
            </div>
            <Activity className="h-6 w-6 text-indigo-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Distance totale</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalDistance}</p>
            </div>
            <Navigation className="h-6 w-6 text-emerald-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Durée moyenne</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgDuration}</p>
            </div>
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Techniciens terrain</p>
              <p className="text-xl font-bold text-gray-900">{stats.techniciansInField}</p>
            </div>
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function TerrainTab() {
  const { missions, technicians, loading } = useAdminStore()
  const [selectedMission, setSelectedMission] = useState<MissionWithAssignments | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      const matchesType = filterType === 'all' || mission.type === filterType
      return matchesType
    })
  }, [missions, filterType])

  if (loading.missions || loading.technicians) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Chargement des données terrain...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestion terrain</h2>
          <p className="text-sm text-gray-600 mt-1">Visualisation et optimisation des missions sur le terrain</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">Tous les types</option>
              <option value="Livraison jeux">Livraison jeux</option>
              <option value="Presta sono">Presta sono</option>
              <option value="DJ">DJ</option>
              <option value="Manutention">Manutention</option>
              <option value="Déplacement">Déplacement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistiques terrain */}
      <div className="px-6">
        <TerrainStats missions={filteredMissions} technicians={technicians} />
      </div>

      {/* Carte interactive et optimisation */}
      <div className="px-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InteractiveMap
          missions={filteredMissions}
          technicians={technicians}
          selectedMission={selectedMission}
          onMissionSelect={setSelectedMission}
        />
        
        <RouteOptimization missions={filteredMissions} />
      </div>

      {/* Détails de la mission sélectionnée */}
      {selectedMission && (
        <div className="px-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Détails de la mission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedMission.title}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      <span>{selectedMission.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-indigo-500" />
                      <span>{formatDateTime(selectedMission.date_start)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>{selectedMission.required_people || 1} techniciens requis</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Informations terrain</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Distance estimée:</span>
                      <span className="font-medium">8.5 km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Durée estimée:</span>
                      <span className="font-medium">2h 15min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Coût carburant:</span>
                      <span className="font-medium">{formatCurrency(selectedMission.forfeit * 0.1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 
import React, { useState, useCallback, useMemo } from 'react'
import Map, {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
  Source,
  Layer,
  FullscreenControl,
  ViewStateChangeEvent
} from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, Users, Activity, Clock, CheckCircle, AlertCircle, Layers as LayersIcon } from 'lucide-react'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { MAPBOX_CONFIG } from '@/lib/mapbox-config'
import type { MissionWithAssignments } from '@/types/database'

interface MapboxMapProps {
  missions: MissionWithAssignments[]
  technicians: any[]
  selectedMission: MissionWithAssignments | null
  onMissionSelect: (mission: MissionWithAssignments) => void
  mapView: 'missions' | 'technicians' | 'routes'
}

// Coordonnées réalistes pour des adresses françaises
const FRENCH_LOCATIONS = [
  { name: 'Paris', coords: [2.3522, 48.8566] },
  { name: 'Lyon', coords: [4.8357, 45.7640] },
  { name: 'Marseille', coords: [5.3698, 43.2965] },
  { name: 'Toulouse', coords: [1.4442, 43.6047] },
  { name: 'Nice', coords: [7.2619, 43.7102] },
  { name: 'Nantes', coords: [-1.5536, 47.2184] },
  { name: 'Strasbourg', coords: [7.7521, 48.5734] },
  { name: 'Montpellier', coords: [3.8767, 43.6108] },
  { name: 'Bordeaux', coords: [-0.5792, 44.8378] },
  { name: 'Lille', coords: [3.0573, 50.6292] },
  { name: 'Rennes', coords: [-1.6778, 48.1173] },
  { name: 'Reims', coords: [4.0319, 49.2583] },
  { name: 'Le Havre', coords: [0.1079, 49.4944] },
  { name: 'Saint-Étienne', coords: [4.3872, 45.4397] },
  { name: 'Toulon', coords: [5.9280, 43.1242] },
  { name: 'Grenoble', coords: [5.7221, 45.1885] },
  { name: 'Dijon', coords: [5.0415, 47.3220] },
  { name: 'Angers', coords: [-0.5632, 47.4784] },
  { name: 'Nîmes', coords: [4.3601, 43.8367] },
  { name: 'Saint-Denis', coords: [2.3522, 48.9361] }
]

export function MapboxMap({
  missions,
  technicians,
  selectedMission,
  onMissionSelect,
  mapView
}: MapboxMapProps) {
  const [popupInfo, setPopupInfo] = useState<any>(null)
  const [mapStyle, setMapStyle] = useState(MAPBOX_CONFIG.styles.streets)
  const [viewState, setViewState] = useState(MAPBOX_CONFIG.defaultCenter)

  // Génération de coordonnées réalistes pour les missions basées sur des adresses françaises
  const missionsWithCoords = useMemo(() => {
    return missions.map((mission, index) => {
      // Si la mission a des coordonnées GPS réelles, les utiliser
      if (mission.coordinates && mission.coordinates.length === 2) {
        return {
          ...mission,
          coordinates: mission.coordinates,
          locationName: mission.location
        }
      }
      
      // Sinon, utiliser une localisation française réaliste basée sur l'index
      const locationIndex = index % FRENCH_LOCATIONS.length
      const baseLocation = FRENCH_LOCATIONS[locationIndex]
      
      // Ajouter une petite variation pour éviter que toutes les missions soient au même endroit
      const variation = {
        lng: (Math.random() - 0.5) * 0.02, // ±0.01 degré de longitude
        lat: (Math.random() - 0.5) * 0.02  // ±0.01 degré de latitude
      }
      
      return {
        ...mission,
        coordinates: [
          baseLocation.coords[0] + variation.lng,
          baseLocation.coords[1] + variation.lat
        ],
        locationName: baseLocation.name
      }
    })
  }, [missions])

  // Génération de coordonnées pour les techniciens (répartis autour des missions)
  const techniciansWithCoords = useMemo(() => {
    return technicians.map((tech, index) => {
      // Répartir les techniciens autour des missions existantes
      const missionIndex = index % missionsWithCoords.length
      const baseMission = missionsWithCoords[missionIndex] || FRENCH_LOCATIONS[0]
      
      const variation = {
        lng: (Math.random() - 0.5) * 0.01, // ±0.005 degré
        lat: (Math.random() - 0.5) * 0.01
      }
      
      return {
        ...tech,
        coordinates: [
          baseMission.coordinates[0] + variation.lng,
          baseMission.coordinates[1] + variation.lat
        ]
      }
    })
  }, [technicians, missionsWithCoords])

  // Calcul du centre de la carte basé sur les missions réelles
  const center = useMemo(() => {
    if (missionsWithCoords.length === 0) {
      return MAPBOX_CONFIG.defaultCenter
    }

    const lngs = missionsWithCoords.map(m => m.coordinates[0])
    const lats = missionsWithCoords.map(m => m.coordinates[1])

    return {
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      zoom: 8 // Zoom plus large pour voir toutes les missions
    }
  }, [missionsWithCoords])

  const onMapLoad = useCallback(() => {
    if (missionsWithCoords.length > 0) {
      setViewState(prev => ({
        ...prev,
        longitude: center.longitude,
        latitude: center.latitude,
        zoom: center.zoom
      }))
    }
  }, [center, missionsWithCoords.length])

  const getMissionStatus = (mission: MissionWithAssignments) => {
    if (!mission.mission_assignments?.length) return 'non_assigné'

    const acceptedCount = mission.mission_assignments.filter((a: any) => a.status === 'accepté').length
    const requiredPeople = mission.required_people || 1

    if (acceptedCount >= requiredPeople) return 'complet'
    if (acceptedCount > 0) return 'en_cours'
    return 'non_assigné'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complet': return '#10b981' // emerald
      case 'en_cours': return '#f59e0b' // amber
      case 'non_assigné': return '#6b7280' // gray
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complet': return CheckCircle
      case 'en_cours': return Clock
      case 'non_assigné': return AlertCircle
      default: return AlertCircle
    }
  }

  const handleStyleChange = () => {
    const styles = Object.values(MAPBOX_CONFIG.styles)
    const currentIndex = styles.indexOf(mapStyle)
    const nextIndex = (currentIndex + 1) % styles.length
    setMapStyle(styles[nextIndex])
  }

  return (
    <div className="h-full w-full rounded-lg overflow-hidden relative">
      <Map
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        onLoad={onMapLoad}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_CONFIG.accessToken}
        style={{ width: '100%', height: '100%' }}
        minZoom={MAPBOX_CONFIG.zoomLimits.min}
        maxZoom={MAPBOX_CONFIG.zoomLimits.max}
      >
        {/* Contrôles de navigation */}
        <NavigationControl position="top-right" />
        <GeolocateControl
          position="top-left"
          trackUserLocation
          showUserHeading
        />
        <FullscreenControl position="top-right" />

        {/* Marqueurs des missions */}
        {mapView === 'missions' && missionsWithCoords.map((mission) => {
          const status = getMissionStatus(mission)
          const StatusIcon = getStatusIcon(status)
          const color = getStatusColor(status)

          return (
            <Marker
              key={mission.id}
              longitude={mission.coordinates[0]}
              latitude={mission.coordinates[1]}
              anchor="bottom"
              onClick={(e: any) => {
                e.originalEvent?.stopPropagation()
                onMissionSelect(mission)
                setPopupInfo({
                  type: 'mission',
                  data: mission,
                  status,
                  color
                })
              }}
            >
              <div
                className="cursor-pointer transform hover:scale-110 transition-transform duration-200"
                style={{
                  width: `${Math.max(20, (mission.required_people || 1) * 6)}px`,
                  height: `${Math.max(20, (mission.required_people || 1) * 6)}px`,
                  backgroundColor: color,
                  borderRadius: '50%',
                  border: selectedMission?.id === mission.id ? '3px solid #3b82f6' : '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <StatusIcon className="text-white" size={12} />
                {/* Indicateur de zone */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-200 rounded-full border border-indigo-400 text-xs flex items-center justify-center text-indigo-700 font-bold">
                  {Math.floor(missionsWithCoords.indexOf(mission) / 3) + 1}
                </div>
              </div>
            </Marker>
          )
        })}

        {/* Marqueurs des techniciens */}
        {mapView === 'technicians' && techniciansWithCoords.map((tech) => (
          <Marker
            key={tech.id}
            longitude={tech.coordinates[0]}
            latitude={tech.coordinates[1]}
            anchor="bottom"
            onClick={(e: any) => {
              e.originalEvent?.stopPropagation()
              setPopupInfo({
                type: 'technician',
                data: tech
              })
            }}
          >
            <div
              className="cursor-pointer transform hover:scale-110 transition-transform duration-200"
              style={{
                width: '20px',
                height: '20px',
                backgroundColor: tech.available ? '#3b82f6' : '#ef4444',
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <Users className="text-white" size={12} />
              {/* Indicateur de statut */}
              <div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                style={{
                  backgroundColor: tech.available ? '#10b981' : '#f59e0b'
                }}
              />
            </div>
          </Marker>
        ))}

        {/* Itinéraires */}
        {mapView === 'routes' && (
          <>
            {/* Ligne d'itinéraire 1 */}
            <Source
              id="route1"
              type="geojson"
              data={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: missionsWithCoords.slice(0, 4).map(m => m.coordinates)
                }
              }}
            >
              <Layer
                id="route1-layer"
                type="line"
                paint={{
                  'line-color': '#3b82f6',
                  'line-width': 4,
                  'line-dasharray': [2, 2]
                }}
              />
            </Source>

            {/* Ligne d'itinéraire 2 */}
            <Source
              id="route2"
              type="geojson"
              data={{
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: missionsWithCoords.slice(4, 8).map(m => m.coordinates)
                }
              }}
            >
              <Layer
                id="route2-layer"
                type="line"
                paint={{
                  'line-color': '#10b981',
                  'line-width': 4,
                  'line-dasharray': [2, 2]
                }}
              />
            </Source>

            {/* Points numérotés pour les itinéraires */}
            {missionsWithCoords.slice(0, 8).map((mission, index) => (
              <Marker
                key={`route-${mission.id}`}
                longitude={mission.coordinates[0]}
                latitude={mission.coordinates[1]}
                anchor="center"
              >
                <div
                  className="bg-indigo-600 text-white rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold"
                  style={{
                    width: '24px',
                    height: '24px',
                    fontSize: '10px'
                  }}
                >
                  {index + 1}
                </div>
              </Marker>
            ))}
          </>
        )}

        {/* Popup d'information */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.data.coordinates[0]}
            latitude={popupInfo.data.coordinates[1]}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
            className="mapbox-popup"
          >
            <div className="p-3 max-w-xs">
              {popupInfo.type === 'mission' ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">{popupInfo.data.title}</h3>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600">
                        {popupInfo.data.locationName || popupInfo.data.location}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600">{formatDateTime(popupInfo.data.date_start)}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Users className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600">{popupInfo.data.required_people || 1} techniciens requis</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Montant:</span>
                      <span className="font-semibold text-emerald-600">{formatCurrency(popupInfo.data.forfeit)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: popupInfo.color }}
                    />
                    <span className="text-xs text-gray-600 capitalize">
                      {popupInfo.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">{popupInfo.data.name}</h3>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-600">{popupInfo.data.specialization}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          popupInfo.data.available ? 'bg-green-400' : 'bg-red-400'
                        }`}
                      />
                      <span className="text-gray-600">
                        {popupInfo.data.available ? 'Disponible' : 'Occupé'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Bouton de changement de style */}
      <button
        onClick={handleStyleChange}
        className="absolute top-4 left-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg p-2 shadow-lg transition-all duration-200"
        title="Changer le style de carte"
      >
        <LayersIcon className="h-4 w-4 text-gray-600" />
      </button>

      {/* Styles CSS pour les popups */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .mapboxgl-popup-content {
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: none;
            padding: 0;
          }
          
          .mapboxgl-popup-tip {
            border-top-color: white;
          }
          
          .mapboxgl-popup-close-button {
            color: #6b7280;
            font-size: 16px;
            padding: 4px;
          }
          
          .mapboxgl-ctrl-group {
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
        `
      }} />
    </div>
  )
} 
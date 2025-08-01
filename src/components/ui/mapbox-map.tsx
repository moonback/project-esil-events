import React, { useState, useCallback, useMemo } from 'react'
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

  // Génération de coordonnées réalistes pour les missions
  const missionsWithCoords = useMemo(() => {
    return missions.map((mission, index) => ({
      ...mission,
      coordinates: [
        MAPBOX_CONFIG.defaultCenter.longitude + (index * 0.02) % 0.1, // Longitude
        MAPBOX_CONFIG.defaultCenter.latitude + Math.floor(index / 5) * 0.02 // Latitude
      ]
    }))
  }, [missions])

  // Génération de coordonnées pour les techniciens
  const techniciansWithCoords = useMemo(() => {
    return technicians.map((tech, index) => ({
      ...tech,
      coordinates: [
        MAPBOX_CONFIG.defaultCenter.longitude + (index * 0.015) % 0.08, // Longitude
        MAPBOX_CONFIG.defaultCenter.latitude + Math.floor(index / 4) * 0.015 // Latitude
      ]
    }))
  }, [technicians])

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

  // Simulation de carte Mapbox (en attendant la résolution des problèmes de compatibilité)
  return (
    <div className="h-full w-full rounded-lg overflow-hidden relative">
      {/* Carte simulée en attendant Mapbox */}
      <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 border rounded-lg overflow-hidden">
        {/* Contrôles de navigation simulés */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg p-2 shadow-lg transition-all duration-200">
            <span className="text-lg">+</span>
          </button>
          <button className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg p-2 shadow-lg transition-all duration-200">
            <span className="text-lg">−</span>
          </button>
        </div>

        {/* Bouton de géolocalisation simulé */}
        <button className="absolute top-4 left-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg p-2 shadow-lg transition-all duration-200">
          <MapPin className="h-4 w-4 text-gray-600" />
        </button>

        {/* Bouton de changement de style */}
        <button
          onClick={handleStyleChange}
          className="absolute top-4 left-16 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg p-2 shadow-lg transition-all duration-200"
          title="Changer le style de carte"
        >
          <LayersIcon className="h-4 w-4 text-gray-600" />
        </button>

        {/* Grille de fond */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Zones colorées */}
        <div className="absolute top-10 left-10 w-32 h-24 bg-indigo-100 rounded-lg opacity-30 border border-indigo-200"></div>
        <div className="absolute top-40 right-20 w-28 h-20 bg-emerald-100 rounded-lg opacity-30 border border-emerald-200"></div>
        <div className="absolute bottom-20 left-20 w-24 h-16 bg-amber-100 rounded-lg opacity-30 border border-amber-200"></div>

        {/* Marqueurs des missions */}
        {mapView === 'missions' && missionsWithCoords.map((mission) => {
          const status = getMissionStatus(mission)
          const StatusIcon = getStatusIcon(status)
          const color = getStatusColor(status)

          return (
            <div
              key={mission.id}
              className="absolute cursor-pointer transform hover:scale-110 transition-transform duration-200"
              style={{
                left: `${(mission.coordinates[0] - MAPBOX_CONFIG.defaultCenter.longitude) * 1000 + 50}%`,
                top: `${(mission.coordinates[1] - MAPBOX_CONFIG.defaultCenter.latitude) * 1000 + 50}%`,
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
              onClick={() => {
                onMissionSelect(mission)
                setPopupInfo({
                  type: 'mission',
                  data: mission,
                  status,
                  color
                })
              }}
            >
              <StatusIcon className="text-white" size={12} />
              {/* Indicateur de zone */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-200 rounded-full border border-indigo-400 text-xs flex items-center justify-center text-indigo-700 font-bold">
                {Math.floor(missionsWithCoords.indexOf(mission) / 3) + 1}
              </div>
            </div>
          )
        })}

        {/* Marqueurs des techniciens */}
        {mapView === 'technicians' && techniciansWithCoords.map((tech) => (
          <div
            key={tech.id}
            className="absolute cursor-pointer transform hover:scale-110 transition-transform duration-200"
            style={{
              left: `${(tech.coordinates[0] - MAPBOX_CONFIG.defaultCenter.longitude) * 1000 + 50}%`,
              top: `${(tech.coordinates[1] - MAPBOX_CONFIG.defaultCenter.latitude) * 1000 + 50}%`,
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
            onClick={() => {
              setPopupInfo({
                type: 'technician',
                data: tech
              })
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
        ))}

        {/* Itinéraires simulés */}
        {mapView === 'routes' && (
          <>
            {/* Lignes d'itinéraire simulées */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d="M 20% 20% Q 30% 15% 35% 40% Q 40% 60% 50% 25% Q 60% 10% 65% 45%"
                stroke="#3b82f6"
                strokeWidth="3"
                fill="none"
                strokeDasharray="8,4"
              />
              <path
                d="M 30% 30% Q 40% 25% 45% 50% Q 50% 70% 60% 35%"
                stroke="#10b981"
                strokeWidth="3"
                fill="none"
                strokeDasharray="8,4"
              />
            </svg>
            
            {/* Points numérotés pour les itinéraires */}
            {missionsWithCoords.slice(0, 8).map((mission, index) => (
              <div
                key={`route-${mission.id}`}
                className="absolute bg-indigo-600 text-white rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold"
                style={{
                  left: `${(mission.coordinates[0] - MAPBOX_CONFIG.defaultCenter.longitude) * 1000 + 50}%`,
                  top: `${(mission.coordinates[1] - MAPBOX_CONFIG.defaultCenter.latitude) * 1000 + 50}%`,
                  width: '24px',
                  height: '24px',
                  fontSize: '10px'
                }}
              >
                {index + 1}
              </div>
            ))}
          </>
        )}

        {/* Popup d'information */}
        {popupInfo && (
          <div
            className="absolute bg-white rounded-lg shadow-lg border p-3 max-w-xs z-10"
            style={{
              left: `${(popupInfo.data.coordinates[0] - MAPBOX_CONFIG.defaultCenter.longitude) * 1000 + 50}%`,
              top: `${(popupInfo.data.coordinates[1] - MAPBOX_CONFIG.defaultCenter.latitude) * 1000 + 30}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <button
              onClick={() => setPopupInfo(null)}
              className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
            
            {popupInfo.type === 'mission' ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">{popupInfo.data.title}</h3>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">{popupInfo.data.location}</span>
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
        )}

        {/* Échelle */}
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg p-2 text-xs shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-0.5 bg-gray-400"></div>
            <span>1 km</span>
          </div>
        </div>

        {/* Indicateur de zoom */}
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg p-2 text-xs shadow-lg">
          <span>100%</span>
        </div>

        {/* Message d'information */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-95 rounded-lg p-4 text-center shadow-lg">
          <div className="text-sm text-gray-600 mb-2">
            🗺️ Carte Mapbox en cours de configuration
          </div>
          <div className="text-xs text-gray-500">
            Ajoutez votre token Mapbox dans le fichier .env pour activer la vraie carte
          </div>
        </div>
      </div>
    </div>
  )
} 
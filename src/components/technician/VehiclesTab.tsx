import React, { useState, useEffect } from 'react'
import { useVehiclesStore } from '../../store/vehiclesStore'
import { useMissionsStore } from '../../store/missionsStore'
import { Vehicle, Mission } from '../../types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Car, Truck, CarFront, Calendar, MapPin, Euro } from 'lucide-react'
import { formatDateTime, formatCurrency } from '../../lib/utils'

interface MissionWithVehicles extends Mission {
  vehicles: Vehicle[]
}

const vehicleTypeIcons = {
  camion: Truck,
  fourgon: Car,
  utilitaire: Car,
  voiture: CarFront
}

const vehicleTypeLabels = {
  camion: 'Camion',
  fourgon: 'Fourgon',
  utilitaire: 'Utilitaire',
  voiture: 'Voiture'
}

const vehicleStatusLabels = {
  disponible: 'Disponible',
  en_maintenance: 'En maintenance',
  hors_service: 'Hors service',
  en_mission: 'En mission'
}

const vehicleStatusColors = {
  disponible: 'bg-green-100 text-green-800',
  en_maintenance: 'bg-yellow-100 text-yellow-800',
  hors_service: 'bg-red-100 text-red-800',
  en_mission: 'bg-blue-100 text-blue-800'
}

export function VehiclesTab() {
  const { getMissionVehicles } = useVehiclesStore()
  const { missions } = useMissionsStore()
  const [missionsWithVehicles, setMissionsWithVehicles] = useState<MissionWithVehicles[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMissionsWithVehicles()
  }, [missions])

  const loadMissionsWithVehicles = async () => {
    setLoading(true)
    try {
      const missionsWithVehiclesData = await Promise.all(
        missions.map(async (mission) => {
          const vehicles = await getMissionVehicles(mission.id)
          return {
            ...mission,
            vehicles
          }
        })
      )

      // Filtrer seulement les missions qui ont des véhicules assignés
      const missionsWithAssignedVehicles = missionsWithVehiclesData.filter(
        mission => mission.vehicles.length > 0
      )

      setMissionsWithVehicles(missionsWithAssignedVehicles)
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des véhicules...</p>
        </div>
      </div>
    )
  }

  if (missionsWithVehicles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Car className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun véhicule assigné</h3>
          <p className="text-muted-foreground text-center">
            Vous n'avez pas encore de véhicules assignés à vos missions
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Véhicules de mes missions</h2>
        <p className="text-muted-foreground">
          Consultez les véhicules assignés à vos missions
        </p>
      </div>

      <div className="space-y-6">
        {missionsWithVehicles.map((mission) => (
          <Card key={mission.id} className="border-l-4 border-l-teal-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  <span>{mission.title}</span>
                </div>
                <Badge variant="outline">
                  {formatDateTime(mission.date_start)}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{mission.location}</span>
                <span>•</span>
                <Euro className="h-4 w-4" />
                <span>{formatCurrency(mission.forfeit)}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mission.vehicles.map((vehicle) => {
                  const IconComponent = vehicleTypeIcons[vehicle.type]
                  return (
                    <Card key={vehicle.id} className="border border-gray-200 hover:border-teal-200 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-5 h-5 text-teal-600" />
                            <div>
                              <h4 className="font-semibold text-gray-900">{vehicle.name}</h4>
                              <p className="text-sm text-gray-600">{vehicle.model}</p>
                            </div>
                          </div>
                          <Badge className={vehicleStatusColors[vehicle.status]}>
                            {vehicleStatusLabels[vehicle.status]}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">
                              {vehicleTypeLabels[vehicle.type]}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {vehicle.license_plate}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            {vehicle.year && (
                              <div>
                                <span className="font-medium">Année:</span> {vehicle.year}
                              </div>
                            )}
                            {vehicle.capacity && (
                              <div>
                                <span className="font-medium">Capacité:</span> {vehicle.capacity} pers.
                              </div>
                            )}
                            {vehicle.fuel_type && (
                              <div>
                                <span className="font-medium">Carburant:</span> {vehicle.fuel_type}
                              </div>
                            )}
                          </div>
                          
                          {vehicle.notes && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Notes:</span> {vehicle.notes}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 
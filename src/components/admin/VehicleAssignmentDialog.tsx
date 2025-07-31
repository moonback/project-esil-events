import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useVehiclesStore } from '@/store/vehiclesStore'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/lib/useToast'
import {
  getVehicleStatusLabel,
  getVehicleStatusColor,
  getVehicleStatusIcon,
  getVehicleCategoryLabel,
  getVehicleCategoryIcon,
  getFuelTypeLabel,
  getFuelTypeIcon,
  formatMileage,
  formatPayload,
  formatVolume,
  isVehicleAvailable
} from '@/lib/utils'
import { Search, Car, Check, X } from 'lucide-react'
import type { CompanyVehicle, Mission } from '@/types/database'

interface VehicleAssignmentDialogProps {
  mission: Mission
  open: boolean
  onOpenChange: (open: boolean) => void
  onVehicleAssigned?: (vehicleId: string) => void
}

export const VehicleAssignmentDialog: React.FC<VehicleAssignmentDialogProps> = ({
  mission,
  open,
  onOpenChange,
  onVehicleAssigned
}) => {
  const { vehicles, loading, fetchVehicles, assignVehicleToMission } = useVehiclesStore()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<CompanyVehicle | null>(null)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (open) {
      fetchVehicles()
      setSearchTerm('')
      setSelectedVehicle(null)
    }
  }, [open, fetchVehicles])

  // Filtrer les véhicules disponibles qui correspondent au type requis
  const availableVehicles = vehicles.filter(vehicle => {
    const isAvailable = isVehicleAvailable(vehicle)
    const matchesType = mission.vehicle_type === 'aucun' || 
                       vehicle.category === mission.vehicle_type ||
                       mission.vehicle_type === null
    const matchesSearch = vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
    
    return isAvailable && matchesType && matchesSearch
  })

  const handleAssignVehicle = async () => {
    if (!selectedVehicle || !user) return

    setAssigning(true)
    try {
      await assignVehicleToMission(selectedVehicle.id, mission.id, user.id)
      toast({
        title: 'Succès',
        description: `Véhicule ${selectedVehicle.name} assigné à la mission`
      })
      onVehicleAssigned?.(selectedVehicle.id)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'assignation du véhicule',
        variant: 'destructive'
      })
    } finally {
      setAssigning(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Assigner un véhicule</h2>
            <p className="text-gray-600">Mission: {mission.title}</p>
          </div>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Informations de la mission */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Détails de la mission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type de véhicule requis:</span>
                <Badge className="ml-2">
                  {mission.vehicle_type === 'aucun' ? 'Aucun' : mission.vehicle_type}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Localisation:</span> {mission.location}
              </div>
              <div>
                <span className="font-medium">Date:</span> {new Date(mission.date_start).toLocaleDateString('fr-FR')}
              </div>
              <div>
                <span className="font-medium">Durée:</span> {Math.round((new Date(mission.date_end).getTime() - new Date(mission.date_start).getTime()) / (1000 * 60 * 60))}h
              </div>
            </div>
            {mission.vehicle_details && (
              <div className="mt-2">
                <span className="font-medium">Détails véhicule:</span> {mission.vehicle_details}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recherche */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher un véhicule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Liste des véhicules disponibles */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement des véhicules...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                Véhicules disponibles ({availableVehicles.length})
              </h3>
              {selectedVehicle && (
                <Button
                  onClick={handleAssignVehicle}
                  disabled={assigning}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {assigning ? 'Assignation...' : `Assigner ${selectedVehicle.name}`}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {availableVehicles.map((vehicle) => (
                <Card 
                  key={vehicle.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedVehicle?.id === vehicle.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : ''
                  }`}
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <span>{getVehicleCategoryIcon(vehicle.category)}</span>
                          {vehicle.name}
                        </CardTitle>
                        <CardDescription>
                          {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                        </CardDescription>
                      </div>
                      {selectedVehicle?.id === vehicle.id && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={getVehicleStatusColor(vehicle.status)}>
                        <span className="mr-1">{getVehicleStatusIcon(vehicle.status)}</span>
                        {getVehicleStatusLabel(vehicle.status)}
                      </Badge>
                      <Badge variant="outline">
                        {getVehicleCategoryLabel(vehicle.category)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {vehicle.license_plate && (
                        <div>
                          <span className="font-medium">Plaque:</span> {vehicle.license_plate}
                        </div>
                      )}
                      {vehicle.fuel_type && (
                        <div>
                          <span className="font-medium">Carburant:</span> {getFuelTypeIcon(vehicle.fuel_type)} {getFuelTypeLabel(vehicle.fuel_type)}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Kilométrage:</span> {formatMileage(vehicle.current_mileage)}
                      </div>
                      {vehicle.max_payload && (
                        <div>
                          <span className="font-medium">Charge max:</span> {formatPayload(vehicle.max_payload)}
                        </div>
                      )}
                      {vehicle.max_volume && (
                        <div>
                          <span className="font-medium">Volume max:</span> {formatVolume(vehicle.max_volume)}
                        </div>
                      )}
                    </div>

                    {vehicle.notes && (
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Notes:</span> {vehicle.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {availableVehicles.length === 0 && (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Aucun véhicule disponible correspondant à cette recherche' 
                    : 'Aucun véhicule disponible pour ce type de mission'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  )
} 
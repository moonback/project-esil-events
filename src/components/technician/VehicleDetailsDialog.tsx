import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  formatFuelCapacity,
  formatDateTime
} from '@/lib/utils'
import { Car, X, Phone, MapPin, Calendar, Wrench, AlertTriangle } from 'lucide-react'
import type { Mission, CompanyVehicle } from '@/types/database'

interface VehicleDetailsDialogProps {
  mission: Mission
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const VehicleDetailsDialog: React.FC<VehicleDetailsDialogProps> = ({
  mission,
  open,
  onOpenChange
}) => {
  const { vehicleAssignments, fetchVehicleAssignments, returnVehicle } = useVehiclesStore()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [returning, setReturning] = useState(false)

  useEffect(() => {
    if (open) {
      fetchVehicleAssignments()
    }
  }, [open, fetchVehicleAssignments])

  // Trouver l'assignation de véhicule pour cette mission
  const vehicleAssignment = vehicleAssignments.find(va => va.mission_id === mission.id)
  const assignedVehicle = vehicleAssignment ? vehicleAssignment.vehicle : null

  const handleReturnVehicle = async () => {
    if (!vehicleAssignment || !user) return

    setReturning(true)
    try {
      await returnVehicle(vehicleAssignment.vehicle_id, mission.id)
      toast({
        title: 'Succès',
        description: 'Véhicule retourné avec succès'
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors du retour du véhicule',
        variant: 'destructive'
      })
    } finally {
      setReturning(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Détails du véhicule</h2>
            <p className="text-gray-600">Mission: {mission.title}</p>
          </div>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement des détails...</p>
          </div>
        ) : assignedVehicle ? (
          <div className="space-y-4">
            {/* Informations principales du véhicule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{getVehicleCategoryIcon(assignedVehicle.category)}</span>
                  {assignedVehicle.name}
                </CardTitle>
                <CardDescription>
                  {assignedVehicle.brand} {assignedVehicle.model} {assignedVehicle.year && `(${assignedVehicle.year})`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getVehicleStatusColor(assignedVehicle.status)}>
                    <span className="mr-1">{getVehicleStatusIcon(assignedVehicle.status)}</span>
                    {getVehicleStatusLabel(assignedVehicle.status)}
                  </Badge>
                  <Badge variant="outline">
                    {getVehicleCategoryLabel(assignedVehicle.category)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {assignedVehicle.license_plate && (
                    <div>
                      <span className="font-medium">Plaque d'immatriculation:</span>
                      <div className="text-lg font-mono bg-gray-100 px-2 py-1 rounded mt-1">
                        {assignedVehicle.license_plate}
                      </div>
                    </div>
                  )}
                  
                  {assignedVehicle.fuel_type && (
                    <div>
                      <span className="font-medium">Carburant:</span>
                      <div className="flex items-center gap-1 mt-1">
                        <span>{getFuelTypeIcon(assignedVehicle.fuel_type)}</span>
                        <span>{getFuelTypeLabel(assignedVehicle.fuel_type)}</span>
                        {assignedVehicle.fuel_capacity && (
                          <span className="text-gray-500">({formatFuelCapacity(assignedVehicle.fuel_capacity)})</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="font-medium">Kilométrage actuel:</span>
                    <div className="text-lg font-mono mt-1">{formatMileage(assignedVehicle.current_mileage)}</div>
                  </div>

                  {assignedVehicle.max_payload && (
                    <div>
                      <span className="font-medium">Charge maximale:</span>
                      <div className="mt-1">{formatPayload(assignedVehicle.max_payload)}</div>
                    </div>
                  )}

                  {assignedVehicle.max_volume && (
                    <div>
                      <span className="font-medium">Volume maximal:</span>
                      <div className="mt-1">{formatVolume(assignedVehicle.max_volume)}</div>
                    </div>
                  )}
                </div>

                {/* Informations de maintenance */}
                {(assignedVehicle.last_maintenance_date || assignedVehicle.next_maintenance_date) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Maintenance
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {assignedVehicle.last_maintenance_date && (
                        <div>
                          <span className="font-medium">Dernière maintenance:</span>
                          <div className="mt-1">{formatDateTime(assignedVehicle.last_maintenance_date)}</div>
                        </div>
                      )}
                      {assignedVehicle.next_maintenance_date && (
                        <div>
                          <span className="font-medium">Prochaine maintenance:</span>
                          <div className="mt-1">{formatDateTime(assignedVehicle.next_maintenance_date)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Informations d'assurance et immatriculation */}
                {(assignedVehicle.insurance_expiry_date || assignedVehicle.registration_expiry_date) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Documents
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {assignedVehicle.insurance_expiry_date && (
                        <div>
                          <span className="font-medium">Expiration assurance:</span>
                          <div className="mt-1">{formatDateTime(assignedVehicle.insurance_expiry_date)}</div>
                        </div>
                      )}
                      {assignedVehicle.registration_expiry_date && (
                        <div>
                          <span className="font-medium">Expiration immatriculation:</span>
                          <div className="mt-1">{formatDateTime(assignedVehicle.registration_expiry_date)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {assignedVehicle.notes && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Notes</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      {assignedVehicle.notes}
                    </div>
                  </div>
                )}

                {/* Informations d'assignation */}
                {vehicleAssignment && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Assignation
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Assigné le:</span>
                        <div className="mt-1">{formatDateTime(vehicleAssignment.assigned_at)}</div>
                      </div>
                      {vehicleAssignment.returned_at && (
                        <div>
                          <span className="font-medium">Retourné le:</span>
                          <div className="mt-1">{formatDateTime(vehicleAssignment.returned_at)}</div>
                        </div>
                      )}
                    </div>
                    {vehicleAssignment.notes && (
                      <div className="mt-2">
                        <span className="font-medium">Notes d'assignation:</span>
                        <div className="mt-1 bg-blue-50 p-2 rounded text-sm">
                          {vehicleAssignment.notes}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bouton de retour */}
            {vehicleAssignment && !vehicleAssignment.returned_at && (
              <div className="flex justify-end">
                <Button
                  onClick={handleReturnVehicle}
                  disabled={returning}
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  {returning ? 'Retour en cours...' : 'Retourner le véhicule'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun véhicule assigné à cette mission</p>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
} 
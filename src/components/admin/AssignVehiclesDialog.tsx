import React, { useState, useEffect } from 'react'
import { useVehiclesStore } from '../../store/vehiclesStore'
import { Mission, Vehicle } from '../../types/database'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { useToast } from '../../lib/useToast'
import { Car, Truck, CarFront, Check, X } from 'lucide-react'

interface AssignVehiclesDialogProps {
  mission: Mission | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface VehicleWithAssignment extends Vehicle {
  isAssigned: boolean
  assignmentNotes?: string
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

export function AssignVehiclesDialog({ mission, open, onOpenChange }: AssignVehiclesDialogProps) {
  const { 
    fetchAvailableVehicles, 
    getMissionVehicles, 
    assignVehicleToMission, 
    unassignVehicleFromMission,
    loading 
  } = useVehiclesStore()
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<VehicleWithAssignment[]>([])
  const [assignmentNotes, setAssignmentNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open && mission) {
      fetchVehiclesData()
    }
  }, [open, mission])

  const fetchVehiclesData = async () => {
    if (!mission) return

    try {
      // Récupérer tous les véhicules disponibles
      const availableVehicles = await fetchAvailableVehicles()
      
      // Récupérer les véhicules déjà assignés à cette mission
      const assignedVehicles = await getMissionVehicles(mission.id)
      
      // Combiner les données
      const allVehicles = availableVehicles.map(vehicle => ({
        ...vehicle,
        isAssigned: false
      }))

      const assignedVehiclesWithFlag = assignedVehicles.map(vehicle => ({
        ...vehicle,
        isAssigned: true
      }))

      setVehicles([...allVehicles, ...assignedVehiclesWithFlag])
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les véhicules',
        variant: 'destructive'
      })
    }
  }

  const handleAssignVehicle = async (vehicle: VehicleWithAssignment) => {
    if (!mission) return

    try {
      const notes = assignmentNotes[vehicle.id] || ''
      await assignVehicleToMission(mission.id, vehicle.id, notes)
      
      // Mettre à jour l'état local
      setVehicles(prev => prev.map(v => 
        v.id === vehicle.id 
          ? { ...v, isAssigned: true }
          : v
      ))

      toast({
        title: 'Succès',
        description: `Véhicule "${vehicle.name}" assigné à la mission`
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'assigner le véhicule',
        variant: 'destructive'
      })
    }
  }

  const handleUnassignVehicle = async (vehicle: VehicleWithAssignment) => {
    if (!mission) return

    try {
      await unassignVehicleFromMission(mission.id, vehicle.id)
      
      // Mettre à jour l'état local
      setVehicles(prev => prev.map(v => 
        v.id === vehicle.id 
          ? { ...v, isAssigned: false }
          : v
      ))

      // Supprimer les notes d'assignation
      setAssignmentNotes(prev => {
        const newNotes = { ...prev }
        delete newNotes[vehicle.id]
        return newNotes
      })

      toast({
        title: 'Succès',
        description: `Véhicule "${vehicle.name}" retiré de la mission`
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer le véhicule',
        variant: 'destructive'
      })
    }
  }

  const handleNotesChange = (vehicleId: string, notes: string) => {
    setAssignmentNotes(prev => ({
      ...prev,
      [vehicleId]: notes
    }))
  }

  const canAssignVehicle = (vehicle: VehicleWithAssignment) => {
    return !vehicle.isAssigned && vehicle.status === 'disponible'
  }

  const assignedVehicles = vehicles.filter(v => v.isAssigned)
  const availableVehicles = vehicles.filter(v => canAssignVehicle(v))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assigner des véhicules à la mission</DialogTitle>
          <DialogDescription>
            Sélectionnez les véhicules à assigner à la mission "{mission?.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Véhicules assignés */}
          {assignedVehicles.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Véhicules assignés ({assignedVehicles.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedVehicles.map((vehicle) => {
                  const IconComponent = vehicleTypeIcons[vehicle.type]
                  return (
                    <Card key={vehicle.id} className="border-green-200 bg-green-50">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-5 h-5 text-green-600" />
                            <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnassignVehicle(vehicle)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <CardDescription>
                          {vehicle.model} • {vehicle.license_plate}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline">
                            {vehicleTypeLabels[vehicle.type]}
                          </Badge>
                          <Badge className={vehicleStatusColors[vehicle.status]}>
                            {vehicleStatusLabels[vehicle.status]}
                          </Badge>
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
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Véhicules disponibles */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Véhicules disponibles ({availableVehicles.length})
            </h3>
            {availableVehicles.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Car className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Aucun véhicule disponible pour cette mission
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableVehicles.map((vehicle) => {
                  const IconComponent = vehicleTypeIcons[vehicle.type]
                  return (
                    <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssignVehicle(vehicle)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                        <CardDescription>
                          {vehicle.model} • {vehicle.license_plate}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline">
                            {vehicleTypeLabels[vehicle.type]}
                          </Badge>
                          <Badge className={vehicleStatusColors[vehicle.status]}>
                            {vehicleStatusLabels[vehicle.status]}
                          </Badge>
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

                        {/* Notes d'assignation */}
                        <div className="space-y-2">
                          <Label htmlFor={`notes-${vehicle.id}`} className="text-sm">
                            Notes d'assignation (optionnel)
                          </Label>
                          <Textarea
                            id={`notes-${vehicle.id}`}
                            value={assignmentNotes[vehicle.id] || ''}
                            onChange={(e) => handleNotesChange(vehicle.id, e.target.value)}
                            placeholder="Raison de l'assignation, instructions spéciales..."
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
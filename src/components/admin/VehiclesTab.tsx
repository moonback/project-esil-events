import React, { useState, useEffect } from 'react'
import { useVehiclesStore } from '../../store/vehiclesStore'
import { Vehicle, VehicleType, VehicleStatus } from '../../types/database'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useToast } from '../../lib/useToast'
import { Trash2, Edit, Plus, Car, Truck, Van, CarFront } from 'lucide-react'

interface VehicleFormData {
  name: string
  type: VehicleType
  license_plate: string
  model: string
  year: number | null
  capacity: number | null
  fuel_type: string
  status: VehicleStatus
  notes: string
}

const vehicleTypeIcons = {
  camion: Truck,
  fourgon: Van,
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
  const { vehicles, loading, error, fetchVehicles, createVehicle, updateVehicle, deleteVehicle, clearError } = useVehiclesStore()
  const { toast } = useToast()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [formData, setFormData] = useState<VehicleFormData>({
    name: '',
    type: 'voiture',
    license_plate: '',
    model: '',
    year: null,
    capacity: null,
    fuel_type: '',
    status: 'disponible',
    notes: ''
  })

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  useEffect(() => {
    if (error) {
      toast({
        title: 'Erreur',
        description: error,
        variant: 'destructive'
      })
      clearError()
    }
  }, [error, toast, clearError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, formData)
        toast({
          title: 'Succès',
          description: 'Véhicule mis à jour avec succès'
        })
      } else {
        await createVehicle(formData)
        toast({
          title: 'Succès',
          description: 'Véhicule créé avec succès'
        })
      }
      
      setIsCreateDialogOpen(false)
      setEditingVehicle(null)
      resetForm()
    } catch (error) {
      // L'erreur est déjà gérée par le store
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      name: vehicle.name,
      type: vehicle.type,
      license_plate: vehicle.license_plate,
      model: vehicle.model,
      year: vehicle.year,
      capacity: vehicle.capacity,
      fuel_type: vehicle.fuel_type || '',
      status: vehicle.status,
      notes: vehicle.notes || ''
    })
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (vehicle: Vehicle) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le véhicule "${vehicle.name}" ?`)) {
      try {
        await deleteVehicle(vehicle.id)
        toast({
          title: 'Succès',
          description: 'Véhicule supprimé avec succès'
        })
      } catch (error) {
        // L'erreur est déjà gérée par le store
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'voiture',
      license_plate: '',
      model: '',
      year: null,
      capacity: null,
      fuel_type: '',
      status: 'disponible',
      notes: ''
    })
  }

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false)
    setEditingVehicle(null)
    resetForm()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Véhicules</h2>
          <p className="text-muted-foreground">
            Gérez la flotte de véhicules de l'entreprise
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un véhicule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
              </DialogTitle>
              <DialogDescription>
                {editingVehicle 
                  ? 'Modifiez les informations du véhicule'
                  : 'Ajoutez un nouveau véhicule à la flotte'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du véhicule *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Camion Principal"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type de véhicule *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: VehicleType) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(vehicleTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_plate">Plaque d'immatriculation *</Label>
                  <Input
                    id="license_plate"
                    value={formData.license_plate}
                    onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                    placeholder="Ex: AB-123-CD"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modèle *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Ex: Renault Master"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Année</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="2020"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacité (personnes)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity || ''}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="3"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuel_type">Carburant</Label>
                  <Input
                    id="fuel_type"
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                    placeholder="Diesel"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: VehicleStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(vehicleStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informations supplémentaires..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Enregistrement...' : (editingVehicle ? 'Mettre à jour' : 'Créer')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading && vehicles.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des véhicules...</p>
          </div>
        </div>
      ) : vehicles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Car className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun véhicule</h3>
            <p className="text-muted-foreground text-center mb-4">
              Commencez par ajouter votre premier véhicule à la flotte
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un véhicule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => {
            const IconComponent = vehicleTypeIcons[vehicle.type]
            return (
              <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(vehicle)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(vehicle)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
      )}
    </div>
  )
} 
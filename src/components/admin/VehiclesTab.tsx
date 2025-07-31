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
  formatFuelCapacity,
  isVehicleAvailable,
  isVehicleExpired,
  getDaysUntilExpiry
} from '@/lib/utils'
import { Plus, Search, Edit, Trash2, Car, Wrench, Users, Calendar, AlertTriangle } from 'lucide-react'
import type { CompanyVehicle } from '@/types/database'

interface VehicleDialogProps {
  vehicle?: CompanyVehicle
  onClose: () => void
  onSave: (vehicle: Omit<CompanyVehicle, 'id' | 'created_at' | 'updated_at'>) => void
}

const VehicleDialog: React.FC<VehicleDialogProps> = ({ vehicle, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: vehicle?.name || '',
    category: vehicle?.category || 'camionnette',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year || null,
    license_plate: vehicle?.license_plate || '',
    vin: vehicle?.vin || '',
    fuel_type: vehicle?.fuel_type || null,
    fuel_capacity: vehicle?.fuel_capacity || null,
    max_payload: vehicle?.max_payload || null,
    max_volume: vehicle?.max_volume || null,
    status: vehicle?.status || 'disponible',
    current_mileage: vehicle?.current_mileage || 0,
    last_maintenance_date: vehicle?.last_maintenance_date || null,
    next_maintenance_date: vehicle?.next_maintenance_date || null,
    insurance_expiry_date: vehicle?.insurance_expiry_date || null,
    registration_expiry_date: vehicle?.registration_expiry_date || null,
    notes: vehicle?.notes || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {vehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}
          </h2>
          <Button variant="ghost" onClick={onClose}>✕</Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nom du véhicule</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Catégorie</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="voiture_particuliere">Voiture particulière</option>
                <option value="camionnette">Camionnette</option>
                <option value="camion">Camion</option>
                <option value="fourgon">Fourgon</option>
                <option value="remorque">Remorque</option>
                <option value="moto">Moto</option>
                <option value="velo">Vélo</option>
              </select>
            </div>

            <div>
              <Label htmlFor="brand">Marque</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="model">Modèle</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="year">Année</Label>
              <Input
                id="year"
                type="number"
                value={formData.year || ''}
                onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : null })}
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <Label htmlFor="license_plate">Plaque d'immatriculation</Label>
              <Input
                id="license_plate"
                value={formData.license_plate || ''}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="vin">Numéro VIN</Label>
              <Input
                id="vin"
                value={formData.vin || ''}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="fuel_type">Type de carburant</Label>
              <select
                id="fuel_type"
                value={formData.fuel_type || ''}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value || null })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Non spécifié</option>
                <option value="essence">Essence</option>
                <option value="diesel">Diesel</option>
                <option value="electrique">Électrique</option>
                <option value="hybride">Hybride</option>
                <option value="gpl">GPL</option>
              </select>
            </div>

            <div>
              <Label htmlFor="fuel_capacity">Capacité carburant (L)</Label>
              <Input
                id="fuel_capacity"
                type="number"
                value={formData.fuel_capacity || ''}
                onChange={(e) => setFormData({ ...formData, fuel_capacity: e.target.value ? parseFloat(e.target.value) : null })}
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <Label htmlFor="max_payload">Charge maximale (kg)</Label>
              <Input
                id="max_payload"
                type="number"
                value={formData.max_payload || ''}
                onChange={(e) => setFormData({ ...formData, max_payload: e.target.value ? parseFloat(e.target.value) : null })}
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <Label htmlFor="max_volume">Volume maximal (m³)</Label>
              <Input
                id="max_volume"
                type="number"
                value={formData.max_volume || ''}
                onChange={(e) => setFormData({ ...formData, max_volume: e.target.value ? parseFloat(e.target.value) : null })}
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="disponible">Disponible</option>
                <option value="en_mission">En mission</option>
                <option value="maintenance">En maintenance</option>
                <option value="hors_service">Hors service</option>
              </select>
            </div>

            <div>
              <Label htmlFor="current_mileage">Kilométrage actuel</Label>
              <Input
                id="current_mileage"
                type="number"
                value={formData.current_mileage}
                onChange={(e) => setFormData({ ...formData, current_mileage: parseInt(e.target.value) || 0 })}
                min="0"
                required
              />
            </div>

            <div>
              <Label htmlFor="last_maintenance_date">Dernière maintenance</Label>
              <Input
                id="last_maintenance_date"
                type="date"
                value={formData.last_maintenance_date ? formData.last_maintenance_date.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, last_maintenance_date: e.target.value || null })}
              />
            </div>

            <div>
              <Label htmlFor="next_maintenance_date">Prochaine maintenance</Label>
              <Input
                id="next_maintenance_date"
                type="date"
                value={formData.next_maintenance_date ? formData.next_maintenance_date.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value || null })}
              />
            </div>

            <div>
              <Label htmlFor="insurance_expiry_date">Expiration assurance</Label>
              <Input
                id="insurance_expiry_date"
                type="date"
                value={formData.insurance_expiry_date ? formData.insurance_expiry_date.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, insurance_expiry_date: e.target.value || null })}
              />
            </div>

            <div>
              <Label htmlFor="registration_expiry_date">Expiration immatriculation</Label>
              <Input
                id="registration_expiry_date"
                type="date"
                value={formData.registration_expiry_date ? formData.registration_expiry_date.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, registration_expiry_date: e.target.value || null })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border rounded-md h-20"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {vehicle ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const VehiclesTab: React.FC = () => {
  const { vehicles, loading, error, fetchVehicles, addVehicle, updateVehicle, deleteVehicle } = useVehiclesStore()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<CompanyVehicle | null>(null)

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
    }
  }, [error, toast])

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vehicle.license_plate && vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleAddVehicle = async (vehicleData: Omit<CompanyVehicle, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await addVehicle(vehicleData)
      setShowDialog(false)
      toast({
        title: 'Succès',
        description: 'Véhicule ajouté avec succès'
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'ajout du véhicule',
        variant: 'destructive'
      })
    }
  }

  const handleEditVehicle = async (vehicleData: Omit<CompanyVehicle, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingVehicle) return
    
    try {
      await updateVehicle(editingVehicle.id, vehicleData)
      setShowDialog(false)
      setEditingVehicle(null)
      toast({
        title: 'Succès',
        description: 'Véhicule modifié avec succès'
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la modification du véhicule',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return
    
    try {
      await deleteVehicle(id)
      toast({
        title: 'Succès',
        description: 'Véhicule supprimé avec succès'
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression du véhicule',
        variant: 'destructive'
      })
    }
  }

  const openEditDialog = (vehicle: CompanyVehicle) => {
    setEditingVehicle(vehicle)
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setEditingVehicle(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Véhicules</h2>
          <p className="text-gray-600">Gérez la flotte de véhicules de l'entreprise</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un véhicule
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Rechercher un véhicule..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Véhicules</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            <div className="h-4 w-4 text-green-600">✅</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.filter(v => v.status === 'disponible').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Mission</CardTitle>
            <div className="h-4 w-4 text-blue-600">🚛</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.filter(v => v.status === 'en_mission').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.filter(v => v.status === 'maintenance').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des véhicules...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredVehicles.map((vehicle) => {
            const insuranceExpired = isVehicleExpired(vehicle, 'insurance')
            const registrationExpired = isVehicleExpired(vehicle, 'registration')
            const insuranceDays = getDaysUntilExpiry(vehicle, 'insurance')
            const registrationDays = getDaysUntilExpiry(vehicle, 'registration')

            return (
              <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span>{getVehicleCategoryIcon(vehicle.category)}</span>
                        {vehicle.name}
                      </CardTitle>
                      <CardDescription>
                        {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(vehicle)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getVehicleStatusColor(vehicle.status)}>
                      <span className="mr-1">{getVehicleStatusIcon(vehicle.status)}</span>
                      {getVehicleStatusLabel(vehicle.status)}
                    </Badge>
                    <Badge variant="outline">
                      {getVehicleCategoryLabel(vehicle.category)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
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
                  </div>

                  {/* Alerts */}
                  {(insuranceExpired || registrationExpired || insuranceDays <= 30 || registrationDays <= 30) && (
                    <div className="border-l-4 border-red-500 pl-3 py-2 bg-red-50">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="font-medium">Alertes:</span>
                      </div>
                      <div className="text-sm text-red-700 mt-1 space-y-1">
                        {insuranceExpired && <div>• Assurance expirée</div>}
                        {registrationExpired && <div>• Immatriculation expirée</div>}
                        {!insuranceExpired && insuranceDays <= 30 && (
                          <div>• Assurance expire dans {insuranceDays} jours</div>
                        )}
                        {!registrationExpired && registrationDays <= 30 && (
                          <div>• Immatriculation expire dans {registrationDays} jours</div>
                        )}
                      </div>
                    </div>
                  )}

                  {vehicle.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <span className="font-medium">Notes:</span> {vehicle.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!loading && filteredVehicles.length === 0 && (
        <div className="text-center py-8">
          <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'Aucun véhicule trouvé pour cette recherche' : 'Aucun véhicule enregistré'}
          </p>
        </div>
      )}

      {/* Dialog */}
      {showDialog && (
        <VehicleDialog
          vehicle={editingVehicle || undefined}
          onClose={closeDialog}
          onSave={editingVehicle ? handleEditVehicle : handleAddVehicle}
        />
      )}
    </div>
  )
} 
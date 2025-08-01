import React, { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddressInput } from '@/components/ui/address-input'
import { geocodeAddress, type GeocodingResult } from '@/lib/geocoding'
import type { Mission, User, MissionType } from '@/types/database'

interface MissionDialogProps {
  mission?: Mission | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MissionDialog({ mission, open, onOpenChange }: MissionDialogProps) {
  const { fetchMissions } = useAdminStore()
  const [loading, setLoading] = useState(false)
  const [technicians, setTechnicians] = useState<User[]>([])
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [geocodingResult, setGeocodingResult] = useState<GeocodingResult | null>(null)
  
  const [formData, setFormData] = useState({
    type: 'Livraison jeux' as MissionType,
    title: '',
    description: '',
    date_start: '',
    date_end: '',
    location: '',
    forfeit: 0,
    required_people: 1,
    coordinates: null as [number, number] | null
  })

  useEffect(() => {
    if (open) {
      loadTechnicians()
      if (mission) {
        setFormData({
          type: mission.type,
          title: mission.title,
          description: mission.description || '',
          date_start: mission.date_start.slice(0, 16),
          date_end: mission.date_end.slice(0, 16),
          location: mission.location,
          forfeit: mission.forfeit,
          required_people: mission.required_people || 1,
          coordinates: mission.coordinates || null
        })
        // Si la mission a des coordonnées, on les utilise pour le géocodage
        if (mission.coordinates) {
          setGeocodingResult({
            coordinates: mission.coordinates,
            placeName: mission.location,
            confidence: 1
          })
        }
      } else {
        setFormData({
          type: 'Livraison jeux',
          title: '',
          description: '',
          date_start: '',
          date_end: '',
          location: '',
          forfeit: 0,
          required_people: 1,
          coordinates: null
        })
        setGeocodingResult(null)
      }
      setSelectedTechnicians([])
      setErrors({})
    }
  }, [open, mission])

  const loadTechnicians = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'technicien')
        .order('name')

      setTechnicians(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens:', error)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis'
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Le lieu est requis'
    }
    
    if (!geocodingResult && !formData.coordinates) {
      newErrors.location = 'Veuillez sélectionner une adresse valide'
    }
    
    if (formData.forfeit <= 0) {
      newErrors.forfeit = 'Le forfait doit être supérieur à 0'
    }
    
    if (formData.required_people <= 0) {
      newErrors.required_people = 'Le nombre de personnes doit être supérieur à 0'
    }
    
    if (!formData.date_start) {
      newErrors.date_start = 'La date de début est requise'
    }
    
    if (!formData.date_end) {
      newErrors.date_end = 'La date de fin est requise'
    }
    
    if (formData.date_start && formData.date_end) {
      const startDate = new Date(formData.date_start)
      const endDate = new Date(formData.date_end)
      
      if (startDate >= endDate) {
        newErrors.date_end = 'La date de fin doit être postérieure à la date de début'
      }
      
      if (startDate < new Date()) {
        newErrors.date_start = 'La date de début ne peut pas être dans le passé'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const assignTechnicians = async (missionId: string, technicianIds: string[]) => {
    try {
      const assignments = technicianIds.map(technicianId => ({
        mission_id: missionId,
        technician_id: technicianId,
        status: 'proposé'
      }))

      const { error } = await supabase
        .from('mission_assignments')
        .insert(assignments)

      if (error) throw error
    } catch (error) {
      console.error('Erreur lors de l\'assignation des techniciens:', error)
      throw error
    }
  }

  const handleGeocode = (result: GeocodingResult) => {
    setGeocodingResult(result)
    setFormData(prev => ({
      ...prev,
      coordinates: result.coordinates
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)

    try {
      let missionId = mission?.id
      
      // Préparer les données de la mission avec les coordonnées
      const missionData = {
        ...formData,
        coordinates: geocodingResult?.coordinates || formData.coordinates
      }
      
      if (mission) {
        // Mettre à jour la mission
        const { error } = await supabase
          .from('missions')
          .update(missionData)
          .eq('id', mission.id)

        if (error) throw error
        missionId = mission.id
      } else {
        // Créer la mission
        const { data: { user } } = await supabase.auth.getUser()
        
        const { data: newMission, error } = await supabase
          .from('missions')
          .insert([{
            ...missionData,
            created_by: user?.id
          }])
          .select()
          .single()

        if (error) throw error
        missionId = newMission.id
      }

      // Assigner les techniciens sélectionnés
      if (selectedTechnicians.length > 0 && missionId) {
        await assignTechnicians(missionId, selectedTechnicians)
      }

      // Rafraîchir les données dans le store admin
      await fetchMissions()

      // Fermer le dialog et réinitialiser le formulaire
      onOpenChange(false)
      setFormData({
        type: 'Livraison jeux' as MissionType,
        title: '',
        description: '',
        date_start: '',
        date_end: '',
        location: '',
        forfeit: 0,
        required_people: 1,
        coordinates: null
      })
      setSelectedTechnicians([])
      setErrors({})
      setGeocodingResult(null)
      
    } catch (error) {
      console.error('Erreur lors de la création/modification de la mission:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>
            {mission ? 'Modifier la Mission' : 'Nouvelle Mission'}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de mission</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as MissionType })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  required
                >
                  <option value="Livraison jeux">Livraison jeux</option>
                  <option value="Presta sono">Presta sono</option>
                  <option value="DJ">DJ</option>
                  <option value="Manutention">Manutention</option>
                  <option value="Déplacement">Déplacement</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="forfeit">Forfait (€)</Label>
                <Input
                  id="forfeit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.forfeit}
                  onChange={(e) => setFormData({ ...formData, forfeit: parseFloat(e.target.value) || 0 })}
                  className={errors.forfeit ? 'border-red-500' : ''}
                  required
                />
                {errors.forfeit && (
                  <p className="text-sm text-red-500">{errors.forfeit}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="required_people">Nombre de personnes</Label>
                <Input
                  id="required_people"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.required_people}
                  onChange={(e) => setFormData({ ...formData, required_people: parseInt(e.target.value) || 1 })}
                  className={errors.required_people ? 'border-red-500' : ''}
                  required
                />
                {errors.required_people && (
                  <p className="text-sm text-red-500">{errors.required_people}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titre de la mission"
                className={errors.title ? 'border-red-500' : ''}
                required
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description détaillée de la mission"
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_start">Date de début</Label>
                <Input
                  id="date_start"
                  type="datetime-local"
                  value={formData.date_start}
                  onChange={(e) => setFormData({ ...formData, date_start: e.target.value })}
                  className={errors.date_start ? 'border-red-500' : ''}
                  required
                />
                {errors.date_start && (
                  <p className="text-sm text-red-500">{errors.date_start}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_end">Date de fin</Label>
                <Input
                  id="date_end"
                  type="datetime-local"
                  value={formData.date_end}
                  onChange={(e) => setFormData({ ...formData, date_end: e.target.value })}
                  className={errors.date_end ? 'border-red-500' : ''}
                  required
                />
                {errors.date_end && (
                  <p className="text-sm text-red-500">{errors.date_end}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <AddressInput
                value={formData.location}
                onChange={(address) => setFormData({ ...formData, location: address })}
                onGeocode={handleGeocode}
                placeholder="Entrez l'adresse de la mission..."
                className={errors.location ? 'border-red-500' : ''}
              />
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location}</p>
              )}
              {geocodingResult && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <span>✓</span>
                  <span>Adresse géocodée avec succès</span>
                  <span className="text-gray-500">
                    ({geocodingResult.coordinates[1].toFixed(4)}, {geocodingResult.coordinates[0].toFixed(4)})
                  </span>
                </div>
              )}
            </div>

            {!mission && technicians.length > 0 && (
              <div className="space-y-2">
                <Label>Assigner des techniciens</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {technicians.map((tech) => (
                    <label key={tech.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTechnicians.includes(tech.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTechnicians([...selectedTechnicians, tech.id])
                          } else {
                            setSelectedTechnicians(selectedTechnicians.filter(id => id !== tech.id))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{tech.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : mission ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
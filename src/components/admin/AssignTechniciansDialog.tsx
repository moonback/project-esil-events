import React, { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserPlus, Users, Check, X, Clock, AlertTriangle, Calendar } from 'lucide-react'
import { formatCurrency, getMissionTypeColor, getStatusColor } from '@/lib/utils'
import type { Mission, User, MissionAssignment, Availability, Unavailability } from '@/types/database'

interface AssignTechniciansDialogProps {
  mission?: Mission | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TechnicianWithAssignment extends User {
  assignment?: MissionAssignment
  conflictingMissions?: Mission[]
  availabilities: Availability[]
  unavailabilities: Unavailability[]
  availabilityStatus: 'available' | 'unavailable' | 'conflict' | 'no_availability'
}

export function AssignTechniciansDialog({ mission, open, onOpenChange }: AssignTechniciansDialogProps) {
  const { fetchMissions } = useAdminStore()
  const [loading, setLoading] = useState(false)
  const [technicians, setTechnicians] = useState<TechnicianWithAssignment[]>([])
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([])

  useEffect(() => {
    if (open && mission) {
      fetchTechniciansWithAssignments()
    }
  }, [open, mission])

  const fetchTechniciansWithAssignments = async () => {
    if (!mission) return

    try {
      // Récupérer tous les techniciens
      const { data: technicianData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'technicien')
        .order('name')

      // Récupérer les assignations existantes pour cette mission
      const { data: assignmentData } = await supabase
        .from('mission_assignments')
        .select('*')
        .eq('mission_id', mission.id)

      // Récupérer toutes les missions acceptées qui se chevauchent avec la mission actuelle
      const { data: conflictingAssignments } = await supabase
        .from('mission_assignments')
        .select(`
          *,
          missions (*)
        `)
        .eq('status', 'accepté')
        .neq('mission_id', mission.id)

      // Récupérer les disponibilités de tous les techniciens
      const { data: availabilitiesData } = await supabase
        .from('availability')
        .select('*')
        .order('start_time', { ascending: true })

      // Récupérer les indisponibilités de tous les techniciens
      const { data: unavailabilitiesData } = await supabase
        .from('unavailability')
        .select('*')
        .order('start_time', { ascending: true })

      // Filtrer les missions qui se chevauchent temporellement
      const conflictingMissionsByTechnician = new Map<string, Mission[]>()
      
      if (conflictingAssignments) {
        conflictingAssignments.forEach(assignment => {
          const assignmentMission = assignment.missions as Mission
          if (assignmentMission && isTimeOverlapping(mission, assignmentMission)) {
            const technicianId = assignment.technician_id
            if (!conflictingMissionsByTechnician.has(technicianId)) {
              conflictingMissionsByTechnician.set(technicianId, [])
            }
            conflictingMissionsByTechnician.get(technicianId)!.push(assignmentMission)
          }
        })
      }

      // Combiner les données
      const techniciansWithAssignments = (technicianData || []).map(tech => {
        const assignment = assignmentData?.find(a => a.technician_id === tech.id)
        const conflictingMissions = conflictingMissionsByTechnician.get(tech.id) || []
        const availabilities = availabilitiesData?.filter(a => a.technician_id === tech.id) || []
        const unavailabilities = unavailabilitiesData?.filter(u => u.technician_id === tech.id) || []
        
        const technicianWithData = {
          ...tech,
          assignment,
          conflictingMissions,
          availabilities,
          unavailabilities
        }

        // Calculer le statut de disponibilité
        const availabilityStatus = getAvailabilityStatus(technicianWithData)
        
        return {
          ...technicianWithData,
          availabilityStatus
        }
      })

      setTechnicians(techniciansWithAssignments)
      
      // Pré-sélectionner les techniciens déjà assignés avec statut "proposé"
      const currentlyProposed = assignmentData
        ?.filter(a => a.status === 'proposé')
        .map(a => a.technician_id) || []
      
      setSelectedTechnicians(currentlyProposed)
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens:', error)
    }
  }

  // Fonction pour vérifier si deux missions se chevauchent temporellement
  const isTimeOverlapping = (mission1: Mission, mission2: Mission) => {
    const start1 = new Date(mission1.date_start)
    const end1 = new Date(mission1.date_end)
    const start2 = new Date(mission2.date_start)
    const end2 = new Date(mission2.date_end)

    return start1 < end2 && start2 < end1
  }

  // Fonction pour vérifier si une période chevauche une disponibilité
  const isOverlappingWithAvailability = (mission: Mission, availability: Availability) => {
    const missionStart = new Date(mission.date_start)
    const missionEnd = new Date(mission.date_end)
    const availabilityStart = new Date(availability.start_time)
    const availabilityEnd = new Date(availability.end_time)

    return missionStart < availabilityEnd && availabilityStart < missionEnd
  }

  // Fonction pour vérifier si une période chevauche une indisponibilité
  const isOverlappingWithUnavailability = (mission: Mission, unavailability: Unavailability) => {
    const missionStart = new Date(mission.date_start)
    const missionEnd = new Date(mission.date_end)
    const unavailabilityStart = new Date(unavailability.start_time)
    const unavailabilityEnd = new Date(unavailability.end_time)

    return missionStart < unavailabilityEnd && unavailabilityStart < missionEnd
  }

  // Fonction pour déterminer le statut de disponibilité d'un technicien
  const getAvailabilityStatus = (tech: TechnicianWithAssignment): 'available' | 'unavailable' | 'conflict' | 'no_availability' => {
    if (!mission) return 'no_availability'

    // Vérifier les indisponibilités (priorité la plus haute)
    const hasUnavailability = tech.unavailabilities.some(unavail => 
      isOverlappingWithUnavailability(mission, unavail)
    )
    if (hasUnavailability) return 'unavailable'

    // Vérifier les conflits de missions
    if (tech.conflictingMissions && tech.conflictingMissions.length > 0) {
      return 'conflict'
    }

    // Vérifier les disponibilités
    const hasAvailability = tech.availabilities.some(avail => 
      isOverlappingWithAvailability(mission, avail)
    )
    
    if (tech.availabilities.length === 0) {
      return 'no_availability' // Pas de disponibilités définies
    }

    return hasAvailability ? 'available' : 'unavailable'
  }

  const handleAssign = async () => {
    if (!mission) return

    setLoading(true)
    try {
      // Supprimer les anciennes assignations avec statut "proposé"
      await supabase
        .from('mission_assignments')
        .delete()
        .eq('mission_id', mission.id)
        .eq('status', 'proposé')

      // Créer les nouvelles assignations
      if (selectedTechnicians.length > 0) {
        const assignments = selectedTechnicians.map(technicianId => ({
          mission_id: mission.id,
          technician_id: technicianId,
          status: 'proposé' as const
        }))

        const { error } = await supabase
          .from('mission_assignments')
          .insert(assignments)

        if (error) throw error
      }

      // Rafraîchir les données dans le store admin
      await fetchMissions()
      onOpenChange(false)
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAssignmentStatusBadge = (assignment?: MissionAssignment) => {
    if (!assignment) return null
    
    return (
      <Badge className={getStatusColor(assignment.status)}>
        {assignment.status}
      </Badge>
    )
  }

  const getAvailabilityStatusBadge = (tech: TechnicianWithAssignment) => {
    const status = tech.availabilityStatus
    
    switch (status) {
      case 'available':
        return (
          <Badge className="bg-green-100 text-green-800 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Disponible
          </Badge>
        )
      case 'unavailable':
        return (
          <Badge className="bg-red-100 text-red-800 text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Indisponible
          </Badge>
        )
      case 'conflict':
        return (
          <Badge className="bg-orange-100 text-orange-800 text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Conflit
          </Badge>
        )
      case 'no_availability':
        return (
          <Badge className="bg-gray-100 text-gray-800 text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            Pas de disponibilités
          </Badge>
        )
      default:
        return null
    }
  }

  const handleTechnicianToggle = (technicianId: string) => {
    const technician = technicians.find(t => t.id === technicianId)
    if (!technician) return

    // Vérifier si le technicien peut être sélectionné
    if (!canSelectTechnician(technician)) return

    // Vérifier les conflits de planning (sauf si déjà sélectionné)
    const hasConflict = technician.conflictingMissions && technician.conflictingMissions.length > 0
    const isCurrentlySelected = selectedTechnicians.includes(technicianId)
    
    if (hasConflict && !isCurrentlySelected) {
      // Empêcher la sélection si conflit et pas déjà sélectionné
      return
    }

    if (isCurrentlySelected) {
      setSelectedTechnicians(selectedTechnicians.filter(id => id !== technicianId))
    } else {
      setSelectedTechnicians([...selectedTechnicians, technicianId])
    }
  }

  const canSelectTechnician = (tech: TechnicianWithAssignment) => {
    // Ne peut pas sélectionner si déjà accepté
    if (tech.assignment?.status === 'accepté') return false
    
    // Ne peut pas sélectionner si indisponible ou en conflit
    if (tech.availabilityStatus === 'unavailable' || tech.availabilityStatus === 'conflict') return false
    
    return true
  }

  if (!mission) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">Assigner des Techniciens</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">Sélectionnez les techniciens pour cette mission</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={`${getMissionTypeColor(mission.type)} text-xs font-medium px-3 py-1.5`}>
                {mission.type}
              </Badge>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{mission.title}</p>
                <p className="text-xs text-gray-600">
                  Rémunération: <span className="font-semibold text-emerald-600">{formatCurrency(mission.forfeit)}</span>
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            

            <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gray-50/30">
              {technicians.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Aucun technicien disponible</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {technicians.map((tech) => {
                    const isSelected = selectedTechnicians.includes(tech.id)
                    const isAssigned = tech.assignment?.status === 'accepté'
                    const isDisabled = !canSelectTechnician(tech)
                    
                    // Déterminer la couleur de fond selon le statut
                    const getBackgroundColor = () => {
                      switch (tech.availabilityStatus) {
                        case 'available':
                          return 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100'
                        case 'unavailable':
                          return 'border-red-300 bg-gradient-to-br from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100'
                        case 'conflict':
                          return 'border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100'
                        case 'no_availability':
                          return 'border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100'
                        default:
                          return 'border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-gray-100'
                      }
                    }
                    
                    return (
                      <Card key={tech.id} className={`border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                        getBackgroundColor()
                      } ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleTechnicianToggle(tech.id)}
                                  disabled={isDisabled}
                                  className="rounded border-2 border-gray-300 checked:bg-indigo-600 checked:border-indigo-600 focus:ring-indigo-500"
                                />
                                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                                  {tech.name.charAt(0)}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="font-semibold text-gray-900 truncate">{tech.name}</span>
                                  {getAvailabilityStatusBadge(tech)}
                                </div>
                                
                                {tech.phone && (
                                  <p className="text-xs text-gray-600 mb-2">{tech.phone}</p>
                                )}
                                
                                {/* Informations de disponibilité compactes */}
                                <div className="space-y-1">
                                  {tech.availabilities.length > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-xs font-medium text-green-700">Disponibilités:</span>
                                      <span className="text-xs text-gray-600">
                                        {tech.availabilities.length} période{tech.availabilities.length > 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {tech.unavailabilities.length > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      <span className="text-xs font-medium text-red-700">Indisponibilités:</span>
                                      <span className="text-xs text-gray-600">
                                        {tech.unavailabilities.length} période{tech.unavailabilities.length > 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Conflits de missions */}
                                  {tech.conflictingMissions && tech.conflictingMissions.length > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                      <span className="text-xs font-medium text-orange-700">Conflit:</span>
                                      <span className="text-xs text-gray-600">
                                        {tech.conflictingMissions.length} mission{tech.conflictingMissions.length > 1 ? 's' : ''}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end space-y-2">
                              {getAssignmentStatusBadge(tech.assignment)}
                              {tech.assignment?.status === 'accepté' && (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                              {tech.assignment?.status === 'refusé' && (
                                <X className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {selectedTechnicians.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">
                        {selectedTechnicians.length} technicien{selectedTechnicians.length > 1 ? 's' : ''} sélectionné{selectedTechnicians.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-blue-700">
                        Prêt à envoyer les propositions de mission
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 text-xs font-medium">
                    {selectedTechnicians.length} sélectionné{selectedTechnicians.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="px-6 py-2"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleAssign} 
                disabled={loading || selectedTechnicians.length === 0}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl px-6 py-2"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Assignation...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Assigner {selectedTechnicians.length} technicien{selectedTechnicians.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
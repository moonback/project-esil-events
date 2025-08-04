import React, { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Users, Check, X, Clock, AlertTriangle, Calendar, Mail } from 'lucide-react'
import { formatCurrency, getMissionTypeColor, getStatusColor } from '@/lib/utils'
import type { Mission, User, MissionAssignment, Availability, Unavailability } from '@/types/database'
import { emailClient } from '@/lib/emailClient'
import { useToast } from '@/lib/useToast'

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
  const [sendingEmails, setSendingEmails] = useState(false)
  const [technicians, setTechnicians] = useState<TechnicianWithAssignment[]>([])
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([])
  const { addNotification } = useToast()

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

        // Envoyer les emails de notification
        setSendingEmails(true)
        try {
          const selectedTechnicianData = technicians.filter(t => selectedTechnicians.includes(t.id))
          
          const emailResults = await emailClient.sendBulkAssignmentNotifications(
            selectedTechnicianData,
            mission,
            'L\'équipe Esil-events'
          )

          // Afficher les résultats des emails
          if (emailResults.success.length > 0) {
            addNotification({
              type: 'success',
              title: 'Emails envoyés',
              message: `${emailResults.success.length} email(s) envoyé(s) avec succès`
            })
          }

          if (emailResults.failed.length > 0) {
            addNotification({
              type: 'warning',
              title: 'Erreurs d\'envoi',
              message: `${emailResults.failed.length} email(s) n\'ont pas pu être envoyé(s)`
            })
          }
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi des emails:', emailError)
          addNotification({
            type: 'error',
            title: 'Erreur emails',
            message: 'Erreur lors de l\'envoi des notifications par email'
          })
        } finally {
          setSendingEmails(false)
        }
      }

      // Rafraîchir les données dans le store admin
      await fetchMissions()
      onOpenChange(false)
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error)
      addNotification({
        type: 'error',
        title: 'Erreur assignation',
        message: 'Erreur lors de l\'assignation des techniciens'
      })
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

  if (!open || !mission) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <CardTitle>Assigner des Techniciens</CardTitle>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">{mission.title}</h3>
            <div className="flex items-center space-x-2">
              <Badge className={getMissionTypeColor(mission.type)}>
                {mission.type}
              </Badge>
              <span className="text-sm text-gray-600">
                Rémunération: {formatCurrency(mission.forfeit)}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">
                Sélectionner les techniciens à assigner
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Les techniciens sélectionnés recevront une proposition de mission
              </p>
            </div>

            {/* Légende des statuts */}
            <div className="bg-gray-50 p-3 rounded-md mb-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Légende des statuts :</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Disponible</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Indisponible</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>Conflit de planning</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span>Pas de disponibilités définies</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
              {technicians.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Aucun technicien disponible
                </p>
              ) : (
                technicians.map((tech) => {
                  const isSelected = selectedTechnicians.includes(tech.id)
                  const isAssigned = tech.assignment?.status === 'accepté'
                  const isDisabled = !canSelectTechnician(tech)
                  
                  // Déterminer la couleur de fond selon le statut
                  const getBackgroundColor = () => {
                    switch (tech.availabilityStatus) {
                      case 'available':
                        return 'border-green-300 bg-green-50'
                      case 'unavailable':
                        return 'border-red-300 bg-red-50'
                      case 'conflict':
                        return 'border-orange-300 bg-orange-50'
                      case 'no_availability':
                        return 'border-gray-300 bg-gray-50'
                      default:
                        return 'border-gray-200 bg-white'
                    }
                  }
                  
                  return (
                    <div key={tech.id} className={`flex items-center justify-between p-3 border rounded hover:bg-gray-50 ${
                      getBackgroundColor()
                    } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTechnicianToggle(tech.id)}
                          disabled={isDisabled}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">{tech.name}</span>
                            {getAvailabilityStatusBadge(tech)}
                          </div>
                          
                          {tech.phone && (
                            <p className="text-xs text-gray-500 mb-1">{tech.phone}</p>
                          )}
                          
                          {/* Informations de disponibilité */}
                          <div className="text-xs text-gray-600 space-y-1">
                            {tech.availabilities.length > 0 && (
                              <div>
                                <span className="font-medium text-green-600">Disponibilités:</span>
                                {tech.availabilities.slice(0, 2).map((avail, index) => (
                                  <div key={avail.id} className="ml-2">
                                    {new Date(avail.start_time).toLocaleDateString()} - {new Date(avail.end_time).toLocaleDateString()}
                                  </div>
                                ))}
                                {tech.availabilities.length > 2 && (
                                  <div className="ml-2 text-gray-500">+{tech.availabilities.length - 2} autres</div>
                                )}
                              </div>
                            )}
                            
                            {tech.unavailabilities.length > 0 && (
                              <div>
                                <span className="font-medium text-red-600">Indisponibilités:</span>
                                {tech.unavailabilities.slice(0, 2).map((unavail, index) => (
                                  <div key={unavail.id} className="ml-2">
                                    {new Date(unavail.start_time).toLocaleDateString()} - {new Date(unavail.end_time).toLocaleDateString()}
                                    {unavail.reason && ` (${unavail.reason})`}
                                  </div>
                                ))}
                                {tech.unavailabilities.length > 2 && (
                                  <div className="ml-2 text-gray-500">+{tech.unavailabilities.length - 2} autres</div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Conflits de missions */}
                          {tech.conflictingMissions && tech.conflictingMissions.length > 0 && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Conflit de planning
                              </span>
                              <div className="text-xs text-orange-600 mt-1">
                                {tech.conflictingMissions.map((conflictMission) => (
                                  <div key={conflictMission.id}>
                                    Mission "{conflictMission.title}" du {new Date(conflictMission.date_start).toLocaleDateString()} au {new Date(conflictMission.date_end).toLocaleDateString()}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getAssignmentStatusBadge(tech.assignment)}
                        {tech.assignment?.status === 'accepté' && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                        {tech.assignment?.status === 'refusé' && (
                          <X className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {selectedTechnicians.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <Users className="h-4 w-4 inline mr-1" />
                  {selectedTechnicians.length} technicien(s) sélectionné(s)
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading || sendingEmails}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleAssign} 
                disabled={loading || sendingEmails || selectedTechnicians.length === 0}
              >
                {loading ? 'Assignation...' : 
                 sendingEmails ? 'Envoi des emails...' : 
                 `Assigner ${selectedTechnicians.length} technicien(s)`}
                {sendingEmails && <Mail className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
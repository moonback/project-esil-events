import React, { useState, useEffect } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Users, Check, X } from 'lucide-react'
import { formatCurrency, getMissionTypeColor, getStatusColor } from '@/lib/utils'
import type { Mission, User, MissionAssignment } from '@/types/database'

interface AssignTechniciansDialogProps {
  mission?: Mission | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TechnicianWithAssignment extends User {
  assignment?: MissionAssignment
  conflictingMissions?: Mission[]
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
        return {
          ...tech,
          assignment,
          conflictingMissions
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
    // Peut sélectionner si pas d'assignation ou si statut "proposé" ou "refusé"
    return !tech.assignment || tech.assignment.status === 'proposé' || tech.assignment.status === 'refusé'
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

            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
              {technicians.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Aucun technicien disponible
                </p>
              ) : (
                technicians.map((tech) => {
                  const isSelected = selectedTechnicians.includes(tech.id)
                  const isAssigned = tech.assignment?.status === 'accepté'
                  const hasConflict = tech.conflictingMissions && tech.conflictingMissions.length > 0
                  const isDisabled = hasConflict && !isSelected
                  
                  return (
                    <div key={tech.id} className={`flex items-center justify-between p-2 border rounded hover:bg-gray-50 ${
                      hasConflict ? 'border-red-300 bg-red-50 opacity-60' : ''
                    } ${isDisabled ? 'cursor-not-allowed' : ''}`}>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTechnicianToggle(tech.id)}
                          disabled={!canSelectTechnician(tech) || isDisabled}
                          className="rounded"
                        />
                        <div>
                          <span className="font-medium">{tech.name}</span>
                          {tech.phone && (
                            <p className="text-xs text-gray-500">{tech.phone}</p>
                          )}
                          {hasConflict && (
                            <div className="mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Conflit de planning
                              </span>
                              <div className="text-xs text-red-600 mt-1">
                                {tech.conflictingMissions!.map((conflictMission) => (
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
                disabled={loading}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleAssign} 
                disabled={loading || selectedTechnicians.length === 0}
              >
                {loading ? 'Assignation...' : `Assigner ${selectedTechnicians.length} technicien(s)`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
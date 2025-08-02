import React, { useState, useEffect } from 'react'
import { useMissionsStore } from '@/store/missionsStore'
import { useToast } from '@/lib/useToast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  MapPin, 
  Euro, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Ban,
  UserCheck,
  UserX
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { MissionWithAssignments, User } from '@/types/database'

export function MissionsWithAssignmentsTab() {
  const { missions, loading, cancelPendingAssignmentsForMission, fetchMissions } = useMissionsStore()
  const [cancellingMissions, setCancellingMissions] = useState<Set<string>>(new Set())
  const { showSuccess, showError } = useToast()

  // Charger les missions au montage du composant
  useEffect(() => {
    console.log('🚀 MissionsWithAssignmentsTab: fetchMissions appelé')
    fetchMissions()
  }, [fetchMissions])

  // Log des données reçues
  useEffect(() => {
    console.log('📊 MissionsWithAssignmentsTab: missions reçues:', missions)
    console.log('📊 MissionsWithAssignmentsTab: loading:', loading)
  }, [missions, loading])

  const handleCancelPendingAssignments = async (missionId: string) => {
    try {
      setCancellingMissions(prev => new Set(prev).add(missionId))
      await cancelPendingAssignmentsForMission(missionId)
      
      showSuccess(
        'Demandes annulées',
        'Les demandes en attente pour cette mission ont été annulées avec succès.'
      )
    } catch (error) {
      console.error('Erreur lors de l\'annulation des demandes:', error)
      showError(
        'Erreur',
        'Une erreur est survenue lors de l\'annulation des demandes.'
      )
    } finally {
      setCancellingMissions(prev => {
        const newSet = new Set(prev)
        newSet.delete(missionId)
        return newSet
      })
    }
  }

  const getAssignmentStatusBadge = (status: string) => {
    switch (status) {
      case 'accepté':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Accepté</Badge>
      case 'refusé':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Refusé</Badge>
      case 'proposé':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getValidationBadge = (technician: User) => {
    if (technician.is_validated) {
      return <Badge className="bg-blue-100 text-blue-800 text-xs"><UserCheck className="h-3 w-3 mr-1" />Validé</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800 text-xs"><UserX className="h-3 w-3 mr-1" />Non validé</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Chargement des missions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      

      {/* En-tête */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Missions et Assignations</h2>
          <p className="text-sm text-gray-500">{missions.length} mission{missions.length > 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Informations sur l'annulation automatique */}
      <div className="px-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Gestion des assignations
                </h3>
                <p className="text-xs text-blue-700">
                  Les demandes en attente sont automatiquement annulées quand le nombre de techniciens validés requis est atteint. 
                  Vous pouvez également annuler manuellement les demandes en attente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des missions */}
      <div className="px-6">
        {missions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Aucune mission trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {missions.map((mission) => {
              const pendingAssignments = mission.mission_assignments?.filter((a: any) => a.status === 'proposé') || []
              const acceptedAssignments = mission.mission_assignments?.filter((a: any) => a.status === 'accepté') || []
              const validatedAcceptedAssignments = acceptedAssignments.filter((a: any) => a.users.is_validated)
              const hasEnoughValidatedTechnicians = validatedAcceptedAssignments.length >= mission.required_people

              return (
                <Card key={mission.id} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{mission.title}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{mission.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(parseISO(mission.date_start), 'dd/MM/yyyy HH:mm', { locale: fr })} - 
                              {format(parseISO(mission.date_end), 'HH:mm', { locale: fr })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Euro className="h-4 w-4" />
                            <span>{mission.forfeit}€</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{mission.required_people} personne{mission.required_people > 1 ? 's' : ''} requise{mission.required_people > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{mission.type}</Badge>
                        {pendingAssignments.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelPendingAssignments(mission.id)}
                            disabled={cancellingMissions.has(mission.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            {cancellingMissions.has(mission.id) ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
                            Annuler les demandes ({pendingAssignments.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Statut des techniciens validés */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Techniciens validés acceptés :</span>
                        <span className={`font-bold ${hasEnoughValidatedTechnicians ? 'text-green-600' : 'text-orange-600'}`}>
                          {validatedAcceptedAssignments.length} / {mission.required_people}
                        </span>
                      </div>
                      {hasEnoughValidatedTechnicians && (
                        <div className="mt-2 text-xs text-green-600 flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Nombre de techniciens validés requis atteint</span>
                        </div>
                      )}
                    </div>

                    {/* Liste des assignations */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Assignations :</h4>
                      {mission.mission_assignments?.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Aucune assignation</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {mission.mission_assignments?.map((assignment: any) => (
                            <div key={assignment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                  {assignment.users.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium">{assignment.users.name}</div>
                                  <div className="flex items-center space-x-2 text-xs">
                                    {getAssignmentStatusBadge(assignment.status)}
                                    {getValidationBadge(assignment.users)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500">
                                {assignment.responded_at ? (
                                  <span>
                                    {assignment.cancelled_by_admin ? (
                                      <span className="text-orange-600">
                                        Annulé manuellement le {format(parseISO(assignment.responded_at), 'dd/MM/yyyy', { locale: fr })}
                                      </span>
                                    ) : (
                                      <span>
                                        Répondu le {format(parseISO(assignment.responded_at), 'dd/MM/yyyy', { locale: fr })}
                                      </span>
                                    )}
                                  </span>
                                ) : assignment.status === 'refusé' ? (
                                  <span className="text-orange-600">
                                    Annulé manuellement
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 
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
  UserX,
  AlertCircle,
  CheckCircle2,
  Target
} from 'lucide-react'
import { format, parseISO, addHours, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { MissionWithAssignments, User } from '@/types/database'
import { AssignTechniciansDialog } from './AssignTechniciansDialog'

export function MissionsWithAssignmentsTab() {
  const { missions, loading, cancelPendingAssignmentsForMission, fetchMissions } = useMissionsStore()
  const [cancellingMissions, setCancellingMissions] = useState<Set<string>>(new Set())
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedMission, setSelectedMission] = useState<MissionWithAssignments | null>(null)
  const { showSuccess, showError } = useToast()

  // Charger les missions au montage du composant
  useEffect(() => {
    fetchMissions()
  }, [fetchMissions])

  const convertUTCToLocal = (dateString: string): string => {
    try {
      const utcDate = parseISO(dateString)
      if (!isValid(utcDate)) {
        return dateString
      }
      const localDate = new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000))
      return localDate.toISOString()
    } catch {
      return dateString
    }
  }

  const formatDateTimeUTC = (dateString: string): string => {
    try {
      const localDate = convertUTCToLocal(dateString)
      return format(parseISO(localDate), 'dd/MM/yyyy', { locale: fr })
    } catch {
      return 'Date invalide'
    }
  }

  const formatTimeUTC = (dateString: string): string => {
    try {
      const localDate = convertUTCToLocal(dateString)
      return format(parseISO(localDate), 'HH:mm', { locale: fr })
    } catch {
      return 'Heure invalide'
    }
  }

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

  const handleAssignTechnicians = (mission: MissionWithAssignments) => {
    setSelectedMission(mission)
    setAssignDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Chargement des missions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Missions et Assignations</h2>
          <p className="text-sm text-gray-500 mt-1">
            {missions.length} mission{missions.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Target className="h-3 w-3 mr-1" />
            Gestion des assignations
          </Badge>
        </div>
      </div>

      {/* Liste des missions */}
      <div className="px-6">
        {missions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune mission trouvée</h3>
            <p className="text-gray-500 text-sm">Les missions apparaîtront ici une fois créées</p>
          </div>
        ) : (
          <div className="space-y-6">
            {missions.map((mission) => {
              const pendingAssignments = mission.mission_assignments?.filter((a: any) => a.status === 'proposé') || []
              const acceptedAssignments = mission.mission_assignments?.filter((a: any) => a.status === 'accepté') || []
              const validatedAcceptedAssignments = acceptedAssignments.filter((a: any) => a.users.is_validated)
              const hasEnoughValidatedTechnicians = validatedAcceptedAssignments.length >= mission.required_people

              return (
                <Card key={mission.id} className="border border-gray-200 hover:border-indigo-200 transition-all duration-200 shadow-sm hover:shadow-md">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <CardTitle className="text-lg text-gray-900">{mission.title}</CardTitle>
                          <Badge variant="outline" className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200">
                            {mission.type}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{mission.location}</p>
                              <p className="text-xs text-gray-500">Localisation</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Calendar className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {formatDateTimeUTC(mission.date_start)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatTimeUTC(mission.date_start)} - {formatTimeUTC(mission.date_end)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                              <Euro className="h-4 w-4 text-yellow-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{mission.forfeit}€</p>
                              <p className="text-xs text-gray-500">Forfait</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{mission.required_people}</p>
                              <p className="text-xs text-gray-500">Personne{mission.required_people > 1 ? 's' : ''} requise{mission.required_people > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                                             <div className="flex items-center space-x-2 ml-4">
                         <Button
                           variant="default"
                           size="sm"
                           onClick={() => handleAssignTechnicians(mission)}
                           className="bg-indigo-600 hover:bg-indigo-700 text-white"
                         >
                           <Users className="h-4 w-4 mr-1" />
                           Assigner des techniciens
                         </Button>
                        {pendingAssignments.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelPendingAssignments(mission.id)}
                            disabled={cancellingMissions.has(mission.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          >
                            {cancellingMissions.has(mission.id) ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
                            <span className="ml-1">Annuler ({pendingAssignments.length})</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Statut des techniciens validés */}
                    <div className={`mb-6 p-4 rounded-lg border ${
                      hasEnoughValidatedTechnicians 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-orange-50 border-orange-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {hasEnoughValidatedTechnicians ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                          )}
                          <span className="font-medium text-gray-900">Techniciens validés acceptés</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg font-bold ${
                            hasEnoughValidatedTechnicians ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {validatedAcceptedAssignments.length} / {mission.required_people}
                          </span>
                          {hasEnoughValidatedTechnicians && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complet
                            </Badge>
                          )}
                        </div>
                      </div>
                      {!hasEnoughValidatedTechnicians && (
                        <p className="text-sm text-orange-600 mt-2">
                          Il manque {mission.required_people - validatedAcceptedAssignments.length} technicien(s) validé(s)
                        </p>
                      )}
                    </div>

                    {/* Liste des assignations */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700">Assignations</h4>
                        <Badge variant="secondary" className="text-xs">
                          {mission.mission_assignments?.length || 0} assignation{(mission.mission_assignments?.length || 0) > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      {mission.mission_assignments?.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                          <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Aucune assignation</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {mission.mission_assignments?.map((assignment: any) => (
                            <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                                  {assignment.users.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{assignment.users.name}</div>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {getAssignmentStatusBadge(assignment.status)}
                                    {getValidationBadge(assignment.users)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                {assignment.responded_at ? (
                                  <div className="text-xs text-gray-500">
                                    {assignment.cancelled_by_admin ? (
                                      <span className="text-orange-600 font-medium">
                                        Annulé le {formatDateTimeUTC(assignment.responded_at)}
                                      </span>
                                    ) : (
                                      <span>
                                        Répondu le {formatDateTimeUTC(assignment.responded_at)}
                                      </span>
                                    )}
                                  </div>
                                ) : assignment.status === 'refusé' ? (
                                  <span className="text-xs text-orange-600 font-medium">
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
       
       {/* Dialogue d'assignation de techniciens */}
       <AssignTechniciansDialog
         mission={selectedMission}
         open={assignDialogOpen}
         onOpenChange={setAssignDialogOpen}
       />
     </div>
   )
 }  
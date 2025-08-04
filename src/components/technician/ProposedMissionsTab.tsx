import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useMissionsStore } from '@/store/missionsStore'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Clock, MapPin, Calendar, DollarSign, AlertTriangle } from 'lucide-react'
import { formatDateTime, formatCurrency, getMissionTypeColor } from '@/lib/utils'
import { parseISO, isValid } from 'date-fns'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { MissionAssignment, Mission } from '@/types/database'

// Fonction utilitaire pour convertir les dates UTC en heure locale
const convertUTCToLocal = (dateString: string): Date => {
  const utcDate = parseISO(dateString)
  if (!isValid(utcDate)) {
    throw new Error('Date invalide')
  }
  return new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000))
}

// Fonction pour formater les dates avec conversion UTC
const formatDateTimeUTC = (dateString: string): string => {
  try {
    const localDate = convertUTCToLocal(dateString)
    return format(localDate, 'dd/MM/yyyy HH:mm', { locale: fr })
  } catch (error) {
    console.error('Erreur lors de la conversion de la date:', error)
    return 'Date invalide'
  }
}

interface ProposedMission extends MissionAssignment {
  missions: Mission
}

export function ProposedMissionsTab() {
  const profile = useAuthStore(state => state.profile)
  const { updateAssignmentStatus } = useMissionsStore()
  const [proposedMissions, setProposedMissions] = useState<ProposedMission[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      fetchProposedMissions()
    }
  }, [profile])

  const fetchProposedMissions = async () => {
    if (!profile) return

    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching proposed missions for technician:', profile.id)
      
      const { data, error } = await supabase
        .from('mission_assignments')
        .select(`
          *,
          missions (*)
        `)
        .eq('technician_id', profile.id)
        .order('assigned_at', { ascending: false })

      if (error) throw error

      console.log('All assignments for technician:', data)
      
      // Filtrer uniquement les missions avec le statut 'proposé'
      const proposedOnly = (data as ProposedMission[] || []).filter(
        assignment => assignment.status === 'proposé'
      )
      
      console.log('Proposed missions:', proposedOnly)
      setProposedMissions(proposedOnly)
    } catch (error) {
      console.error('Erreur lors du chargement des missions proposées:', error)
      setError('Erreur lors du chargement des missions. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  // Vérifier les conflits de planning
  const checkPlanningConflict = async (missionToAccept: ProposedMission): Promise<boolean> => {
    try {
      // Récupérer toutes les missions acceptées du technicien
      const { data: acceptedMissions } = await supabase
        .from('mission_assignments')
        .select(`
          *,
          missions (*)
        `)
        .eq('technician_id', profile!.id)
        .eq('status', 'accepté')

      if (!acceptedMissions) return false

      const missionStart = convertUTCToLocal(missionToAccept.missions.date_start)
      const missionEnd = convertUTCToLocal(missionToAccept.missions.date_end)

      // Vérifier les conflits avec les missions acceptées
      for (const assignment of acceptedMissions) {
        const assignmentMission = assignment.missions as Mission
        const assignmentStart = convertUTCToLocal(assignmentMission.date_start)
        const assignmentEnd = convertUTCToLocal(assignmentMission.date_end)

        // Vérifier si les périodes se chevauchent
        if (missionStart < assignmentEnd && missionEnd > assignmentStart) {
          return true // Conflit détecté
        }
      }

      return false // Pas de conflit
    } catch (error) {
      console.error('Erreur lors de la vérification des conflits:', error)
      return false
    }
  }

  const handleResponse = async (assignmentId: string, status: 'accepté' | 'refusé') => {
    setActionLoading(assignmentId)
    setError(null)
    
    try {
      if (status === 'accepté') {
        // Vérifier les conflits de planning avant d'accepter
        const assignment = proposedMissions.find(m => m.id === assignmentId)
        if (assignment) {
          const hasConflict = await checkPlanningConflict(assignment)
          if (hasConflict) {
            setError('Cette mission entre en conflit avec votre planning existant. Impossible de l\'accepter.')
            return
          }
        }
      }

      await updateAssignmentStatus(assignmentId, status)
      
      // Créer une entrée de facturation si accepté
      if (status === 'accepté') {
        const assignment = proposedMissions.find(m => m.id === assignmentId)
        if (assignment && profile) {
          await supabase
            .from('billing')
            .insert([{
              mission_id: assignment.mission_id,
              technician_id: profile.id,
              amount: assignment.missions.forfeit,
              status: 'en_attente'
            }])
        }
      }

      fetchProposedMissions()
    } catch (error) {
      console.error('Erreur lors de la réponse:', error)
      setError('Erreur lors de la réponse. Veuillez réessayer.')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Chargement des missions proposées...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-6">
      <div className="px-1">
        <h3 className="text-lg md:text-xl font-semibold">Missions Proposées</h3>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Acceptez ou refusez les missions qui vous sont proposées
        </p>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm md:text-base">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 h-6 w-6 md:h-8 md:w-8 p-0 flex-shrink-0"
          >
            <X className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      )}

      <div className="grid gap-3 md:gap-4">
        {proposedMissions.length === 0 ? (
          <Card>
            <CardContent className="py-8 md:py-12 text-center">
              <Clock className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-3 md:mb-4" />
              <p className="text-gray-500 text-sm md:text-base">Aucune mission proposée pour le moment</p>
              <p className="text-xs md:text-sm text-gray-400 mt-2">
                Les nouvelles missions apparaîtront ici
              </p>
            </CardContent>
          </Card>
        ) : (
          proposedMissions.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 md:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <CardTitle className="text-base md:text-lg truncate">{assignment.missions.title}</CardTitle>
                      <Badge className={`${getMissionTypeColor(assignment.missions.type)} flex-shrink-0`}>
                        {assignment.missions.type}
                      </Badge>
                    </div>
                    {assignment.missions.description && (
                      <p className="text-gray-600 text-sm md:text-base line-clamp-2">{assignment.missions.description}</p>
                    )}
                  </div>
                  
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex-shrink-0 text-xs">
                    Proposé
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium">Période</p>
                      <p className="text-xs md:text-sm text-gray-600 truncate">
                        {formatDateTimeUTC(assignment.missions.date_start)}
                      </p>
                      <p className="text-xs md:text-sm text-gray-600 truncate">
                        → {formatDateTimeUTC(assignment.missions.date_end)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium">Lieu</p>
                      <p className="text-xs md:text-sm text-gray-600 truncate">{assignment.missions.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 sm:col-span-2 lg:col-span-1">
                    <DollarSign className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium">Rémunération</p>
                      <p className="text-sm md:text-lg font-bold text-green-600">
                        {formatCurrency(assignment.missions.forfeit)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 md:pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleResponse(assignment.id, 'refusé')}
                    disabled={actionLoading === assignment.id}
                    className="flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 text-sm md:text-base"
                  >
                    <X className="h-3 w-3 md:h-4 md:w-4" />
                    <span>Refuser</span>
                  </Button>
                  
                  <Button
                    onClick={() => handleResponse(assignment.id, 'accepté')}
                    disabled={actionLoading === assignment.id}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-sm md:text-base"
                  >
                    <Check className="h-3 w-3 md:h-4 md:w-4" />
                    <span>
                      {actionLoading === assignment.id ? 'Acceptation...' : 'Accepter'}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
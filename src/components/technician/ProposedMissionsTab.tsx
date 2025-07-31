import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useMissionsStore } from '@/store/missionsStore'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Clock, MapPin, Calendar, DollarSign } from 'lucide-react'
import { formatDateTime, formatCurrency, getMissionTypeColor } from '@/lib/utils'
import type { MissionAssignment, Mission } from '@/types/database'

interface ProposedMission extends MissionAssignment {
  missions: Mission
}

export function ProposedMissionsTab() {
  const profile = useAuthStore(state => state.profile)
  const { updateAssignmentStatus } = useMissionsStore()
  const [proposedMissions, setProposedMissions] = useState<ProposedMission[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      fetchProposedMissions()
    }
  }, [profile])

  const fetchProposedMissions = async () => {
    if (!profile) return

    try {
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
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = async (assignmentId: string, status: 'accepté' | 'refusé') => {
    setActionLoading(assignmentId)
    try {
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
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Chargement des missions proposées...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Missions Proposées</h3>
        <p className="text-gray-600">
          Acceptez ou refusez les missions qui vous sont proposées
        </p>
      </div>

      <div className="grid gap-4">
        {proposedMissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune mission proposée pour le moment</p>
              <p className="text-sm text-gray-400 mt-2">
                Les nouvelles missions apparaîtront ici
              </p>
            </CardContent>
          </Card>
        ) : (
          proposedMissions.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{assignment.missions.title}</CardTitle>
                      <Badge className={getMissionTypeColor(assignment.missions.type)}>
                        {assignment.missions.type}
                      </Badge>
                    </div>
                    {assignment.missions.description && (
                      <p className="text-gray-600">{assignment.missions.description}</p>
                    )}
                  </div>
                  
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Proposé
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Période</p>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(assignment.missions.date_start)}
                      </p>
                      <p className="text-sm text-gray-600">
                        → {formatDateTime(assignment.missions.date_end)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Lieu</p>
                      <p className="text-sm text-gray-600">{assignment.missions.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Rémunération</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(assignment.missions.forfeit)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleResponse(assignment.id, 'refusé')}
                    disabled={actionLoading === assignment.id}
                    className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                    <span>Refuser</span>
                  </Button>
                  
                  <Button
                    onClick={() => handleResponse(assignment.id, 'accepté')}
                    disabled={actionLoading === assignment.id}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
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
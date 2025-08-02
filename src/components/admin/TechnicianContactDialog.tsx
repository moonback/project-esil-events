import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, Check, X, Clock, AlertTriangle, Calendar, 
  Phone, Mail, MapPin, User as UserIcon, ArrowRight, MessageSquare,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react'
import { formatDateTime, formatCurrency, getMissionTypeColor } from '@/lib/utils'
import type { Mission, User, MissionAssignment } from '@/types/database'

interface TechnicianContactDialogProps {
  mission?: Mission | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TechnicianWithAssignment extends User {
  assignment?: MissionAssignment
  status: 'accepté' | 'proposé' | 'refusé' | 'non_assigné'
}

export function TechnicianContactDialog({ mission, open, onOpenChange }: TechnicianContactDialogProps) {
  const [loading, setLoading] = useState(false)
  const [technicians, setTechnicians] = useState<TechnicianWithAssignment[]>([])

  useEffect(() => {
    if (open && mission) {
      fetchTechniciansWithAssignments()
    }
  }, [open, mission])

  const fetchTechniciansWithAssignments = async () => {
    if (!mission) return

    try {
      setLoading(true)
      
      // Récupérer les assignations pour cette mission avec les détails des techniciens
      const { data: assignmentData, error } = await supabase
        .from('mission_assignments')
        .select(`
          *,
          users (*)
        `)
        .eq('mission_id', mission.id)

      if (error) throw error

      // Formater les données
      const techniciansWithAssignments = (assignmentData || []).map(assignment => ({
        ...assignment.users,
        assignment: assignment,
        status: assignment.status
      })) as TechnicianWithAssignment[]

      setTechnicians(techniciansWithAssignments)
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepté':
        return (
          <Badge className="bg-green-100 text-green-800 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Validé
          </Badge>
        )
      case 'proposé':
        return (
          <Badge className="bg-amber-100 text-amber-800 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        )
      case 'refusé':
        return (
          <Badge className="bg-red-100 text-red-800 text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Refusé
          </Badge>
        )
      default:
        return null
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepté':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'proposé':
        return <Clock className="h-4 w-4 text-amber-600" />
      case 'refusé':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepté':
        return 'border-green-200 bg-green-50'
      case 'proposé':
        return 'border-amber-200 bg-amber-50'
      case 'refusé':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  if (!open || !mission) return null

  const acceptedTechnicians = technicians.filter(t => t.status === 'accepté')
  const pendingTechnicians = technicians.filter(t => t.status === 'proposé')
  const refusedTechnicians = technicians.filter(t => t.status === 'refusé')
  const requiredPeople = mission.required_people || 1

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <CardTitle>Techniciens Assignés - {mission.title}</CardTitle>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge className={getMissionTypeColor(mission.type)}>
                {mission.type}
              </Badge>
              <span className="text-sm text-gray-600">
                {formatDateTime(mission.date_start)}
              </span>
              <span className="text-sm font-medium text-emerald-600">
                {formatCurrency(mission.forfeit)}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{mission.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{requiredPeople} personne(s) requise(s)</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-600">Chargement des techniciens...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Statistiques rapides */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-green-700">Validés</p>
                      <p className="text-lg font-bold text-green-800">{acceptedTechnicians.length}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-amber-700">En attente</p>
                      <p className="text-lg font-bold text-amber-800">{pendingTechnicians.length}</p>
                    </div>
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-red-700">Refusés</p>
                      <p className="text-lg font-bold text-red-800">{refusedTechnicians.length}</p>
                    </div>
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </div>

              {/* Techniciens validés */}
              {acceptedTechnicians.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-green-700 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Techniciens Validés ({acceptedTechnicians.length}/{requiredPeople})
                  </h3>
                  
                  <div className="space-y-2">
                    {acceptedTechnicians.map((tech) => (
                      <div key={tech.id} className={`p-3 border rounded-lg ${getStatusColor(tech.status)}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                                                         <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                               <UserIcon className="h-4 w-4 text-white" />
                             </div>
                            <div>
                              <p className="font-medium text-gray-900">{tech.name}</p>
                              {tech.phone && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {tech.phone}
                                </p>
                              )}
                              {tech.email && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {tech.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(tech.status)}
                            {tech.assignment?.responded_at && (
                              <span className="text-xs text-gray-500">
                                Répondu le {new Date(tech.assignment.responded_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Techniciens en attente */}
              {pendingTechnicians.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-amber-700 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    En Attente de Réponse ({pendingTechnicians.length})
                  </h3>
                  
                  <div className="space-y-2">
                    {pendingTechnicians.map((tech) => (
                      <div key={tech.id} className={`p-3 border rounded-lg ${getStatusColor(tech.status)}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                                                         <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                               <UserIcon className="h-4 w-4 text-white" />
                             </div>
                            <div>
                              <p className="font-medium text-gray-900">{tech.name}</p>
                              {tech.phone && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {tech.phone}
                                </p>
                              )}
                              {tech.email && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {tech.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(tech.status)}
                            {tech.assignment?.assigned_at && (
                              <span className="text-xs text-gray-500">
                                Proposé le {new Date(tech.assignment.assigned_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Techniciens refusés */}
              {refusedTechnicians.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-red-700 flex items-center">
                    <XCircle className="h-4 w-4 mr-2" />
                    Refusés ({refusedTechnicians.length})
                  </h3>
                  
                  <div className="space-y-2">
                    {refusedTechnicians.map((tech) => (
                      <div key={tech.id} className={`p-3 border rounded-lg ${getStatusColor(tech.status)}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                                                         <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                               <UserIcon className="h-4 w-4 text-white" />
                             </div>
                            <div>
                              <p className="font-medium text-gray-900">{tech.name}</p>
                              {tech.phone && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {tech.phone}
                                </p>
                              )}
                              {tech.email && (
                                <p className="text-xs text-gray-600 flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {tech.email}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(tech.status)}
                            {tech.assignment?.responded_at && (
                              <span className="text-xs text-gray-500">
                                Refusé le {new Date(tech.assignment.responded_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message si aucun technicien assigné */}
              {technicians.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun technicien assigné à cette mission</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Fermer
                </Button>
                {acceptedTechnicians.length < requiredPeople && (
                  <Button 
                    onClick={() => {
                      // TODO: Ouvrir le dialogue d'assignation
                      onOpenChange(false)
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                                         <UserIcon className="h-4 w-4 mr-2" />
                     Assigner plus de techniciens
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
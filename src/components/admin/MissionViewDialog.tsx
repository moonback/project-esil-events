import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Euro, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  User,
  Phone,
  Mail,
  Edit
} from 'lucide-react'
import { formatCurrency, formatDate, getMissionTypeColor } from '@/lib/utils'
import type { MissionWithAssignments } from '@/types/database'

interface MissionViewDialogProps {
  mission: MissionWithAssignments | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (mission: MissionWithAssignments) => void
}

export function MissionViewDialog({ mission, open, onOpenChange, onEdit }: MissionViewDialogProps) {
  if (!mission) return null

  const getAssignmentStatus = (mission: MissionWithAssignments) => {
    const accepted = mission.mission_assignments?.filter((a: any) => a.status === 'accepté').length || 0
    const pending = mission.mission_assignments?.filter((a: any) => a.status === 'proposé').length || 0
    const total = mission.required_people

    if (accepted >= total) {
      return { status: 'complete', text: 'Complète', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    } else if (accepted > 0) {
      return { status: 'partial', text: `${accepted}/${total} assignés`, color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    } else if (pending > 0) {
      return { status: 'pending', text: `${pending} en attente`, color: 'bg-blue-100 text-blue-800', icon: Clock }
    } else {
      return { status: 'empty', text: 'Aucun assigné', color: 'bg-gray-100 text-gray-800', icon: XCircle }
    }
  }

  const assignmentStatus = getAssignmentStatus(mission)
  const today = new Date()
  const missionDate = new Date(mission.date_start)
  const daysDiff = Math.ceil((missionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isUrgent = daysDiff <= 3 && daysDiff >= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-gray-900">{mission.title}</h2>
              <Badge 
                variant="secondary" 
                style={{ backgroundColor: getMissionTypeColor(mission.type) }}
              >
                {mission.type}
              </Badge>
              {isUrgent && (
                <Badge variant="destructive">
                  Urgent (dans {daysDiff} jour{daysDiff > 1 ? 's' : ''})
                </Badge>
              )}
            </div>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(mission)}
                className="flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Modifier</span>
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>Dates</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Début:</span>
                  <span className="text-sm text-gray-900">{formatDate(mission.date_start)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Fin:</span>
                  <span className="text-sm text-gray-900">{formatDate(mission.date_end)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Durée:</span>
                  <span className="text-sm text-gray-900">
                    {Math.ceil((new Date(mission.date_end).getTime() - new Date(mission.date_start).getTime()) / (1000 * 60 * 60 * 24))} jour(s)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span>Localisation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-900">{mission.location}</p>
                {mission.latitude && mission.longitude && (
                  <p className="text-xs text-gray-500 mt-1">
                    Coordonnées: {mission.latitude.toFixed(6)}, {mission.longitude.toFixed(6)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {mission.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span>Description</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{mission.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Informations financières et ressources */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Euro className="h-5 w-5 text-emerald-600" />
                  <span>Forfait</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(mission.forfeit)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Personnel requis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{mission.required_people}</p>
                <p className="text-sm text-gray-600">personne(s)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <assignmentStatus.icon className="h-5 w-5 text-gray-600" />
                  <span>Statut</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={assignmentStatus.color}>
                  {assignmentStatus.text}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Assignations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-indigo-600" />
                <span>Assignations ({mission.mission_assignments?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mission.mission_assignments && mission.mission_assignments.length > 0 ? (
                <div className="space-y-3">
                  {mission.mission_assignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {assignment.users?.name || 'Technicien inconnu'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {assignment.users?.email || 'Email non disponible'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={
                            assignment.status === 'accepté' ? 'default' :
                            assignment.status === 'proposé' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {assignment.status === 'accepté' ? 'Accepté' :
                           assignment.status === 'proposé' ? 'En attente' :
                           'Refusé'}
                        </Badge>
                        {assignment.users?.phone && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        {assignment.users?.email && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Aucun technicien assigné</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations de création */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Informations système</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>ID Mission:</span>
                <span>{mission.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Créée le:</span>
                <span>{formatDate(mission.created_at)}</span>
              </div>
              {mission.updated_at !== mission.created_at && (
                <div className="flex justify-between">
                  <span>Modifiée le:</span>
                  <span>{formatDate(mission.updated_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
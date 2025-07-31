import React, { useState } from 'react'
import { useMissionsStore } from '@/store/missionsStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Users, UserPlus, Calendar, MapPin, DollarSign, Sparkles } from 'lucide-react'
import { formatDateTime, formatCurrency, getMissionTypeColor, getStatusColor } from '@/lib/utils'
import { MissionDialog } from './MissionDialog'
import { AssignTechniciansDialog } from './AssignTechniciansDialog'

export function MissionsTab() {
  const { missions, loading, deleteMission } = useMissionsStore()
  const [selectedMission, setSelectedMission] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [missionToAssign, setMissionToAssign] = useState(null)

  const handleEdit = (mission: any) => {
    setSelectedMission(mission)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedMission(null)
    setDialogOpen(true)
  }

  const handleAssignTechnicians = (mission: any) => {
    setMissionToAssign(mission)
    setAssignDialogOpen(true)
  }
  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) {
      await deleteMission(id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="loading-spinner mx-auto"></div>
          <p className="text-gray-600 animate-pulse-slow">Chargement des missions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Sparkles className="h-6 w-6 text-indigo-600 animate-pulse-slow" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-bounce-slow"></div>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Gestion des Missions
            </h3>
          </div>
          <p className="text-gray-600">Créez et gérez vos missions événementielles</p>
        </div>
        <Button 
          onClick={handleCreate} 
          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvelle Mission</span>
        </Button>
      </div>

      <div className="grid gap-6">
        {missions.length === 0 ? (
          <Card className="card-soft hover:scale-105 transition-all duration-300">
            <CardContent className="py-16 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-lg font-medium">Aucune mission créée</p>
                  <p className="text-gray-400 text-sm mt-1">Commencez par créer votre première mission</p>
                </div>
                <Button 
                  onClick={handleCreate} 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  Créer votre première mission
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          missions.map((mission, index) => (
            <Card 
              key={mission.id} 
              className="card-soft hover:scale-105 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-xl font-bold text-gray-900">{mission.title}</CardTitle>
                      <Badge className={`${getMissionTypeColor(mission.type)} text-white font-semibold px-3 py-1 rounded-full shadow-sm`}>
                        {mission.type}
                      </Badge>
                    </div>
                    {mission.description && (
                      <p className="text-gray-600 leading-relaxed">{mission.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(mission)}
                      className="hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all duration-300 hover:scale-105"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAssignTechnicians(mission)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:scale-105"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(mission.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-300 hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Période</p>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(mission.date_start)}
                      </p>
                      <p className="text-sm text-gray-600">
                        → {formatDateTime(mission.date_end)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                    <MapPin className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Lieu</p>
                      <p className="text-sm text-gray-600">{mission.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Forfait</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(mission.forfeit)}
                      </p>
                    </div>
                  </div>
                </div>

                {mission.mission_assignments.length > 0 && (
                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center space-x-2 mb-4">
                      <Users className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-700">
                        Techniciens assignés
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {mission.mission_assignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                          <span className="text-sm font-medium text-gray-700">{assignment.users.name}</span>
                          <Badge className={`${getStatusColor(assignment.status)} text-white font-semibold px-2 py-1 rounded-full text-xs`}>
                            {assignment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <MissionDialog
        mission={selectedMission}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <AssignTechniciansDialog
        mission={missionToAssign}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />
    </div>
  )
}
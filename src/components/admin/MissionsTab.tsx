import React, { useState } from 'react'
import { useMissionsStore } from '@/store/missionsStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Users, UserPlus } from 'lucide-react'
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
        <div className="text-gray-500">Chargement des missions...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Gestion des Missions</h3>
          <p className="text-gray-600">Créez et gérez vos missions événementielles</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nouvelle Mission</span>
        </Button>
      </div>

      <div className="grid gap-4">
        {missions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Aucune mission créée</p>
              <Button onClick={handleCreate} className="mt-4">
                Créer votre première mission
              </Button>
            </CardContent>
          </Card>
        ) : (
          missions.map((mission) => (
            <Card key={mission.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{mission.title}</CardTitle>
                      <Badge className={getMissionTypeColor(mission.type)}>
                        {mission.type}
                      </Badge>
                    </div>
                    <p className="text-gray-600">{mission.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(mission)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleAssignTechnicians(mission)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(mission.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Période</p>
                    <p className="text-sm">
                      {formatDateTime(mission.date_start)} → {formatDateTime(mission.date_end)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Lieu</p>
                    <p className="text-sm">{mission.location}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Forfait</p>
                    <p className="text-sm font-bold text-green-600">
                      {formatCurrency(mission.forfeit)}
                    </p>
                  </div>
                </div>

                {mission.mission_assignments.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-500">
                        Techniciens assignés
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {mission.mission_assignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center space-x-2">
                          <span className="text-sm">{assignment.users.name}</span>
                          <Badge className={getStatusColor(assignment.status)}>
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
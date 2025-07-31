import { useState, useMemo, useEffect } from 'react'
import { useMissionsStore } from '@/store/missionsStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Edit, Trash2, Users, UserPlus, Calendar, MapPin, 
  Clock, Filter, Search, CheckCircle, XCircle, AlertCircle,
  TrendingUp, Activity, AlertTriangle, X, Car
  } from 'lucide-react'
import { formatDateTime, formatCurrency, getMissionTypeColor, getStatusColor } from '@/lib/utils'
import { MissionDialog } from './MissionDialog'
import { AssignTechniciansDialog } from './AssignTechniciansDialog'
import { VehicleAssignmentDialog } from './VehicleAssignmentDialog'
import type { Mission, MissionWithAssignments } from '@/types/database'

export function MissionsTab() {
  const { missions, loading, error, deleteMission, fetchMissions, clearError } = useMissionsStore()
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [vehicleAssignDialogOpen, setVehicleAssignDialogOpen] = useState(false)
  const [missionToAssign, setMissionToAssign] = useState<Mission | null>(null)
  const [missionToAssignVehicle, setMissionToAssignVehicle] = useState<Mission | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchMissions()
  }, [fetchMissions])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMissions()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [fetchMissions])

  const handleEdit = (mission: Mission) => {
    setSelectedMission(mission)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedMission(null)
    setDialogOpen(true)
  }

  const handleAssignTechnicians = (mission: Mission) => {
    setMissionToAssign(mission)
    setAssignDialogOpen(true)
  }

  const handleAssignVehicle = (mission: Mission) => {
    setMissionToAssignVehicle(mission)
    setVehicleAssignDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) {
      setDeleteLoading(id)
      try {
        await deleteMission(id)
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      } finally {
        setDeleteLoading(null)
      }
    }
  }

  const missionStats = useMemo(() => {
    const total = missions.length
    const byType = missions.reduce((acc, mission) => {
      acc[mission.type] = (acc[mission.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const totalRevenue = missions.reduce((sum, mission) => sum + mission.forfeit, 0)
    const assignedCount = missions.filter(m => m.mission_assignments?.length > 0).length
    
    return { total, byType, totalRevenue, assignedCount }
  }, [missions])

  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      const matchesSearch = mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mission.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mission.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || mission.type === filterType
      return matchesSearch && matchesType
    })
  }, [missions, searchTerm, filterType])

  const getMissionStatus = (mission: MissionWithAssignments) => {
    if (!mission.mission_assignments?.length) return { status: 'non_assigné', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    
    const assignments = mission.mission_assignments
    const acceptedCount = assignments.filter(a => a.status === 'accepté').length
    const refusedCount = assignments.filter(a => a.status === 'refusé').length
    const pendingCount = assignments.filter(a => a.status === 'proposé').length
    
    if (acceptedCount > 0) return { status: 'accepté', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    if (refusedCount > 0 && acceptedCount === 0) return { status: 'refusé', color: 'bg-red-100 text-red-800', icon: XCircle }
    if (pendingCount > 0) return { status: 'en_attente', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle }
    
    return { status: 'non_assigné', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Missions</h2>
          <p className="text-gray-600">Créez et gérez les missions événementielles</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Mission
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Missions</p>
                <p className="text-2xl font-bold">{missionStats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(missionStats.totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Missions Assignées</p>
                <p className="text-2xl font-bold text-purple-600">{missionStats.assignedCount}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Types de Missions</p>
                <p className="text-2xl font-bold text-orange-600">{Object.keys(missionStats.byType).length}</p>
              </div>
              <Filter className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher une mission..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Tous les types</option>
          <option value="Livraison jeux">Livraison jeux</option>
          <option value="Presta sono">Presta sono</option>
          <option value="DJ">DJ</option>
          <option value="Manutention">Manutention</option>
          <option value="Déplacement">Déplacement</option>
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError} className="ml-auto">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Missions List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des missions...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMissions.map((mission) => {
            const missionStatus = getMissionStatus(mission)
            const StatusIcon = missionStatus.icon

            return (
              <Card key={mission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg truncate">{mission.title}</h3>
                        <Badge className={`${getMissionTypeColor(mission.type)} text-xs`}>
                          {mission.type}
                        </Badge>
                      </div>
                      
                      {mission.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{mission.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge className={`${missionStatus.color} text-xs flex items-center space-x-1`}>
                            <StatusIcon className="h-3 w-3" />
                            <span>{missionStatus.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-xs text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-blue-500" />
                            <span className="truncate">{formatDateTime(mission.date_start)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-green-500" />
                            <span className="truncate" title={mission.location}>{mission.location}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <span className="font-medium text-green-600">{formatCurrency(mission.forfeit)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3 text-purple-500" />
                            <span>{mission.required_people || 1} pers.</span>
                          </div>
                        </div>

                        {mission.mission_assignments && mission.mission_assignments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex flex-wrap gap-1">
                              {mission.mission_assignments.slice(0, 3).map((assignment) => (
                                <div key={assignment.id} className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded text-xs">
                                  <span className="font-medium text-gray-700">{assignment.users.name}</span>
                                  <Badge className={`${getStatusColor(assignment.status)} text-xs`}>
                                    {assignment.status}
                                  </Badge>
                                </div>
                              ))}
                              {mission.mission_assignments.length > 3 && (
                                <span className="text-xs text-gray-500">+{mission.mission_assignments.length - 3}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(mission)}
                          className="h-7 w-7 p-0 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleAssignTechnicians(mission)}
                          className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <UserPlus className="h-3 w-3" />
                        </Button>
                        {mission.vehicle_required && mission.vehicle_type !== 'aucun' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleAssignVehicle(mission)}
                            className="h-7 w-7 p-0 hover:bg-orange-50 hover:text-orange-600"
                          >
                            <Car className="h-3 w-3" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(mission.id)}
                          disabled={deleteLoading === mission.id}
                          className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          {deleteLoading === mission.id ? (
                            <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

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

      <VehicleAssignmentDialog
        mission={missionToAssignVehicle}
        open={vehicleAssignDialogOpen}
        onOpenChange={setVehicleAssignDialogOpen}
      />
    </div>
  )
}
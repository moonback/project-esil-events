import { useState, useMemo, useEffect } from 'react'
import { useMissionsStore } from '@/store/missionsStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Edit, Trash2, Users, UserPlus, Calendar, MapPin, 
  Clock, Filter, Search, CheckCircle, XCircle, AlertCircle,
  TrendingUp, Activity, AlertTriangle, X
  } from 'lucide-react'
import { formatDateTime, formatCurrency, getMissionTypeColor, getStatusColor } from '@/lib/utils'
import { MissionDialog } from './MissionDialog'
import { AssignTechniciansDialog } from './AssignTechniciansDialog'
import type { Mission, MissionWithAssignments } from '@/types/database'

export function MissionsTab() {
  const { missions, loading, error, deleteMission, fetchMissions, clearError } = useMissionsStore()
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [missionToAssign, setMissionToAssign] = useState<Mission | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  // Charger les missions au montage du composant et quand le composant devient visible
  useEffect(() => {
    fetchMissions()
  }, [fetchMissions])

  // Recharger les données quand le composant devient visible
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

  // Statistiques des missions
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

  // Filtrage des missions
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
    if (refusedCount === assignments.length) return { status: 'refusé', color: 'bg-red-100 text-red-800', icon: XCircle }
    if (pendingCount > 0) return { status: 'en_attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    
    return { status: 'mixte', color: 'bg-blue-100 text-blue-800', icon: Activity }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Chargement des missions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* En-tête avec statistiques */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Missions</h2>
            <p className="text-gray-600">Tableau de bord complet pour vos missions événementielles</p>
          </div>
          <Button 
            onClick={handleCreate} 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Mission
          </Button>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Missions</p>
                <p className="text-2xl font-bold text-gray-900">{missionStats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assignées</p>
                <p className="text-2xl font-bold text-green-600">{missionStats.assignedCount}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus Total</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(missionStats.totalRevenue)}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Attente</p>
                <p className="text-2xl font-bold text-orange-600">{missionStats.total - missionStats.assignedCount}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contrôles de filtrage et recherche */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, lieu ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Tous les types</option>
                <option value="Livraison jeux">Livraison jeux</option>
                <option value="Presta sono">Presta sono</option>
                <option value="DJ">DJ</option>
                <option value="Manutention">Manutention</option>
                <option value="Déplacement">Déplacement</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {filteredMissions.length} mission{filteredMissions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Liste des missions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredMissions.length === 0 ? (
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="py-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Activity className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <p className="text-gray-500 text-lg font-medium">
                    {searchTerm || filterType !== 'all' ? 'Aucune mission trouvée' : 'Aucune mission créée'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchTerm || filterType !== 'all' 
                      ? 'Essayez de modifier vos critères de recherche' 
                      : 'Commencez par créer votre première mission'
                    }
                  </p>
                </div>
                {!searchTerm && filterType === 'all' && (
                  <Button 
                    onClick={handleCreate} 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105"
                  >
                    Créer votre première mission
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredMissions.map((mission, index) => {
            const missionStatus = getMissionStatus(mission as MissionWithAssignments)
            const StatusIcon = missionStatus.icon
            
            return (
              <Card 
                key={mission.id} 
                className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{mission.title}</h3>
                        <Badge className={`${getMissionTypeColor(mission.type)} font-medium px-2 py-1 text-xs`}>
                          {mission.type}
                        </Badge>
                        <Badge className={`${missionStatus.color} font-medium px-2 py-1 text-xs flex items-center space-x-1`}>
                          <StatusIcon className="h-3 w-3" />
                          <span>{missionStatus.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      {mission.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">{mission.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit(mission)}
                        className="h-8 w-8 p-0 hover:bg-indigo-50 hover:text-indigo-600"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAssignTechnicians(mission)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                        title="Assigner des techniciens"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(mission.id)}
                        disabled={deleteLoading === mission.id}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Supprimer"
                      >
                        {deleteLoading === mission.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Informations compactes */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-700">Début</p>
                        <p className="text-gray-600 truncate">{formatDateTime(mission.date_start)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-700">Fin</p>
                        <p className="text-gray-600 truncate">{formatDateTime(mission.date_end)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-700">Lieu</p>
                        <p className="text-gray-600 truncate" title={mission.location}>{mission.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-700">Forfait</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(mission.forfeit)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Users className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-700">Personnes</p>
                        <p className="text-gray-600">{mission.required_people || 1}</p>
                      </div>
                    </div>
                  </div>

                  {/* Techniciens assignés */}
                  {mission.mission_assignments && mission.mission_assignments.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">
                            Techniciens ({mission.mission_assignments.length})
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {mission.mission_assignments.slice(0, 3).map((assignment) => (
                          <div key={assignment.id} className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full border">
                            <span className="text-sm font-medium text-gray-700">{assignment.users.name}</span>
                            <Badge className={`${getStatusColor(assignment.status)} text-xs px-2 py-0.5`}>
                              {assignment.status}
                            </Badge>
                          </div>
                        ))}
                        {mission.mission_assignments.length > 3 && (
                          <div className="flex items-center justify-center bg-gray-100 px-3 py-1 rounded-full border">
                            <span className="text-xs text-gray-600">+{mission.mission_assignments.length - 3} autres</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
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
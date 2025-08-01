import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import { useMissionsStore } from '@/store/missionsStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Edit, Trash2, Users, UserPlus, Calendar, MapPin, 
  Clock, Filter, Search, CheckCircle, XCircle, AlertCircle,
  TrendingUp, Activity, AlertTriangle, X, Trash, Play,
  MoreVertical, User, ArrowRight, Check, X as XIcon
} from 'lucide-react'
import { formatDateTime, formatCurrency, getMissionTypeColor, getStatusColor } from '@/lib/utils'
import { MissionDialog } from './MissionDialog'
import { AssignTechniciansDialog } from './AssignTechniciansDialog'
import type { Mission, MissionWithAssignments } from '@/types/database'
import { useAdminStore } from '@/store/adminStore'

// Composant optimisé pour les cartes de missions en vue Kanban
const MissionCard = memo(({ 
  mission, 
  onEdit, 
  onAssign, 
  onDelete, 
  onQuickAssign,
  deleteLoading 
}: {
  mission: MissionWithAssignments
  onEdit: (mission: Mission) => void
  onAssign: (mission: Mission) => void
  onDelete: (id: string) => void
  onQuickAssign: (mission: Mission) => void
  deleteLoading: string | null
}) => {
  const missionStatus = useMemo(() => {
    if (!mission.mission_assignments?.length) return { status: 'non_assigné', color: 'bg-gray-500', icon: AlertCircle }
    
    const assignments = mission.mission_assignments
    const acceptedCount = assignments.filter((a: any) => a.status === 'accepté').length
    const refusedCount = assignments.filter((a: any) => a.status === 'refusé').length
    const pendingCount = assignments.filter((a: any) => a.status === 'proposé').length
    
    const requiredPeople = mission.required_people || 1
    const isComplete = acceptedCount >= requiredPeople
    
    if (isComplete) return { status: 'complet', color: 'bg-emerald-500', icon: CheckCircle }
    if (acceptedCount > 0) return { status: 'partiellement_assigné', color: 'bg-indigo-500', icon: Activity }
    if (refusedCount === assignments.length) return { status: 'refusé', color: 'bg-red-500', icon: XCircle }
    if (pendingCount > 0) return { status: 'en_attente', color: 'bg-amber-500', icon: Clock }
    
    return { status: 'mixte', color: 'bg-blue-500', icon: Activity }
  }, [mission])

  const StatusIcon = missionStatus.icon
  const acceptedAssignments = mission.mission_assignments?.filter((a: any) => a.status === 'accepté') || []
  const requiredPeople = mission.required_people || 1

  return (
    <Card className="border border-gray-200 hover:border-indigo-200 transition-all duration-200 hover:shadow-md group">
      <CardContent className="p-4">
        {/* En-tête avec statut et actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${missionStatus.color}`} />
            <Badge className={`${missionStatus.color} text-white text-xs px-2 py-1`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {missionStatus.status.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onQuickAssign(mission)}
              className="h-7 w-7 p-0 hover:bg-emerald-50 hover:text-emerald-600"
              title="Assigner rapidement"
            >
              <UserPlus className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(mission)}
              className="h-7 w-7 p-0 hover:bg-indigo-50 hover:text-indigo-600"
              title="Modifier"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(mission.id)}
              disabled={deleteLoading === mission.id}
              className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
              title="Supprimer"
            >
              {deleteLoading === mission.id ? (
                <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Titre et type */}
        <div className="mb-3">
          <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">{mission.title}</h3>
          <Badge className={`${getMissionTypeColor(mission.type)} text-xs`}>
            {mission.type}
          </Badge>
        </div>

        {/* Date et lieu mis en avant */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center space-x-2 text-xs">
            <Calendar className="h-3 w-3 text-indigo-500" />
            <span className="font-medium text-gray-700">{formatDateTime(mission.date_start)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-xs">
            <MapPin className="h-3 w-3 text-emerald-500" />
            <span className="font-medium text-gray-700 truncate" title={mission.location}>
              {mission.location}
            </span>
          </div>
        </div>

        {/* Montant et techniciens */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-emerald-600">{formatCurrency(mission.forfeit)}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-gray-600">{requiredPeople} pers.</span>
          </div>
        </div>

        {/* Techniciens assignés avec avatars */}
        {acceptedAssignments.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">Techniciens assignés</span>
              <span className="text-xs text-gray-500">
                {acceptedAssignments.length}/{requiredPeople}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              {acceptedAssignments.slice(0, 3).map((assignment: any, index: number) => (
                <div key={assignment.id} className="flex items-center space-x-1">
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  {index < 2 && <div className="w-px h-4 bg-gray-200" />}
                </div>
              ))}
              {acceptedAssignments.length > 3 && (
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{acceptedAssignments.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Barre de progression */}
        {mission.mission_assignments && mission.mission_assignments.length > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (acceptedAssignments.length / requiredPeople) * 100)}%`
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
})

MissionCard.displayName = 'MissionCard'

export function MissionsTab() {
  const { missions, loading, stats, deleteAllMissions, createTestMissions } = useAdminStore()
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [missionToAssign, setMissionToAssign] = useState<Mission | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [deleteAllLoading, setDeleteAllLoading] = useState(false)
  const [createTestLoading, setCreateTestLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

  const handleEdit = useCallback((mission: Mission) => {
    setSelectedMission(mission)
    setDialogOpen(true)
  }, [])

  const handleCreate = useCallback(() => {
    setSelectedMission(null)
    setDialogOpen(true)
  }, [])

  const handleAssignTechnicians = useCallback((mission: Mission) => {
    setMissionToAssign(mission)
    setAssignDialogOpen(true)
  }, [])

  const handleQuickAssign = useCallback((mission: Mission) => {
    setMissionToAssign(mission)
    setAssignDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) {
      setDeleteLoading(id)
      try {
        // TODO: Implémenter la suppression via le store admin
        console.log('Suppression de la mission:', id)
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      } finally {
        setDeleteLoading(null)
      }
    }
  }, [])

  const handleDeleteAll = useCallback(async () => {
    if (missions.length === 0) {
      alert('Aucune mission à supprimer')
      return
    }

    const confirmed = confirm(
      `Êtes-vous absolument sûr de vouloir supprimer toutes les ${missions.length} missions ?\n\nCette action est irréversible et supprimera également toutes les assignations associées.`
    )

    if (confirmed) {
      setDeleteAllLoading(true)
      try {
        await deleteAllMissions()
        alert('Toutes les missions ont été supprimées avec succès')
      } catch (error) {
        console.error('Erreur lors de la suppression de toutes les missions:', error)
        alert('Erreur lors de la suppression de toutes les missions. Veuillez réessayer.')
      } finally {
        setDeleteAllLoading(false)
      }
    }
  }, [missions.length, deleteAllMissions])

  const handleCreateTest = useCallback(async () => {
    setCreateTestLoading(true)
    try {
      await createTestMissions()
      alert('5 missions de test ont été créées avec succès !')
    } catch (error) {
      console.error('Erreur lors de la création des missions de test:', error)
      alert('Erreur lors de la création des missions de test. Veuillez réessayer.')
    } finally {
      setCreateTestLoading(false)
    }
  }, [createTestMissions])

  // Optimisation : mémoriser les handlers pour éviter les re-rendus
  const handlers = useMemo(() => ({
    onEdit: handleEdit,
    onAssign: handleAssignTechnicians,
    onDelete: handleDelete,
    onQuickAssign: handleQuickAssign
  }), [handleEdit, handleAssignTechnicians, handleDelete, handleQuickAssign])

  const missionStats = stats.missions

  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      const matchesSearch = mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mission.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mission.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || mission.type === filterType
      return matchesSearch && matchesType
    })
  }, [missions, searchTerm, filterType])

  // Grouper les missions par statut pour la vue Kanban
  const groupedMissions = useMemo(() => {
    const groups = {
      'non_assigné': [] as MissionWithAssignments[],
      'en_attente': [] as MissionWithAssignments[],
      'partiellement_assigné': [] as MissionWithAssignments[],
      'complet': [] as MissionWithAssignments[]
    }

    filteredMissions.forEach(mission => {
      const assignments = mission.mission_assignments || []
      const acceptedCount = assignments.filter((a: any) => a.status === 'accepté').length
      const requiredPeople = mission.required_people || 1
      
      if (acceptedCount >= requiredPeople) {
        groups.complet.push(mission as MissionWithAssignments)
      } else if (acceptedCount > 0) {
        groups.partiellement_assigné.push(mission as MissionWithAssignments)
      } else if (assignments.length > 0) {
        groups.en_attente.push(mission as MissionWithAssignments)
      } else {
        groups.non_assigné.push(mission as MissionWithAssignments)
      }
    })

    return groups
  }, [filteredMissions])

  const kanbanColumns = [
    {
      id: 'non_assigné',
      title: 'Non assignées',
      color: 'bg-gray-100',
      textColor: 'text-gray-700',
      missions: groupedMissions.non_assigné
    },
    {
      id: 'en_attente',
      title: 'En attente',
      color: 'bg-amber-100',
      textColor: 'text-amber-700',
      missions: groupedMissions.en_attente
    },
    {
      id: 'partiellement_assigné',
      title: 'Partiellement assignées',
      color: 'bg-indigo-100',
      textColor: 'text-indigo-700',
      missions: groupedMissions.partiellement_assigné
    },
    {
      id: 'complet',
      title: 'Complètes',
      color: 'bg-emerald-100',
      textColor: 'text-emerald-700',
      missions: groupedMissions.complet
    }
  ]

  if (loading.missions) {
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
    <div className="space-y-6">
      {/* En-tête compact */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Missions</h2>
          <p className="text-sm text-gray-600 mt-1">{missionStats.total} missions au total</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Boutons d'action regroupés */}
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleCreateTest}
              disabled={createTestLoading}
              size="sm"
              variant="outline"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
            >
              {createTestLoading ? (
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Tests
            </Button>
            <Button 
              onClick={handleDeleteAll}
              disabled={deleteAllLoading || missions.length === 0}
              size="sm"
              variant="outline"
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            >
              {deleteAllLoading ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              Effacer
            </Button>
          </div>
          
          <Button 
            onClick={handleCreate} 
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle mission
          </Button>
        </div>
      </div>

      {/* Statistiques compactes */}
      <div className="grid grid-cols-4 gap-6 px-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{missionStats.total}</p>
            </div>
            <Activity className="h-6 w-6 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Complètes</p>
              <p className="text-xl font-bold text-emerald-600">
                {missions.filter(m => {
                  const acceptedCount = m.mission_assignments?.filter((a: any) => a.status === 'accepté').length || 0
                  return acceptedCount >= (m.required_people || 1)
                }).length}
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Revenus</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(missionStats.totalRevenue)}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">En attente</p>
              <p className="text-xl font-bold text-amber-600">{missionStats.total - missionStats.assignedCount}</p>
            </div>
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Contrôles de filtrage et vue */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {filteredMissions.length} résultat{filteredMissions.length !== 1 ? 's' : ''}
            </span>
            
            {/* Toggle de vue */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                onClick={() => setViewMode('kanban')}
                className="h-8 px-3"
              >
                Kanban
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                Liste
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu des missions */}
      <div className="px-6">
        {filteredMissions.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">
              {searchTerm || filterType !== 'all' ? 'Aucune mission trouvée' : 'Aucune mission créée'}
            </p>
          </div>
        ) : viewMode === 'kanban' ? (
          /* Vue Kanban */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kanbanColumns.map((column) => (
              <div key={column.id} className="space-y-4">
                <div className={`${column.color} ${column.textColor} px-4 py-2 rounded-lg`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{column.title}</h3>
                    <span className="text-xs font-medium bg-white bg-opacity-50 px-2 py-1 rounded">
                      {column.missions.length}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {column.missions.map((mission) => (
                    <MissionCard
                      key={mission.id}
                      mission={mission}
                      onEdit={handlers.onEdit}
                      onAssign={handlers.onAssign}
                      onDelete={handlers.onDelete}
                      onQuickAssign={handlers.onQuickAssign}
                      deleteLoading={deleteLoading}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Vue Liste */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMissions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission as MissionWithAssignments}
                onEdit={handlers.onEdit}
                onAssign={handlers.onAssign}
                onDelete={handlers.onDelete}
                onQuickAssign={handlers.onQuickAssign}
                deleteLoading={deleteLoading}
              />
            ))}
          </div>
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
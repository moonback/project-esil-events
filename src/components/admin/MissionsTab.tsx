import { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Search, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

import { 
  Plus, Edit, Trash2, Users, UserPlus, Calendar, MapPin, 
  Clock, CheckCircle, XCircle, AlertCircle as AlertCircleIcon,
  TrendingUp, Activity, Play, User, ArrowRight, Check
} from 'lucide-react'
import { formatDateTime, formatCurrency, getMissionTypeColor } from '@/lib/utils'
import { parseISO, isValid } from 'date-fns'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MissionDialog } from './MissionDialog'
import { AssignTechniciansDialog } from './AssignTechniciansDialog'
import { TechnicianContactDialog } from './TechnicianContactDialog'
import type { Mission, MissionWithAssignments } from '@/types/database'
import { useMissionsStore } from '@/store/missionsStore'

// Fonction utilitaire pour convertir les dates UTC en heure locale
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

// Composant pour afficher les détails des assignations
const AssignmentDetails = memo(({ 
  mission,
  onViewTechnicianDetails
}: { 
  mission: MissionWithAssignments
  onViewTechnicianDetails: (mission: Mission) => void
}) => {
  const assignments = mission.mission_assignments || []
  const activeAssignments = assignments.filter((a: any) => !a.cancelled_by_admin)
  const acceptedCount = activeAssignments.filter((a: any) => a.status === 'accepté').length
  const pendingCount = activeAssignments.filter((a: any) => a.status === 'proposé').length
  const requiredPeople = mission.required_people || 1

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Assignations :</span>
        <div className="flex items-center space-x-2">
          <span className="text-green-600 font-medium">{acceptedCount}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 font-medium">{requiredPeople}</span>
          {pendingCount > 0 && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-amber-600 font-medium">{pendingCount} en attente</span>
            </>
          )}
        </div>
      </div>
      
      {activeAssignments.length > 0 && (
        <div className="space-y-1">
          {activeAssignments.slice(0, 2).map((assignment: any) => (
            <div key={assignment.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  assignment.status === 'accepté' ? "bg-green-500" : "bg-amber-500"
                )} />
                <span className="text-gray-700">{assignment.users?.name || 'Technicien'}</span>
              </div>
              <Badge variant={assignment.status === 'accepté' ? 'default' : 'secondary'} className="text-xs">
                {assignment.status === 'accepté' ? 'Accepté' : 'En attente'}
              </Badge>
            </div>
          ))}
          {activeAssignments.length > 2 && (
            <div className="text-xs text-gray-500">
              +{activeAssignments.length - 2} autres techniciens
            </div>
          )}
        </div>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onViewTechnicianDetails(mission)}
        className="w-full text-xs"
      >
        <Users className="h-3 w-3 mr-1" />
        Voir les détails
      </Button>
    </div>
  )
})

AssignmentDetails.displayName = 'AssignmentDetails'

// Composant pour une carte de mission
const MissionCard = memo(({ 
  mission, 
  onEdit, 
  onAssign, 
  onDelete,
  deleteLoading
}: { 
  mission: MissionWithAssignments
  onEdit: () => void
  onAssign: () => void
  onDelete: () => void
  deleteLoading: boolean
}) => {
  const assignments = mission.mission_assignments || []
  const activeAssignments = assignments.filter((a: any) => !a.cancelled_by_admin)
  const acceptedCount = activeAssignments.filter((a: any) => a.status === 'accepté').length
  const requiredPeople = mission.required_people || 1
  const isFullyAssigned = acceptedCount >= requiredPeople

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* En-tête de la mission */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {mission.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
            </div>
                         <Badge 
               className={cn("ml-2", getMissionTypeColor(mission.type))}
             >
               {mission.type}
             </Badge>
          </div>

          {/* Informations de la mission */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{mission.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">
                {formatDateTimeUTC(mission.date_start)} - {formatDateTimeUTC(mission.date_end)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700 font-medium">
                {formatCurrency(mission.forfeit)}
              </span>
            </div>
          </div>

          {/* Statut des assignations */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {acceptedCount}/{requiredPeople} techniciens
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {isFullyAssigned ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircleIcon className="h-4 w-4 text-amber-500" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isFullyAssigned ? "text-green-600" : "text-amber-600"
              )}>
                {isFullyAssigned ? 'Complet' : 'Incomplet'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1"
            >
              <Edit className="h-3 w-3 mr-1" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAssign}
              className="flex-1"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Assigner
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              disabled={deleteLoading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {deleteLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

MissionCard.displayName = 'MissionCard'

export function MissionsTab() {
  const { missions, loading, error, fetchMissions, clearError, deleteMission } = useMissionsStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'grid'>('kanban')
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [missionToAssign, setMissionToAssign] = useState<Mission | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  // Charger les missions au montage du composant
  useEffect(() => {
    fetchMissions()
  }, [fetchMissions])

  // Fonction pour rafraîchir manuellement
  const handleRefresh = useCallback(async () => {
    try {
      await fetchMissions()
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error)
    }
  }, [fetchMissions])

  // Fonction pour supprimer une mission
  const handleDeleteMission = useCallback(async (missionId: string) => {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')
    if (!confirmed) return

    setDeleteLoading(missionId)
    try {
      await deleteMission(missionId)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    } finally {
      setDeleteLoading(null)
    }
  }, [deleteMission])

  // Filtrer et trier les missions
  const filteredAndSortedMissions = useMemo(() => {
    let filtered = missions.filter(mission => {
      const matchesSearch = mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           mission.location.toLowerCase().includes(searchQuery.toLowerCase())
      
      if (selectedFilter === 'all') return matchesSearch
      if (selectedFilter === 'pending') {
        const assignments = mission.mission_assignments || []
        return matchesSearch && assignments.length === 0
      }
      if (selectedFilter === 'assigned') {
        const assignments = mission.mission_assignments || []
        const acceptedCount = assignments.filter((a: any) => a.status === 'accepté').length
        return matchesSearch && acceptedCount > 0
      }
      if (selectedFilter === 'completed') {
        const assignments = mission.mission_assignments || []
        const acceptedCount = assignments.filter((a: any) => a.status === 'accepté').length
        const requiredPeople = mission.required_people || 1
        return matchesSearch && acceptedCount >= requiredPeople
      }
      
      return matchesSearch
    })

    // Trier les missions
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      }
      if (sortBy === 'status') {
        const aAssignments = a.mission_assignments || []
        const bAssignments = b.mission_assignments || []
        const aAccepted = aAssignments.filter((assignment: any) => assignment.status === 'accepté').length
        const bAccepted = bAssignments.filter((assignment: any) => assignment.status === 'accepté').length
        return bAccepted - aAccepted
      }
      return 0
    })

    return filtered
  }, [missions, searchQuery, selectedFilter, sortBy])

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton de rafraîchissement */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Missions</h2>
          <p className="text-gray-600">Gérez vos missions et assignations</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Bouton de rafraîchissement */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            <span>Actualiser</span>
          </Button>
          
          {/* Bouton d'ajout */}
          <Button
            onClick={() => {
              setSelectedMission(null)
              setDialogOpen(true)
            }}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle mission</span>
          </Button>
        </div>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">Erreur</span>
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
          <p className="text-red-700 mt-2">{error}</p>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher une mission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Toutes les missions</option>
            <option value="pending">En attente</option>
            <option value="assigned">Assignées</option>
            <option value="completed">Terminées</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Par date</option>
            <option value="title">Par titre</option>
            <option value="status">Par statut</option>
          </select>
        </div>
      </div>

      {/* Indicateur de chargement */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Chargement des missions...</span>
          </div>
        </div>
      )}

      {/* Liste des missions */}
      {!loading && missions.length === 0 && (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune mission</h3>
          <p className="text-gray-600 mb-4">Commencez par créer votre première mission</p>
          <Button
            onClick={() => {
              setSelectedMission(null)
              setDialogOpen(true)
            }}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Créer une mission</span>
          </Button>
        </div>
      )}

      {/* Grille des missions */}
      {!loading && missions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onEdit={() => {
                setSelectedMission(mission)
                setDialogOpen(true)
              }}
              onAssign={() => {
                setMissionToAssign(mission)
                setAssignDialogOpen(true)
              }}
              onDelete={() => handleDeleteMission(mission.id)}
              deleteLoading={deleteLoading === mission.id}
            />
          ))}
        </div>
      )}

      {/* Dialogues */}
      <MissionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mission={selectedMission}
      />

      <AssignTechniciansDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        mission={missionToAssign}
      />
    </div>
  )
}
import { useState, useMemo, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { 
  Plus, Edit, Trash2, Users, UserPlus, Calendar, MapPin, 
  Clock, Search, CheckCircle, XCircle, AlertCircle,
  TrendingUp, Activity, X, Trash, Play,
  User, ArrowRight, Check} from 'lucide-react'
import { formatDateTime, formatCurrency, getMissionTypeColor } from '@/lib/utils'
import { parseISO, isValid } from 'date-fns'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MissionDialog } from './MissionDialog'
import { AssignTechniciansDialog } from './AssignTechniciansDialog'
import { TechnicianContactDialog } from './TechnicianContactDialog'
import type { Mission, MissionWithAssignments } from '@/types/database'
import { useAdminStore } from '@/store/adminStore'

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
  const [showDetails, setShowDetails] = useState(false)
  
  const assignments = mission.mission_assignments || []
  const acceptedAssignments = assignments.filter((a: any) => a.status === 'accepté')
  const pendingAssignments = assignments.filter((a: any) => a.status === 'proposé')
  const refusedAssignments = assignments.filter((a: any) => a.status === 'refusé')
  const requiredPeople = mission.required_people || 1

  if (assignments.length === 0) {
    return (
      <div className="text-xs text-gray-500 italic">
        Aucun technicien assigné
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Résumé des assignations */}
      {/* <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">Assignations</span>
        <div className="flex items-center space-x-2">
          {acceptedAssignments.length > 0 && (
            <Badge className="bg-green-100 text-green-800 text-xs">
              <Check className="h-3 w-3 mr-1" />
              {acceptedAssignments.length} accepté(s)
            </Badge>
          )}
          {pendingAssignments.length > 0 && (
            <Badge className="bg-amber-100 text-amber-800 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {pendingAssignments.length} en attente
            </Badge>
          )}
          {refusedAssignments.length > 0 && (
            <Badge className="bg-red-100 text-red-800 text-xs">
              <XIcon className="h-3 w-3 mr-1" />
              {refusedAssignments.length} refusé(s)
            </Badge>
          )}
        </div>
      </div> */}

      {/* Techniciens acceptés avec avatars et noms */}
      {acceptedAssignments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-green-700">Techniciens validés</span>
            <span className="text-xs text-gray-500">
              {acceptedAssignments.length}/{requiredPeople}
            </span>
          </div>
          
          <div className="space-y-1">
            {acceptedAssignments.map((assignment: any) => (
              <div key={assignment.id} className="flex items-center space-x-2 p-2 bg-green-50 rounded-md">
                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <User className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-gray-900">
                    {assignment.users?.name || 'Technicien'}
                  </span>
                  {assignment.users?.phone && (
                    <p className="text-xs text-gray-500">{assignment.users.phone}</p>
                  )}
                </div>
                <Badge className="bg-green-500 text-white text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Validé
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

             {/* Boutons d'action */}
       {assignments.length > 0 && (
         <div className="flex space-x-2">
           <Button
             variant="ghost"
             size="sm"
             onClick={() => setShowDetails(!showDetails)}
             className="flex-1 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
           >
             {showDetails ? 'Masquer les détails' : 'Voir tous les détails'}
           </Button>
           <Button
             variant="ghost"
             size="sm"
             onClick={() => onViewTechnicianDetails(mission)}
             className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
             title="Voir les détails complets des techniciens"
           >
             <Users className="h-3 w-3" />
           </Button>
         </div>
       )}

      {/* Détails complets des assignations */}
      {showDetails && assignments.length > 0 && (
        <div className="space-y-2 mt-2 p-2 bg-gray-50 rounded-md">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Détails des assignations</h4>
          
          {pendingAssignments.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-amber-700">En attente de réponse</span>
              {pendingAssignments.map((assignment: any) => (
                <div key={assignment.id} className="flex items-center space-x-2 p-1">
                  <div className="w-4 h-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                    <User className="h-2 w-2 text-white" />
                  </div>
                  <span className="text-xs text-gray-700">
                    {assignment.users?.name || 'Technicien'}
                  </span>
                  <Badge className="bg-amber-100 text-amber-800 text-xs">
                    En attente
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {refusedAssignments.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-red-700">Refusés</span>
              {refusedAssignments.map((assignment: any) => (
                <div key={assignment.id} className="flex items-center space-x-2 p-1">
                  <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <User className="h-2 w-2 text-white" />
                  </div>
                  <span className="text-xs text-gray-700">
                    {assignment.users?.name || 'Technicien'}
                  </span>
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    Refusé
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

AssignmentDetails.displayName = 'AssignmentDetails'

// Composant optimisé pour les cartes de missions en vue Kanban avec vue compacte par défaut
const MissionCard = memo(({ 
  mission, 
  onEdit, 
  onDelete, 
  onQuickAssign,
  onViewTechnicianDetails,
  deleteLoading 
}: {
  mission: MissionWithAssignments
  onEdit: (mission: Mission) => void
  onAssign: (mission: Mission) => void
  onDelete: (id: string) => void
  onQuickAssign: (mission: Mission) => void
  onViewTechnicianDetails: (mission: Mission) => void
  deleteLoading: string | null
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const missionStatus = useMemo(() => {
    if (!mission.mission_assignments?.length) return { status: 'non_assigné', color: 'bg-gray-500', icon: AlertCircle }
    
    // Filtrer les assignations non annulées
    const activeAssignments = mission.mission_assignments.filter((a: any) => !a.cancelled_by_admin)
    
    if (activeAssignments.length === 0) return { status: 'non_assigné', color: 'bg-gray-500', icon: AlertCircle }
    
    const acceptedCount = activeAssignments.filter((a: any) => a.status === 'accepté').length
    const refusedCount = activeAssignments.filter((a: any) => a.status === 'refusé').length
    const pendingCount = activeAssignments.filter((a: any) => a.status === 'proposé').length
    
    const requiredPeople = mission.required_people || 1
    const isComplete = acceptedCount >= requiredPeople
    
    if (isComplete) return { status: 'complet', color: 'bg-emerald-500', icon: CheckCircle }
    if (acceptedCount > 0) return { status: 'partiellement_assigné', color: 'bg-indigo-500', icon: Activity }
    if (refusedCount === activeAssignments.length) return { status: 'refusé', color: 'bg-red-500', icon: XCircle }
    if (pendingCount > 0) return { status: 'en_attente', color: 'bg-amber-500', icon: Clock }
    
    return { status: 'mixte', color: 'bg-blue-500', icon: Activity }
  }, [mission])

  const StatusIcon = missionStatus.icon
  const acceptedAssignments = mission.mission_assignments?.filter((a: any) => a.status === 'accepté' && !a.cancelled_by_admin) || []
  const requiredPeople = mission.required_people || 1

  return (
    <Card className="border border-gray-200 hover:border-indigo-200 transition-all duration-200 hover:shadow-md group">
      <CardContent className="p-3">
        {/* Vue compacte par défaut */}
        {!isExpanded ? (
          <div className="space-y-2">
            {/* En-tête compacte avec statut et bouton d'expansion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${missionStatus.color}`} />
                <Badge className={`${missionStatus.color} text-white text-xs px-2 py-0.5`}>
                  <StatusIcon className="h-2.5 w-2.5 mr-1" />
                  {missionStatus.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsExpanded(true)}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  title="Développer"
                >
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Titre et type */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-1" title={mission.title}>
                {mission.title}
              </h3>
              <div className="flex items-center justify-between mt-1">
                <Badge className={`${getMissionTypeColor(mission.type)} text-xs`}>
                  {mission.type}
                </Badge>
                <span className="text-xs font-bold text-emerald-600">{formatCurrency(mission.forfeit)}</span>
              </div>
            </div>

            {/* Informations essentielles */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3 text-indigo-500" />
                <span>{formatDateTimeUTC(mission.date_start)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3 text-blue-500" />
                <span>{acceptedAssignments.length}/{requiredPeople}</span>
              </div>
            </div>

            {/* Barre de progression compacte */}
            {mission.mission_assignments && mission.mission_assignments.length > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div
                  className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (acceptedAssignments.length / requiredPeople) * 100)}%`
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          /* Vue développée */
          <div className="space-y-3">
            {/* En-tête avec statut et actions */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${missionStatus.color}`} />
                <Badge className={`${missionStatus.color} text-white text-xs px-2 py-1`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {missionStatus.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsExpanded(false)}
                  className="h-7 w-7 p-0 hover:bg-gray-100"
                  title="Réduire"
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onViewTechnicianDetails(mission)}
                  className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                  title="Voir les techniciens assignés"
                >
                  <Users className="h-3 w-3" />
                </Button>
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
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">{mission.title}</h3>
              <Badge className={`${getMissionTypeColor(mission.type)} text-xs`}>
                {mission.type}
              </Badge>
            </div>

            {/* Date et lieu mis en avant */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs">
                <Calendar className="h-3 w-3 text-indigo-500" />
                <span className="font-medium text-gray-700">{formatDateTimeUTC(mission.date_start)}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-xs">
                <MapPin className="h-3 w-3 text-emerald-500" />
                <span className="font-medium text-gray-700 truncate" title={mission.location}>
                  {mission.location}
                </span>
              </div>
            </div>

            {/* Montant et techniciens */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-emerald-600">{formatCurrency(mission.forfeit)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Users className="h-3 w-3 text-blue-500" />
                <span className="text-xs text-gray-600">{requiredPeople} pers.</span>
              </div>
            </div>

            {/* Détails des assignations */}
            <AssignmentDetails mission={mission} onViewTechnicianDetails={onViewTechnicianDetails} />

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
          </div>
        )}
      </CardContent>
    </Card>
  )
})

MissionCard.displayName = 'MissionCard'

export function MissionsTab({
  searchQuery = '',
  selectedFilter = 'all',
  sortBy = 'date',
  viewMode = 'kanban',
  onSearchChange,
  onFilterChange,
  onSortChange,
  onViewModeChange
}: {
  searchQuery?: string
  selectedFilter?: string
  sortBy?: string
  viewMode?: 'kanban' | 'list' | 'grid'
  onSearchChange?: (query: string) => void
  onFilterChange?: (filter: string) => void
  onSortChange?: (sort: string) => void
  onViewModeChange?: (mode: 'kanban' | 'list' | 'grid') => void
} = {}) {

  const { missions, loading, stats, deleteAllMissions, createTestMissions } = useAdminStore()
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [missionToAssign, setMissionToAssign] = useState<Mission | null>(null)
  const [technicianDetailsOpen, setTechnicianDetailsOpen] = useState(false)
  const [missionForTechnicianDetails, setMissionForTechnicianDetails] = useState<Mission | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [deleteAllLoading, setDeleteAllLoading] = useState(false)
  const [createTestLoading, setCreateTestLoading] = useState(false)

  // Utiliser les props du dashboard ou les états locaux
  const searchTerm = searchQuery || ''
  const filterType = selectedFilter || 'all'
  const currentViewMode = viewMode || 'kanban'

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

  const handleViewTechnicianDetails = useCallback((mission: Mission) => {
    setMissionForTechnicianDetails(mission)
    setTechnicianDetailsOpen(true)
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
    onQuickAssign: handleQuickAssign,
    onViewTechnicianDetails: handleViewTechnicianDetails
  }), [handleEdit, handleAssignTechnicians, handleDelete, handleQuickAssign, handleViewTechnicianDetails])

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
      // Filtrer les assignations non annulées
      const activeAssignments = assignments.filter((a: any) => !a.cancelled_by_admin)
      const acceptedCount = activeAssignments.filter((a: any) => a.status === 'accepté').length
      const requiredPeople = mission.required_people || 1
      
      if (acceptedCount >= requiredPeople) {
        groups.complet.push(mission as MissionWithAssignments)
      } else if (acceptedCount > 0) {
        groups.partiellement_assigné.push(mission as MissionWithAssignments)
      } else if (activeAssignments.length > 0) {
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

      {/* Barre d'outils pour la recherche et les modes d'affichage */}
      <div className="bg-gray-50 p-4 rounded-lg mx-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher missions..."
                value={searchTerm}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
              />
            </div>
          </div>
          
          {/* Modes d'affichage */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onViewModeChange?.('kanban')}
              variant={currentViewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              className="h-8 px-3"
            >
              Prestations
            </Button>
            <Button
              onClick={() => onViewModeChange?.('list')}
              variant={currentViewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              className="h-8 px-3"
            >
              Liste
            </Button>
          </div>
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



      {/* Contenu des missions */}
      <div className="px-6">
        {filteredMissions.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">
              {searchTerm || filterType !== 'all' ? 'Aucune mission trouvée' : 'Aucune mission créée'}
            </p>
          </div>
        ) : currentViewMode === 'kanban' ? (
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
                      onViewTechnicianDetails={handlers.onViewTechnicianDetails}
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
                onViewTechnicianDetails={handlers.onViewTechnicianDetails}
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

      <TechnicianContactDialog
        mission={missionForTechnicianDetails}
        open={technicianDetailsOpen}
        onOpenChange={setTechnicianDetailsOpen}
        onAssignTechnicians={handleAssignTechnicians}
      />
    </div>
  )
}
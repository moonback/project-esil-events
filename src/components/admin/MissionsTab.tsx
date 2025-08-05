import { useState, useMemo, useCallback, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import { 
  Plus, Edit, Trash2, Users, UserPlus, Calendar, MapPin, 
  Clock, Search, CheckCircle, XCircle, AlertCircle,
  TrendingUp, Activity, X, Trash, Play,
  User, ArrowRight, Check, List} from 'lucide-react'
import { formatDateTime, formatCurrency, getMissionTypeColor, formatMissionTimeRange } from '@/lib/utils'
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
    <Card className="border border-gray-200 hover:border-indigo-200 transition-all duration-300 hover:shadow-lg group bg-gradient-to-br from-white to-gray-50/30">
      <CardContent className="p-4">
        {/* Vue compacte par défaut */}
        {!isExpanded ? (
          <div className="space-y-3">
            {/* En-tête compacte avec statut et bouton d'expansion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${missionStatus.color} shadow-sm`} />
                <Badge className={`${missionStatus.color} text-white text-xs px-3 py-1 font-medium`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {missionStatus.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsExpanded(true)}
                  className="h-8 w-8 p-0 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  title="Développer"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Titre et type avec design amélioré */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight" title={mission.title}>
                {mission.title}
              </h3>
              <div className="flex items-center justify-between">
                <Badge className={`${getMissionTypeColor(mission.type)} text-xs font-medium px-2 py-1`}>
                  {mission.type}
                </Badge>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  {formatCurrency(mission.forfeit)}
                </span>
              </div>
            </div>

            {/* Informations essentielles avec icônes améliorées */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                <Calendar className="h-3 w-3 text-blue-600" />
                <span className="font-medium text-blue-700">
                  {formatDateTimeUTC(mission.date_start)} - {formatDateTimeUTC(mission.date_end)}
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-lg">
                <Users className="h-3 w-3 text-indigo-600" />
                <span className="font-medium text-indigo-700">{acceptedAssignments.length}/{requiredPeople}</span>
              </div>
            </div>

            {/* Barre de progression compacte améliorée */}
            {mission.mission_assignments && mission.mission_assignments.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Progression</span>
                  <span className="font-medium">{Math.round((acceptedAssignments.length / requiredPeople) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(100, (acceptedAssignments.length / requiredPeople) * 100)}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Vue développée avec design amélioré */
          <div className="space-y-4">
            {/* En-tête avec statut et actions améliorées */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${missionStatus.color} shadow-md`} />
                <Badge className={`${missionStatus.color} text-white text-xs px-3 py-1.5 font-medium`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {missionStatus.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 p-0 hover:bg-white hover:shadow-sm transition-all"
                  title="Réduire"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onViewTechnicianDetails(mission)}
                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm transition-all"
                  title="Voir les techniciens assignés"
                >
                  <Users className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onQuickAssign(mission)}
                  className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-sm transition-all"
                  title="Assigner rapidement"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEdit(mission)}
                  className="h-8 w-8 p-0 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm transition-all"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDelete(mission.id)}
                  disabled={deleteLoading === mission.id}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:shadow-sm transition-all"
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

            {/* Titre et type avec design amélioré */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 leading-tight">{mission.title}</h3>
              <div className="flex items-center space-x-3">
                <Badge className={`${getMissionTypeColor(mission.type)} text-xs font-medium px-3 py-1.5`}>
                  {mission.type}
                </Badge>
                <span className="text-lg font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                  {formatCurrency(mission.forfeit)}
                </span>
              </div>
            </div>

            {/* Informations détaillées avec design moderne */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Date & Heure</span>
                </div>
                <p className="text-sm text-blue-800 mt-1 font-semibold">{formatMissionTimeRange(mission.date_start, mission.date_end)}</p>
              </div>
              
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Adresse</span>
                </div>
                <p className="text-sm text-emerald-800 mt-1 font-semibold" title={mission.location}>
                  {mission.location}
                </p>
                
              </div>
            </div>

            {/* Section techniciens avec design amélioré */}
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-700">Équipe requise</span>
                </div>
                <span className="text-sm font-bold text-indigo-800">{requiredPeople} personne(s)</span>
              </div>
              
              {/* Barre de progression améliorée */}
              {mission.mission_assignments && mission.mission_assignments.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-indigo-600">
                    <span>Progression de l'équipe</span>
                    <span className="font-bold">{Math.round((acceptedAssignments.length / requiredPeople) * 100)}%</span>
                  </div>
                  <div className="w-full bg-indigo-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-2.5 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(100, (acceptedAssignments.length / requiredPeople) * 100)}%`
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-indigo-600">
                    <span>{acceptedAssignments.length} accepté(s)</span>
                    <span>{requiredPeople - acceptedAssignments.length} restant(s)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Détails des assignations avec design amélioré */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <AssignmentDetails mission={mission} onViewTechnicianDetails={onViewTechnicianDetails} />
            </div>
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
      {/* En-tête moderne avec design amélioré */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span>Gestion des Missions</span>
            </h2>
            <p className="text-sm text-gray-600 flex items-center space-x-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span>{missionStats.total} missions au total</span>
              <span className="text-gray-400">•</span>
              <span className="text-emerald-600 font-medium">
                {missions.filter(m => {
                  const acceptedCount = m.mission_assignments?.filter((a: any) => a.status === 'accepté').length || 0
                  return acceptedCount >= (m.required_people || 1)
                }).length} complètes
              </span>
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Boutons d'action avec design moderne */}
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleDeleteAll}
                disabled={deleteAllLoading || missions.length === 0}
                size="sm"
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:shadow-md transition-all duration-200"
              >
                {deleteAllLoading ? (
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Trash className="h-4 w-4 mr-2" />
                )}
                Effacer tout
              </Button>
            </div>
            
            <Button 
              onClick={handleCreate} 
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle mission
            </Button>
          </div>
        </div>
      </div>

      {/* Barre d'outils moderne avec design amélioré */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mx-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Recherche avec design moderne */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher missions, lieux, types..."
                value={searchTerm}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all duration-200 w-72"
              />
            </div>
          </div>
          
          {/* Modes d'affichage avec design moderne */}
          <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-lg">
            <Button
              onClick={() => onViewModeChange?.('kanban')}
              variant={currentViewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 px-4 font-medium transition-all duration-200 ${
                currentViewMode === 'kanban' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'hover:bg-white hover:shadow-sm'
              }`}
            >
              <Activity className="h-4 w-4 mr-2" />
              Prestations
            </Button>
            <Button
              onClick={() => onViewModeChange?.('list')}
              variant={currentViewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 px-4 font-medium transition-all duration-200 ${
                currentViewMode === 'list' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'hover:bg-white hover:shadow-sm'
              }`}
            >
              <List className="h-4 w-4 mr-2" />
              Liste
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques modernes avec design amélioré */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-indigo-700">Total Missions</p>
              <p className="text-2xl font-bold text-indigo-900">{missionStats.total}</p>
              <p className="text-xs text-indigo-600">Toutes missions</p>
            </div>
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Activity className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-emerald-700">Complètes</p>
              <p className="text-2xl font-bold text-emerald-900">
                {missions.filter(m => {
                  const acceptedCount = m.mission_assignments?.filter((a: any) => a.status === 'accepté').length || 0
                  return acceptedCount >= (m.required_people || 1)
                }).length}
              </p>
              <p className="text-xs text-emerald-600">Équipes complètes</p>
            </div>
            <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-700">Revenus</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(missionStats.totalRevenue)}</p>
              <p className="text-xs text-blue-600">Chiffre d'affaires</p>
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-700">En attente</p>
              <p className="text-2xl font-bold text-amber-900">{missionStats.total - missionStats.assignedCount}</p>
              <p className="text-xs text-amber-600">À assigner</p>
            </div>
            <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center shadow-md">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>



      {/* Contenu des missions */}
      <div className="px-6">
        {filteredMissions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Activity className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchTerm || filterType !== 'all' ? 'Aucune mission trouvée' : 'Aucune mission créée'}
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              {searchTerm || filterType !== 'all' 
                ? 'Essayez de modifier vos critères de recherche ou de filtres'
                : 'Commencez par créer votre première mission pour organiser vos prestations'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <Button 
                onClick={handleCreate}
                className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer ma première mission
              </Button>
            )}
          </div>
        ) : currentViewMode === 'kanban' ? (
          /* Vue Kanban moderne */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {kanbanColumns.map((column) => (
              <div key={column.id} className="space-y-6">
                {/* En-tête de colonne avec design moderne */}
                <div className={`${column.color} ${column.textColor} px-6 py-4 rounded-xl shadow-sm border border-opacity-20`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${column.textColor.replace('text-', 'bg-')} shadow-sm`}></div>
                      <h3 className="font-bold text-sm">{column.title}</h3>
                    </div>
                    <div className="bg-white bg-opacity-60 px-3 py-1.5 rounded-full shadow-sm">
                      <span className="text-xs font-bold">{column.missions.length}</span>
                    </div>
                  </div>
                </div>
                
                {/* Contenu de la colonne avec espacement amélioré */}
                <div className="space-y-4 min-h-[400px]">
                  {column.missions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Activity className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Aucune mission</p>
                    </div>
                  ) : (
                    column.missions.map((mission) => (
                      <div key={mission.id} className="transform transition-all duration-200 hover:scale-105">
                        <MissionCard
                          mission={mission}
                          onEdit={handlers.onEdit}
                          onAssign={handlers.onAssign}
                          onDelete={handlers.onDelete}
                          onQuickAssign={handlers.onQuickAssign}
                          onViewTechnicianDetails={handlers.onViewTechnicianDetails}
                          deleteLoading={deleteLoading}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Vue Liste moderne */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMissions.map((mission) => (
              <div key={mission.id} className="transform transition-all duration-200 hover:scale-105">
                <MissionCard
                  mission={mission as MissionWithAssignments}
                  onEdit={handlers.onEdit}
                  onAssign={handlers.onAssign}
                  onDelete={handlers.onDelete}
                  onQuickAssign={handlers.onQuickAssign}
                  onViewTechnicianDetails={handlers.onViewTechnicianDetails}
                  deleteLoading={deleteLoading}
                />
              </div>
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
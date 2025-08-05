import React, { useState, useEffect, useRef } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { useToast } from '@/lib/useToast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  MapPin, 
  Euro, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Ban,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle2,
  Target,
  Wifi,
  WifiOff,
  RefreshCw,
  TrendingUp,
  Activity,
  Plus,
  Search,
  Filter,
  ArrowRight,
  X
} from 'lucide-react'
import { format, parseISO, addHours, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { MissionWithAssignments, User } from '@/types/database'
import { AssignTechniciansDialog } from './AssignTechniciansDialog'

export function MissionsWithAssignmentsTab() {
  const { missions, loading, fetchMissions, isConnected } = useAdminStore()
  const [cancellingMissions, setCancellingMissions] = useState<Set<string>>(new Set())
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedMission, setSelectedMission] = useState<MissionWithAssignments | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const { showSuccess, showError } = useToast()

  // Suppression du useEffect - AdminDashboard appelle déjà fetchAllData()

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

  const formatDateTimeUTC = (dateString: string): string => {
    try {
      const localDate = convertUTCToLocal(dateString)
      return format(parseISO(localDate), 'dd/MM/yyyy', { locale: fr })
    } catch {
      return 'Date invalide'
    }
  }

  const formatTimeUTC = (dateString: string): string => {
    try {
      const localDate = convertUTCToLocal(dateString)
      return format(parseISO(localDate), 'HH:mm', { locale: fr })
    } catch {
      return 'Heure invalide'
    }
  }

  const handleCancelPendingAssignments = async (missionId: string) => {
    try {
      setCancellingMissions(prev => new Set(prev).add(missionId))
      await useAdminStore.getState().cancelPendingAssignments(missionId)
      
      showSuccess(
        'Demandes annulées',
        'Les demandes en attente pour cette mission ont été annulées avec succès.'
      )
    } catch (error) {
      console.error('Erreur lors de l\'annulation des demandes:', error)
      showError(
        'Erreur',
        'Une erreur est survenue lors de l\'annulation des demandes.'
      )
    } finally {
      setCancellingMissions(prev => {
        const newSet = new Set(prev)
        newSet.delete(missionId)
        return newSet
      })
    }
  }

  const getAssignmentStatusBadge = (status: string) => {
    switch (status) {
      case 'accepté':
        return <Badge className="bg-green-100 text-green-800 text-xs font-medium"><CheckCircle className="h-3 w-3 mr-1" />Accepté</Badge>
      case 'refusé':
        return <Badge className="bg-red-100 text-red-800 text-xs font-medium"><XCircle className="h-3 w-3 mr-1" />Refusé</Badge>
      case 'proposé':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs font-medium"><Clock className="h-3 w-3 mr-1" />En attente</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>
    }
  }

  const getValidationBadge = (technician: User) => {
    if (technician.is_validated) {
      return <Badge className="bg-blue-100 text-blue-800 text-xs font-medium"><UserCheck className="h-3 w-3 mr-1" />Validé</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800 text-xs font-medium"><UserX className="h-3 w-3 mr-1" />Non validé</Badge>
  }

  const handleAssignTechnicians = (mission: MissionWithAssignments) => {
    setSelectedMission(mission)
    setAssignDialogOpen(true)
  }

  // Filtrer les missions
  const filteredMissions = missions.filter(mission => {
    const matchesSearch = mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.type.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === 'all') return matchesSearch
    
    const pendingAssignments = mission.mission_assignments?.filter((a: any) => a.status === 'proposé') || []
    const acceptedAssignments = mission.mission_assignments?.filter((a: any) => a.status === 'accepté') || []
    const validatedAcceptedAssignments = acceptedAssignments.filter((a: any) => a.users.is_validated)
    const hasEnoughValidatedTechnicians = validatedAcceptedAssignments.length >= mission.required_people
    
    switch (filterStatus) {
      case 'pending':
        return matchesSearch && pendingAssignments.length > 0
      case 'complete':
        return matchesSearch && hasEnoughValidatedTechnicians
      case 'incomplete':
        return matchesSearch && !hasEnoughValidatedTechnicians && acceptedAssignments.length > 0
      case 'unassigned':
        return matchesSearch && (!mission.mission_assignments || mission.mission_assignments.length === 0)
      default:
        return matchesSearch
    }
  })

  // Calculer les statistiques
  const stats = {
    total: missions.length,
    pending: missions.filter(m => {
      const pending = m.mission_assignments?.filter((a: any) => a.status === 'proposé') || []
      return pending.length > 0
    }).length,
    complete: missions.filter(m => {
      const accepted = m.mission_assignments?.filter((a: any) => a.status === 'accepté') || []
      const validated = accepted.filter((a: any) => a.users.is_validated)
      return validated.length >= m.required_people
    }).length,
    incomplete: missions.filter(m => {
      const accepted = m.mission_assignments?.filter((a: any) => a.status === 'accepté') || []
      const validated = accepted.filter((a: any) => a.users.is_validated)
      return validated.length > 0 && validated.length < m.required_people
    }).length
  }

  if (loading.missions) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600 font-medium">Chargement des missions...</p>
          <p className="text-xs text-gray-500">Synchronisation en cours</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* En-tête compact */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 px-6 py-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Missions et Assignations</h2>
              <div className="flex items-center space-x-3 text-xs text-gray-600">
                <span className="flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span>{stats.total} mission{stats.total > 1 ? 's' : ''}</span>
                </span>
                <span className="text-gray-400">•</span>
                <span className="flex items-center space-x-1 text-emerald-600 font-medium">
                  <CheckCircle className="h-3 w-3" />
                  <span>{stats.complete} complète{stats.complete > 1 ? 's' : ''}</span>
                </span>
                <span className="text-gray-400">•</span>
                <span className="flex items-center space-x-1 text-amber-600 font-medium">
                  <Clock className="h-3 w-3" />
                  <span>{stats.pending} en attente</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔄 Rafraîchissement manuel des missions')
                fetchMissions()
              }}
              disabled={loading.missions}
              className="bg-white/80 backdrop-blur-sm border-indigo-200 text-indigo-700 hover:bg-white hover:shadow-md transition-all duration-200 text-xs"
            >
              {loading.missions ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="ml-1">Actualiser</span>
            </Button>
            <Badge 
              variant="outline" 
              className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium ${
                isConnected 
                  ? 'bg-green-50 text-green-700 border-green-200' 
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {isConnected ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              <span>
                {isConnected ? 'Synchronisé' : 'Hors ligne'}
              </span>
            </Badge>
          </div>
        </div>
      </div>

      {/* Statistiques compactes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-indigo-700">Total</p>
              <p className="text-lg font-bold text-indigo-900">{stats.total}</p>
            </div>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <Target className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700">Complètes</p>
              <p className="text-lg font-bold text-emerald-900">{stats.complete}</p>
            </div>
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-700">En attente</p>
              <p className="text-lg font-bold text-amber-900">{stats.pending}</p>
            </div>
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center shadow-sm">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-700">Incomplètes</p>
              <p className="text-lg font-bold text-blue-900">{stats.incomplete}</p>
            </div>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <AlertCircle className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres compacte */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mx-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher missions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all duration-200 w-56"
              />
            </div>
          </div>
          
          {/* Filtres */}
          <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-md">
            <Button
              onClick={() => setFilterStatus('all')}
              variant={filterStatus === 'all' ? 'default' : 'ghost'}
              size="sm"
              className={`h-6 px-2 text-xs font-medium transition-all duration-200 ${
                filterStatus === 'all' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'hover:bg-white hover:shadow-sm'
              }`}
            >
              <Activity className="h-3 w-3 mr-1" />
              Toutes
            </Button>
            <Button
              onClick={() => setFilterStatus('pending')}
              variant={filterStatus === 'pending' ? 'default' : 'ghost'}
              size="sm"
              className={`h-6 px-2 text-xs font-medium transition-all duration-200 ${
                filterStatus === 'pending' 
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'hover:bg-white hover:shadow-sm'
              }`}
            >
              <Clock className="h-3 w-3 mr-1" />
              En attente
            </Button>
            <Button
              onClick={() => setFilterStatus('complete')}
              variant={filterStatus === 'complete' ? 'default' : 'ghost'}
              size="sm"
              className={`h-6 px-2 text-xs font-medium transition-all duration-200 ${
                filterStatus === 'complete' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'hover:bg-white hover:shadow-sm'
              }`}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Complètes
            </Button>
            <Button
              onClick={() => setFilterStatus('incomplete')}
              variant={filterStatus === 'incomplete' ? 'default' : 'ghost'}
              size="sm"
              className={`h-6 px-2 text-xs font-medium transition-all duration-200 ${
                filterStatus === 'incomplete' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'hover:bg-white hover:shadow-sm'
              }`}
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Partielles
            </Button>
          </div>
        </div>
      </div>

      {/* Liste des missions */}
      <div className="px-6">
        {filteredMissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <Target className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'Aucune mission trouvée' : 'Aucune mission créée'}
            </h3>
            <p className="text-gray-500 text-xs max-w-sm mx-auto mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Essayez de modifier vos critères de recherche ou de filtres'
                : 'Commencez par créer votre première mission pour organiser vos prestations'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Button 
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-3 w-3 mr-1" />
                Créer ma première mission
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMissions.map((mission) => {
              const pendingAssignments = mission.mission_assignments?.filter((a: any) => a.status === 'proposé') || []
              const acceptedAssignments = mission.mission_assignments?.filter((a: any) => a.status === 'accepté') || []
              const validatedAcceptedAssignments = acceptedAssignments.filter((a: any) => a.users.is_validated)
              const hasEnoughValidatedTechnicians = validatedAcceptedAssignments.length >= mission.required_people

                              return (
                  <Card key={mission.id} className={`border transition-all duration-200 shadow-sm hover:shadow-md ${
                    hasEnoughValidatedTechnicians 
                      ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50' 
                      : 'border-gray-200 bg-gradient-to-br from-white to-gray-50/30 hover:border-indigo-200'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-3">
                            <CardTitle className={`text-sm font-bold ${hasEnoughValidatedTechnicians ? 'text-emerald-700' : 'text-gray-900'}`}>
                              {mission.title}
                            </CardTitle>
                            <Badge className={`${
                              hasEnoughValidatedTechnicians 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                                : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200'
                            } text-xs font-medium px-2 py-0.5`}>
                              {mission.type}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center shadow-sm">
                                <MapPin className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-blue-900 line-clamp-2">{mission.location}</p>
                                <p className="text-xs text-blue-600">Localisation</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-md border border-green-100">
                              <div className="w-6 h-6 bg-green-600 rounded-md flex items-center justify-center shadow-sm">
                                <Calendar className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-green-900">{formatDateTimeUTC(mission.date_start)}</p>
                                <p className="text-xs text-green-600">
                                  {formatTimeUTC(mission.date_start)} - {formatTimeUTC(mission.date_end)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-md border border-yellow-100">
                              <div className="w-6 h-6 bg-yellow-600 rounded-md flex items-center justify-center shadow-sm">
                                <Euro className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-yellow-900">{mission.forfeit}€</p>
                                <p className="text-xs text-yellow-600">Forfait</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded-md border border-purple-100">
                              <div className="w-6 h-6 bg-purple-600 rounded-md flex items-center justify-center shadow-sm">
                                <Users className="h-3 w-3 text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-purple-900">{mission.required_people}</p>
                                <p className="text-xs text-purple-600">Personne{mission.required_people > 1 ? 's' : ''} requise{mission.required_people > 1 ? 's' : ''}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1 ml-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAssignTechnicians(mission)}
                            disabled={hasEnoughValidatedTechnicians}
                            className={`${
                              hasEnoughValidatedTechnicians 
                                ? 'bg-emerald-500 text-white cursor-not-allowed' 
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg'
                            } transition-all duration-200 text-xs px-2 py-1`}
                          >
                            <Users className="h-3 w-3 mr-1" />
                            {hasEnoughValidatedTechnicians ? 'Complet' : 'Assigner'}
                          </Button>
                          {pendingAssignments.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelPendingAssignments(mission.id)}
                              disabled={cancellingMissions.has(mission.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-all duration-200 text-xs px-2 py-1"
                            >
                              {cancellingMissions.has(mission.id) ? (
                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Ban className="h-3 w-3" />
                              )}
                              <span className="ml-1">Annuler</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  
                                      <CardContent className="pt-0">
                      {/* Statut des techniciens validés compact */}
                      <div className={`mb-3 p-3 rounded-lg border ${
                        hasEnoughValidatedTechnicians 
                          ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' 
                          : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {hasEnoughValidatedTechnicians ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                            )}
                            <span className="text-xs font-semibold text-gray-900">Techniciens validés</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-bold ${
                              hasEnoughValidatedTechnicians ? 'text-emerald-600' : 'text-orange-600'
                            }`}>
                              {validatedAcceptedAssignments.length} / {mission.required_people}
                            </span>
                            {hasEnoughValidatedTechnicians && (
                              <Badge className="bg-emerald-100 text-emerald-800 text-xs font-medium">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complet
                              </Badge>
                            )}
                          </div>
                        </div>
                        {!hasEnoughValidatedTechnicians && (
                          <p className="text-xs text-orange-600 mt-2 font-medium">
                            Il manque {mission.required_people - validatedAcceptedAssignments.length} technicien(s)
                          </p>
                        )}
                      </div>

                      {/* Liste des assignations compacte */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-gray-700 flex items-center space-x-1">
                            <Users className="h-3 w-3 text-indigo-600" />
                            <span>Assignations</span>
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {mission.mission_assignments?.length || 0}
                          </Badge>
                        </div>
                        
                        {mission.mission_assignments?.length === 0 ? (
                          <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <Users className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Aucune assignation</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {mission.mission_assignments?.map((assignment: any) => (
                              <div key={assignment.id} className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50 transition-all duration-200">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                    {assignment.users.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-gray-900">{assignment.users.name}</div>
                                    <div className="flex items-center space-x-1 mt-1">
                                      {getAssignmentStatusBadge(assignment.status)}
                                      {getValidationBadge(assignment.users)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {assignment.responded_at ? (
                                    <div className="text-xs text-gray-500">
                                      {assignment.cancelled_by_admin ? (
                                        <span className="text-orange-600 font-medium">
                                          Annulé
                                        </span>
                                      ) : (
                                        <span>
                                          Répondu
                                        </span>
                                      )}
                                    </div>
                                  ) : assignment.status === 'refusé' ? (
                                    <span className="text-xs text-orange-600 font-medium">
                                      Annulé
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Dialogue d'assignation de techniciens */}
      <AssignTechniciansDialog
        mission={selectedMission}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />
    </div>
  )
}  
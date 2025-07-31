import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { format, parseISO, isValid, startOfDay, endOfDay, addHours } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useMissionsStore } from '@/store/missionsStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getMissionTypeColor } from '@/lib/utils'
import { 
  Filter, 
  Search, 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  MapPin, 
  Euro,
  Eye,
  Edit,
  Trash2,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FilterX,
  Grid3X3,
  List,
  CalendarDays
} from 'lucide-react'
import type { MissionType, Mission, MissionWithAssignments, MissionAssignment } from '@/types/database'
import { MissionDialog } from './MissionDialog'
import { AssignTechniciansDialog } from './AssignTechniciansDialog'

// Mapping des couleurs typé
const missionTypeColors: Record<MissionType, string> = {
  'Livraison jeux': '#3B82F6',
  'Presta sono': '#10B981',
  'DJ': '#8B5CF6',
  'Manutention': '#F59E0B',
  'Déplacement': '#6B7280'
}

// Hook personnalisé pour les statistiques
const useMissionStats = (missions: MissionWithAssignments[]) => {
  return useMemo(() => {
    const totalMissions = missions.length
    const completedMissions = missions.filter(m => 
      m.mission_assignments.every((a: any) => a.status === 'accepté')
    ).length
    const pendingMissions = missions.filter(m => 
      m.mission_assignments.some((a: any) => a.status === 'proposé')
    ).length
    const totalRevenue = missions.reduce((sum, m) => sum + m.forfeit, 0)
    const avgRevenue = totalMissions > 0 ? totalRevenue / totalMissions : 0

    return {
      total: totalMissions,
      completed: completedMissions,
      pending: pendingMissions,
      revenue: totalRevenue,
      avgRevenue: avgRevenue
    }
  }, [missions])
}

// Hook personnalisé pour le filtrage
const useMissionFilters = (missions: MissionWithAssignments[]) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<MissionType[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  })

  const filteredMissions = useMemo(() => {
    return missions.filter(mission => {
      // Filtre par recherche
      if (searchTerm && !mission.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !mission.location.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Filtre par type
      if (selectedTypes.length > 0 && !selectedTypes.includes(mission.type)) {
        return false
      }

      // Filtre par statut
      if (selectedStatus.length > 0) {
        const missionStatus = mission.mission_assignments.length > 0 
          ? mission.mission_assignments.every((a: any) => a.status === 'accepté') ? 'completed'
          : mission.mission_assignments.some((a: any) => a.status === 'proposé') ? 'pending'
          : 'rejected'
          : 'unassigned'
        
        if (!selectedStatus.includes(missionStatus)) {
          return false
        }
      }

      // Filtre par date
      if (dateRange.start && isValid(parseISO(mission.date_start)) && 
          parseISO(mission.date_start) < dateRange.start) {
        return false
      }
      if (dateRange.end && isValid(parseISO(mission.date_end)) && 
          parseISO(mission.date_end) > dateRange.end) {
        return false
      }

      return true
    })
  }, [missions, searchTerm, selectedTypes, selectedStatus, dateRange])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setSelectedTypes([])
    setSelectedStatus([])
    setDateRange({ start: null, end: null })
  }, [])

  return {
    searchTerm,
    setSearchTerm,
    selectedTypes,
    setSelectedTypes,
    selectedStatus,
    setSelectedStatus,
    dateRange,
    setDateRange,
    filteredMissions,
    clearFilters
  }
}

export function AdminAgendaTab() {
  const { missions } = useMissionsStore()
  const missionsWithAssignments = missions as MissionWithAssignments[]
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showDetailedView, setShowDetailedView] = useState(false)
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth')
  const calendarRef = useRef<any>(null)
  
  // États pour les dialogs
  const [missionDialogOpen, setMissionDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [missionToAssign, setMissionToAssign] = useState<Mission | null>(null)

  const stats = useMissionStats(missionsWithAssignments)
  const {
    searchTerm,
    setSearchTerm,
    selectedTypes,
    setSelectedTypes,
    selectedStatus,
    setSelectedStatus,
    dateRange,
    setDateRange,
    filteredMissions,
    clearFilters
  } = useMissionFilters(missionsWithAssignments)

  // Transformer les missions en événements FullCalendar
  const events = useMemo(() => {
    return filteredMissions.map((mission) => {
      let startDate: Date
      let endDate: Date
      
      try {
        const startMoment = parseISO(mission.date_start)
        const endMoment = parseISO(mission.date_end)
        
        if (!isValid(startMoment) || !isValid(endMoment)) {
          console.error(`Dates invalides pour la mission ${mission.title}`)
          startDate = addHours(startOfDay(new Date()), 9)
          endDate = addHours(startOfDay(new Date()), 17)
        } else {
          startDate = startMoment
          endDate = endMoment
          
          // Si la date de fin est avant la date de début, ajuster
          if (endDate < startDate) {
            endDate = addHours(startDate, 2)
          }
        }
      } catch (error) {
        console.error(`Erreur parsing dates pour ${mission.title}:`, error)
        startDate = addHours(startOfDay(new Date()), 9)
        endDate = addHours(startOfDay(new Date()), 17)
      }
      
      const hasAssignments = mission.mission_assignments.length > 0
      const allAccepted = hasAssignments && mission.mission_assignments.every((a: any) => a.status === 'accepté')
      const hasPending = hasAssignments && mission.mission_assignments.some((a: any) => a.status === 'proposé')
      
      let backgroundColor = missionTypeColors[mission.type] || '#6B7280'
      let opacity = 1
      
      if (!hasAssignments) opacity = 0.6
      else if (allAccepted) opacity = 1
      else if (hasPending) opacity = 0.8
      
      return {
        id: mission.id,
        title: mission.title,
        start: startDate,
        end: endDate,
        backgroundColor: backgroundColor,
        borderColor: backgroundColor,
        textColor: '#ffffff',
        extendedProps: {
          mission: mission,
          hasAssignments,
          allAccepted,
          hasPending
        }
      }
    })
  }, [filteredMissions])

  const handleEventClick = useCallback((info: any) => {
    setSelectedEvent({
      resource: info.event.extendedProps.mission,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end
    })
  }, [])

  const handleDateSelect = useCallback((selectInfo: any) => {
    console.log('Nouvelle mission créée:', selectInfo)
    // Ici vous pouvez ouvrir un modal pour créer une nouvelle mission
  }, [])

  const toggleTypeFilter = useCallback((type: MissionType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }, [setSelectedTypes])

  const toggleStatusFilter = useCallback((status: string) => {
    setSelectedStatus(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }, [setSelectedStatus])

  // Gestionnaires pour les actions des détails de mission
  const handleEditMission = useCallback(() => {
    if (selectedEvent?.resource) {
      setSelectedMission(selectedEvent.resource)
      setMissionDialogOpen(true)
    }
  }, [selectedEvent])

  const handleAssignTechnicians = useCallback(() => {
    if (selectedEvent?.resource) {
      setMissionToAssign(selectedEvent.resource)
      setAssignDialogOpen(true)
    }
  }, [selectedEvent])

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Missions</p>
                <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Terminées</p>
                <p className="text-2xl font-bold text-green-800">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">En attente</p>
                <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Revenus</p>
                <p className="text-2xl font-bold text-purple-800">{stats.revenue}€</p>
              </div>
              <Euro className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-600 font-medium">Moyenne</p>
                <p className="text-2xl font-bold text-indigo-800">{Math.round(stats.avgRevenue)}€</p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre d'outils avec filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center flex-1">
              {/* Recherche */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une mission..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Bouton filtres */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtres
                {(selectedTypes.length > 0 || selectedStatus.length > 0 || dateRange.start || dateRange.end) && (
                  <Badge className="ml-1">{selectedTypes.length + selectedStatus.length + (dateRange.start ? 1 : 0) + (dateRange.end ? 1 : 0)}</Badge>
                )}
              </Button>

              {/* Actions rapides */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle mission
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDetailedView(!showDetailedView)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showDetailedView ? 'Vue calendrier' : 'Vue détaillée'}
                </Button>
              </div>
            </div>
          </div>

          {/* Panneau de filtres */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtres par type */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Types de missions</Label>
                  <div className="space-y-2">
                    {(Object.keys(missionTypeColors) as MissionType[]).map((type) => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={() => toggleTypeFilter(type)}
                          className="rounded"
                        />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Filtres par statut */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Statut</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'completed', label: 'Terminées', icon: CheckCircle },
                      { value: 'pending', label: 'En attente', icon: Clock },
                      { value: 'rejected', label: 'Refusées', icon: XCircle },
                      { value: 'unassigned', label: 'Non assignées', icon: AlertTriangle }
                    ].map(({ value, label, icon: Icon }) => (
                      <label key={value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStatus.includes(value)}
                          onChange={() => toggleStatusFilter(value)}
                          className="rounded"
                        />
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Filtres par date */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Période</Label>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Début</Label>
                      <Input
                        type="date"
                        value={dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fin</Label>
                      <Input
                        type="date"
                        value={dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions des filtres */}
                <div className="flex flex-col justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="flex items-center gap-2"
                  >
                    <FilterX className="h-4 w-4" />
                    Effacer les filtres
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {showDetailedView ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Liste détaillée des missions</span>
                  <Badge variant="secondary">
                    {filteredMissions.length} mission(s)
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredMissions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucune mission trouvée</p>
                      <p className="text-sm">Essayez de modifier vos filtres</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredMissions.map((mission) => {
                        const hasAssignments = mission.mission_assignments.length > 0
                        const allAccepted = hasAssignments && mission.mission_assignments.every((a: any) => a.status === 'accepté')
                        const hasPending = hasAssignments && mission.mission_assignments.some((a: any) => a.status === 'proposé')
                        const hasRejected = hasAssignments && mission.mission_assignments.some((a: any) => a.status === 'refusé')
                        
                        let statusColor = 'bg-gray-100 text-gray-800'
                        let statusText = 'Non assignée'
                        
                        if (allAccepted) {
                          statusColor = 'bg-green-100 text-green-800'
                          statusText = 'Terminée'
                        } else if (hasPending) {
                          statusColor = 'bg-yellow-100 text-yellow-800'
                          statusText = 'En attente'
                        } else if (hasRejected) {
                          statusColor = 'bg-red-100 text-red-800'
                          statusText = 'Refusée'
                        }

                        return (
                          <div 
                            key={mission.id} 
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedEvent({ resource: mission, title: mission.title, start: parseISO(mission.date_start), end: parseISO(mission.date_end) })}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-medium text-lg">{mission.title}</h4>
                                  <Badge className={getMissionTypeColor(mission.type)}>
                                    {mission.type}
                                  </Badge>
                                  <Badge className={statusColor}>
                                    {statusText}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{mission.location}</span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                      {format(parseISO(mission.date_start), 'dd/MM/yyyy HH:mm', { locale: fr })} - {format(parseISO(mission.date_end), 'HH:mm', { locale: fr })}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Euro className="h-4 w-4" />
                                    <span className="font-medium">{mission.forfeit}€</span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4" />
                                    <span className="font-medium">{mission.required_people || 1} pers.</span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4" />
                                    <span className="font-medium">{mission.required_people || 1} pers.</span>
                                  </div>
                                </div>

                                {mission.description && (
                                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                    {mission.description}
                                  </p>
                                )}

                                {hasAssignments && (
                                  <div className="mt-3">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <Users className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm font-medium">Techniciens assignés:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {mission.mission_assignments.map((assignment: any) => (
                                        <div key={assignment.id} className="flex items-center space-x-2 bg-gray-100 px-2 py-1 rounded text-xs">
                                          <span>{assignment.users.name}</span>
                                          <Badge className={
                                            assignment.status === 'accepté' ? 'bg-green-100 text-green-800' :
                                            assignment.status === 'refusé' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }>
                                            {assignment.status}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-4">
                                <Button size="sm" variant="outline">
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Users className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Calendrier des missions</span>
                                     <div className="flex items-center space-x-2">
                     <Button
                       variant={calendarView === 'dayGridMonth' ? 'default' : 'outline'}
                       size="sm"
                       onClick={() => setCalendarView('dayGridMonth')}
                     >
                       Mois
                     </Button>
                     <Button
                       variant={calendarView === 'timeGridWeek' ? 'default' : 'outline'}
                       size="sm"
                       onClick={() => setCalendarView('timeGridWeek')}
                     >
                       Semaine
                     </Button>
                     <Button
                       variant={calendarView === 'listWeek' ? 'default' : 'outline'}
                       size="sm"
                       onClick={() => setCalendarView('listWeek')}
                     >
                       Liste
                     </Button>
                   </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                                 <div style={{ height: '600px' }}>
                   <FullCalendar
                     key={calendarView}
                     ref={calendarRef}
                     plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                     headerToolbar={{
                       left: 'prev,next today',
                       center: 'title',
                       right: ''
                     }}
                     initialView={calendarView}
                     views={{
                       dayGridMonth: {
                         titleFormat: { year: 'numeric', month: 'long' },
                         dayMaxEvents: 3
                       },
                       timeGridWeek: {
                         titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
                         slotMinTime: '06:00:00',
                         slotMaxTime: '22:00:00',
                         slotDuration: '00:30:00',
                         allDaySlot: false
                       },
                       listWeek: {
                         titleFormat: { year: 'numeric', month: 'long' },
                         listDayFormat: { weekday: 'long', day: 'numeric', month: 'long' },
                         listDaySideFormat: { year: 'numeric', month: 'long', day: 'numeric' }
                       }
                     }}
                     locale="fr"
                     events={events}
                     eventClick={handleEventClick}
                     selectable={true}
                     select={handleDateSelect}
                     height="100%"
                     eventDisplay="block"
                     eventTimeFormat={{
                       hour: '2-digit',
                       minute: '2-digit',
                       meridiem: false,
                       hour12: false
                     }}
                     buttonText={{
                       today: 'Aujourd\'hui',
                       month: 'Mois',
                       week: 'Semaine',
                       day: 'Jour',
                       list: 'Liste'
                     }}
                     noEventsText="Aucune mission dans cette période"
                     eventDidMount={(info) => {
                       // Ajouter des tooltips personnalisés
                       const event = info.event
                       const mission = event.extendedProps.mission
                       if (mission) {
                         const tooltip = `
                           <div class="p-2">
                             <strong>${mission.title}</strong><br>
                             <small>${mission.type}</small><br>
                             <small>${mission.location}</small><br>
                             <small>${mission.forfeit}€</small>
                           </div>
                         `
                         info.el.title = tooltip
                       }
                     }}
                     viewDidMount={(info) => {
                       // Mettre à jour la vue actuelle quand elle change
                       setCalendarView(info.view.type as any)
                     }}
                   />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {/* Légende des types de missions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Types de missions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.keys(missionTypeColors) as MissionType[]).map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{
                        backgroundColor: missionTypeColors[type]
                      }}
                    />
                    <span className="text-sm">{type}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {filteredMissions.filter(m => m.type === type).length}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Détails de la mission sélectionnée */}
          {selectedEvent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Détails de la mission
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-lg">{selectedEvent.title}</h4>
                  <Badge className={getMissionTypeColor(selectedEvent.resource.type)}>
                    {selectedEvent.resource.type}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{selectedEvent.resource.location}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      {format(selectedEvent.start, 'dd/MM/yyyy HH:mm', { locale: fr })} - {format(selectedEvent.end, 'HH:mm', { locale: fr })}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Euro className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{selectedEvent.resource.forfeit}€</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{selectedEvent.resource.required_people || 1} personne(s) requise(s)</span>
                  </div>
                </div>

                {selectedEvent.resource.description && (
                  <div className="text-sm">
                    <strong>Description:</strong>
                    <p className="mt-1 text-gray-600">{selectedEvent.resource.description}</p>
                  </div>
                )}

                {selectedEvent.resource.mission_assignments.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <strong className="text-sm">Techniciens assignés:</strong>
                    </div>
                    <div className="space-y-2">
                      {selectedEvent.resource.mission_assignments.map((assignment: any) => (
                        <div key={assignment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{assignment.users.name}</span>
                          <Badge className={
                            assignment.status === 'accepté' ? 'bg-green-100 text-green-800' :
                            assignment.status === 'refusé' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {assignment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Aucun technicien assigné
                  </div>
                )}

                {/* Actions rapides */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" className="flex-1" onClick={handleEditMission}>
                    <Edit className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={handleAssignTechnicians}>
                    <Users className="h-3 w-3 mr-1" />
                    Assigner
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <MissionDialog
        mission={selectedMission}
        open={missionDialogOpen}
        onOpenChange={setMissionDialogOpen}
      />

      <AssignTechniciansDialog
        mission={missionToAssign}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />
    </div>
  )
}
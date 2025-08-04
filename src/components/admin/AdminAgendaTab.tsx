import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { format, parseISO, isValid, startOfDay, endOfDay, addHours } from 'date-fns'
import { fr } from 'date-fns/locale'

// Fonction utilitaire pour convertir les dates UTC en heure locale
const convertUTCToLocal = (dateString: string): Date => {
  const utcDate = parseISO(dateString)
  if (!isValid(utcDate)) {
    throw new Error('Date invalide')
  }
  return new Date(utcDate.getTime() + (utcDate.getTimezoneOffset() * 60000))
}
import { useAdminStore } from '@/store/adminStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DashboardCard } from '@/components/ui/dashboard-card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  CalendarDays,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  Ban,
  CheckCircle2,
  Clock4,
  Phone,
  Mail,
  MapPin as MapPinIcon
} from 'lucide-react'
import type { MissionType, Mission, MissionWithAssignments, MissionAssignment, User, Availability, Unavailability, TechnicianWithStats } from '@/types/database'
import { MissionDialog } from './MissionDialog'
import { AssignTechniciansDialog } from './AssignTechniciansDialog'
import { cn } from '@/lib/utils'

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
      if (searchTerm && !mission.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !mission.location.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      if (selectedTypes.length > 0 && !selectedTypes.includes(mission.type)) {
        return false
      }

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
  const { missions, technicians } = useAdminStore()
  const missionsWithAssignments = missions as MissionWithAssignments[]
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showDetailedView, setShowDetailedView] = useState(false)
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth')
  const calendarRef = useRef<any>(null)
  
  const [missionDialogOpen, setMissionDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [missionToAssign, setMissionToAssign] = useState<Mission | null>(null)
  
  // Nouveaux états pour les techniciens
  const [techniciansDialogOpen, setTechniciansDialogOpen] = useState(false)
  const [techniciansFilter, setTechniciansFilter] = useState<'all' | 'available' | 'unavailable'>('all')

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

  // Fonction pour déterminer le statut de disponibilité d'un technicien
  const getAvailabilityStatus = (technician: TechnicianWithStats) => {
    const now = new Date()
    const currentTime = now.getTime()
    
    // Vérifier d'abord s'il y a une indisponibilité actuelle
    const currentUnavailability = technician.unavailabilities?.find(unavail => {
      const start = parseISO(unavail.start_time)
      const end = parseISO(unavail.end_time)
      return currentTime >= start.getTime() && currentTime <= end.getTime()
    })
    
    if (currentUnavailability) {
      return {
        status: 'indisponible',
        text: 'Indisponible',
        color: 'bg-red-100 text-red-800',
        icon: Ban,
        reason: currentUnavailability.reason || 'Indisponible'
      }
    }
    
    // Vérifier s'il y a une disponibilité explicite actuelle
    const currentAvailability = technician.availabilities?.find(avail => {
      const start = parseISO(avail.start_time)
      const end = parseISO(avail.end_time)
      return currentTime >= start.getTime() && currentTime <= end.getTime()
    })
    
    if (currentAvailability) {
      return {
        status: 'disponible',
        text: 'Disponible',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle2,
        reason: 'Disponible maintenant'
      }
    }
    
    // Vérifier s'il y a une disponibilité future dans les prochaines 24h
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const futureAvailability = technician.availabilities?.find(avail => {
      const start = parseISO(avail.start_time)
      return start.getTime() <= tomorrow.getTime() && start.getTime() > currentTime
    })
    
    if (futureAvailability) {
      return {
        status: 'disponible_soon',
        text: 'Disponible bientôt',
        color: 'bg-blue-100 text-blue-800',
        icon: Clock4,
        reason: `Disponible le ${format(parseISO(futureAvailability.start_time), 'dd/MM à HH:mm', { locale: fr })}`
      }
    }
    
    // Si le technicien n'a pas de disponibilités explicites, il est "Disponible sur demande"
    return {
      status: 'available_on_request',
      text: 'Disponible sur demande',
      color: 'bg-yellow-100 text-yellow-800',
      icon: AlertTriangle,
      reason: 'Contactez le technicien pour vérifier sa disponibilité'
    }
  }

  // Filtrer les techniciens selon le filtre sélectionné
  const filteredTechnicians = useMemo(() => {
    return technicians.filter(tech => {
      if (techniciansFilter === 'all') return true
      
      const availabilityStatus = getAvailabilityStatus(tech)
      if (techniciansFilter === 'available') {
        return availabilityStatus.status === 'disponible' || availabilityStatus.status === 'disponible_soon' || availabilityStatus.status === 'available_on_request'
      }
      if (techniciansFilter === 'unavailable') {
        return availabilityStatus.status === 'indisponible'
      }
      
      return true
    })
  }, [technicians, techniciansFilter])

  const events = useMemo(() => {
    return filteredMissions.map((mission) => {
      let startDate: Date
      let endDate: Date
      
      try {
        // Conversion des dates UTC en heure locale
        startDate = parseISO(convertUTCToLocal(mission.date_start).toISOString())
        endDate = parseISO(convertUTCToLocal(mission.date_end).toISOString())
        
        if (endDate < startDate) {
          endDate = addHours(startDate, 2)
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
      {/* Barre d'outils responsive */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher une mission..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtres</span>
                {(selectedTypes.length > 0 || selectedStatus.length > 0 || dateRange.start || dateRange.end) && (
                  <Badge className="ml-1 text-xs">{selectedTypes.length + selectedStatus.length + (dateRange.start ? 1 : 0) + (dateRange.end ? 1 : 0)}</Badge>
                )}
              </Button>

              {!showDetailedView && (
                <div className="flex items-center space-x-1">
                  <Button
                    variant={calendarView === 'dayGridMonth' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCalendarView('dayGridMonth')}
                    className="hidden sm:flex"
                  >
                    <Grid3X3 className="h-4 w-4 mr-1" />
                    Mois
                  </Button>
                  <Button
                    variant={calendarView === 'timeGridWeek' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCalendarView('timeGridWeek')}
                    className="hidden sm:flex"
                  >
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Semaine
                  </Button>
                  <Button
                    variant={calendarView === 'listWeek' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCalendarView('listWeek')}
                    className="hidden sm:flex"
                  >
                    <List className="h-4 w-4 mr-1" />
                    Liste
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setTechniciansDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Techniciens</span>
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setShowDetailedView(!showDetailedView)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">{showDetailedView ? 'Calendrier' : 'Liste'}</span>
            </Button>
            {/* <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nouvelle mission</span>
            </Button> */}
          </div>
        </div>

        {/* Panneau de filtres responsive */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-medium mb-2 block">Types de missions</Label>
                <div className="space-y-1">
                  {(Object.keys(missionTypeColors) as MissionType[]).map((type) => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleTypeFilter(type)}
                        className="rounded"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium mb-2 block">Statut</Label>
                <div className="space-y-1">
                  {[
                    { value: 'completed', label: 'Terminées', icon: CheckCircle },
                    { value: 'pending', label: 'En attente', icon: Clock },
                    { value: 'rejected', label: 'Refusées', icon: XCircle },
                    { value: 'unassigned', label: 'Non assignées', icon: AlertTriangle }
                  ].map(({ value, label, icon: Icon }) => (
                    <label key={value} className="flex items-center space-x-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={selectedStatus.includes(value)}
                        onChange={() => toggleStatusFilter(value)}
                        className="rounded"
                      />
                      <Icon className="h-3 w-3" />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium mb-2 block">Période</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Début</Label>
                    <Input
                      type="date"
                      value={dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                      className="text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fin</Label>
                    <Input
                      type="date"
                      value={dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
                      className="text-xs h-8"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2 mt-2 w-full"
                >
                  <FilterX className="h-3 w-3" />
                  Effacer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Contenu principal responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {showDetailedView ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Liste des missions</span>
                  <Badge variant="secondary" className="text-xs">
                    {filteredMissions.length} mission(s)
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredMissions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Aucune mission trouvée</p>
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
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                  <h4 className="font-medium text-sm">{mission.title}</h4>
                                  <div className="flex flex-wrap gap-1">
                                    <Badge className={`${getMissionTypeColor(mission.type)} text-xs`}>
                                      {mission.type}
                                    </Badge>
                                    <Badge className={`${statusColor} text-xs`}>
                                      {statusText}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{mission.location}</span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {(() => {
                                        try {
                                          const startDate = parseISO(convertUTCToLocal(mission.date_start).toISOString())
                                          const endDate = parseISO(convertUTCToLocal(mission.date_end).toISOString())
                                          return `${format(startDate, 'dd/MM HH:mm', { locale: fr })} - ${format(endDate, 'HH:mm', { locale: fr })}`
                                        } catch (error) {
                                          return 'Heures non disponibles'
                                        }
                                      })()}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-1">
                                    <Euro className="h-3 w-3" />
                                    <span className="font-medium">{mission.forfeit}€</span>
                                  </div>
                                </div>

                                {hasAssignments && (
                                  <div className="mt-2">
                                    <div className="flex flex-wrap gap-1">
                                      {mission.mission_assignments.slice(0, 3).map((assignment: any) => (
                                        <div key={assignment.id} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs">
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
                                      {mission.mission_assignments.length > 3 && (
                                        <span className="text-xs text-gray-500">+{mission.mission_assignments.length - 3}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
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
              <CardContent className="p-4">
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
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Types de missions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {(Object.keys(missionTypeColors) as MissionType[]).map((type) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{
                        backgroundColor: missionTypeColors[type]
                      }}
                    />
                    <span className="text-xs">{type}</span>
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
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Détails de la mission
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
                    className="h-6 w-6 p-0"
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm">{selectedEvent.title}</h4>
                  <Badge className={`${getMissionTypeColor(selectedEvent.resource.type)} text-xs`}>
                    {selectedEvent.resource.type}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-3 w-3 text-gray-500" />
                    <span className="truncate">{selectedEvent.resource.location}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span>
                      {(() => {
                        try {
                          const startDate = parseISO(convertUTCToLocal(selectedEvent.resource.date_start).toISOString())
                          const endDate = parseISO(convertUTCToLocal(selectedEvent.resource.date_end).toISOString())
                          return `${format(startDate, 'dd/MM/yyyy HH:mm', { locale: fr })} - ${format(endDate, 'HH:mm', { locale: fr })}`
                        } catch (error) {
                          return 'Heures non disponibles'
                        }
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Euro className="h-3 w-3 text-gray-500" />
                    <span className="font-medium">{selectedEvent.resource.forfeit}€</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3 text-gray-500" />
                    <span className="font-medium">{selectedEvent.resource.required_people || 1} personne(s) requise(s)</span>
                  </div>
                </div>

                {selectedEvent.resource.description && (
                  <div className="text-xs">
                    <strong>Description:</strong>
                    <p className="mt-1 text-gray-600">{selectedEvent.resource.description}</p>
                  </div>
                )}

                {selectedEvent.resource.mission_assignments.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-3 w-3 text-gray-500" />
                      <strong className="text-xs">Techniciens assignés:</strong>
                    </div>
                    <div className="space-y-1">
                      {selectedEvent.resource.mission_assignments.map((assignment: any) => (
                        <div key={assignment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
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
                ) : (
                  <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    Aucun technicien assigné
                  </div>
                )}

                {/* Actions rapides */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" className="flex-1 text-xs" onClick={handleEditMission}>
                    <Edit className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={handleAssignTechnicians}>
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

      {/* Dialogue des techniciens */}
      <Dialog open={techniciansDialogOpen} onOpenChange={setTechniciansDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Statut des techniciens</span>
              <div className="flex items-center gap-2">
                <select
                  value={techniciansFilter}
                  onChange={(e) => setTechniciansFilter(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1"
                >
                  <option value="all">Tous</option>
                  <option value="available">Disponibles</option>
                  <option value="unavailable">Indisponibles</option>
                </select>
                <Badge variant="secondary" className="text-xs">
                  {filteredTechnicians.length} technicien{filteredTechnicians.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Statistiques rapides */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-600">Disponibles</p>
                    <p className="text-lg font-bold text-green-700">
                      {technicians.filter(tech => {
                        const status = getAvailabilityStatus(tech).status
                        return status === 'disponible' || status === 'disponible_soon' || status === 'available_on_request'
                      }).length}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-red-600">Indisponibles</p>
                    <p className="text-lg font-bold text-red-700">
                      {technicians.filter(tech => {
                        const status = getAvailabilityStatus(tech).status
                        return status === 'indisponible'
                      }).length}
                    </p>
                  </div>
                  <Ban className="h-5 w-5 text-red-600" />
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-600">Validés</p>
                    <p className="text-lg font-bold text-blue-700">
                      {technicians.filter(tech => tech.is_validated).length}
                    </p>
                  </div>
                  <UserCheck className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Récapitulatif des dates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Récapitulatif des dates</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Disponibilités futures
                    </Badge>
                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                      Indisponibilités futures
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Disponibilités futures */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                    Prochaines disponibilités
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      const now = new Date()
                      const allFutureAvailabilities = technicians.flatMap(tech => 
                        tech.availabilities?.filter(avail => parseISO(avail.start_time) > now).map(avail => ({
                          ...avail,
                          technicianName: tech.name,
                          technicianId: tech.id
                        })) || []
                      ).sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())
                      
                      return allFutureAvailabilities.length > 0 ? (
                        allFutureAvailabilities.slice(0, 10).map((availability) => (
                          <div key={`${availability.technicianId}-${availability.id}`} className="flex items-center justify-between p-2 bg-green-50 rounded text-xs">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-medium text-xs">
                                {availability.technicianName.charAt(0)}
                              </div>
                              <span className="font-medium">{availability.technicianName}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                Du {format(parseISO(availability.start_time), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </div>
                              <div className="text-green-600">
                                Au {format(parseISO(availability.end_time), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-xs p-2 bg-gray-50 rounded">
                          Aucune disponibilité future programmée
                        </div>
                      )
                    })()}
                    {(() => {
                      const now = new Date()
                      const allFutureAvailabilities = technicians.flatMap(tech => 
                        tech.availabilities?.filter(avail => parseISO(avail.start_time) > now) || []
                      )
                      return allFutureAvailabilities.length > 10 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{allFutureAvailabilities.length - 10} autres disponibilités futures
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Indisponibilités futures */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Ban className="h-4 w-4 mr-2 text-red-600" />
                    Prochaines indisponibilités
                  </h4>
                  <div className="space-y-2">
                    {(() => {
                      const now = new Date()
                      const allFutureUnavailabilities = technicians.flatMap(tech => 
                        tech.unavailabilities?.filter(unavail => parseISO(unavail.start_time) > now).map(unavail => ({
                          ...unavail,
                          technicianName: tech.name,
                          technicianId: tech.id
                        })) || []
                      ).sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())
                      
                      return allFutureUnavailabilities.length > 0 ? (
                        allFutureUnavailabilities.slice(0, 10).map((unavailability) => (
                          <div key={`${unavailability.technicianId}-${unavailability.id}`} className="flex items-center justify-between p-2 bg-red-50 rounded text-xs">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-700 font-medium text-xs">
                                {unavailability.technicianName.charAt(0)}
                              </div>
                              <span className="font-medium">{unavailability.technicianName}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                Du {format(parseISO(unavailability.start_time), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </div>
                              <div className="text-red-600">
                                Au {format(parseISO(unavailability.end_time), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </div>
                              {unavailability.reason && (
                                <div className="text-red-500 text-xs mt-1">
                                  Raison: {unavailability.reason}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-xs p-2 bg-gray-50 rounded">
                          Aucune indisponibilité future programmée
                        </div>
                      )
                    })()}
                    {(() => {
                      const now = new Date()
                      const allFutureUnavailabilities = technicians.flatMap(tech => 
                        tech.unavailabilities?.filter(unavail => parseISO(unavail.start_time) > now) || []
                      )
                      return allFutureUnavailabilities.length > 10 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{allFutureUnavailabilities.length - 10} autres indisponibilités futures
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Statistiques des dates */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {(() => {
                        const now = new Date()
                        return technicians.reduce((total, tech) => 
                          total + (tech.availabilities?.filter(avail => parseISO(avail.start_time) > now).length || 0), 0
                        )
                      })()}
                    </div>
                    <div className="text-xs text-gray-500">Disponibilités futures</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {(() => {
                        const now = new Date()
                        return technicians.reduce((total, tech) => 
                          total + (tech.unavailabilities?.filter(unavail => parseISO(unavail.start_time) > now).length || 0), 0
                        )
                      })()}
                    </div>
                    <div className="text-xs text-gray-500">Indisponibilités futures</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Liste des techniciens */}
            <div className="space-y-3">
              {filteredTechnicians.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">Aucun technicien trouvé</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTechnicians.map((technician) => {
                    const availabilityStatus = getAvailabilityStatus(technician)
                    const Icon = availabilityStatus.icon
                    
                    return (
                      <Card key={technician.id} className="border border-gray-200 hover:border-indigo-200 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              {/* En-tête du technicien */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                    {technician.name.charAt(0)}
                                  </div>
                                  <div>
                                    <h3 className="text-base font-semibold text-gray-900">{technician.name}</h3>
                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                      <Badge variant="secondary" className="text-xs">Technicien</Badge>
                                      {technician.is_validated && (
                                        <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                                          <UserCheck className="h-3 w-3 mr-1" />
                                          Validé
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <Badge className={availabilityStatus.color} title={availabilityStatus.reason}>
                                  <Icon className="h-3 w-3 mr-1" />
                                  {availabilityStatus.text}
                                </Badge>
                              </div>

                              {/* Informations de contact */}
                              <div className="space-y-2 text-xs text-gray-600">
                                {technician.phone && (
                                  <div className="flex items-center space-x-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{technician.phone}</span>
                                  </div>
                                )}
                                {technician.email && (
                                  <div className="flex items-center space-x-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{technician.email}</span>
                                  </div>
                                )}
                                {technician.address && (
                                  <div className="flex items-center space-x-1">
                                    <MapPinIcon className="h-3 w-3" />
                                    <span className="truncate">{technician.address}</span>
                                  </div>
                                )}
                              </div>

                              {/* Statistiques */}
                              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                                <div className="text-center">
                                  <div className="font-medium text-blue-600">{technician.stats?.totalAssignments || 0}</div>
                                  <div className="text-gray-500">Missions</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium text-green-600">{technician.stats?.totalRevenue || 0}€</div>
                                  <div className="text-gray-500">Revenus</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-medium text-orange-600">{technician.stats?.totalHours || 0}h</div>
                                  <div className="text-gray-500">Heures</div>
                                </div>
                              </div>

                              {/* Disponibilités futures */}
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-500">Prochaines disponibilités</span>
                                  <span className="font-medium">
                                    {(() => {
                                      const now = new Date()
                                      const futureAvailabilities = technician.availabilities?.filter(avail => 
                                        parseISO(avail.start_time) > now
                                      ) || []
                                      return futureAvailabilities.length
                                    })()}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {(() => {
                                    const now = new Date()
                                    const futureAvailabilities = technician.availabilities?.filter(avail => 
                                      parseISO(avail.start_time) > now
                                    ).slice(0, 2) || []
                                    
                                    return futureAvailabilities.length > 0 ? (
                                      futureAvailabilities.map((availability) => (
                                        <Badge key={availability.id} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                          {format(parseISO(availability.start_time), 'dd/MM', { locale: fr })}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-xs text-gray-500">Aucune disponibilité future</span>
                                    )
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { format, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatCurrency, getMissionTypeColor, getVehicleTypeIcon, getVehicleTypeLabel, getPriorityLevelColor, getPriorityLevelLabel } from '@/lib/utils'
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Euro, 
  Users, 
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit,
  XCircle,
  Eye,
  List,
  Grid3X3,
  CalendarDays,
  TrendingUp,
  Award
} from 'lucide-react'
import type { Mission, MissionAssignment } from '@/types/database'
import { VehicleDetailsDialog } from './VehicleDetailsDialog'

interface AcceptedMission extends MissionAssignment {
  missions: Mission
}

export function TechnicianAgendaTab() {
  const { user } = useAuthStore()
  const [acceptedMissions, setAcceptedMissions] = useState<AcceptedMission[]>([])
  const [availabilities, setAvailabilities] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [vehicleDetailsOpen, setVehicleDetailsOpen] = useState(false)
  const [selectedMissionForVehicle, setSelectedMissionForVehicle] = useState<Mission | null>(null)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Récupérer les missions acceptées
      const { data: assignments } = await supabase
        .from('mission_assignments')
        .select(`
          *,
          missions (*)
        `)
        .eq('technician_id', user.id)
        .eq('status', 'accepté')

      if (assignments) {
        setAcceptedMissions(assignments as AcceptedMission[])
      }

      // Récupérer les disponibilités
      const { data: availData } = await supabase
        .from('availability')
        .select('*')
        .eq('technician_id', user.id)
        .order('start_time')

      if (availData) {
        setAvailabilities(availData)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  // Créer les événements pour le calendrier avec FullCalendar
  const events = useMemo(() => {
    const missionEvents = acceptedMissions.map((assignment) => {
      let startDate: Date
      let endDate: Date
      
      try {
        const startMoment = parseISO(assignment.missions.date_start)
        const endMoment = parseISO(assignment.missions.date_end)
        
        if (!isValid(startMoment) || !isValid(endMoment)) {
          console.error(`Dates invalides pour la mission ${assignment.missions.title}`)
          startDate = new Date(assignment.missions.date_start) // Fallback to original date if invalid
          endDate = new Date(assignment.missions.date_end) // Fallback to original date if invalid
        } else {
          startDate = startMoment
          endDate = endMoment
          
          if (endDate < startDate) {
            endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // Add 2 hours if end date is before start date
          }
        }
      } catch (error) {
        console.error(`Erreur parsing dates pour ${assignment.missions.title}:`, error)
        startDate = new Date(assignment.missions.date_start) // Fallback to original date if error
        endDate = new Date(assignment.missions.date_end) // Fallback to original date if error
      }
      
      return {
        id: `mission-${assignment.id}`,
        title: assignment.missions.title,
        start: startDate,
        end: endDate,
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        textColor: '#ffffff',
        extendedProps: {
          type: 'mission',
          data: assignment
        }
      }
    })

    const availabilityEvents = availabilities.map((availability) => {
      let startDate: Date
      let endDate: Date
      
      try {
        const startMoment = parseISO(availability.start_time)
        const endMoment = parseISO(availability.end_time)
        
        if (!isValid(startMoment) || !isValid(endMoment)) {
          console.error(`Dates invalides pour la disponibilité ${availability.id}`)
          startDate = new Date(availability.start_time) // Fallback to original date if invalid
          endDate = new Date(availability.end_time) // Fallback to original date if invalid
        } else {
          startDate = startMoment
          endDate = endMoment
          
          if (endDate < startDate) {
            endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // Add 2 hours if end date is before start date
          }
        }
      } catch (error) {
        console.error(`Erreur parsing dates pour la disponibilité ${availability.id}:`, error)
        startDate = new Date(availability.start_time) // Fallback to original date if error
        endDate = new Date(availability.end_time) // Fallback to original date if error
      }
      
      return {
        id: `availability-${availability.id}`,
        title: 'Disponible',
        start: startDate,
        end: endDate,
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        textColor: '#ffffff',
        extendedProps: {
          type: 'availability',
          data: availability
        }
      }
    })

    return [...missionEvents, ...availabilityEvents]
  }, [acceptedMissions, availabilities])

  const handleEventClick = useCallback((info: any) => {
    const { type, assignment, availability } = info.event.extendedProps
    
    if (type === 'mission') {
      const missionDate = parseISO(assignment.missions.date_start)
      const endDate = parseISO(assignment.missions.date_end)
      
      setSelectedEvent({
        resource: assignment,
        title: assignment.missions.title,
        start: missionDate,
        end: endDate,
        type: 'mission'
      })
    } else if (type === 'availability') {
      setSelectedEvent({
        resource: availability,
        title: 'Disponibilité',
        start: parseISO(availability.start_time),
        end: parseISO(availability.end_time),
        type: 'availability'
      })
    }
  }, [])

  const handleMissionClick = useCallback((assignment: AcceptedMission) => {
    const missionDate = parseISO(assignment.missions.date_start)
    const endDate = parseISO(assignment.missions.date_end)
    
    setSelectedEvent({
      resource: assignment,
      title: assignment.missions.title,
      start: missionDate,
      end: endDate,
      type: 'mission'
    })
  }, [])

  const handleDateSelect = useCallback((selectInfo: any) => {
    console.log('Nouvelle disponibilité créée:', selectInfo)
    // Ici vous pouvez ouvrir un modal pour créer une nouvelle disponibilité
  }, [])

  const handleVehicleDetails = useCallback((mission: Mission) => {
    setSelectedMissionForVehicle(mission)
    setVehicleDetailsOpen(true)
  }, [])

  // Statistiques
  const stats = useMemo(() => {
    const totalMissions = acceptedMissions.length
    const totalRevenue = acceptedMissions.reduce((sum, assignment) => sum + assignment.missions.forfeit, 0)
    const upcomingMissions = acceptedMissions.filter(assignment => {
      const missionDate = parseISO(assignment.missions.date_start)
      return isValid(missionDate) && missionDate > new Date()
    }).length

    return { totalMissions, totalRevenue, upcomingMissions }
  }, [acceptedMissions])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos missions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mes Missions</h2>
          <p className="text-gray-600">Gérez vos missions acceptées et votre planning</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className={viewMode === 'calendar' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendrier
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}
          >
            <List className="h-4 w-4 mr-2" />
            Liste
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Missions acceptées</p>
                <p className="text-2xl font-bold text-blue-800">{stats.totalMissions}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Missions à venir</p>
                <p className="text-2xl font-bold text-green-800">{stats.upcomingMissions}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Revenus totaux</p>
                <p className="text-2xl font-bold text-purple-800">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Disponibilités</p>
                <p className="text-2xl font-bold text-orange-800">{availabilities.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Mon planning</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={calendarView === 'dayGridMonth' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCalendarView('dayGridMonth')}
                      className={calendarView === 'dayGridMonth' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}
                    >
                      Mois
                    </Button>
                    <Button
                      variant={calendarView === 'timeGridWeek' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCalendarView('timeGridWeek')}
                      className={calendarView === 'timeGridWeek' ? 'bg-indigo-600 hover:bg-indigo-700' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}
                    >
                      Semaine
                    </Button>
                    <Button
                      variant={calendarView === 'listWeek' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCalendarView('listWeek')}
                      className={calendarView === 'listWeek' ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-200 text-purple-600 hover:bg-purple-50'}
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
                    noEventsText="Aucun événement dans cette période"
                    eventDidMount={(info) => {
                      const event = info.event
                      const data = event.extendedProps.data
                      if (data) {
                        let tooltip = ''
                        if (event.extendedProps.type === 'mission') {
                          tooltip = `
                            <div class="p-2">
                              <strong>${data.missions.title}</strong><br>
                              <small>${data.missions.type}</small><br>
                              <small>${data.missions.location}</small><br>
                              <small>${data.missions.forfeit}€</small>
                            </div>
                          `
                        } else {
                          tooltip = `
                            <div class="p-2">
                              <strong>Disponible</strong><br>
                              <small>${format(parseISO(data.start_time), 'dd/MM/yyyy HH:mm', { locale: fr })} - ${format(parseISO(data.end_time), 'HH:mm', { locale: fr })}</small>
                            </div>
                          `
                        }
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
          </div>

          <div className="space-y-4">
            {/* Légende */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Légende</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span className="text-sm">Missions acceptées</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-sm">Disponibilités</span>
                </div>
              </CardContent>
            </Card>

            {/* Détails de l'événement sélectionné */}
            {selectedEvent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    Détails
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
                  {selectedEvent.type === 'mission' ? (
                    <>
                      <div>
                        <h4 className="font-medium text-lg">{selectedEvent.title}</h4>
                        <Badge className={getMissionTypeColor(selectedEvent.resource.missions.type)}>
                          {selectedEvent.resource.missions.type}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{selectedEvent.resource.missions.location}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>
                            {format(selectedEvent.start, 'dd/MM/yyyy HH:mm', { locale: fr })} - {format(selectedEvent.end, 'HH:mm', { locale: fr })}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm">
                          <Euro className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{selectedEvent.resource.missions.forfeit}€</span>
                        </div>
                      </div>

                      {selectedEvent.resource.missions.description && (
                        <div className="text-sm">
                          <strong>Description:</strong>
                          <p className="mt-1 text-gray-600">{selectedEvent.resource.missions.description}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t">
                        <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => handleMissionClick(selectedEvent.resource)}>
                          <Eye className="h-3 w-3 mr-1" />
                          Voir détails
                        </Button>
                        {selectedEvent.resource.missions.vehicle_required && selectedEvent.resource.missions.vehicle_type !== 'aucun' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-orange-200 text-orange-600 hover:bg-orange-50"
                            onClick={() => handleVehicleDetails(selectedEvent.resource.missions)}
                          >
                            <span className="text-lg mr-1">🚛</span>
                            Véhicule
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <h4 className="font-medium text-lg">Disponibilité</h4>
                        <Badge className="bg-green-100 text-green-800">
                          Disponible
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>
                            {format(selectedEvent.start, 'dd/MM/yyyy HH:mm', { locale: fr })} - {format(selectedEvent.end, 'HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button size="sm" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                          <Edit className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Vue liste des missions */
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mes missions acceptées</span>
                <Badge className="bg-blue-100 text-blue-700">
                  {acceptedMissions.length} mission{acceptedMissions.length > 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {acceptedMissions.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune mission acceptée pour le moment</p>
                  <p className="text-sm text-gray-400 mt-2">Consultez l'onglet "Missions Proposées" pour voir les nouvelles opportunités</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {acceptedMissions.map((assignment) => {
                    const missionDate = parseISO(assignment.missions.date_start)
                    const isUpcoming = isValid(missionDate) && missionDate > new Date()
                    
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-900">{assignment.missions.title}</h4>
                            <Badge className={getMissionTypeColor(assignment.missions.type)}>
                              {assignment.missions.type}
                            </Badge>
                            {isUpcoming && (
                              <Badge className="bg-green-100 text-green-700">
                                À venir
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{assignment.missions.location}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {format(missionDate, 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Euro className="h-4 w-4" />
                              <span className="font-medium">{assignment.missions.forfeit}€</span>
                            </div>
                          </div>

                          {/* Nouveaux champs dans la vue liste */}
                          {(assignment.missions.vehicle_required || assignment.missions.equipment_required || assignment.missions.contact_person) && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="flex flex-wrap gap-2 text-xs">
                                {assignment.missions.vehicle_required && (
                                  <div className="flex items-center space-x-1">
                                    <span>{getVehicleTypeIcon(assignment.missions.vehicle_type)}</span>
                                    <span>{getVehicleTypeLabel(assignment.missions.vehicle_type)}</span>
                                  </div>
                                )}
                                
                                {assignment.missions.equipment_required && (
                                  <div className="flex items-center space-x-1">
                                    <span>🛠️</span>
                                    <span>Équipement requis</span>
                                  </div>
                                )}
                                
                                {assignment.missions.contact_person && (
                                  <div className="flex items-center space-x-1">
                                    <span>👤</span>
                                    <span>Contact sur site</span>
                                  </div>
                                )}
                                
                                <Badge className={getPriorityLevelColor(assignment.missions.priority_level)}>
                                  {getPriorityLevelLabel(assignment.missions.priority_level)}
                                </Badge>
                                
                                {assignment.missions.weather_dependent && (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    🌤️ Météo
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => handleMissionClick(assignment)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          {assignment.missions.vehicle_required && assignment.missions.vehicle_type !== 'aucun' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-orange-200 text-orange-600 hover:bg-orange-50"
                              onClick={() => handleVehicleDetails(assignment.missions)}
                            >
                              <span className="text-lg">🚛</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Détails de la mission sélectionnée dans la vue liste */}
          {selectedEvent && selectedEvent.type === 'mission' && (
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
                  <Badge className={getMissionTypeColor(selectedEvent.resource.missions.type)}>
                    {selectedEvent.resource.missions.type}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{selectedEvent.resource.missions.location}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      {format(selectedEvent.start, 'dd/MM/yyyy HH:mm', { locale: fr })} - {format(selectedEvent.end, 'HH:mm', { locale: fr })}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Euro className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{selectedEvent.resource.missions.forfeit}€</span>
                  </div>

                  {/* Nouveaux champs */}
                  {selectedEvent.resource.missions.vehicle_required && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-lg">{getVehicleTypeIcon(selectedEvent.resource.missions.vehicle_type)}</span>
                      <span>{getVehicleTypeLabel(selectedEvent.resource.missions.vehicle_type)}</span>
                      {selectedEvent.resource.missions.vehicle_details && (
                        <span className="text-gray-500">- {selectedEvent.resource.missions.vehicle_details}</span>
                      )}
                    </div>
                  )}

                  {selectedEvent.resource.missions.equipment_required && (
                    <div className="flex items-start space-x-2 text-sm">
                      <span className="text-lg">🛠️</span>
                      <div>
                        <span className="font-medium">Équipement:</span>
                        <p className="text-gray-600 mt-1">{selectedEvent.resource.missions.equipment_required}</p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.resource.missions.contact_person && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-lg">👤</span>
                      <span>Contact: {selectedEvent.resource.missions.contact_person}</span>
                      {selectedEvent.resource.missions.contact_phone && (
                        <span className="text-gray-500">({selectedEvent.resource.missions.contact_phone})</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm">
                    <Badge className={getPriorityLevelColor(selectedEvent.resource.missions.priority_level)}>
                      {getPriorityLevelLabel(selectedEvent.resource.missions.priority_level)}
                    </Badge>
                    {selectedEvent.resource.missions.weather_dependent && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        🌤️ Dépendant météo
                      </Badge>
                    )}
                  </div>

                  {(selectedEvent.resource.missions.setup_time_minutes > 0 || selectedEvent.resource.missions.teardown_time_minutes > 0) && (
                    <div className="flex items-center space-x-4 text-sm">
                      {selectedEvent.resource.missions.setup_time_minutes > 0 && (
                        <span>⏱️ Montage: {selectedEvent.resource.missions.setup_time_minutes}min</span>
                      )}
                      {selectedEvent.resource.missions.teardown_time_minutes > 0 && (
                        <span>⏱️ Démontage: {selectedEvent.resource.missions.teardown_time_minutes}min</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Eye className="h-3 w-3 mr-1" />
                    Voir détails complets
                  </Button>
                  {selectedEvent.resource.missions.vehicle_required && selectedEvent.resource.missions.vehicle_type !== 'aucun' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      onClick={() => handleVehicleDetails(selectedEvent.resource.missions)}
                    >
                      <span className="text-lg mr-1">🚛</span>
                      Véhicule
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialogue des détails du véhicule */}
      {selectedMissionForVehicle && (
        <VehicleDetailsDialog
          mission={selectedMissionForVehicle}
          open={vehicleDetailsOpen}
          onOpenChange={setVehicleDetailsOpen}
        />
      )}
    </div>
  )
}
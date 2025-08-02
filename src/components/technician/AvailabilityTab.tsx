import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { format, parseISO, isValid, addHours, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEmailNotifications } from '@/lib/useEmailNotifications'
import { 
  Plus, 
  Trash2, 
  Clock, 
  Calendar as CalendarIcon, 
  XCircle, 
  AlertTriangle,
  CheckCircle,
  Ban
} from 'lucide-react'
import type { Availability, Unavailability } from '@/types/database'

export function AvailabilityTab() {
  const profile = useAuthStore(state => state.profile)
  const { sendAvailabilityUpdatedEmail, sendUnavailabilityCreatedEmail } = useEmailNotifications()
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>([])
  const [loading, setLoading] = useState(false)
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false)
  const [showUnavailabilityForm, setShowUnavailabilityForm] = useState(false)
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth')
  const [activeTab, setActiveTab] = useState<'availability' | 'unavailability'>('availability')
  const calendarRef = useRef<any>(null)
  
  const [availabilityFormData, setAvailabilityFormData] = useState({
    start_time: '',
    end_time: ''
  })
  
  const [unavailabilityFormData, setUnavailabilityFormData] = useState({
    start_time: '',
    end_time: '',
    reason: ''
  })

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    if (!profile) return

    try {
      // Récupérer les disponibilités
      const { data: availabilitiesData, error: availError } = await supabase
        .from('availability')
        .select('*')
        .eq('technician_id', profile.id)
        .order('start_time')

      if (availError) throw availError

      // Récupérer les indisponibilités
      const { data: unavailabilitiesData, error: unavailError } = await supabase
        .from('unavailability')
        .select('*')
        .eq('technician_id', profile.id)
        .order('start_time')

      if (unavailError) throw unavailError

      setAvailabilities(availabilitiesData || [])
      setUnavailabilities(unavailabilitiesData || [])
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  const createAvailability = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    try {
      // Vérifier les conflits avec les indisponibilités
      const hasConflict = await checkTimeConflict(
        availabilityFormData.start_time,
        availabilityFormData.end_time,
        'availability'
      )

      if (hasConflict) {
        alert('Cette période entre en conflit avec une indisponibilité existante.')
        return
      }

      const { error } = await supabase
        .from('availability')
        .insert([{
          technician_id: profile.id,
          start_time: availabilityFormData.start_time,
          end_time: availabilityFormData.end_time
        }])

      if (error) throw error

      // Envoyer l'email de notification
      const newAvailabilities = availabilities.length + 1
      await sendAvailabilityUpdatedEmail(profile, newAvailabilities)

      setAvailabilityFormData({ start_time: '', end_time: '' })
      setShowAvailabilityForm(false)
      fetchData()
    } catch (error) {
      console.error('Erreur lors de la création de la disponibilité:', error)
    } finally {
      setLoading(false)
    }
  }

  const createUnavailability = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    try {
      // Vérifier les conflits avec les disponibilités
      const hasConflict = await checkTimeConflict(
        unavailabilityFormData.start_time,
        unavailabilityFormData.end_time,
        'unavailability'
      )

      if (hasConflict) {
        alert('Cette période entre en conflit avec une disponibilité existante.')
        return
      }

      const { error } = await supabase
        .from('unavailability')
        .insert([{
          technician_id: profile.id,
          start_time: unavailabilityFormData.start_time,
          end_time: unavailabilityFormData.end_time,
          reason: unavailabilityFormData.reason || null
        }])

      if (error) throw error

      // Envoyer l'email de notification
      const newUnavailabilities = unavailabilities.length + 1
      await sendUnavailabilityCreatedEmail(profile, newUnavailabilities)

      setUnavailabilityFormData({ start_time: '', end_time: '', reason: '' })
      setShowUnavailabilityForm(false)
      fetchData()
    } catch (error) {
      console.error('Erreur lors de la création de l\'indisponibilité:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkTimeConflict = async (startTime: string, endTime: string, type: 'availability' | 'unavailability') => {
    const start = parseISO(startTime)
    const end = parseISO(endTime)
    
    if (type === 'availability') {
      // Vérifier les conflits avec les indisponibilités
      return unavailabilities.some(unavail => {
        const unavailStart = parseISO(unavail.start_time)
        const unavailEnd = parseISO(unavail.end_time)
        return (start < unavailEnd && end > unavailStart)
      })
    } else {
      // Vérifier les conflits avec les disponibilités
      return availabilities.some(avail => {
        const availStart = parseISO(avail.start_time)
        const availEnd = parseISO(avail.end_time)
        return (start < availEnd && end > availStart)
      })
    }
  }

  const deleteAvailability = async (id: string) => {
    if (!confirm('Supprimer cette disponibilité ?')) return

    try {
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('id', id)

      if (error) throw error

      fetchData()
    } catch (error) {
      console.error('Erreur lors de la suppression de la disponibilité:', error)
    }
  }

  const deleteUnavailability = async (id: string) => {
    if (!confirm('Supprimer cette indisponibilité ?')) return

    try {
      const { error } = await supabase
        .from('unavailability')
        .delete()
        .eq('id', id)

      if (error) throw error

      fetchData()
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'indisponibilité:', error)
    }
  }

  // Transformer les données en événements FullCalendar
  const events = useMemo(() => {
    const availabilityEvents = availabilities.map((availability) => {
      let startDate: Date
      let endDate: Date
      
      try {
        const startMoment = parseISO(availability.start_time)
        const endMoment = parseISO(availability.end_time)
        
        if (!isValid(startMoment) || !isValid(endMoment)) {
          console.error(`Dates invalides pour la disponibilité ${availability.id}`)
          startDate = addHours(startOfDay(new Date()), 9)
          endDate = addHours(startOfDay(new Date()), 17)
        } else {
          startDate = startMoment
          endDate = endMoment
          
          if (endDate < startDate) {
            endDate = addHours(startDate, 2)
          }
        }
      } catch (error) {
        console.error(`Erreur parsing dates pour la disponibilité ${availability.id}:`, error)
        startDate = addHours(startOfDay(new Date()), 9)
        endDate = addHours(startOfDay(new Date()), 17)
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

    const unavailabilityEvents = unavailabilities.map((unavailability) => {
      let startDate: Date
      let endDate: Date
      
      try {
        const startMoment = parseISO(unavailability.start_time)
        const endMoment = parseISO(unavailability.end_time)
        
        if (!isValid(startMoment) || !isValid(endMoment)) {
          console.error(`Dates invalides pour l'indisponibilité ${unavailability.id}`)
          startDate = addHours(startOfDay(new Date()), 9)
          endDate = addHours(startOfDay(new Date()), 17)
        } else {
          startDate = startMoment
          endDate = endMoment
          
          if (endDate < startDate) {
            endDate = addHours(startDate, 2)
          }
        }
      } catch (error) {
        console.error(`Erreur parsing dates pour l'indisponibilité ${unavailability.id}:`, error)
        startDate = addHours(startOfDay(new Date()), 9)
        endDate = addHours(startOfDay(new Date()), 17)
      }
      
      return {
        id: `unavailability-${unavailability.id}`,
        title: unavailability.reason || 'Indisponible',
        start: startDate,
        end: endDate,
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
        textColor: '#ffffff',
        extendedProps: {
          type: 'unavailability',
          data: unavailability
        }
      }
    })

    return [...availabilityEvents, ...unavailabilityEvents]
  }, [availabilities, unavailabilities])

  const handleDateSelect = useCallback((selectInfo: any) => {
    const start = format(selectInfo.start, 'yyyy-MM-dd\'T\'HH:mm')
    const end = format(selectInfo.end, 'yyyy-MM-dd\'T\'HH:mm')
    
    if (activeTab === 'availability') {
      setAvailabilityFormData({
        start_time: start,
        end_time: end
      })
      setShowAvailabilityForm(true)
    } else {
      setUnavailabilityFormData({
        start_time: start,
        end_time: end,
        reason: ''
      })
      setShowUnavailabilityForm(true)
    }
  }, [activeTab])

  const getStats = () => {
    const totalAvailabilityHours = availabilities.reduce((total, availability) => {
      const start = parseISO(availability.start_time)
      const end = parseISO(availability.end_time)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return total + hours
    }, 0)

    const totalUnavailabilityHours = unavailabilities.reduce((total, unavailability) => {
      const start = parseISO(unavailability.start_time)
      const end = parseISO(unavailability.end_time)
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      return total + hours
    }, 0)

    return {
      availabilityCount: availabilities.length,
      unavailabilityCount: unavailabilities.length,
      totalAvailabilityHours: totalAvailabilityHours.toFixed(1),
      totalUnavailabilityHours: totalUnavailabilityHours.toFixed(1)
    }
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-green-600 font-medium">Disponibilités</p>
                <p className="text-lg md:text-2xl font-bold text-green-800">{stats.availabilityCount}</p>
                <p className="text-xs text-green-600">{stats.totalAvailabilityHours}h</p>
              </div>
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-red-600 font-medium">Indisponibilités</p>
                <p className="text-lg md:text-2xl font-bold text-red-800">{stats.unavailabilityCount}</p>
                <p className="text-xs text-red-600">{stats.totalUnavailabilityHours}h</p>
              </div>
              <Ban className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-blue-600 font-medium">Ce mois</p>
                <p className="text-lg md:text-2xl font-bold text-blue-800">
                  {availabilities.filter(a => {
                    const start = parseISO(a.start_time)
                    const now = new Date()
                    return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
              <CalendarIcon className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-purple-600 font-medium">Taux de disponibilité</p>
                <p className="text-lg md:text-2xl font-bold text-purple-800">
                  {stats.availabilityCount + stats.unavailabilityCount > 0 
                    ? Math.round((stats.availabilityCount / (stats.availabilityCount + stats.unavailabilityCount)) * 100)
                    : 0}%
                </p>
              </div>
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'availability' | 'unavailability')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Disponibilités
          </TabsTrigger>
          <TabsTrigger value="unavailability" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Indisponibilités
          </TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <span className="text-lg md:text-xl">Mes disponibilités</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant={calendarView === 'dayGridMonth' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCalendarView('dayGridMonth')}
                          className="text-xs px-2 py-1"
                        >
                          Mois
                        </Button>
                        <Button
                          variant={calendarView === 'timeGridWeek' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCalendarView('timeGridWeek')}
                          className="text-xs px-2 py-1"
                        >
                          Semaine
                        </Button>
                        <Button
                          variant={calendarView === 'listWeek' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCalendarView('listWeek')}
                          className="text-xs px-2 py-1"
                        >
                          Liste
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAvailabilityForm(true)}
                        className="text-xs px-3 py-1"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-6">
                  <div style={{ height: '400px', minHeight: '400px' }} className="md:h-[600px]">
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
                      noEventsText="Aucune disponibilité dans cette période"
                      eventDidMount={(info) => {
                        const event = info.event
                        const data = event.extendedProps.data
                        if (data) {
                          const tooltip = `
                            <div class="p-2">
                              <strong>${event.title}</strong><br>
                              <small>${format(parseISO(data.start_time), 'dd/MM/yyyy HH:mm', { locale: fr })} - ${format(parseISO(data.end_time), 'HH:mm', { locale: fr })}</small>
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
            </div>

            <div className="space-y-4">
              {/* Formulaire d'ajout de disponibilité */}
              {showAvailabilityForm && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      Ajouter une disponibilité
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAvailabilityForm(false)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createAvailability} className="space-y-4">
                      <div>
                        <Label htmlFor="availability_start_time">Début</Label>
                        <Input
                          id="availability_start_time"
                          type="datetime-local"
                          value={availabilityFormData.start_time}
                          onChange={(e) => setAvailabilityFormData(prev => ({ ...prev, start_time: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="availability_end_time">Fin</Label>
                        <Input
                          id="availability_end_time"
                          type="datetime-local"
                          value={availabilityFormData.end_time}
                          onChange={(e) => setAvailabilityFormData(prev => ({ ...prev, end_time: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Création...' : 'Ajouter'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Liste des disponibilités */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Disponibilités récentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {availabilities.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Aucune disponibilité
                    </p>
                  ) : (
                    availabilities.slice(0, 5).map((availability) => (
                      <div key={availability.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <div className="text-sm">
                          <div className="font-medium">
                            {format(parseISO(availability.start_time), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                          <div className="text-gray-600">
                            {format(parseISO(availability.start_time), 'HH:mm', { locale: fr })} - {format(parseISO(availability.end_time), 'HH:mm', { locale: fr })}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAvailability(availability.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="unavailability" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Mes indisponibilités</span>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowUnavailabilityForm(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
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
                      noEventsText="Aucune indisponibilité dans cette période"
                      eventDidMount={(info) => {
                        const event = info.event
                        const data = event.extendedProps.data
                        if (data) {
                          const tooltip = `
                            <div class="p-2">
                              <strong>${event.title}</strong><br>
                              <small>${format(parseISO(data.start_time), 'dd/MM/yyyy HH:mm', { locale: fr })} - ${format(parseISO(data.end_time), 'HH:mm', { locale: fr })}</small>
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
            </div>

            <div className="space-y-4">
              {/* Formulaire d'ajout d'indisponibilité */}
              {showUnavailabilityForm && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      Ajouter une indisponibilité
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowUnavailabilityForm(false)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={createUnavailability} className="space-y-4">
                      <div>
                        <Label htmlFor="unavailability_start_time">Début</Label>
                        <Input
                          id="unavailability_start_time"
                          type="datetime-local"
                          value={unavailabilityFormData.start_time}
                          onChange={(e) => setUnavailabilityFormData(prev => ({ ...prev, start_time: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="unavailability_end_time">Fin</Label>
                        <Input
                          id="unavailability_end_time"
                          type="datetime-local"
                          value={unavailabilityFormData.end_time}
                          onChange={(e) => setUnavailabilityFormData(prev => ({ ...prev, end_time: e.target.value }))}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="unavailability_reason">Raison (optionnel)</Label>
                        <Textarea
                          id="unavailability_reason"
                          value={unavailabilityFormData.reason}
                          onChange={(e) => setUnavailabilityFormData(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="Ex: Congés, Formation, Rendez-vous médical..."
                          rows={3}
                        />
                      </div>
                      
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Création...' : 'Ajouter'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Liste des indisponibilités */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Indisponibilités récentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {unavailabilities.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Aucune indisponibilité
                    </p>
                  ) : (
                    unavailabilities.slice(0, 5).map((unavailability) => (
                      <div key={unavailability.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <div className="text-sm">
                          <div className="font-medium">
                            {format(parseISO(unavailability.start_time), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                          <div className="text-gray-600">
                            {format(parseISO(unavailability.start_time), 'HH:mm', { locale: fr })} - {format(parseISO(unavailability.end_time), 'HH:mm', { locale: fr })}
                          </div>
                          {unavailability.reason && (
                            <div className="text-xs text-red-600 mt-1">
                              {unavailability.reason}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUnavailability(unavailability.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
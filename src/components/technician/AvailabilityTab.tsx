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
import { Plus, Trash2, Clock, Calendar as CalendarIcon, XCircle } from 'lucide-react'
import type { Availability } from '@/types/database'

export function AvailabilityTab() {
  const profile = useAuthStore(state => state.profile)
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth')
  const calendarRef = useRef<any>(null)
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: ''
  })

  useEffect(() => {
    if (profile) {
      fetchAvailabilities()
    }
  }, [profile])

  const fetchAvailabilities = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('technician_id', profile.id)
        .order('start_time')

      if (error) throw error

      setAvailabilities(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des disponibilités:', error)
    }
  }

  const createAvailability = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('availability')
        .insert([{
          technician_id: profile.id,
          start_time: formData.start_time,
          end_time: formData.end_time
        }])

      if (error) throw error

      setFormData({ start_time: '', end_time: '' })
      setShowForm(false)
      fetchAvailabilities()
    } catch (error) {
      console.error('Erreur lors de la création de la disponibilité:', error)
    } finally {
      setLoading(false)
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

      fetchAvailabilities()
    } catch (error) {
      console.error('Erreur lors de la suppression de la disponibilité:', error)
    }
  }

  // Transformer les disponibilités en événements FullCalendar
  const events = useMemo(() => {
    return availabilities.map((availability) => {
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
        id: availability.id,
        title: 'Disponible',
        start: startDate,
        end: endDate,
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        textColor: '#ffffff',
        extendedProps: {
          data: availability
        }
      }
    })
  }, [availabilities])

  const handleDateSelect = useCallback((selectInfo: any) => {
    const start = format(selectInfo.start, 'yyyy-MM-dd\'T\'HH:mm')
    const end = format(selectInfo.end, 'yyyy-MM-dd\'T\'HH:mm')
    
    setFormData({
      start_time: start,
      end_time: end
    })
    setShowForm(true)
  }, [])

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Disponibilités</p>
                <p className="text-2xl font-bold text-green-800">{availabilities.length}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Ce mois</p>
                <p className="text-2xl font-bold text-blue-800">
                  {availabilities.filter(a => {
                    const start = parseISO(a.start_time)
                    const now = new Date()
                    return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Heures totales</p>
                <p className="text-2xl font-bold text-purple-800">
                  {availabilities.reduce((total, availability) => {
                    const start = parseISO(availability.start_time)
                    const end = parseISO(availability.end_time)
                    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                    return total + hours
                  }, 0).toFixed(1)}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Mes disponibilités</span>
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
                    onClick={() => setShowForm(true)}
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
                     noEventsText="Aucune disponibilité dans cette période"
                     eventDidMount={(info) => {
                       const event = info.event
                       const data = event.extendedProps.data
                       if (data) {
                         const tooltip = `
                           <div class="p-2">
                             <strong>Disponible</strong><br>
                             <small>${format(parseISO(data.start_time), 'dd/MM/yyyy HH:mm', { locale: fr })} - ${format(parseISO(data.end_time), 'HH:mm', { locale: fr })}</small>
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
        </div>

        <div className="space-y-4">
          {/* Formulaire d'ajout */}
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Ajouter une disponibilité
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForm(false)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createAvailability} className="space-y-4">
                  <div>
                    <Label htmlFor="start_time">Début</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="end_time">Fin</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
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
                  <div key={availability.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
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
    </div>
  )
}
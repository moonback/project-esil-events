import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/fr'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import type { Availability } from '@/types/database'

moment.locale('fr')
const localizer = momentLocalizer(moment)

const messages = {
  allDay: 'Toute la journée',
  previous: 'Précédent',
  next: 'Suivant',
  today: 'Aujourd\'hui',
  month: 'Mois',
  week: 'Semaine',
  day: 'Jour',
  agenda: 'Agenda',
  date: 'Date',
  time: 'Heure',
  event: 'Disponibilité',
  noEventsInRange: 'Aucune disponibilité dans cette période.',
}

export function AvailabilityTab() {
  const profile = useAuthStore(state => state.profile)
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
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
      console.error('Erreur lors de la suppression:', error)
    }
  }

  // Transformer les disponibilités en événements pour le calendrier
  const events = availabilities.map((availability) => ({
    id: availability.id,
    title: 'Disponible',
    start: new Date(availability.start_time),
    end: new Date(availability.end_time),
    resource: availability
  }))

  const eventStyleGetter = () => ({
    style: {
      backgroundColor: '#10B981',
      borderColor: '#10B981',
      color: 'white'
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Mes Disponibilités</h3>
          <p className="text-gray-600">Gérez vos créneaux de disponibilité</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Ajouter une disponibilité</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div style={{ height: '500px' }}>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  messages={messages}
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={(event) => {
                    if (confirm('Supprimer cette disponibilité ?')) {
                      deleteAvailability(event.id)
                    }
                  }}
                  views={['month', 'week', 'day']}
                  defaultView="week"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Liste des disponibilités */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prochaines disponibilités</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {availabilities
                .filter(av => new Date(av.start_time) > new Date())
                .slice(0, 5)
                .map((availability) => (
                  <div key={availability.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div className="text-sm">
                      <p className="font-medium">
                        {moment(availability.start_time).format('DD/MM')}
                      </p>
                      <p className="text-gray-600">
                        {moment(availability.start_time).format('HH:mm')} - {moment(availability.end_time).format('HH:mm')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAvailability(availability.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              
              {availabilities.filter(av => new Date(av.start_time) > new Date()).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucune disponibilité future
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nouvelle Disponibilité</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createAvailability} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Début</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">Fin</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Ajout...' : 'Ajouter'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
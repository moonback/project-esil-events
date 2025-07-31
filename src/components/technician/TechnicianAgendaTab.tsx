import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/fr'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatCurrency, getMissionTypeColor } from '@/lib/utils'
import type { Mission, MissionAssignment, Availability } from '@/types/database'

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
  event: 'Événement',
  noEventsInRange: 'Aucun événement dans cette période.',
}

interface AcceptedMission extends MissionAssignment {
  missions: Mission
}

export function TechnicianAgendaTab() {
  const profile = useAuthStore(state => state.profile)
  const [acceptedMissions, setAcceptedMissions] = useState<AcceptedMission[]>([])
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    if (!profile) return

    try {
      // Récupérer les missions acceptées
      const { data: missionsData } = await supabase
        .from('mission_assignments')
        .select(`
          *,
          missions (*)
        `)
        .eq('technician_id', profile.id)
        .eq('status', 'accepté')

      // Récupérer les disponibilités
      const { data: availabilitiesData } = await supabase
        .from('availability')
        .select('*')
        .eq('technician_id', profile.id)

      setAcceptedMissions(missionsData as AcceptedMission[] || [])
      setAvailabilities(availabilitiesData || [])
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  // Créer les événements pour le calendrier
  const events = [
    // Missions acceptées
    ...acceptedMissions.map((assignment) => ({
      id: `mission-${assignment.id}`,
      title: assignment.missions.title,
      start: new Date(assignment.missions.date_start),
      end: new Date(assignment.missions.date_end),
      resource: {
        type: 'mission',
        data: assignment
      }
    })),
    // Disponibilités
    ...availabilities.map((availability) => ({
      id: `availability-${availability.id}`,
      title: 'Disponible',
      start: new Date(availability.start_time),
      end: new Date(availability.end_time),
      resource: {
        type: 'availability',
        data: availability
      }
    }))
  ]

  // Style des événements
  const eventStyleGetter = (event: any) => {
    if (event.resource.type === 'mission') {
      const mission = event.resource.data.missions
      const baseColor = {
        'Livraison jeux': '#3B82F6',
        'Presta sono': '#10B981',
        'DJ': '#8B5CF6',
        'Manutention': '#F59E0B',
        'Déplacement': '#6B7280'
      }[mission.type] || '#6B7280'

      return {
        style: {
          backgroundColor: baseColor,
          borderColor: baseColor,
          color: 'white',
          fontWeight: 'bold'
        }
      }
    } else {
      // Disponibilité
      return {
        style: {
          backgroundColor: '#10B981',
          borderColor: '#10B981',
          color: 'white',
          opacity: 0.7
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Chargement de votre agenda...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Mon Agenda</h3>
        <p className="text-gray-600">
          Vue d'ensemble de vos missions acceptées et disponibilités
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div style={{ height: '600px' }}>
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  messages={messages}
                  eventPropGetter={eventStyleGetter}
                  onSelectEvent={(event) => setSelectedEvent(event)}
                  views={['month', 'week', 'day', 'agenda']}
                  defaultView="week"
                  popup
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
                <div className="w-3 h-3 rounded bg-green-500 opacity-70" />
                <span className="text-sm">Disponibilités</span>
              </div>
              {['Livraison jeux', 'Presta sono', 'DJ', 'Manutention', 'Déplacement'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{
                      backgroundColor: {
                        'Livraison jeux': '#3B82F6',
                        'Presta sono': '#10B981',
                        'DJ': '#8B5CF6',
                        'Manutention': '#F59E0B',
                        'Déplacement': '#6B7280'
                      }[type]
                    }}
                  />
                  <span className="text-sm">{type}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Détails de l'événement sélectionné */}
          {selectedEvent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedEvent.resource.type === 'mission' ? 'Mission' : 'Disponibilité'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedEvent.resource.type === 'mission' ? (
                  <>
                    <div>
                      <h4 className="font-medium">{selectedEvent.title}</h4>
                      <Badge className={getMissionTypeColor(selectedEvent.resource.data.missions.type)}>
                        {selectedEvent.resource.data.missions.type}
                      </Badge>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <p><strong>Lieu:</strong> {selectedEvent.resource.data.missions.location}</p>
                      <p><strong>Début:</strong> {formatDateTime(selectedEvent.resource.data.missions.date_start)}</p>
                      <p><strong>Fin:</strong> {formatDateTime(selectedEvent.resource.data.missions.date_end)}</p>
                      <p><strong>Rémunération:</strong> {formatCurrency(selectedEvent.resource.data.missions.forfeit)}</p>
                    </div>

                    {selectedEvent.resource.data.missions.description && (
                      <div className="text-sm">
                        <strong>Description:</strong>
                        <p className="mt-1 text-gray-600">{selectedEvent.resource.data.missions.description}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm space-y-1">
                    <p><strong>Période de disponibilité</strong></p>
                    <p>Début: {formatDateTime(selectedEvent.resource.data.start_time)}</p>
                    <p>Fin: {formatDateTime(selectedEvent.resource.data.end_time)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Prochaines missions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prochaines missions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {acceptedMissions
                .filter(assignment => new Date(assignment.missions.date_start) > new Date())
                .slice(0, 3)
                .map((assignment) => (
                  <div key={assignment.id} className="p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-sm">{assignment.missions.title}</h5>
                    <p className="text-xs text-gray-600 mt-1">
                      {moment(assignment.missions.date_start).format('DD/MM/YYYY HH:mm')}
                    </p>
                    <p className="text-xs font-medium text-green-600 mt-1">
                      {formatCurrency(assignment.missions.forfeit)}
                    </p>
                  </div>
                ))}
              
              {acceptedMissions.filter(assignment => new Date(assignment.missions.date_start) > new Date()).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Aucune mission à venir
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
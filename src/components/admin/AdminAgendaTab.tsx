import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'moment/locale/fr'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useMissionsStore } from '@/store/missionsStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getMissionTypeColor } from '@/lib/utils'
import type { MissionType, Mission } from '@/types/database'

// Configuration moment en français
moment.locale('fr')
const localizer = momentLocalizer(moment)

// Messages en français pour le calendrier
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
  noEventsInRange: 'Aucune mission dans cette période.',
  showMore: (total: number) => `+ ${total} mission(s) supplémentaire(s)`
}

// Mapping des couleurs typé
const missionTypeColors: Record<MissionType, string> = {
  'Livraison jeux': '#3B82F6',
  'Presta sono': '#10B981',
  'DJ': '#8B5CF6',
  'Manutention': '#F59E0B',
  'Déplacement': '#6B7280'
}

export function AdminAgendaTab() {
  const { missions } = useMissionsStore()
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  // Transformer les missions en événements pour le calendrier
  const events = missions.map((mission) => ({
    id: mission.id,
    title: mission.title,
    start: new Date(mission.date_start),
    end: new Date(mission.date_end),
    resource: mission
  }))

  // Style personnalisé pour les événements
  const eventStyleGetter = (event: any) => {
    const mission = event.resource as Mission
    const baseColor = missionTypeColors[mission.type] || '#6B7280'

    return {
      style: {
        backgroundColor: baseColor,
        borderColor: baseColor,
        color: 'white',
        border: 'none',
        borderRadius: '4px'
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Planning des Missions</h3>
        <p className="text-gray-600">Vue d'ensemble de toutes vos missions</p>
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
                  onSelectEvent={(event: any) => setSelectedEvent(event)}
                  views={['month', 'week', 'day', 'agenda']}
                  defaultView="month"
                  popup
                  tooltipAccessor="title"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Légende des types de missions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Types de missions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.keys(missionTypeColors) as MissionType[]).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{
                      backgroundColor: missionTypeColors[type]
                    }}
                  />
                  <span className="text-sm">{type}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Détails de la mission sélectionnée */}
          {selectedEvent && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Détails de la mission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium">{selectedEvent.title}</h4>
                  <Badge className={getMissionTypeColor(selectedEvent.resource.type)}>
                    {selectedEvent.resource.type}
                  </Badge>
                </div>
                
                <div className="text-sm space-y-1">
                  <p><strong>Lieu:</strong> {selectedEvent.resource.location}</p>
                  <p><strong>Début:</strong> {moment(selectedEvent.start).format('DD/MM/YYYY HH:mm')}</p>
                  <p><strong>Fin:</strong> {moment(selectedEvent.end).format('DD/MM/YYYY HH:mm')}</p>
                  <p><strong>Forfait:</strong> {selectedEvent.resource.forfeit}€</p>
                </div>

                {selectedEvent.resource.description && (
                  <div className="text-sm">
                    <strong>Description:</strong>
                    <p className="mt-1 text-gray-600">{selectedEvent.resource.description}</p>
                  </div>
                )}

                {selectedEvent.resource.mission_assignments.length > 0 && (
                  <div className="text-sm">
                    <strong>Techniciens assignés:</strong>
                    <div className="mt-1 space-y-1">
                      {selectedEvent.resource.mission_assignments.map((assignment: any) => (
                        <div key={assignment.id} className="flex items-center justify-between">
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
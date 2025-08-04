import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, XCircle, Clock, Ban } from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { User, Availability, Unavailability } from '@/types/database'

interface TechnicianAvailabilityCalendarProps {
  technician: User & {
    availabilities: Availability[]
    unavailabilities: Unavailability[]
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TechnicianAvailabilityCalendar({ 
  technician, 
  open, 
  onOpenChange 
}: TechnicianAvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Générer le calendrier pour le mois actuel
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }, [currentDate])

  // Grouper les disponibilités et indisponibilités par date
  const availabilityByDate = useMemo(() => {
    const grouped: Record<string, { availabilities: Availability[], unavailabilities: Unavailability[] }> = {}
    
    // Traiter les disponibilités
    technician.availabilities?.forEach(availability => {
      const startDate = parseISO(availability.start_time)
      const endDate = parseISO(availability.end_time)
      
      // Ajouter pour chaque jour de la période
      const current = new Date(startDate)
      while (current <= endDate) {
        const dateKey = current.toDateString()
        if (!grouped[dateKey]) {
          grouped[dateKey] = { availabilities: [], unavailabilities: [] }
        }
        grouped[dateKey].availabilities.push(availability)
        current.setDate(current.getDate() + 1)
      }
    })
    
    // Traiter les indisponibilités
    technician.unavailabilities?.forEach(unavailability => {
      const startDate = parseISO(unavailability.start_time)
      const endDate = parseISO(unavailability.end_time)
      
      // Ajouter pour chaque jour de la période
      const current = new Date(startDate)
      while (current <= endDate) {
        const dateKey = current.toDateString()
        if (!grouped[dateKey]) {
          grouped[dateKey] = { availabilities: [], unavailabilities: [] }
        }
        grouped[dateKey].unavailabilities.push(unavailability)
        current.setDate(current.getDate() + 1)
      }
    })
    
    return grouped
  }, [technician.availabilities, technician.unavailabilities])

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && 
           date.getFullYear() === currentDate.getFullYear()
  }

  const getDayStatus = (date: Date) => {
    const dateKey = date.toDateString()
    const dayData = availabilityByDate[dateKey]
    
    if (!dayData) {
      return { type: 'none', text: '', color: '' }
    }
    
    const { availabilities, unavailabilities } = dayData
    
    // Si il y a des indisponibilités, priorité aux indisponibilités
    if (unavailabilities.length > 0) {
      return { 
        type: 'unavailable', 
        text: `${unavailabilities.length} indisponibilité${unavailabilities.length > 1 ? 's' : ''}`,
        color: 'bg-red-100 text-red-800 border-red-200'
      }
    }
    
    // Si il y a des disponibilités
    if (availabilities.length > 0) {
      return { 
        type: 'available', 
        text: `${availabilities.length} disponibilité${availabilities.length > 1 ? 's' : ''}`,
        color: 'bg-green-100 text-green-800 border-green-200'
      }
    }
    
    return { type: 'none', text: '', color: '' }
  }

  const getDayDetails = (date: Date) => {
    const dateKey = date.toDateString()
    const dayData = availabilityByDate[dateKey]
    
    if (!dayData) return null
    
    const { availabilities, unavailabilities } = dayData
    
    return {
      availabilities: availabilities.map(avail => ({
        start: format(parseISO(avail.start_time), 'HH:mm', { locale: fr }),
        end: format(parseISO(avail.end_time), 'HH:mm', { locale: fr })
      })),
      unavailabilities: unavailabilities.map(unavail => ({
        start: format(parseISO(unavail.start_time), 'HH:mm', { locale: fr }),
        end: format(parseISO(unavail.end_time), 'HH:mm', { locale: fr }),
        reason: unavail.reason
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Calendrier de disponibilités - {technician.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Navigation du calendrier */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            
            <h3 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </h3>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Légende */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span>Disponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span>Indisponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
              <span>Aucune information</span>
            </div>
          </div>

          {/* Calendrier */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1">
                {/* En-têtes des jours */}
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                
                {/* Jours du calendrier */}
                {calendarDays.map((date, index) => {
                  const status = getDayStatus(date)
                  const details = getDayDetails(date)
                  
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[80px] p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors
                        ${isToday(date) ? 'ring-2 ring-blue-500' : ''}
                        ${!isCurrentMonth(date) ? 'text-gray-300' : ''}
                        ${status.color}
                      `}
                      title={details ? 
                        `Disponibilités: ${details.availabilities.length}, Indisponibilités: ${details.unavailabilities.length}` : 
                        'Aucune information de disponibilité'
                      }
                    >
                      <div className="text-sm font-medium mb-1">
                        {format(date, 'd')}
                      </div>
                      
                      {details && (
                        <div className="space-y-1">
                          {details.availabilities.length > 0 && (
                            <div className="text-xs">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              {details.availabilities.length} dispo.
                            </div>
                          )}
                          {details.unavailabilities.length > 0 && (
                            <div className="text-xs">
                              <XCircle className="h-3 w-3 inline mr-1" />
                              {details.unavailabilities.length} indispo.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Détails des disponibilités et indisponibilités */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Disponibilités */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Disponibilités ({technician.availabilities?.length || 0})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {technician.availabilities && technician.availabilities.length > 0 ? (
                    technician.availabilities.map((availability) => {
                      const startDate = parseISO(availability.start_time)
                      const endDate = parseISO(availability.end_time)
                      const isCurrent = new Date() >= startDate && new Date() <= endDate
                      
                      return (
                        <div key={availability.id} className={`p-2 rounded text-xs ${
                          isCurrent ? 'bg-green-100 border border-green-200' : 'bg-gray-50'
                        }`}>
                          <div className="font-medium">
                            {format(startDate, 'dd/MM/yyyy HH:mm', { locale: fr })} - 
                            {format(endDate, 'HH:mm', { locale: fr })}
                          </div>
                          {isCurrent && (
                            <div className="text-green-700 mt-1">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Disponible maintenant
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-gray-500 text-xs">Aucune disponibilité programmée</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Indisponibilités */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>Indisponibilités ({technician.unavailabilities?.length || 0})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {technician.unavailabilities && technician.unavailabilities.length > 0 ? (
                    technician.unavailabilities.map((unavailability) => {
                      const startDate = parseISO(unavailability.start_time)
                      const endDate = parseISO(unavailability.end_time)
                      const isCurrent = new Date() >= startDate && new Date() <= endDate
                      
                      return (
                        <div key={unavailability.id} className={`p-2 rounded text-xs ${
                          isCurrent ? 'bg-red-100 border border-red-200' : 'bg-gray-50'
                        }`}>
                          <div className="font-medium">
                            {format(startDate, 'dd/MM/yyyy HH:mm', { locale: fr })} - 
                            {format(endDate, 'HH:mm', { locale: fr })}
                          </div>
                          {unavailability.reason && (
                            <div className="text-gray-600 mt-1">
                              <Ban className="h-3 w-3 inline mr-1" />
                              {unavailability.reason}
                            </div>
                          )}
                          {isCurrent && (
                            <div className="text-red-700 mt-1">
                              <XCircle className="h-3 w-3 inline mr-1" />
                              Indisponible maintenant
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-gray-500 text-xs">Aucune indisponibilité programmée</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
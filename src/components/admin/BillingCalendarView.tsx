import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import type { BillingWithDetails } from '@/types/database'
import { parseISO, isValid } from 'date-fns'

interface BillingCalendarViewProps {
  billings: BillingWithDetails[]
  onBillingClick?: (billing: BillingWithDetails) => void
}

export function BillingCalendarView({ billings, onBillingClick }: BillingCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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

  // Grouper les facturations par date
  const billingsByDate = useMemo(() => {
    const grouped: Record<string, BillingWithDetails[]> = {}
    
    billings.forEach(billing => {
      // Utiliser la date de paiement si disponible, sinon la date de mission, sinon la date de création
      let dateToUse: Date
      
      if (billing.payment_date) {
        dateToUse = new Date(billing.payment_date)
      } else if (billing.missions?.date_start) {
        dateToUse = new Date(billing.missions.date_start)
      } else if (billing.created_at) {
        dateToUse = new Date(billing.created_at)
      } else {
        // Si aucune date n'est disponible, utiliser aujourd'hui
        dateToUse = new Date()
      }
      
      const dateKey = dateToUse.toDateString()
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(billing)
    })
    
    return grouped
  }, [billings])

  // Calculer les statistiques pour une date donnée
  const getDateStats = (date: Date) => {
    const dateKey = date.toDateString()
    const dayBillings = billingsByDate[dateKey] || []
    
    return {
      total: dayBillings.reduce((sum, b) => sum + b.amount, 0),
      count: dayBillings.length,
      pending: dayBillings.filter(b => b.status === 'en_attente').length,
      validated: dayBillings.filter(b => b.status === 'validé').length,
      paid: dayBillings.filter(b => b.status === 'payé').length,
      // Ajouter des statistiques pour les paiements avec/sans date de paiement
      withPaymentDate: dayBillings.filter(b => b.payment_date).length,
      withoutPaymentDate: dayBillings.filter(b => !b.payment_date).length
    }
  }

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

  const getDayClass = (date: Date) => {
    const stats = getDateStats(date)
    const baseClass = "h-24 p-1 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
    
    if (!isCurrentMonth(date)) {
      return `${baseClass} bg-gray-50 text-gray-400`
    }
    
    if (isToday(date)) {
      return `${baseClass} bg-blue-50 border-blue-300`
    }
    
    if (stats.count > 0) {
      return `${baseClass} bg-green-50 border-green-200`
    }
    
    return baseClass
  }

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

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

  return (
    <div className="space-y-4">
      {/* En-tête du calendrier */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h2 className="text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentDate(new Date())}
        >
          Aujourd'hui
        </Button>
      </div>

      {/* Grille du calendrier */}
      <Card>
        <CardContent className="p-4">
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Jours du mois */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const stats = getDateStats(date)
              const dateKey = date.toDateString()
              const dayBillings = billingsByDate[dateKey] || []
              
              return (
                <div
                  key={index}
                  className={getDayClass(date)}
                  onClick={() => {
                    if (isCurrentMonth(date)) {
                      setSelectedDate(date)
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium ${
                      isToday(date) ? 'text-blue-600' : ''
                    }`}>
                      {date.getDate()}
                    </span>
                    
                    {stats.count > 0 && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        {stats.count}
                      </Badge>
                    )}
                  </div>

                                     {/* Indicateurs de statut */}
                   {stats.count > 0 && (
                     <div className="space-y-1">
                       {stats.pending > 0 && (
                         <div className="flex items-center space-x-1">
                           <AlertCircle className="h-2 w-2 text-yellow-500" />
                           <span className="text-xs text-yellow-600">{stats.pending}</span>
                         </div>
                       )}
                       
                       {stats.validated > 0 && (
                         <div className="flex items-center space-x-1">
                           <Clock className="h-2 w-2 text-blue-500" />
                           <span className="text-xs text-blue-600">{stats.validated}</span>
                         </div>
                       )}
                       
                       {stats.paid > 0 && (
                         <div className="flex items-center space-x-1">
                           <CheckCircle className="h-2 w-2 text-green-500" />
                           <span className="text-xs text-green-600">{stats.paid}</span>
                         </div>
                       )}
                       
                       {/* Indicateur pour les paiements sans date de paiement */}
                       {stats.withoutPaymentDate > 0 && (
                         <div className="flex items-center space-x-1">
                           <AlertCircle className="h-2 w-2 text-orange-500" />
                           <span className="text-xs text-orange-600">{stats.withoutPaymentDate}</span>
                         </div>
                       )}
                     </div>
                   )}

                                     {/* Montant total */}
                   {stats.total > 0 && (
                     <div className="mt-1">
                       <div className="flex items-center space-x-1">
                         <DollarSign className="h-2 w-2 text-green-500" />
                         <span className="text-xs font-medium text-green-700">
                           {formatCurrency(stats.total)}
                         </span>
                       </div>
                       {/* Afficher le nombre de techniciens */}
                       {stats.count > 0 && (
                         <div className="mt-1">
                           <span className="text-xs text-blue-600 font-medium">
                             {stats.count} paiement{stats.count > 1 ? 's' : ''}
                           </span>
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

      {/* Détails de la date sélectionnée */}
      {selectedDate && (() => {
        const dateKey = selectedDate.toDateString()
        const dayBillings = billingsByDate[dateKey] || []
        
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Paiements du {formatDate(selectedDate)}</span>
                <Badge variant="secondary" className="ml-2">
                  {dayBillings.length} paiement{dayBillings.length > 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
              
              if (dayBillings.length === 0) {
                return (
                  <p className="text-gray-500 text-center py-4">
                    Aucun paiement prévu pour cette date
                  </p>
                )
              }

                                                           return (
                  <div className="space-y-3">
                    {dayBillings.map(billing => (
                      <div
                        key={billing.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => onBillingClick?.(billing)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-blue-600">
                              {billing.users?.name || 'Technicien inconnu'}
                            </h4>
                            <Badge className={getStatusColor(billing.status)}>
                              {billing.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 font-medium">
                            {billing.missions?.title || 'Mission inconnue'}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            {billing.payment_date ? (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                💰 Payé le {formatDate(billing.payment_date)}
                              </span>
                            ) : billing.status === 'validé' ? (
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                ⏳ Validé - En attente de paiement
                              </span>
                            ) : billing.status === 'en_attente' ? (
                              <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                ⏸️ En attente de validation
                              </span>
                            ) : null}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1">
                          <span className="font-bold text-lg text-green-600">
                            {formatCurrency(billing.amount)}
                          </span>
                          {billing.missions?.date_start && (
                            <span className="text-xs text-gray-500">
                              Mission: {formatDate(billing.missions.date_start)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )
      })()}
    </div>
  )
} 
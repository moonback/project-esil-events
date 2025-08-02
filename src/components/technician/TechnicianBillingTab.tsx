import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, Clock, CheckCircle, TrendingUp, Calendar, MapPin, Clock as ClockIcon, FileText, Eye, EyeOff } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import type { BillingWithDetails } from '@/types/database'

export function TechnicianBillingTab() {
  const profile = useAuthStore(state => state.profile)
  const [billings, setBillings] = useState<BillingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'en_attente' | 'validé' | 'payé'>('all')
  const [expandedBilling, setExpandedBilling] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalAmount: 0,
    pendingAmount: 0,
    validatedAmount: 0,
    paidAmount: 0
  })

  useEffect(() => {
    if (profile) {
      fetchBillings()
    }
  }, [profile])

  const fetchBillings = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('billing')
        .select(`
          *,
          missions (
            title,
            type,
            date_start,
            date_end,
            location
          )
        `)
        .eq('technician_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const billingData = data as (BillingWithDetails & { users?: any })[]
      setBillings(billingData)

      // Calculer les statistiques
      const stats = billingData.reduce((acc, billing) => {
        acc.totalAmount += billing.amount
        
        switch (billing.status) {
          case 'en_attente':
            acc.pendingAmount += billing.amount
            break
          case 'validé':
            acc.validatedAmount += billing.amount
            break
          case 'payé':
            acc.paidAmount += billing.amount
            break
        }
        
        return acc
      }, {
        totalAmount: 0,
        pendingAmount: 0,
        validatedAmount: 0,
        paidAmount: 0
      })

      setStats(stats)
    } catch (error) {
      console.error('Erreur lors du chargement de la facturation:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBillings = filter === 'all' 
    ? billings 
    : billings.filter(billing => billing.status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Chargement de votre facturation...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h3 className="text-lg md:text-xl font-semibold">Ma Facturation</h3>
        <p className="text-sm md:text-base text-gray-600">
          Consultez vos rémunérations et leur statut de paiement
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total gagné</p>
                <p className="text-lg md:text-xl font-bold">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-6 w-6 md:h-8 md:w-8 text-yellow-600" />
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">En attente</p>
                <p className="text-lg md:text-xl font-bold text-yellow-600">{formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Validé</p>
                <p className="text-lg md:text-xl font-bold text-blue-600">{formatCurrency(stats.validatedAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Payé</p>
                <p className="text-lg md:text-xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
          className="text-xs px-3 py-1"
        >
          Toutes
        </Button>
        <Button
          variant={filter === 'en_attente' ? 'default' : 'outline'}
          onClick={() => setFilter('en_attente')}
          size="sm"
          className="text-xs px-3 py-1"
        >
          En attente
        </Button>
        <Button
          variant={filter === 'validé' ? 'default' : 'outline'}
          onClick={() => setFilter('validé')}
          size="sm"
          className="text-xs px-3 py-1"
        >
          Validées
        </Button>
        <Button
          variant={filter === 'payé' ? 'default' : 'outline'}
          onClick={() => setFilter('payé')}
          size="sm"
          className="text-xs px-3 py-1"
        >
          Payées
        </Button>
      </div>

      {/* Liste des rémunérations */}
      <div className="grid gap-4">
        {filteredBillings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {filter === 'all' ? 'Aucune rémunération' : `Aucune rémunération ${filter}`}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Vos rémunérations apparaîtront ici après acceptation de missions
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBillings.map((billing) => (
            <Card key={billing.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-lg">{billing.missions.title}</h4>
                      <Badge className={getStatusColor(billing.status)}>
                        {billing.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {billing.missions.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(billing.missions.date_start)}
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {billing.missions.type}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(billing.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedBilling(expandedBilling === billing.id ? null : billing.id)}
                      className="mt-2"
                    >
                      {expandedBilling === billing.id ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Masquer
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Détails
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Détails étendus */}
                {expandedBilling === billing.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Informations de la mission */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Détails de la mission
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Titre:</span>
                            <p className="text-sm">{billing.missions.title}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Description:</span>
                            <p className="text-sm">{billing.missions.description || 'Aucune description'}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Lieu:</span>
                            <p className="text-sm">{billing.missions.location}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Type:</span>
                            <Badge variant="secondary" className="text-xs">{billing.missions.type}</Badge>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Date de début:</span>
                            <p className="text-sm">{formatDate(billing.missions.date_start)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Date de fin:</span>
                            <p className="text-sm">{formatDate(billing.missions.date_end)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Informations de paiement */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Détails du paiement
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Montant:</span>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(billing.amount)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Statut:</span>
                            <Badge className={getStatusColor(billing.status)}>
                              {billing.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Date de création:</span>
                            <p className="text-sm">{formatDate(billing.created_at)}</p>
                          </div>
                          {billing.payment_date && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">Date de paiement:</span>
                              <p className="text-sm">{formatDate(billing.payment_date)}</p>
                            </div>
                          )}
                          {billing.notes && (
                            <div>
                              <span className="text-sm font-medium text-gray-600">Notes:</span>
                              <p className="text-sm bg-gray-50 p-2 rounded border">
                                <FileText className="h-4 w-4 inline mr-1" />
                                {billing.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions selon le statut */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {billing.status === 'en_attente' && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              En attente de validation par l'administrateur
                            </span>
                          )}
                          {billing.status === 'validé' && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <CheckCircle className="h-4 w-4" />
                              Paiement validé, en cours de traitement
                            </span>
                          )}
                          {billing.status === 'payé' && (
                            <span className="flex items-center gap-1 text-green-600">
                              <DollarSign className="h-4 w-4" />
                              Paiement effectué
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations de base toujours visibles */}
                <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                  <span>Mission du {formatDate(billing.missions.date_start)}</span>
                  
                  {billing.payment_date && (
                    <span>Payé le {formatDate(billing.payment_date)}</span>
                  )}
                  
                  {billing.status === 'validé' && (
                    <span className="text-blue-600 font-medium">Paiement en cours</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
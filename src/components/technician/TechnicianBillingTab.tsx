import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAdminStore } from '@/store/adminStore'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, Clock, CheckCircle, TrendingUp, Calendar, MapPin, 
  Clock as ClockIcon, FileText, Eye, EyeOff, Wallet, Receipt,
  CreditCard, AlertCircle, Building, User, CalendarDays
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import type { BillingWithDetails } from '@/types/database'

export function TechnicianBillingTab() {
  const profile = useAuthStore(state => state.profile)
  const { refreshData } = useAdminStore()
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
            location,
            description
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

  // Fonction pour mettre à jour les données après les actions
  const refreshBillings = async () => {
    await fetchBillings()
    await refreshData()
  }

  const filteredBillings = filter === 'all' 
    ? billings 
    : billings.filter(billing => billing.status === filter)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'en_attente':
        return <Clock className="h-4 w-4" />
      case 'validé':
        return <CheckCircle className="h-4 w-4" />
      case 'payé':
        return <CreditCard className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <div>
            <p className="text-lg font-medium text-gray-900">Chargement de vos rémunérations</p>
            <p className="text-sm text-gray-600">Récupération des données...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mes Rémunérations</h2>
            <p className="text-gray-600 mt-1">Suivez vos gains et le statut de vos paiements</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 rounded-lg">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
                className="rounded-r-none"
              >
                Toutes
              </Button>
              <Button
                variant={filter === 'en_attente' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('en_attente')}
                className="rounded-none"
              >
                En attente
              </Button>
              <Button
                variant={filter === 'validé' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('validé')}
                className="rounded-none"
              >
                Validées
              </Button>
              <Button
                variant={filter === 'payé' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('payé')}
                className="rounded-l-none"
              >
                Payées
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Gagné</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(stats.totalAmount)}</p>
                <p className="text-xs text-blue-600 mt-1">{billings.length} rémunération{billings.length > 1 ? 's' : ''}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">En Attente</p>
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(stats.pendingAmount)}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  {billings.filter(b => b.status === 'en_attente').length} paiement{billings.filter(b => b.status === 'en_attente').length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-full">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Validé</p>
                <p className="text-2xl font-bold text-indigo-900">{formatCurrency(stats.validatedAmount)}</p>
                <p className="text-xs text-indigo-600 mt-1">
                  {billings.filter(b => b.status === 'validé').length} paiement{billings.filter(b => b.status === 'validé').length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 bg-indigo-500 rounded-full">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Payé</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.paidAmount)}</p>
                <p className="text-xs text-green-600 mt-1">
                  {billings.filter(b => b.status === 'payé').length} paiement{billings.filter(b => b.status === 'payé').length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicateur de résultats */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {filteredBillings.length} rémunération{filteredBillings.length > 1 ? 's' : ''}
            </span>
          </div>
          {filter !== 'all' && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200">
              Filtre actif
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Moyenne: {formatCurrency(billings.length > 0 ? stats.totalAmount / billings.length : 0)}</span>
        </div>
      </div>

      {/* Liste des rémunérations */}
      <div className="space-y-4">
        {filteredBillings.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <Wallet className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Aucune rémunération</h3>
                  <p className="text-gray-500 mt-1">
                    {filter === 'all' 
                      ? 'Vos rémunérations apparaîtront ici après acceptation de missions'
                      : `Aucune rémunération ${filter}`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredBillings.map((billing) => (
            <Card key={billing.id} className="hover:shadow-lg transition-all duration-200 border-gray-200">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Informations de base */}
                  <div className="lg:col-span-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 line-clamp-1">
                          {billing.missions?.title || 'Mission inconnue'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            {billing.missions?.location || 'Lieu inconnu'}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {billing.missions?.date_start ? formatDate(billing.missions.date_start) : 'Date inconnue'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Montant */}
                  <div className="lg:col-span-2 text-center">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(billing.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Statut */}
                  <div className="lg:col-span-2 text-center">
                    <Badge 
                      className={`${getStatusColor(billing.status)} flex items-center gap-1 justify-center`}
                    >
                      {getStatusIcon(billing.status)}
                      {billing.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Date de paiement */}
                  <div className="lg:col-span-2 text-center">
                    {billing.payment_date ? (
                      <div className="flex items-center justify-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          {formatDate(billing.payment_date)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-2 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedBilling(expandedBilling === billing.id ? null : billing.id)}
                      className="flex items-center gap-2"
                    >
                      {expandedBilling === billing.id ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Masquer
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Détails
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Détails étendus */}
                {expandedBilling === billing.id && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Informations de la mission */}
                      <div className="space-y-4">
                        <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Détails de la mission
                        </h5>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-gray-100 rounded">
                              <Building className="h-3 w-3 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Titre</p>
                              <p className="text-sm font-medium">{billing.missions?.title}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-gray-100 rounded">
                              <MapPin className="h-3 w-3 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Lieu</p>
                              <p className="text-sm font-medium">{billing.missions?.location}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-gray-100 rounded">
                              <ClockIcon className="h-3 w-3 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Type</p>
                              <Badge variant="secondary" className="text-xs">{billing.missions?.type}</Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-gray-100 rounded">
                              <Calendar className="h-3 w-3 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Période</p>
                              <p className="text-sm font-medium">
                                {billing.missions?.date_start && billing.missions?.date_end 
                                  ? `${formatDate(billing.missions.date_start)} - ${formatDate(billing.missions.date_end)}`
                                  : 'Non spécifiée'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Informations de paiement */}
                      <div className="space-y-4">
                        <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Détails du paiement
                        </h5>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-green-100 rounded">
                              <Wallet className="h-3 w-3 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Montant</p>
                              <p className="text-lg font-bold text-green-600">{formatCurrency(billing.amount)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-blue-100 rounded">
                              <CheckCircle className="h-3 w-3 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Statut</p>
                              <Badge className={getStatusColor(billing.status)}>
                                {billing.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-gray-100 rounded">
                              <Calendar className="h-3 w-3 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Créé le</p>
                              <p className="text-sm font-medium">{formatDate(billing.created_at)}</p>
                            </div>
                          </div>
                          
                          {billing.payment_date && (
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-green-100 rounded">
                                <CreditCard className="h-3 w-3 text-green-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Payé le</p>
                                <p className="text-sm font-medium">{formatDate(billing.payment_date)}</p>
                              </div>
                            </div>
                          )}
                          
                          {billing.notes && (
                            <div className="flex items-start gap-2">
                              <div className="p-1 bg-gray-100 rounded">
                                <FileText className="h-3 w-3 text-gray-500" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Notes</p>
                                <p className="text-sm bg-gray-50 p-2 rounded border">
                                  {billing.notes}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Statut détaillé */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        {billing.status === 'en_attente' && (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">En attente de validation par l'administrateur</span>
                          </div>
                        )}
                        {billing.status === 'validé' && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Paiement validé, en cours de traitement</span>
                          </div>
                        )}
                        {billing.status === 'payé' && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CreditCard className="h-4 w-4" />
                            <span className="text-sm font-medium">Paiement effectué avec succès</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
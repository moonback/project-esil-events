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
import { parseISO, isValid } from 'date-fns'

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
      
      // Vérifier les paiements en lot pour chaque facture
      const billingsWithBulkInfo = await Promise.all(
        billingData.map(async (billing) => {
          if (billing.status === 'payé' && billing.payment_date) {
            // Chercher d'autres factures payées le même jour
            const { data: sameDayBillings } = await supabase
              .from('billing')
              .select('id, amount, missions(title)')
              .eq('technician_id', profile.id)
              .eq('status', 'payé')
              .eq('payment_date', billing.payment_date)
              .neq('id', billing.id)

            return {
              ...billing,
              bulkPayment: sameDayBillings && sameDayBillings.length > 0 ? {
                count: sameDayBillings.length + 1,
                totalAmount: sameDayBillings.reduce((sum, b) => sum + b.amount, billing.amount),
                otherBillings: sameDayBillings
              } : null
            }
          }
          return billing
        })
      )
      
      setBillings(billingsWithBulkInfo)

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
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      {/* Header - Responsive */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 shadow-sm">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="text-center lg:text-left">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Mes Rémunérations</h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">Suivez vos gains et le statut de vos paiements</p>
          </div>
          
          <div className="flex justify-center lg:justify-end">
            <div className="grid grid-cols-2 md:flex md:items-center border border-gray-200 rounded-lg overflow-hidden">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
                className="rounded-none text-xs md:text-sm"
              >
                Toutes
              </Button>
              <Button
                variant={filter === 'en_attente' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('en_attente')}
                className="rounded-none text-xs md:text-sm"
              >
                <span className="hidden sm:inline">En attente</span>
                <span className="sm:hidden">Attente</span>
              </Button>
              <Button
                variant={filter === 'validé' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('validé')}
                className="rounded-none text-xs md:text-sm"
              >
                Validées
              </Button>
              <Button
                variant={filter === 'payé' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('payé')}
                className="rounded-none text-xs md:text-sm"
              >
                Payées
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques améliorées - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-blue-600 truncate">Total Gagné</p>
                <p className="text-lg md:text-2xl font-bold text-blue-900 truncate">{formatCurrency(stats.totalAmount)}</p>
                <p className="text-xs text-blue-600 mt-1 truncate">{billings.length} rémunération{billings.length > 1 ? 's' : ''}</p>
              </div>
              <div className="p-2 md:p-3 bg-blue-500 rounded-full flex-shrink-0">
                <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-yellow-600 truncate">En Attente</p>
                <p className="text-lg md:text-2xl font-bold text-yellow-900 truncate">{formatCurrency(stats.pendingAmount)}</p>
                <p className="text-xs text-yellow-600 mt-1 truncate">
                  {billings.filter(b => b.status === 'en_attente').length} paiement{billings.filter(b => b.status === 'en_attente').length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-yellow-500 rounded-full flex-shrink-0">
                <Clock className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-indigo-600 truncate">Validé</p>
                <p className="text-lg md:text-2xl font-bold text-indigo-900 truncate">{formatCurrency(stats.validatedAmount)}</p>
                <p className="text-xs text-indigo-600 mt-1 truncate">
                  {billings.filter(b => b.status === 'validé').length} paiement{billings.filter(b => b.status === 'validé').length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-indigo-500 rounded-full flex-shrink-0">
                <CheckCircle className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-green-600 truncate">Payé</p>
                <p className="text-lg md:text-2xl font-bold text-green-900 truncate">{formatCurrency(stats.paidAmount)}</p>
                <p className="text-xs text-green-600 mt-1 truncate">
                  {billings.filter(b => b.status === 'payé').length} paiement{billings.filter(b => b.status === 'payé').length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-green-500 rounded-full flex-shrink-0">
                <DollarSign className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicateur de résultats - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg border border-gray-200 p-4 space-y-3 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Wallet className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {filteredBillings.length} rémunération{filteredBillings.length > 1 ? 's' : ''}
            </span>
          </div>
          {filter !== 'all' && (
            <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200 text-xs self-center sm:self-auto">
              Filtre actif
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-center sm:justify-end gap-2 text-xs sm:text-sm text-gray-500">
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
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start lg:items-center">
                  {/* Informations de base - Responsive */}
                  <div className="lg:col-span-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <Building className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                          {billing.missions?.title || 'Mission inconnue'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <p className="text-xs md:text-sm text-gray-600 truncate">
                            {billing.missions?.location || 'Lieu inconnu'}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {billing.missions?.date_start ? formatDate(billing.missions.date_start) : 'Date inconnue'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Montant - Responsive */}
                  <div className="lg:col-span-2 lg:text-center">
                    <div className="bg-green-50 rounded-lg p-2 md:p-3 text-center lg:text-center">
                      <p className="text-base md:text-lg font-bold text-green-700">
                        {formatCurrency(billing.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Statut - Responsive */}
                  <div className="lg:col-span-2 lg:text-center">
                    <div className="space-y-1 flex flex-col items-start lg:items-center">
                      <Badge 
                        className={`${getStatusColor(billing.status)} flex items-center gap-1 text-xs`}
                      >
                        {getStatusIcon(billing.status)}
                        <span className="hidden sm:inline">{billing.status.replace('_', ' ')}</span>
                        <span className="sm:hidden">
                          {billing.status === 'en_attente' ? 'Attente' : 
                           billing.status === 'validé' ? 'Validé' : 'Payé'}
                        </span>
                      </Badge>
                      {/* Indicateur de paiement en lot */}
                      {(billing as any).bulkPayment && (
                        <Badge 
                          variant="secondary"
                          className="bg-purple-100 text-purple-700 border-purple-200 text-xs"
                        >
                          <Receipt className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Paiement en lot</span>
                          <span className="sm:hidden">Lot</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Date de paiement - Responsive */}
                  <div className="lg:col-span-2 lg:text-center">
                    {billing.payment_date ? (
                      <div className="flex items-center gap-2 lg:justify-center">
                        <CalendarDays className="h-3 w-3 md:h-4 md:w-4 text-gray-400 flex-shrink-0" />
                        <p className="text-xs md:text-sm text-gray-600">
                          {formatDate(billing.payment_date)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs md:text-sm">-</span>
                    )}
                  </div>

                  {/* Actions - Responsive */}
                  <div className="lg:col-span-2 flex justify-start lg:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedBilling(expandedBilling === billing.id ? null : billing.id)}
                      className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                    >
                      {expandedBilling === billing.id ? (
                        <>
                          <EyeOff className="h-3 w-3 md:h-4 md:w-4" />
                          <span className="hidden sm:inline">Masquer</span>
                          <span className="sm:hidden">✕</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3 md:h-4 md:w-4" />
                          <span className="hidden sm:inline">Détails</span>
                          <span className="sm:hidden">👁️</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Détails étendus - Responsive */}
                {expandedBilling === billing.id && (
                  <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                      {/* Informations de la mission */}
                      <div className="space-y-3 md:space-y-4">
                        <h5 className="font-semibold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                          <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                          Détails de la mission
                        </h5>
                        <div className="space-y-2 md:space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-gray-100 rounded flex-shrink-0">
                              <Building className="h-3 w-3 text-gray-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Titre</p>
                              <p className="text-xs md:text-sm font-medium truncate">{billing.missions?.title}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-gray-100 rounded flex-shrink-0">
                              <MapPin className="h-3 w-3 text-gray-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Lieu</p>
                              <p className="text-xs md:text-sm font-medium truncate">{billing.missions?.location}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-gray-100 rounded flex-shrink-0">
                              <ClockIcon className="h-3 w-3 text-gray-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Type</p>
                              <Badge variant="secondary" className="text-xs">{billing.missions?.type}</Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-gray-100 rounded flex-shrink-0">
                              <Calendar className="h-3 w-3 text-gray-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Période</p>
                              <p className="text-xs md:text-sm font-medium">
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
                      <div className="space-y-3 md:space-y-4">
                        <h5 className="font-semibold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                          <DollarSign className="h-3 w-3 md:h-4 md:w-4" />
                          Détails du paiement
                        </h5>
                        <div className="space-y-2 md:space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-green-100 rounded flex-shrink-0">
                              <Wallet className="h-3 w-3 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Montant</p>
                              <p className="text-base md:text-lg font-bold text-green-600">{formatCurrency(billing.amount)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-blue-100 rounded flex-shrink-0">
                              <CheckCircle className="h-3 w-3 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Statut</p>
                              <Badge className={`${getStatusColor(billing.status)} text-xs`}>
                                <span className="hidden sm:inline">{billing.status.replace('_', ' ')}</span>
                                <span className="sm:hidden">
                                  {billing.status === 'en_attente' ? 'Attente' : 
                                   billing.status === 'validé' ? 'Validé' : 'Payé'}
                                </span>
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-gray-100 rounded flex-shrink-0">
                              <Calendar className="h-3 w-3 text-gray-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-500">Créé le</p>
                              <p className="text-xs md:text-sm font-medium">{formatDate(billing.created_at)}</p>
                            </div>
                          </div>
                          
                          {billing.payment_date && (
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-green-100 rounded flex-shrink-0">
                                <CreditCard className="h-3 w-3 text-green-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500">Payé le</p>
                                <p className="text-xs md:text-sm font-medium">{formatDate(billing.payment_date)}</p>
                              </div>
                            </div>
                          )}
                          
                          {billing.notes && (
                            <div className="flex items-start gap-2">
                              <div className="p-1 bg-gray-100 rounded flex-shrink-0">
                                <FileText className="h-3 w-3 text-gray-500" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500">Notes</p>
                                <p className="text-xs md:text-sm bg-gray-50 p-2 rounded border break-words">
                                  {billing.notes}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Information de paiement en lot */}
                          {(billing as any).bulkPayment && (
                            <div className="flex items-start gap-2">
                              <div className="p-1 bg-purple-100 rounded flex-shrink-0">
                                <Receipt className="h-3 w-3 text-purple-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs text-gray-500">Paiement en lot</p>
                                <div className="text-xs md:text-sm bg-purple-50 p-2 rounded border">
                                  <p className="font-medium text-purple-700">
                                    <span className="hidden sm:inline">
                                      Paiement groupé avec {(billing as any).bulkPayment.count - 1} autre{(billing as any).bulkPayment.count - 1 > 1 ? 's' : ''} facture{(billing as any).bulkPayment.count - 1 > 1 ? 's' : ''}
                                    </span>
                                    <span className="sm:hidden">
                                      Lot de {(billing as any).bulkPayment.count} factures
                                    </span>
                                  </p>
                                  <p className="text-xs text-purple-600 mt-1">
                                    Total: {formatCurrency((billing as any).bulkPayment.totalAmount)}
                                  </p>
                                  {(billing as any).bulkPayment.otherBillings && (billing as any).bulkPayment.otherBillings.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs text-gray-600 mb-1">
                                        <span className="hidden sm:inline">Autres factures du lot:</span>
                                        <span className="sm:hidden">Autres:</span>
                                      </p>
                                      <div className="space-y-1">
                                        {(billing as any).bulkPayment.otherBillings.map((otherBilling: any) => (
                                          <div key={otherBilling.id} className="text-xs bg-white p-1 rounded border">
                                            <span className="truncate block">
                                              {otherBilling.missions?.title || 'Mission inconnue'} - {formatCurrency(otherBilling.amount)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Statut détaillé - Responsive */}
                    <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        {billing.status === 'en_attente' && (
                          <div className="flex items-center gap-2 text-yellow-600">
                            <Clock className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="text-xs md:text-sm font-medium">
                              <span className="hidden sm:inline">En attente de validation par l'administrateur</span>
                              <span className="sm:hidden">En attente de validation</span>
                            </span>
                          </div>
                        )}
                        {billing.status === 'validé' && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="text-xs md:text-sm font-medium">
                              <span className="hidden sm:inline">Paiement validé, en cours de traitement</span>
                              <span className="sm:hidden">Validé, en cours</span>
                            </span>
                          </div>
                        )}
                        {billing.status === 'payé' && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="text-xs md:text-sm font-medium">
                              <span className="hidden sm:inline">Paiement effectué avec succès</span>
                              <span className="sm:hidden">Payé avec succès</span>
                            </span>
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
import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminStore } from '@/store/adminStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Check, Edit, Trash2, DollarSign, TrendingUp, Users, Filter, X, 
  Clock, CheckCircle, CreditCard, Plus, Calendar, List, BarChart3,
  Eye, EyeOff, Download, FileText, Search, MoreHorizontal, ArrowUpDown,
  CalendarDays, User as UserIcon, Building, Receipt, Wallet, AlertCircle
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import type { BillingWithDetails, User } from '@/types/database'
import { CreatePaymentDialog } from './CreatePaymentDialog'
import { BillingCalendarView } from './BillingCalendarView'
import { AdvancedBillingFilters, type BillingFilters } from './AdvancedBillingFilters'
import { useToast } from '@/lib/useToast'

export function AdminBillingTab() {
  const { billings, technicians, loading, stats } = useAdminStore()
  const { showSuccess, showError } = useToast()
  const [createPaymentDialogOpen, setCreatePaymentDialogOpen] = useState(false)
  const [selectedTechnician, setSelectedTechnician] = useState<User | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'analytics'>('list')
  const [selectedBilling, setSelectedBilling] = useState<BillingWithDetails | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<BillingFilters>({
    search: '',
    status: 'all',
    technician: 'all',
    dateRange: { start: '', end: '' },
    amountRange: { min: '', max: '' },
    sortBy: 'date',
    sortOrder: 'desc',
    showStats: true
  })

  // Appliquer les filtres avancés
  const filteredBillings = useMemo(() => {
    return billings.filter(billing => {
      // Recherche textuelle
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSearch = 
          billing.missions?.title?.toLowerCase().includes(searchTerm) ||
          billing.users?.name?.toLowerCase().includes(searchTerm) ||
          billing.notes?.toLowerCase().includes(searchTerm) ||
          billing.id.toLowerCase().includes(searchTerm)
        
        if (!matchesSearch) return false
      }

      // Filtre par statut
      if (filters.status !== 'all' && billing.status !== filters.status) {
        return false
      }

      // Filtre par technicien
      if (filters.technician !== 'all' && billing.technician_id !== filters.technician) {
        return false
      }

      // Filtre par plage de dates
      if (filters.dateRange.start || filters.dateRange.end) {
        const paymentDate = billing.payment_date ? new Date(billing.payment_date) : null
        if (!paymentDate) return false

        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start)
          if (paymentDate < startDate) return false
        }

        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end)
          if (paymentDate > endDate) return false
        }
      }

      // Filtre par plage de montants
      if (filters.amountRange.min || filters.amountRange.max) {
        const amount = billing.amount

        if (filters.amountRange.min) {
          const minAmount = parseFloat(filters.amountRange.min)
          if (amount < minAmount) return false
        }

        if (filters.amountRange.max) {
          const maxAmount = parseFloat(filters.amountRange.max)
          if (amount > maxAmount) return false
        }
      }

      return true
    }).sort((a, b) => {
      const order = filters.sortOrder === 'asc' ? 1 : -1
      
      switch (filters.sortBy) {
        case 'date':
          const dateA = a.payment_date ? new Date(a.payment_date).getTime() : 0
          const dateB = b.payment_date ? new Date(b.payment_date).getTime() : 0
          return (dateA - dateB) * order
          
        case 'amount':
          return (a.amount - b.amount) * order
          
        case 'technician':
          const nameA = a.users?.name || ''
          const nameB = b.users?.name || ''
          return nameA.localeCompare(nameB) * order
          
        case 'status':
          return a.status.localeCompare(b.status) * order
          
        default:
          return 0
      }
    })
  }, [billings, filters])

  // Calculer les statistiques avancées
  const billingStats = useMemo(() => {
    const total = filteredBillings.reduce((sum, b) => sum + b.amount, 0)
    const pending = filteredBillings.filter(b => b.status === 'en_attente').reduce((sum, b) => sum + b.amount, 0)
    const validated = filteredBillings.filter(b => b.status === 'validé').reduce((sum, b) => sum + b.amount, 0)
    const paid = filteredBillings.filter(b => b.status === 'payé').reduce((sum, b) => sum + b.amount, 0)
    
    return {
      total,
      pending,
      validated,
      paid,
      count: filteredBillings.length,
      average: filteredBillings.length > 0 ? total / filteredBillings.length : 0
    }
  }, [filteredBillings])

  const updateBillingStatus = async (id: string, status: 'en_attente' | 'validé' | 'payé') => {
    try {
      const updateData: any = { status }
      if (status === 'payé') {
        updateData.payment_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('billing')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      showSuccess(
        "Statut mis à jour",
        `La facturation a été marquée comme ${status.replace('_', ' ')}`
      )
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      showError(
        "Erreur",
        "Impossible de mettre à jour le statut de la facturation"
      )
    }
  }

  const deleteBilling = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return

    try {
      const { error } = await supabase
        .from('billing')
        .delete()
        .eq('id', id)

      if (error) throw error

      showSuccess(
        "Facturation supprimée",
        "La facturation a été supprimée avec succès"
      )
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      showError(
        "Erreur",
        "Impossible de supprimer la facturation"
      )
    }
  }

  const handleCreatePayment = (technician: any) => {
    setSelectedTechnician(technician)
    setCreatePaymentDialogOpen(true)
  }

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

  if (loading.billings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <div>
            <p className="text-lg font-medium text-gray-900">Chargement de la facturation</p>
            <p className="text-sm text-gray-600">Récupération des données...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion de la Facturation</h2>
            <p className="text-gray-600 mt-1">Suivez et gérez les paiements des techniciens</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
            
            <div className="flex items-center border border-gray-200 rounded-lg">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="rounded-none"
              >
                <Calendar className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'analytics' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('analytics')}
                className="rounded-l-none"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              onClick={() => setCreatePaymentDialogOpen(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Paiement
            </Button>
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-in slide-in-from-top-2">
          <AdvancedBillingFilters
            billings={billings}
            technicians={technicians}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      )}

      {/* Statistiques améliorées */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Facturé</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(billingStats.total)}</p>
                <p className="text-xs text-blue-600 mt-1">{billingStats.count} facturation{billingStats.count > 1 ? 's' : ''}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">En Attente</p>
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(billingStats.pending)}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  {filteredBillings.filter(b => b.status === 'en_attente').length} paiement{filteredBillings.filter(b => b.status === 'en_attente').length > 1 ? 's' : ''}
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
                <p className="text-2xl font-bold text-indigo-900">{formatCurrency(billingStats.validated)}</p>
                <p className="text-xs text-indigo-600 mt-1">
                  {filteredBillings.filter(b => b.status === 'validé').length} paiement{filteredBillings.filter(b => b.status === 'validé').length > 1 ? 's' : ''}
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
                <p className="text-2xl font-bold text-green-900">{formatCurrency(billingStats.paid)}</p>
                <p className="text-xs text-green-600 mt-1">
                  {filteredBillings.filter(b => b.status === 'payé').length} paiement{filteredBillings.filter(b => b.status === 'payé').length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal selon le mode */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {/* Indicateur de résultats */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {filteredBillings.length} facturation{filteredBillings.length > 1 ? 's' : ''}
                </span>
              </div>
              {filters.search || filters.status !== 'all' || filters.technician !== 'all' ? (
                <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-blue-200">
                  Filtres actifs
                </Badge>
              ) : null}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Moyenne: {formatCurrency(billingStats.average)}</span>
            </div>
          </div>

          {/* Liste des facturations */}
          <div className="space-y-3">
            {filteredBillings.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <Receipt className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Aucune facturation</h3>
                      <p className="text-gray-500 mt-1">
                        {!filters.search && filters.status === 'all' && filters.technician === 'all'
                          ? 'Commencez par créer une nouvelle facturation'
                          : 'Aucune facturation ne correspond aux critères sélectionnés'
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
                              <UserIcon className="h-3 w-3 text-gray-400" />
                              <p className="text-sm text-gray-600">
                                {billing.users?.name || 'Technicien inconnu'}
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
                      <div className="lg:col-span-2 flex justify-end gap-2">
                        {billing.status === 'en_attente' && (
                          <Button
                            size="sm"
                            onClick={() => updateBillingStatus(billing.id, 'validé')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Valider
                          </Button>
                        )}
                        
                        {billing.status === 'validé' && (
                          <Button
                            size="sm"
                            onClick={() => updateBillingStatus(billing.id, 'payé')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Payer
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteBilling(billing.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Notes */}
                    {billing.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-start gap-2">
                          <div className="p-1 bg-gray-100 rounded">
                            <FileText className="h-3 w-3 text-gray-500" />
                          </div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {billing.notes}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {viewMode === 'calendar' && (
        <Card>
          <CardContent className="p-6">
            <BillingCalendarView 
              billings={filteredBillings}
              onBillingClick={(billing) => {
                setSelectedBilling(billing)
                // TODO: Ouvrir une modal de détails
              }}
            />
          </CardContent>
        </Card>
      )}

      {viewMode === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Répartition par Statut
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['en_attente', 'validé', 'payé'].map((status) => {
                  const count = filteredBillings.filter(b => b.status === status).length
                  const amount = filteredBillings.filter(b => b.status === status).reduce((sum, b) => sum + b.amount, 0)
                  const percentage = filteredBillings.length > 0 ? (count / filteredBillings.length) * 100 : 0
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                        <span className="text-sm font-medium capitalize">
                          {status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{count}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(amount)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Statistiques Globales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total facturé</span>
                  <span className="font-semibold">{formatCurrency(billingStats.total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Moyenne par facturation</span>
                  <span className="font-semibold">{formatCurrency(billingStats.average)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taux de paiement</span>
                  <span className="font-semibold">
                    {filteredBillings.length > 0 
                      ? Math.round((filteredBillings.filter(b => b.status === 'payé').length / filteredBillings.length) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog de création de paiement */}
      <CreatePaymentDialog
        open={createPaymentDialogOpen}
        onOpenChange={setCreatePaymentDialogOpen}
        technician={selectedTechnician || undefined}
      />
    </div>
  )
}

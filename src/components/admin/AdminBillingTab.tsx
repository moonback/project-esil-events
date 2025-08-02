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
  Eye, EyeOff, Download, FileText
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import type { BillingWithDetails, User } from '@/types/database'
import { CreatePaymentDialog } from './CreatePaymentDialog'
import { BillingCalendarView } from './BillingCalendarView'
import { AdvancedBillingFilters, type BillingFilters } from './AdvancedBillingFilters'

export function AdminBillingTab() {
  const { billings, technicians, loading, stats } = useAdminStore()
  const [createPaymentDialogOpen, setCreatePaymentDialogOpen] = useState(false)
  const [selectedTechnician, setSelectedTechnician] = useState<User | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
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

  // Les données sont maintenant gérées par le store admin

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

      // Les données seront actualisées automatiquement via le store
      console.log('Statut de facturation mis à jour')
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
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

      // Les données seront actualisées automatiquement via le store
      console.log('Facturation supprimée')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

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

  const handleCreatePayment = (technician: User) => {
    setSelectedTechnician(technician)
    setCreatePaymentDialogOpen(true)
  }

  if (loading.billings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Chargement de la facturation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Gestion de la Facturation</h3>
          <p className="text-gray-600">Gérez les paiements et rémunérations des techniciens</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            className="flex items-center space-x-2"
          >
            {viewMode === 'list' ? <Calendar className="h-4 w-4" /> : <List className="h-4 w-4" />}
            <span>{viewMode === 'list' ? 'Vue Calendrier' : 'Vue Liste'}</span>
          </Button>
          <Button
            onClick={() => setCreatePaymentDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer un paiement
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total filtré</p>
                <p className="text-xl font-bold">{formatCurrency(filteredBillings.reduce((sum, billing) => sum + billing.amount, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(filteredBillings.filter(b => b.status === 'en_attente').reduce((sum, billing) => sum + billing.amount, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Validé</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(filteredBillings.filter(b => b.status === 'validé').reduce((sum, billing) => sum + billing.amount, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Check className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Payé</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(filteredBillings.filter(b => b.status === 'payé').reduce((sum, billing) => sum + billing.amount, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <AdvancedBillingFilters
        billings={billings}
        technicians={technicians}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Vue des facturations */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {/* Indicateur de résultats */}
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span>
              {filteredBillings.length} facturation{filteredBillings.length > 1 ? 's' : ''} 
              {filteredBillings.length !== billings.length && (
                <span> sur {billings.length} total</span>
              )}
            </span>
            {filters.search || filters.status !== 'all' || filters.technician !== 'all' || 
             filters.dateRange.start || filters.dateRange.end || 
             filters.amountRange.min || filters.amountRange.max ? (
              <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                Filtres actifs
              </Badge>
            ) : null}
          </div>

          <div className="grid gap-4">
            {filteredBillings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">
                    {!filters.search && filters.status === 'all' && filters.technician === 'all' && 
                     !filters.dateRange.start && !filters.dateRange.end && 
                     !filters.amountRange.min && !filters.amountRange.max
                      ? 'Aucune facturation' 
                      : 'Aucune facturation correspondant aux critères sélectionnés'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredBillings.map((billing) => (
                <Card key={billing.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      <div className="md:col-span-2">
                        <h4 className="font-medium">{billing.missions?.title || 'Mission inconnue'}</h4>
                        <p className="text-sm text-gray-600">{billing.users?.name || 'Technicien inconnu'}</p>
                        <p className="text-xs text-gray-500">
                          {billing.missions?.date_start ? formatDate(billing.missions.date_start) : 'Date inconnue'}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(billing.amount)}
                        </p>
                      </div>

                      <div className="text-center">
                        <Badge className={getStatusColor(billing.status)}>
                          {billing.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="text-center">
                        {billing.payment_date ? (
                          <p className="text-sm text-gray-600">
                            {formatDate(billing.payment_date)}
                          </p>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>

                      <div className="flex justify-end space-x-2">
                        {billing.status === 'en_attente' && (
                          <Button
                            size="sm"
                            onClick={() => updateBillingStatus(billing.id, 'validé')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Valider
                          </Button>
                        )}
                        
                        {billing.status === 'validé' && (
                          <Button
                            size="sm"
                            onClick={() => updateBillingStatus(billing.id, 'payé')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Marquer payé
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteBilling(billing.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {billing.notes && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {billing.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ) : (
        <BillingCalendarView 
          billings={filteredBillings}
          onBillingClick={(billing) => {
            // TODO: Ouvrir une modal de détails pour la facturation
            console.log('Billing clicked:', billing)
          }}
        />
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

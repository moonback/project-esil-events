import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, Filter, X, Calendar, DollarSign, Users, 
  TrendingUp, TrendingDown, SortAsc, SortDesc,
  SlidersHorizontal, Eye, EyeOff
} from 'lucide-react'
import type { BillingWithDetails, User } from '@/types/database'

interface AdvancedBillingFiltersProps {
  billings: BillingWithDetails[]
  technicians: User[]
  onFiltersChange: (filters: BillingFilters) => void
  filters: BillingFilters
}

export interface BillingFilters {
  search: string
  status: 'all' | 'en_attente' | 'validé' | 'payé'
  technician: string
  dateRange: {
    start: string
    end: string
  }
  amountRange: {
    min: string
    max: string
  }
  sortBy: 'date' | 'amount' | 'technician' | 'status'
  sortOrder: 'asc' | 'desc'
  showStats: boolean
}

const defaultFilters: BillingFilters = {
  search: '',
  status: 'all',
  technician: 'all',
  dateRange: {
    start: '',
    end: ''
  },
  amountRange: {
    min: '',
    max: ''
  },
  sortBy: 'date',
  sortOrder: 'desc',
  showStats: true
}

export function AdvancedBillingFilters({ 
  billings, 
  technicians, 
  onFiltersChange, 
  filters 
}: AdvancedBillingFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [localFilters, setLocalFilters] = useState<BillingFilters>(filters)

  // Appliquer les filtres
  const filteredBillings = useMemo(() => {
    return billings.filter(billing => {
      // Recherche textuelle
      if (localFilters.search) {
        const searchTerm = localFilters.search.toLowerCase()
        const matchesSearch = 
          billing.missions?.title?.toLowerCase().includes(searchTerm) ||
          billing.users?.name?.toLowerCase().includes(searchTerm) ||
          billing.notes?.toLowerCase().includes(searchTerm) ||
          billing.id.toLowerCase().includes(searchTerm)
        
        if (!matchesSearch) return false
      }

      // Filtre par statut
      if (localFilters.status !== 'all' && billing.status !== localFilters.status) {
        return false
      }

      // Filtre par technicien
      if (localFilters.technician !== 'all' && billing.technician_id !== localFilters.technician) {
        return false
      }

      // Filtre par plage de dates
      if (localFilters.dateRange.start || localFilters.dateRange.end) {
        const paymentDate = billing.payment_date ? new Date(billing.payment_date) : null
        if (!paymentDate) return false

        if (localFilters.dateRange.start) {
          const startDate = new Date(localFilters.dateRange.start)
          if (paymentDate < startDate) return false
        }

        if (localFilters.dateRange.end) {
          const endDate = new Date(localFilters.dateRange.end)
          if (paymentDate > endDate) return false
        }
      }

      // Filtre par plage de montants
      if (localFilters.amountRange.min || localFilters.amountRange.max) {
        const amount = billing.amount

        if (localFilters.amountRange.min) {
          const minAmount = parseFloat(localFilters.amountRange.min)
          if (amount < minAmount) return false
        }

        if (localFilters.amountRange.max) {
          const maxAmount = parseFloat(localFilters.amountRange.max)
          if (amount > maxAmount) return false
        }
      }

      return true
    }).sort((a, b) => {
      const order = localFilters.sortOrder === 'asc' ? 1 : -1
      
      switch (localFilters.sortBy) {
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
  }, [billings, localFilters])

  // Statistiques des filtres
  const filterStats = useMemo(() => {
    const total = billings.length
    const filtered = filteredBillings.length
    const totalAmount = filteredBillings.reduce((sum, b) => sum + b.amount, 0)
    const avgAmount = filtered > 0 ? totalAmount / filtered : 0

    return {
      total,
      filtered,
      totalAmount,
      avgAmount,
      pending: filteredBillings.filter(b => b.status === 'en_attente').length,
      validated: filteredBillings.filter(b => b.status === 'validé').length,
      paid: filteredBillings.filter(b => b.status === 'payé').length
    }
  }, [filteredBillings, billings])

  const handleFilterChange = (key: keyof BillingFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    setLocalFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  const hasActiveFilters = 
    localFilters.search ||
    localFilters.status !== 'all' ||
    localFilters.technician !== 'all' ||
    localFilters.dateRange.start ||
    localFilters.dateRange.end ||
    localFilters.amountRange.min ||
    localFilters.amountRange.max

  return (
    <div className="space-y-4">
      {/* Barre de recherche principale */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans les factures..."
                value={localFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filtres avancés</span>
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                  {Object.values(localFilters).filter(v => v !== 'all' && v !== '').length}
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filtres avancés */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtres avancés</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtres de base */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { value: 'all', label: 'Tous', color: 'gray' },
                    { value: 'en_attente', label: 'En attente', color: 'yellow' },
                    { value: 'validé', label: 'Validé', color: 'blue' },
                    { value: 'payé', label: 'Payé', color: 'green' }
                  ].map(({ value, label, color }) => (
                    <Button
                      key={value}
                      variant={localFilters.status === value ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleFilterChange('status', value)}
                      className={`text-xs ${
                        localFilters.status === value 
                          ? `bg-${color}-600 hover:bg-${color}-700` 
                          : `hover:bg-${color}-50`
                      }`}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Technicien */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technicien
                </label>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={localFilters.technician === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleFilterChange('technician', 'all')}
                    className="text-xs"
                  >
                    Tous
                  </Button>
                  {technicians.map((technician) => (
                    <Button
                      key={technician.id}
                      variant={localFilters.technician === technician.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleFilterChange('technician', technician.id)}
                      className="text-xs"
                    >
                      {technician.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tri */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trier par
                </label>
                <div className="flex space-x-2">
                  <select
                    value={localFilters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Montant</option>
                    <option value="technician">Technicien</option>
                    <option value="status">Statut</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFilterChange('sortOrder', 
                      localFilters.sortOrder === 'asc' ? 'desc' : 'asc'
                    )}
                  >
                    {localFilters.sortOrder === 'asc' ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Plages de dates et montants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Plage de dates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Plage de dates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    placeholder="Date début"
                    value={localFilters.dateRange.start}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...localFilters.dateRange,
                      start: e.target.value
                    })}
                  />
                  <Input
                    type="date"
                    placeholder="Date fin"
                    value={localFilters.dateRange.end}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...localFilters.dateRange,
                      end: e.target.value
                    })}
                  />
                </div>
              </div>

              {/* Plage de montants */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Plage de montants
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Montant min"
                    value={localFilters.amountRange.min}
                    onChange={(e) => handleFilterChange('amountRange', {
                      ...localFilters.amountRange,
                      min: e.target.value
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Montant max"
                    value={localFilters.amountRange.max}
                    onChange={(e) => handleFilterChange('amountRange', {
                      ...localFilters.amountRange,
                      max: e.target.value
                    })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques des filtres */}
      {localFilters.showStats && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Résultats</p>
                <p className="text-lg font-bold text-blue-600">
                  {filterStats.filtered}/{filterStats.total}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-lg font-bold text-green-600">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(filterStats.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Moyenne</p>
                <p className="text-lg font-bold text-purple-600">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(filterStats.avgAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payés</p>
                <p className="text-lg font-bold text-green-600">
                  {filterStats.paid}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminStore } from '@/store/adminStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Check, Edit, Trash2, DollarSign, TrendingUp, Users, Filter, X, Clock, CheckCircle, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import type { BillingWithDetails, User } from '@/types/database'

export function AdminBillingTab() {
  const { billings, technicians, loading, stats } = useAdminStore()
  const [filter, setFilter] = useState<'all' | 'en_attente' | 'validé' | 'payé'>('all')
  const [technicianFilter, setTechnicianFilter] = useState<string>('all')

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

  const filteredBillings = billings.filter(billing => {
    // Filtre par statut
    const statusMatch = filter === 'all' || billing.status === filter
    
    // Filtre par technicien
    const technicianMatch = technicianFilter === 'all' || billing.technician_id === technicianFilter
    
    return statusMatch && technicianMatch
  })

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
      <div>
        <h3 className="text-xl font-semibold">Gestion de la Facturation</h3>
        <p className="text-gray-600">Gérez les paiements et rémunérations des techniciens</p>
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

      {/* Filtres */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-700">Filtres</h3>
            </div>
            {(filter !== 'all' || technicianFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilter('all')
                  setTechnicianFilter('all')
                }}
                className="h-6 px-2 text-xs text-gray-500 hover:text-red-600"
              >
                <X className="h-3 w-3 mr-1" />
                Effacer
              </Button>
            )}
          </div>
          
          <div className="space-y-3">
            {/* Filtre par statut */}
            <div className="flex items-center gap-2">
              <CreditCard className="h-3 w-3 text-gray-500 flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  onClick={() => setFilter('all')}
                  size="sm"
                  className={`h-6 px-2 text-xs ${
                    filter === 'all' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'hover:bg-blue-50'
                  }`}
                >
                  Toutes
                </Button>
                <Button
                  variant={filter === 'en_attente' ? 'default' : 'ghost'}
                  onClick={() => setFilter('en_attente')}
                  size="sm"
                  className={`h-6 px-2 text-xs ${
                    filter === 'en_attente' 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'hover:bg-yellow-50'
                  }`}
                >
                  En attente
                </Button>
                <Button
                  variant={filter === 'validé' ? 'default' : 'ghost'}
                  onClick={() => setFilter('validé')}
                  size="sm"
                  className={`h-6 px-2 text-xs ${
                    filter === 'validé' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'hover:bg-blue-50'
                  }`}
                >
                  Validées
                </Button>
                <Button
                  variant={filter === 'payé' ? 'default' : 'ghost'}
                  onClick={() => setFilter('payé')}
                  size="sm"
                  className={`h-6 px-2 text-xs ${
                    filter === 'payé' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'hover:bg-green-50'
                  }`}
                >
                  Payées
                </Button>
              </div>
            </div>

            {/* Filtre par technicien */}
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 text-gray-500 flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                <Button
                  variant={technicianFilter === 'all' ? 'default' : 'ghost'}
                  onClick={() => setTechnicianFilter('all')}
                  size="sm"
                  className={`h-6 px-2 text-xs ${
                    technicianFilter === 'all' 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'hover:bg-purple-50'
                  }`}
                >
                  Tous
                </Button>
                {technicians.map((technician) => (
                  <Button
                    key={technician.id}
                    variant={technicianFilter === technician.id ? 'default' : 'ghost'}
                    onClick={() => setTechnicianFilter(technician.id)}
                    size="sm"
                    className={`h-6 px-2 text-xs ${
                      technicianFilter === technician.id 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'hover:bg-purple-50'
                    }`}
                  >
                    {technician.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des facturations */}
      <div className="space-y-4">
        {/* Indicateur de résultats */}
        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
          <span>
            {filteredBillings.length} facturation{filteredBillings.length > 1 ? 's' : ''} 
            {filteredBillings.length !== billings.length && (
              <span> sur {billings.length} total</span>
            )}
          </span>
          {(filter !== 'all' || technicianFilter !== 'all') && (
            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
              Filtres actifs
            </Badge>
          )}
        </div>

        <div className="grid gap-4">
          {filteredBillings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">
                  {filter === 'all' && technicianFilter === 'all' 
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
    </div>
  )
}

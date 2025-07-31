import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Check, Edit, Trash2, DollarSign, TrendingUp, Users, Filter, X, Clock, CheckCircle, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import type { BillingWithDetails, User } from '@/types/database'

export function AdminBillingTab() {
  const [billings, setBillings] = useState<BillingWithDetails[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'en_attente' | 'validé' | 'payé'>('all')
  const [technicianFilter, setTechnicianFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    totalAmount: 0,
    pendingAmount: 0,
    validatedAmount: 0,
    paidAmount: 0
  })

  useEffect(() => {
    fetchBillings()
    fetchTechnicians()
  }, [])

  // Recharger les données quand le composant devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBillings()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'technicien')
        .order('name')

      if (error) throw error

      setTechnicians(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens:', error)
    }
  }

  const fetchBillings = async () => {
    try {
      const { data, error } = await supabase
        .from('billing')
        .select(`
          *,
          missions (
            title,
            type,
            date_start,
            date_end
          ),
          users (
            name,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const billingData = data as BillingWithDetails[]
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

      fetchBillings()
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

      fetchBillings()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Chargement de la facturation...</div>
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
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Filtres</h3>
          </div>
          
          <div className="space-y-6">
            {/* Filtre par statut */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" />
                Statut de paiement
              </h4>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                  className={`transition-all duration-200 ${
                    filter === 'all' 
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-md' 
                      : 'hover:bg-blue-50 border-blue-200'
                  }`}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Toutes
                </Button>
                <Button
                  variant={filter === 'en_attente' ? 'default' : 'outline'}
                  onClick={() => setFilter('en_attente')}
                  size="sm"
                  className={`transition-all duration-200 ${
                    filter === 'en_attente' 
                      ? 'bg-yellow-600 hover:bg-yellow-700 shadow-md' 
                      : 'hover:bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  En attente
                </Button>
                <Button
                  variant={filter === 'validé' ? 'default' : 'outline'}
                  onClick={() => setFilter('validé')}
                  size="sm"
                  className={`transition-all duration-200 ${
                    filter === 'validé' 
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-md' 
                      : 'hover:bg-blue-50 border-blue-200'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validées
                </Button>
                <Button
                  variant={filter === 'payé' ? 'default' : 'outline'}
                  onClick={() => setFilter('payé')}
                  size="sm"
                  className={`transition-all duration-200 ${
                    filter === 'payé' 
                      ? 'bg-green-600 hover:bg-green-700 shadow-md' 
                      : 'hover:bg-green-50 border-green-200'
                  }`}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payées
                </Button>
              </div>
            </div>

            {/* Filtre par technicien */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                Technicien
              </h4>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={technicianFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setTechnicianFilter('all')}
                  size="sm"
                  className={`transition-all duration-200 ${
                    technicianFilter === 'all' 
                      ? 'bg-purple-600 hover:bg-purple-700 shadow-md' 
                      : 'hover:bg-purple-50 border-purple-200'
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Tous les techniciens
                </Button>
                {technicians.map((technician) => (
                  <Button
                    key={technician.id}
                    variant={technicianFilter === technician.id ? 'default' : 'outline'}
                    onClick={() => setTechnicianFilter(technician.id)}
                    size="sm"
                    className={`transition-all duration-200 ${
                      technicianFilter === technician.id 
                        ? 'bg-purple-600 hover:bg-purple-700 shadow-md' 
                        : 'hover:bg-purple-50 border-purple-200'
                    }`}
                  >
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
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
        <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">
                {filteredBillings.length} facturation{filteredBillings.length > 1 ? 's' : ''} 
                {filteredBillings.length !== billings.length && (
                  <span className="text-gray-500"> sur {billings.length} total</span>
                )}
              </span>
            </div>
            {(filter !== 'all' || technicianFilter !== 'all') && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                Filtres actifs
              </Badge>
            )}
          </div>
          {(filter !== 'all' || technicianFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilter('all')
                setTechnicianFilter('all')
              }}
              className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Effacer les filtres
            </Button>
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
                      <h4 className="font-medium">{billing.missions.title}</h4>
                      <p className="text-sm text-gray-600">{billing.users.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(billing.missions.date_start)}
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
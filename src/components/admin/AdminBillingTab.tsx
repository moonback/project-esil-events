import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Check, Edit, Trash2, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import type { BillingWithDetails } from '@/types/database'

export function AdminBillingTab() {
  const [billings, setBillings] = useState<BillingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'en_attente' | 'validé' | 'payé'>('all')
  const [stats, setStats] = useState({
    totalAmount: 0,
    pendingAmount: 0,
    validatedAmount: 0,
    paidAmount: 0
  })

  useEffect(() => {
    fetchBillings()
  }, [])

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

  const filteredBillings = filter === 'all' 
    ? billings 
    : billings.filter(billing => billing.status === filter)

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
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalAmount)}</p>
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
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(stats.pendingAmount)}</p>
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
                <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.validatedAmount)}</p>
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
                <p className="text-xl font-bold text-green-600">{formatCurrency(stats.paidAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex space-x-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          Toutes
        </Button>
        <Button
          variant={filter === 'en_attente' ? 'default' : 'outline'}
          onClick={() => setFilter('en_attente')}
          size="sm"
        >
          En attente
        </Button>
        <Button
          variant={filter === 'validé' ? 'default' : 'outline'}
          onClick={() => setFilter('validé')}
          size="sm"
        >
          Validées
        </Button>
        <Button
          variant={filter === 'payé' ? 'default' : 'outline'}
          onClick={() => setFilter('payé')}
          size="sm"
        >
          Payées
        </Button>
      </div>

      {/* Liste des facturations */}
      <div className="grid gap-4">
        {filteredBillings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">
                {filter === 'all' ? 'Aucune facturation' : `Aucune facturation ${filter}`}
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
  )
}
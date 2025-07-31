import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import type { BillingWithDetails } from '@/types/database'

export function TechnicianBillingTab() {
  const profile = useAuthStore(state => state.profile)
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
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Ma Facturation</h3>
        <p className="text-gray-600">
          Consultez vos rémunérations et leur statut de paiement
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total gagné</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-yellow-600" />
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
              <CheckCircle className="h-8 w-8 text-blue-600" />
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
              <DollarSign className="h-8 w-8 text-green-600" />
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
                  <div>
                    <h4 className="font-medium text-lg">{billing.missions.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {billing.missions.location} • {formatDate(billing.missions.date_start)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(billing.amount)}
                    </p>
                    <Badge className={getStatusColor(billing.status)}>
                      {billing.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Mission du {formatDate(billing.missions.date_start)}</span>
                  
                  {billing.payment_date && (
                    <span>Payé le {formatDate(billing.payment_date)}</span>
                  )}
                  
                  {billing.status === 'validé' && (
                    <span className="text-blue-600 font-medium">Paiement en cours</span>
                  )}
                </div>

                {billing.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm">
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
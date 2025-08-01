import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { BillingWithDetails } from '@/types/database'

interface PaymentSummaryCardProps {
  billings: BillingWithDetails[]
  onViewAll?: () => void
}

export function PaymentSummaryCard({ billings, onViewAll }: PaymentSummaryCardProps) {
  // Calculer les statistiques
  const stats = billings.reduce((acc, billing) => {
    acc.totalAmount += billing.amount
    
    switch (billing.status) {
      case 'en_attente':
        acc.pendingAmount += billing.amount
        acc.pendingCount++
        break
      case 'validé':
        acc.validatedAmount += billing.amount
        acc.validatedCount++
        break
      case 'payé':
        acc.paidAmount += billing.amount
        acc.paidCount++
        break
    }
    
    return acc
  }, {
    totalAmount: 0,
    pendingAmount: 0,
    validatedAmount: 0,
    paidAmount: 0,
    pendingCount: 0,
    validatedCount: 0,
    paidCount: 0
  })

  // Paiements récents (5 derniers)
  const recentBillings = billings
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Résumé des Paiements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalAmount)}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-600">
              {formatCurrency(stats.pendingAmount)}
            </div>
            <div className="text-sm text-gray-600">
              {stats.pendingCount} en attente
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">
              {formatCurrency(stats.validatedAmount)}
            </div>
            <div className="text-sm text-gray-600">
              {stats.validatedCount} validés
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(stats.paidAmount)}
            </div>
            <div className="text-sm text-gray-600">
              {stats.paidCount} payés
            </div>
          </div>
        </div>

        {/* Paiements récents */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Paiements Récents</h4>
            {onViewAll && (
              <Button variant="ghost" size="sm" onClick={onViewAll}>
                Voir tout
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {recentBillings.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Aucun paiement récent</p>
              </div>
            ) : (
              recentBillings.map((billing) => (
                <div key={billing.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {billing.users?.name || 'Technicien inconnu'}
                      </span>
                      <Badge className={getStatusColor(billing.status)}>
                        {billing.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {billing.missions?.title || 'Mission inconnue'}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatCurrency(billing.amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(billing.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alertes */}
        <div className="space-y-2">
          {stats.pendingCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {stats.pendingCount} paiement{stats.pendingCount > 1 ? 's' : ''} en attente de validation
              </span>
            </div>
          )}
          
          {stats.validatedCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                {stats.validatedCount} paiement{stats.validatedCount > 1 ? 's' : ''} validé{stats.validatedCount > 1 ? 's' : ''} en cours de traitement
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'en_attente':
      return 'bg-yellow-100 text-yellow-800'
    case 'validé':
      return 'bg-blue-100 text-blue-800'
    case 'payé':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
} 
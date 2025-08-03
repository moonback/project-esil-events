import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { 
  CreditCard, 
  Users, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Send,
  X,
  FileText,
  Building
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { useToast } from '@/lib/useToast'
import type { BillingWithDetails } from '@/types/database'

interface BulkPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  billings: BillingWithDetails[]
  onSuccess: () => void
}

export function BulkPaymentDialog({ 
  open, 
  onOpenChange, 
  billings, 
  onSuccess 
}: BulkPaymentDialogProps) {
  const { showSuccess, showError } = useToast()
  const [selectedBillings, setSelectedBillings] = useState<string[]>([])
  const [paymentNotes, setPaymentNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [groupedByTechnician, setGroupedByTechnician] = useState<Record<string, BillingWithDetails[]>>({})

  // Grouper les factures par technicien
  useEffect(() => {
    const grouped = billings.reduce((acc, billing) => {
      const technicianId = billing.technician_id
      if (!acc[technicianId]) {
        acc[technicianId] = []
      }
      acc[technicianId].push(billing)
      return acc
    }, {} as Record<string, BillingWithDetails[]>)
    
    setGroupedByTechnician(grouped)
  }, [billings])

  // Sélectionner toutes les factures validées par défaut
  useEffect(() => {
    const validatedBillings = billings
      .filter(b => b.status === 'validé')
      .map(b => b.id)
    setSelectedBillings(validatedBillings)
  }, [billings])

  const handleSelectAll = (technicianId: string) => {
    const technicianBillings = groupedByTechnician[technicianId] || []
    const validatedBillings = technicianBillings
      .filter(b => b.status === 'validé')
      .map(b => b.id)
    
    setSelectedBillings(prev => {
      const withoutTechnician = prev.filter(id => 
        !technicianBillings.some(b => b.id === id)
      )
      return [...withoutTechnician, ...validatedBillings]
    })
  }

  const handleUnselectAll = (technicianId: string) => {
    const technicianBillings = groupedByTechnician[technicianId] || []
    setSelectedBillings(prev => 
      prev.filter(id => !technicianBillings.some(b => b.id === id))
    )
  }

  const handleBillingToggle = (billingId: string) => {
    setSelectedBillings(prev => 
      prev.includes(billingId) 
        ? prev.filter(id => id !== billingId)
        : [...prev, billingId]
    )
  }

  const getSelectedBillings = () => {
    return billings.filter(b => selectedBillings.includes(b.id))
  }

  const getTotalAmount = () => {
    return getSelectedBillings().reduce((sum, b) => sum + b.amount, 0)
  }

  const getTechnicianSummary = () => {
    const selected = getSelectedBillings()
    const grouped = selected.reduce((acc, billing) => {
      const technicianId = billing.technician_id
      const technicianName = billing.users?.name || 'Technicien inconnu'
      
      if (!acc[technicianId]) {
        acc[technicianId] = {
          name: technicianName,
          billings: [],
          total: 0
        }
      }
      
      acc[technicianId].billings.push(billing)
      acc[technicianId].total += billing.amount
      
      return acc
    }, {} as Record<string, { name: string; billings: BillingWithDetails[]; total: number }>)
    
    return Object.values(grouped)
  }

  const processBulkPayment = async () => {
    if (selectedBillings.length === 0) {
      showError("Erreur", "Veuillez sélectionner au moins une facture à payer")
      return
    }

    setIsProcessing(true)

    try {
      const selectedBillingsData = getSelectedBillings()
      const technicianSummary = getTechnicianSummary()
      
      // Générer le message de notification pour chaque technicien
      const notifications = technicianSummary.map(summary => {
        const billingDetails = summary.billings.map(b => 
          `- ${b.missions?.title || 'Mission inconnue'} (${formatCurrency(b.amount)})`
        ).join('\n')
        
        return {
          technician_id: summary.billings[0].technician_id,
          message: `Paiement effectué pour ${summary.billings.length} facture(s) - Total: ${formatCurrency(summary.total)}\n\nFactures réglées:\n${billingDetails}${paymentNotes ? `\n\nNotes: ${paymentNotes}` : ''}`
        }
      })

      // Mettre à jour toutes les factures sélectionnées
      const { error: updateError } = await supabase
        .from('billing')
        .update({ 
          status: 'payé',
          payment_date: new Date().toISOString(),
          notes: paymentNotes || null
        })
        .in('id', selectedBillings)

      if (updateError) throw updateError

      // Créer des notifications pour les techniciens
      for (const notification of notifications) {
        try {
          // Utiliser une requête SQL directe pour contourner les politiques RLS
          const { error: notifError } = await supabase
            .rpc('create_notification', {
              p_user_id: notification.technician_id,
              p_title: 'Paiement effectué',
              p_message: notification.message,
              p_type: 'payment'
            })
          
          if (notifError) {
            console.warn('Erreur lors de la création de la notification:', notifError)
            // Fallback: essayer d'insérer directement
            const { error: directError } = await supabase
              .from('notifications')
              .insert({
                user_id: notification.technician_id,
                title: 'Paiement effectué',
                message: notification.message,
                type: 'payment',
                read: false
              })
            
            if (directError) {
              console.warn('Erreur lors de l\'insertion directe:', directError)
            } else {
              console.log('Notification créée pour le technicien:', notification.technician_id)
            }
          } else {
            console.log('Notification créée pour le technicien:', notification.technician_id)
          }
        } catch (notifError) {
          console.warn('Erreur lors de la création de la notification:', notifError)
        }
      }

      showSuccess(
        "Paiement en lot effectué",
        `${selectedBillings.length} facture(s) ont été marquées comme payées`
      )

      onSuccess()
      onOpenChange(false)
      
      // Réinitialiser le formulaire
      setSelectedBillings([])
      setPaymentNotes('')
      
    } catch (error) {
      console.error('Erreur lors du paiement en lot:', error)
      showError(
        "Erreur",
        "Impossible de traiter le paiement en lot"
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const selectedBillingsData = getSelectedBillings()
  const totalAmount = getTotalAmount()
  const technicianSummary = getTechnicianSummary()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Paiement en Lot
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Résumé du paiement */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <DollarSign className="h-5 w-5" />
                Résumé du Paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {selectedBillingsData.length}
                  </p>
                  <p className="text-sm text-green-600">Factures sélectionnées</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">
                    {formatCurrency(totalAmount)}
                  </p>
                  <p className="text-sm text-blue-600">Montant total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-700">
                    {technicianSummary.length}
                  </p>
                  <p className="text-sm text-purple-600">Techniciens concernés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sélection des factures par technicien */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Sélection des Factures</h3>
            
            {Object.entries(groupedByTechnician).map(([technicianId, technicianBillings]) => {
              const technician = technicianBillings[0]?.users
              const validatedBillings = technicianBillings.filter(b => b.status === 'validé')
              const selectedCount = technicianBillings.filter(b => selectedBillings.includes(b.id)).length
              
              return (
                <Card key={technicianId} className="border-gray-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{technician?.name || 'Technicien inconnu'}</CardTitle>
                          <p className="text-sm text-gray-600">
                            {validatedBillings.length} facture(s) validée(s) - {selectedCount} sélectionnée(s)
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectAll(technicianId)}
                          disabled={validatedBillings.length === 0}
                        >
                          Tout sélectionner
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnselectAll(technicianId)}
                        >
                          Tout désélectionner
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {technicianBillings
                        .filter(b => b.status === 'validé')
                        .map((billing) => (
                          <div key={billing.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <Checkbox
                              id={billing.id}
                              checked={selectedBillings.includes(billing.id)}
                              onCheckedChange={() => handleBillingToggle(billing.id)}
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {billing.missions?.title || 'Mission inconnue'}
                                  </p>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {billing.missions?.date_start ? formatDate(billing.missions.date_start) : 'Date inconnue'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Building className="h-3 w-3" />
                                      {billing.missions?.address || 'Adresse inconnue'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <p className="font-bold text-green-700">
                                    {formatCurrency(billing.amount)}
                                  </p>
                                  <Badge className={`${getStatusColor(billing.status)} mt-1`}>
                                    {billing.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      
                      {validatedBillings.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>Aucune facture validée pour ce technicien</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Notes de paiement */}
          <div className="space-y-3">
            <Label htmlFor="payment-notes" className="text-base font-medium">
              Notes pour les techniciens (optionnel)
            </Label>
            <Textarea
              id="payment-notes"
              placeholder="Ajoutez des informations supplémentaires pour les techniciens concernant ce paiement..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-sm text-gray-500">
              Ces notes seront incluses dans la notification envoyée aux techniciens
            </p>
          </div>

          {/* Aperçu des notifications */}
          {technicianSummary.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <FileText className="h-5 w-5" />
                  Aperçu des Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {technicianSummary.map((summary, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">{summary.name}</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {formatCurrency(summary.total)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {summary.billings.map((billing, billingIndex) => (
                          <div key={billingIndex} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{billing.missions?.title || 'Mission inconnue'}</span>
                            <span className="text-green-600 font-medium">
                              ({formatCurrency(billing.amount)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            
            <Button
              onClick={processBulkPayment}
              disabled={selectedBillings.length === 0 || isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Traitement...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Effectuer le Paiement ({selectedBillings.length} facture(s))
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
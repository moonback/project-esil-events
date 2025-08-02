import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useEmailService } from '@/services/emailService'
import { Calendar, DollarSign, Clock, MapPin, Plus, X, User as UserIcon, AlertCircle, CheckCircle, Eye } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { User, Mission, MissionAssignment, Billing } from '@/types/database'

interface CreatePaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  technician?: User
}

interface MissionWithAssignment extends Mission {
  assignment: MissionAssignment
}

interface BillingWithDetails extends Billing {
  missions: Mission
}

export function CreatePaymentDialog({ open, onOpenChange, technician: initialTechnician }: CreatePaymentDialogProps) {
  const { sendPaymentCreated } = useEmailService()
  const [loading, setLoading] = useState(false)
  const [loadingTechnicians, setLoadingTechnicians] = useState(false)
  const [technicians, setTechnicians] = useState<User[]>([])
  const [selectedTechnician, setSelectedTechnician] = useState<User | undefined>(initialTechnician)
  const [acceptedMissions, setAcceptedMissions] = useState<MissionWithAssignment[]>([])
  const [pendingBillings, setPendingBillings] = useState<BillingWithDetails[]>([])
  const [selectedMissions, setSelectedMissions] = useState<string[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [customAmount, setCustomAmount] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'new' | 'pending'>('new')

  useEffect(() => {
    if (open) {
      fetchTechnicians()
    }
  }, [open])

  useEffect(() => {
    if (selectedTechnician) {
      fetchAcceptedMissions()
      fetchPendingBillings()
    } else {
      setAcceptedMissions([])
      setPendingBillings([])
      setSelectedMissions([])
    }
  }, [selectedTechnician])

  useEffect(() => {
    // Calculer le montant total basé sur les missions sélectionnées
    const total = selectedMissions.reduce((sum, missionId) => {
      const mission = acceptedMissions.find(m => m.id === missionId)
      return sum + (mission?.forfeit || 0)
    }, 0)
    setTotalAmount(total)
  }, [selectedMissions, acceptedMissions])

  const fetchTechnicians = async () => {
    try {
      setLoadingTechnicians(true)
      console.log('Chargement des techniciens...')
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'technicien')
        .order('name')

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }
      
      console.log('Techniciens chargés:', data)
      setTechnicians(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens:', error)
    } finally {
      setLoadingTechnicians(false)
    }
  }

  const fetchAcceptedMissions = async () => {
    if (!selectedTechnician) return

    try {
      setLoading(true)
      console.log('Chargement des missions pour le technicien:', selectedTechnician.id)
      
      // Charger toutes les missions assignées au technicien (tous statuts)
      const { data, error } = await supabase
        .from('mission_assignments')
        .select(`
          *,
          missions (*)
        `)
        .eq('technician_id', selectedTechnician.id)
        .order('assigned_at', { ascending: false })

      if (error) {
        console.error('Erreur lors du chargement des assignments:', error)
        throw error
      }

      console.log('Assignments trouvés:', data)

      // Filtrer les missions qui n'ont pas encore de facturation
      const { data: existingBillings, error: billingError } = await supabase
        .from('billing')
        .select('mission_id')
        .eq('technician_id', selectedTechnician.id)

      if (billingError) {
        console.error('Erreur lors du chargement des facturations:', billingError)
      }

      console.log('Facturations existantes:', existingBillings)

      const billedMissionIds = new Set(existingBillings?.map(b => b.mission_id) || [])
      
      const missionsWithoutBilling = (data || []).filter(
        (assignment: any) => !billedMissionIds.has(assignment.mission_id)
      )

      console.log('Missions disponibles pour facturation:', missionsWithoutBilling)

      setAcceptedMissions(missionsWithoutBilling.map((item: any) => ({
        ...item.missions,
        assignment: {
          id: item.id,
          mission_id: item.mission_id,
          technician_id: item.technician_id,
          status: item.status,
          assigned_at: item.assigned_at,
          responded_at: item.responded_at
        }
      })))
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingBillings = async () => {
    if (!selectedTechnician) return

    try {
      const { data, error } = await supabase
        .from('billing')
        .select(`
          *,
          missions (*)
        `)
        .eq('technician_id', selectedTechnician.id)
        .eq('status', 'en_attente')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors du chargement des facturations en attente:', error)
        throw error
      }

      console.log('Facturations en attente:', data)
      setPendingBillings(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des facturations en attente:', error)
    }
  }

  const handleMissionToggle = (missionId: string) => {
    setSelectedMissions(prev => 
      prev.includes(missionId)
        ? prev.filter(id => id !== missionId)
        : [...prev, missionId]
    )
  }

  const handleSelectAll = () => {
    if (selectedMissions.length === acceptedMissions.length) {
      setSelectedMissions([])
    } else {
      setSelectedMissions(acceptedMissions.map(m => m.id))
    }
  }

  const handleCreatePayment = async () => {
    if (selectedMissions.length === 0) return

    try {
      setLoading(true)

      // Créer une facturation pour chaque mission sélectionnée
      const billingPromises = selectedMissions.map(missionId => {
        const mission = acceptedMissions.find(m => m.id === missionId)
        if (!mission) return null

        const amount = customAmount !== null ? customAmount / selectedMissions.length : mission.forfeit

        return supabase
          .from('billing')
          .insert({
            mission_id: missionId,
            technician_id: selectedTechnician!.id,
            amount: amount,
            status: 'en_attente',
            notes: notes || null
          })
      }).filter(Boolean)

      await Promise.all(billingPromises)

      // Envoyer un email au technicien
      if (selectedTechnician && selectedTechnician.email) {
        try {
          const selectedMissionsData = acceptedMissions.filter(m => selectedMissions.includes(m.id))
          const totalAmount = customAmount !== null ? customAmount : totalAmount
          
          await sendPaymentCreated(selectedTechnician, totalAmount, selectedMissionsData)
          console.log(`✅ Email de paiement envoyé à ${selectedTechnician.name} (${selectedTechnician.email})`)
        } catch (emailError) {
          console.error(`❌ Erreur lors de l'envoi de l'email de paiement:`, emailError)
        }
      }

      // Réinitialiser le formulaire et recharger les données
      setSelectedMissions([])
      setNotes('')
      setCustomAmount(null)
      await fetchPendingBillings()
      await fetchAcceptedMissions()

      console.log('Paiements créés avec succès')
    } catch (error) {
      console.error('Erreur lors de la création des paiements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBillingStatus = async (billingId: string, newStatus: 'validé' | 'payé') => {
    try {
      const { error } = await supabase
        .from('billing')
        .update({ status: newStatus })
        .eq('id', billingId)

      if (error) throw error

      // Recharger les facturations en attente
      await fetchPendingBillings()
      console.log(`Statut mis à jour vers ${newStatus}`)
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
    }
  }

  const selectedMissionsData = acceptedMissions.filter(m => selectedMissions.includes(m.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Gestion des paiements
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sélecteur de technicien */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Sélectionner un technicien
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="technician-select">Technicien</Label>
                {loadingTechnicians ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="text-center space-y-2">
                      <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                      <p className="text-sm text-gray-600">Chargement des techniciens...</p>
                    </div>
                  </div>
                ) : technicians.length === 0 ? (
                  <div className="text-center py-4">
                    <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun technicien trouvé</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Vérifiez que des techniciens existent dans la base de données
                    </p>
                  </div>
                ) : (
                  <select
                    id="technician-select"
                    value={selectedTechnician?.id || ''}
                    onChange={(e) => {
                      const tech = technicians.find(t => t.id === e.target.value)
                      setSelectedTechnician(tech)
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionnez un technicien</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} ({tech.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informations du technicien */}
          {selectedTechnician && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Technicien sélectionné
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nom</Label>
                    <p className="text-lg font-semibold">{selectedTechnician?.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-sm">{selectedTechnician?.email || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Téléphone</Label>
                    <p className="text-sm">{selectedTechnician?.phone || 'Non renseigné'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Onglets pour nouveaux paiements et paiements en attente */}
          {selectedTechnician && (
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('new')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'new'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Nouveaux paiements ({acceptedMissions.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Paiements en attente ({pendingBillings.length})
              </button>
            </div>
          )}

          {/* Contenu des onglets */}
          {selectedTechnician && activeTab === 'new' && (
            <>
              {/* Sélection des missions pour nouveaux paiements */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Missions disponibles ({acceptedMissions.length})
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={acceptedMissions.length === 0}
                    >
                      {selectedMissions.length === acceptedMissions.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center space-y-2">
                        <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                        <p className="text-sm text-gray-600">Chargement des missions...</p>
                      </div>
                    </div>
                  ) : acceptedMissions.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune mission disponible</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Toutes les missions ont déjà été facturées ou aucune mission n'est assignée
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {acceptedMissions.map((mission) => (
                        <div
                          key={mission.id}
                          className={`p-4 border rounded-lg transition-colors ${
                            selectedMissions.includes(mission.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedMissions.includes(mission.id)}
                              onCheckedChange={() => handleMissionToggle(mission.id)}
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-lg">{mission.title}</h4>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {mission.location}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {formatDate(mission.date_start)}
                                    </div>
                                    <Badge variant="secondary">{mission.type}</Badge>
                                    <Badge variant={mission.assignment?.status === 'accepté' ? 'default' : 'outline'}>
                                      {mission.assignment?.status === 'accepté' ? 'Acceptée' : 'Proposée'}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-600">
                                    {formatCurrency(mission.forfeit)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Forfait
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Résumé et options pour nouveaux paiements */}
              {selectedMissions.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Résumé du paiement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Missions sélectionnées
                        </Label>
                        <p className="text-lg font-semibold">
                          {selectedMissions.length} mission{selectedMissions.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Montant total
                        </Label>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(customAmount !== null ? customAmount : totalAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Montant personnalisé */}
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Montant personnalisé (optionnel)
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          placeholder="Montant total personnalisé"
                          value={customAmount || ''}
                          onChange={(e) => setCustomAmount(e.target.value ? parseFloat(e.target.value) : null)}
                          className="flex-1"
                        />
                        {customAmount !== null && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCustomAmount(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {customAmount !== null && (
                        <p className="text-sm text-gray-500 mt-1">
                          {formatCurrency(customAmount / selectedMissions.length)} par mission
                        </p>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Notes (optionnel)
                      </Label>
                      <Textarea
                        placeholder="Ajouter des notes pour ce paiement..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    {/* Détail des missions sélectionnées */}
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Missions incluses
                      </Label>
                      <div className="mt-2 space-y-2">
                        {selectedMissionsData.map((mission) => (
                          <div key={mission.id} className="flex items-center justify-between text-sm">
                            <span className="truncate">{mission.title}</span>
                            <span className="font-medium">
                              {formatCurrency(customAmount !== null ? customAmount / selectedMissions.length : mission.forfeit)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Paiements en attente */}
          {selectedTechnician && activeTab === 'pending' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Paiements en attente ({pendingBillings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingBillings.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun paiement en attente</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Tous les paiements ont été traités
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingBillings.map((billing) => (
                      <div key={billing.id} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-lg">{billing.missions.title}</h4>
                              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                En attente
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {billing.missions.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDate(billing.missions.date_start)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(billing.created_at)}
                              </div>
                            </div>
                            {billing.notes && (
                              <div className="mt-2 p-2 bg-white rounded border">
                                <p className="text-sm text-gray-700">{billing.notes}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right ml-4">
                            <p className="text-2xl font-bold text-orange-600">
                              {formatCurrency(billing.amount)}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateBillingStatus(billing.id, 'validé')}
                                className="text-green-600 border-green-300 hover:bg-green-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Valider
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateBillingStatus(billing.id, 'payé')}
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Marquer payé
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Fermer
          </Button>
          {activeTab === 'new' && (
            <Button
              onClick={handleCreatePayment}
              disabled={loading || selectedMissions.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le paiement
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminStore } from '@/store/adminStore'
import { useToast } from '@/lib/useToast'
import { useTabPersistence } from '@/lib/useTabPersistence'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TechnicianContactDialog } from './TechnicianContactDialog'
import { CreatePaymentDialog } from './CreatePaymentDialog'
import { PersistenceNotification } from '@/components/ui/persistence-notification'
import { 
  Phone, 
  Users, 
  Calendar,
  CheckCircle, 
  XCircle, 
  Clock, 
  Euro,
  MapPin,
  AlertTriangle,
  Star,
  Search,
  Filter,
  MoreHorizontal,
  DollarSign,
  Activity,
  Award,
  UserCheck,
  UserX,
  Clock3,
  Contact,
  Mail,
  Ban,
  CheckCircle2,
  Clock4,
  Plus,
  Trash2,
  Target,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { User, MissionAssignment, Mission, Availability, Unavailability, Billing, TechnicianWithStats } from '@/types/database'

export function TechniciansTab() {
  const { technicians, loading, stats, validateTechnician, fetchTechnicians, deleteTechnician, cacheValid, isDataStale } = useAdminStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianWithStats | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'missions' | 'revenue' | 'rating'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable' | 'available_on_request'>('all')
  const [validationFilter, setValidationFilter] = useState<'all' | 'validated' | 'not_validated'>('all')
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [selectedTechnicianForContact, setSelectedTechnicianForContact] = useState<User | null>(null)
  const [createPaymentDialogOpen, setCreatePaymentDialogOpen] = useState(false)
  const [selectedTechnicianForPayment, setSelectedTechnicianForPayment] = useState<User | null>(null)
  const [validationLoading, setValidationLoading] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const { showSuccess, showError } = useToast()

  // Utiliser le hook de persistance d'onglet
  const { isActive } = useTabPersistence({
    tabId: 'technicians',
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
    onTabActivate: () => {
      console.log('📱 Onglet Techniciens activé')
      const shouldForceRefresh = !cacheValid.technicians || isDataStale('technicians')
      fetchTechnicians(shouldForceRefresh)
    },
    onTabDeactivate: () => {
      console.log('📱 Onglet Techniciens désactivé')
    }
  })

  // Charger les données des techniciens au montage du composant avec gestion du cache
  useEffect(() => {
    if (technicians.length === 0 && !loading.technicians) {
      const shouldForceRefresh = !cacheValid.technicians || isDataStale('technicians')
      fetchTechnicians(shouldForceRefresh)
    }
  }, [technicians.length, loading.technicians, fetchTechnicians, cacheValid.technicians, isDataStale])

  // Fonction pour déterminer le statut de disponibilité d'un technicien
  const getAvailabilityStatus = (technician: TechnicianWithStats) => {
    const now = new Date()
    const currentTime = now.getTime()
    
    // Vérifier d'abord s'il y a une indisponibilité actuelle
    const currentUnavailability = technician.unavailabilities?.find(unavail => {
      const start = parseISO(unavail.start_time)
      const end = parseISO(unavail.end_time)
      return currentTime >= start.getTime() && currentTime <= end.getTime()
    })
    
    if (currentUnavailability) {
      return {
        status: 'indisponible',
        text: 'Indisponible',
        color: 'bg-red-100 text-red-800',
        icon: Ban,
        reason: currentUnavailability.reason || 'Indisponible'
      }
    }
    
    // Vérifier s'il y a une disponibilité explicite actuelle
    const currentAvailability = technician.availabilities?.find(avail => {
      const start = parseISO(avail.start_time)
      const end = parseISO(avail.end_time)
      return currentTime >= start.getTime() && currentTime <= end.getTime()
    })
    
    if (currentAvailability) {
      return {
        status: 'disponible',
        text: 'Disponible',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle2,
        reason: 'Disponible maintenant'
      }
    }
    
    // Vérifier s'il y a une disponibilité future dans les prochaines 24h
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const futureAvailability = technician.availabilities?.find(avail => {
      const start = parseISO(avail.start_time)
      return start.getTime() <= tomorrow.getTime() && start.getTime() > currentTime
    })
    
    if (futureAvailability) {
      return {
        status: 'disponible_soon',
        text: 'Disponible bientôt',
        color: 'bg-blue-100 text-blue-800',
        icon: Clock4,
        reason: `Disponible le ${format(parseISO(futureAvailability.start_time), 'dd/MM à HH:mm', { locale: fr })}`
      }
    }
    
    // Si le technicien n'a pas de disponibilités explicites, il est "Disponible sur demande"
    return {
      status: 'available_on_request',
      text: 'Disponible sur demande',
      color: 'bg-yellow-100 text-yellow-800',
      icon: AlertTriangle,
      reason: 'Contactez le technicien pour vérifier sa disponibilité'
    }
  }

  // Mémoisation des techniciens filtrés pour éviter les re-renders inutiles
  const filteredTechnicians = useMemo(() => {
    let filtered = technicians

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(tech => 
        tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.phone?.includes(searchTerm)
      )
    }

    // Filtrage par disponibilité
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(tech => {
        const status = getAvailabilityStatus(tech)
        return status.status === availabilityFilter
      })
    }

    // Filtrage par validation
    if (validationFilter !== 'all') {
      filtered = filtered.filter(tech => {
        if (validationFilter === 'validated') return tech.is_validated
        return !tech.is_validated
      })
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'missions':
          aValue = a.stats?.totalAssignments || 0
          bValue = b.stats?.totalAssignments || 0
          break
        case 'revenue':
          aValue = a.stats?.totalRevenue || 0
          bValue = b.stats?.totalRevenue || 0
          break
        case 'rating':
          // Note moyenne temporairement désactivée
          aValue = 0
          bValue = 0
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [technicians, searchTerm, availabilityFilter, validationFilter, sortBy, sortOrder])

  // Fonction pour forcer le rafraîchissement
  const handleForceRefresh = async () => {
    console.log('🔄 Forçage du rafraîchissement des techniciens')
    await fetchTechnicians(true)
    showSuccess('Données mises à jour', 'Les techniciens ont été rechargés avec succès.')
  }

  const handleOpenContact = (technician: User) => {
    setSelectedTechnicianForContact(technician)
    setContactDialogOpen(true)
  }

  const handleContactUpdated = () => {
    // Les données seront actualisées automatiquement via le store
    console.log('Contact mis à jour')
  }

  const handleCreatePayment = (technician: User) => {
    setSelectedTechnicianForPayment(technician)
    setCreatePaymentDialogOpen(true)
  }

  const handleValidateTechnician = async (technicianId: string, isValidated: boolean) => {
    try {
      setValidationLoading(technicianId)
      await validateTechnician(technicianId, isValidated)
      
      showSuccess(
        isValidated ? 'Technicien validé' : 'Technicien dévalidé',
        isValidated 
          ? 'Le technicien a été validé avec succès. Les demandes en attente peuvent être automatiquement annulées.'
          : 'Le technicien a été dévalidé avec succès.'
      )
    } catch (error) {
      console.error('Erreur lors de la validation du technicien:', error)
      showError(
        'Erreur',
        'Une erreur est survenue lors de la validation du technicien.'
      )
    } finally {
      setValidationLoading(null)
    }
  }

  const handleDeleteTechnician = async (technicianId: string, technicianName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le technicien "${technicianName}" ? Cette action est irréversible.`)) {
      return
    }

    try {
      setDeleteLoading(technicianId)
      await deleteTechnician(technicianId)
      
      showSuccess(
        'Technicien supprimé',
        `Le technicien "${technicianName}" a été supprimé avec succès.`
      )
    } catch (error) {
      console.error('Erreur lors de la suppression du technicien:', error)
      showError(
        'Erreur',
        'Une erreur est survenue lors de la suppression du technicien.'
      )
    } finally {
      setDeleteLoading(null)
    }
  }

  if (loading.technicians) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Chargement des techniciens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* En-tête avec recherche et filtres */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestion des Techniciens</h2>
          <p className="text-sm text-gray-500 mt-1">
            {technicians.length} technicien{technicians.length > 1 ? 's' : ''} au total • 
            <span className="text-green-600 font-medium ml-1">
              {technicians.filter(tech => tech.is_validated).length} validé{technicians.filter(tech => tech.is_validated).length > 1 ? 's' : ''}
            </span>
          </p>
        </div>
                 <div className="flex items-center space-x-2">
           <Badge variant="outline" className="bg-blue-50 text-blue-700">
             <Target className="h-3 w-3 mr-1" />
             Gestion des équipes
           </Badge>
           
           {/* Indicateur de statut du cache */}
           <div className="flex items-center space-x-2">
             {isActive && (
               <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                 <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1" />
                 Actif
               </Badge>
             )}
             {cacheValid.technicians && !isDataStale('technicians') ? (
               <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                 <CheckCircle className="h-3 w-3 mr-1" />
                 Données à jour
               </Badge>
             ) : (
               <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                 <AlertCircle className="h-3 w-3 mr-1" />
                 Données obsolètes
               </Badge>
             )}
             
             <Button
               variant="outline"
               size="sm"
               onClick={handleForceRefresh}
               disabled={loading.technicians}
               className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 border-gray-300"
             >
               <RefreshCw className={`h-4 w-4 mr-1 ${loading.technicians ? 'animate-spin' : ''}`} />
               Rafraîchir
             </Button>
             
             <Button 
               variant="outline" 
               size="sm"
               onClick={() => setShowFilters(!showFilters)}
             >
               <Filter className="h-4 w-4 mr-2" />
               Filtres
             </Button>
           </div>
         </div>
      </div>

      {/* Barre de recherche */}
      <div className="px-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un technicien..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="px-6">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs font-medium mb-2 block">Trier par</Label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="name">Nom</option>
                    <option value="missions">Nombre de missions</option>
                    <option value="revenue">Revenus</option>
                    {/* <option value="rating">Note moyenne</option> */}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-2 block">Ordre</Label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="asc">Croissant</option>
                    <option value="desc">Décroissant</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-2 block">Disponibilité</Label>
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="all">Tous</option>
                    <option value="available">Disponibles</option>
                    <option value="unavailable">Indisponibles</option>
                    <option value="available_on_request">Disponible sur demande</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-2 block">Validation</Label>
                  <select
                    value={validationFilter}
                    onChange={(e) => setValidationFilter(e.target.value as any)}
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="all">Tous</option>
                    <option value="validated">Validés</option>
                    <option value="not_validated">Non validés</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Liste des techniciens */}
      <div className="px-6">
        {filteredTechnicians.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun technicien trouvé</h3>
            <p className="text-gray-500 text-sm">Les techniciens apparaîtront ici une fois ajoutés</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTechnicians.map((technician) => (
              <Card key={technician.id} className="border border-gray-200 hover:border-indigo-200 transition-all duration-200 shadow-sm hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* En-tête du technicien */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                            {technician.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{technician.name}</h3>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                              <Badge variant="secondary" className="text-xs">Technicien</Badge>
                              {technician.is_validated && (
                                <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Validé
                                </Badge>
                              )}
                              {technician.phone && (
                                <div className="flex items-center space-x-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{technician.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const availabilityStatus = getAvailabilityStatus(technician)
                            const Icon = availabilityStatus.icon
                            return (
                              <Badge className={availabilityStatus.color} title={availabilityStatus.reason}>
                                <Icon className="h-3 w-3 mr-1" />
                                {availabilityStatus.text}
                              </Badge>
                            )
                          })()}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenContact(technician)}
                            title="Voir les informations de contact"
                            className="hover:bg-blue-50"
                          >
                            <Contact className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreatePayment(technician)}
                            title="Créer un paiement"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleValidateTechnician(technician.id, !technician.is_validated)}
                            title={technician.is_validated ? 'Dévalider le technicien' : 'Valider le technicien'}
                            disabled={validationLoading === technician.id}
                            className={technician.is_validated ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'}
                          >
                            {validationLoading === technician.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : technician.is_validated ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTechnician(technician.id, technician.name)}
                            title="Supprimer le technicien"
                            disabled={deleteLoading === technician.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleteLoading === technician.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTechnician(selectedTechnician?.id === technician.id ? null : technician)}
                            className="hover:bg-gray-50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button> */}
                        </div>
                      </div>

                      {/* Statistiques principales */}
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{technician.stats?.totalAssignments || 0}</p>
                            <p className="text-xs text-gray-500">Missions</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Euro className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{technician.stats?.totalRevenue || 0}€</p>
                            <p className="text-xs text-gray-500">Revenus</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Clock3 className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{technician.stats?.totalHours || 0}h</p>
                            <p className="text-xs text-gray-500">Heures</p>
                          </div>
                        </div>
                      </div>

                      {/* Barre de progression */}
                      {(technician.stats?.totalAssignments || 0) > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-gray-500">Taux d'acceptation</span>
                            <span className="font-medium">
                              {Math.round(((technician.stats?.acceptedAssignments || 0) / (technician.stats?.totalAssignments || 1)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${((technician.stats?.acceptedAssignments || 0) / (technician.stats?.totalAssignments || 1)) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogue de contact */}
      {contactDialogOpen && selectedTechnicianForContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Contact du technicien</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Nom</label>
                <p className="text-gray-900">{selectedTechnicianForContact.name}</p>
              </div>
              {selectedTechnicianForContact.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Téléphone</label>
                  <p className="text-gray-900">{selectedTechnicianForContact.phone}</p>
                </div>
              )}
              {selectedTechnicianForContact.email && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedTechnicianForContact.email}</p>
                </div>
              )}
              {selectedTechnicianForContact.address && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Adresse</label>
                  <p className="text-gray-900">{selectedTechnicianForContact.address}</p>
                </div>
              )}
              {selectedTechnicianForContact.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-gray-900">{selectedTechnicianForContact.notes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setContactDialogOpen(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogue de création de paiement */}
      <CreatePaymentDialog
        technician={selectedTechnicianForPayment || undefined}
        open={createPaymentDialogOpen}
        onOpenChange={setCreatePaymentDialogOpen}
      />

      {/* Notification de persistance */}
      <PersistenceNotification />
    </div>
  )
}
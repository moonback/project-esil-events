import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminStore } from '@/store/adminStore'
import { useToast } from '@/lib/useToast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TechnicianContactDialog } from './TechnicianContactDialog'
import { CreatePaymentDialog } from './CreatePaymentDialog'
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
  Target
} from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { User, MissionAssignment, Mission, Availability, Unavailability, Billing, TechnicianWithStats } from '@/types/database'

export function TechniciansTab() {
  const { technicians, loading, stats, validateTechnician, fetchTechnicians, deleteTechnician } = useAdminStore()
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

  // Charger les données des techniciens au montage du composant
  useEffect(() => {
    if (technicians.length === 0 && !loading.technicians) {
      fetchTechnicians()
    }
  }, [technicians.length, loading.technicians, fetchTechnicians])

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



  // Les données sont maintenant gérées par le store admin avec les statistiques calculées

  const filteredTechnicians = technicians.filter(tech => {
    // Filtre par recherche
    const matchesSearch = tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tech.phone?.includes(searchTerm)
    
    if (!matchesSearch) return false
    
    // Filtre par disponibilité
    if (availabilityFilter !== 'all') {
      const availabilityStatus = getAvailabilityStatus(tech)
      if (availabilityFilter === 'available' && availabilityStatus.status !== 'disponible') return false
      if (availabilityFilter === 'unavailable' && availabilityStatus.status !== 'indisponible') return false
      if (availabilityFilter === 'available_on_request' && availabilityStatus.status !== 'available_on_request') return false
    }
    
    // Filtre par validation
    if (validationFilter !== 'all') {
      if (validationFilter === 'validated' && !tech.is_validated) return false
      if (validationFilter === 'not_validated' && tech.is_validated) return false
    }
    
    return true
  })

  const sortedTechnicians = [...filteredTechnicians].sort((a, b) => {
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
        {sortedTechnicians.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun technicien trouvé</h3>
            <p className="text-gray-500 text-sm">Les techniciens apparaîtront ici une fois ajoutés</p>
          </div>
        ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {sortedTechnicians.map((technician) => (
               <Card key={technician.id} className="group relative overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 hover:from-white hover:to-indigo-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
                 <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                 <CardContent className="relative p-6">
                   <div className="flex items-start justify-between">
                     <div className="flex-1 min-w-0">
                       {/* En-tête du technicien */}
                       <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center space-x-4">
                           <div className="relative">
                             <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                               {technician.name.charAt(0)}
                             </div>
                             {technician.is_validated && (
                               <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                                 <UserCheck className="h-3 w-3 text-white" />
                               </div>
                             )}
                           </div>
                           <div>
                             <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-900 transition-colors duration-300">{technician.name}</h3>
                             <div className="flex items-center space-x-2 text-xs text-gray-500 mt-2">
                               <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 border-0">Technicien</Badge>
                               {technician.phone && (
                                 <div className="flex items-center space-x-1 text-gray-400">
                                   <Phone className="h-3 w-3" />
                                   <span className="text-xs">{technician.phone}</span>
                                 </div>
                               )}
                             </div>
                           </div>
                         </div>
                        
                                                 <div className="flex items-center space-x-1">
                           {(() => {
                             const availabilityStatus = getAvailabilityStatus(technician)
                             const Icon = availabilityStatus.icon
                             return (
                               <Badge className={`${availabilityStatus.color} text-xs font-medium px-2 py-1 rounded-full shadow-sm`} title={availabilityStatus.reason}>
                                 <Icon className="h-3 w-3 mr-1" />
                                 {availabilityStatus.text}
                               </Badge>
                             )
                           })()}
                           
                           <div className="flex items-center space-x-1 ml-2">
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleOpenContact(technician)}
                               title="Voir les informations de contact"
                               className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                             >
                               <Contact className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleCreatePayment(technician)}
                               title="Créer un paiement"
                               className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200"
                             >
                               <Plus className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleValidateTechnician(technician.id, !technician.is_validated)}
                               title={technician.is_validated ? 'Dévalider le technicien' : 'Valider le technicien'}
                               disabled={validationLoading === technician.id}
                               className={`h-8 w-8 p-0 transition-all duration-200 ${
                                 technician.is_validated 
                                   ? 'text-red-600 hover:text-red-700 hover:bg-red-50' 
                                   : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                               }`}
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
                               className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                             >
                               {deleteLoading === technician.id ? (
                                 <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                               ) : (
                                 <Trash2 className="h-4 w-4" />
                               )}
                             </Button>
                           </div>
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
                       <div className="grid grid-cols-3 gap-4 mb-6">
                         <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                           <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md">
                             <Calendar className="h-5 w-5 text-white" />
                           </div>
                           <p className="text-2xl font-bold text-blue-900">{technician.stats?.totalAssignments || 0}</p>
                           <p className="text-xs text-blue-700 font-medium">Missions</p>
                         </div>
                         
                         <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center group-hover:from-green-100 group-hover:to-green-200 transition-all duration-300">
                           <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md">
                             <Euro className="h-5 w-5 text-white" />
                           </div>
                           <p className="text-2xl font-bold text-green-900">{technician.stats?.totalRevenue || 0}€</p>
                           <p className="text-xs text-green-700 font-medium">Revenus</p>
                         </div>
                         
                         <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 text-center group-hover:from-orange-100 group-hover:to-orange-200 transition-all duration-300">
                           <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md">
                             <Clock3 className="h-5 w-5 text-white" />
                           </div>
                           <p className="text-2xl font-bold text-orange-900">{technician.stats?.totalHours || 0}h</p>
                           <p className="text-xs text-orange-700 font-medium">Heures</p>
                         </div>
                       </div>

                                             {/* Barre de progression */}
                       {(technician.stats?.totalAssignments || 0) > 0 && (
                         <div className="mb-4">
                           <div className="flex items-center justify-between text-sm mb-3">
                             <span className="text-gray-600 font-medium">Taux d'acceptation</span>
                             <span className="font-bold text-green-600">
                               {Math.round(((technician.stats?.acceptedAssignments || 0) / (technician.stats?.totalAssignments || 1)) * 100)}%
                             </span>
                           </div>
                           <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                             <div
                               className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-500 shadow-sm"
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
    </div>
  )
}
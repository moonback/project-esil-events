import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAdminStore } from '@/store/adminStore'
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
  TrendingUp,
  AlertTriangle,
  Star,
  Eye,
  EyeOff,
  Search,
  Filter,
  MoreHorizontal,
  CalendarDays,
  DollarSign,
  Activity,
  Award,
  UserCheck,
  UserX,
  Clock3,
  CalendarCheck,
  CalendarX,
  Contact,
  Mail,
  Ban,
  CheckCircle2,
  Clock4,
  Plus
} from 'lucide-react'
import { format, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { User, MissionAssignment, Mission, Availability, Unavailability, Billing, TechnicianWithStats } from '@/types/database'

export function TechniciansTab() {
  const { technicians, loading, stats } = useAdminStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [showDetailedView, setShowDetailedView] = useState(false)
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianWithStats | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'missions' | 'revenue' | 'rating'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable' | 'unknown'>('all')
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [selectedTechnicianForContact, setSelectedTechnicianForContact] = useState<User | null>(null)
  const [createPaymentDialogOpen, setCreatePaymentDialogOpen] = useState(false)
  const [selectedTechnicianForPayment, setSelectedTechnicianForPayment] = useState<User | null>(null)

  // Fonction pour déterminer le statut de disponibilité d'un technicien
  const getAvailabilityStatus = (technician: TechnicianWithStats) => {
    const now = new Date()
    const currentTime = now.getTime()
    
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
    
    return {
      status: 'unknown',
      text: 'Statut inconnu',
      color: 'bg-gray-100 text-gray-800',
      icon: AlertTriangle,
      reason: 'Aucune disponibilité définie'
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
      if (availabilityFilter === 'unknown' && availabilityStatus.status !== 'unknown') return false
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
        aValue = a.stats?.averageRating || 0
        bValue = b.stats?.averageRating || 0
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

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-blue-600'
    if (rating >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadge = (rating: number) => {
    if (rating >= 4.5) return { text: 'Excellent', color: 'bg-green-100 text-green-800' }
    if (rating >= 4.0) return { text: 'Bon', color: 'bg-blue-100 text-blue-800' }
    if (rating >= 3.5) return { text: 'Moyen', color: 'bg-yellow-100 text-yellow-800' }
    return { text: 'À améliorer', color: 'bg-red-100 text-red-800' }
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

  if (loading.technicians) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Chargement des techniciens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec recherche et filtres */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Techniciens</h2>
          <p className="text-sm text-gray-500">{technicians.length} technicien{technicians.length > 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDetailedView(!showDetailedView)}
          >
            {showDetailedView ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showDetailedView ? 'Vue compacte' : 'Vue détaillée'}
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
                    <option value="rating">Note moyenne</option>
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
                    <option value="unknown">Statut inconnu</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-6">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total missions</p>
              <p className="text-lg font-bold text-gray-900">
                {technicians.reduce((sum, tech) => sum + (tech.stats?.totalAssignments || 0), 0)}
              </p>
            </div>
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Revenus totaux</p>
              <p className="text-lg font-bold text-green-600">
                {technicians.reduce((sum, tech) => sum + (tech.stats?.totalRevenue || 0), 0)}€
              </p>
            </div>
            <Euro className="h-5 w-5 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Note moyenne</p>
              <p className="text-lg font-bold text-purple-600">
                {technicians.length > 0 
                  ? (technicians.reduce((sum, tech) => sum + (tech.stats?.averageRating || 0), 0) / technicians.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
            <Star className="h-5 w-5 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Heures totales</p>
              <p className="text-lg font-bold text-orange-600">
                {technicians.reduce((sum, tech) => sum + (tech.stats?.totalHours || 0), 0)}h
              </p>
            </div>
            <Clock3 className="h-5 w-5 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Disponibles</p>
              <p className="text-lg font-bold text-green-600">
                {technicians.filter(tech => getAvailabilityStatus(tech).status === 'disponible').length}
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
        </div>
      </div>

      {/* Liste des techniciens */}
      <div className="px-6">
        {sortedTechnicians.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Aucun technicien trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sortedTechnicians.map((technician) => (
              <Card key={technician.id} className="border border-gray-200 hover:border-indigo-200 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* En-tête du technicien */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {technician.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">{technician.name}</h3>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <Badge variant="secondary" className="text-xs">Technicien</Badge>
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
                          <Badge className={getPerformanceBadge(technician.stats?.averageRating || 0).color}>
                            {getPerformanceBadge(technician.stats?.averageRating || 0).text}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenContact(technician)}
                            title="Voir les informations de contact"
                          >
                            <Contact className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreatePayment(technician)}
                            title="Créer un paiement"
                            className="text-green-600 hover:text-green-700"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTechnician(selectedTechnician?.id === technician.id ? null : technician)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Statistiques principales */}
                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          <span>{technician.stats?.totalAssignments || 0} missions</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Euro className="h-3 w-3 text-green-500" />
                          <span>{technician.stats?.totalRevenue || 0}€</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Star className={`h-3 w-3 ${getPerformanceColor(technician.stats?.averageRating || 0)}`} />
                          <span>{(technician.stats?.averageRating || 0).toFixed(1)}/5</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Clock3 className="h-3 w-3 text-orange-500" />
                          <span>{technician.stats?.totalHours || 0}h</span>
                        </div>
                      </div>

                      {/* Barre de progression */}
                      {(technician.stats?.totalAssignments || 0) > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
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

                      {/* Vue détaillée */}
                      {showDetailedView && selectedTechnician?.id === technician.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                          {/* Missions récentes */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <CalendarDays className="h-4 w-4 mr-2" />
                              Missions récentes
                            </h4>
                            <div className="space-y-2">
                              {technician.recentMissions && technician.recentMissions.length > 0 ? (
                                technician.recentMissions.map((mission) => (
                                  <div key={mission.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                    <div className="flex-1">
                                      <div className="font-medium">{mission.title}</div>
                                      <div className="text-gray-500">{mission.location}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-medium">{mission.forfeit}€</div>
                                      <div className="text-gray-500">
                                        {format(parseISO(mission.date_start), 'dd/MM', { locale: fr })}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-gray-500 text-xs">Aucune mission récente</div>
                              )}
                            </div>
                          </div>

                          {/* Informations de contact */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <Contact className="h-4 w-4 mr-2" />
                              Informations de contact
                            </h4>
                            <div className="space-y-2">
                              {technician.phone && (
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                  <div className="flex items-center">
                                    <Phone className="h-3 w-3 mr-2" />
                                    <span className="text-gray-500">Téléphone</span>
                                  </div>
                                  <span className="font-medium">{technician.phone}</span>
                                </div>
                              )}
                              {technician.email && (
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                  <div className="flex items-center">
                                    <Mail className="h-3 w-3 mr-2" />
                                    <span className="text-gray-500">Email</span>
                                  </div>
                                  <span className="font-medium">{technician.email}</span>
                                </div>
                              )}
                              {technician.address && (
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                  <div className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-2" />
                                    <span className="text-gray-500">Adresse</span>
                                  </div>
                                  <span className="font-medium">{technician.address}</span>
                                </div>
                              )}
                              {(!technician.phone && !technician.email && !technician.address) && (
                                <div className="text-gray-500 text-xs">Aucune information de contact</div>
                              )}
                            </div>
                          </div>

                          {/* Disponibilités */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <CalendarCheck className="h-4 w-4 mr-2" />
                              Disponibilités ({technician.availabilities?.length || 0})
                            </h4>
                            <div className="space-y-1">
                              {technician.availabilities && technician.availabilities.length > 0 ? (
                                technician.availabilities.slice(0, 3).map((availability) => (
                                  <div key={availability.id} className="flex items-center justify-between p-2 bg-blue-50 rounded text-xs">
                                    <div>
                                      {format(parseISO(availability.start_time), 'dd/MM HH:mm', { locale: fr })} - 
                                      {format(parseISO(availability.end_time), 'HH:mm', { locale: fr })}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-gray-500 text-xs">Aucune disponibilité</div>
                              )}
                            </div>
                          </div>

                          {/* Indisponibilités */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <CalendarX className="h-4 w-4 mr-2" />
                              Indisponibilités ({technician.unavailabilities?.length || 0})
                            </h4>
                            <div className="space-y-1">
                              {technician.unavailabilities && technician.unavailabilities.length > 0 ? (
                                technician.unavailabilities.slice(0, 3).map((unavailability) => (
                                  <div key={unavailability.id} className="flex items-center justify-between p-2 bg-red-50 rounded text-xs">
                                    <div>
                                      <div>
                                        {format(parseISO(unavailability.start_time), 'dd/MM HH:mm', { locale: fr })} - 
                                        {format(parseISO(unavailability.end_time), 'HH:mm', { locale: fr })}
                                      </div>
                                      {unavailability.reason && (
                                        <div className="text-gray-600 mt-1">
                                          <Ban className="h-3 w-3 inline mr-1" />
                                          {unavailability.reason}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-gray-500 text-xs">Aucune indisponibilité</div>
                              )}
                            </div>
                          </div>

                          {/* Statistiques détaillées */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Acceptées</span>
                                <span className="font-medium text-green-600">{technician.stats?.acceptedAssignments || 0}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">En attente</span>
                                <span className="font-medium text-orange-600">{technician.stats?.pendingAssignments || 0}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Refusées</span>
                                <span className="font-medium text-red-600">{technician.stats?.rejectedAssignments || 0}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Revenus</span>
                                <span className="font-medium text-green-600">{technician.stats?.totalRevenue || 0}€</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Heures</span>
                                <span className="font-medium text-blue-600">{technician.stats?.totalHours || 0}h</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Note</span>
                                <span className={`font-medium ${getPerformanceColor(technician.stats?.averageRating || 0)}`}>
                                  {(technician.stats?.averageRating || 0).toFixed(1)}/5
                                </span>
                              </div>
                            </div>
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
      <TechnicianContactDialog
        technician={selectedTechnicianForContact}
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        onContactUpdated={handleContactUpdated}
      />

      {/* Dialogue de création de paiement */}
      <CreatePaymentDialog
        technician={selectedTechnicianForPayment || undefined}
        open={createPaymentDialogOpen}
        onOpenChange={setCreatePaymentDialogOpen}
      />
    </div>
  )
}
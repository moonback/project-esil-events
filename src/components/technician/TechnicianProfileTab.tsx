import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  User as UserIcon, 
  Phone, 
  Mail, 
  MapPin, 
  AlertTriangle, 
  Edit, 
  Save, 
  X,
  UserCheck,
  PhoneCall,
  Shield,
  Info,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Award,
  Star,
  Briefcase,
  DollarSign,
  Map,
  CalendarDays,
  Bell,
  CreditCard
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { User, Mission, MissionAssignment, Billing, Notification, BillingWithDetails } from '@/types/database'
import { useToast } from '@/lib/useToast'

interface TechnicianStats {
  totalMissions: number
  acceptedMissions: number
  pendingMissions: number
  totalRevenue: number
  averageRating: number
  totalHours: number
  lastMissionDate: string | null
}

interface TechnicianProfileTabProps {
  onTabChange?: (tab: string) => void
}

export function TechnicianProfileTab({ onTabChange }: TechnicianProfileTabProps) {
  const { profile } = useAuthStore()
  const { showSuccess, showError, showInfo } = useToast()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [stats, setStats] = useState<TechnicianStats>({
    totalMissions: 0,
    acceptedMissions: 0,
    pendingMissions: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalHours: 0,
    lastMissionDate: null
  })
  const [recentMissions, setRecentMissions] = useState<(Mission & { assignment: MissionAssignment })[]>([])
  const [recentBillings, setRecentBillings] = useState<BillingWithDetails[]>([])
  const [paymentNotifications, setPaymentNotifications] = useState<Notification[]>([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        address: profile.address || '',
        notes: profile.notes || ''
      })
      fetchTechnicianData()
    }
  }, [profile])

  const fetchTechnicianData = async () => {
    if (!profile) return

    try {
      // Récupérer les missions du technicien
      const { data: assignments } = await supabase
        .from('mission_assignments')
        .select(`
          *,
          missions (*)
        `)
        .eq('technician_id', profile.id)
        .order('assigned_at', { ascending: false })

      // Récupérer les facturations avec les détails des missions
      const { data: billings } = await supabase
        .from('billing')
        .select(`
          *,
          missions (*)
        `)
        .eq('technician_id', profile.id)
        .order('created_at', { ascending: false })

      if (assignments) {
        const missionData = assignments.map(a => ({
          ...a.missions,
          assignment: { id: a.id, status: a.status, assigned_at: a.assigned_at }
        })) as (Mission & { assignment: MissionAssignment })[]

        setRecentMissions(missionData.slice(0, 5))

        // Calculer les statistiques
        const totalMissions = assignments.length
        const acceptedMissions = assignments.filter(a => a.status === 'accepté').length
        const pendingMissions = assignments.filter(a => a.status === 'proposé').length
        
        // Calculer les revenus basés sur les missions acceptées et leurs forfaits
        const acceptedAssignments = assignments.filter(a => a.status === 'accepté')
        const totalRevenue = acceptedAssignments.reduce((sum, assignment) => {
          const mission = assignment.missions as Mission
          return sum + (mission.forfeit || 0)
        }, 0)
        
        const lastMission = assignments.find(a => a.status === 'accepté')
        
        setStats({
          totalMissions,
          acceptedMissions,
          pendingMissions,
          totalRevenue,
          averageRating: 4.2, // À implémenter avec un système de notation
          totalHours: acceptedMissions * 4, // Estimation basée sur les missions acceptées
          lastMissionDate: lastMission?.assigned_at || null
        })
      }

      if (billings) {
        // Filtrer seulement les facturations validées ou payées
        const validBillings = billings.filter(b => b.status === 'validé' || b.status === 'payé')
        setRecentBillings(validBillings.slice(0, 3))
      }

      // Récupérer les notifications de paiement
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .eq('type', 'payment')
        .order('created_at', { ascending: false })
        .limit(10)

      setPaymentNotifications(notifications || [])
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          notes: formData.notes || null
        })
        .eq('id', profile.id)

      if (error) throw error

      showSuccess(
        "Succès",
        "Vos informations de contact ont été mises à jour."
      )

      setIsEditing(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      showError(
        "Erreur",
        "Impossible de mettre à jour vos informations de contact."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        address: profile.address || '',
        notes: profile.notes || ''
      })
    }
    setIsEditing(false)
  }



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      {/* En-tête avec statut - Responsive */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Mon Profil</h2>
          <p className="text-sm md:text-base text-gray-600">Gérez vos informations et suivez vos performances</p>
        </div>
        <div className="flex items-center justify-center gap-2 md:gap-3 md:justify-end">
          <Badge variant="secondary" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Shield className="h-3 w-3 md:h-4 md:w-4" />
            Technicien
          </Badge>
          <Badge 
            variant={profile.is_validated ? "default" : "destructive"}
            className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
          >
            {profile.is_validated ? (
              <>
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                Validé
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 md:h-4 md:w-4" />
                En attente
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Statistiques personnelles - Responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-blue-600 truncate">Missions Total</p>
                <p className="text-lg md:text-2xl font-bold text-blue-900">{stats.totalMissions}</p>
              </div>
              <Briefcase className="h-6 w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-green-600 truncate">Missions Acceptées</p>
                <p className="text-lg md:text-2xl font-bold text-green-900">{stats.acceptedMissions}</p>
              </div>
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-amber-600 truncate">Revenus Total</p>
                <p className="text-lg md:text-2xl font-bold text-amber-900 truncate">{formatAmount(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-amber-600 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Note Moyenne</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-purple-900">{stats.averageRating}</p>
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                </div>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations personnelles - Responsive */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <CardTitle className="flex items-center justify-center md:justify-start gap-2 text-base md:text-lg">
                  <UserIcon className="h-4 w-4 md:h-5 md:w-5" />
                  Informations personnelles
                </CardTitle>
                <div className="flex gap-2 justify-center md:justify-end">
                  {!isEditing ? (
                    <Button 
                      onClick={() => setIsEditing(true)} 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                    >
                      <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Modifier</span>
                      <span className="sm:hidden">✏️</span>
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCancel} 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                      >
                        <X className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">Annuler</span>
                        <span className="sm:hidden">✕</span>
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        disabled={loading}
                        size="sm"
                        className="flex items-center gap-1 md:gap-2 text-xs md:text-sm"
                      >
                        <Save className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                        <span className="sm:hidden">💾</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nom complet *</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Votre nom complet"
                      className="text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border min-h-[40px] flex items-center">
                      {formData.name || 'Non renseigné'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Téléphone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      className="text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border min-h-[40px] flex items-center">
                      {formData.phone || 'Non renseigné'}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="technicien@example.com"
                    className="text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border min-h-[40px] flex items-center truncate">
                    {formData.email || 'Non renseigné'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Adresse</Label>
                {isEditing ? (
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Rue de la Paix, 75001 Paris"
                    className="text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border min-h-[40px] flex items-center">
                    {formData.address || 'Non renseigné'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Notes additionnelles</Label>
                {isEditing ? (
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Allergies, préférences, informations spéciales..."
                    rows={3}
                    className="text-sm resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border min-h-[80px]">
                    {formData.notes || 'Aucune note'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

                     {/* Missions récentes - Responsive */}
           <Card className="transition-all duration-200 hover:shadow-md">
             <CardHeader className="pb-3 p-4 md:p-6">
               <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                 <CardTitle className="flex items-center justify-center md:justify-start gap-2 text-base md:text-lg">
                   <div className="p-2 bg-blue-100 rounded-lg">
                     <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                   </div>
                   Missions récentes
                 </CardTitle>
                 {recentMissions.length > 0 && (
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 self-center md:self-auto"
                     onClick={() => onTabChange?.('missions')}
                   >
                     Voir tout
                   </Button>
                 )}
               </div>
             </CardHeader>
             <CardContent className="p-4 md:p-6">
               {recentMissions.length > 0 ? (
                 <div className="space-y-3">
                   {recentMissions.map((mission, index) => {
                     const statusConfig = {
                       'accepté': { 
                         variant: 'default' as const, 
                         label: 'Acceptée', 
                         icon: CheckCircle,
                         className: 'bg-green-100 text-green-800 border-green-200'
                       },
                       'proposé': { 
                         variant: 'secondary' as const, 
                         label: 'Proposée', 
                         icon: Clock,
                         className: 'bg-blue-100 text-blue-800 border-blue-200'
                       },
                       'refusé': { 
                         variant: 'destructive' as const, 
                         label: 'Refusée', 
                         icon: AlertCircle,
                         className: 'bg-red-100 text-red-800 border-red-200'
                       }
                     }
                     
                     const config = statusConfig[mission.assignment.status as keyof typeof statusConfig] || statusConfig.proposé
                     const StatusIcon = config.icon
                     
                     return (
                       <div 
                         key={mission.id} 
                         className="group flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-sm space-y-3 sm:space-y-0"
                         style={{ animationDelay: `${index * 100}ms` }}
                       >
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-3">
                             <div className="flex-shrink-0">
                               <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                 <Map className="h-5 w-5 text-blue-600" />
                               </div>
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-semibold text-sm text-gray-900 truncate">
                                 {mission.title}
                               </p>
                               <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                                 <MapPin className="h-3 w-3 flex-shrink-0" />
                                 <span className="truncate">{mission.location}</span>
                               </p>
                               <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                 <Calendar className="h-3 w-3" />
                                 {formatDate(mission.date_start)}
                               </p>
                               {mission.forfeit && (
                                 <p className="text-xs text-green-600 flex items-center gap-1 mt-1 font-medium">
                                   <DollarSign className="h-3 w-3" />
                                   {formatAmount(mission.forfeit)}
                                 </p>
                               )}
                             </div>
                           </div>
                         </div>
                         <div className="flex-shrink-0 sm:ml-3 self-start sm:self-center">
                           <Badge 
                             variant={config.variant}
                             className={`text-xs px-3 py-1 flex items-center gap-1 ${config.className}`}
                           >
                             <StatusIcon className="h-3 w-3" />
                             {config.label}
                           </Badge>
                         </div>
                       </div>
                     )
                   })}
                 </div>
               ) : (
                 <div className="text-center py-8 text-gray-500">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Calendar className="h-8 w-8 text-gray-400" />
                   </div>
                   <p className="text-sm font-medium text-gray-600 mb-1">Aucune mission récente</p>
                   <p className="text-xs text-gray-400">Vos missions apparaîtront ici</p>
                 </div>
               )}
             </CardContent>
           </Card>
        </div>

                 {/* Panneau latéral */}
         <div className="space-y-6">

          {/* Statut de validation - Responsive */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center justify-center md:justify-start gap-2 text-base md:text-lg">
                <Shield className="h-4 w-4 md:h-5 md:w-5" />
                Statut du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Validation</span>
                <Badge variant={profile.is_validated ? "default" : "destructive"} className="text-xs">
                  {profile.is_validated ? 'Validé' : 'En attente'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Membre depuis</span>
                <span className="text-sm font-medium">
                  {formatDate(profile.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dernière mission</span>
                <span className="text-sm font-medium">
                  {stats.lastMissionDate ? formatDate(stats.lastMissionDate) : 'Aucune'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Mes Rémunérations - Responsive */}
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center justify-center md:justify-start gap-2 text-base md:text-lg">
                <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
                Mes Rémunérations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {paymentNotifications.length > 0 ? (
                <div className="space-y-3">
                  {paymentNotifications.map((notification) => (
                    <div key={notification.id} className="p-3 rounded-lg border border-green-200 bg-green-50">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-md bg-green-100 flex-shrink-0">
                          <Bell className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm text-green-900 truncate">
                              {notification.title}
                            </h4>
                            <Badge variant="default" className="bg-green-600 text-white text-xs self-start sm:self-center flex-shrink-0">
                              Paiement
                            </Badge>
                          </div>
                          <p className="text-xs text-green-700 leading-relaxed whitespace-pre-line">
                            {notification.message}
                          </p>
                          <p className="text-xs text-green-600 mt-2">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Aucune rémunération récente</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Les paiements en lot apparaîtront ici
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Facturations récentes */}
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  Facturations récentes
                </CardTitle>
                {recentBillings.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => onTabChange?.('billing')}
                  >
                    Voir tout
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentBillings.length > 0 ? (
                <div className="space-y-3">
                  {recentBillings.map((billing, index) => {
                    const statusConfig = {
                      'payé': { 
                        variant: 'default' as const, 
                        label: 'Payé', 
                        icon: CheckCircle,
                        className: 'bg-green-100 text-green-800 border-green-200'
                      },
                      'validé': { 
                        variant: 'secondary' as const, 
                        label: 'Validé', 
                        icon: CheckCircle,
                        className: 'bg-blue-100 text-blue-800 border-blue-200'
                      },
                      'en_attente': { 
                        variant: 'outline' as const, 
                        label: 'En attente', 
                        icon: Clock,
                        className: 'bg-amber-100 text-amber-800 border-amber-200'
                      }
                    }
                    
                    const config = statusConfig[billing.status as keyof typeof statusConfig] || statusConfig.en_attente
                    const StatusIcon = config.icon
                    
                    return (
                      <div 
                        key={billing.id} 
                        className="group flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-green-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">
                                {formatAmount(billing.amount)}
                              </p>
                                                             <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                 <Briefcase className="h-3 w-3" />
                                 {billing.missions?.title || `Mission #${billing.mission_id}`}
                               </p>
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(billing.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-3">
                          <Badge 
                            variant={config.variant}
                            className={`text-xs px-3 py-1 flex items-center gap-1 ${config.className}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Aucune facturation récente</p>
                  <p className="text-xs text-gray-400">Vos facturations apparaîtront ici</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
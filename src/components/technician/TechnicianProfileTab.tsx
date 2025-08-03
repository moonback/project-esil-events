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
  CalendarDays
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { User, Mission, MissionAssignment, Billing } from '@/types/database'
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
  const [recentBillings, setRecentBillings] = useState<Billing[]>([])
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
    <div className="space-y-6">
      {/* En-tête avec statut */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Mon Profil</h2>
          <p className="text-sm md:text-base text-gray-600">Gérez vos informations et suivez vos performances</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Technicien
          </Badge>
          <Badge 
            variant={profile.is_validated ? "default" : "destructive"}
            className="flex items-center gap-2"
          >
            {profile.is_validated ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Validé
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4" />
                En attente
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Statistiques personnelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Missions Total</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalMissions}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Missions Acceptées</p>
                <p className="text-2xl font-bold text-green-900">{stats.acceptedMissions}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Revenus Total</p>
                <p className="text-2xl font-bold text-amber-900">{formatAmount(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
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
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations personnelles */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCancel} 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={loading}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {loading ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="06 12 34 56 78"
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  placeholder="technicien@example.com"
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  placeholder="123 Rue de la Paix, 75001 Paris"
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes additionnelles</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Allergies, préférences, informations spéciales..."
                  rows={3}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>
            </CardContent>
          </Card>

          {/* Missions récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Missions récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentMissions.length > 0 ? (
                <div className="space-y-3">
                  {recentMissions.map((mission) => (
                    <div key={mission.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-blue-100">
                          <Map className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{mission.title}</p>
                          <p className="text-xs text-gray-500">{mission.location}</p>
                          <p className="text-xs text-gray-500">{formatDate(mission.date_start)}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={
                          mission.assignment.status === 'accepté' ? 'default' :
                          mission.assignment.status === 'proposé' ? 'secondary' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {mission.assignment.status === 'accepté' ? 'Acceptée' :
                         mission.assignment.status === 'proposé' ? 'Proposée' : 'Refusée'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Aucune mission récente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

                 {/* Panneau latéral */}
         <div className="space-y-6">

          {/* Statut de validation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Statut du compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Validation</span>
                <Badge variant={profile.is_validated ? "default" : "destructive"}>
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

          {/* Facturations récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Facturations récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentBillings.length > 0 ? (
                <div className="space-y-3">
                  {recentBillings.map((billing) => {
                    return (
                      <div key={billing.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">
                            {formatAmount(billing.amount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Mission #{billing.mission_id}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDate(billing.created_at)}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            billing.status === 'payé' ? 'default' :
                            billing.status === 'validé' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {billing.status === 'payé' ? 'Payé' :
                           billing.status === 'validé' ? 'Validé' : 'En attente'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Aucune facturation récente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
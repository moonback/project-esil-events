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
  Info
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types/database'
import { useToast } from '@/lib/useToast'

export function TechnicianProfileTab() {
  const { profile } = useAuthStore()
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    if (profile) {
      console.log('Profile data:', profile) // Debug log
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        address: profile.address || '',
        notes: profile.notes || ''
      })
    }
  }, [profile])

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

      showSuccess("Succès", "Vos informations de contact ont été mises à jour.")

      setIsEditing(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      showError("Erreur", "Impossible de mettre à jour vos informations de contact.")
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
    <div className="space-y-4 md:space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Mon Profil</h2>
          <p className="text-sm md:text-base text-gray-600">Gérez vos informations de contact</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2 w-fit">
          <Shield className="h-4 w-4" />
          Technicien
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
                      <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Informations personnelles
          </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
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
              />
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
              />
            </div>
          </CardContent>
        </Card>

        

                 {/* Notes */}
         <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Notes additionnelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Informations importantes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={!isEditing}
                placeholder="Allergies, préférences, informations spéciales..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Modifier mes informations
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
} 
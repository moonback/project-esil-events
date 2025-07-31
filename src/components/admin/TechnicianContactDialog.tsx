import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  PhoneCall
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database'
import { useToast } from '@/lib/useToast'

interface TechnicianContactDialogProps {
  technician: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onContactUpdated?: () => void
}

export function TechnicianContactDialog({ 
  technician, 
  open, 
  onOpenChange, 
  onContactUpdated 
}: TechnicianContactDialogProps) {
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
    if (technician && open) {
      setFormData({
        name: technician.name || '',
        phone: technician.phone || '',
        email: technician.email || '',
        address: technician.address || '',
        notes: technician.notes || ''
      })
      setIsEditing(false)
    }
  }, [technician, open])

  const handleSave = async () => {
    if (!technician) return

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
          .eq('id', technician.id)

      if (error) throw error

      showSuccess("Succès", "Les informations de contact ont été mises à jour.")

      setIsEditing(false)
      onContactUpdated?.()
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      showError("Erreur", "Impossible de mettre à jour les informations de contact.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (technician) {
      setFormData({
        name: technician.name || '',
        phone: technician.phone || '',
        email: technician.email || '',
        address: technician.address || '',
        notes: technician.notes || ''
      })
    }
    setIsEditing(false)
  }

  if (!technician) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Fiche de contact - {technician.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </CardContent>
          </Card>



          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes additionnelles</CardTitle>
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

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Modifier
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
      </DialogContent>
    </Dialog>
  )
} 
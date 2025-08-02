import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send, Phone, User } from 'lucide-react'
import { useWhatsAppNotifications } from '@/lib/useWhatsAppNotifications'
import { supabase } from '@/lib/supabase'
import type { User as UserType } from '@/types/database'

interface WhatsAppTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsAppTestDialog({ open, onOpenChange }: WhatsAppTestDialogProps) {
  const [selectedTechnician, setSelectedTechnician] = useState<string>('')
  const [technicians, setTechnicians] = useState<UserType[]>([])
  const [testMessage, setTestMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { sendAssignmentNotification } = useWhatsAppNotifications()

  React.useEffect(() => {
    if (open) {
      fetchTechnicians()
    }
  }, [open])

  const fetchTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'technicien')
        .order('name')

      if (error) throw error
      setTechnicians(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens:', error)
    }
  }

  const handleSendTestNotification = async () => {
    if (!selectedTechnician) return

    setLoading(true)
    try {
      const technician = technicians.find(t => t.id === selectedTechnician)
      if (!technician) return

      // Créer une mission de test
      const testMission = {
        id: 'test-mission-id',
        title: testMessage || 'Test de notification WhatsApp',
        type: 'Livraison jeux' as const,
        location: 'Lieu de test',
        date_start: new Date().toISOString(),
        date_end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2h
        forfeit: 150,
        description: 'Mission de test pour vérifier les notifications WhatsApp',
        required_people: 1,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const success = await sendAssignmentNotification(
        technician,
        testMission,
        'Administrateur'
      )

      if (success) {
        setTestMessage('')
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du test:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle>Test des Notifications WhatsApp</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="technician" className="text-sm font-medium">
              Sélectionner un technicien
            </Label>
            <select
              id="technician"
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Choisir un technicien...</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name} {tech.phone ? `(${tech.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="test-message" className="text-sm font-medium">
              Message de test (optionnel)
            </Label>
            <Textarea
              id="test-message"
              placeholder="Entrez un message personnalisé pour le test..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          {selectedTechnician && (
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex items-center space-x-2 text-sm text-blue-800">
                <Phone className="h-4 w-4" />
                <span>
                  Notification envoyée à: {technicians.find(t => t.id === selectedTechnician)?.name}
                </span>
              </div>
              {technicians.find(t => t.id === selectedTechnician)?.phone && (
                <div className="text-xs text-blue-600 mt-1">
                  Téléphone: {technicians.find(t => t.id === selectedTechnician)?.phone}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendTestNotification}
              disabled={loading || !selectedTechnician}
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Envoi...' : 'Envoyer le test'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
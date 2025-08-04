import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { emailClient } from '@/lib/emailClient'
import { useToast } from '@/lib/useToast'

interface TestEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TestEmailDialog({ open, onOpenChange }: TestEmailDialogProps) {
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const { addNotification } = useToast()

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      addNotification({
        type: 'error',
        title: 'Email requis',
        message: 'Veuillez saisir une adresse email de test'
      })
      return
    }

    setLoading(true)
    setTestResult(null)

    try {
      // Créer une mission de test
      const testMission = {
        id: 'test-mission-id',
        title: 'Test - Mission de vérification',
        type: 'Test' as any,
        location: 'Lieu de test',
        date_start: new Date().toISOString(),
        date_end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2h
        forfeit: 100,
        description: 'Ceci est un email de test pour vérifier la configuration SMTP.'
      }

      // Créer un technicien de test
      const testTechnician = {
        id: 'test-technician-id',
        name: 'Technicien de test',
        email: testEmail,
        role: 'technicien' as any,
        phone: null,
        address: null,
        notes: null,
        is_validated: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const result = await emailClient.sendAssignmentNotification(
        testTechnician,
        testMission,
        'Test Esil-events'
      )

      if (result.success) {
        setTestResult({
          success: true,
          message: `Email de test envoyé avec succès à ${testEmail}`
        })
        addNotification({
          type: 'success',
          title: 'Test réussi',
          message: 'Email de test envoyé avec succès'
        })
      } else {
        setTestResult({
          success: false,
          message: `Erreur lors de l'envoi: ${result.error}`
        })
        addNotification({
          type: 'error',
          title: 'Test échoué',
          message: result.error || 'Erreur lors de l\'envoi de l\'email de test'
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setTestResult({
        success: false,
        message: `Erreur: ${errorMessage}`
      })
      addNotification({
        type: 'error',
        title: 'Erreur de test',
        message: 'Erreur lors du test d\'envoi d\'email'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Test de configuration SMTP
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="test-email">Adresse email de test</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="votre-email@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="text-sm text-gray-600">
            <p>Ce test enverra un email de notification d'assignation à l'adresse spécifiée pour vérifier la configuration SMTP.</p>
          </div>

          {testResult && (
            <Card className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                    {testResult.message}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Fermer
            </Button>
            <Button
              onClick={handleTestEmail}
              disabled={loading || !testEmail.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer le test
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
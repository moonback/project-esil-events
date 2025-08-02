import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEmailService } from '@/services/emailService'
import { SmtpStatus } from '@/components/ui/smtp-status'
import { Mail, Send, CheckCircle, XCircle } from 'lucide-react'

interface SmtpTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SmtpTestDialog({ open, onOpenChange }: SmtpTestDialogProps) {
  const { sendEmail, isConnected } = useEmailService()
  const [testEmail, setTestEmail] = useState('')
  const [subject, setSubject] = useState('Test SMTP - Esil-events')
  const [message, setMessage] = useState('Ceci est un email de test pour vérifier la configuration SMTP.')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleSendTest = async () => {
    if (!testEmail) {
      setResult({
        success: false,
        message: 'Veuillez saisir une adresse email de test.'
      })
      return
    }

    setSending(true)
    setResult(null)

    try {
      const success = await sendEmail({
        to: testEmail,
        template: {
          subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Test SMTP - Esil-events</h2>
              <p>Ceci est un email de test pour vérifier la configuration SMTP.</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e293b; margin-top: 0;">Détails du test</h3>
                <p><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</p>
                <p><strong>Statut SMTP :</strong> ${isConnected ? 'Connecté' : 'Déconnecté'}</p>
              </div>
              <p>Si vous recevez cet email, la configuration SMTP fonctionne correctement.</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px;">
                  Cet email a été envoyé automatiquement par le système Esil-events.
                </p>
              </div>
            </div>
          `,
          text: `
Test SMTP - Esil-events

Ceci est un email de test pour vérifier la configuration SMTP.

Détails du test :
Date : ${new Date().toLocaleString('fr-FR')}
Statut SMTP : ${isConnected ? 'Connecté' : 'Déconnecté'}

Si vous recevez cet email, la configuration SMTP fonctionne correctement.

---
Cet email a été envoyé automatiquement par le système Esil-events.
          `
        }
      })

      if (success) {
        setResult({
          success: true,
          message: 'Email de test envoyé avec succès ! Vérifiez votre boîte de réception.'
        })
      } else {
        setResult({
          success: false,
          message: 'Échec de l\'envoi de l\'email de test. Vérifiez la configuration SMTP.'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Erreur lors de l'envoi : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Test de configuration SMTP
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statut SMTP */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SmtpStatus showDetails />
                <span>Statut de la connexion</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={isConnected ? "default" : "destructive"}>
                    {isConnected ? "Connecté" : "Déconnecté"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Configuration SMTP active. Les emails sont envoyés via le serveur SMTP.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Configuration SMTP */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration SMTP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Serveur :</span>
                  <p className="text-gray-600">{import.meta.env.VITE_SMTP_HOST || 'mail.dresscodeia.fr'}</p>
                </div>
                <div>
                  <span className="font-medium">Port :</span>
                  <p className="text-gray-600">{import.meta.env.VITE_SMTP_PORT || '465'}</p>
                </div>
                <div>
                  <span className="font-medium">Utilisateur :</span>
                  <p className="text-gray-600">{import.meta.env.VITE_SMTP_USER || 'client@dresscodeia.fr'}</p>
                </div>
                <div>
                  <span className="font-medium">Expéditeur :</span>
                  <p className="text-gray-600">{import.meta.env.VITE_SMTP_FROM || 'client@dresscodeia.fr'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulaire de test */}
          <Card>
            <CardHeader>
              <CardTitle>Test d'envoi d'email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="test-email">Email de test</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="votre-email@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="test-subject">Sujet</Label>
                <Input
                  id="test-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="test-message">Message</Label>
                <Textarea
                  id="test-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleSendTest} 
                disabled={sending || !isConnected}
                className="w-full"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer l'email de test
                  </>
                )}
              </Button>

              {result && (
                <div className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {result.success ? 'Succès' : 'Erreur'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{result.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
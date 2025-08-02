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
import { Mail, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

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
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Esil-events</h1>
                <p style="margin: 10px 0 0 0;">Test SMTP</p>
              </div>
              
              <div style="padding: 20px; background: #f9f9f9;">
                <h2 style="color: #333;">Test de configuration SMTP</h2>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <p><strong>Message de test :</strong></p>
                  <p>${message}</p>
                </div>
                
                <div style="background: #e8f5e8; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0; color: #2d5a2d;">
                    ✅ Si vous recevez cet email, la configuration SMTP fonctionne correctement !
                  </p>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  Date et heure du test : ${new Date().toLocaleString('fr-FR')}
                </p>
              </div>
              
              <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
                <p>Cet email a été envoyé automatiquement par le système Esil-events</p>
                <p>Statut de connexion: ${isConnected ? 'Connecté' : 'Non connecté'}</p>
              </div>
            </div>
          `,
          text: `
            Test de configuration SMTP - Esil-events
            
            Message de test :
            ${message}
            
            Si vous recevez cet email, la configuration SMTP fonctionne correctement !
            
            Date et heure du test : ${new Date().toLocaleString('fr-FR')}
            Statut de connexion: ${isConnected ? 'Connecté' : 'Non connecté'}
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
            <Mail className="h-5 w-5 text-blue-600" />
            Test de configuration SMTP
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statut SMTP */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Statut de la connexion SMTP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <SmtpStatus showDetails={true} />
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {isConnected ? 'Connecté' : 'Déconnecté'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Configuration SMTP */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuration SMTP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-gray-600">Serveur SMTP</Label>
                  <p className="font-medium">{import.meta.env.VITE_SMTP_HOST || 'mail.dresscodeia.fr'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Port</Label>
                  <p className="font-medium">{import.meta.env.VITE_SMTP_PORT || '465'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Utilisateur</Label>
                  <p className="font-medium">{import.meta.env.VITE_SMTP_USER || 'client@dresscodeia.fr'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Expéditeur</Label>
                  <p className="font-medium">{import.meta.env.VITE_SMTP_FROM || 'client@dresscodeia.fr'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test d'envoi */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5" />
                Test d'envoi d'email
              </CardTitle>
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
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    <p className="font-medium">{result.message}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
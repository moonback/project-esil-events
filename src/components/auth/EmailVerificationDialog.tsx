import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface EmailVerificationDialogProps {
  open: boolean
  onClose: () => void
  email: string
}

export function EmailVerificationDialog({ open, onClose, email }: EmailVerificationDialogProps) {
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  
  if (!open) return null

  const handleResendEmail = async () => {
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })
      
      if (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error)
      } else {
        setResendSuccess(true)
        setTimeout(() => setResendSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl border-0">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Mail className="h-12 w-12 text-blue-600" />
              <CheckCircle className="absolute -top-1 -right-1 h-6 w-6 text-green-500 bg-white rounded-full" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Vérifiez votre email
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center space-y-3">
            <p className="text-gray-600">
              Un email de confirmation a été envoyé à :
            </p>
            <p className="font-semibold text-blue-600 bg-blue-50 p-3 rounded-lg">
              {email}
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-2">Important :</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Vérifiez votre boîte de réception</li>
                    <li>• Consultez également le dossier "Spam" ou "Indésirable"</li>
                    <li>• Cliquez sur le lien de confirmation dans l'email</li>
                    <li>• Vous pourrez ensuite vous connecter à votre compte</li>
                    <li>• L'email peut prendre quelques minutes à arriver</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Prochaines étapes :</p>
                  <p className="text-xs">
                    Une fois votre email validé, vous pourrez accéder à votre espace technicien 
                    et commencer à recevoir des missions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3 pt-4">
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              J'ai compris
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // Ouvrir le client email par défaut
                window.open(`mailto:${email}`, '_blank')
              }}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir ma messagerie
            </Button>

            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={resending}
              className="w-full"
            >
              {resending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renvoyer l'email
                </>
              )}
            </Button>

            {resendSuccess && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Email renvoyé avec succès !</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
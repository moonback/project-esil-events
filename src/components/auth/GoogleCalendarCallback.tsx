import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { googleCalendarService } from '@/lib/googleCalendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function GoogleCalendarCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Récupérer le code d'autorisation depuis l'URL
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const error = urlParams.get('error')

        if (error) {
          setStatus('error')
          setError('Erreur lors de l\'autorisation Google Calendar')
          return
        }

        if (!code) {
          setStatus('error')
          setError('Code d\'autorisation manquant')
          return
        }

        // Échanger le code contre un token
        const success = await googleCalendarService.exchangeCodeForToken(code)
        
        if (success) {
          setStatus('success')
          
          // Rafraîchir l'état d'authentification
          await googleCalendarService.initialize()
          
          // Rediriger vers le dashboard après 2 secondes
          setTimeout(() => {
            navigate('/admin')
          }, 2000)
        } else {
          setStatus('error')
          setError('Erreur lors de l\'échange du token')
        }
      } catch (err) {
        setStatus('error')
        setError('Une erreur inattendue s\'est produite')
        console.error(err)
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Connexion Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-sm text-gray-600">
                Connexion en cours...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
              <p className="text-sm text-green-600 font-medium">
                Connexion réussie !
              </p>
              <p className="text-xs text-gray-500">
                Redirection vers le dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <XCircle className="h-8 w-8 mx-auto text-red-600" />
              <p className="text-sm text-red-600 font-medium">
                Erreur de connexion
              </p>
              {error && (
                <p className="text-xs text-gray-500">
                  {error}
                </p>
              )}
              <Button
                onClick={() => navigate('/admin')}
                className="w-full"
              >
                Retour au dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
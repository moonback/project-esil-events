import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

const AuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Vérification de votre compte...')
  const { initialize } = useAuthStore()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Récupérer les paramètres de l'URL
        console.log('URL complète:', window.location.href)
        console.log('Hash:', window.location.hash)
        console.log('Search:', window.location.search)
        
        // Essayer d'abord le hash, puis les query params
        let urlParams: URLSearchParams
        if (window.location.hash) {
          urlParams = new URLSearchParams(window.location.hash.substring(1))
        } else if (window.location.search) {
          urlParams = new URLSearchParams(window.location.search.substring(1))
        } else {
          throw new Error('Aucun paramètre trouvé dans l\'URL')
        }
        
        const accessToken = urlParams.get('access_token')
        const refreshToken = urlParams.get('refresh_token')
        const type = urlParams.get('type')
        
        console.log('Access Token:', accessToken ? 'Présent' : 'Absent')
        console.log('Refresh Token:', refreshToken ? 'Présent' : 'Absent')
        console.log('Type:', type)

        if (type === 'signup' && accessToken) {
          // Définir la session avec les tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })

          if (error) {
            console.error('Erreur lors de la configuration de la session:', error)
            setStatus('error')
            setMessage('Erreur lors de la vérification de votre compte. Veuillez réessayer.')
            return
          }

          if (data.session) {
            // Initialiser l'application avec la nouvelle session
            await initialize()
            setStatus('success')
            setMessage('Votre compte a été vérifié avec succès ! Redirection...')
            
            // Rediriger vers la page principale après un délai
            setTimeout(() => {
              window.location.href = '/'
            }, 2000)
          } else {
            setStatus('error')
            setMessage('Session invalide. Veuillez réessayer.')
          }
        } else {
          setStatus('error')
          setMessage(`Lien de vérification invalide. Type: ${type}, Token: ${accessToken ? 'Présent' : 'Absent'}`)
        }
      } catch (error) {
        console.error('Erreur lors du callback d\'authentification:', error)
        setStatus('error')
        setMessage('Une erreur est survenue lors de la vérification.')
      }
    }

    handleAuthCallback()
  }, [initialize])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto" />
              <h2 className="text-xl font-semibold text-gray-800">Vérification en cours</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-800">Compte vérifié !</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-800">Erreur de vérification</h2>
              <p className="text-gray-600">{message}</p>
              <button
                onClick={() => window.location.href = '/'}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Retour à l'accueil
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthCallback 
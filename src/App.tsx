import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { AuthForm } from '@/components/auth/AuthForm'
import { Layout } from '@/components/layout/Layout'
import { Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { NotificationContainer } from '@/components/ui/notification'
import { useAppState } from '@/lib/useErrorHandler'
import { Welcome, useWelcome } from '@/components/ui/welcome'

function App() {
  const { user, loading, initialize } = useAuthStore()
  const { handleError, handleAsyncError, startLoading, stopLoading } = useAppState()
  const { showWelcome, showWelcomeScreen, hideWelcomeScreen } = useWelcome()
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const initApp = async () => {
      startLoading('app-init')
      setInitializing(true)
      
      const result = await handleAsyncError(
        async () => {
          await initialize()
        },
        'App Initialization'
      )
      
      if (result === null) {
        // L'erreur a été gérée par le hook
        setInitializing(false)
      } else {
        setInitializing(false)
      }
      
      stopLoading('app-init')
    }

    initApp()
  }, [initialize]) // Suppression des dépendances qui changent à chaque rendu

  // Afficher l'écran de bienvenue quand l'utilisateur se connecte
  useEffect(() => {
    if (user && !loading && !initializing) {
      showWelcomeScreen()
    }
  }, [user, loading, initializing]) // Suppression de showWelcomeScreen des dépendances

  // Écran de chargement amélioré
  if (loading || initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
        {/* Effet de particules animées en arrière-plan */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-2xl animate-bounce-slow"></div>
          <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur-xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="text-center space-y-6 relative z-10">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="relative">
              <Sparkles className="h-12 w-12 text-indigo-600 animate-pulse-slow" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce-slow"></div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Esil-events
            </h1>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
            <p className="text-gray-600 text-lg animate-pulse-slow">
              {loading ? 'Chargement de votre espace...' : 'Initialisation...'}
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce-slow"></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce-slow" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce-slow" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Écran d'erreur (maintenant géré par les notifications)
  // Les erreurs sont affichées via le système de notifications

  // Contenu principal avec transition
  return (
    <>
      <div className="transition-all duration-300 ease-in-out">
        {user ? <Layout /> : <AuthForm />}
      </div>
      <NotificationContainer />
      {showWelcome && user && (
        <Welcome 
          user={{ 
            name: (user as any).name || 'Utilisateur', 
            role: (user as any).role || 'technicien' 
          }} 
          onComplete={hideWelcomeScreen} 
        />
      )}
    </>
  )
}

export default App
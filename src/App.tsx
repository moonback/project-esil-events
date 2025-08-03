import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { AuthForm } from '@/components/auth/AuthForm'
import { Layout } from '@/components/layout/Layout'
import { Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { NotificationContainer } from '@/components/ui/notification'
import { useAppState } from '@/lib/useErrorHandler'

// Types pour une meilleure sécurité de type
interface AppUser {
  name?: string
  role?: string
  [key: string]: any
}

// Configuration des animations
const ANIMATION_CONFIG = {
  loadingDots: ['0s', '0.1s', '0.2s'],
  backgroundElements: ['0s', '1s', '2s'],
} as const

// Composant pour les particules d'arrière-plan
const BackgroundParticles: React.FC = React.memo(() => (
  <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden="true">
    <div 
      className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-3xl animate-pulse-slow"
    />
    <div 
      className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse-slow"
      style={{ animationDelay: ANIMATION_CONFIG.backgroundElements[1] }}
    />
    <div 
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-2xl animate-bounce-slow"
    />
    <div 
      className="absolute top-1/3 right-1/3 w-16 h-16 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur-xl animate-pulse-slow"
      style={{ animationDelay: ANIMATION_CONFIG.backgroundElements[2] }}
    />
  </div>
))

BackgroundParticles.displayName = 'BackgroundParticles'

// Composant pour les points de chargement animés
const LoadingDots: React.FC = React.memo(() => (
  <div className="flex items-center justify-center space-x-2" role="status" aria-label="Chargement">
    {ANIMATION_CONFIG.loadingDots.map((delay, index) => (
      <div
        key={index}
        className={`w-2 h-2 rounded-full animate-bounce-slow ${
          index === 0 ? 'bg-indigo-600' : 
          index === 1 ? 'bg-purple-600' : 'bg-pink-600'
        }`}
        style={{ animationDelay: delay }}
      />
    ))}
  </div>
))

LoadingDots.displayName = 'LoadingDots'

// Composant d'écran de chargement optimisé
const LoadingScreen: React.FC<{ 
  isLoading: boolean
  isInitializing: boolean 
}> = React.memo(({ isLoading, isInitializing }) => {
  const loadingText = useMemo(() => 
    isLoading ? 'Chargement de votre espace...' : 'Initialisation...', 
    [isLoading]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
      <BackgroundParticles />
      
      <div className="text-center space-y-6 relative z-10 max-w-md mx-auto px-4">
        {/* Logo avec animation améliorée */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="relative">
            <img 
              src="/logo.png" 
              alt="Logo de l'application" 
              className="h-12 w-12 animate-pulse-slow"
              onError={(e) => {
                // Fallback si le logo ne se charge pas
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
            <div className="absolute -top-2 -right-2 w-20 h-20 rounded-full animate-bounce-slow" />
          </div>
        </div>
        
        {/* Contenu de chargement */}
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" aria-hidden="true" />
          </div>
          <p className="text-gray-600 text-lg animate-pulse-slow font-medium">
            {loadingText}
          </p>
          <LoadingDots />
        </div>
      </div>
    </div>
  )
})

LoadingScreen.displayName = 'LoadingScreen'

// Hook personnalisé pour la gestion de l'initialisation
const useAppInitialization = () => {
  const { initialize } = useAuthStore()
  const { handleAsyncError, startLoading, stopLoading } = useAppState()
  const [initializing, setInitializing] = useState(true)
  const [initializationAttempts, setInitializationAttempts] = useState(0)

  const initializeApp = useCallback(async () => {
    if (initializationAttempts >= 3) {
      console.error('Échec de l\'initialisation après 3 tentatives')
      setInitializing(false)
      return
    }

    startLoading('app-init')
    setInitializing(true)
    
    try {
      const result = await handleAsyncError(
        async () => {
          await initialize()
        },
        'App Initialization'
      )
      
      if (result !== null) {
        setInitializationAttempts(prev => prev + 1)
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error)
      setInitializationAttempts(prev => prev + 1)
    } finally {
      setInitializing(false)
      stopLoading('app-init')
    }
  }, [initialize, handleAsyncError, startLoading, stopLoading, initializationAttempts])

  return { initializing, initializeApp, initializationAttempts }
}

function App() {
  const { user, loading } = useAuthStore()
  const { initializing, initializeApp } = useAppInitialization()

  // Initialisation de l'application
  useEffect(() => {
    initializeApp()
  }, []) // Dépendance vide pour n'exécuter qu'une fois

  // Optimisation du rendu conditionnel
  const shouldShowLoading = loading || initializing

  // Écran de chargement
  if (shouldShowLoading) {
    return <LoadingScreen isLoading={loading} isInitializing={initializing} />
  }

  // Contenu principal avec gestion d'erreur
  return (
    <div className="app-container">
      {/* Contenu principal avec transition améliorée */}
      <main className="transition-all duration-500 ease-in-out transform">
        {user ? (
          <Layout key="layout" />
        ) : (
          <AuthForm key="auth" />
        )}
      </main>

      {/* Système de notifications */}
      <NotificationContainer />
    </div>
  )
}

export default React.memo(App)
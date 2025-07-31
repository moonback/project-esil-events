import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Sparkles, ArrowRight, CheckCircle, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WelcomeProps {
  user: {
    name: string
    role: 'admin' | 'technicien'
  }
  onComplete?: () => void
}

export function Welcome({ user, onComplete }: WelcomeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const steps = [
    {
      title: `Bienvenue ${user.name} !`,
      description: `Ravi de vous revoir dans votre espace ${user.role === 'admin' ? 'd\'administration' : 'technicien'}.`,
      icon: Sparkles
    },
    {
      title: 'Votre tableau de bord',
      description: user.role === 'admin' 
        ? 'Gérez vos missions, techniciens et suivez les performances.'
        : 'Consultez vos missions, disponibilités et mettez à jour votre profil.',
      icon: CheckCircle
    },
    {
      title: 'Prêt à commencer ?',
      description: 'Tout est configuré pour vous offrir la meilleure expérience possible.',
      icon: Star
    }
  ]

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (currentStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        onComplete?.()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [currentStep, steps.length, onComplete])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={cn(
        'bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl',
        'transform transition-all duration-500 ease-out',
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      )}>
        <div className="text-center space-y-6">
          {/* Logo et titre */}
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="relative">
              <Sparkles className="h-8 w-8 text-indigo-600 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Esil-events
            </h1>
          </div>

          {/* Étapes */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep

              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-center space-x-3 p-3 rounded-lg transition-all duration-300',
                    isActive ? 'bg-indigo-50 border border-indigo-200' : '',
                    isCompleted ? 'opacity-60' : ''
                  )}
                >
                  <div className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600',
                    isCompleted ? 'bg-green-600 text-white' : ''
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={cn(
                      'font-semibold text-sm',
                      isActive ? 'text-indigo-900' : 'text-gray-700'
                    )}>
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Indicateurs de progression */}
          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  index === currentStep ? 'bg-indigo-600 w-6' : 'bg-gray-300',
                  index < currentStep ? 'bg-green-500' : ''
                )}
              />
            ))}
          </div>

          {/* Bouton d'action */}
          {currentStep === steps.length - 1 && (
            <button
              onClick={onComplete}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 mx-auto group"
            >
              <span>Commencer</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Hook pour gérer l'affichage du bienvenue
export function useWelcome() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [hasShownWelcome, setHasShownWelcome] = useState(false)

  const showWelcomeScreen = useCallback(() => {
    if (!hasShownWelcome) {
      setShowWelcome(true)
    }
  }, [hasShownWelcome])

  const hideWelcomeScreen = useCallback(() => {
    setShowWelcome(false)
    setHasShownWelcome(true)
    // Sauvegarder dans localStorage
    localStorage.setItem('welcome-shown', 'true')
  }, [])

  // Vérifier si le bienvenue a déjà été affiché
  useEffect(() => {
    const welcomeShown = localStorage.getItem('welcome-shown')
    if (welcomeShown) {
      setHasShownWelcome(true)
    }
  }, [])

  return useMemo(() => ({
    showWelcome,
    showWelcomeScreen,
    hideWelcomeScreen,
    hasShownWelcome
  }), [showWelcome, showWelcomeScreen, hideWelcomeScreen, hasShownWelcome])
} 
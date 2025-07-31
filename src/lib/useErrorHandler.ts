import { useState, useCallback, useMemo } from 'react'
import { useNotifications } from '@/components/ui/notification'

interface ErrorHandlerOptions {
  showNotification?: boolean
  logToConsole?: boolean
  fallbackMessage?: string
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { showNotification = true, logToConsole = true, fallbackMessage = 'Une erreur est survenue' } = options
  const { addNotification } = useNotifications()
  const [errors, setErrors] = useState<Error[]>([])

  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error
    const errorMessage = errorObj.message || fallbackMessage
    
    if (logToConsole) {
      console.error(`[${context || 'App'}]:`, errorObj)
    }

    if (showNotification) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: errorMessage,
        duration: 6000
      })
    }

    setErrors(prev => [...prev, errorObj])
  }, [addNotification, showNotification, logToConsole, fallbackMessage])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await asyncFn()
    } catch (error) {
      handleError(error as Error, context)
      return null
    }
  }, [handleError])

  return {
    errors,
    handleError,
    handleAsyncError,
    clearErrors,
    hasErrors: errors.length > 0
  }
}

// Hook pour gérer les états de chargement
export function useLoadingState() {
  const [loading, setLoading] = useState(false)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const startLoading = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => ({ ...prev, [key]: true }))
    } else {
      setLoading(true)
    }
  }, [])

  const stopLoading = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => ({ ...prev, [key]: false }))
    } else {
      setLoading(false)
    }
  }, [])

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates[key] || false
    }
    return loading
  }, [loading, loadingStates])

  return {
    loading,
    loadingStates,
    startLoading,
    stopLoading,
    isLoading
  }
}

// Hook combiné pour la gestion d'état
export function useAppState() {
  const errorHandler = useErrorHandler()
  const loadingState = useLoadingState()

  // Utiliser useMemo pour éviter les recréations d'objets
  const appState = useMemo(() => ({
    ...errorHandler,
    ...loadingState
  }), [errorHandler, loadingState])

  return appState
} 
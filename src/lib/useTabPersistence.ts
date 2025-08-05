import { useEffect, useRef } from 'react'

interface TabPersistenceOptions {
  tabId: string
  autoRefresh?: boolean
  refreshInterval?: number
  onTabActivate?: () => void
  onTabDeactivate?: () => void
}

export function useTabPersistence({
  tabId,
  autoRefresh = true,
  refreshInterval = 30000, // 30 secondes
  onTabActivate,
  onTabDeactivate
}: TabPersistenceOptions) {
  const isActive = useRef(false)
  const refreshTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Fonction pour détecter si l'onglet est actif
    const checkTabVisibility = () => {
      const isVisible = !document.hidden
      const wasActive = isActive.current
      isActive.current = isVisible

      if (isVisible && !wasActive) {
        console.log(`📱 Onglet ${tabId} activé`)
        onTabActivate?.()
      } else if (!isVisible && wasActive) {
        console.log(`📱 Onglet ${tabId} désactivé`)
        onTabDeactivate?.()
      }
    }

    // Écouter les changements de visibilité
    document.addEventListener('visibilitychange', checkTabVisibility)
    
    // Vérifier l'état initial
    checkTabVisibility()

    // Configurer le rafraîchissement automatique si activé
    if (autoRefresh) {
      refreshTimer.current = setInterval(() => {
        if (isActive.current) {
          console.log(`🔄 Rafraîchissement automatique pour l'onglet ${tabId}`)
          onTabActivate?.()
        }
      }, refreshInterval)
    }

    return () => {
      document.removeEventListener('visibilitychange', checkTabVisibility)
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current)
      }
    }
  }, [tabId, autoRefresh, refreshInterval, onTabActivate, onTabDeactivate])

  return {
    isActive: isActive.current
  }
} 
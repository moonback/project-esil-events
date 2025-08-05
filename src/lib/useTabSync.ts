import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAdminStore } from '@/store/adminStore'
import { useMissionsStore } from '@/store/missionsStore'

export function useTabSync() {
  const { user, isAuthenticated, signOut } = useAuthStore()
  const { resetStore: resetAdminStore } = useAdminStore()
  const { resetStore: resetMissionsStore } = useMissionsStore()
  const isListening = useRef(false)

  useEffect(() => {
    if (isListening.current) return

    isListening.current = true

    // Écouter les événements de stockage pour synchroniser entre les onglets
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth-storage') {
        console.log('Changement d\'authentification détecté dans un autre onglet')
        
        // Vérifier si l'utilisateur a été déconnecté dans un autre onglet
        try {
          const authData = event.newValue ? JSON.parse(event.newValue) : null
          if (!authData?.state?.isAuthenticated && isAuthenticated) {
            console.log('Déconnexion détectée dans un autre onglet')
            
            // Nettoyer les stores
            resetAdminStore()
            resetMissionsStore()
            
            // Rediriger vers la page de connexion
            window.location.href = '/'
          }
        } catch (error) {
          console.error('Erreur lors du parsing des données d\'authentification:', error)
        }
      }
    }

    // Écouter les événements de visibilité pour synchroniser quand l'onglet redevient actif
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        console.log('Onglet redevenu actif, synchronisation...')
        // Ici on pourrait ajouter une logique pour rafraîchir les données
        // si nécessaire
      }
    }

    // Écouter les événements de focus pour synchroniser quand l'onglet redevient actif
    const handleFocus = () => {
      if (isAuthenticated) {
        console.log('Onglet redevient actif, vérification de l\'authentification...')
        // Vérifier si l'utilisateur est toujours authentifié
        // Cette vérification peut être ajoutée si nécessaire
      }
    }

    // Ajouter les écouteurs d'événements
    window.addEventListener('storage', handleStorageChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      isListening.current = false
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [isAuthenticated, resetAdminStore, resetMissionsStore])

  // Fonction pour forcer la synchronisation entre les onglets
  const forceSync = () => {
    // Déclencher un événement de stockage pour notifier les autres onglets
    const event = new StorageEvent('storage', {
      key: 'auth-storage',
      newValue: JSON.stringify({
        state: {
          user,
          isAuthenticated
        }
      })
    })
    window.dispatchEvent(event)
  }

  return {
    forceSync,
    isListening: isListening.current
  }
} 
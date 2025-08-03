import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/lib/useToast'

export function TestNotifications() {
  const profile = useAuthStore(state => state.profile)
  const { showSuccess, showError } = useToast()
  const [isTesting, setIsTesting] = useState(false)

  const testCreateNotification = async () => {
    if (!profile) return

    setIsTesting(true)

    try {
      // Essayer d'abord avec la fonction RPC
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('create_notification', {
          p_user_id: profile.id,
          p_title: 'Test de notification',
          p_message: 'Ceci est un test de notification pour vérifier que le système fonctionne correctement.',
          p_type: 'info'
        })

      if (rpcError) {
        console.warn('Erreur RPC:', rpcError)
        
        // Fallback: essayer d'insérer directement
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            user_id: profile.id,
            title: 'Test de notification',
            message: 'Ceci est un test de notification pour vérifier que le système fonctionne correctement.',
            type: 'info',
            read: false
          })
          .select()

        if (error) {
          console.error('Erreur lors de la création de la notification:', error)
          showError('Erreur', `Impossible de créer la notification: ${error.message}`)
        } else {
          console.log('Notification créée avec succès:', data)
          showSuccess('Succès', 'Notification de test créée avec succès')
        }
      } else {
        console.log('Notification créée avec succès via RPC:', rpcData)
        showSuccess('Succès', 'Notification de test créée avec succès via RPC')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showError('Erreur', 'Erreur lors du test')
    } finally {
      setIsTesting(false)
    }
  }

  const testReadNotifications = async () => {
    if (!profile) return

    setIsTesting(true)

    try {
      // Lire les notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur lors de la lecture des notifications:', error)
        showError('Erreur', `Impossible de lire les notifications: ${error.message}`)
      } else {
        console.log('Notifications lues avec succès:', data)
        showSuccess('Succès', `${data?.length || 0} notification(s) trouvée(s)`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      showError('Erreur', 'Erreur lors du test de lecture')
    } finally {
      setIsTesting(false)
    }
  }

  const testCreateNotificationForOther = async () => {
    if (!profile) return

    setIsTesting(true)

    try {
      // Créer une notification pour un autre utilisateur (simulation admin)
      const { data, error } = await supabase
        .rpc('create_notification', {
          p_user_id: profile.id,
          p_title: 'Paiement effectué',
          p_message: 'Paiement effectué pour 3 factures - Total: 1500€\n\nFactures réglées:\n- Mission 1 (500€)\n- Mission 2 (600€)\n- Mission 3 (400€)',
          p_type: 'payment'
        })

      if (error) {
        console.error('Erreur lors de la création de la notification de paiement:', error)
        showError('Erreur', `Impossible de créer la notification de paiement: ${error.message}`)
      } else {
        console.log('Notification de paiement créée avec succès:', data)
        showSuccess('Succès', 'Notification de paiement créée avec succès')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showError('Erreur', 'Erreur lors du test de paiement')
    } finally {
      setIsTesting(false)
    }
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-gray-600">Veuillez vous connecter pour tester les notifications</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test des Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Utilisateur: {profile.name} (ID: {profile.id})
          </p>
          <p className="text-sm text-gray-600">
            Rôle: {profile.role}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={testCreateNotification}
            disabled={isTesting}
            variant="default"
          >
            {isTesting ? 'Test en cours...' : 'Créer une notification de test'}
          </Button>
          
          <Button
            onClick={testReadNotifications}
            disabled={isTesting}
            variant="outline"
          >
            {isTesting ? 'Test en cours...' : 'Lire les notifications'}
          </Button>

          <Button
            onClick={testCreateNotificationForOther}
            disabled={isTesting}
            variant="secondary"
          >
            {isTesting ? 'Test en cours...' : 'Créer notification de paiement'}
          </Button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Instructions de test:</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            <li>• Cliquez sur "Créer une notification de test" pour créer une notification simple</li>
            <li>• Cliquez sur "Lire les notifications" pour voir toutes vos notifications</li>
            <li>• Cliquez sur "Créer notification de paiement" pour simuler un paiement en lot</li>
            <li>• Allez ensuite dans le dashboard technicien → onglet "Notifications" pour voir les notifications</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 
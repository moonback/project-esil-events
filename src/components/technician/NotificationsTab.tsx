import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingOverlay } from '@/components/ui/loading'
import { 
  Bell, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/lib/useToast'
import type { Notification } from '@/types/database'

export function NotificationsTab() {
  const profile = useAuthStore(state => state.profile)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showRead, setShowRead] = useState(true)
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    if (profile) {
      fetchNotifications()
    }
  }, [profile])

  const fetchNotifications = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setNotifications(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
      showError('Erreur', 'Impossible de charger les notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      )

      showSuccess('Succès', 'Notification marquée comme lue')
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      showError('Erreur', 'Impossible de marquer la notification comme lue')
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', profile?.id)
        .eq('read', false)

      if (error) throw error

      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      )

      showSuccess('Succès', 'Toutes les notifications ont été marquées comme lues')
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      showError('Erreur', 'Impossible de marquer toutes les notifications comme lues')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      )

      showSuccess('Succès', 'Notification supprimée')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      showError('Erreur', 'Impossible de supprimer la notification')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="h-5 w-5 text-green-600" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'border-green-200 bg-green-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const filteredNotifications = showRead 
    ? notifications 
    : notifications.filter(notif => !notif.read)

  const unreadCount = notifications.filter(notif => !notif.read).length

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-800">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Non lues</p>
                <p className="text-2xl font-bold text-yellow-800">{unreadCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Paiements</p>
                <p className="text-2xl font-bold text-green-800">
                  {notifications.filter(n => n.type === 'payment').length}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRead(!showRead)}
            className="flex items-center gap-2"
          >
            {showRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showRead ? 'Masquer les lues' : 'Afficher toutes'}
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={markAllAsRead}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
        </div>

        <Badge variant="secondary" className="text-sm">
          {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Liste des notifications */}
      <LoadingOverlay loading={loading} text="Chargement des notifications...">
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Aucune notification
                </h3>
                <p className="text-gray-500">
                  {showRead 
                    ? "Vous n'avez pas encore reçu de notifications"
                    : "Toutes vos notifications ont été lues"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`transition-all duration-200 hover:shadow-md ${
                  notification.read ? 'opacity-75' : 'ring-2 ring-blue-200'
                } ${getNotificationColor(notification.type)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <Badge variant="default" className="bg-blue-600 text-white text-xs">
                              Nouveau
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {notification.type}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 text-sm leading-relaxed mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{formatDate(notification.created_at)}</span>
                          {notification.updated_at !== notification.created_at && (
                            <span>Modifié le {formatDate(notification.updated_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8 p-0"
                          title="Marquer comme lu"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </LoadingOverlay>
    </div>
  )
} 
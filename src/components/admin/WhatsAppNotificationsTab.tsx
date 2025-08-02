import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  RefreshCw,
  Phone,
  Calendar,
  User
} from 'lucide-react'
import { useWhatsAppNotifications } from '@/lib/useWhatsAppNotifications'
import { WhatsAppTestDialog } from './WhatsAppTestDialog'
import type { WhatsAppNotification, User as AppUser, Mission } from '@/types/database'

interface NotificationWithDetails extends WhatsAppNotification {
  users: AppUser
  missions: Mission
}

export function WhatsAppNotificationsTab() {
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'delivered'>('all')
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const { checkNotificationStatus } = useWhatsAppNotifications()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('whatsapp_notifications')
        .select(`
          *,
          users (id, name, phone),
          missions (id, title, type, location, date_start, date_end)
        `)
        .order('sent_at', { ascending: false })
        .limit(50)

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setNotifications(data || [])
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshStatus = async (notification: NotificationWithDetails) => {
    if (!notification.whatsapp_message_id) return

    try {
      const status = await checkNotificationStatus(notification.whatsapp_message_id)
      // Rafraîchir la liste après la mise à jour
      await fetchNotifications()
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Envoyé
          </Badge>
        )
      case 'delivered':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Livré
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Échec
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            {status}
          </Badge>
        )
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.users.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.missions.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.technician_phone.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatMissionDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle>Historique des Notifications WhatsApp</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestDialogOpen(true)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Test
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchNotifications}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="text-sm font-medium">
                Rechercher
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nom du technicien, titre de mission..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="sm:w-48">
              <Label htmlFor="status-filter" className="text-sm font-medium">
                Statut
              </Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="sent">Envoyé</option>
                <option value="delivered">Livré</option>
                <option value="failed">Échec</option>
              </select>
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">Chargement des notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">Aucune notification trouvée</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <Card key={notification.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{notification.users.name}</span>
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{notification.technician_phone}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{notification.missions.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {notification.missions.type}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <p><strong>Lieu:</strong> {notification.missions.location}</p>
                          <p><strong>Date:</strong> {formatMissionDate(notification.missions.date_start)} - {formatMissionDate(notification.missions.date_end)}</p>
                          <p><strong>Message:</strong> {notification.message.substring(0, 100)}...</p>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Envoyé le: {formatDate(notification.sent_at)}</span>
                          {notification.delivered_at && (
                            <span>Livré le: {formatDate(notification.delivered_at)}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        {getStatusBadge(notification.status)}
                        
                        {notification.whatsapp_message_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefreshStatus(notification)}
                            className="text-xs"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Vérifier
                          </Button>
                        )}
                        
                        {notification.error_message && (
                          <div className="text-xs text-red-600 max-w-xs">
                            <strong>Erreur:</strong> {notification.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Dialog de test */}
      <WhatsAppTestDialog 
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
      />
    </div>
  )
} 
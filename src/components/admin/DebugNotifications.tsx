import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/lib/useToast'

export function DebugNotifications() {
  const profile = useAuthStore(state => state.profile)
  const { showSuccess, showError } = useToast()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)

  const checkTableExists = async () => {
    setIsLoading(true)
    try {
      // Vérifier si la table existe
      const { data, error } = await supabase
        .from('notifications')
        .select('count')
        .limit(1)

      if (error) {
        setDebugInfo(prev => ({
          ...prev,
          tableExists: false,
          tableError: error.message
        }))
      } else {
        setDebugInfo(prev => ({
          ...prev,
          tableExists: true,
          tableError: null
        }))
      }
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        tableExists: false,
        tableError: error
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const checkRPCFunction = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('create_notification', {
          p_user_id: profile?.id || '00000000-0000-0000-0000-000000000000',
          p_title: 'Test RPC',
          p_message: 'Test de la fonction RPC',
          p_type: 'info'
        })

      if (error) {
        setDebugInfo(prev => ({
          ...prev,
          rpcExists: false,
          rpcError: error.message
        }))
      } else {
        setDebugInfo(prev => ({
          ...prev,
          rpcExists: true,
          rpcError: null,
          rpcResult: data
        }))
      }
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        rpcExists: false,
        rpcError: error
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const testDirectInsert = async () => {
    if (!profile) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: profile.id,
          title: 'Test Insert Direct',
          message: 'Test d\'insertion directe',
          type: 'info',
          read: false
        })
        .select()

      if (error) {
        setDebugInfo(prev => ({
          ...prev,
          directInsert: false,
          directInsertError: error.message
        }))
      } else {
        setDebugInfo(prev => ({
          ...prev,
          directInsert: true,
          directInsertError: null,
          directInsertResult: data
        }))
      }
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        directInsert: false,
        directInsertError: error
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const testReadNotifications = async () => {
    if (!profile) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        setDebugInfo(prev => ({
          ...prev,
          readSuccess: false,
          readError: error.message
        }))
      } else {
        setDebugInfo(prev => ({
          ...prev,
          readSuccess: true,
          readError: null,
          notifications: data
        }))
      }
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        readSuccess: false,
        readError: error
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const runAllTests = async () => {
    await checkTableExists()
    await checkRPCFunction()
    await testDirectInsert()
    await testReadNotifications()
  }

  useEffect(() => {
    if (profile) {
      runAllTests()
    }
  }, [profile])

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-gray-600">Veuillez vous connecter pour déboguer les notifications</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Débogage des Notifications</CardTitle>
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

        <div className="flex gap-2">
          <Button
            onClick={runAllTests}
            disabled={isLoading}
            variant="default"
          >
            {isLoading ? 'Tests en cours...' : 'Lancer tous les tests'}
          </Button>
        </div>

        {/* Résultats des tests */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Test de la table */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge variant={debugInfo.tableExists ? "default" : "destructive"}>
                    {debugInfo.tableExists ? "✓" : "✗"}
                  </Badge>
                  Table Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {debugInfo.tableError ? (
                  <p className="text-xs text-red-600">{debugInfo.tableError}</p>
                ) : (
                  <p className="text-xs text-green-600">Table accessible</p>
                )}
              </CardContent>
            </Card>

            {/* Test de la fonction RPC */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge variant={debugInfo.rpcExists ? "default" : "destructive"}>
                    {debugInfo.rpcExists ? "✓" : "✗"}
                  </Badge>
                  Fonction RPC
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {debugInfo.rpcError ? (
                  <p className="text-xs text-red-600">{debugInfo.rpcError}</p>
                ) : (
                  <p className="text-xs text-green-600">Fonction disponible</p>
                )}
              </CardContent>
            </Card>

            {/* Test d'insertion directe */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge variant={debugInfo.directInsert ? "default" : "destructive"}>
                    {debugInfo.directInsert ? "✓" : "✗"}
                  </Badge>
                  Insertion Directe
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {debugInfo.directInsertError ? (
                  <p className="text-xs text-red-600">{debugInfo.directInsertError}</p>
                ) : (
                  <p className="text-xs text-green-600">Insertion réussie</p>
                )}
              </CardContent>
            </Card>

            {/* Test de lecture */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge variant={debugInfo.readSuccess ? "default" : "destructive"}>
                    {debugInfo.readSuccess ? "✓" : "✗"}
                  </Badge>
                  Lecture Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {debugInfo.readError ? (
                  <p className="text-xs text-red-600">{debugInfo.readError}</p>
                ) : (
                  <p className="text-xs text-green-600">
                    {debugInfo.notifications?.length || 0} notification(s) trouvée(s)
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notifications trouvées */}
          {debugInfo.notifications && debugInfo.notifications.length > 0 && (
            <Card className="border-2 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notifications trouvées</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {debugInfo.notifications.map((notif: any, index: number) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                      <p><strong>ID:</strong> {notif.id}</p>
                      <p><strong>Titre:</strong> {notif.title}</p>
                      <p><strong>Type:</strong> {notif.type}</p>
                      <p><strong>Lu:</strong> {notif.read ? 'Oui' : 'Non'}</p>
                      <p><strong>Créé:</strong> {new Date(notif.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 
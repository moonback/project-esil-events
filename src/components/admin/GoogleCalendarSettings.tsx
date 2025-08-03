import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useGoogleCalendar } from '@/lib/useGoogleCalendar'
import { Calendar, CheckCircle, XCircle, RefreshCw, Settings, RotateCcw } from 'lucide-react'

export function GoogleCalendarSettings() {
  const {
    isAuthenticated,
    isLoading,
    error,
    calendars,
    connect,
    disconnect,
    refreshAuthStatus,
    refreshCalendars
  } = useGoogleCalendar()

  const handleRefreshStatus = async () => {
    await refreshAuthStatus()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Configuration Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statut de connexion */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Statut de connexion :</span>
            {isAuthenticated ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connecté
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" />
                Non connecté
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshStatus}
              disabled={isLoading}
              title="Rafraîchir le statut"
            >
              <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                disabled={isLoading}
              >
                Se déconnecter
              </Button>
            ) : (
              <Button
                onClick={connect}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Se connecter à Google Calendar
              </Button>
            )}
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Calendriers disponibles */}
        {isAuthenticated && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Calendriers disponibles :</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshCalendars}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            {calendars.length > 0 ? (
              <div className="space-y-2">
                {calendars.map((calendar) => (
                  <div
                    key={calendar.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                  >
                    <span className="text-sm">{calendar.summary}</span>
                    <Badge variant="outline" className="text-xs">
                      {calendar.id}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Aucun calendrier trouvé
              </p>
            )}
          </div>
        )}

        {/* Informations */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Fonctionnalités activées :
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Création automatique d'événements pour les missions</li>
            <li>• Envoi d'invitations par email aux techniciens</li>
            <li>• Rappels automatiques (24h et 1h avant)</li>
            <li>• Synchronisation des modifications</li>
          </ul>
        </div>

        {/* Instructions de configuration */}
        {!isAuthenticated && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">
              Configuration requise :
            </h4>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. Créer un projet Google Cloud Console</li>
              <li>2. Activer l'API Google Calendar</li>
              <li>3. Créer des identifiants OAuth 2.0</li>
              <li>4. Configurer les variables d'environnement</li>
            </ol>
          </div>
        )}

        {/* Instructions de dépannage */}
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-800 mb-2">
            Dépannage :
          </h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Si le statut reste "Non connecté" après connexion, cliquez sur le bouton de rafraîchissement</li>
            <li>• Vérifiez que les variables d'environnement sont correctement configurées</li>
            <li>• Assurez-vous que l'URL de redirection est configurée dans Google Cloud Console</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 
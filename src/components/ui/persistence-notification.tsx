import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Info, CheckCircle, RefreshCw } from 'lucide-react'

interface PersistenceNotificationProps {
  onDismiss?: () => void
  show?: boolean
}

export function PersistenceNotification({ onDismiss, show = true }: PersistenceNotificationProps) {
  const [isVisible, setIsVisible] = useState(show)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setIsVisible(show && !dismissed)
  }, [show, dismissed])

  const handleDismiss = () => {
    setDismissed(true)
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  return (
    <Card className="border-blue-200 bg-blue-50 mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
              <Info className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-sm font-semibold text-blue-900">
                  Amélioration de la persistance
                </h3>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                  Nouveau
                </Badge>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Le contenu est maintenant conservé lors du changement d'onglets. 
                Les données sont mises en cache et synchronisées automatiquement.
              </p>
              <div className="flex items-center space-x-4 text-xs text-blue-600">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Cache intelligent</span>
                </div>
                <div className="flex items-center space-x-1">
                  <RefreshCw className="h-3 w-3" />
                  <span>Sync automatique</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>État persistant</span>
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 
import React from 'react'
import { CheckCircle, XCircle, AlertCircle, Mail } from 'lucide-react'
import { Badge } from './badge'
import { Button } from './button'

export interface EmailNotificationProps {
  type: 'success' | 'error' | 'info' | 'loading'
  message: string
  onDismiss?: () => void
  showIcon?: boolean
}

export function EmailNotification({ 
  type, 
  message, 
  onDismiss, 
  showIcon = true 
}: EmailNotificationProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'info':
        return <Mail className="h-4 w-4 text-blue-600" />
      case 'loading':
        return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      default:
        return null
    }
  }

  const getBadgeColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-50 text-red-800 border-red-200'
      case 'info':
        return 'bg-blue-50 text-blue-800 border-blue-200'
      case 'loading':
        return 'bg-blue-50 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${getBadgeColor()}`}>
      <div className="flex items-center space-x-2">
        {showIcon && getIcon()}
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-6 w-6 p-0 hover:bg-transparent"
        >
          <XCircle className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

export interface EmailStatusProps {
  sent: number
  failed: number
  total: number
  isLoading?: boolean
}

export function EmailStatus({ sent, failed, total, isLoading }: EmailStatusProps) {
  if (total === 0) return null

  const successRate = total > 0 ? Math.round((sent / total) * 100) : 0

  return (
    <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2">
        <Mail className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          Notifications email
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {sent > 0 && (
              <Badge className="bg-green-100 text-green-800 text-xs">
                {sent} envoyé{sent > 1 ? 's' : ''}
              </Badge>
            )}
            {failed > 0 && (
              <Badge className="bg-red-100 text-red-800 text-xs">
                {failed} échec{failed > 1 ? 's' : ''}
              </Badge>
            )}
            <span className="text-xs text-gray-500">
              {successRate}% de succès
            </span>
          </>
        )}
      </div>
    </div>
  )
} 
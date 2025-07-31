import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

const colors = {
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
    title: 'text-green-800',
    message: 'text-green-700'
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-800',
    message: 'text-red-700'
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-800',
    message: 'text-yellow-700'
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-800',
    message: 'text-blue-700'
  }
}

export function Notification({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  
  const Icon = icons[type]
  const colorClasses = colors[type]

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    // Auto-fermeture
    if (duration > 0) {
      const closeTimer = setTimeout(() => {
        handleClose()
      }, duration)
      
      return () => {
        clearTimeout(timer)
        clearTimeout(closeTimer)
      }
    }
    
    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full',
        'transform transition-all duration-300 ease-in-out',
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        'animate-fade-in-up'
      )}
    >
      <div className={cn(
        'border rounded-lg p-4 shadow-lg backdrop-blur-sm',
        colorClasses.bg,
        'hover:shadow-xl transition-shadow duration-200'
      )}>
        <div className="flex items-start space-x-3">
          <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', colorClasses.icon)} />
          
          <div className="flex-1 min-w-0">
            <h4 className={cn('text-sm font-semibold', colorClasses.title)}>
              {title}
            </h4>
            {message && (
              <p className={cn('text-sm mt-1', colorClasses.message)}>
                {message}
              </p>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className={cn(
              'flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors',
              colorClasses.icon
            )}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook pour gérer les notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationProps[]>([])

  const addNotification = (notification: Omit<NotificationProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = {
      ...notification,
      id,
      onClose: (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }
    }
    setNotifications(prev => [...prev, newNotification])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return {
    notifications,
    addNotification,
    removeNotification
  }
}

// Composant conteneur pour les notifications
export function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  )
} 
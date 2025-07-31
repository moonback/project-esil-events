import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RealtimeIndicatorProps {
  isConnected?: boolean
  lastUpdate?: Date
  className?: string
}

export function RealtimeIndicator({ 
  isConnected = true, 
  lastUpdate, 
  className 
}: RealtimeIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [lastUpdateText, setLastUpdateText] = useState('')

  useEffect(() => {
    if (lastUpdate) {
      const now = new Date()
      const diff = now.getTime() - lastUpdate.getTime()
      const minutes = Math.floor(diff / (1000 * 60))
      
      if (minutes < 1) {
        setLastUpdateText('À l\'instant')
      } else if (minutes < 60) {
        setLastUpdateText(`Il y a ${minutes} min`)
      } else {
        const hours = Math.floor(minutes / 60)
        setLastUpdateText(`Il y a ${hours}h`)
      }
    }
  }, [lastUpdate])

  useEffect(() => {
    if (isConnected) {
      setIsVisible(true)
      const timer = setTimeout(() => setIsVisible(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isConnected])

  if (!isVisible) return null

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg',
      className
    )}>
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 text-green-600" />
          <span className="text-sm text-gray-600">Synchronisé</span>
          {lastUpdateText && (
            <span className="text-xs text-gray-400">• {lastUpdateText}</span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-600" />
          <span className="text-sm text-gray-600">Déconnecté</span>
        </>
      )}
    </div>
  )
}

interface SyncStatusProps {
  isConnected: boolean
  lastSync?: Date
  onRefresh?: () => void
}

export function SyncStatus({ isConnected, lastSync, onRefresh }: SyncStatusProps) {
  return (
    <div className="flex items-center space-x-2 text-xs text-gray-500">
      <div className={cn(
        'w-2 h-2 rounded-full',
        isConnected ? 'bg-green-500' : 'bg-red-500'
      )} />
      <span>
        {isConnected ? 'Synchronisé' : 'Hors ligne'}
      </span>
      {lastSync && (
        <span>• {lastSync.toLocaleTimeString()}</span>
      )}
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="p-1 hover:bg-gray-100 rounded"
          title="Actualiser"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      )}
    </div>
  )
} 
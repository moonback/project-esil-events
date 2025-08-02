import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Mail, AlertCircle } from 'lucide-react'
import { EmailService } from '../../services/emailService'

interface SmtpStatusProps {
  className?: string
  showDetails?: boolean
}

export function SmtpStatus({ className = '', showDetails = false }: SmtpStatusProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true)
      const emailService = EmailService.getInstance()
      setIsConnected(emailService.getConnectionStatus())
      setIsLoading(false)
    }

    checkConnection()

    // Vérifier la connexion toutes les 30 secondes
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-sm">Vérification SMTP...</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <Mail className="w-4 h-4 text-green-500" />
          {showDetails && (
            <span className="text-sm text-green-600 font-medium">
              SMTP connecté
            </span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <AlertCircle className="w-4 h-4 text-red-500" />
          {showDetails && (
            <span className="text-sm text-red-600 font-medium">
              SMTP déconnecté
            </span>
          )}
        </>
      )}
    </div>
  )
}

// Hook pour utiliser le statut SMTP
export const useSmtpStatus = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkStatus = () => {
      const emailService = EmailService.getInstance()
      setIsConnected(emailService.getConnectionStatus())
      setIsLoading(false)
    }

    checkStatus()
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return {
    isConnected,
    isLoading
  }
} 
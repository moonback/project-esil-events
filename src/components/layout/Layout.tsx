import React from 'react'
import { Header } from './Header'
import { useRealtimeSync } from '@/lib/useRealtimeSync'
import { useTabSync } from '@/lib/useTabSync'

interface LayoutProps {
  children?: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  // Activer la synchronisation en temps réel
  useRealtimeSync()
  
  // Activer la synchronisation entre les onglets
  useTabSync()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
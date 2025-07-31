import React from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { LogOut, User, Sparkles } from 'lucide-react'

export function Header() {
  const { profile, signOut } = useAuthStore()

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg relative overflow-hidden">
      {/* Effet de particules animées */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full animate-pulse-slow"></div>
        <div className="absolute top-8 right-8 w-1 h-1 bg-white rounded-full animate-bounce-slow"></div>
        <div className="absolute bottom-4 left-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-8 right-1/4 w-1 h-1 bg-white rounded-full animate-bounce-slow"></div>
      </div>
      
      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Sparkles className="h-8 w-8 text-white animate-pulse-slow" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce-slow"></div>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Esil-events
              </h1>
            </div>
            
            {profile && (
              <div className="flex items-center space-x-2">
                <span className="text-sm bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full font-medium border border-white/30 hover:bg-white/30 transition-all duration-300">
                  {profile.role === 'admin' ? '👑 Administrateur' : '🔧 Technicien'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-6">
            {profile && (
              <div className="flex items-center space-x-3 text-white">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{profile.name}</span>
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={signOut}
              className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
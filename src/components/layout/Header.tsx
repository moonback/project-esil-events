import React from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

export function Header() {
  const { profile, signOut } = useAuthStore()

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              EventPro
            </h1>
            {profile && (
              <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                {profile.role === 'admin' ? 'Administrateur' : 'Technicien'}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {profile && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{profile.name}</span>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={signOut}
              className="flex items-center space-x-2"
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
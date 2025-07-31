import React, { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, User, Sparkles, Menu, X, Bell, Settings, ChevronDown, Crown, Wrench } from 'lucide-react'

export function Header() {
  const { profile, signOut } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-blue-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Esil-events
                </h1>
              </div>
            </div>
            
            {/* Badge de rôle */}
            {profile && (
              <Badge className="text-xs px-2 py-1 rounded-md font-medium bg-blue-100 text-blue-700">
                {profile.role === 'admin' ? (
                  <>
                    <Crown className="h-3 w-3 mr-1" />
                    Admin
                  </>
                ) : (
                  <>
                    <Wrench className="h-3 w-3 mr-1" />
                    Tech
                  </>
                )}
              </Badge>
            )}
          </div>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {profile && (
              <>
                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                >
                  <Bell className="h-4 w-4 text-blue-600" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>

                {/* Profil utilisateur */}
                <div className="flex items-center space-x-2 px-3 py-2 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <div className="p-1 rounded-md bg-blue-600 text-white">
                    <User className="h-3 w-3" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{profile.name}</span>
                    <span className="text-xs text-gray-500">
                      {profile.role === 'admin' ? 'Administrateur' : 'Technicien'}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </div>
              </>
            )}
            
            {/* Bouton de déconnexion */}
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center space-x-1 px-3 py-2 rounded-md font-medium border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden lg:inline text-xs">Déconnexion</span>
            </Button>
          </div>

          {/* Menu mobile */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        <div className={`
          md:hidden overflow-hidden transition-all duration-300
          ${isMenuOpen ? 'max-h-64 opacity-100 mt-3' : 'max-h-0 opacity-0'}
        `}>
          <div className="p-3 rounded-md border border-gray-200 bg-white">
            {profile && (
              <div className="space-y-3">
                {/* Profil mobile */}
                <div className="flex items-center space-x-2 p-2 rounded-md bg-gray-50">
                  <div className="p-1.5 rounded-md bg-blue-600 text-white">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-800">
                      {profile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile.role === 'admin' ? 'Administrateur' : 'Technicien'}
                    </p>
                  </div>
                </div>

                {/* Actions mobiles */}
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start space-x-2 p-2 rounded-md text-sm text-gray-600 hover:bg-gray-100"
                  >
                    <Bell className="h-4 w-4 text-blue-600" />
                    <span>Notifications</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start space-x-2 p-2 rounded-md text-sm text-gray-600 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4 text-blue-600" />
                    <span>Paramètres</span>
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={signOut}
                    className="w-full justify-start space-x-2 p-2 rounded-md text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Déconnexion</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
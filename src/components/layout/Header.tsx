import React, { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAdminStore } from '@/store/adminStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SmtpStatus } from '@/components/ui/smtp-status'
import { SmtpTestDialog } from '@/components/admin/SmtpTestDialog'
import { 
  LogOut, User, Sparkles, Menu, X, Bell, Settings, ChevronDown, Crown, Wrench,
  Search, RefreshCw, Maximize2, Minimize2, BarChart3, Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const { profile, signOut } = useAuthStore()
  const { isConnected, refreshData } = useAdminStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [notifications, setNotifications] = useState(3)
  const [smtpTestOpen, setSmtpTestOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  // Gestion du rafraîchissement manuel
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshData()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  // Gestion du plein écran
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-200/50">
      <div className="max-w-12xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">
          {/* Logo et titre */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Dashboard ESIL</h1>
                <p className="text-xs sm:text-sm text-gray-600">Administration & Monitoring</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">ESIL</h1>
              </div>
            </div>
            
            {/* Badge de rôle */}
            {profile && (
              <Badge className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md font-medium bg-blue-100 text-blue-700">
                {profile.role === 'admin' ? (
                  <>
                    <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                    <span className="hidden sm:inline">Admin</span>
                    <span className="sm:hidden">A</span>
                  </>
                ) : (
                  <>
                    <Wrench className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                    <span className="hidden sm:inline">Tech</span>
                    <span className="sm:hidden">T</span>
                  </>
                )}
              </Badge>
            )}
          </div>

          {/* Actions et statut */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Statut SMTP - seulement pour admin */}
            {profile?.role === 'admin' && (
              <div className="hidden sm:flex items-center gap-2">
                <SmtpStatus />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSmtpTestOpen(true)}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Test SMTP"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative p-1.5 sm:p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            >
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
              {notifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </Button>

            {/* Bouton de rafraîchissement - seulement pour admin */}
            {profile?.role === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="hidden sm:block p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("h-4 w-4 sm:h-5 sm:w-5", isRefreshing && "animate-spin")} />
              </Button>
            )}

            {/* Plein écran - seulement pour admin */}
            {profile?.role === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="hidden lg:block p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
            )}

            {/* Profil utilisateur - version desktop */}
            <div className="hidden sm:flex items-center space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer">
              <div className="p-1 rounded-md bg-blue-600 text-white">
                <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-xs sm:text-sm">{profile?.name}</span>
                <span className="text-xs text-gray-500">
                  {profile?.role === 'admin' ? 'Administrateur' : 'Technicien'}
                </span>
              </div>
              <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400" />
            </div>
            
            {/* Bouton de déconnexion - version desktop */}
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="hidden sm:flex items-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md font-medium border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden lg:inline text-xs">Déconnexion</span>
            </Button>

            {/* Menu mobile */}
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMenu}
                className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100"
              >
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        <div className={`
          sm:hidden overflow-hidden transition-all duration-300
          ${isMenuOpen ? 'max-h-80 opacity-100 mt-2' : 'max-h-0 opacity-0'}
        `}>
          <div className="p-3 rounded-md border border-gray-200 bg-white shadow-lg">
            {profile && (
              <div className="space-y-3">
                {/* Profil mobile */}
                <div className="flex items-center space-x-3 p-3 rounded-md bg-gray-50">
                  <div className="p-2 rounded-md bg-blue-600 text-white">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-800">
                      {profile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile.role === 'admin' ? 'Administrateur' : 'Technicien'}
                    </p>
                  </div>
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
                </div>

                {/* Actions mobiles */}
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start space-x-3 p-3 rounded-md text-sm text-gray-600 hover:bg-gray-100"
                  >
                    <Bell className="h-4 w-4 text-blue-600" />
                    <span>Notifications ({notifications})</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start space-x-3 p-3 rounded-md text-sm text-gray-600 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4 text-blue-600" />
                    <span>Paramètres</span>
                  </Button>

                  {/* Bouton de rafraîchissement mobile - seulement pour admin */}
                  {profile?.role === 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="w-full justify-start space-x-3 p-3 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                      <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                      <span>Actualiser</span>
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    onClick={signOut}
                    className="w-full justify-start space-x-3 p-3 rounded-md text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100"
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

      {/* Dialog de test SMTP */}
      <SmtpTestDialog open={smtpTestOpen} onOpenChange={setSmtpTestOpen} />
    </header>
  )
}
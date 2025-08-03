import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAdminStore } from '@/store/adminStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LogOut, User, Menu, X, Bell, Settings, ChevronDown, Crown, Wrench,
  RefreshCw, Maximize2, Minimize2, BarChart3, Activity, Clock, 
  AlertCircle, CheckCircle, TrendingUp, Users as UsersIcon, Shield,
  Zap, DollarSign, Timer, ArrowUp, ArrowDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types pour une meilleure type safety
interface QuickStats {
  missions: number
  technicians: number
  revenue: number
  pending: number
}

interface NotificationData {
  count: number
  hasUrgent: boolean
}

// Hook personnalisé pour la gestion du plein écran
const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.warn('Fullscreen toggle failed:', error)
    }
  }, [])

  return { isFullscreen, toggleFullscreen }
}

// Hook pour formater les temps relatifs
const useRelativeTime = (timestamp: string | null) => {
  return useMemo(() => {
    if (!timestamp) return 'Jamais'
    
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins} min`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Il y a ${diffHours}h`
    
    const diffDays = Math.floor(diffHours / 24)
    return `Il y a ${diffDays}j`
  }, [timestamp])
}

// Composant pour les statistiques rapides
const QuickStatsCard = ({ icon: Icon, value, label, trend, color }: {
  icon: React.ElementType
  value: string | number
  label: string
  trend?: 'up' | 'down' | 'neutral'
  color: string
}) => (
  <div className={`p-3 rounded-lg bg-${color}-50 border border-${color}-100`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Icon className={`h-4 w-4 text-${color}-600`} />
        <span className={`text-sm font-semibold text-${color}-700`}>{value}</span>
      </div>
      {trend && (
        <div className={`p-1 rounded ${
          trend === 'up' ? 'bg-green-100' : 
          trend === 'down' ? 'bg-red-100' : 
          'bg-gray-100'
        }`}>
          {trend === 'up' && <ArrowUp className="h-3 w-3 text-green-600" />}
          {trend === 'down' && <ArrowDown className="h-3 w-3 text-red-600" />}
          {trend === 'neutral' && <Timer className="h-3 w-3 text-gray-600" />}
        </div>
      )}
    </div>
    <p className={`text-xs text-${color}-600 mt-1 font-medium`}>{label}</p>
  </div>
)

// Composant pour le badge de rôle
const RoleBadge = ({ role }: { role: string }) => {
  const isAdmin = role === 'admin'
  
  return (
    <Badge className={cn(
      "text-xs px-2 py-1 rounded-lg font-semibold transition-all duration-200 shadow-sm",
      isAdmin 
        ? "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200" 
        : "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200"
    )}>
      {isAdmin ? (
        <>
          <Crown className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">Administrateur</span>
          <span className="sm:hidden">Admin</span>
        </>
      ) : (
        <>
          <Wrench className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">Technicien</span>
          <span className="sm:hidden">Tech</span>
        </>
      )}
    </Badge>
  )
}

// Composant pour l'indicateur de connexion
const ConnectionStatus = ({ isConnected, lastSync }: { 
  isConnected: boolean
  lastSync: string 
}) => (
  <div className="flex items-center space-x-2">
    <div className={cn(
      "w-2 h-2 rounded-full transition-all duration-300",
      isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
    )} />
    <span className={cn(
      "text-xs font-medium",
      isConnected ? "text-green-700" : "text-red-700"
    )}>
      {isConnected ? 'En ligne' : 'Hors ligne'}
    </span>
    <span className="text-xs text-gray-500">• {lastSync}</span>
  </div>
)

export function Header() {
  const { profile, signOut } = useAuthStore()
  const { isConnected, refreshData, stats, lastSync } = useAdminStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notifications] = useState<NotificationData>({ count: 3, hasUrgent: true })
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const formattedLastSync = useRelativeTime(lastSync?.toISOString() || null)

  // Fermer les menus lors des clics extérieurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-menu]')) {
        setIsMenuOpen(false)
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Gestion optimisée du rafraîchissement
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      await refreshData()
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }, [isRefreshing, refreshData])

  // Calcul mémorisé des statistiques
  const quickStats = useMemo((): QuickStats | null => {
    if (!stats) return null
    
    return {
      missions: stats.missions?.total || 0,
      technicians: stats.technicians?.available || 0,
      revenue: stats.billings?.totalAmount || 0,
      pending: (stats.missions?.total || 0) - (stats.missions?.assignedCount || 0)
    }
  }, [stats])

  const isAdmin = profile?.role === 'admin'

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200/60">
      <div className="max-w-12xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">
          {/* Logo et informations */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-3">
                             {/* Logo avec animation */}
               <div className="relative group">
                 <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 overflow-hidden">
                   <img 
                     src="/logo.png" 
                     alt="ESIL-EVENTS Logo" 
                     className="w-full h-full object-cover"
                   />
                 </div>
                 {/* Indicateur de connexion sur le logo */}
                 <div className={cn(
                   "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white transition-colors",
                   isConnected ? "bg-green-500" : "bg-red-500"
                 )} />
                 
               </div>
              
              {/* Titre avec statut */}
              {/* <div className="hidden sm:block">
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    ESIL-EVENTS 
                  </h1>
                  {isAdmin && (
                    <span title="Mode Administrateur">
                      <Shield className="h-4 w-4 text-amber-500" />
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs sm:text-sm text-gray-600">Gestion du Personnel</p>
                  <ConnectionStatus isConnected={isConnected} lastSync={formattedLastSync} />
                </div>
              </div> */}
              
              {/* Version mobile */}
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">ESIL</h1>
                <ConnectionStatus isConnected={isConnected} lastSync={formattedLastSync} />
              </div>
            </div>
            
            {/* Badge de rôle */}
            {profile && <RoleBadge role={profile.role} />}
          </div>

          {/* Actions et contrôles */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Statistiques rapides - Desktop seulement pour admin */}
            {isAdmin && quickStats && (
              <div className="hidden xl:flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-1">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">{quickStats.missions}</span>
                  <span className="text-xs text-gray-500">missions</span>
                </div>
                <div className="w-px h-4 bg-gray-300" />
                <div className="flex items-center space-x-1">
                  <UsersIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-semibold text-gray-700">{quickStats.technicians}</span>
                  <span className="text-xs text-gray-500">techs</span>
                </div>
                {quickStats.pending > 0 && (
                  <>
                    <div className="w-px h-4 bg-gray-300" />
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-semibold text-orange-700">{quickStats.pending}</span>
                      <span className="text-xs text-orange-600">en attente</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all duration-200"
            >
              <Bell className="h-4 w-4" />
              {notifications.count > 0 && (
                <span className={cn(
                  "absolute -top-1 -right-1 h-5 w-5 text-xs rounded-full flex items-center justify-center font-semibold",
                  notifications.hasUrgent 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "bg-blue-500 text-white"
                )}>
                  {notifications.count > 9 ? '9+' : notifications.count}
                </span>
              )}
            </Button>

            {/* Bouton de rafraîchissement - Admin seulement */}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="hidden sm:flex p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50"
                title="Actualiser les données"
              >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              </Button>
            )}

            {/* Plein écran - Admin seulement */}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="hidden lg:flex p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}

            {/* Profil utilisateur - Desktop */}
            <div 
              className="hidden sm:block relative" 
              data-menu
            >
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                  <User className="h-3 w-3" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="font-semibold text-sm text-gray-900">{profile?.name}</p>
                  <p className="text-xs text-gray-500">
                    {isAdmin ? 'Administrateur' : 'Technicien'}
                  </p>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-400 transition-transform duration-200",
                  showProfileMenu && "rotate-180"
                )} />
              </button>
              
              {/* Menu déroulant du profil */}
              <div className={cn(
                "absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg transition-all duration-200 z-50",
                showProfileMenu ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
              )}>
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{profile?.name}</p>
                      <p className="text-sm text-gray-500">{profile?.email}</p>
                      <div className="mt-2">
                        <RoleBadge role={profile?.role || ''} />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm hover:bg-gray-50 rounded-lg">
                    <User className="h-4 w-4 mr-3" />
                    Mon profil
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm hover:bg-gray-50 rounded-lg">
                    <Settings className="h-4 w-4 mr-3" />
                    Paramètres
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm hover:bg-gray-50 rounded-lg">
                    <Bell className="h-4 w-4 mr-3" />
                    Notifications
                    {notifications.count > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {notifications.count}
                      </Badge>
                    )}
                  </Button>
                  <div className="border-t border-gray-100 my-2"></div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={signOut}
                    className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Déconnexion
                  </Button>
                </div>
              </div>
            </div>

            {/* Menu hamburger mobile */}
            <div className="sm:hidden" data-menu>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl text-gray-600 hover:bg-gray-100"
              >
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        <div className={cn(
          "sm:hidden overflow-hidden transition-all duration-300",
          isMenuOpen ? "max-h-[32rem] opacity-100 pb-4" : "max-h-0 opacity-0"
        )}>
          <div className="mt-4 p-4 rounded-xl border border-gray-200 bg-white shadow-lg">
            {profile && (
              <div className="space-y-4">
                {/* Profil mobile */}
                <div className="flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 border border-blue-100">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{profile.name}</p>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                    <div className="mt-2">
                      <RoleBadge role={profile.role} />
                    </div>
                  </div>
                </div>

                {/* Statistiques mobiles - Admin seulement */}
                {isAdmin && quickStats && (
                  <div className="grid grid-cols-2 gap-3">
                    <QuickStatsCard
                      icon={Activity}
                      value={quickStats.missions}
                      label="Missions"
                      color="blue"
                      trend="neutral"
                    />
                    <QuickStatsCard
                      icon={UsersIcon}
                      value={quickStats.technicians}
                      label="Techniciens"
                      color="green"
                      trend="up"
                    />
                    <QuickStatsCard
                      icon={DollarSign}
                      value={quickStats.revenue > 0 ? `${(quickStats.revenue / 1000).toFixed(1)}k€` : '0€'}
                      label="Revenus"
                      color="amber"
                      trend="up"
                    />
                    {quickStats.pending > 0 && (
                      <QuickStatsCard
                        icon={AlertCircle}
                        value={quickStats.pending}
                        label="En attente"
                        color="orange"
                        trend="down"
                      />
                    )}
                  </div>
                )}

                {/* Actions mobiles */}
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start space-x-3 p-3 rounded-xl text-sm hover:bg-gray-50"
                  >
                    <div className="relative">
                      <Bell className="h-4 w-4 text-blue-600" />
                      {notifications.count > 0 && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
                      )}
                    </div>
                    <span>Notifications ({notifications.count})</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start space-x-3 p-3 rounded-xl text-sm hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4 text-blue-600" />
                    <span>Paramètres</span>
                  </Button>

                  {/* Rafraîchissement mobile - Admin seulement */}
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="w-full justify-start space-x-3 p-3 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                      <RefreshCw className={cn("h-4 w-4 text-blue-600", isRefreshing && "animate-spin")} />
                      <span>Actualiser les données</span>
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    onClick={signOut}
                    className="w-full justify-start space-x-3 p-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-50 to-pink-50 text-red-600 hover:from-red-100 hover:to-pink-100 border border-red-200"
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
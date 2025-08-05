import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAdminStore } from '@/store/adminStore'
import { useMissionsStore } from '@/store/missionsStore'
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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  return { isFullscreen, toggleFullscreen }
}

// Fonction utilitaire pour formater les temps relatifs (pas un hook)
const formatRelativeTime = (timestamp: string | null): string => {
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
  const { profile, signOut, isAuthenticated } = useAuthStore()
  const { isConnected, refreshData, stats, lastSync, resetStore: resetAdminStore } = useAdminStore()
  const { resetStore: resetMissionsStore } = useMissionsStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notifications] = useState<NotificationData>({ count: 3, hasUrgent: true })
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  
  // Gestion sécurisée de lastSync
  const formattedLastSync = useMemo(() => {
    if (!lastSync) return 'Jamais'
    
    // Vérifier si lastSync est un objet Date valide
    if (lastSync instanceof Date && !isNaN(lastSync.getTime())) {
      return formatRelativeTime(lastSync.toISOString())
    }
    
    // Si c'est une chaîne, essayer de la convertir en Date
    if (typeof lastSync === 'string') {
      const date = new Date(lastSync)
      if (!isNaN(date.getTime())) {
        return formatRelativeTime(date.toISOString())
      }
    }
    
    return 'Jamais'
  }, [lastSync])

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

  // Gestion améliorée de la déconnexion
  const handleSignOut = useCallback(async () => {
    try {
      console.log('Déconnexion en cours...')
      
      // Nettoyer tous les stores avant la déconnexion
      resetAdminStore()
      resetMissionsStore()
      
      // Effectuer la déconnexion
      await signOut()
      
      // Rediriger vers la page de connexion
      window.location.href = '/'
      
      console.log('Déconnexion terminée')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      // Même en cas d'erreur, nettoyer les stores et rediriger
      resetAdminStore()
      resetMissionsStore()
      window.location.href = '/'
    }
  }, [signOut, resetAdminStore, resetMissionsStore])

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

  // Si l'utilisateur n'est pas authentifié, ne pas afficher le header
  if (!isAuthenticated) {
    return null
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-200/60">
      <div className="max-w-12xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">
          {/* Logo et informations */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-3">
                             {/* Logo avec animation */}
               <div className="relative group">
                 <button 
                   onClick={() => window.location.reload()}
                   className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 overflow-hidden cursor-pointer"
                   title="Retour à l'accueil"
                 >
                   <img 
                     src="/logo.png" 
                     alt="ESIL-EVENTS Logo" 
                     className="w-full h-full object-cover"
                   />
                 </button>
                 {/* Indicateur de connexion sur le logo */}
                 <div className={cn(
                   "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white transition-colors",
                   isConnected ? "bg-green-500" : "bg-red-500"
                 )} />
                 
               </div>
              
              
              
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
              <div className="hidden lg:flex items-center space-x-4">
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

            {/* Actions principales */}
            <div className="flex items-center space-x-2">
              {/* Bouton de rafraîchissement - Admin seulement */}
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-xl text-gray-600 hover:bg-gray-100"
                  title="Actualiser les données"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
              )}

              {/* Bouton plein écran */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="p-2 rounded-xl text-gray-600 hover:bg-gray-100"
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>

              {/* Menu profil */}
              <div className="relative" data-menu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 p-2 rounded-xl text-gray-700 hover:bg-gray-100"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                    {profile?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{profile?.name}</p>
                    <p className="text-xs text-gray-500">{profile?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>

                {/* Menu déroulant */}
                <div className={cn(
                  "absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 transition-all duration-200",
                  showProfileMenu ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                )}>
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold">
                        {profile?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{profile?.name}</p>
                        <p className="text-sm text-gray-500">{profile?.email}</p>
                        <RoleBadge role={profile?.role || 'technicien'} />
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <User className="h-4 w-4 mr-3" />
                      Mon profil
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Paramètres
                    </Button>

                    <div className="border-t border-gray-100 my-2"></div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleSignOut}
                      className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Déconnexion
                    </Button>
                  </div>
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
                    onClick={handleSignOut}
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
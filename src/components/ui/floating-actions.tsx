import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  User,
  Settings,
  Home,
  Map} from 'lucide-react'
import { useToast } from '@/lib/useToast'

interface FloatingActionsProps {
  onTabChange?: (tab: string) => void
  currentTab?: string
  userType?: 'admin' | 'technician'
  onFullscreenKanban?: () => void
}

type ActionItem = {
  id: string
  label: string
  icon: any
  tab: string
  fullscreen?: boolean
}

// Configuration des actions par type d'utilisateur
const ACTIONS_CONFIG: Record<'admin' | 'technician', ActionItem[]> = {
  technician: [
    { id: 'home', label: 'Accueil', icon: Home, tab: 'availability' },
    { id: 'missions', label: 'Missions', icon: FileText, tab: 'missions' },
    { id: 'billing', label: 'Facturation', icon: DollarSign, tab: 'billing' },
    { id: 'agenda', label: 'Agenda', icon: Calendar, tab: 'agenda' },
    { id: 'profile', label: 'Profil', icon: User, tab: 'profile' }
  ],
  admin: [
    { id: 'missions', label: 'Missions', icon: FileText, tab: 'missions' },
    { id: 'map', label: 'Carte', icon: Map, tab: 'map' },
    { id: 'assignations', label: 'Assignations', icon: Settings, tab: 'assignations' },
    { id: 'technicians', label: 'Techniciens', icon: User, tab: 'technicians' },
    { id: 'agenda', label: 'Agenda', icon: Calendar, tab: 'agenda' },
    { id: 'billing', label: 'Facturation', icon: DollarSign, tab: 'billing' },
  ]
}

export function FloatingActions({ onTabChange, currentTab, userType = 'technician', onFullscreenKanban }: FloatingActionsProps) {
  const { showInfo } = useToast()

  // Mémoisation des actions pour éviter les recalculs
  const actions = useMemo(() => ACTIONS_CONFIG[userType], [userType])

  const handleActionClick = (action: ActionItem) => {
    if (action.fullscreen && onFullscreenKanban) {
      onFullscreenKanban()
      showInfo("Plein Écran", "Ouverture du kanban en plein écran...")
      return
    }
    
    if (onTabChange && action.tab !== currentTab) {
      onTabChange(action.tab)
      showInfo("Navigation", `Redirection vers ${action.label.toLowerCase()}...`)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Gradient de fond moderne */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-xl" />
      
      {/* Barre de navigation */}
      <div className="relative">
        {/* Indicateur de ligne décorative */}
        <div className="h-1 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-full mx-4" />
        
        <div className="flex items-center justify-around px-3 py-4 max-w-sm mx-auto">
          {actions.map((action, index) => {
            const Icon = action.icon
            const isActive = currentTab === action.tab && !action.fullscreen
            
            return (
              <Button
                key={action.id}
                onClick={() => handleActionClick(action)}
                variant="ghost"
                size="sm"
                className={`
                  flex flex-col items-center justify-center gap-1.5
                  w-14 h-14 rounded-2xl transition-all duration-500
                  ${isActive 
                    ? 'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-200 transform scale-110' 
                    : action.fullscreen 
                      ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 hover:scale-105' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover:scale-105'
                  }
                  group relative overflow-hidden
                `}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
                aria-label={action.label}
              >
                {/* Effet de brillance pour l'onglet actif */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
                )}
                
                <Icon className={`h-5 w-5 transition-all duration-300 relative z-10 ${
                  isActive ? 'scale-110 text-white' : 'group-hover:scale-110'
                }`} />
                
                <span className={`text-xs font-semibold transition-all duration-300 relative z-10 ${
                  isActive ? 'text-white' : action.fullscreen ? 'text-purple-600' : 'text-gray-600'
                }`}>
                  {action.label}
                </span>
                
                {/* Indicateur d'état actif */}
                {isActive && (
                  <div className="absolute -top-1 w-2 h-2 bg-white rounded-full shadow-sm animate-bounce" />
                )}
                
                {/* Tooltip amélioré */}
                <div className="absolute bottom-full mb-3 px-3 py-2 bg-gray-900/95 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap backdrop-blur-sm shadow-lg transform -translate-y-1 group-hover:translate-y-0">
                  {action.label}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900/95"></div>
                </div>
              </Button>
            )
          })}
        </div>
        
        {/* Indicateur de sécurité pour l'iPhone */}
        <div className="h-safe-area-inset-bottom bg-transparent" />
      </div>
    </div>
  )
}
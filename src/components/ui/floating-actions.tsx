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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200/50 shadow-lg">
      <div className="flex items-center justify-around px-2 py-3 max-w-md mx-auto">
        {actions.map((action) => {
          const Icon = action.icon
          const isActive = currentTab === action.tab && !action.fullscreen
          
          return (
            <Button
              key={action.id}
              onClick={() => handleActionClick(action)}
              variant="ghost"
              size="sm"
              className={`
                flex flex-col items-center justify-center gap-1
                w-12 h-12 rounded-xl transition-all duration-300
                ${isActive 
                  ? 'text-blue-600 bg-blue-50/50 shadow-sm' 
                  : action.fullscreen 
                    ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                }
                group relative
              `}
              aria-label={action.label}
            >
              <Icon className={`h-5 w-5 transition-all duration-300 ${
                isActive ? 'scale-110' : 'group-hover:scale-110'
              }`} />
              
              <span className={`text-xs font-medium hidden sm:block transition-colors ${
                isActive ? 'text-blue-600' : action.fullscreen ? 'text-purple-600' : 'text-gray-500'
              }`}>
                {action.label}
              </span>
              
              {isActive && (
                <div className="absolute -top-1 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              )}
              
              <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap sm:hidden backdrop-blur-sm">
                {action.label}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900/90"></div>
              </div>
            </Button>
          )
        })}
      </div>
      
      <div className="h-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 sm:hidden" />
    </div>
  )
} 
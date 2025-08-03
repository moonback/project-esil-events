import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText, 
  Plus,
  X,
  User,
  Settings,
  Home,
  Map
} from 'lucide-react'
import { useToast } from '@/lib/useToast'

interface FloatingActionsProps {
  onTabChange?: (tab: string) => void
  currentTab?: string
  userType?: 'admin' | 'technician'
}

export function FloatingActions({ onTabChange, currentTab, userType = 'technician' }: FloatingActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { showInfo } = useToast()

  const technicianActions = [
    {
      id: 'home',
      label: 'Accueil',
      icon: Home,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500',
      tab: 'availability'
    },
    {
      id: 'missions',
      label: 'Missions',
      icon: FileText,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-500',
      tab: 'missions'
    },
    {
      id: 'billing',
      label: 'Facturation',
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500',
      tab: 'billing'
    },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500',
      tab: 'agenda'
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: User,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500',
      tab: 'profile'
    }
  ]

  const adminActions = [
    {
      id: 'missions',
      label: 'Missions',
      icon: FileText,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-500',
      tab: 'missions'
    },
    {
      id: 'map',
      label: 'Carte',
      icon: Map,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-500',
      tab: 'map'
    },
    {
      id: 'assignations',
      label: 'Assignations',
      icon: Settings,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500',
      tab: 'assignations'
    },
    {
      id: 'technicians',
      label: 'Techniciens',
      icon: User,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500',
      tab: 'technicians'
    },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500',
      tab: 'agenda'
    },
    {
      id: 'billing',
      label: 'Facturation',
      icon: DollarSign,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500',
      tab: 'billing'
    }
  ]

  const actions = userType === 'admin' ? adminActions : technicianActions

  const handleActionClick = (action: any) => {
    if (onTabChange && action.tab !== currentTab) {
      onTabChange(action.tab)
      showInfo(
        "Navigation",
        `Redirection vers ${action.label.toLowerCase()}...`
      )
    }
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Actions rapides avec animation améliorée */}
      <div className={`transition-all duration-500 ease-out ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}>
        <div className="flex flex-col items-end space-y-4 mb-6">
          {actions.map((action, index) => {
            const Icon = action.icon
            const isActive = currentTab === action.tab
            
            return (
              <div
                key={action.id}
                className={`transition-all duration-300 ease-out transform ${
                  isOpen 
                    ? 'translate-x-0 opacity-100' 
                    : 'translate-x-8 opacity-0'
                }`}
                style={{
                  transitionDelay: `${index * 100}ms`
                }}
              >
                <Button
                  onClick={() => handleActionClick(action)}
                  className={`
                    relative overflow-hidden group
                    bg-gradient-to-r ${action.color}
                    text-white shadow-2xl hover:shadow-3xl
                    transition-all duration-300 ease-out
                    transform hover:scale-110 hover:-translate-y-1
                    ${isActive ? 'ring-4 ring-white ring-offset-2 ring-offset-gray-900' : ''}
                    min-w-[140px] h-12 px-4 rounded-full
                    backdrop-blur-sm border border-white/20
                  `}
                  size="sm"
                >
                  {/* Effet de brillance au survol */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                  
                  <Icon className="h-4 w-4 mr-2 relative z-10" />
                  <span className="text-sm font-semibold relative z-10">{action.label}</span>
                  
                  {/* Indicateur actif */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse" />
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bouton principal amélioré */}
      <div className="relative">
        {/* Effet de halo */}
        <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-300 ${
          isOpen 
            ? 'bg-red-400/30 scale-125' 
            : 'bg-blue-400/30 scale-100'
        }`} />
        
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            relative z-10
            ${isOpen 
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
            }
            text-white shadow-2xl hover:shadow-3xl
            transition-all duration-300 ease-out
            transform hover:scale-110 active:scale-95
            w-16 h-16 rounded-full
            backdrop-blur-sm border border-white/20
            group
          `}
          size="lg"
        >
          {/* Effet de rotation */}
          <div className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </div>
          
          {/* Effet de brillance */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
        </Button>
        
        {/* Indicateur de pulsation */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />
        )}
      </div>
    </div>
  )
} 
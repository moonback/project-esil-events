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
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      {/* Menu de navigation responsive */}
      <div className="flex items-center justify-around px-2 py-3 max-w-md mx-auto">
        {actions.map((action) => {
          const Icon = action.icon
          const isActive = currentTab === action.tab
          
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
                  ? 'bg-gradient-to-r ' + action.color + ' text-white shadow-lg scale-110' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
                group relative
              `}
              aria-label={action.label}
            >
              <Icon className={`h-5 w-5 transition-all duration-300 ${
                isActive ? 'scale-110' : 'group-hover:scale-110'
              }`} />
              
              {/* Label pour desktop */}
              <span className="text-xs font-medium hidden sm:block">
                {action.label}
              </span>
              
              {/* Indicateur actif */}
              {isActive && (
                <div className="absolute -top-1 w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
              
              {/* Tooltip pour mobile */}
              <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap sm:hidden">
                {action.label}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900"></div>
              </div>
            </Button>
          )
        })}
      </div>
      
      {/* Indicateur de scroll pour mobile */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 sm:hidden" />
    </div>
  )
} 
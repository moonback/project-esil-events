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
      color: 'bg-blue-500 hover:bg-blue-600',
      tab: 'availability'
    },
    {
      id: 'missions',
      label: 'Missions',
      icon: FileText,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      tab: 'missions'
    },
    {
      id: 'billing',
      label: 'Facturation',
      icon: DollarSign,
      color: 'bg-purple-500 hover:bg-purple-600',
      tab: 'billing'
    },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: Calendar,
      color: 'bg-green-500 hover:bg-green-600',
      tab: 'agenda'
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: User,
      color: 'bg-orange-500 hover:bg-orange-600',
      tab: 'profile'
    }
  ]

  const adminActions = [
    {
      id: 'missions',
      label: 'Missions',
      icon: FileText,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      tab: 'missions'
    },
    {
      id: 'map',
      label: 'Carte',
      icon: Map,
      color: 'bg-red-500 hover:bg-red-600',
      tab: 'map'
    },
    {
      id: 'assignations',
      label: 'Assignations',
      icon: Settings,
      color: 'bg-blue-500 hover:bg-blue-600',
      tab: 'assignations'
    },
    {
      id: 'technicians',
      label: 'Techniciens',
      icon: User,
      color: 'bg-green-500 hover:bg-green-600',
      tab: 'technicians'
    },
    {
      id: 'agenda',
      label: 'Agenda',
      icon: Calendar,
      color: 'bg-purple-500 hover:bg-purple-600',
      tab: 'agenda'
    },
    {
      id: 'billing',
      label: 'Facturation',
      icon: DollarSign,
      color: 'bg-orange-500 hover:bg-orange-600',
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
      {/* Actions rapides */}
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="flex flex-col items-end space-y-3 mb-4">
          {actions.map((action) => {
            const Icon = action.icon
            const isActive = currentTab === action.tab
            
            return (
              <Button
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`${action.color} text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 ${isActive ? 'ring-2 ring-white ring-offset-2' : ''}`}
                size="sm"
              >
                <Icon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Bouton principal */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
        size="lg"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </Button>
    </div>
  )
} 
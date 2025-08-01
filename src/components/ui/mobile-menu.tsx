import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  Menu, Home, Users, Calendar, CreditCard, Activity, 
  Plus, Settings, Bell, Search, Filter, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileMenuProps {
  className?: string
}

export function MobileMenu({ className }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    {
      icon: <Home className="h-5 w-5" />,
      label: 'Tableau de bord',
      href: '#',
      active: true
    },
    {
      icon: <Activity className="h-5 w-5" />,
      label: 'Missions',
      href: '#missions',
      count: 12
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Techniciens',
      href: '#technicians',
      count: 8
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: 'Agenda',
      href: '#agenda'
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Facturation',
      href: '#billing',
      count: 5
    }
  ]

  const quickActions = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: 'Nouvelle mission',
      action: () => console.log('Nouvelle mission')
    },
    {
      icon: <Search className="h-4 w-4" />,
      label: 'Rechercher',
      action: () => console.log('Rechercher')
    },
    {
      icon: <Filter className="h-4 w-4" />,
      label: 'Filtrer',
      action: () => console.log('Filtrer')
    }
  ]

  return (
    <>
      {/* Menu hamburger pour desktop */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("md:hidden", className)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            {/* En-tête */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">ESIL Admin</h2>
                  <p className="text-sm text-gray-600">Gestion des missions</p>
                </div>
              </div>
            </div>

            {/* Navigation principale */}
            <div className="flex-1 p-4">
              <nav className="space-y-2">
                {menuItems.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-colors",
                      item.active 
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200" 
                        : "hover:bg-gray-50 text-gray-700"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        item.active ? "bg-indigo-100" : "bg-gray-100"
                      )}>
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.count && (
                        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                          {item.count}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </a>
                ))}
              </nav>
            </div>

            {/* Actions rapides */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions rapides</h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start h-10"
                    onClick={() => {
                      action.action()
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-gray-100 rounded-lg">
                        {action.icon}
                      </div>
                      <span className="text-sm">{action.label}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Connecté</span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Barre de navigation inférieure pour mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {menuItems.slice(0, 4).map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={cn(
                "flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors min-w-0 flex-1",
                item.active 
                  ? "text-indigo-600 bg-indigo-50" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg",
                item.active ? "bg-indigo-100" : "bg-gray-100"
              )}>
                {item.icon}
              </div>
              <span className="text-xs font-medium truncate">{item.label}</span>
              {item.count && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {item.count > 9 ? '9+' : item.count}
                </span>
              )}
            </a>
          ))}
          
          {/* Bouton d'action flottant */}
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-12 w-12 p-0 shadow-lg"
            onClick={() => console.log('Nouvelle mission')}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </>
  )
} 
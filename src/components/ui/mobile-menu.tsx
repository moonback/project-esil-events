import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X, Home, Users, Calendar, CreditCard, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileMenuProps {
  children?: React.ReactNode
  className?: string
}

interface MenuItem {
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  badge?: string
  active?: boolean
}

export function MobileMenu({ children, className }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const menuItems: MenuItem[] = [
    {
      icon: <Home className="h-5 w-5" />,
      label: 'Tableau de bord',
      href: '/admin',
      active: true
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: 'Missions',
      href: '/admin/missions',
      badge: '12'
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Techniciens',
      href: '/admin/technicians',
      badge: '8'
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: 'Facturation',
      href: '/admin/billing',
      badge: '5'
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: 'Paramètres',
      href: '/admin/settings'
    }
  ]

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span>Administration</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-2">
          {menuItems.map((item, index) => (
            <Button
              key={index}
              variant={item.active ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start',
                item.active && 'bg-indigo-50 text-indigo-700'
              )}
              onClick={() => {
                item.onClick?.()
                setIsOpen(false)
              }}
            >
              <div className="flex items-center space-x-3">
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </Button>
          ))}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <Button variant="outline" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
} 
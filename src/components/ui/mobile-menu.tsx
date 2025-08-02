import React from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X, Clock, Calendar, CreditCard, CheckCircle, User } from 'lucide-react'

interface MobileMenuProps {
  className?: string
  activeTab?: string
  onTabChange?: (tab: string) => void
  tabs?: Array<{
    value: string
    label: string
    icon: React.ComponentType<any>
    color: string
  }>
}

export function MobileMenu({ className, activeTab, onTabChange, tabs = [] }: MobileMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleTabClick = (tabValue: string) => {
    onTabChange?.(tabValue)
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={`flex items-center space-x-2 ${className}`}>
          <Menu className="h-4 w-4" />
          <span className="hidden sm:inline">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Navigation</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => handleTabClick(tab.value)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    isActive 
                      ? `bg-${tab.color}-100 text-${tab.color}-700 border border-${tab.color}-200` 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? `text-${tab.color}-600` : 'text-gray-400'}`} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
} 
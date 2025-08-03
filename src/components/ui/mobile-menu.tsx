import React from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X, Clock, Calendar, CreditCard, CheckCircle, User, ChevronRight, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface MobileMenuProps {
  className?: string
  activeTab?: string
  onTabChange?: (tab: string) => void
  tabs?: Array<{
    value: string
    label: string
    shortLabel?: string
    icon: React.ComponentType<any>
    color: string
    gradient?: string
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
        <Button 
          variant="ghost" 
          size="sm" 
          className={`
            w-10 h-10 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 
            shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105
            ${className}
          `}
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 bg-gradient-to-br from-white via-gray-50 to-white border-l border-gray-200/50">
        <div className="space-y-6 h-full">
          {/* Header */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Navigation</h2>
                <p className="text-xs text-gray-500">Dashboard Technicien</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="space-y-3 flex-1">
            {tabs.map((tab, index) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => handleTabClick(tab.value)}
                  className={`
                    w-full flex items-center justify-between p-4 rounded-2xl text-left 
                    transition-all duration-300 group relative overflow-hidden
                    ${isActive 
                      ? `bg-gradient-to-r ${tab.gradient || 'from-blue-500 to-blue-600'} text-white shadow-lg transform scale-[1.02]` 
                      : 'text-gray-700 hover:bg-white hover:shadow-md hover:scale-[1.01] bg-gray-50/50'
                    }
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                      ${isActive 
                        ? 'bg-white/20 backdrop-blur-sm' 
                        : 'bg-white shadow-sm group-hover:shadow-md'
                      }
                    `}>
                      <Icon className={`h-6 w-6 ${isActive ? 'text-white' : `text-${tab.color}-600`}`} />
                    </div>
                    <div>
                      <span className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {tab.label}
                      </span>
                      <p className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                        {tab.shortLabel || tab.label}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isActive && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                        Actif
                      </Badge>
                    )}
                    <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${
                      isActive ? 'text-white rotate-90' : 'text-gray-400 group-hover:translate-x-1'
                    }`} />
                  </div>

                  {/* Effet de brillance pour l'onglet actif */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse" />
                  )}
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-4 pb-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Interface Moderne</p>
                  <p className="text-xs text-gray-600">Design responsive optimisé</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabItem {
  value: string
  label: string
  icon?: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
}

interface ResponsiveTabsProps {
  items: TabItem[]
  defaultValue?: string
  className?: string
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'pills' | 'underline'
}

export function ResponsiveTabs({
  items,
  defaultValue,
  className,
  orientation = 'horizontal',
  variant = 'default'
}: ResponsiveTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue || items[0]?.value)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getTabTriggerClasses = (variant: string) => {
    switch (variant) {
      case 'pills':
        return 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full'
      case 'underline':
        return 'data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent'
      default:
        return 'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'
    }
  }

  const activeTabData = items.find(item => item.value === activeTab)

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop Tabs */}
      <div className="hidden md:block">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={cn(
            'grid w-full bg-gray-50 border-b border-gray-200',
            orientation === 'horizontal' ? 'grid-cols-4' : 'grid-cols-1',
            'shadow-none rounded-none p-0 h-20'
          )}>
            {items.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                className={cn(
                  'flex flex-col items-center justify-center space-y-2 transition-all duration-300 text-sm font-semibold h-full relative',
                  orientation === 'horizontal' ? 'border-r border-gray-200' : 'border-b border-gray-200',
                  'data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm',
                  'data-[state=active]:border-b-2 data-[state=active]:border-indigo-500',
                  'hover:bg-gray-100 hover:text-gray-700',
                  'data-[state=inactive]:text-gray-600'
                )}
              >
                {item.icon && (
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
                    'data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600',
                    'data-[state=inactive]:bg-gray-200 data-[state=inactive]:text-gray-600',
                    'hover:bg-indigo-100 hover:text-indigo-600'
                  )}>
                    <div className={cn(
                      'transition-all duration-300',
                      'data-[state=active]:text-white',
                      'data-[state=inactive]:text-gray-600'
                    )}>
                      {item.icon}
                    </div>
                  </div>
                )}
                <span className="text-xs font-medium">{item.label}</span>
                
                {/* Indicateur actif */}
                <div className={cn(
                  'absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 rounded-full transition-all duration-300',
                  'data-[state=active]:bg-indigo-500',
                  'data-[state=inactive]:bg-transparent'
                )} />
              </TabsTrigger>
            ))}
          </TabsList>

          {items.map((item) => (
            <TabsContent key={item.value} value={item.value} className="m-0">
              {item.content}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <Button
            variant="outline"
            className="w-full justify-between bg-gray-50 hover:bg-gray-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="flex items-center space-x-3">
              {activeTabData?.icon && (
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <div className="text-white text-sm">
                    {activeTabData.icon}
                  </div>
                </div>
              )}
              <span className="font-semibold text-gray-900">{activeTabData?.label}</span>
            </div>
            {isMobileMenuOpen ? (
              <ChevronUp className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            )}
          </Button>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="mt-3 space-y-2 bg-gray-50 rounded-lg p-3">
              {items.map((item) => (
                <Button
                  key={item.value}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start h-12',
                    activeTab === item.value 
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                      : 'hover:bg-gray-100 text-gray-700'
                  )}
                  onClick={() => {
                    setActiveTab(item.value)
                    setIsMobileMenuOpen(false)
                  }}
                  disabled={item.disabled}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon && (
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        activeTab === item.value 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      )}>
                        <div className="text-sm">
                          {item.icon}
                        </div>
                      </div>
                    )}
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Content */}
        <div className="p-4">
          {activeTabData?.content}
        </div>
      </div>
    </div>
  )
} 
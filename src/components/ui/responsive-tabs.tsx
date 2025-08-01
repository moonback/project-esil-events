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
            'grid w-full',
            orientation === 'horizontal' ? 'grid-cols-4' : 'grid-cols-1',
            'bg-transparent border-0 shadow-none rounded-none p-0 h-16'
          )}>
            {items.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                className={cn(
                  'flex items-center space-x-3 transition-all duration-300 text-sm font-semibold h-full',
                  orientation === 'horizontal' ? 'border-r border-gray-200' : 'border-b border-gray-200',
                  getTabTriggerClasses(variant)
                )}
              >
                {item.icon && (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <div className="text-white">
                      {item.icon}
                    </div>
                  </div>
                )}
                <span>{item.label}</span>
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
            className="w-full justify-between"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <div className="flex items-center space-x-3">
              {activeTabData?.icon && (
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <div className="text-white text-sm">
                    {activeTabData.icon}
                  </div>
                </div>
              )}
              <span className="font-medium">{activeTabData?.label}</span>
            </div>
            {isMobileMenuOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="mt-2 space-y-1">
              {items.map((item) => (
                <Button
                  key={item.value}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start',
                    activeTab === item.value && 'bg-blue-50 text-blue-600'
                  )}
                  onClick={() => {
                    setActiveTab(item.value)
                    setIsMobileMenuOpen(false)
                  }}
                  disabled={item.disabled}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon && (
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <div className="text-white text-sm">
                          {item.icon}
                        </div>
                      </div>
                    )}
                    <span>{item.label}</span>
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
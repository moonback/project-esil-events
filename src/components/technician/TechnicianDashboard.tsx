import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvailabilityTab } from './AvailabilityTab'
import { ProposedMissionsTab } from './ProposedMissionsTab'
import { TechnicianBillingTab } from './TechnicianBillingTab'
import { TechnicianAgendaTab } from './TechnicianAgendaTab'
import { TechnicianProfileTab } from './TechnicianProfileTab'
import { NotificationsTab } from './NotificationsTab'
import { Calendar, CreditCard, Clock, CheckCircle, User, Bell, Menu, ChevronLeft } from 'lucide-react'
import { MobileMenu } from '@/components/ui/mobile-menu'
import { FloatingActions } from '@/components/ui/floating-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function TechnicianDashboard() {
  const [activeTab, setActiveTab] = useState('availability')
  const [showMobileHeader, setShowMobileHeader] = useState(true)

  const tabs = [
    {
      value: 'availability',
      label: 'Disponibilités',
      shortLabel: 'Dispo',
      icon: Clock,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      value: 'missions',
      label: 'Missions Proposées',
      shortLabel: 'Missions',
      icon: Calendar,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600'
    },
    {
      value: 'billing',
      label: 'Facturation',
      shortLabel: 'Factures',
      icon: CreditCard,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      value: 'agenda',
      label: 'Mes Missions',
      shortLabel: 'Agenda',
      icon: CheckCircle,
      color: 'green',
      gradient: 'from-green-500 to-green-600'
    },
    {
      value: 'notifications',
      label: 'Notifications',
      shortLabel: 'Notifs',
      icon: Bell,
      color: 'red',
      gradient: 'from-red-500 to-red-600'
    },
    {
      value: 'profile',
      label: 'Mon Profil',
      shortLabel: 'Profil',
      icon: User,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600'
    }
  ]

  const getTabColor = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-blue-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200',
      indigo: isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'hover:bg-indigo-50 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-200',
      purple: isActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'hover:bg-purple-50 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-200',
      green: isActive ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'hover:bg-green-50 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-200',
      red: isActive ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'hover:bg-red-50 data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-200',
      orange: isActive ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'hover:bg-orange-50 data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const currentTab = tabs.find(tab => tab.value === activeTab)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header Mobile Moderne */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentTab && (
                <>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${currentTab.gradient} flex items-center justify-center shadow-lg`}>
                    <currentTab.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">{currentTab.label}</h1>
                    <p className="text-xs text-gray-500">Dashboard Technicien</p>
                  </div>
                </>
              )}
            </div>
            <MobileMenu 
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={tabs}
            />
          </div>
        </div>
      </div>

      {/* Navigation Mobile par Swipe */}
      <div className="md:hidden bg-white border-b border-gray-100">
        <div className="flex overflow-x-auto scrollbar-hide px-4 py-3 space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`
                  flex-shrink-0 flex flex-col items-center justify-center
                  w-16 h-16 rounded-2xl transition-all duration-300
                  ${isActive 
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105` 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:scale-105'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                <span className={`text-xs font-medium mt-1 ${isActive ? 'text-white' : 'text-gray-600'}`}>
                  {tab.shortLabel}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 w-2 h-2 bg-white rounded-full shadow-sm" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Menu d'actions rapides flottant */}
      <FloatingActions 
        onTabChange={setActiveTab}
        currentTab={activeTab}
        userType="technician"
      />

      {/* Tabs Desktop */}
      <div className="hidden md:block p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-2">
              <TabsList className="grid w-full grid-cols-6 bg-transparent gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <TabsTrigger 
                      key={tab.value}
                      value={tab.value} 
                      className={`
                        flex items-center space-x-3 rounded-xl transition-all duration-300 
                        text-sm font-semibold py-3 px-4
                        ${getTabColor(tab.color, false)}
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="hidden lg:inline">{tab.label}</span>
                      <span className="lg:hidden">{tab.shortLabel}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
              <TabsContent value="availability" className="m-0 p-6 animate-slide-in-right">
                <AvailabilityTab />
              </TabsContent>

              <TabsContent value="missions" className="m-0 p-6 animate-slide-in-right">
                <ProposedMissionsTab />
              </TabsContent>

              <TabsContent value="billing" className="m-0 p-6 animate-slide-in-right">
                <TechnicianBillingTab />
              </TabsContent>

              <TabsContent value="agenda" className="m-0 p-6 animate-slide-in-right">
                <TechnicianAgendaTab />
              </TabsContent>

              <TabsContent value="notifications" className="m-0 p-6 animate-slide-in-right">
                <NotificationsTab />
              </TabsContent>

              <TabsContent value="profile" className="m-0 p-6 animate-slide-in-right">
                <TechnicianProfileTab onTabChange={setActiveTab} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Content Mobile */}
      <div className="md:hidden px-4 py-6 pb-24 space-y-6">
        {activeTab === 'availability' && (
          <div className="animate-slide-in-right">
            <AvailabilityTab />
          </div>
        )}
        
        {activeTab === 'missions' && (
          <div className="animate-slide-in-right">
            <ProposedMissionsTab />
          </div>
        )}
        
        {activeTab === 'billing' && (
          <div className="animate-slide-in-right">
            <TechnicianBillingTab />
          </div>
        )}
        
        {activeTab === 'agenda' && (
          <div className="animate-slide-in-right">
            <TechnicianAgendaTab />
          </div>
        )}
        
        {activeTab === 'notifications' && (
          <div className="animate-slide-in-right">
            <NotificationsTab />
          </div>
        )}
        
        {activeTab === 'profile' && (
          <div className="animate-slide-in-right">
            <TechnicianProfileTab onTabChange={setActiveTab} />
          </div>
        )}
      </div>
    </div>
  )
}
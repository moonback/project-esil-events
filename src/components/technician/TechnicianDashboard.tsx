import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvailabilityTab } from './AvailabilityTab'
import { ProposedMissionsTab } from './ProposedMissionsTab'
import { TechnicianBillingTab } from './TechnicianBillingTab'
import { TechnicianAgendaTab } from './TechnicianAgendaTab'
import { TechnicianProfileTab } from './TechnicianProfileTab'
import { VehiclesTab } from './VehiclesTab'
import { PaymentSummaryCard } from './PaymentSummaryCard'
import { Calendar, CreditCard, Clock, CheckCircle, User, Car } from 'lucide-react'
import { MobileMenu } from '@/components/ui/mobile-menu'

export function TechnicianDashboard() {
  const [activeTab, setActiveTab] = useState('availability')

  const tabs = [
    {
      value: 'availability',
      label: 'Disponibilités',
      icon: Clock,
      color: 'blue'
    },
    {
      value: 'missions',
      label: 'Missions Proposées',
      icon: Calendar,
      color: 'indigo'
    },
    {
      value: 'vehicles',
      label: 'Véhicules',
      icon: Car,
      color: 'teal'
    },
    {
      value: 'billing',
      label: 'Facturation',
      icon: CreditCard,
      color: 'purple'
    },
    {
      value: 'agenda',
      label: 'Mes Missions',
      icon: CheckCircle,
      color: 'green'
    },
    {
      value: 'profile',
      label: 'Mon Profil',
      icon: User,
      color: 'orange'
    }
  ]

  const getTabColor = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white',
      indigo: isActive ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50 data-[state=active]:bg-indigo-600 data-[state=active]:text-white',
      teal: isActive ? 'bg-teal-600 text-white' : 'hover:bg-teal-50 data-[state=active]:bg-teal-600 data-[state=active]:text-white',
      purple: isActive ? 'bg-purple-600 text-white' : 'hover:bg-purple-50 data-[state=active]:bg-purple-600 data-[state=active]:text-white',
      green: isActive ? 'bg-green-600 text-white' : 'hover:bg-green-50 data-[state=active]:bg-green-600 data-[state=active]:text-white',
      orange: isActive ? 'bg-orange-600 text-white' : 'hover:bg-orange-50 data-[state=active]:bg-orange-600 data-[state=active]:text-white'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="space-y-2 animate-fade-in-up">
      {/* Header responsive */}
      <div className="flex items-center justify-between">
        
        
        {/* Menu mobile */}
        <div className="md:hidden">
          <MobileMenu 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={tabs}
          />
        </div>
      </div>

      {/* Tabs desktop */}
      <div className="hidden md:block">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white border border-gray-200 shadow-sm rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className={`flex items-center space-x-2 rounded-md transition-all duration-200 text-sm font-medium ${getTabColor(tab.color, false)}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value="availability" className="animate-slide-in-right">
            <AvailabilityTab />
          </TabsContent>

          <TabsContent value="missions" className="animate-slide-in-right">
            <ProposedMissionsTab />
          </TabsContent>

          <TabsContent value="vehicles" className="animate-slide-in-right">
            <VehiclesTab />
          </TabsContent>

          <TabsContent value="billing" className="animate-slide-in-right">
            <div className="space-y-6">
              <PaymentSummaryCard 
                billings={[]}
                onViewAll={() => {}}
              />
              <TechnicianBillingTab />
            </div>
          </TabsContent>

          <TabsContent value="agenda" className="animate-slide-in-right">
            <TechnicianAgendaTab />
          </TabsContent>

          <TabsContent value="profile" className="animate-slide-in-right">
            <TechnicianProfileTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Content mobile */}
      <div className="md:hidden">
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
        
        {activeTab === 'vehicles' && (
          <div className="animate-slide-in-right">
            <VehiclesTab />
          </div>
        )}
        
        {activeTab === 'billing' && (
          <div className="animate-slide-in-right space-y-6">
            <PaymentSummaryCard 
              billings={[]}
              onViewAll={() => {}}
            />
            <TechnicianBillingTab />
          </div>
        )}
        
        {activeTab === 'agenda' && (
          <div className="animate-slide-in-right">
            <TechnicianAgendaTab />
          </div>
        )}
        
        {activeTab === 'profile' && (
          <div className="animate-slide-in-right">
            <TechnicianProfileTab />
          </div>
        )}
      </div>

      {/* Indicateur d'onglet actuel pour mobile */}
      <div className="md:hidden">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            {(() => {
              const currentTab = tabs.find(tab => tab.value === activeTab)
              if (!currentTab) return null
              const Icon = currentTab.icon
              return (
                <>
                  <Icon className={`h-5 w-5 text-${currentTab.color}-600`} />
                  <span className="font-medium text-gray-900">{currentTab.label}</span>
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvailabilityTab } from './AvailabilityTab'
import { ProposedMissionsTab } from './ProposedMissionsTab'
import { TechnicianBillingTab } from './TechnicianBillingTab'
import { TechnicianAgendaTab } from './TechnicianAgendaTab'
import { Calendar, CreditCard, Clock } from 'lucide-react'

export function TechnicianDashboard() {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="relative">
            <Wrench className="h-10 w-10 text-blue-600 animate-pulse-slow" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-bounce-slow" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Espace Technicien
          </h2>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Gérez vos disponibilités, missions et rémunérations avec une interface intuitive
        </p>
      </div> */}

      <Tabs defaultValue="availability" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg rounded-xl p-1">
          <TabsTrigger 
            value="availability" 
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:scale-105"
          >
            <Clock className="h-4 w-4" />
            <span>Disponibilités</span>
          </TabsTrigger>
          <TabsTrigger 
            value="missions" 
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:scale-105"
          >
            <Calendar className="h-4 w-4" />
            <span>Missions Proposées</span>
          </TabsTrigger>
          <TabsTrigger 
            value="billing" 
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:scale-105"
          >
            <CreditCard className="h-4 w-4" />
            <span>Facturation</span>
          </TabsTrigger>
          <TabsTrigger 
            value="agenda" 
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:scale-105"
          >
            <Calendar className="h-4 w-4" />
            <span>Mon Agenda</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="animate-slide-in-right">
          <AvailabilityTab />
        </TabsContent>

        <TabsContent value="missions" className="animate-slide-in-right">
          <ProposedMissionsTab />
        </TabsContent>

        <TabsContent value="billing" className="animate-slide-in-right">
          <TechnicianBillingTab />
        </TabsContent>

        <TabsContent value="agenda" className="animate-slide-in-right">
          <TechnicianAgendaTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
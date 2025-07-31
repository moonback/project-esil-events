import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvailabilityTab } from './AvailabilityTab'
import { ProposedMissionsTab } from './ProposedMissionsTab'
import { TechnicianBillingTab } from './TechnicianBillingTab'
import { TechnicianAgendaTab } from './TechnicianAgendaTab'
import { Calendar, CreditCard, Clock, CheckCircle } from 'lucide-react'

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
        <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 shadow-sm rounded-lg p-1">
          <TabsTrigger 
            value="availability" 
            className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all duration-200 text-sm font-medium hover:bg-blue-50 data-[state=active]:hover:bg-blue-600"
          >
            <Clock className="h-4 w-4" />
            <span>Disponibilités</span>
          </TabsTrigger>
          <TabsTrigger 
            value="missions" 
            className="flex items-center space-x-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md transition-all duration-200 text-sm font-medium hover:bg-indigo-50 data-[state=active]:hover:bg-indigo-600"
          >
            <Calendar className="h-4 w-4" />
            <span>Missions Proposées</span>
          </TabsTrigger>
          <TabsTrigger 
            value="billing" 
            className="flex items-center space-x-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md transition-all duration-200 text-sm font-medium hover:bg-purple-50 data-[state=active]:hover:bg-purple-600"
          >
            <CreditCard className="h-4 w-4" />
            <span>Facturation</span>
          </TabsTrigger>
          <TabsTrigger 
            value="agenda" 
            className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-md transition-all duration-200 text-sm font-medium hover:bg-green-50 data-[state=active]:hover:bg-green-600"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Mes Missions</span>
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
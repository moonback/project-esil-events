import React, { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMissionsStore } from '@/store/missionsStore'
import { MissionsTab } from './MissionsTab'
import { TechniciansTab } from './TechniciansTab'
import { AdminAgendaTab } from './AdminAgendaTab'
import { AdminBillingTab } from './AdminBillingTab'
import { Crown, Users, Calendar, CreditCard, Sparkles } from 'lucide-react'

export function AdminDashboard() {
  const fetchMissions = useMissionsStore(state => state.fetchMissions)

  useEffect(() => {
    fetchMissions()
  }, [fetchMissions])

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="relative">
            <Crown className="h-10 w-10 text-indigo-600 animate-pulse-slow" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-bounce-slow" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Tableau de bord Administrateur
          </h2>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Gérez vos missions, techniciens et facturation avec une interface moderne et intuitive
        </p>
      </div>

      <Tabs defaultValue="missions" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg rounded-xl p-1">
          <TabsTrigger 
            value="missions" 
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:scale-105"
          >
            <Users className="h-4 w-4" />
            <span>Missions</span>
          </TabsTrigger>
          <TabsTrigger 
            value="technicians" 
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:scale-105"
          >
            <Users className="h-4 w-4" />
            <span>Techniciens</span>
          </TabsTrigger>
          <TabsTrigger 
            value="agenda" 
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:scale-105"
          >
            <Calendar className="h-4 w-4" />
            <span>Agenda</span>
          </TabsTrigger>
          <TabsTrigger 
            value="billing" 
            className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg transition-all duration-300 hover:scale-105"
          >
            <CreditCard className="h-4 w-4" />
            <span>Facturation</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="animate-slide-in-right">
          <MissionsTab />
        </TabsContent>

        <TabsContent value="technicians" className="animate-slide-in-right">
          <TechniciansTab />
        </TabsContent>

        <TabsContent value="agenda" className="animate-slide-in-right">
          <AdminAgendaTab />
        </TabsContent>

        <TabsContent value="billing" className="animate-slide-in-right">
          <AdminBillingTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
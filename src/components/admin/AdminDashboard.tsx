import React, { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMissionsStore } from '@/store/missionsStore'
import { MissionsTab } from './MissionsTab'
import { TechniciansTab } from './TechniciansTab'
import { AdminAgendaTab } from './AdminAgendaTab'
import { AdminBillingTab } from './AdminBillingTab'
import { Crown, Users, Calendar, CreditCard } from 'lucide-react'

export function AdminDashboard() {
  const fetchMissions = useMissionsStore(state => state.fetchMissions)

  useEffect(() => {
    fetchMissions()
  }, [fetchMissions])

  return (
    <div className="space-y-4">
      {/* En-tête compact */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Crown className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Administration</h1>
            <p className="text-sm text-gray-500">Gestion des missions et techniciens</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="missions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 shadow-sm rounded-lg p-1 h-12">
          <TabsTrigger 
            value="missions" 
            className="flex items-center space-x-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md transition-all duration-200 text-sm font-medium"
          >
            <Users className="h-4 w-4" />
            <span>Missions</span>
          </TabsTrigger>
          <TabsTrigger 
            value="technicians" 
            className="flex items-center space-x-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-md transition-all duration-200 text-sm font-medium"
          >
            <Users className="h-4 w-4" />
            <span>Techniciens</span>
          </TabsTrigger>
          <TabsTrigger 
            value="agenda" 
            className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all duration-200 text-sm font-medium"
          >
            <Calendar className="h-4 w-4" />
            <span>Agenda</span>
          </TabsTrigger>
          <TabsTrigger 
            value="billing" 
            className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white rounded-md transition-all duration-200 text-sm font-medium"
          >
            <CreditCard className="h-4 w-4" />
            <span>Facturation</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="space-y-0">
          <MissionsTab />
        </TabsContent>

        <TabsContent value="technicians" className="space-y-0">
          <TechniciansTab />
        </TabsContent>

        <TabsContent value="agenda" className="space-y-0">
          <AdminAgendaTab />
        </TabsContent>

        <TabsContent value="billing" className="space-y-0">
          <AdminBillingTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
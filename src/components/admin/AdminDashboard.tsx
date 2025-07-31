import React, { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMissionsStore } from '@/store/missionsStore'
import { MissionsTab } from './MissionsTab'
import { TechniciansTab } from './TechniciansTab'
import { AdminAgendaTab } from './AdminAgendaTab'
import { AdminBillingTab } from './AdminBillingTab'

export function AdminDashboard() {
  const fetchMissions = useMissionsStore(state => state.fetchMissions)

  useEffect(() => {
    fetchMissions()
  }, [fetchMissions])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Tableau de bord Administrateur
        </h2>
        <p className="text-gray-600 mt-2">
          Gérez vos missions, techniciens et facturation
        </p>
      </div>

      <Tabs defaultValue="missions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="missions">Missions</TabsTrigger>
          <TabsTrigger value="technicians">Techniciens</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="billing">Facturation</TabsTrigger>
        </TabsList>

        <TabsContent value="missions">
          <MissionsTab />
        </TabsContent>

        <TabsContent value="technicians">
          <TechniciansTab />
        </TabsContent>

        <TabsContent value="agenda">
          <AdminAgendaTab />
        </TabsContent>

        <TabsContent value="billing">
          <AdminBillingTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvailabilityTab } from './AvailabilityTab'
import { ProposedMissionsTab } from './ProposedMissionsTab'
import { TechnicianBillingTab } from './TechnicianBillingTab'
import { TechnicianAgendaTab } from './TechnicianAgendaTab'

export function TechnicianDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Espace Technicien
        </h2>
        <p className="text-gray-600 mt-2">
          Gérez vos disponibilités, missions et rémunérations
        </p>
      </div>

      <Tabs defaultValue="availability" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="availability">Disponibilités</TabsTrigger>
          <TabsTrigger value="missions">Missions Proposées</TabsTrigger>
          <TabsTrigger value="billing">Facturation</TabsTrigger>
          <TabsTrigger value="agenda">Mon Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="availability">
          <AvailabilityTab />
        </TabsContent>

        <TabsContent value="missions">
          <ProposedMissionsTab />
        </TabsContent>

        <TabsContent value="billing">
          <TechnicianBillingTab />
        </TabsContent>

        <TabsContent value="agenda">
          <TechnicianAgendaTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
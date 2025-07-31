import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminStore } from '@/store/adminStore'
import { MissionsTab } from './MissionsTab'
import { TechniciansTab } from './TechniciansTab'
import { AdminAgendaTab } from './AdminAgendaTab'
import { AdminBillingTab } from './AdminBillingTab'
import { PaymentSummaryCard } from './PaymentSummaryCard'
import { Crown, Users, Calendar, CreditCard, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingOverlay } from '@/components/ui/loading'
import { useRealtimeSync } from '@/lib/useRealtimeSync'
import { SyncStatus } from '@/components/ui/realtime-indicator'

export function AdminDashboard() {
  const { fetchAllData, refreshData, loading, lastSync, isConnected } = useAdminStore()
  const [activeTab, setActiveTab] = useState('missions')
  const [refreshing, setRefreshing] = useState(false)
  
  // Activer la synchronisation en temps réel
  useRealtimeSync()

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Recharger les données quand le composant devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshData])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshData()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec bouton de rafraîchissement */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Crown className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Administration</h1>
            <p className="text-sm text-gray-500">Gestion des missions et techniciens</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <SyncStatus 
            isConnected={isConnected} 
            lastSync={lastSync || undefined}
            onRefresh={handleRefresh}
          />
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Actualisation...' : 'Actualiser'}</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
          <LoadingOverlay loading={loading.missions} text="Chargement des missions...">
            <MissionsTab />
          </LoadingOverlay>
        </TabsContent>

        <TabsContent value="technicians" className="space-y-0">
          <LoadingOverlay loading={loading.technicians} text="Chargement des techniciens...">
            <TechniciansTab />
          </LoadingOverlay>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-0">
          <LoadingOverlay loading={loading.missions} text="Chargement de l'agenda...">
            <AdminAgendaTab />
          </LoadingOverlay>
        </TabsContent>

        <TabsContent value="billing" className="space-y-0">
          <LoadingOverlay loading={loading.billings} text="Chargement des facturations...">
            <div className="space-y-6">
              {/* Résumé des paiements */}
              <PaymentSummaryCard 
                billings={useAdminStore.getState().billings}
                onViewAll={() => setActiveTab('billing')}
              />
              
              {/* Onglet de facturation complet */}
              <AdminBillingTab />
            </div>
          </LoadingOverlay>
        </TabsContent>
      </Tabs>
    </div>
  )
}
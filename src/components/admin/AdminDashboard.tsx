import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminStore } from '@/store/adminStore'
import { MissionsTab } from './MissionsTab'
import { TechniciansTab } from './TechniciansTab'
import { AdminAgendaTab } from './AdminAgendaTab'
import { AdminBillingTab } from './AdminBillingTab'
import { PaymentSummaryCard } from './PaymentSummaryCard'
import { Crown, Users, Calendar, CreditCard, RefreshCw, TrendingUp, Activity, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingOverlay } from '@/components/ui/loading'
import { useRealtimeSync } from '@/lib/useRealtimeSync'
import { SyncStatus } from '@/components/ui/realtime-indicator'

export function AdminDashboard() {
  const { fetchAllData, refreshData, loading, lastSync, isConnected, stats } = useAdminStore()
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* En-tête principal avec gradient */}
      {/* <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Administration</h1>
                <p className="text-indigo-100">Gestion complète des missions et techniciens</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <SyncStatus 
                isConnected={isConnected} 
                lastSync={lastSync || undefined}
                onRefresh={handleRefresh}
              />
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="secondary"
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Actualisation...' : 'Actualiser'}
              </Button>
            </div>
          </div>
        </div>
      </div> */}

      {/* Statistiques rapides */}
      <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Missions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.missions.total}</p>
                <p className="text-xs text-green-600 mt-1">+12% ce mois</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Techniciens</p>
                <p className="text-3xl font-bold text-gray-900">{stats.technicians.total}</p>
                <p className="text-xs text-blue-600 mt-1">{stats.technicians.available} disponibles</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus</p>
                <p className="text-3xl font-bold text-gray-900">{(stats.missions.totalRevenue / 1000).toFixed(1)}k€</p>
                <p className="text-xs text-green-600 mt-1">+8% ce mois</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Facturations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.billings.totalAmount > 0 ? (stats.billings.totalAmount / 1000).toFixed(1) + 'k€' : '0€'}</p>
                <p className="text-xs text-orange-600 mt-1">{stats.billings.pendingAmount > 0 ? (stats.billings.pendingAmount / 1000).toFixed(1) + 'k€' : '0€'} en attente</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
              <TabsList className="grid w-full grid-cols-4 bg-transparent border-0 shadow-none rounded-none p-0 h-16">
                <TabsTrigger 
                  value="missions" 
                  className="flex items-center space-x-3 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg rounded-none border-r border-gray-200 transition-all duration-300 text-sm font-semibold h-full"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <span>Missions</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="technicians" 
                  className="flex items-center space-x-3 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-lg rounded-none border-r border-gray-200 transition-all duration-300 text-sm font-semibold h-full"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <span>Techniciens</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="agenda" 
                  className="flex items-center space-x-3 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg rounded-none border-r border-gray-200 transition-all duration-300 text-sm font-semibold h-full"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <span>Agenda</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="billing" 
                  className="flex items-center space-x-3 data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-lg rounded-none transition-all duration-300 text-sm font-semibold h-full"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <span>Facturation</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-0">
              <TabsContent value="missions" className="m-0">
                <LoadingOverlay loading={loading.missions} text="Chargement des missions...">
                  <MissionsTab />
                </LoadingOverlay>
              </TabsContent>

              <TabsContent value="technicians" className="m-0">
                <LoadingOverlay loading={loading.technicians} text="Chargement des techniciens...">
                  <TechniciansTab />
                </LoadingOverlay>
              </TabsContent>

              <TabsContent value="agenda" className="m-0">
                <LoadingOverlay loading={loading.missions} text="Chargement de l'agenda...">
                  <AdminAgendaTab />
                </LoadingOverlay>
              </TabsContent>

              <TabsContent value="billing" className="m-0">
                <LoadingOverlay loading={loading.billings} text="Chargement des facturations...">
                  <div className="space-y-6 p-6">
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
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
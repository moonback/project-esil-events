import React, { useEffect, useState } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { MissionsTab } from './MissionsTab'
import { TechniciansTab } from './TechniciansTab'
import { AdminAgendaTab } from './AdminAgendaTab'
import { AdminBillingTab } from './AdminBillingTab'
import { PaymentSummaryCard } from './PaymentSummaryCard'
import { DashboardCard } from '@/components/ui/dashboard-card'
import { ResponsiveTabs } from '@/components/ui/responsive-tabs'
import { MobileMenu } from '@/components/ui/mobile-menu'
import { Crown, Users, Calendar, CreditCard, RefreshCw, TrendingUp, Activity, Settings, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingOverlay } from '@/components/ui/loading'
import { useRealtimeSync } from '@/lib/useRealtimeSync'
import { SyncStatus } from '@/components/ui/realtime-indicator'
import { cn } from '@/lib/utils'

export function AdminDashboard() {
  const { fetchAllData, refreshData, loading, lastSync, isConnected, stats } = useAdminStore()
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

  // Configuration des onglets
  const tabItems = [
    {
      value: 'missions',
      label: 'Missions',
      icon: <Activity className="h-4 w-4" />,
      content: (
        <LoadingOverlay loading={loading.missions} text="Chargement des missions...">
          <MissionsTab />
        </LoadingOverlay>
      )
    },
    {
      value: 'technicians',
      label: 'Techniciens',
      icon: <Users className="h-4 w-4" />,
      content: (
        <LoadingOverlay loading={loading.technicians} text="Chargement des techniciens...">
          <TechniciansTab />
        </LoadingOverlay>
      )
    },
    {
      value: 'agenda',
      label: 'Agenda',
      icon: <Calendar className="h-4 w-4" />,
      content: (
        <LoadingOverlay loading={loading.missions} text="Chargement de l'agenda...">
          <AdminAgendaTab />
        </LoadingOverlay>
      )
    },
    {
      value: 'billing',
      label: 'Facturation',
      icon: <CreditCard className="h-4 w-4" />,
      content: (
        <LoadingOverlay loading={loading.billings} text="Chargement des facturations...">
          <div className="space-y-6 p-6">
            <PaymentSummaryCard 
              billings={useAdminStore.getState().billings}
              onViewAll={() => {}}
            />
            <AdminBillingTab />
          </div>
        </LoadingOverlay>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* En-tête avec navigation responsive */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <MobileMenu />
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Crown className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Administration</h1>
                <p className="text-sm text-gray-600">Gestion complète des missions et techniciens</p>
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
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                {refreshing ? 'Actualisation...' : 'Actualiser'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Statistiques rapides avec design responsive */}
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <DashboardCard
            title="Total Missions"
            value={stats.missions.total}
            subtitle={`${stats.missions.assignedCount} assignées`}
            icon={<Activity className="h-6 w-6" />}
            trend={{ value: "+12% ce mois", isPositive: true }}
            variant="default"
            onClick={() => {/* Navigation vers missions */}}
          />

          <DashboardCard
            title="Techniciens"
            value={stats.technicians.total}
            subtitle={`${stats.technicians.available} disponibles`}
            icon={<Users className="h-6 w-6" />}
            trend={{ value: `${stats.technicians.available} actifs`, isPositive: true }}
            variant="info"
            onClick={() => {/* Navigation vers techniciens */}}
          />

          <DashboardCard
            title="Revenus"
            value={`${(stats.missions.totalRevenue / 1000).toFixed(1)}k€`}
            subtitle="Total des missions"
            icon={<TrendingUp className="h-6 w-6" />}
            trend={{ value: "+8% ce mois", isPositive: true }}
            variant="success"
            onClick={() => {/* Navigation vers facturation */}}
          />

          <DashboardCard
            title="Facturations"
            value={stats.billings.totalAmount > 0 ? `${(stats.billings.totalAmount / 1000).toFixed(1)}k€` : '0€'}
            subtitle={`${(stats.billings.pendingAmount / 1000).toFixed(1)}k€ en attente`}
            icon={<CreditCard className="h-6 w-6" />}
            trend={{ value: `${(stats.billings.pendingAmount / 1000).toFixed(1)}k€ en attente`, isPositive: false }}
            variant="warning"
            onClick={() => {/* Navigation vers facturation */}}
          />
        </div>
      </section>

      {/* Indicateurs de statut rapides */}
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                                 <p className="text-sm font-medium text-gray-900">Missions en cours</p>
                 <p className="text-lg font-bold text-green-600">{stats.missions.assignedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                                 <p className="text-sm font-medium text-gray-900">En attente</p>
                 <p className="text-lg font-bold text-yellow-600">{stats.missions.assignedCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                                 <p className="text-sm font-medium text-gray-900">Problèmes</p>
                 <p className="text-lg font-bold text-red-600">0</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenu principal avec onglets responsives */}
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <ResponsiveTabs
            items={tabItems}
            defaultValue="missions"
            className="w-full"
          />
        </div>
      </section>

      {/* Footer avec informations système */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )} />
                <span>{isConnected ? "Connecté" : "Déconnecté"}</span>
              </div>
              {lastSync && (
                <span>Dernière sync: {new Date(lastSync).toLocaleTimeString()}</span>
              )}
            </div>
            <div className="mt-2 sm:mt-0">
              <span>© 2024 ESIL - Administration</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
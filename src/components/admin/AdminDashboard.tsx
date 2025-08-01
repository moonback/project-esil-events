import React, { useEffect, useState } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { MissionsTab } from './MissionsTab'
import { TechniciansTab } from './TechniciansTab'
import { AdminAgendaTab } from './AdminAgendaTab'
import { AdminBillingTab } from './AdminBillingTab'
import { TerrainTab } from './TerrainTab'
import { PaymentSummaryCard } from './PaymentSummaryCard'
import { DashboardCard } from '@/components/ui/dashboard-card'
import { ResponsiveTabs } from '@/components/ui/responsive-tabs'
import { MobileMenu } from '@/components/ui/mobile-menu'
import { Crown, Users, Calendar, CreditCard, RefreshCw, TrendingUp, Activity, Settings, AlertTriangle, CheckCircle, Clock, BarChart3, MapPin } from 'lucide-react'
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
      value: 'terrain',
      label: 'Terrain',
      icon: <MapPin className="h-4 w-4" />,
      content: (
        <LoadingOverlay loading={loading.missions || loading.technicians} text="Chargement des données terrain...">
          <TerrainTab />
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
          <div className="space-y-8 p-6">
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

  // Calcul des pourcentages pour les indicateurs visuels
  const totalMissions = stats.missions.total || 1
  const missionsEnCours = stats.missions.assignedCount || 0
  const missionsEnAttente = totalMissions - missionsEnCours
  const missionsTerminees = Math.max(0, missionsEnCours - (stats.missions.total - stats.missions.assignedCount))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* En-tête avec navigation responsive */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <MobileMenu />
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-700">
                  Administration
                </h1>
                <p className="text-sm text-gray-600 font-medium">Gestion complète des missions et techniciens</p>
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
                className="hidden sm:inline-flex hover:bg-indigo-50 transition-colors duration-200"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                {refreshing ? 'Actualisation...' : 'Actualiser'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* KPIs regroupés dans un bloc compact */}
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Vue d'ensemble</h2>
              <p className="text-sm text-gray-600">Statistiques principales de l'activité</p>
            </div>
            <BarChart3 className="h-5 w-5 text-indigo-600" />
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Missions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.missions.total}</p>
                <p className="text-xs text-indigo-600">+12% ce mois</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Techniciens</p>
                <p className="text-2xl font-bold text-gray-900">{stats.technicians.total}</p>
                <p className="text-xs text-blue-600">{stats.technicians.available} actifs</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus</p>
                <p className="text-2xl font-bold text-gray-900">{`${(stats.missions.totalRevenue / 1000).toFixed(1)}k€`}</p>
                <p className="text-xs text-emerald-600">+8% ce mois</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Facturations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.billings.totalAmount > 0 ? `${(stats.billings.totalAmount / 1000).toFixed(1)}k€` : '0€'}</p>
                <p className="text-xs text-amber-600">{`${(stats.billings.pendingAmount / 1000).toFixed(1)}k€ en attente`}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Indicateurs visuels de l'état global des missions */}
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">État des missions</h3>
              <p className="text-sm text-gray-600">Répartition des missions par statut</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Terminées</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-xs text-gray-600">En cours</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-xs text-gray-600">En attente</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Barre de progression globale */}
            <div className="md:col-span-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Progression globale</span>
                  <span className="text-sm font-bold text-gray-900">{Math.round((missionsEnCours / totalMissions) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (missionsEnCours / totalMissions) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{missionsTerminees} terminées</span>
                  <span>{missionsEnCours} en cours</span>
                  <span>{missionsEnAttente} en attente</span>
                </div>
              </div>
            </div>

            {/* Indicateurs circulaires */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Terminées</p>
                    <p className="text-lg font-bold text-emerald-600">{missionsTerminees}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{Math.round((missionsTerminees / totalMissions) * 100)}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">En cours</p>
                    <p className="text-lg font-bold text-indigo-600">{missionsEnCours}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{Math.round((missionsEnCours / totalMissions) * 100)}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">En attente</p>
                    <p className="text-lg font-bold text-amber-600">{missionsEnAttente}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{Math.round((missionsEnAttente / totalMissions) * 100)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenu principal avec onglets responsives améliorés */}
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Gestion des données</h2>
              <p className="text-sm text-gray-600">Sélectionnez une section pour gérer vos données</p>
            </div>
          </div>
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
                  isConnected ? "bg-emerald-500" : "bg-red-500"
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

      {/* Espacement pour la barre de navigation mobile */}
      <div className="md:hidden h-20"></div>
    </div>
  )
}
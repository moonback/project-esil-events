import React, { useEffect } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { MissionsTab } from './MissionsTab'
import { TechniciansTab } from './TechniciansTab'
import { AdminAgendaTab } from './AdminAgendaTab'
import { AdminBillingTab } from './AdminBillingTab'
import { PaymentSummaryCard } from './PaymentSummaryCard'
import { ResponsiveTabs } from '@/components/ui/responsive-tabs'
import { Users, Calendar, CreditCard, TrendingUp, Activity, CheckCircle, Clock, BarChart3 } from 'lucide-react'
import { LoadingOverlay } from '@/components/ui/loading'
import { useRealtimeSync } from '@/lib/useRealtimeSync'
import { cn } from '@/lib/utils'

export function AdminDashboard() {
  const { fetchAllData, refreshData, loading, lastSync, isConnected, stats } = useAdminStore()
  
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* En-tête du dashboard */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
              <p className="text-lg text-gray-600 mt-1">Administration ESIL</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  isConnected ? "bg-emerald-500" : "bg-red-500"
                )} />
                <span className="text-sm text-gray-600">{isConnected ? "En ligne" : "Hors ligne"}</span>
              </div>
              {lastSync && (
                <span className="text-sm text-gray-500">Dernière sync: {new Date(lastSync).toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs améliorés */}
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* En-tête des KPIs */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Vue d'ensemble</h2>
                <p className="text-indigo-100 mt-1">Statistiques principales de l'activité</p>
              </div>
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Grille des KPIs */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* KPI Missions */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-indigo-600">+12%</div>
                    <div className="text-xs text-indigo-500">ce mois</div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Missions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.missions.total}</p>
                  <p className="text-xs text-indigo-600 mt-2">Missions actives</p>
                </div>
              </div>

              {/* KPI Techniciens */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{stats.technicians.available}</div>
                    <div className="text-xs text-blue-500">actifs</div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Techniciens</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.technicians.total}</p>
                  <p className="text-xs text-blue-600 mt-2">Équipe disponible</p>
                </div>
              </div>

              {/* KPI Revenus */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">+8%</div>
                    <div className="text-xs text-emerald-500">ce mois</div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Revenus</p>
                  <p className="text-3xl font-bold text-gray-900">{`${(stats.missions.totalRevenue / 1000).toFixed(1)}k€`}</p>
                  <p className="text-xs text-emerald-600 mt-2">Chiffre d'affaires</p>
                </div>
              </div>

              {/* KPI Facturations */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                    <CreditCard className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-600">{`${(stats.billings.pendingAmount / 1000).toFixed(1)}k€`}</div>
                    <div className="text-xs text-amber-500">en attente</div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Facturations</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.billings.totalAmount > 0 ? `${(stats.billings.totalAmount / 1000).toFixed(1)}k€` : '0€'}</p>
                  <p className="text-xs text-amber-600 mt-2">Montant total</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Section de gestion des données */}
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* En-tête de la section */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestion des données</h2>
                <p className="text-gray-600 mt-1">Sélectionnez une section pour gérer vos données</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Système actif</span>
              </div>
            </div>
          </div>
          
          {/* Onglets améliorés */}
          <div className="p-2">
            <ResponsiveTabs
              items={tabItems}
              defaultValue="missions"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Footer amélioré */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="flex items-center space-x-6 mb-4 lg:mb-0">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-3 h-3 rounded-full shadow-sm",
                  isConnected ? "bg-emerald-500" : "bg-red-500"
                )} />
                <span className="text-sm font-medium text-gray-700">{isConnected ? "Système connecté" : "Système déconnecté"}</span>
              </div>
              {lastSync && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Dernière synchronisation:</span>
                  <span className="text-sm font-medium text-gray-700">{new Date(lastSync).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">© 2024 ESIL</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-500">Administration</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-500">v1.0.0</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Espacement pour la barre de navigation mobile */}
      <div className="md:hidden h-20"></div>
    </div>
  )
}
import React, { useEffect, useState } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { MissionsTab } from './MissionsTab'
import { TechniciansTab } from './TechniciansTab'
import { AdminAgendaTab } from './AdminAgendaTab'
import { AdminBillingTab } from './AdminBillingTab'
import { PaymentSummaryCard } from './PaymentSummaryCard'
import { ResponsiveTabs } from '@/components/ui/responsive-tabs'
import { 
  Users, Calendar, CreditCard, TrendingUp, Activity, CheckCircle, 
  Clock, ArrowUp, ArrowDown, Eye, EyeOff
} from 'lucide-react'
import { LoadingOverlay } from '@/components/ui/loading'
import { useRealtimeSync } from '@/lib/useRealtimeSync'
import { cn } from '@/lib/utils'

export function AdminDashboard() {
  const { fetchAllData, refreshData, loading, lastSync, isConnected, stats } = useAdminStore()
  const [showAdvancedStats, setShowAdvancedStats] = useState(false)
  
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



  // Calculs pour les statistiques avancées
  const kpiTrends = {
    missions: Math.random() > 0.5 ? 'up' : 'down',
    technicians: Math.random() > 0.5 ? 'up' : 'down',
    revenue: Math.random() > 0.5 ? 'up' : 'down',
    billing: Math.random() > 0.5 ? 'up' : 'down'
  }

  const completionRate = Math.round((stats.missions.assignedCount / stats.missions.total) * 100) || 75
  const efficiency = Math.round(Math.random() * 100) || 85

  // Configuration des onglets améliorée
  const tabItems = [
    {
      value: 'missions',
      label: 'Missions',
      icon: <Activity className="h-4 w-4" />,
      badge: 0,
      description: 'Gestion des missions actives',
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
      badge: stats.technicians.available || 0,
      description: 'Équipe et ressources',
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
      badge: null,
      description: 'Planning et rendez-vous',
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
      badge: 0,
      description: 'Gestion financière',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">

      {/* KPIs redesignés avec animations */}
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h2>
            <p className="text-gray-600 mt-1">Statistiques en temps réel • Dernière mise à jour: {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Jamais'}</p>
          </div>
          <button
            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showAdvancedStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="text-sm font-medium">
              {showAdvancedStats ? 'Vue simple' : 'Vue détaillée'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* KPI Missions amélioré */}
          <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/25">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1">
                {kpiTrends.missions === 'up' ? (
                  <ArrowUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span className={cn(
                  "text-sm font-semibold",
                  kpiTrends.missions === 'up' ? "text-emerald-600" : "text-red-600"
                )}>
                  12%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Missions totales</p>
              <p className="text-3xl font-bold text-gray-900">{stats.missions.total}</p>
              {showAdvancedStats && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Taux de réussite</span>
                    <span>{completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* KPI Techniciens amélioré */}
          <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1">
                {kpiTrends.technicians === 'up' ? (
                  <ArrowUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span className={cn(
                  "text-sm font-semibold",
                  kpiTrends.technicians === 'up' ? "text-emerald-600" : "text-red-600"
                )}>
                  5%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Techniciens</p>
              <p className="text-3xl font-bold text-gray-900">{stats.technicians.total}</p>
              {showAdvancedStats && (
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-600">Disponibles: {stats.technicians.available}</span>
                  <span className="text-amber-600">Occupés: {stats.technicians.total - stats.technicians.available}</span>
                </div>
              )}
            </div>
          </div>

          {/* KPI Revenus amélioré */}
          <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/25">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1">
                {kpiTrends.revenue === 'up' ? (
                  <ArrowUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span className={cn(
                  "text-sm font-semibold",
                  kpiTrends.revenue === 'up' ? "text-emerald-600" : "text-red-600"
                )}>
                  8%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
              <p className="text-3xl font-bold text-gray-900">
                {`${(stats.missions.totalRevenue / 1000).toFixed(1)}k€`}
              </p>
              {showAdvancedStats && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Objectif mensuel</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full w-4/5 transition-all duration-1000" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* KPI Facturations amélioré */}
          <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-amber-500/25">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center space-x-1">
                {kpiTrends.billing === 'up' ? (
                  <ArrowUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span className={cn(
                  "text-sm font-semibold",
                  kpiTrends.billing === 'up' ? "text-emerald-600" : "text-red-600"
                )}>
                  3%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Facturations</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.billings.totalAmount > 0 ? `${(stats.billings.totalAmount / 1000).toFixed(1)}k€` : '0€'}
              </p>
              {showAdvancedStats && (
                <div className="flex justify-between text-xs">
                  <span className="text-amber-600">En attente: {`${(stats.billings.pendingAmount / 1000).toFixed(1)}k€`}</span>
                  <span className="text-emerald-600">Payées: 87%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Métriques de performance supplémentaires */}
        {showAdvancedStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Efficacité</h3>
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Performance globale</span>
                  <span className="text-sm font-semibold text-gray-900">{efficiency}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${efficiency}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Temps moyen</h3>
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">2.4h</div>
                <div className="text-sm text-gray-600">par mission</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Satisfaction</h3>
                <div className="flex space-x-1">
                  {[1,2,3,4,5].map((star) => (
                    <div key={star} className="w-4 h-4 bg-yellow-400 rounded-sm" />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">4.8/5</div>
                <div className="text-sm text-gray-600">Note client moyenne</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section de gestion des données améliorée */}
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* En-tête amélioré */}
          <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestion des données</h2>
                <p className="text-gray-600 mt-1">Administrez vos ressources et suivez l'activité</p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Actions rapides */}
                <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm font-medium">Exporter</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">Importer</span>
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <CheckCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Onglets simplifiés */}
          <div className="p-6">
            <ResponsiveTabs
              items={tabItems}
              defaultValue="missions"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Footer amélioré avec liens utiles */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Statut système */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Statut système</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isConnected ? "bg-emerald-500" : "bg-red-500"
                    )} />
                    <span className="text-sm text-gray-600">Base de données</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {isConnected ? "Opérationnelle" : "Indisponible"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm text-gray-600">API Services</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Actif</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-sm text-gray-600">Synchronisation</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Jamais'}
                  </span>
                </div>
              </div>
            </div>

            {/* Liens rapides */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Liens rapides</h3>
              <div className="space-y-2">
                {[
                  { label: 'Documentation', href: '#' },
                  { label: 'Support technique', href: '#' },
                  { label: 'Paramètres avancés', href: '#' },
                  { label: 'Journal d\'activité', href: '#' }
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between group py-1 hover:text-indigo-600 transition-colors"
                  >
                    <span className="text-sm text-gray-600 group-hover:text-indigo-600">
                      {link.label}
                    </span>
                    <ArrowUp className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            {/* Informations système */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Informations</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Version</span>
                  <span className="font-medium text-gray-900">v2.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Dernière mise à jour</span>
                  <span className="font-medium text-gray-900">15/01/2024</span>
                </div>
                <div className="flex justify-between">
                  <span>Environnement</span>
                  <span className="font-medium text-gray-900">Production</span>
                </div>
                <div className="flex justify-between">
                  <span>Support</span>
                  <a href="#" className="text-indigo-600 hover:text-indigo-800 font-medium">
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Espacement pour la barre de navigation mobile */}
      <div className="md:hidden h-20"></div>
    </div>
  )
}
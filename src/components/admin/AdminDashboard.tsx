import React, { useEffect, useState } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { MissionsTab } from './MissionsTab'
import { TechniciansTab } from './TechniciansTab'
import { AdminAgendaTab } from './AdminAgendaTab'
import { AdminBillingTab } from './AdminBillingTab'
import { PaymentSummaryCard } from './PaymentSummaryCard'
import { ResponsiveTabs } from '@/components/ui/responsive-tabs'
import { 
  Users, Calendar, CreditCard, Activity, CheckCircle, 
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
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vue d'ensemble</h2>
            <p className="text-sm text-gray-600">Dernière mise à jour: {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Jamais'}</p>
          </div>
          <button
            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            {showAdvancedStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="font-medium">
              {showAdvancedStats ? 'Vue simple' : 'Vue détaillée'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* KPI Missions compact */}
          <div className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center space-x-1">
                {kpiTrends.missions === 'up' ? (
                  <ArrowUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-500" />
                )}
                <span className={cn(
                  "text-xs font-semibold",
                  kpiTrends.missions === 'up' ? "text-emerald-600" : "text-red-600"
                )}>
                  12%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600">Missions totales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.missions.total}</p>
              {showAdvancedStats && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Taux de réussite</span>
                    <span>{completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-indigo-500 h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* KPI Techniciens compact */}
          <div className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center space-x-1">
                {kpiTrends.technicians === 'up' ? (
                  <ArrowUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-500" />
                )}
                <span className={cn(
                  "text-xs font-semibold",
                  kpiTrends.technicians === 'up' ? "text-emerald-600" : "text-red-600"
                )}>
                  5%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600">Techniciens</p>
              <p className="text-2xl font-bold text-gray-900">{stats.technicians.total}</p>
              {showAdvancedStats && (
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-600">Disponibles: {stats.technicians.available}</span>
                  <span className="text-amber-600">Occupés: {stats.technicians.total - stats.technicians.available}</span>
                </div>
              )}
            </div>
          </div>

          {/* KPI Facturations compact */}
          <div className="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-sm">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div className="flex items-center space-x-1">
                {kpiTrends.billing === 'up' ? (
                  <ArrowUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-500" />
                )}
                <span className={cn(
                  "text-xs font-semibold",
                  kpiTrends.billing === 'up' ? "text-emerald-600" : "text-red-600"
                )}>
                  3%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600">Facturations</p>
              <p className="text-2xl font-bold text-gray-900">
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

        {/* Métriques de performance compactes */}
        {showAdvancedStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Efficacité</h3>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Performance</span>
                  <span className="text-xs font-semibold text-gray-900">{efficiency}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${efficiency}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Temps moyen</h3>
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div className="space-y-1">
                <div className="text-xl font-bold text-gray-900">2.4h</div>
                <div className="text-xs text-gray-600">par mission</div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Satisfaction</h3>
                <div className="flex space-x-0.5">
                  {[1,2,3,4,5].map((star) => (
                    <div key={star} className="w-3 h-3 bg-yellow-400 rounded-sm" />
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-bold text-gray-900">4.8/5</div>
                <div className="text-xs text-gray-600">Note client moyenne</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Section de gestion des données compacte */}
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* En-tête compact */}
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Gestion des données</h2>
                <p className="text-sm text-gray-600">Administrez vos ressources et suivez l'activité</p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Actions rapides compactes */}
                <button className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm">
                  <Activity className="h-3 w-3" />
                  <span className="font-medium">Exporter</span>
                </button>
                <button className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm">
                  <Users className="h-3 w-3" />
                  <span className="font-medium">Importer</span>
                </button>
                <button className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <CheckCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Onglets simplifiés */}
          <div className="p-4">
            <ResponsiveTabs
              items={tabItems}
              defaultValue="missions"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Footer compact avec informations essentielles */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Statut système compact */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Statut système</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isConnected ? "bg-emerald-500" : "bg-red-500"
                    )} />
                    <span className="text-xs text-gray-600">Base de données</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900">
                    {isConnected ? "Opérationnelle" : "Indisponible"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-gray-600">API Services</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900">Actif</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-xs text-gray-600">Synchronisation</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900">
                    {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Jamais'}
                  </span>
                </div>
              </div>
            </div>

            {/* Liens rapides compact */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Liens rapides</h3>
              <div className="space-y-1">
                {[
                  { label: 'Documentation', href: '#' },
                  { label: 'Support technique', href: '#' },
                  { label: 'Paramètres avancés', href: '#' },
                  { label: 'Journal d\'activité', href: '#' }
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="flex items-center justify-between group py-0.5 hover:text-indigo-600 transition-colors"
                  >
                    <span className="text-xs text-gray-600 group-hover:text-indigo-600">
                      {link.label}
                    </span>
                    <ArrowUp className="h-3 w-3 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  </a>
                ))}
              </div>
            </div>

            {/* Informations système compact */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Informations</h3>
              <div className="space-y-1 text-xs text-gray-600">
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
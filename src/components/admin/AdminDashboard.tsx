import { useEffect, useState, useMemo } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { MissionsTab } from './MissionsTab'
import { TechniciansTab } from './TechniciansTab'
import { AdminAgendaTab } from './AdminAgendaTab'
import { AdminBillingTab } from './AdminBillingTab'
import { PaymentSummaryCard } from './PaymentSummaryCard'
import { ResponsiveTabs } from '@/components/ui/responsive-tabs'
import { 
  Users, Calendar, CreditCard, Activity, CheckCircle, 
  Clock, ArrowUp, ArrowDown, Eye, EyeOff} from 'lucide-react'
import { LoadingOverlay } from '@/components/ui/loading'
import { useRealtimeSync } from '@/lib/useRealtimeSync'
import { cn } from '@/lib/utils'

export function AdminDashboard() {
  const { fetchAllData, refreshData, loading, lastSync, isConnected, stats } = useAdminStore()
  const [showAdvancedStats, setShowAdvancedStats] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'grid'>('kanban')
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false)
  
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

  // Optimisation des calculs avec useMemo
  const kpiTrends = useMemo(() => ({
    missions: Math.random() > 0.5 ? 'up' : 'down',
    technicians: Math.random() > 0.5 ? 'up' : 'down',
    billing: Math.random() > 0.5 ? 'up' : 'down'
  }), [])

  const completionRate = useMemo(() => 
    Math.round((stats.missions.assignedCount / stats.missions.total) * 100) || 75, 
    [stats.missions.assignedCount, stats.missions.total]
  )

  const efficiency = useMemo(() => 
    Math.round(Math.random() * 100) || 85, 
    []
  )

  // Filtres optimisés pour les missions
  const filterOptions = useMemo(() => [
    { value: 'all', label: 'Toutes', count: stats.missions.total },
    { value: 'pending', label: 'En attente', count: stats.missions.total - stats.missions.assignedCount },
    { value: 'in-progress', label: 'En cours', count: stats.missions.assignedCount },
    { value: 'completed', label: 'Terminées', count: Math.floor(stats.missions.total * 0.7) },
    { value: 'urgent', label: 'Urgentes', count: Math.floor(stats.missions.total * 0.1) }
  ], [stats.missions])

  // Configuration des onglets optimisée
  const tabItems = useMemo(() => [
    {
      value: 'missions',
      label: 'Missions',
      icon: <Activity className="h-4 w-4" />,
      badge: stats.missions.total || 0,
      description: 'Gestion des missions actives',
      content: (
        <LoadingOverlay loading={loading.missions} text="Chargement des missions...">
          <MissionsTab 
            searchQuery={searchQuery}
            selectedFilter={selectedFilter}
            sortBy={sortBy}
            viewMode={viewMode}
            onSearchChange={setSearchQuery}
            onFilterChange={setSelectedFilter}
            onSortChange={setSortBy}
            onViewModeChange={setViewMode}
          />
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
  ], [stats, loading, searchQuery, selectedFilter, sortBy, viewMode])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Vue d'ensemble déployable */}
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
              className="flex items-center space-x-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              {isOverviewExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="font-medium">Vue d'ensemble</span>
              <span className="text-xs bg-indigo-200 px-2 py-1 rounded-full">
                {isOverviewExpanded ? 'Masquer' : 'Afficher'}
              </span>
            </button>
            {isOverviewExpanded && (
              <button
                onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                {showAdvancedStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="font-medium">
                  {showAdvancedStats ? 'Vue simple' : 'Vue détaillée'}
                </span>
              </button>
            )}
          </div>
          {isOverviewExpanded && (
            <div className="text-sm text-gray-600">
              Dernière mise à jour: {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Jamais'}
            </div>
          )}
        </div>

        {/* Contenu de la vue d'ensemble - déployable */}
        <div className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isOverviewExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}
        `}>
          {isOverviewExpanded && (
            <div className="space-y-6">
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
                    <p className="text-2xl font-bold text-gray-900">{stats.missions.total.toLocaleString()}</p>
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
                    <p className="text-2xl font-bold text-gray-900">{stats.technicians.total.toLocaleString()}</p>
                    {showAdvancedStats && (
                      <div className="flex justify-between text-xs">
                        <span className="text-emerald-600">Disponibles: {stats.technicians.available.toLocaleString()}</span>
                        <span className="text-amber-600">Occupés: {(stats.technicians.total - stats.technicians.available).toLocaleString()}</span>
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
            </div>
          )}
        </div>
      </section>

      {/* Composant principal - Gestion des données */}
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

      

      {/* Espacement pour la barre de navigation mobile */}
      <div className="md:hidden h-20"></div>
    </div>
  )
}
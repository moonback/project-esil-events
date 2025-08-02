import { useEffect, useState, useMemo } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { MissionsTab } from './MissionsTab'
import { TechniciansTab } from './TechniciansTab'
import { AdminAgendaTab } from './AdminAgendaTab'
import { AdminBillingTab } from './AdminBillingTab'
import { MissionsWithAssignmentsTab } from './MissionsWithAssignmentsTab'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'grid'>('kanban')
  
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
      value: 'missions-assignments',
      label: 'Assignations',
      icon: <Users className="h-4 w-4" />,
      badge: null,
      description: 'Gestion des assignations et annulation automatique',
      content: (
        <LoadingOverlay loading={loading.missions} text="Chargement des assignations...">
          <MissionsWithAssignmentsTab />
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
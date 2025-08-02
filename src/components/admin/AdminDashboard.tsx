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
  const [activeSection, setActiveSection] = useState<'missions' | 'assignations' | 'technicians' | 'agenda' | 'billing'>('missions')
  
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

  // Fonction pour rendre le contenu de la section active
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'missions':
        return (
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
      case 'assignations':
        return (
          <LoadingOverlay loading={loading.missions} text="Chargement des assignations...">
            <MissionsWithAssignmentsTab />
          </LoadingOverlay>
        )
      case 'technicians':
        return (
          <LoadingOverlay loading={loading.technicians} text="Chargement des techniciens...">
            <TechniciansTab />
          </LoadingOverlay>
        )
      case 'agenda':
        return (
          <LoadingOverlay loading={loading.missions} text="Chargement de l'agenda...">
            <AdminAgendaTab />
          </LoadingOverlay>
        )
      case 'billing':
        return (
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
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Composant principal - Gestion des données */}
      <section className="max-w-12xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* En-tête professionnel */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Tableau de bord administrateur</h1>
                  <p className="text-indigo-100 text-lg mt-2">Gestion centralisée des missions, techniciens et facturations</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Indicateur de statut */}
                <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`}></div>
                  <span className="text-white text-sm font-semibold">
                    {isConnected ? 'Connecté' : 'Déconnecté'}
                  </span>
                </div>
                
                {/* Actions rapides */}
                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-200 text-sm font-medium border border-white/20">
                    <Activity className="h-4 w-4" />
                    <span>Exporter</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all duration-200 text-sm font-medium border border-white/20">
                    <Users className="h-4 w-4" />
                    <span>Importer</span>
                  </button>
                  <button className="p-3 text-white hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/20">
                    <CheckCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium mb-1">Missions</p>
                    <p className="text-white text-3xl font-bold">{stats.missions.total}</p>
                    <p className="text-indigo-200 text-xs mt-1">Total actif</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium mb-1">Assignations</p>
                    <p className="text-white text-3xl font-bold">{stats.missions.assignedCount}</p>
                    <p className="text-indigo-200 text-xs mt-1">En cours</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium mb-1">Techniciens</p>
                    <p className="text-white text-3xl font-bold">{stats.technicians.available}</p>
                    <p className="text-indigo-200 text-xs mt-1">Disponibles</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium mb-1">Chiffre d'affaires</p>
                    <p className="text-white text-3xl font-bold">
                      {stats.billings.totalAmount > 0 ? `${(stats.billings.totalAmount / 1000).toFixed(1)}k€` : '0€'}
                    </p>
                    <p className="text-indigo-200 text-xs mt-1">Total</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Menu de navigation amélioré */}
          <div className="px-8 py-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestion des données</h2>
              <p className="text-gray-600 text-lg">Sélectionnez une section pour gérer vos ressources</p>
            </div>
            
            {/* Menu de navigation avec design moderne */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <button 
                onClick={() => setActiveSection('missions')}
                className={`group relative rounded-2xl p-6 border transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                  activeSection === 'missions' 
                    ? 'bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-300 shadow-lg' 
                    : 'bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 border-indigo-200 hover:border-indigo-300'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 ${
                    activeSection === 'missions' 
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700' 
                      : 'bg-gradient-to-br from-indigo-500 to-indigo-600'
                  }`}>
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold transition-colors ${
                      activeSection === 'missions' ? 'text-indigo-700' : 'text-gray-900 group-hover:text-indigo-700'
                    }`}>Missions</h3>
                    <p className="text-sm text-gray-600 mt-1">Gestion des missions actives</p>
                    <div className="mt-2 text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                      {stats.missions.total} missions
                    </div>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setActiveSection('assignations')}
                className={`group relative rounded-2xl p-6 border transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                  activeSection === 'assignations' 
                    ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300 shadow-lg' 
                    : 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-blue-200 hover:border-blue-300'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 ${
                    activeSection === 'assignations' 
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700' 
                      : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}>
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold transition-colors ${
                      activeSection === 'assignations' ? 'text-blue-700' : 'text-gray-900 group-hover:text-blue-700'
                    }`}>Assignations</h3>
                    <p className="text-sm text-gray-600 mt-1">Gestion des assignations</p>
                    <div className="mt-2 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {stats.missions.assignedCount} assignées
                    </div>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setActiveSection('technicians')}
                className={`group relative rounded-2xl p-6 border transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                  activeSection === 'technicians' 
                    ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 border-emerald-300 shadow-lg' 
                    : 'bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 border-emerald-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 ${
                    activeSection === 'technicians' 
                      ? 'bg-gradient-to-br from-emerald-600 to-emerald-700' 
                      : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                  }`}>
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold transition-colors ${
                      activeSection === 'technicians' ? 'text-emerald-700' : 'text-gray-900 group-hover:text-emerald-700'
                    }`}>Techniciens</h3>
                    <p className="text-sm text-gray-600 mt-1">Équipe et ressources</p>
                    <div className="mt-2 text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                      {stats.technicians.available} disponibles
                    </div>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setActiveSection('agenda')}
                className={`group relative rounded-2xl p-6 border transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                  activeSection === 'agenda' 
                    ? 'bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300 shadow-lg' 
                    : 'bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-purple-200 hover:border-purple-300'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 ${
                    activeSection === 'agenda' 
                      ? 'bg-gradient-to-br from-purple-600 to-purple-700' 
                      : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold transition-colors ${
                      activeSection === 'agenda' ? 'text-purple-700' : 'text-gray-900 group-hover:text-purple-700'
                    }`}>Agenda</h3>
                    <p className="text-sm text-gray-600 mt-1">Planning et rendez-vous</p>
                    <div className="mt-2 text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      Planning
                    </div>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setActiveSection('billing')}
                className={`group relative rounded-2xl p-6 border transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                  activeSection === 'billing' 
                    ? 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-300 shadow-lg' 
                    : 'bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border-amber-200 hover:border-amber-300'
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 ${
                    activeSection === 'billing' 
                      ? 'bg-gradient-to-br from-amber-600 to-amber-700' 
                      : 'bg-gradient-to-br from-amber-500 to-amber-600'
                  }`}>
                    <CreditCard className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold transition-colors ${
                      activeSection === 'billing' ? 'text-amber-700' : 'text-gray-900 group-hover:text-amber-700'
                    }`}>Facturation</h3>
                    <p className="text-sm text-gray-600 mt-1">Gestion financière</p>
                    <div className="mt-2 text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                      {stats.billings.totalAmount > 0 ? `${(stats.billings.totalAmount / 1000).toFixed(1)}k€` : '0€'}
                    </div>
                  </div>
                </div>
              </button>
            </div>
            
            {/* Contenu de la section active */}
            <div className="bg-gray-50 rounded-2xl p-6">
              {renderActiveSection()}
            </div>
          </div>
        </div>
      </section>

      {/* Espacement pour la barre de navigation mobile */}
      <div className="md:hidden h-20"></div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useAdminStore } from '@/store/adminStore'
import { MissionsTab } from './MissionsTab'
import { TechniciansTab } from './TechniciansTab'
import { AdminAgendaTab } from './AdminAgendaTab'
import { AdminBillingTab } from './AdminBillingTab'
import { MissionsWithAssignmentsTab } from './MissionsWithAssignmentsTab'
import { MissionsMapTab } from './MissionsMapTab'
import { TestNotifications } from './TestNotifications'
import { DebugNotifications } from './DebugNotifications'

import { MissionDialog } from './MissionDialog'
import { MissionViewDialog } from './MissionViewDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, Calendar, CreditCard, Activity, CheckCircle, MapPin, Bell
} from 'lucide-react'
import { LoadingOverlay } from '@/components/ui/loading'
import { useRealtimeSync } from '@/lib/useRealtimeSync'
import { MobileMenu } from '@/components/ui/mobile-menu'
import { FloatingActions } from '@/components/ui/floating-actions'
import type { Mission, MissionWithAssignments } from '@/types/database'

export function AdminDashboard() {
  const { fetchAllData, refreshData, loading, lastSync, isConnected, stats } = useAdminStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'grid'>('kanban')
  const [activeTab, setActiveTab] = useState('missions')
  
  // États pour les dialogues de mission
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [missionToView, setMissionToView] = useState<MissionWithAssignments | null>(null)
  
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

  // Gestionnaires pour les missions
  const handleViewMission = (mission: MissionWithAssignments) => {
    setMissionToView(mission)
    setViewDialogOpen(true)
  }

  const handleEditMission = (mission: MissionWithAssignments) => {
    setSelectedMission(mission)
    setDialogOpen(true)
  }

  const handleEditFromView = (mission: MissionWithAssignments) => {
    setViewDialogOpen(false)
    setSelectedMission(mission)
    setDialogOpen(true)
  }

  const tabs = [
    {
      value: 'missions',
      label: 'Missions',
      icon: Activity,
      color: 'indigo'
    },
    {
      value: 'map',
      label: 'Carte',
      icon: MapPin,
      color: 'red'
    },
    {
      value: 'assignations',
      label: 'Assignations',
      icon: Users,
      color: 'blue'
    },
    {
      value: 'technicians',
      label: 'Techniciens',
      icon: Users,
      color: 'green'
    },
    {
      value: 'agenda',
      label: 'Agenda',
      icon: Calendar,
      color: 'purple'
    },
    {
      value: 'billing',
      label: 'Facturation',
      icon: CreditCard,
      color: 'orange'
    },
    {
      value: 'test',
      label: 'Test Notif',
      icon: Bell,
      color: 'yellow'
    }
  ]

  const getTabColor = (color: string, isActive: boolean) => {
    const colors = {
      indigo: isActive ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50 data-[state=active]:bg-indigo-600 data-[state=active]:text-white',
      red: isActive ? 'bg-red-600 text-white' : 'hover:bg-red-50 data-[state=active]:bg-red-600 data-[state=active]:text-white',
      blue: isActive ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white',
      green: isActive ? 'bg-green-600 text-white' : 'hover:bg-green-50 data-[state=active]:bg-green-600 data-[state=active]:text-white',
      purple: isActive ? 'bg-purple-600 text-white' : 'hover:bg-purple-50 data-[state=active]:bg-purple-600 data-[state=active]:text-white',
      orange: isActive ? 'bg-orange-600 text-white' : 'hover:bg-orange-50 data-[state=active]:bg-orange-600 data-[state=active]:text-white',
      yellow: isActive ? 'bg-yellow-600 text-white' : 'hover:bg-yellow-50 data-[state=active]:bg-yellow-600 data-[state=active]:text-white'
    }
    return colors[color as keyof typeof colors] || colors.indigo
  }

  return (
    <div className="space-y-6 animate-fade-in-up p-4 pb-20">
      {/* Header responsive */}
      <div className="flex items-center justify-between">
        {/* <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard ESIL</h1>
          <p className="text-gray-600 mt-1">Administration & Monitoring</p>
        </div> */}
        
        {/* Menu mobile */}
        <div className="md:hidden">
          <MobileMenu 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={tabs}
          />
        </div>
      </div>

      {/* Tabs desktop */}
      <div className="hidden md:block">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white border border-gray-200 shadow-sm rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className={`flex items-center space-x-2 rounded-md transition-all duration-200 text-sm font-medium ${getTabColor(tab.color, false)}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value="missions" className="animate-slide-in-right">
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
          </TabsContent>

                     <TabsContent value="map" className="animate-slide-in-right">
             <LoadingOverlay loading={loading.missions} text="Chargement de la carte...">
               <MissionsMapTab 
                 onViewMission={handleViewMission}
                 onEditMission={handleEditMission}
                 isModalOpen={dialogOpen || viewDialogOpen}
               />
             </LoadingOverlay>
           </TabsContent>

          <TabsContent value="assignations" className="animate-slide-in-right">
            <LoadingOverlay loading={loading.missions} text="Chargement des assignations...">
              <MissionsWithAssignmentsTab />
            </LoadingOverlay>
          </TabsContent>

          <TabsContent value="technicians" className="animate-slide-in-right">
            <LoadingOverlay loading={loading.technicians} text="Chargement des techniciens...">
              <TechniciansTab />
            </LoadingOverlay>
          </TabsContent>

          <TabsContent value="agenda" className="animate-slide-in-right">
            <LoadingOverlay loading={loading.missions} text="Chargement de l'agenda...">
              <AdminAgendaTab />
            </LoadingOverlay>
          </TabsContent>

                     <TabsContent value="billing" className="animate-slide-in-right">
             <LoadingOverlay loading={loading.billings} text="Chargement des facturations...">
               <AdminBillingTab />
             </LoadingOverlay>
           </TabsContent>

           <TabsContent value="test" className="animate-slide-in-right">
             <div className="space-y-6">
               <TestNotifications />
               <DebugNotifications />
             </div>
           </TabsContent>
        </Tabs>
      </div>

      {/* Content mobile */}
      <div className="md:hidden">
        {activeTab === 'missions' && (
          <div className="animate-slide-in-right">
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
          </div>
        )}
        
                 {activeTab === 'map' && (
           <div className="animate-slide-in-right">
             <LoadingOverlay loading={loading.missions} text="Chargement de la carte...">
               <MissionsMapTab 
                 onViewMission={handleViewMission}
                 onEditMission={handleEditMission}
                 isModalOpen={dialogOpen || viewDialogOpen}
               />
             </LoadingOverlay>
           </div>
         )}
        
        {activeTab === 'assignations' && (
          <div className="animate-slide-in-right">
            <LoadingOverlay loading={loading.missions} text="Chargement des assignations...">
              <MissionsWithAssignmentsTab />
            </LoadingOverlay>
          </div>
        )}
        
        {activeTab === 'technicians' && (
          <div className="animate-slide-in-right">
            <LoadingOverlay loading={loading.technicians} text="Chargement des techniciens...">
              <TechniciansTab />
            </LoadingOverlay>
          </div>
        )}
        
        {activeTab === 'agenda' && (
          <div className="animate-slide-in-right">
            <LoadingOverlay loading={loading.missions} text="Chargement de l'agenda...">
              <AdminAgendaTab />
            </LoadingOverlay>
          </div>
        )}
        
                 {activeTab === 'billing' && (
           <div className="animate-slide-in-right">
             <LoadingOverlay loading={loading.billings} text="Chargement des facturations...">
               <AdminBillingTab />
             </LoadingOverlay>
           </div>
         )}
         
         {activeTab === 'test' && (
           <div className="animate-slide-in-right space-y-6">
             <TestNotifications />
             <DebugNotifications />
           </div>
         )}
      </div>

      {/* Indicateur d'onglet actuel pour mobile */}
      <div className="md:hidden">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            {(() => {
              const currentTab = tabs.find(tab => tab.value === activeTab)
              if (!currentTab) return null
              const Icon = currentTab.icon
              return (
                <>
                  <Icon className={`h-5 w-5 text-${currentTab.color}-600`} />
                  <span className="font-medium text-gray-900">{currentTab.label}</span>
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Dialogue de mission */}
      <MissionDialog
        mission={selectedMission}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Menu d'actions rapides flottant */}
      <FloatingActions 
        onTabChange={setActiveTab}
        currentTab={activeTab}
        userType="admin"
      />

      {/* Dialogue de visualisation */}
      <MissionViewDialog
        mission={missionToView}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        onEdit={handleEditFromView}
      />
    </div>
  )
}
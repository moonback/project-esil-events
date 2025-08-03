import { memo } from 'react'
import { MobileMenu } from '../../../components/ui/mobile-menu'
import { DASHBOARD_TABS } from '../constants/dashboardConfig'

interface DashboardHeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export const DashboardHeader = memo(({ activeTab, onTabChange }: DashboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      {/* Header desktop - commenté pour l'instant */}
      {/* <div className="hidden md:block">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard ESIL</h1>
        <p className="text-gray-600 mt-1">Administration & Monitoring</p>
      </div> */}
      
      {/* Menu mobile */}
      <div className="md:hidden w-full">
        <MobileMenu 
          activeTab={activeTab}
          onTabChange={onTabChange}
          tabs={DASHBOARD_TABS}
        />
      </div>
    </div>
  )
})

DashboardHeader.displayName = 'DashboardHeader'
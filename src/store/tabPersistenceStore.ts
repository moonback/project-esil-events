import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TabPersistenceState {
  activeTabs: Set<string>
  tabData: Record<string, any>
  setActiveTab: (tabId: string) => void
  setInactiveTab: (tabId: string) => void
  setTabData: (tabId: string, data: any) => void
  getTabData: (tabId: string) => any
  clearTabData: (tabId: string) => void
  isTabActive: (tabId: string) => boolean
}

export const useTabPersistenceStore = create<TabPersistenceState>()(
  persist(
    (set, get) => ({
      activeTabs: new Set(),
      tabData: {},

      setActiveTab: (tabId: string) => {
        set((state) => ({
          activeTabs: new Set([...state.activeTabs, tabId])
        }))
      },

      setInactiveTab: (tabId: string) => {
        set((state) => {
          const newActiveTabs = new Set(state.activeTabs)
          newActiveTabs.delete(tabId)
          return { activeTabs: newActiveTabs }
        })
      },

      setTabData: (tabId: string, data: any) => {
        set((state) => ({
          tabData: {
            ...state.tabData,
            [tabId]: {
              ...data,
              lastUpdated: Date.now()
            }
          }
        }))
      },

      getTabData: (tabId: string) => {
        const { tabData } = get()
        return tabData[tabId] || null
      },

      clearTabData: (tabId: string) => {
        set((state) => {
          const newTabData = { ...state.tabData }
          delete newTabData[tabId]
          return { tabData: newTabData }
        })
      },

      isTabActive: (tabId: string) => {
        const { activeTabs } = get()
        return activeTabs.has(tabId)
      }
    }),
    {
      name: 'tab-persistence-storage',
      partialize: (state) => ({
        tabData: state.tabData
      })
    }
  )
) 
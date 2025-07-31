import React from 'react'
import { useAuthStore } from '@/store/authStore'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { TechnicianDashboard } from '@/components/technician/TechnicianDashboard'
import { Header } from './Header'

export function Layout() {
  const profile = useAuthStore(state => state.profile)

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Effet de particules animées en arrière-plan */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-2xl animate-bounce-slow"></div>
      </div>
      
      <Header />
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="animate-fade-in-up">
          {profile.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <TechnicianDashboard />
          )}
        </div>
      </main>
    </div>
  )
}
import React from 'react'
import { useAuthStore } from '@/store/authStore'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { TechnicianDashboard } from '@/components/technician/TechnicianDashboard'
import { Header } from './Header'

export function Layout() {
  const profile = useAuthStore(state => state.profile)

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {profile.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <TechnicianDashboard />
        )}
      </main>
    </div>
  )
}
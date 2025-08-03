import React from 'react'
import { useAuthStore } from '@/store/authStore'
import { Header } from './Header'
import { AdminDashboard } from '../admin/AdminDashboard'
import { TechnicianDashboard } from '../technician/TechnicianDashboard'
import { ToastContainer, Toast } from '../ui/toast'
import { useToast } from '@/lib/useToast'

export function Layout() {
  const { profile } = useAuthStore()
  const { toasts, removeToast } = useToast()

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Header />
      <main className="mx-auto ">
        {profile.role === 'admin' ? <AdminDashboard /> : <TechnicianDashboard />}
      </main>
      
      {/* Toast Container */}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </ToastContainer>
    </div>
  )
}
import React, { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { AuthForm } from '@/components/auth/AuthForm'
import { Layout } from '@/components/layout/Layout'
import { Sparkles } from 'lucide-react'

function App() {
  const { user, loading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center relative overflow-hidden">
        {/* Effet de particules animées en arrière-plan */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-2xl animate-bounce-slow"></div>
        </div>
        
        <div className="text-center space-y-6 relative z-10">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="relative">
              <Sparkles className="h-12 w-12 text-indigo-600 animate-pulse-slow" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce-slow"></div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              EventPro
            </h1>
          </div>
          
          <div className="space-y-4">
            <div className="loading-spinner mx-auto"></div>
            <p className="text-gray-600 text-lg animate-pulse-slow">Chargement de votre espace...</p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce-slow"></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce-slow" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce-slow" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return user ? <Layout /> : <AuthForm />
}

export default App
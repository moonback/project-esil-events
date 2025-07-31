import React, { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Eye, EyeOff, User, Lock, Mail } from 'lucide-react'

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'admin' | 'technicien'>('technicien')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  const { signIn, signUp } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = isSignUp 
        ? await signUp(email, password, name, role)
        : await signIn(email, password)
        
      if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      setError(isSignUp ? 'Erreur d\'inscription' : 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setRole('technicien')
    setError('')
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    resetForm()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 relative overflow-hidden">
      {/* Effet de particules animées en arrière-plan */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-2xl animate-bounce-slow"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/80 backdrop-blur-sm border-0 shadow-2xl animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/70 rounded-lg"></div>
        
        <CardHeader className="text-center relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Sparkles className="h-8 w-8 text-indigo-600 animate-pulse-slow" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce-slow"></div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {isSignUp ? 'Créer un compte' : 'Bienvenue'}
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            {isSignUp 
              ? 'Rejoignez notre plateforme événementielle'
              : 'Connectez-vous à votre espace'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Nom complet</span>
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom complet"
                    className="pl-10 bg-white/50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300"
                    required
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="pl-10 bg-white/50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300"
                  required
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Mot de passe</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-white/50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300"
                  required
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                  Rôle
                </Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'technicien')}
                  className="flex h-10 w-full rounded-md border border-gray-200 bg-white/50 px-3 py-2 text-sm shadow-sm transition-all duration-300 focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="technicien">🔧 Technicien</option>
                  <option value="admin">👑 Administrateur</option>
                </select>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 animate-slide-in-right">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse-slow"></div>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="loading-spinner"></div>
                  <span>{isSignUp ? 'Création...' : 'Connexion...'}</span>
                </div>
              ) : (
                <span>{isSignUp ? 'Créer mon compte' : 'Se connecter'}</span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <Button
              type="button"
              variant="link"
              onClick={toggleMode}
              className="text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-300"
            >
              {isSignUp 
                ? 'Déjà un compte ? Se connecter'
                : 'Pas de compte ? S\'inscrire'
              }
            </Button>
          </div>

          {!isSignUp && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-xs text-center text-gray-600 mb-2 font-medium">Comptes de test :</p>
              <div className="space-y-1 text-xs text-gray-500">
                <p><strong>Admin:</strong> admin@test.com / admin123</p>
                <p><strong>Technicien:</strong> tech@test.com / tech123</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
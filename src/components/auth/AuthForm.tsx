import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Eye, EyeOff, User, Lock, Mail, Shield, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import { EmailVerificationDialog } from './EmailVerificationDialog'

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'admin' | 'technicien'>('technicien')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  
  const { signIn, signUp } = useAuthStore()

  // Validation du mot de passe en temps réel
  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength(0)
      return
    }
    
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    
    setPasswordStrength(strength)
  }, [password])

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
      } else if (isSignUp && role === 'technicien') {
        // Afficher le dialogue de validation d'email pour les techniciens
        setRegisteredEmail(email)
        setShowEmailVerification(true)
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
    setPasswordStrength(0)
    setShowEmailVerification(false)
    setRegisteredEmail('')
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    resetForm()
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500'
    if (passwordStrength <= 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Faible'
    if (passwordStrength <= 3) return 'Moyen'
    return 'Fort'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 relative overflow-hidden">
      {/* Effet de particules animées en arrière-plan */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-2xl animate-bounce-slow"></div>
        <div className="absolute top-1/4 right-1/4 w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full blur-xl animate-float"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/80 backdrop-blur-sm border-0 shadow-2xl animate-fade-in-up">
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/70 rounded-lg"></div>
        
        <CardHeader className="text-center relative z-10">
          <div className="flex items-center justify-center mb-6">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 overflow-hidden bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600">
                <img 
                  src="/logo.png" 
                  alt="ESIL-EVENTS Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse-slow"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-400 rounded-full animate-bounce-slow" style={{ animationDelay: '0.5s' }}></div>
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
              <div className="space-y-2 animate-slide-in-right">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Nom complet</span>
                </Label>
                <div className="relative group">
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Votre nom complet"
                    className={`pl-10 bg-white/50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300 ${
                      focusedField === 'name' ? 'ring-2 ring-indigo-200 scale-105' : ''
                    }`}
                    required
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  {name && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500 animate-scale-in" />
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </Label>
              <div className="relative group">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="votre@email.com"
                  className={`pl-10 bg-white/50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300 ${
                    focusedField === 'email' ? 'ring-2 ring-indigo-200 scale-105' : ''
                  }`}
                  required
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                {email && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500 animate-scale-in" />
                )}
              </div>
            </div>
            
            <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Mot de passe</span>
              </Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 bg-white/50 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300 ${
                    focusedField === 'password' ? 'ring-2 ring-indigo-200 scale-105' : ''
                  }`}
                  required
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Indicateur de force du mot de passe */}
              {isSignUp && password && (
                <div className="mt-2 space-y-2 animate-fade-in-up">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Force du mot de passe</span>
                    <span className={`font-medium ${getPasswordStrengthColor().replace('bg-', 'text-')}`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Shield className="h-3 w-3" />
                    <span>Minimum 8 caractères avec majuscules, minuscules et chiffres</span>
                  </div>
                </div>
              )}
            </div>

            {isSignUp && (
              <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '0.3s' }}>
                <Label htmlFor="role" className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Rôle</span>
                </Label>
                <div className="relative group">
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'technicien')}
                    onFocus={() => setFocusedField('role')}
                    onBlur={() => setFocusedField(null)}
                    className={`flex h-10 w-full rounded-md border border-gray-200 bg-white/50 px-3 py-2 text-sm shadow-sm transition-all duration-300 focus:border-indigo-500 focus:ring-indigo-500 ${
                      focusedField === 'role' ? 'ring-2 ring-indigo-200 scale-105' : ''
                    }`}
                    required
                  >
                    <option value="technicien">🔧 Technicien</option>
                    <option value="admin">👑 Administrateur</option>
                  </select>
                  <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 animate-slide-in-right">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500 animate-pulse-slow" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed animate-slide-in-right"
              style={{ animationDelay: '0.4s' }}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="loading-spinner"></div>
                  <span>{isSignUp ? 'Création...' : 'Connexion...'}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>{isSignUp ? 'Créer mon compte' : 'Se connecter'}</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center animate-slide-in-right" style={{ animationDelay: '0.5s' }}>
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

          
        </CardContent>
      </Card>

      {/* Dialogue de validation d'email */}
      <EmailVerificationDialog
        open={showEmailVerification}
        onClose={() => setShowEmailVerification(false)}
        email={registeredEmail}
      />
    </div>
  )
}
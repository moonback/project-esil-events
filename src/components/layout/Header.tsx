import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { LogOut, User, Sparkles, Menu, X, Bell, Settings, ChevronDown } from 'lucide-react'

export function Header() {
  const { profile, signOut } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Effet de scroll pour changer l'apparence du header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <header className={`
      relative overflow-hidden transition-all duration-500 ease-out
      ${isScrolled 
        ? 'bg-white/95 backdrop-blur-xl shadow-xl border-b border-gray-200/50' 
        : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg'
      }
    `}>
      {/* Effet de particules animées - visible uniquement quand pas scrollé */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isScrolled ? 'opacity-0' : 'opacity-10'}`}>
        <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full animate-pulse-slow"></div>
        <div className="absolute top-8 right-8 w-1 h-1 bg-white rounded-full animate-bounce-slow"></div>
        <div className="absolute bottom-4 left-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-8 right-1/4 w-1 h-1 bg-white rounded-full animate-bounce-slow"></div>
        <div className="absolute top-1/2 left-1/3 w-1 h-1 bg-white rounded-full animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-6 right-1/3 w-1.5 h-1.5 bg-white rounded-full animate-bounce-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Effet de vague animée en arrière-plan */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isScrolled ? 'opacity-0' : 'opacity-20'}`}>
        <svg className="absolute bottom-0 left-0 w-full h-16" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.1)" className="animate-pulse-slow" />
        </svg>
      </div>
      
      <div className="container mx-auto px-4 py-4 relative z-10">
        <div className="flex items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <div className={`
                  p-2 rounded-xl transition-all duration-300 group-hover:scale-110
                  ${isScrolled 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg' 
                    : 'bg-white/20 backdrop-blur-sm'
                  }
                `}>
                  <Sparkles className={`h-6 w-6 transition-colors duration-300 ${isScrolled ? 'text-white' : 'text-white'} animate-pulse-slow`} />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce-slow shadow-lg"></div>
              </div>
              <div>
                <h1 className={`
                  text-2xl md:text-3xl font-bold tracking-tight transition-colors duration-300
                  ${isScrolled ? 'text-gray-800' : 'text-white'}
                `}>
                  Esil-events
                </h1>
                <p className={`
                  text-xs font-medium transition-colors duration-300 hidden sm:block
                  ${isScrolled ? 'text-gray-500' : 'text-white/80'}
                `}>
                  Gestion d'événements professionnelle
                </p>
              </div>
            </div>
            
            {/* Badge de rôle - masqué sur mobile */}
            {profile && (
              <div className="hidden lg:flex items-center space-x-2">
                <span className={`
                  text-sm px-4 py-2 rounded-full font-semibold border transition-all duration-300 hover:scale-105
                  ${isScrolled 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200 hover:from-indigo-100 hover:to-purple-100' 
                    : 'bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30'
                  }
                `}>
                  {profile.role === 'admin' ? '👑 Administrateur' : '🔧 Technicien'}
                </span>
              </div>
            )}
          </div>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {profile && (
              <>
                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`
                    relative p-2 rounded-lg transition-all duration-300 hover:scale-110
                    ${isScrolled 
                      ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800' 
                      : 'text-white hover:bg-white/20'
                    }
                  `}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                </Button>

                {/* Profil utilisateur */}
                <div className={`
                  flex items-center space-x-3 px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105 cursor-pointer group
                  ${isScrolled 
                    ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm' 
                    : 'bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20'
                  }
                `}>
                  <div className={`
                    p-1.5 rounded-lg transition-all duration-300
                    ${isScrolled 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                      : 'bg-white/20 text-white'
                    }
                  `}>
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm leading-tight">{profile.name}</span>
                    <span className={`text-xs leading-tight ${isScrolled ? 'text-gray-500' : 'text-white/70'}`}>
                      {profile.role === 'admin' ? 'Administrateur' : 'Technicien'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
                </div>
              </>
            )}
            
            {/* Bouton de déconnexion */}
            <Button
              variant="outline"
              onClick={signOut}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-xl border font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg
                ${isScrolled 
                  ? 'bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300' 
                  : 'bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                }
              `}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Déconnexion</span>
            </Button>
          </div>

          {/* Menu mobile */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={toggleMenu}
              className={`
                p-2 rounded-lg transition-all duration-300
                ${isScrolled 
                  ? 'text-gray-600 hover:bg-gray-100' 
                  : 'text-white hover:bg-white/20'
                }
              `}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        <div className={`
          md:hidden overflow-hidden transition-all duration-300 ease-out
          ${isMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}
        `}>
          <div className={`
            p-4 rounded-xl border backdrop-blur-sm
            ${isScrolled 
              ? 'bg-white/95 border-gray-200' 
              : 'bg-white/10 border-white/20'
            }
          `}>
            {profile && (
              <div className="space-y-4">
                {/* Profil mobile */}
                <div className={`
                  flex items-center space-x-3 p-3 rounded-lg
                  ${isScrolled ? 'bg-gray-50' : 'bg-white/10'}
                `}>
                  <div className={`
                    p-2 rounded-lg
                    ${isScrolled 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                      : 'bg-white/20 text-white'
                    }
                  `}>
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`font-semibold ${isScrolled ? 'text-gray-800' : 'text-white'}`}>
                      {profile.name}
                    </p>
                    <p className={`text-sm ${isScrolled ? 'text-gray-500' : 'text-white/70'}`}>
                      {profile.role === 'admin' ? '👑 Administrateur' : '🔧 Technicien'}
                    </p>
                  </div>
                </div>

                {/* Actions mobiles */}
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className={`
                      w-full justify-start space-x-2 p-3 rounded-lg
                      ${isScrolled 
                        ? 'text-gray-600 hover:bg-gray-100' 
                        : 'text-white hover:bg-white/20'
                      }
                    `}
                  >
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className={`
                      w-full justify-start space-x-2 p-3 rounded-lg
                      ${isScrolled 
                        ? 'text-gray-600 hover:bg-gray-100' 
                        : 'text-white hover:bg-white/20'
                      }
                    `}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Paramètres</span>
                  </Button>
                  
                  <Button
                    onClick={signOut}
                    className={`
                      w-full justify-start space-x-2 p-3 rounded-lg font-semibold
                      ${isScrolled 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                      }
                    `}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Déconnexion</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
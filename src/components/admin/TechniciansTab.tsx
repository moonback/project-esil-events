import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, Users, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { User, MissionAssignment } from '@/types/database'

interface TechnicianWithStats extends User {
  stats: {
    totalAssignments: number
    acceptedAssignments: number
    pendingAssignments: number
    rejectedAssignments: number
  }
}

export function TechniciansTab() {
  const [technicians, setTechnicians] = useState<TechnicianWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTechnicians()
  }, [])

  const fetchTechnicians = async () => {
    try {
      const { data: technicianData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'technicien')
        .order('name')

      if (!technicianData) return

      const techniciansWithStats = await Promise.all(
        technicianData.map(async (tech) => {
          const { data: assignments } = await supabase
            .from('mission_assignments')
            .select('status')
            .eq('technician_id', tech.id)

          const stats = {
            totalAssignments: assignments?.length || 0,
            acceptedAssignments: assignments?.filter(a => a.status === 'accepté').length || 0,
            pendingAssignments: assignments?.filter(a => a.status === 'proposé').length || 0,
            rejectedAssignments: assignments?.filter(a => a.status === 'refusé').length || 0
          }

          return { ...tech, stats }
        })
      )

      setTechnicians(techniciansWithStats)
    } catch (error) {
      console.error('Erreur lors du chargement des techniciens:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* En-tête compact */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Techniciens</h2>
          <p className="text-sm text-gray-500">{technicians.length} technicien{technicians.length > 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-4 gap-4 px-6">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total missions</p>
              <p className="text-lg font-bold text-gray-900">
                {technicians.reduce((sum, tech) => sum + tech.stats.totalAssignments, 0)}
              </p>
            </div>
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Acceptées</p>
              <p className="text-lg font-bold text-green-600">
                {technicians.reduce((sum, tech) => sum + tech.stats.acceptedAssignments, 0)}
              </p>
            </div>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">En attente</p>
              <p className="text-lg font-bold text-orange-600">
                {technicians.reduce((sum, tech) => sum + tech.stats.pendingAssignments, 0)}
              </p>
            </div>
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Refusées</p>
              <p className="text-lg font-bold text-red-600">
                {technicians.reduce((sum, tech) => sum + tech.stats.rejectedAssignments, 0)}
              </p>
            </div>
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
        </div>
      </div>

      {/* Liste des techniciens */}
      <div className="px-6">
        {technicians.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Aucun technicien enregistré</p>
          </div>
        ) : (
          <div className="space-y-3">
            {technicians.map((technician) => (
              <Card key={technician.id} className="border border-gray-200 hover:border-indigo-200 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-900">{technician.name}</h3>
                        <Badge variant="secondary" className="text-xs">Technicien</Badge>
                        {technician.phone && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span>{technician.phone}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          <span>{technician.stats.totalAssignments} total</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{technician.stats.acceptedAssignments} acceptées</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-orange-500" />
                          <span>{technician.stats.pendingAssignments} en attente</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span>{technician.stats.rejectedAssignments} refusées</span>
                        </div>
                      </div>

                      {technician.stats.totalAssignments > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">Taux d'acceptation</span>
                            <span className="font-medium">
                              {Math.round((technician.stats.acceptedAssignments / technician.stats.totalAssignments) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                              style={{
                                width: `${(technician.stats.acceptedAssignments / technician.stats.totalAssignments) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
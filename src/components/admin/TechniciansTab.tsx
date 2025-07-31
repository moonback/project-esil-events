import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, Mail, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
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
      // Récupérer tous les techniciens
      const { data: technicianData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'technicien')
        .order('name')

      if (!technicianData) return

      // Récupérer les statistiques pour chaque technicien
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
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Chargement des techniciens...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Gestion des Techniciens</h3>
        <p className="text-gray-600">Vue d'ensemble de vos techniciens et leurs performances</p>
      </div>

      <div className="grid gap-4">
        {technicians.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Aucun technicien enregistré</p>
            </CardContent>
          </Card>
        ) : (
          technicians.map((technician) => (
            <Card key={technician.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{technician.name}</CardTitle>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      {technician.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>{technician.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Badge variant="secondary">Technicien</Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 text-gray-600 mb-1">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="text-lg font-semibold">{technician.stats.totalAssignments}</div>
                    <div className="text-xs text-gray-500">Total missions</div>
                  </div>
                  
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      {technician.stats.acceptedAssignments}
                    </div>
                    <div className="text-xs text-gray-500">Acceptées</div>
                  </div>
                  
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 text-yellow-600 mb-1">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="text-lg font-semibold text-yellow-600">
                      {technician.stats.pendingAssignments}
                    </div>
                    <div className="text-xs text-gray-500">En attente</div>
                  </div>
                  
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-center space-x-1 text-red-600 mb-1">
                      <XCircle className="h-4 w-4" />
                    </div>
                    <div className="text-lg font-semibold text-red-600">
                      {technician.stats.rejectedAssignments}
                    </div>
                    <div className="text-xs text-gray-500">Refusées</div>
                  </div>
                </div>

                {technician.stats.totalAssignments > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Taux d'acceptation</span>
                      <span className="font-medium">
                        {Math.round((technician.stats.acceptedAssignments / technician.stats.totalAssignments) * 100)}%
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(technician.stats.acceptedAssignments / technician.stats.totalAssignments) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
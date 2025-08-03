import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format, parseISO, isValid } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  MapPin, 
  Clock, 
  Euro, 
  Eye, 
  Navigation, 
  Route, 
  Car, 
  Bike, 
  Train, 
  Bus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Home,
  Building,
  Loader2,
  Sparkles
} from 'lucide-react'
import { getMissionTypeColor } from '@/lib/utils'

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface AcceptedMission {
  id: string
  missions: {
    id: string
    title: string
    type: string
    location: string
    date_start: string
    date_end: string
    forfeit: number
    latitude: number | null
    longitude: number | null
  }
}

interface MapComponentProps {
  missions: AcceptedMission[]
}

// Point de départ par défaut (peut être configuré)
const DEFAULT_DEPOT = {
  name: "Dépôt Mantes-la-Ville",
  latitude: 48.9777,
  longitude: 1.7113, 
  address: "7 rue de la Celophane, 78711 Mantes-la-Ville"
}

// Interface pour les données d'itinéraire optimisé
interface OptimizedRoute {
  totalDistance: number
  estimatedTime: number
  fuelCost: number
  route: {
    from: string
    to: string
    distance: number
    time: number
    mode: string
  }[]
  optimizedOrder: string[]
}

// Fonction pour calculer la distance entre deux points (formule de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

import { callGeminiAPI } from '@/lib/gemini'

// Fonction pour appeler l'API Gemini et optimiser l'itinéraire
async function generateOptimizedRoute(
  missions: AcceptedMission[], 
  depot: typeof DEFAULT_DEPOT, 
  routeType: string
): Promise<OptimizedRoute> {
  try {
    // Préparer les données pour l'API
    const missionsWithCoords = missions.filter(m => m.missions.latitude !== null && m.missions.longitude !== null)
    
    if (missionsWithCoords.length === 0) {
      throw new Error('Aucune mission avec coordonnées GPS')
    }

    // Préparer le prompt pour Gemini
    const prompt = `
Tu es un expert en optimisation d'itinéraires. Analyse les missions suivantes et génère un itinéraire optimisé.

Dépôt de départ: ${depot.name} (${depot.address})
Mode de transport: ${routeType}

Missions à effectuer:
${missionsWithCoords.map((mission, index) => 
  `${index + 1}. ${mission.missions.title} - ${mission.missions.location} (${mission.missions.latitude}, ${mission.missions.longitude})`
).join('\n')}

Calcule l'itinéraire optimal en considérant:
1. La distance totale minimale
2. L'ordre logique des missions
3. Le temps de trajet estimé
4. Les coûts de carburant (si applicable)

Retourne UNIQUEMENT un JSON valide avec cette structure exacte:
{
  "totalDistance": number (en km),
  "estimatedTime": number (en minutes),
  "fuelCost": number (en euros),
  "route": [
    {
      "from": string,
      "to": string,
      "distance": number,
      "time": number,
      "mode": string
    }
  ],
  "optimizedOrder": [string] (noms des missions dans l'ordre optimal)
}
`

    // Appel à l'API Gemini
    const data = await callGeminiAPI(prompt)
    
    // Extraire la réponse de Gemini
    const geminiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!geminiResponse) {
      throw new Error('Réponse invalide de l\'API Gemini')
    }

    // Parser la réponse JSON de Gemini
    const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Format de réponse invalide de Gemini')
    }

    const optimizedRoute = JSON.parse(jsonMatch[0])
    return optimizedRoute

  } catch (error) {
    console.error('Erreur API Gemini:', error)
    
    // Fallback avec calculs locaux si l'API échoue
    return generateFallbackRoute(missions, depot, routeType)
  }
}

// Fonction de fallback avec calculs locaux
function generateFallbackRoute(
  missions: AcceptedMission[], 
  depot: typeof DEFAULT_DEPOT, 
  routeType: string
): OptimizedRoute {
  const missionsWithCoords = missions.filter(m => m.missions.latitude !== null && m.missions.longitude !== null)
  
  let totalDistance = 0
  let currentLat = depot.latitude
  let currentLon = depot.longitude
  const route: OptimizedRoute['route'] = []

  // Calculer la distance du dépôt à chaque mission
  for (const mission of missionsWithCoords) {
    const missionLat = mission.missions.latitude!
    const missionLon = mission.missions.longitude!
    const distance = calculateDistance(currentLat, currentLon, missionLat, missionLon)
    totalDistance += distance
    
    route.push({
      from: currentLat === depot.latitude ? depot.name : 'Mission précédente',
      to: mission.missions.title,
      distance: distance,
      time: Math.round((distance / getAverageSpeed(routeType)) * 60),
      mode: routeType
    })
    
    currentLat = missionLat
    currentLon = missionLon
  }

  // Ajouter le retour au dépôt
  if (missionsWithCoords.length > 0) {
    const lastMission = missionsWithCoords[missionsWithCoords.length - 1]
    const returnDistance = calculateDistance(
      lastMission.missions.latitude!, 
      lastMission.missions.longitude!, 
      depot.latitude, 
      depot.longitude
    )
    totalDistance += returnDistance
    
    route.push({
      from: lastMission.missions.title,
      to: depot.name,
      distance: returnDistance,
      time: Math.round((returnDistance / getAverageSpeed(routeType)) * 60),
      mode: routeType
    })
  }

  const estimatedTime = Math.round((totalDistance / getAverageSpeed(routeType)) * 60)
  const fuelCost = routeType === 'driving' ? totalDistance * 0.15 : 0

  return {
    totalDistance,
    estimatedTime,
    fuelCost,
    route,
    optimizedOrder: missionsWithCoords.map(m => m.missions.title)
  }
}

// Fonction pour obtenir la vitesse moyenne selon le mode de transport
function getAverageSpeed(routeType: string): number {
  switch (routeType) {
    case 'driving': return 50 // km/h en ville
    case 'walking': return 5 // km/h à pied
    case 'bicycling': return 15 // km/h à vélo
    case 'transit': return 25 // km/h en transport
    default: return 50
  }
}

// Composant pour centrer la carte sur les missions et le dépôt
function MapController({ missions, depot }: { missions: AcceptedMission[], depot: typeof DEFAULT_DEPOT }) {
  const map = useMap()
  
  useEffect(() => {
    const allPoints = [
      [depot.latitude, depot.longitude] as [number, number],
      ...missions
        .filter(m => m.missions.latitude !== null && m.missions.longitude !== null)
        .map(m => [m.missions.latitude!, m.missions.longitude!] as [number, number])
    ]
    
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints)
      
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] })
      }
    }
  }, [missions, depot, map])
  
  return null
}

// Composant pour afficher les statistiques de route optimisée
function RouteStats({ 
  missions, 
  routeType, 
  depot, 
  optimizedRoute, 
  isLoading 
}: { 
  missions: AcceptedMission[], 
  routeType: string,
  depot: typeof DEFAULT_DEPOT,
  optimizedRoute: OptimizedRoute | null,
  isLoading: boolean
}) {
  const missionsWithCoords = missions.filter(m => m.missions.latitude !== null && m.missions.longitude !== null)
  
  if (missionsWithCoords.length === 0) {
    return (
      <div className="text-center py-4">
        <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Aucune mission avec coordonnées GPS</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Informations du dépôt */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Building className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-blue-800">Point de départ</h4>
          </div>
          <p className="text-sm text-blue-700">{depot.name}</p>
          <p className="text-xs text-blue-600">{depot.address}</p>
        </div>

        {/* État de l'optimisation */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <div className="text-center">
            {/* Animation de chargement améliorée */}
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-purple-600 animate-pulse" />
              </div>
            </div>
            
            {/* Titre principal */}
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Optimisation IA en cours
            </h3>
            
            {/* Description détaillée */}
            <p className="text-sm text-gray-600 mb-4">
              L'intelligence artificielle Gemini analyse vos {missionsWithCoords.length} mission{missionsWithCoords.length > 1 ? 's' : ''} 
              pour créer l'itinéraire optimal
            </p>
            
            {/* Étapes de traitement */}
            <div className="space-y-3 text-left max-w-md mx-auto">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
                <span className="text-gray-700">Analyse des coordonnées GPS</span>
              </div>
              
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </div>
                <span className="text-gray-700">Calcul de l'ordre optimal</span>
              </div>
              
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span className="text-gray-500">Estimation des temps de trajet</span>
              </div>
              
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-6 h-6 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <span className="text-gray-500">Calcul des coûts de carburant</span>
              </div>
            </div>
            
            {/* Informations supplémentaires */}
            <div className="mt-6 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Mode de transport: {routeType === 'driving' ? 'Voiture' : 
                  routeType === 'walking' ? 'À pied' : 
                  routeType === 'bicycling' ? 'Vélo' : 'Transport'}</span>
                <span>{missionsWithCoords.length} mission{missionsWithCoords.length > 1 ? 's' : ''}</span>
              </div>
            </div>
            
            {/* Message d'encouragement */}
            <p className="text-xs text-purple-600 mt-4 font-medium">
              ⚡ Génération en temps réel avec l'IA Gemini
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!optimizedRoute) {
    return (
      <div className="text-center py-4">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Erreur lors de l'optimisation</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Informations du dépôt */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Building className="h-4 w-4 text-blue-600" />
          <h4 className="font-medium text-blue-800">Point de départ</h4>
        </div>
        <p className="text-sm text-blue-700">{depot.name}</p>
        <p className="text-xs text-blue-600">{depot.address}</p>
      </div>

      {/* Statistiques de route optimisée */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{optimizedRoute.totalDistance.toFixed(1)} km</div>
          <div className="text-xs text-blue-500">Distance totale</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-lg font-bold text-green-600">
            {optimizedRoute.estimatedTime >= 60 ? `${Math.floor(optimizedRoute.estimatedTime / 60)}h${optimizedRoute.estimatedTime % 60 > 0 ? ` ${optimizedRoute.estimatedTime % 60}min` : ''}` : `${optimizedRoute.estimatedTime} min`}
          </div>
          <div className="text-xs text-green-500">
            {routeType === 'driving' ? 'En voiture' : 
             routeType === 'walking' ? 'À pied' : 
             routeType === 'bicycling' ? 'À vélo' : 'En transport'}
          </div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-lg font-bold text-purple-600">
            {optimizedRoute.fuelCost > 0 ? `${optimizedRoute.fuelCost.toFixed(2)}€` : 'Gratuit'}
          </div>
          <div className="text-xs text-purple-500">
            {routeType === 'driving' ? 'Coût carburant' : 'Pas de frais'}
          </div>
        </div>
      </div>

             {/* Itinéraire détaillé optimisé */}
       <div className="bg-gray-50 rounded-lg p-4">
         <div className="flex items-center space-x-2 mb-3">
           <Sparkles className="h-4 w-4 text-purple-600" />
           <h5 className="font-medium text-gray-800">Itinéraire détaillé par IA</h5>
         </div>
         <div className="space-y-3">
           {optimizedRoute.route.map((segment, index) => (
             <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
               {/* En-tête de l'étape */}
               <div className="flex items-center space-x-3 mb-2">
                 <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                   {index + 1}
                 </span>
                 <div className="flex-1">
                   <div className="flex items-center space-x-2">
                     <span className="font-medium text-gray-800">{segment.from}</span>
                     <Navigation className="h-3 w-3 text-blue-500" />
                     <span className="font-medium text-gray-800">{segment.to}</span>
                   </div>
                 </div>
                 <Badge className={`text-xs ${
                   segment.mode === 'driving' ? 'bg-blue-100 text-blue-700' :
                   segment.mode === 'walking' ? 'bg-green-100 text-green-700' :
                   segment.mode === 'bicycling' ? 'bg-purple-100 text-purple-700' :
                   'bg-orange-100 text-orange-700'
                 }`}>
                   {segment.mode === 'driving' ? 'Voiture' :
                    segment.mode === 'walking' ? 'À pied' :
                    segment.mode === 'bicycling' ? 'Vélo' : 'Transport'}
                 </Badge>
               </div>
               
               {/* Détails de l'étape */}
               <div className="grid grid-cols-3 gap-3 text-xs">
                 <div className="bg-blue-50 p-2 rounded text-center">
                   <div className="font-bold text-blue-600">{segment.distance.toFixed(1)} km</div>
                   <div className="text-blue-500">Distance</div>
                 </div>
                 <div className="bg-green-50 p-2 rounded text-center">
                   <div className="font-bold text-green-600">{segment.time} min</div>
                   <div className="text-green-500">Temps</div>
                 </div>
                 <div className="bg-purple-50 p-2 rounded text-center">
                   <div className="font-bold text-purple-600">
                     {segment.mode === 'driving' ? `${(segment.distance * 0.15).toFixed(2)}€` : 'Gratuit'}
                   </div>
                   <div className="text-purple-500">Coût</div>
                 </div>
               </div>
               
               {/* Informations supplémentaires */}
               <div className="mt-2 pt-2 border-t border-gray-100">
                 <div className="flex items-center justify-between text-xs text-gray-500">
                   <span>Vitesse moyenne: {
                     segment.mode === 'driving' ? '50 km/h' :
                     segment.mode === 'walking' ? '5 km/h' :
                     segment.mode === 'bicycling' ? '15 km/h' : '25 km/h'
                   }</span>
                   <span>Étape {index + 1} sur {optimizedRoute.route.length}</span>
                 </div>
               </div>
             </div>
           ))}
         </div>
         
         {/* Résumé de l'itinéraire */}
         <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
           <div className="flex items-center space-x-2 mb-2">
             <Route className="h-4 w-4 text-blue-600" />
             <h6 className="font-medium text-blue-800">Résumé de l'itinéraire</h6>
           </div>
           <div className="grid grid-cols-2 gap-4 text-xs">
             <div>
               <span className="text-blue-600 font-medium">Départ:</span>
               <span className="text-gray-700 ml-1">{optimizedRoute.route[0]?.from}</span>
             </div>
             <div>
               <span className="text-blue-600 font-medium">Arrivée:</span>
               <span className="text-gray-700 ml-1">{optimizedRoute.route[optimizedRoute.route.length - 1]?.to}</span>
             </div>
             <div>
               <span className="text-blue-600 font-medium">Étapes:</span>
               <span className="text-gray-700 ml-1">{optimizedRoute.route.length}</span>
             </div>
             <div>
               <span className="text-blue-600 font-medium">Mode principal:</span>
               <span className="text-gray-700 ml-1">
                 {routeType === 'driving' ? 'Voiture' :
                  routeType === 'walking' ? 'À pied' :
                  routeType === 'bicycling' ? 'Vélo' : 'Transport'}
               </span>
             </div>
           </div>
         </div>
       </div>

             {/* Ordre optimisé des missions */}
       <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
         <div className="flex items-center space-x-2 mb-3">
           <Sparkles className="h-4 w-4 text-purple-600" />
           <h5 className="font-medium text-purple-800">Séquence optimale des missions</h5>
         </div>
         <div className="space-y-3">
           {optimizedRoute.optimizedOrder.map((missionTitle, index) => {
             const mission = missions.find(m => m.missions.title === missionTitle)
             const hasCoordinates = mission?.missions.latitude !== null && mission?.missions.longitude !== null
             
             return (
               <div key={index} className="bg-white rounded-lg p-3 border border-purple-200">
                 <div className="flex items-center space-x-3">
                   <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                     {index + 1}
                   </span>
                   <div className="flex-1">
                     <div className="flex items-center space-x-2 mb-1">
                       <span className="font-medium text-purple-800">{missionTitle}</span>
                       {hasCoordinates ? (
                         <CheckCircle className="h-3 w-3 text-green-500" />
                       ) : (
                         <AlertTriangle className="h-3 w-3 text-yellow-500" />
                       )}
                     </div>
                     {mission && (
                       <div className="text-xs text-gray-600 space-y-1">
                         <div className="flex items-center space-x-1">
                           <MapPin className="h-3 w-3" />
                           <span>{mission.missions.location}</span>
                         </div>
                         <div className="flex items-center space-x-1">
                           <Clock className="h-3 w-3" />
                           <span>{format(parseISO(mission.missions.date_start), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                         </div>
                         <div className="flex items-center space-x-1">
                           <Euro className="h-3 w-3" />
                           <span>{mission.missions.forfeit}€</span>
                         </div>
                       </div>
                     )}
                   </div>
                   <div className="flex flex-col items-end space-y-1">
                     <Badge className={mission ? getMissionTypeColor(mission.missions.type) : 'bg-gray-100 text-gray-700'}>
                       {mission?.missions.type || 'N/A'}
                     </Badge>
                     {hasCoordinates ? (
                       <span className="text-xs text-green-600">GPS ✓</span>
                     ) : (
                       <span className="text-xs text-yellow-600">GPS ✗</span>
                     )}
                   </div>
                 </div>
                 
                 {/* Informations de distance si disponible */}
                 {index > 0 && hasCoordinates && (
                   <div className="mt-2 pt-2 border-t border-purple-100">
                     <div className="flex items-center justify-between text-xs text-purple-600">
                       <span>Distance depuis la mission précédente</span>
                       <span className="font-medium">
                         {(() => {
                           const prevMission = missions.find(m => m.missions.title === optimizedRoute.optimizedOrder[index - 1])
                           if (prevMission && 
                               prevMission.missions.latitude !== null && 
                               prevMission.missions.longitude !== null && 
                               mission && 
                               mission.missions.latitude !== null && 
                               mission.missions.longitude !== null) {
                             const distance = calculateDistance(
                               prevMission.missions.latitude,
                               prevMission.missions.longitude,
                               mission.missions.latitude,
                               mission.missions.longitude
                             )
                             return `${distance.toFixed(1)} km`
                           }
                           return 'N/A'
                         })()}
                       </span>
                     </div>
                   </div>
                 )}
               </div>
             )
           })}
         </div>
         
         {/* Statistiques de la séquence */}
         <div className="mt-4 p-3 bg-purple-100 rounded-lg">
           <div className="grid grid-cols-3 gap-4 text-center text-xs">
             <div>
               <div className="font-bold text-purple-700">{optimizedRoute.optimizedOrder.length}</div>
               <div className="text-purple-600">Missions</div>
             </div>
             <div>
               <div className="font-bold text-purple-700">
                 {missions.filter(m => m.missions.latitude !== null && m.missions.longitude !== null).length}
               </div>
               <div className="text-purple-600">Avec GPS</div>
             </div>
             <div>
               <div className="font-bold text-purple-700">
                 {missions.filter(m => m.missions.latitude === null || m.missions.longitude === null).length}
               </div>
               <div className="text-purple-600">Sans GPS</div>
             </div>
           </div>
         </div>
       </div>
    </div>
  )
}

// Composant de fallback si la carte ne se charge pas
function MapFallback({ missions, depot }: { missions: AcceptedMission[], depot: typeof DEFAULT_DEPOT }) {
  const missionsWithCoords = missions.filter(m => m.missions.latitude !== null && m.missions.longitude !== null)
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Carte de mes missions</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (missionsWithCoords.length > 0) {
                    const coords = [
                      `${depot.latitude},${depot.longitude}`,
                      ...missionsWithCoords.map(m => `${m.missions.latitude},${m.missions.longitude}`),
                      `${depot.latitude},${depot.longitude}`
                    ].join('|')
                    const url = `https://www.google.com/maps/dir/${coords}`
                    window.open(url, '_blank')
                  }
                }}
                disabled={missionsWithCoords.length === 0}
              >
                <Navigation className="h-4 w-4 mr-1" />
                Ouvrir dans Google Maps
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Carte interactive
            </h3>
            <p className="text-gray-500 mb-4">
              {missions.length} mission{missions.length > 1 ? 's' : ''} à afficher
            </p>
            <p className="text-sm text-gray-400">
              Utilisez le bouton "Ouvrir dans Google Maps" pour voir vos missions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MapComponent({ missions }: MapComponentProps) {
  const [mapView, setMapView] = useState<'missions' | 'route'>('missions')
  const [routeType, setRouteType] = useState<'driving' | 'walking' | 'bicycling' | 'transit'>('driving')
  const [selectedMission, setSelectedMission] = useState<AcceptedMission | null>(null)
  const [showRoute, setShowRoute] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [depot, setDepot] = useState(DEFAULT_DEPOT)
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null)
  const [isGeneratingRoute, setIsGeneratingRoute] = useState(false)

  const missionsWithCoords = useMemo(() => 
    missions.filter(m => m.missions.latitude !== null && m.missions.longitude !== null),
    [missions]
  )

  const missionsWithoutCoords = useMemo(() => 
    missions.filter(m => m.missions.latitude === null || m.missions.longitude === null),
    [missions]
  )

  const handleCreateRoute = async () => {
    if (missionsWithCoords.length > 0) {
      setIsGeneratingRoute(true)
      setShowRoute(true)
      
      try {
        const route = await generateOptimizedRoute(missions, depot, routeType)
        setOptimizedRoute(route)
        console.log('Itinéraire optimisé généré:', route)
      } catch (error) {
        console.error('Erreur lors de la génération de l\'itinéraire:', error)
        // Utiliser le fallback
        const fallbackRoute = generateFallbackRoute(missions, depot, routeType)
        setOptimizedRoute(fallbackRoute)
      } finally {
        setIsGeneratingRoute(false)
      }
    }
  }

  const handleOpenInGoogleMaps = () => {
    if (missionsWithCoords.length > 0) {
      const coords = [
        `${depot.latitude},${depot.longitude}`,
        ...missionsWithCoords.map(m => `${m.missions.latitude},${m.missions.longitude}`),
        `${depot.latitude},${depot.longitude}`
      ].join('|')
      const url = `https://www.google.com/maps/dir/${coords}`
      window.open(url, '_blank')
    }
  }

  // Gestion d'erreur pour la carte
  useEffect(() => {
    const handleMapError = () => setMapError(true)
    window.addEventListener('error', handleMapError)
    return () => window.removeEventListener('error', handleMapError)
  }, [])

  if (mapError) {
    return <MapFallback missions={missions} depot={depot} />
  }

  if (missions.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Carte de mes missions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune mission à afficher sur la carte</p>
              <p className="text-sm text-gray-400 mt-2">Acceptez des missions pour les voir apparaître ici</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Carte interactive de mes missions</span>
            <div className="flex items-center space-x-2">
              <Button
                variant={mapView === 'missions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMapView('missions')}
                className={mapView === 'missions' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Missions
              </Button>
              <Button
                variant={mapView === 'route' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMapView('route')}
                className={mapView === 'route' ? 'bg-green-600 hover:bg-green-700' : 'border-green-200 text-green-600 hover:bg-green-50'}
              >
                <Route className="h-4 w-4 mr-1" />
                Itinéraire IA
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Carte interactive */}
            <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
              <MapContainer
                center={[depot.latitude, depot.longitude]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <MapController missions={missions} depot={depot} />
                
                {/* Marqueur du dépôt */}
                <Marker
                  position={[depot.latitude, depot.longitude]}
                  icon={L.divIcon({
                    className: 'custom-marker',
                    html: `<div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">D</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                  })}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-medium text-sm">{depot.name}</h3>
                      <p className="text-xs text-gray-600">{depot.address}</p>
                      <p className="text-xs text-blue-600 font-medium">Point de départ</p>
                    </div>
                  </Popup>
                </Marker>
                
                {/* Marqueurs des missions */}
                {missionsWithCoords.map((mission, index) => (
                  <Marker
                    key={mission.id}
                    position={[mission.missions.latitude!, mission.missions.longitude!]}
                    icon={L.divIcon({
                      className: 'custom-marker',
                      html: `<div class="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">${index + 1}</div>`,
                      iconSize: [32, 32],
                      iconAnchor: [16, 16]
                    })}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-medium text-sm">{mission.missions.title}</h3>
                        <Badge className={getMissionTypeColor(mission.missions.type)}>
                          {mission.missions.type}
                        </Badge>
                        <p className="text-xs text-gray-600 mt-1">
                          {mission.missions.location}
                        </p>
                        <p className="text-xs text-gray-600">
                          {format(parseISO(mission.missions.date_start), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </p>
                        <p className="text-xs font-medium text-green-600">
                          {mission.missions.forfeit}€
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
                
                {/* Ligne d'itinéraire si activée */}
                {showRoute && missionsWithCoords.length > 0 && (
                  <Polyline
                    positions={[
                      [depot.latitude, depot.longitude] as [number, number],
                      ...missionsWithCoords.map(m => [m.missions.latitude!, m.missions.longitude!] as [number, number]),
                      [depot.latitude, depot.longitude] as [number, number]
                    ]}
                    color="#3B82F6"
                    weight={3}
                    opacity={0.8}
                  />
                )}
              </MapContainer>
            </div>

            {/* Contrôles de la carte */}
            <div className="flex flex-wrap gap-2">
              {mapView === 'route' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRouteType('driving')}
                    className={routeType === 'driving' ? 'bg-blue-600 text-white' : ''}
                  >
                    <Car className="h-4 w-4 mr-1" />
                    Voiture
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRouteType('walking')}
                    className={routeType === 'walking' ? 'bg-green-600 text-white' : ''}
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    À pied
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRouteType('bicycling')}
                    className={routeType === 'bicycling' ? 'bg-purple-600 text-white' : ''}
                  >
                    <Bike className="h-4 w-4 mr-1" />
                    Vélo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRouteType('transit')}
                    className={routeType === 'transit' ? 'bg-orange-600 text-white' : ''}
                  >
                    <Bus className="h-4 w-4 mr-1" />
                    Transport
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateRoute}
                disabled={missionsWithCoords.length === 0 || isGeneratingRoute}
              >
                {isGeneratingRoute ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Optimiser avec IA
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInGoogleMaps}
                disabled={missionsWithCoords.length === 0}
              >
                <Navigation className="h-4 w-4 mr-1" />
                Ouvrir dans Google Maps
              </Button>
            </div>

            {/* Statistiques avec IA */}
            {mapView === 'route' && (
              <RouteStats 
                missions={missions} 
                routeType={routeType} 
                depot={depot}
                optimizedRoute={optimizedRoute}
                isLoading={isGeneratingRoute}
              />
            )}

            {/* Missions sans coordonnées */}
            {missionsWithoutCoords.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <h4 className="font-medium text-yellow-800">Missions sans coordonnées GPS</h4>
                </div>
                <div className="space-y-2">
                  {missionsWithoutCoords.map(mission => (
                    <div key={mission.id} className="flex items-center justify-between text-sm">
                      <span className="text-yellow-700">{mission.missions.title}</span>
                      <span className="text-yellow-600">{mission.missions.location}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des missions avec dépôt */}
            <div className="space-y-4">
              {/* Point de départ */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Point de départ</h4>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">{depot.name}</p>
                    <p className="text-xs text-blue-600">{depot.address}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">Dépôt</Badge>
                </div>
              </div>

              {/* Missions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                {missions.map((mission, index) => {
                  const missionDate = parseISO(mission.missions.date_start)
                  const isUpcoming = isValid(missionDate) && missionDate > new Date()
                  const hasCoordinates = mission.missions.latitude !== null && mission.missions.longitude !== null
                  
                  return (
                    <div key={mission.id} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-bold bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                              {index + 1}
                            </span>
                            <h4 className="font-medium text-gray-900 text-sm">
                              {mission.missions.title}
                            </h4>
                            <Badge className={getMissionTypeColor(mission.missions.type)}>
                              {mission.missions.type}
                            </Badge>
                            {isUpcoming && (
                              <Badge className="bg-green-100 text-green-700">
                                À venir
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{mission.missions.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{format(missionDate, 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Euro className="h-3 w-3" />
                              <span>{mission.missions.forfeit}€</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-1 ml-2">
                          {hasCoordinates ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                      </div>
                      {!hasCoordinates && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                          ⚠️ Coordonnées GPS non disponibles
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MapComponent 
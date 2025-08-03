import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertTriangle, Settings, TestTube, MessageSquare } from 'lucide-react'
import { WhatsAppService } from '@/lib/whatsapp'

interface WhatsAppConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WhatsAppConfigDialog({ open, onOpenChange }: WhatsAppConfigDialogProps) {
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [testPhoneNumber, setTestPhoneNumber] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    // Charger les valeurs depuis les variables d'environnement
    setPhoneNumberId(import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID || '')
    setAccessToken(import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN || '')
    
    // Vérifier si le service est configuré
    setIsConfigured(WhatsAppService.isConfigured())
  }, [])

  const handleSaveConfig = () => {
    // En production, ces valeurs seraient sauvegardées côté serveur
    // Pour le développement, on peut les stocker dans localStorage
    localStorage.setItem('whatsapp_phone_number_id', phoneNumberId)
    localStorage.setItem('whatsapp_access_token', accessToken)
    
    setIsConfigured(!!(phoneNumberId && accessToken))
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const connected = await WhatsAppService.testConnection()
      setIsConnected(connected)
      setTestResult(connected ? 'success' : 'error')
    } catch (error) {
      console.error('Erreur lors du test de connexion:', error)
      setIsConnected(false)
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }

  const sendTestMessage = async () => {
    if (!testPhoneNumber) return
    
    setTesting(true)
    setTestResult(null)
    
    try {
      const notificationData = {
        technicianName: 'Test Technicien',
        missionTitle: 'Mission de test',
        missionType: 'Livraison jeux',
        dateStart: new Date().toISOString(),
        dateEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        location: 'Lieu de test',
        forfeit: 150,
        requiredPeople: 2,
        description: 'Ceci est un message de test pour vérifier la configuration WhatsApp.'
      }

      const success = await WhatsAppService.sendMissionProposal(
        testPhoneNumber,
        notificationData
      )

      setTestResult(success ? 'success' : 'error')
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message de test:', error)
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center space-x-2 text-lg sm:text-xl">
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Configuration WhatsApp</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Statut de configuration */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Statut de la configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center space-x-2">
                {isConfigured ? (
                  <>
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                    <span className="text-green-600 font-medium text-sm sm:text-base">Configuré</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
                    <span className="text-red-600 font-medium text-sm sm:text-base">Non configuré</span>
                  </>
                )}
              </div>
              
              {isConnected && (
                <div className="flex items-center space-x-2 mt-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-green-600">Connexion établie</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Paramètres WhatsApp Business API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 pt-0">
              <div className="space-y-1">
                <Label htmlFor="phone-number-id" className="text-sm sm:text-base font-medium">
                  Phone Number ID
                </Label>
                <Input
                  id="phone-number-id"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="123456789012345"
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  ID du numéro de téléphone WhatsApp Business
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="access-token" className="text-sm sm:text-base font-medium">
                  Access Token
                </Label>
                <Input
                  id="access-token"
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAA..."
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Token d'accès permanent de l'API WhatsApp Business
                </p>
              </div>

              <Button 
                onClick={handleSaveConfig} 
                className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium"
              >
                Sauvegarder la configuration
              </Button>
            </CardContent>
          </Card>

          {/* Test de connexion */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <TestTube className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Test de connexion</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 pt-0">
              <Button 
                onClick={testConnection} 
                disabled={!isConfigured || testing}
                className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium"
              >
                {testing ? 'Test en cours...' : 'Tester la connexion'}
              </Button>

              {testResult && (
                <div className={`flex items-start space-x-2 p-3 rounded-lg ${
                  testResult === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {testResult === 'success' ? (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-xs sm:text-sm ${
                    testResult === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult === 'success' 
                      ? 'Connexion réussie !' 
                      : 'Échec de la connexion. Vérifiez vos paramètres.'
                    }
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test d'envoi de message */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Test d'envoi de message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 pt-0">
              <div className="space-y-1">
                <Label htmlFor="test-phone" className="text-sm sm:text-base font-medium">
                  Numéro de téléphone de test
                </Label>
                <Input
                  id="test-phone"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="06 12 34 56 78"
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Numéro qui recevra le message de test
                </p>
              </div>

              <Button 
                onClick={sendTestMessage} 
                disabled={!isConfigured || !testPhoneNumber || testing}
                className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium"
              >
                {testing ? 'Envoi en cours...' : 'Envoyer un message de test'}
              </Button>

              {testResult && (
                <div className={`flex items-start space-x-2 p-3 rounded-lg ${
                  testResult === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {testResult === 'success' ? (
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={`text-xs sm:text-sm ${
                    testResult === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult === 'success' 
                      ? 'Message envoyé avec succès !' 
                      : 'Échec de l\'envoi du message.'
                    }
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Informations importantes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs sm:text-sm text-gray-600 pt-0">
              <p className="leading-relaxed">• Les messages WhatsApp sont envoyés automatiquement lors de l'assignation de missions</p>
              <p className="leading-relaxed">• Les techniciens reçoivent une confirmation quand ils acceptent une mission</p>
              <p className="leading-relaxed">• Assurez-vous que les numéros de téléphone sont au format français (06...)</p>
              <p className="leading-relaxed">• Les messages sont envoyés via l'API WhatsApp Business</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 
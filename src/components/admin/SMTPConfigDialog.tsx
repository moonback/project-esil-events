import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useEmailNotifications } from '@/lib/useEmailNotifications'
import { Mail, Server, Shield, TestTube } from 'lucide-react'

interface SMTPConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SMTPConfigDialog({ open, onOpenChange }: SMTPConfigDialogProps) {
  const { configureSMTP } = useEmailNotifications()
  const [config, setConfig] = useState({
    host: '',
    port: 587,
    secure: false,
    auth: {
      user: '',
      pass: ''
    },
    disableEdgeFunction: true // Désactiver l'Edge Function par défaut
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      configureSMTP(config)
      onOpenChange(false)
    } catch (error) {
      console.error('Erreur configuration SMTP:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsLoading(true)
    try {
      // Test de connexion SMTP
      console.log('Test de connexion SMTP...')
      // Ici vous pouvez ajouter un test de connexion réel
      setTimeout(() => {
        setIsLoading(false)
      }, 2000)
    } catch (error) {
      console.error('Erreur test connexion:', error)
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuration SMTP
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Serveur SMTP */}
          <div className="space-y-2">
            <Label htmlFor="host" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Serveur SMTP
            </Label>
            <Input
              id="host"
              placeholder="smtp.gmail.com"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
            />
          </div>

          {/* Port */}
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="number"
              placeholder="587"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 587 })}
            />
          </div>

                                {/* Connexion sécurisée */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="secure"
                          checked={config.secure}
                          onCheckedChange={(checked) => setConfig({ ...config, secure: checked as boolean })}
                        />
                        <Label htmlFor="secure" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Connexion sécurisée (TLS/SSL)
                        </Label>
                      </div>

                      {/* Désactiver Edge Function */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="disableEdgeFunction"
                          checked={config.disableEdgeFunction}
                          onCheckedChange={(checked) => setConfig({ ...config, disableEdgeFunction: checked as boolean })}
                        />
                        <Label htmlFor="disableEdgeFunction" className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          Utiliser uniquement SMTP direct (désactiver Edge Function)
                        </Label>
                      </div>

          {/* Nom d'utilisateur */}
          <div className="space-y-2">
            <Label htmlFor="user">Nom d'utilisateur</Label>
            <Input
              id="user"
              placeholder="votre@email.com"
              value={config.auth.user}
              onChange={(e) => setConfig({
                ...config,
                auth: { ...config.auth, user: e.target.value }
              })}
            />
          </div>

          {/* Mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="pass">Mot de passe</Label>
            <div className="relative">
              <Input
                id="pass"
                type={showPassword ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                value={config.auth.pass}
                onChange={(e) => setConfig({
                  ...config,
                  auth: { ...config.auth, pass: e.target.value }
                })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Masquer' : 'Afficher'}
              </Button>
            </div>
          </div>

          {/* Informations */}
          <div className="rounded-lg bg-blue-50 p-4">
            <h4 className="font-medium text-blue-900 mb-2">Configuration recommandée</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Gmail :</strong> smtp.gmail.com:587 (TLS)</li>
              <li>• <strong>Outlook :</strong> smtp-mail.outlook.com:587 (TLS)</li>
              <li>• <strong>Yahoo :</strong> smtp.mail.yahoo.com:587 (TLS)</li>
              <li>• <strong>OVH :</strong> ssl0.ovh.net:465 (SSL)</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={isLoading || !config.host || !config.auth.user || !config.auth.pass}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            Tester la connexion
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !config.host || !config.auth.user || !config.auth.pass}
          >
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 
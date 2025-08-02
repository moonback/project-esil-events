-- Migration pour ajouter les notifications WhatsApp

-- Table pour stocker les notifications WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_phone text NOT NULL,
  message text NOT NULL,
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'delivered')),
  whatsapp_message_id text,
  error_message text,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX idx_whatsapp_notifications_technician ON whatsapp_notifications(technician_id);
CREATE INDEX idx_whatsapp_notifications_mission ON whatsapp_notifications(mission_id);
CREATE INDEX idx_whatsapp_notifications_status ON whatsapp_notifications(status);
CREATE INDEX idx_whatsapp_notifications_sent_at ON whatsapp_notifications(sent_at);

-- Activation RLS
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Policies pour whatsapp_notifications
CREATE POLICY "Admins can read all whatsapp notifications"
  ON whatsapp_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Technicians can read own notifications"
  ON whatsapp_notifications FOR SELECT
  TO authenticated
  USING (technician_id = auth.uid());

-- Fonction pour envoyer automatiquement les notifications lors d'une assignation
CREATE OR REPLACE FUNCTION send_whatsapp_notification_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Cette fonction sera appelée par le trigger
  -- L'envoi réel sera géré côté application pour plus de contrôle
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour détecter les nouvelles assignations
CREATE TRIGGER trigger_whatsapp_notification_on_assignment
  AFTER INSERT ON mission_assignments
  FOR EACH ROW
  WHEN (NEW.status = 'proposé')
  EXECUTE FUNCTION send_whatsapp_notification_on_assignment();

-- Fonction pour mettre à jour le statut de livraison
CREATE OR REPLACE FUNCTION update_whatsapp_notification_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.delivered_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le timestamp de livraison
CREATE TRIGGER trigger_update_whatsapp_delivery
  BEFORE UPDATE ON whatsapp_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_notification_delivery(); 
-- Script complet pour créer le système de notifications
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Créer la table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 3. Activer RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les politiques existantes (pour éviter les erreurs)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;

-- 5. Créer les nouvelles politiques RLS
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;

-- 8. Créer le trigger pour updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- 9. Créer la fonction RPC create_notification (c'est la partie manquante !)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, read)
  VALUES (p_user_id, p_title, p_message, p_type, false)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- 10. Vérification finale
SELECT 
  '✓ Configuration terminée' as status,
  (SELECT COUNT(*) FROM notifications) as notifications_count,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'create_notification') as function_exists; 
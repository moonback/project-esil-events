-- Script de test pour vérifier que les notifications fonctionnent
-- À exécuter dans l'interface Supabase SQL Editor

-- 1. Vérifier que la table existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') 
    THEN '✓ Table notifications existe'
    ELSE '✗ Table notifications n''existe pas'
  END as table_status;

-- 2. Vérifier que la fonction RPC existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_notification') 
    THEN '✓ Fonction create_notification existe'
    ELSE '✗ Fonction create_notification n''existe pas'
  END as function_status;

-- 3. Vérifier les politiques RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications';

-- 4. Tester la création d'une notification (remplacez USER_ID par votre ID utilisateur)
-- SELECT create_notification(
--   'VOTRE_USER_ID_ICI'::UUID,
--   'Test de notification',
--   'Ceci est un test de notification',
--   'info'
-- );

-- 5. Voir les notifications existantes
SELECT 
  id,
  user_id,
  title,
  message,
  type,
  read,
  created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10; 
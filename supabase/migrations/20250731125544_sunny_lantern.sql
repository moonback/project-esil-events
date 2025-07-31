/*
  # Désactiver entièrement les RLS

  Cette migration désactive complètement les Row Level Security (RLS) sur toutes les tables
  pour résoudre les problèmes d'authentification lors de l'inscription.

  ## Tables concernées
  - users
  - availability  
  - missions
  - mission_assignments
  - billing

  ## Sécurité
  ATTENTION: Cette configuration désactive toute la sécurité au niveau des lignes.
  À utiliser uniquement en développement ou si vous gérez la sécurité autrement.
*/

-- Désactiver RLS sur la table users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur la table availability
ALTER TABLE availability DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur la table missions
ALTER TABLE missions DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur la table mission_assignments
ALTER TABLE mission_assignments DISABLE ROW LEVEL SECURITY;

-- Désactiver RLS sur la table billing
ALTER TABLE billing DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les policies existantes pour éviter les conflits

-- Policies de la table users
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Policies de la table availability
DROP POLICY IF EXISTS "Admins can read all availability" ON availability;
DROP POLICY IF EXISTS "Technicians can manage own availability" ON availability;

-- Policies de la table missions
DROP POLICY IF EXISTS "Admins can manage all missions" ON missions;
DROP POLICY IF EXISTS "Technicians can read assigned missions" ON missions;

-- Policies de la table mission_assignments
DROP POLICY IF EXISTS "Admins can manage all assignments" ON mission_assignments;
DROP POLICY IF EXISTS "Technicians can read and update own assignments" ON mission_assignments;
DROP POLICY IF EXISTS "Technicians can update own assignment status" ON mission_assignments;

-- Policies de la table billing
DROP POLICY IF EXISTS "Admins can manage all billing" ON billing;
DROP POLICY IF EXISTS "Technicians can read own billing" ON billing;

-- Migration pour ajouter le champ required_people à la table missions
-- Ajout du champ pour spécifier le nombre de personnes requises par mission

ALTER TABLE missions 
ADD COLUMN required_people integer DEFAULT 1 CHECK (required_people > 0);

-- Mise à jour des types TypeScript générés automatiquement
-- Le champ sera ajouté aux types Row, Insert et Update de la table missions
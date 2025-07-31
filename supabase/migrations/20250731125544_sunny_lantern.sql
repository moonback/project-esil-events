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

-- Migration pour ajouter des champs pertinents aux missions
-- Ajout de champs pour véhicule, équipement, et informations détaillées

-- Ajout des nouveaux champs à la table missions
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS vehicle_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS vehicle_details TEXT,
ADD COLUMN IF NOT EXISTS equipment_required TEXT,
ADD COLUMN IF NOT EXISTS special_requirements TEXT,
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS weather_dependent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS setup_time_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS teardown_time_minutes INTEGER DEFAULT 0;

-- Création d'un type enum pour les niveaux de priorité
CREATE TYPE IF NOT EXISTS priority_level AS ENUM ('low', 'normal', 'high', 'urgent');

-- Mise à jour de la colonne priority_level pour utiliser l'enum
ALTER TABLE missions 
ALTER COLUMN priority_level TYPE priority_level USING priority_level::priority_level;

-- Création d'un type enum pour les types de véhicules
CREATE TYPE IF NOT EXISTS vehicle_type AS ENUM (
  'voiture_particuliere',
  'camionnette',
  'camion',
  'fourgon',
  'remorque',
  'moto',
  'velo',
  'aucun'
);

-- Mise à jour de la colonne vehicle_type pour utiliser l'enum
ALTER TABLE missions 
ALTER COLUMN vehicle_type TYPE vehicle_type USING vehicle_type::vehicle_type;

-- Ajout d'index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_missions_priority ON missions(priority_level);
CREATE INDEX IF NOT EXISTS idx_missions_vehicle ON missions(vehicle_required, vehicle_type);
CREATE INDEX IF NOT EXISTS idx_missions_weather ON missions(weather_dependent);

-- Ajout de contraintes de validation
ALTER TABLE missions 
ADD CONSTRAINT check_setup_time CHECK (setup_time_minutes >= 0),
ADD CONSTRAINT check_teardown_time CHECK (teardown_time_minutes >= 0);

-- Commentaires pour documenter les nouveaux champs
COMMENT ON COLUMN missions.vehicle_required IS 'Indique si un véhicule est requis pour cette mission';
COMMENT ON COLUMN missions.vehicle_type IS 'Type de véhicule requis pour la mission';
COMMENT ON COLUMN missions.vehicle_details IS 'Détails spécifiques sur le véhicule requis';
COMMENT ON COLUMN missions.equipment_required IS 'Équipement nécessaire pour la mission';
COMMENT ON COLUMN missions.special_requirements IS 'Exigences spéciales pour la mission';
COMMENT ON COLUMN missions.contact_person IS 'Personne de contact sur le site';
COMMENT ON COLUMN missions.contact_phone IS 'Téléphone de contact sur le site';
COMMENT ON COLUMN missions.priority_level IS 'Niveau de priorité de la mission';
COMMENT ON COLUMN missions.weather_dependent IS 'Indique si la mission dépend des conditions météo';
COMMENT ON COLUMN missions.setup_time_minutes IS 'Temps de montage en minutes';
COMMENT ON COLUMN missions.teardown_time_minutes IS 'Temps de démontage en minutes';

-- Mise à jour des types TypeScript générés automatiquement
-- Le champ sera ajouté aux types Row, Insert et Update de la table missions
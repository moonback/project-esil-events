/*
  # Schema de base pour plateforme événementielle

  1. Tables principales
    - `users` - Utilisateurs avec rôles admin/technicien
    - `availability` - Disponibilités des techniciens
    - `missions` - Missions événementielles
    - `mission_assignments` - Assignations de missions
    - `billing` - Facturation des missions

  2. Sécurité
    - RLS activé sur toutes les tables
    - Policies pour isolation des données par rôle
    - Authentification Supabase intégrée

  3. Types personnalisés
    - Enums pour rôles, types de missions, statuts
*/

-- Types énumérés
CREATE TYPE user_role AS ENUM ('admin', 'technicien');
CREATE TYPE mission_type AS ENUM ('Livraison jeux', 'Presta sono', 'DJ', 'Manutention', 'Déplacement');
CREATE TYPE assignment_status AS ENUM ('proposé', 'accepté', 'refusé');
CREATE TYPE billing_status AS ENUM ('en_attente', 'validé', 'payé');

-- Table users (étendue de auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'technicien',
  name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table availability
CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Table missions
CREATE TABLE IF NOT EXISTS missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type mission_type NOT NULL,
  title text NOT NULL,
  description text,
  date_start timestamptz NOT NULL,
  date_end timestamptz NOT NULL,
  location text NOT NULL,
  forfeit numeric(10,2) NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_mission_duration CHECK (date_end > date_start)
);

-- Table mission_assignments
CREATE TABLE IF NOT EXISTS mission_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status assignment_status DEFAULT 'proposé',
  assigned_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  
  UNIQUE(mission_id, technician_id)
);

-- Table billing
CREATE TABLE IF NOT EXISTS billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  technician_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  status billing_status DEFAULT 'en_attente',
  payment_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(mission_id, technician_id)
);

-- Activation RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

-- Policies pour users
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policies pour availability
CREATE POLICY "Technicians can manage own availability"
  ON availability FOR ALL
  TO authenticated
  USING (technician_id = auth.uid());

CREATE POLICY "Admins can read all availability"
  ON availability FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies pour missions
CREATE POLICY "Admins can manage all missions"
  ON missions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Technicians can read assigned missions"
  ON missions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mission_assignments 
      WHERE mission_id = missions.id AND technician_id = auth.uid()
    )
  );

-- Policies pour mission_assignments
CREATE POLICY "Admins can manage all assignments"
  ON mission_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Technicians can read and update own assignments"
  ON mission_assignments FOR SELECT
  TO authenticated
  USING (technician_id = auth.uid());

CREATE POLICY "Technicians can update own assignment status"
  ON mission_assignments FOR UPDATE
  TO authenticated
  USING (technician_id = auth.uid());

-- Policies pour billing
CREATE POLICY "Admins can manage all billing"
  ON billing FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Technicians can read own billing"
  ON billing FOR SELECT
  TO authenticated
  USING (technician_id = auth.uid());

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missions_updated_at 
  BEFORE UPDATE ON missions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_updated_at 
  BEFORE UPDATE ON billing 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes pour performance
CREATE INDEX idx_availability_technician_time ON availability(technician_id, start_time, end_time);
CREATE INDEX idx_missions_date ON missions(date_start, date_end);
CREATE INDEX idx_mission_assignments_technician ON mission_assignments(technician_id, status);
CREATE INDEX idx_billing_technician_status ON billing(technician_id, status);
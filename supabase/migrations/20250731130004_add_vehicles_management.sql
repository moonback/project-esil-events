-- Migration pour ajouter la gestion des véhicules de l'entreprise

-- Types énumérés pour les véhicules
CREATE TYPE vehicle_type AS ENUM ('camion', 'fourgon', 'utilitaire', 'voiture');
CREATE TYPE vehicle_status AS ENUM ('disponible', 'en_maintenance', 'hors_service', 'en_mission');

-- Table vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type vehicle_type NOT NULL,
  license_plate text UNIQUE NOT NULL,
  model text NOT NULL,
  year integer,
  capacity integer, -- capacité en personnes
  fuel_type text,
  status vehicle_status DEFAULT 'disponible',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table mission_vehicles (assignation de véhicules aux missions)
CREATE TABLE IF NOT EXISTS mission_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  notes text,
  
  UNIQUE(mission_id, vehicle_id)
);

-- Activation RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_vehicles ENABLE ROW LEVEL SECURITY;

-- Policies pour vehicles
CREATE POLICY "Admins can manage all vehicles"
  ON vehicles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Technicians can read available vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (status = 'disponible');

-- Policies pour mission_vehicles
CREATE POLICY "Admins can manage all mission vehicles"
  ON mission_vehicles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Technicians can read assigned mission vehicles"
  ON mission_vehicles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mission_assignments 
      WHERE mission_id = mission_vehicles.mission_id AND technician_id = auth.uid()
    )
  );

-- Trigger pour updated_at sur vehicles
CREATE TRIGGER update_vehicles_updated_at 
  BEFORE UPDATE ON vehicles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes pour performance
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(type);
CREATE INDEX idx_mission_vehicles_mission ON mission_vehicles(mission_id);
CREATE INDEX idx_mission_vehicles_vehicle ON mission_vehicles(vehicle_id);

-- Insertion de quelques véhicules d'exemple
INSERT INTO vehicles (name, type, license_plate, model, year, capacity, fuel_type, status) VALUES
('Camion Principal', 'camion', 'AB-123-CD', 'Renault Master', 2020, 3, 'Diesel', 'disponible'),
('Fourgon Utilitaire', 'fourgon', 'EF-456-GH', 'Peugeot Boxer', 2019, 2, 'Diesel', 'disponible'),
('Utilitaire Sonorisation', 'utilitaire', 'IJ-789-KL', 'Ford Transit', 2021, 4, 'Diesel', 'disponible'),
('Voiture de Service', 'voiture', 'MN-012-OP', 'Citroën Berlingo', 2022, 5, 'Essence', 'disponible'); 
-- Migration pour la gestion des véhicules de l'entreprise
-- 20250731125644_vehicle_management.sql

-- Types énumérés pour les véhicules
CREATE TYPE vehicle_status AS ENUM ('disponible', 'en_mission', 'maintenance', 'hors_service');
CREATE TYPE vehicle_category AS ENUM ('voiture_particuliere', 'camionnette', 'camion', 'fourgon', 'remorque', 'moto', 'velo');
CREATE TYPE fuel_type AS ENUM ('essence', 'diesel', 'electrique', 'hybride', 'gpl');

-- Table des véhicules de l'entreprise
CREATE TABLE IF NOT EXISTS company_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category vehicle_category NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year integer,
  license_plate text UNIQUE,
  vin text UNIQUE,
  fuel_type fuel_type,
  fuel_capacity numeric(5,2), -- en litres
  max_payload numeric(8,2), -- en kg
  max_volume numeric(8,2), -- en m³
  status vehicle_status DEFAULT 'disponible',
  current_mileage integer DEFAULT 0,
  last_maintenance_date timestamptz,
  next_maintenance_date timestamptz,
  insurance_expiry_date timestamptz,
  registration_expiry_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_year CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM now()) + 1),
  CONSTRAINT valid_mileage CHECK (current_mileage >= 0),
  CONSTRAINT valid_fuel_capacity CHECK (fuel_capacity > 0),
  CONSTRAINT valid_payload CHECK (max_payload > 0),
  CONSTRAINT valid_volume CHECK (max_volume > 0)
);

-- Table des assignations de véhicules aux missions
CREATE TABLE IF NOT EXISTS vehicle_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES company_vehicles(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  returned_at timestamptz,
  notes text,
  
  UNIQUE(vehicle_id, mission_id),
  CONSTRAINT valid_return_date CHECK (returned_at IS NULL OR returned_at >= assigned_at)
);

-- Table des maintenances des véhicules
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES company_vehicles(id) ON DELETE CASCADE,
  maintenance_type text NOT NULL, -- 'preventive', 'corrective', 'inspection'
  description text NOT NULL,
  cost numeric(10,2),
  performed_by text,
  performed_at timestamptz NOT NULL,
  next_maintenance_date timestamptz,
  mileage_at_maintenance integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_cost CHECK (cost >= 0),
  CONSTRAINT valid_mileage CHECK (mileage_at_maintenance >= 0)
);

-- Table des conducteurs autorisés
CREATE TABLE IF NOT EXISTS vehicle_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES company_vehicles(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_type text,
  license_expiry_date timestamptz,
  authorized_at timestamptz DEFAULT now(),
  authorized_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notes text,
  
  UNIQUE(vehicle_id, driver_id)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_company_vehicles_status ON company_vehicles(status);
CREATE INDEX idx_company_vehicles_category ON company_vehicles(category);
CREATE INDEX idx_vehicle_assignments_mission ON vehicle_assignments(mission_id);
CREATE INDEX idx_vehicle_assignments_vehicle ON vehicle_assignments(vehicle_id);
CREATE INDEX idx_vehicle_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX idx_vehicle_drivers_vehicle ON vehicle_drivers(vehicle_id);
CREATE INDEX idx_vehicle_drivers_driver ON vehicle_drivers(driver_id);

-- Activation RLS
ALTER TABLE company_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_drivers ENABLE ROW LEVEL SECURITY;

-- Policies pour company_vehicles
CREATE POLICY "Admins can manage all vehicles"
  ON company_vehicles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Technicians can view available vehicles"
  ON company_vehicles FOR SELECT
  TO authenticated
  USING (status = 'disponible');

-- Policies pour vehicle_assignments
CREATE POLICY "Admins can manage all vehicle assignments"
  ON vehicle_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own vehicle assignments"
  ON vehicle_assignments FOR SELECT
  TO authenticated
  USING (
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM mission_assignments ma
      WHERE ma.mission_id = vehicle_assignments.mission_id
      AND ma.technician_id = auth.uid()
    )
  );

-- Policies pour vehicle_maintenance
CREATE POLICY "Admins can manage all vehicle maintenance"
  ON vehicle_maintenance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policies pour vehicle_drivers
CREATE POLICY "Admins can manage all vehicle drivers"
  ON vehicle_drivers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own driver authorizations"
  ON vehicle_drivers FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

-- Fonction pour mettre à jour le statut du véhicule lors d'une assignation
CREATE OR REPLACE FUNCTION update_vehicle_status_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Mettre le véhicule en mission
    UPDATE company_vehicles 
    SET status = 'en_mission', updated_at = now()
    WHERE id = NEW.vehicle_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.returned_at IS NULL AND NEW.returned_at IS NOT NULL THEN
    -- Remettre le véhicule disponible
    UPDATE company_vehicles 
    SET status = 'disponible', updated_at = now()
    WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour automatiser la mise à jour du statut
CREATE TRIGGER vehicle_assignment_status_trigger
  AFTER INSERT OR UPDATE ON vehicle_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_status_on_assignment();

-- Fonction pour mettre à jour la date de maintenance
CREATE OR REPLACE FUNCTION update_vehicle_maintenance_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Mettre à jour la date de dernière maintenance
    UPDATE company_vehicles 
    SET last_maintenance_date = NEW.performed_at,
        current_mileage = COALESCE(NEW.mileage_at_maintenance, current_mileage),
        updated_at = now()
    WHERE id = NEW.vehicle_id;
    
    -- Mettre à jour la prochaine date de maintenance si spécifiée
    IF NEW.next_maintenance_date IS NOT NULL THEN
      UPDATE company_vehicles 
      SET next_maintenance_date = NEW.next_maintenance_date,
          updated_at = now()
      WHERE id = NEW.vehicle_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour automatiser la mise à jour des dates de maintenance
CREATE TRIGGER vehicle_maintenance_dates_trigger
  AFTER INSERT ON vehicle_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_maintenance_dates(); 
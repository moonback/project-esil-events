-- Table unavailability pour les périodes d'indisponibilité des techniciens
CREATE TABLE IF NOT EXISTS unavailability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_unavailability_time_range CHECK (end_time > start_time)
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_unavailability_technician_id ON unavailability(technician_id);
CREATE INDEX IF NOT EXISTS idx_unavailability_time_range ON unavailability(start_time, end_time);

-- RLS (Row Level Security) pour la table unavailability
ALTER TABLE unavailability ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre aux techniciens de voir/modifier leurs propres indisponibilités
CREATE POLICY "Techniciens peuvent gérer leurs indisponibilités" ON unavailability
  FOR ALL USING (auth.uid() = technician_id);

-- Policy pour permettre aux admins de voir toutes les indisponibilités
CREATE POLICY "Admins peuvent voir toutes les indisponibilités" ON unavailability
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  ); 
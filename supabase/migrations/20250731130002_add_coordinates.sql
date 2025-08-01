-- Ajouter le champ coordinates à la table missions
ALTER TABLE missions ADD COLUMN coordinates DOUBLE PRECISION[];

-- Créer un index pour les requêtes géospatiales
CREATE INDEX idx_missions_coordinates ON missions USING GIN (coordinates);

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN missions.coordinates IS 'Coordonnées GPS [longitude, latitude] de la mission'; 
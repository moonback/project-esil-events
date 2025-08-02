-- Ajouter les colonnes latitude et longitude à la table missions
ALTER TABLE missions 
ADD COLUMN latitude DECIMAL(10, 8) NULL,
ADD COLUMN longitude DECIMAL(11, 8) NULL;

-- Ajouter des index pour améliorer les performances des requêtes géospatiales
CREATE INDEX idx_missions_coordinates ON missions(latitude, longitude);

-- Ajouter une contrainte pour s'assurer que les coordonnées sont valides
ALTER TABLE missions 
ADD CONSTRAINT check_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
ADD CONSTRAINT check_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- Commentaire pour documenter les nouvelles colonnes
COMMENT ON COLUMN missions.latitude IS 'Latitude de la mission (en degrés décimaux)';
COMMENT ON COLUMN missions.longitude IS 'Longitude de la mission (en degrés décimaux)';

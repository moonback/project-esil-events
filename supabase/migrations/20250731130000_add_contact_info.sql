-- Migration pour ajouter des informations de contact supplémentaires aux techniciens
-- Ajout de champs pour email, adresse, et informations de contact d'urgence

-- Ajout des colonnes de contact à la table users
ALTER TABLE users 
ADD COLUMN email text,
ADD COLUMN address text,
ADD COLUMN notes text;

-- Index pour améliorer les performances de recherche
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Mise à jour des types TypeScript
COMMENT ON COLUMN users.email IS 'Email de contact du technicien';
COMMENT ON COLUMN users.address IS 'Adresse complète du technicien';
COMMENT ON COLUMN users.notes IS 'Notes additionnelles sur le technicien'; 
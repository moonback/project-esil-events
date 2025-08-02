-- Migration pour ajouter le champ cancelled_by_admin
-- Ce champ permet de distinguer les annulations manuelles par l'admin des refus des techniciens

-- Ajouter le champ cancelled_by_admin à la table mission_assignments
ALTER TABLE mission_assignments 
ADD COLUMN cancelled_by_admin boolean DEFAULT false;

-- Ajouter un commentaire pour expliquer le champ
COMMENT ON COLUMN mission_assignments.cancelled_by_admin IS 'Indique si l''assignation a été annulée manuellement par un admin (true) ou refusée par le technicien (false/null)'; 
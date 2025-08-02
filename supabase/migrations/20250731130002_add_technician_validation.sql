-- Migration pour ajouter la validation des techniciens et l'annulation automatique des demandes

-- Ajout du champ is_validated à la table users
ALTER TABLE users 
ADD COLUMN is_validated boolean DEFAULT false;

-- Index pour améliorer les performances des requêtes de validation
CREATE INDEX idx_users_is_validated ON users(is_validated);
CREATE INDEX idx_users_role_validated ON users(role, is_validated);

-- Fonction pour annuler automatiquement les demandes en attente
-- quand le nombre de techniciens validés est suffisant
CREATE OR REPLACE FUNCTION cancel_pending_assignments()
RETURNS TRIGGER AS $$
DECLARE
  mission_record missions%ROWTYPE;
  required_people_count integer;
  validated_technicians_count integer;
  pending_assignments_count integer;
BEGIN
  -- Récupérer les informations de la mission
  SELECT * INTO mission_record 
  FROM missions 
  WHERE id = NEW.mission_id;
  
  -- Récupérer le nombre de personnes requises pour cette mission
  required_people_count := mission_record.required_people;
  
  -- Compter le nombre de techniciens validés assignés à cette mission
  SELECT COUNT(*) INTO validated_technicians_count
  FROM mission_assignments ma
  JOIN users u ON ma.technician_id = u.id
  WHERE ma.mission_id = NEW.mission_id 
    AND ma.status = 'accepté'
    AND u.is_validated = true;
  
  -- Si on a assez de techniciens validés, annuler les demandes en attente
  IF validated_technicians_count >= required_people_count THEN
    -- Mettre à jour toutes les assignations en attente pour cette mission
    UPDATE mission_assignments 
    SET status = 'refusé', 
        responded_at = now()
    WHERE mission_id = NEW.mission_id 
      AND status = 'proposé';
      
    RAISE NOTICE 'Annulation automatique des demandes en attente pour la mission %: % techniciens validés sur % requis', 
      NEW.mission_id, validated_technicians_count, required_people_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour exécuter la fonction d'annulation automatique
-- quand une assignation passe au statut 'accepté'
CREATE TRIGGER trigger_cancel_pending_assignments
  AFTER UPDATE OF status ON mission_assignments
  FOR EACH ROW
  WHEN (NEW.status = 'accepté' AND OLD.status != 'accepté')
  EXECUTE FUNCTION cancel_pending_assignments();

-- Fonction pour vérifier et annuler les demandes existantes
-- quand un technicien est validé
CREATE OR REPLACE FUNCTION check_and_cancel_pending_on_validation()
RETURNS TRIGGER AS $$
DECLARE
  mission_record missions%ROWTYPE;
  required_people_count integer;
  validated_technicians_count integer;
BEGIN
  -- Si le technicien vient d'être validé
  IF NEW.is_validated = true AND OLD.is_validated = false THEN
    -- Pour chaque mission où ce technicien a une assignation acceptée
    FOR mission_record IN 
      SELECT DISTINCT m.*
      FROM missions m
      JOIN mission_assignments ma ON m.id = ma.mission_id
      WHERE ma.technician_id = NEW.id 
        AND ma.status = 'accepté'
    LOOP
      -- Compter les techniciens validés pour cette mission
      SELECT COUNT(*) INTO validated_technicians_count
      FROM mission_assignments ma
      JOIN users u ON ma.technician_id = u.id
      WHERE ma.mission_id = mission_record.id 
        AND ma.status = 'accepté'
        AND u.is_validated = true;
      
      -- Si on a assez de techniciens validés, annuler les demandes en attente
      IF validated_technicians_count >= mission_record.required_people THEN
        UPDATE mission_assignments 
        SET status = 'refusé', 
            responded_at = now()
        WHERE mission_id = mission_record.id 
          AND status = 'proposé';
          
        RAISE NOTICE 'Annulation automatique des demandes en attente pour la mission % après validation du technicien %', 
          mission_record.id, NEW.id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier les demandes quand un technicien est validé
CREATE TRIGGER trigger_check_pending_on_validation
  AFTER UPDATE OF is_validated ON users
  FOR EACH ROW
  WHEN (NEW.is_validated = true AND OLD.is_validated = false)
  EXECUTE FUNCTION check_and_cancel_pending_on_validation();

-- Mise à jour des types TypeScript
COMMENT ON COLUMN users.is_validated IS 'Indique si le technicien est validé par l''administrateur'; 
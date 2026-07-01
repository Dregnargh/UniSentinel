-- audit_log is append-only: block UPDATE and DELETE below the app layer.
--
-- Deliberate escape hatch: rare, legitimate maintenance (tenant offboarding
-- where the workspace cascade must delete its audit rows, or a DBA-approved
-- retention purge) runs inside a transaction that first executes
--   SET LOCAL unisentinel.allow_audit_maintenance = 'on';
-- Everything else — application bugs, compromised app code doing bulk
-- tampering, ad-hoc DML — is rejected.
CREATE OR REPLACE FUNCTION audit_log_block_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('unisentinel.allow_audit_maintenance', true) = 'on' THEN
    RETURN NULL;
  END IF;
  RAISE EXCEPTION 'audit_log is append-only (% blocked)', TG_OP;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER audit_log_immutable
BEFORE UPDATE OR DELETE ON "audit_log"
FOR EACH STATEMENT EXECUTE FUNCTION audit_log_block_mutation();

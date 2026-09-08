-- Additive migration: existing leads retain NULL gender.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS gender text;
COMMIT;
NOTIFY pgrst, 'reload schema';

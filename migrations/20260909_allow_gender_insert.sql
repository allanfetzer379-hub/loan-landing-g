-- Match existing public form column-level INSERT grants; do not grant SELECT.
GRANT INSERT (gender) ON public.leads TO anon;
NOTIFY pgrst, 'reload schema';

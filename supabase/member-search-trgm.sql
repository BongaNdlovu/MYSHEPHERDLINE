-- Optional member name search index for large directories (staging/production).
-- Run after organization-capacity-migration.sql.
-- Safe to re-run.

create extension if not exists pg_trgm with schema extensions;

create index if not exists members_full_name_trgm_idx
  on public.members using gin (full_name extensions.gin_trgm_ops);

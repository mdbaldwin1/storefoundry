# Supabase Setup

## Local prerequisites

- Install Supabase CLI
- Authenticate with Supabase account

## Typical local flow

1. `supabase init` (if not already initialized)
2. `supabase start`
3. `supabase db reset`
4. `supabase db push`

## Notes

- Migrations live in `supabase/migrations/`.
- Seed scripts live in `supabase/seed/`.
- RLS policies enforce tenant ownership by `auth.uid()`.

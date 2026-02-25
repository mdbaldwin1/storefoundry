# Environment Variable Matrix

## Required for local development

- `NEXT_PUBLIC_APP_URL` (example: `http://localhost:3000`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_STUB_MODE` (`true` while local testing)
- `NEXT_PUBLIC_ENABLE_MANUAL_DOMAIN_VERIFY` (`true` only for local/dev DNS simulation)

## Required for Stripe live mode (hold until cutover)

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_GROWTH_PRICE_ID`
- `STRIPE_SCALE_PRICE_ID`

## Required for CI / production deploy

- `VERCEL_TOKEN`
- Vercel project/team scope values used by workflow

## Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- For production, set `STRIPE_STUB_MODE=false` only during final go-live cutover.
- Keep `NEXT_PUBLIC_ENABLE_MANUAL_DOMAIN_VERIFY=false` in production.
- Validate envs with smoke tests after each deployment.

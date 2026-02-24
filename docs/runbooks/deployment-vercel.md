# Vercel Deployment Runbook

## Required accounts

- Vercel project (production + preview)
- Supabase project
- Stripe account (Billing + Connect enabled)

## Environment variables (Vercel)

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_GROWTH_PRICE_ID`
- `STRIPE_SCALE_PRICE_ID`

## GitHub Actions secrets (for automated deploy workflow)

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Deploy behavior:
- Push to `develop` triggers preview deployment.
- Push to `main` triggers production deployment.

## DNS and domains

- Platform root domain: `storefoundry.app`
- Support custom domains via Vercel domain attachment.
- Each custom domain must be verified before marking as primary in `store_domains`.

## Webhook routing

- Stripe endpoint: `/api/stripe/webhooks`
- Configure one webhook endpoint per environment.

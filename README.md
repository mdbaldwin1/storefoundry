# Storefoundry

Storefoundry is a multi-tenant commerce platform for independent makers and small shops.

## Stack

- Frontend: Next.js + TypeScript
- Styling: Tailwind CSS with theme token variables
- Backend: Supabase (Postgres, Auth, Storage)
- Payments: Stripe (Billing + Connect)
- Deployment: Vercel

## Monetization model

- Free tier with platform fee per transaction
- Paid tiers with reduced or zero platform fee
- Stripe processing fees are always merchant-visible and separate

## Workspace layout

- `apps/web`: web app (merchant dashboard + storefront routes)
- `packages/config`: shared configuration package
- `supabase/`: migrations, seeds, and DB docs

## Quick start

1. `cp .env.example .env.local`
2. Fill in Supabase + Stripe environment values.
3. `npm install`
4. `npm run dev`

## Quality checks

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

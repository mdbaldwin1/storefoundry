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
2. Fill in Supabase environment values.
3. Set `STRIPE_STUB_MODE=true` for local-first development.
4. `npm install`
5. `npm run dev`

## Local MVP flow

1. Create an account at `/signup`.
2. Complete onboarding at `/onboarding`.
3. Manage catalog + plans at `/dashboard`.
4. Manage orders at `/dashboard/orders`.
5. Configure profile/branding/domains at `/dashboard/settings`.
6. Test storefront and checkout at `/s/<store-slug>`.

## Quality checks

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

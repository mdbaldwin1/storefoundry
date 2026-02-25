# Release Readiness Checklist

This checklist is for the final release cut from `develop` to `main`.

## Product readiness

- [ ] Merchant flow tested end-to-end: signup -> onboarding -> dashboard setup -> storefront checkout.
- [ ] Subscription plans and platform fee mapping verified against `apps/web/config/pricing.ts`.
- [ ] Inventory movement ledger updates correctly for each completed order.
- [ ] Custom domain add/remove and primary-domain workflow validated.
- [ ] Store policies and announcement copy render correctly on storefront.

## Platform readiness

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Latest Supabase migrations applied in target environment.

## Stripe go-live (final step)

- [ ] Set `STRIPE_STUB_MODE=false`.
- [ ] Set live Stripe env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs).
- [ ] Verify webhook endpoint secret and event handling in production.
- [ ] Run one real test transaction and confirm order + subscription records.

## Operational readiness

- [ ] Branch protections intact for `main` and `develop`.
- [ ] Required CI checks are green on release PR.
- [ ] Rollback plan defined (previous deploy + DB migration rollback strategy).

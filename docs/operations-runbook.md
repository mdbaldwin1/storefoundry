# Operations Runbook

## Standard release flow

1. Merge approved feature PRs into `develop`.
2. Run local validation:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
   - `npm run build`
   - `npm run e2e --workspace=@storefoundry/web`
3. Push latest migrations to target database:
   - `supabase db push --linked`
4. Verify migration alignment:
   - `supabase migration list --linked`
5. Open release PR `develop -> main` and confirm required checks pass.
6. After merge, monitor production health metrics and auth/order activity.

## Smoke test checklist

1. Login with merchant account.
2. Load dashboard overview, orders, insights, settings.
3. Create product and activate listing.
4. Apply promo code and run storefront checkout.
5. Confirm order appears in dashboard and fulfillment update works.
6. Export CSV and confirm downloadable output.

## Rollback model

- Application rollback: redeploy previous known-good commit.
- Data rollback: apply targeted SQL rollback script for problematic migration.
- Emergency kill switches:
  - Set all promotions `is_active=false`.
  - Set store `status='suspended'` if storefront must be paused.

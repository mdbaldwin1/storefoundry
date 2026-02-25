# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

- Initial Storefoundry platform foundation with monorepo tooling, web app scaffold, Supabase schema, and Stripe integration skeleton.
- Added Tailwind-based UI foundation with componentized page sections and theme token variables.
- Added configurable pricing module for fee/tier behavior and wired Stripe handlers to plan config.
- Added automated Vercel deployment workflow for `main` (production only).
- Expanded AGENTS policy with explicit UI/componentization/configurability and CI/CD standards.
- Added Supabase project initialization/linking support with generated config and remote migration push workflow.
- Added merchant auth and onboarding flow (`signup`, `login`, auth callback, and store bootstrap with server-authenticated owner assignment).
- Hardened Vercel production deploy workflow with explicit team scope and project-access preflight checks.
- Updated Vercel production deploy workflow to link the project at runtime, removing dependency on static org/project IDs.
- Added root `vercel.json` with Next.js framework override to align Vercel build output expectations.
- Updated Vercel deploy workflow to run from `apps/web` (`--cwd`) to support monorepo Next.js output paths.
- Added `apps/web/vercel.json` so Vercel CLI treats the web workspace as Next.js during CI deploys.
- Set `turbopack.root` in web Next.js config for stable monorepo resolution in CI builds.
- Made `turbopack.root` environment-aware (Vercel workspace root vs local monorepo root).
- Updated deploy workflow to run `vercel build` with `VERCEL=1` so Next.js selects the Vercel-specific monorepo root path.
- Switched production Next.js builds to webpack (`next build --webpack`) to avoid Turbopack monorepo resolver failures in CI.
- Updated Vercel prebuilt pipeline to build with `--prod` so deploy target matches production environment.
- Simplified production deploy to direct `vercel deploy --prod` (no `--prebuilt`) to avoid prebuilt runtime path issues.
- Fixed Vercel production build resolution by adding app-scoped `apps/web/tsconfig.base.json` and wiring `apps/web/tsconfig.json` to extend it.
- Updated production deploy workflow to wait for final Vercel deploy result (removed `--no-wait`) while retaining workflow timeout guardrails.
- Replaced dashboard placeholder with authenticated tenant dashboard for product catalog and inventory management.
- Hardened `/api/products` to derive store ownership from authenticated session, removing client-controlled `storeId` and adding update support.
- Hardened Stripe checkout creation to use authenticated owner/store resolution and Stripe customer reuse instead of client-provided customer/store identifiers.
- Expanded Stripe webhook handling for checkout completion plus subscription create/update/delete lifecycle synchronization.
- Added pricing utility for Stripe price ID to plan mapping, with tests, to keep plan/fee behavior configurable and deterministic.
- Updated Vercel `ignoreCommand` to skip all Git-triggered builds so deployments are controlled solely by the `main` GitHub Actions release workflow.
- Fixed Supabase server client cookie write handling in Server Components to prevent dashboard runtime exceptions during auth session refresh.
- Fixed production dashboard/runtime crashes caused by strict global app URL env parsing; app URL is now resolved lazily with Vercel fallback when billing routes need it.

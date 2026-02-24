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

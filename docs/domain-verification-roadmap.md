# Domain Verification Roadmap

## Current state (local/testing)

- Merchants can add domains and manually mark them as verified from dashboard settings.
- This is intentional for local development velocity and does not prove DNS ownership.

## Production target

Implement automated domain ownership verification before enabling custom-domain traffic.

## Recommended approach

1. On domain add, generate a unique TXT token per domain.
2. Show DNS instructions to merchant:
   - TXT record name: `_storefoundry-verify.<domain>`
   - TXT record value: generated token
3. Verification worker checks DNS periodically (or on manual “Verify now”).
4. If token matches:
   - set `verification_status='verified'`
   - set `verified_at=now()`
5. Optionally verify CNAME/ALIAS target correctness for routing.

## Security requirements

- Never mark verified based solely on merchant form input.
- Require DNS proof before enabling domain routing.
- Re-check domain ownership periodically for long-lived trust.

## Operational notes

- Keep current manual verify button behind a feature flag for non-production only.
- Add clear UI status states: `pending`, `verified`, `failed` with reason.
- Add audit event on every verification state transition.

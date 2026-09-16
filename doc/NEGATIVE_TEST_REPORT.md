# Negative-Test Report — product_selling_app_client_user (buyer storefront)

**Date:** 2026-09-16
**Branch:** `agentic-chat`
**Method:** As a Vite/React SPA with no automated test suite, "negative testing" here means static robustness verification — type-checking, linting, and an audit of the client's error/edge-case handling against the backend it calls. The backend it targets was independently exercised with 79 live negative HTTP tests (see `product_selling_app_server/doc/NEGATIVE_TEST_REPORT.md`).

## Summary

| Check | Result |
|-------|--------|
| `tsc -b` (type-check) | ✅ clean (exit 0) |
| `oxlint` | ✅ 0 errors, 2 warnings (fast-refresh only) |
| Build config sanity | ✅ |
| Error-handling audit | ✅ no gaps found |

### Lint warnings (cosmetic, not failures)
- `src/theme/ThemeProvider.tsx:43` and `src/components/ui/Toast.tsx:35` — `react(only-export-components)`: a file exports both a component and a helper/constant, which disables Fast Refresh for that file in dev. No runtime or correctness impact.

## Client-side negative-path handling verified (by code audit)

### Network / API resilience (`src/api/userApi.ts`, `agentApi.ts`)
- **Request timeout** set to 45s (store API) / 90s (agent) so a dropped connection can't hang a page's loading spinner forever.
- **`localStorage` access is wrapped in try/catch** on every read (privacy mode / blocked storage): requests still go out unauthenticated rather than throwing before send.
- **Global 401 interceptor** clears the stored token and redirects to `/login` — but only when a token was actually present and the user isn't already on `/login` / `/signup`, so it can't loop or clobber an invalid-OTP error on the auth screens.
- **Agent error mapping** (`agentErrorMessage`) distinguishes "can't reach the assistant" (no `err.response`) from a server-provided message.

### Routing / navigation
- Catch-all `*` route renders `NotFoundPage` instead of a blank white screen for any unmatched path.
- `RootRedirect` handles the first-visit (welcome) vs returning (products) vs logged-in cases from `localStorage` safely.
- `ErrorBoundary` wraps the whole route tree.

### Data/UI edge cases
- Missing-endpoint features (order cancellation/refunds, etc.) are rendered as honest `EmptyState`s rather than dead controls (per `KARTLY_MIGRATION_NOTES.md`).

## API-contract cross-check
Verified the client calls paths that exist on the backend's `mcp` branch route files:
- `userApi` base `…/api/v1/user`; order flow uses the **plural** `/orders/checkout|create-order|verify-payment` and `GET /orders`, `GET /orders/:id` — matches `order.routes.ts`.
- Wishlist, cart, profile, products paths all match their route files.
- `agentApi` base `…/api/v1/chat` — matches the agent's `buyerChatRoutes`.

## Not covered (needs a manual device/browser pass)
- Live responsive/accessibility verification (no browser automation was run here; the matrix in `KARTLY_UI_PLAN.md` records what's audited-by-code vs. still needing a manual pass).
- Real end-to-end checkout against Razorpay (test keys) and the live agent chat (Gemini quota).

## How to reproduce
```bash
# from product_selling_app_client_user/
npm run build     # tsc -b + vite build
npm run lint      # oxlint
```

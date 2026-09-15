# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (default port 5204, or VITE_PORT)
npm run build      # Type-check with tsc -b, then Vite production build → dist/
npm run lint       # Run oxlint across all files
npm run preview    # Serve the built dist/ locally
```

There is no test suite configured in this project.

## Environment Variables

Create a `.env` file at the project root (see `.env.example`):

```
VITE_SERVER_URL=https://product-selling-app-server.onrender.com   # Backend base URL
VITE_PORT=5204                                                      # Dev server port (optional)
VITE_ENABLE_ASSISTANT=false                                         # Feature flag, see below
```

## Architecture

This is a **React 19 + TypeScript + Vite SPA** serving as the buyer-facing storefront for a product-selling platform, implementing the **Kartly** design system (see `doc/KARTLY_UI_PLAN.md` and `doc/KARTLY_MIGRATION_NOTES.md`). It has no global state management — all state is local `useState` per page.

### Key layers

**`src/api/userApi.ts`** — Axios instance:
- Base URL: `{VITE_SERVER_URL}/api/v1/user`
- Attaches `Authorization: Bearer {userToken}` from localStorage on every request via a request interceptor.

**`src/pages/`** — One component per route. Each page manages its own loading/error/data state with `useEffect` + `userApi` calls. Auth guard pattern: protected pages check `localStorage.getItem('userToken')` and redirect to `/login` if absent.

**`src/components/layout/`** — App shell: `AppLayout` (the routed shell — `TopNav` + page content + `Footer` + `BottomTabBar`, mounted once via nested routing so it doesn't remount on navigation), `TopNav` (desktop header, category links + search collapse below `lg`), `BottomTabBar` (mobile-only tab bar, `lg:hidden`), `BrandMark`, `Container` (the one page-width wrapper, `max-w-[1280px]`), `AuthLayout` (shared shell for `/login` and `/signup`, outside `AppLayout`).

**`src/components/ui/`** — The primitive library everything else is built from: `Button`, `Input`, `Select`, `Textarea`, `Chip`, `Badge`, `Card`, `Panel`, `PromoCard`, `QtyStepper`, `ProgressBar`, `Skeleton`, `EmptyState`, `ImageFrame` (image slot with a hatched placeholder fallback, falls back on a failed load too, not just an absent `src`), `Switch`, `Sheet` (bottom sheet on mobile, right drawer on desktop — same component; the near-duplicate `Modal` component was removed as dead code — `Sheet` is this app's one dialog primitive), `Toast` (`showKartlyToast` helper wired through `react-toastify`).

**`src/components/motion/`** — `Reveal` (staggered entrance), `Shimmer`/`Skeleton`'s loading sweep, `Confetti` (payment-success screen).

**`src/components/auth/OtpInput.tsx`**, **`src/components/assistant/`** — page-specific composites for auth and the (flagged) assistant demo.

**`src/theme/ThemeProvider.tsx`** — light/dark mode via a `data-theme` attribute on `<html>`, persisted to `localStorage` (`kartlyTheme`). `useTheme()` exposes `{ theme, setTheme, toggleTheme }`. Toggled live from `ProfilePage`'s dark-mode `Switch`.

**`src/hooks/`** — `useCartCount` (shared between `TopNav`/`BottomTabBar` so they don't each fetch independently; call the co-exported `notifyCartChanged()` after any cart mutation so the badge re-fetches — `AppLayout` mounts once for the whole session, so without this the badge would fetch its count exactly once, ever), `useCountdown` (OTP resend), `usePrefersReducedMotion`, `useDocumentTitle` (sets a real per-page `document.title`, called from every page).

### Routing (App.tsx)

Nested routing: `/welcome`, `/login`, `/signup` render outside the shell; everything else renders inside `<AppLayout>`.

```
/                         → redirect to /welcome (first visit, no token) or /products
/welcome                  → one-time onboarding screen (sets kartlySeenWelcome in localStorage)
/login                    → two-step OTP login (email or phone → OTP verify)
/signup                   → buyer registration (details → OTP verify)
/products                 → product grid with search, category filter, pagination
/products/:productId      → product detail with image gallery, variant selector, add to cart
/cart                     → cart items, remove, order summary
/checkout                 → address selection/entry, order breakdown, Razorpay payment
/orders                   → paginated order history (GET /orders; ?page= in the URL)
/orders/success            → post-payment success screen (needs an orderId in navigation state)
/orders/:orderId          → order detail: items, status timeline, tracking link, address, totals
/wishlist                 → saved products, backed by the real /wishlist API (add, remove, list all wired)
/profile                  → personal info, default address management, Orders/Wishlist menu rows, dark-mode toggle
/assistant                → AI shopping assistant, demo UI behind VITE_ENABLE_ASSISTANT
*                         → NotFoundPage (catch-all; there was none for a long stretch of this
                            app's history, so any unmatched URL just rendered a blank screen)
```

**Note:** `/orders` and `/orders/:orderId` use `GET /orders` and `GET /orders/:orderId`. The list shows only `PAID`/`REFUNDED` orders (the endpoint's default — `create-order` writes a `PENDING` order before payment, so abandoned checkouts would otherwise clutter it). Every item is its own sub-order: the detail page shows one card per item with its `subOrderId`, status badge, 4-step timeline and "Track package" link, all set per item by that product's seller from the admin app. The order-level badge uses the least advanced item stage and adds "items vary" when items differ. Cart, checkout and order detail show a separate "Cashback" line when a `CASHBACK` offer applies; the backend has already taken it off the total. Shared order types and status labels live in `src/components/order/orderMeta.ts`.

### Authentication flow

Login is two-step and accepts **either** an email or a phone number (a single "identifier" field, no password): POST `/auth/login` with `{ email }` or `{ phone }` → backend sends OTP → POST `/auth/verify-login` with the same identifier + otp → receives JWT → stored in `localStorage` as `userToken`.

Register is two-step and requires a password: POST `/auth/register` → POST `/auth/verify-registration` → receives JWT → stored as `userToken`.

The backend returns the OTP in the response body ("for testing/demo purposes" — there is no real email/SMS delivery). Both auth pages surface it in a clearly-labelled `Badge tone="warn"` dev-notice card, not as ordinary UI copy.

### Payment flow

Checkout page POSTs to `/orders/checkout` to calculate summary → user clicks "Place Order & Pay" → POSTs to `/orders/create-order` → loads Razorpay JS SDK dynamically → opens Razorpay modal (themed to the Kartly accent, `#A87BF5`) → on success POSTs to `/orders/verify-payment` (a blocking overlay covers the page while this is in flight) → navigates to `/orders/success` with `{ orderId }` in navigation state. (These three paths are plural — `/orders/*` — matching how `userRoute.ts` mounts `order.routes.ts`; this file itself had the singular form until it was caught and fixed, see `doc/KARTLY_MIGRATION_NOTES.md`.)

### The AI assistant (flagged, no frontend wiring yet)

`product_selling_app_agent/` is **not** docs-only — its own `doc/AGENT_DEV_PLAN.md` (phased plan) and `doc/TEST_REPORTS.md` (tested results per phase) plus its commit history confirm Phases 0–3 are implemented: a real Gemini agentic loop, JWT auth shared with `product_selling_app_server`, a `POST /api/v1/chat/message` + `GET /api/v1/chat/conversations` API with Mongo-backed multi-turn conversation storage, and two read-only tools (`search_products`, `get_product_details`) wired to the real backend rather than dummy data. What's genuinely still missing is Phase 4 (cart-writing tools) and — the reason this still matters for this app specifically — **Phase 5, which is where the actual frontend chat widget gets built here**. No client-side code calls this service yet. `AssistantPage.tsx` and its entry points (the `TopNav` "Ask AI" pill, the `BottomTabBar` AI tab, the `ProductListPage` teaser row) are all gated behind `VITE_ENABLE_ASSISTANT` (default `false`). With the flag on, the page renders static demo content with every non-functional control explicitly `disabled`; with it off, reaching `/assistant` directly shows an `EmptyState`. This is still the honest state of things — the demo content isn't standing in for something that could be wired up trivially, Phase 5 is real, unstarted frontend work.

### Styling

Tailwind CSS v4 (via `@tailwindcss/vite` plugin — **not** `tailwind.config.js`, which Tailwind v4 does not read; there is no `@config` directive in `src/index.css`, and the file was deleted). All design tokens live in `src/index.css`:

- **Raw custom properties** (`--k-*`) on `:root` and `[data-theme="dark"]` — these actually flip when the theme toggles. Includes a fixed (theme-independent) status palette (`--k-ok-*`, `--k-warn-*`, `--k-bad-*`, `--k-plum-fg`, `--k-danger`) and `--k-on-soft` / `--k-on-soft-muted` for text sitting on the `--k-soft` wash.
- **Tailwind `@theme` mappings** (`--color-*`, `--radius-*`, `--font-*`, `--animate-*`) pointing at those properties — these generate the utilities used everywhere (`bg-card`, `text-ink`, `border-line`, `bg-accent`, `rounded-card`, `animate-up`, etc).
- Ten ported prototype keyframes (`kfPop`, `kfDraw`, `kfRing`, `kfUp`, `kfFloat`, `kfRoll`, `kfDot`, `kfShim`, `kfConf`, `kfBar`) plus hover-lift/transition utility classes (`.lift`, `.lift-card`, `.slide-x`, `.t-base`, etc), all disabled under `prefers-reduced-motion: reduce`.

Dark mode is a real, working feature — `data-theme="dark"|"light"` on `<html>`, with a no-flash inline script in `index.html` reading `localStorage.kartlyTheme` before React mounts.

Toast notifications use `react-toastify`, restyled to the Kartly card/border/shadow tokens in `App.tsx`; `showKartlyToast()` (`src/components/ui/Toast.tsx`) renders the dark inline toast variant for key moments (e.g. add-to-cart). Icons from `react-icons` (Feather set, `fi` prefix).

### TypeScript

Strict mode (`strict: true` in `tsconfig.app.json`) is genuinely on — it wasn't for a long stretch of this app's history despite this file previously claiming otherwise; `noUnusedLocals`/`noUnusedParameters` (also on) are a separate "Additional Checks" option pair, not part of TypeScript's `strict` family, so don't cite them as evidence strict mode is enabled. The codebase was already effectively strict-clean when `strict: true` was actually added — verified with `tsc -b --force` before committing to it, not assumed. Module resolution is `bundler` (Vite). Run `npm run build` to catch type errors.

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

**`src/components/ui/`** — The primitive library everything else is built from: `Button`, `Input`, `Select`, `Textarea`, `Chip`, `Badge`, `Card`, `Panel`, `PromoCard`, `QtyStepper`, `ProgressBar`, `Skeleton`, `EmptyState`, `ImageFrame` (image slot with a hatched placeholder fallback), `Switch`, `Sheet` (bottom sheet on mobile, right drawer on desktop — same component), `Modal`, `Toast` (`showKartlyToast` helper wired through `react-toastify`).

**`src/components/motion/`** — `Reveal` (staggered entrance), `Shimmer`/`Skeleton`'s loading sweep, `Confetti` (payment-success screen).

**`src/components/auth/OtpInput.tsx`**, **`src/components/assistant/`** — page-specific composites for auth and the (flagged) assistant demo.

**`src/theme/ThemeProvider.tsx`** — light/dark mode via a `data-theme` attribute on `<html>`, persisted to `localStorage` (`kartlyTheme`). `useTheme()` exposes `{ theme, setTheme, toggleTheme }`. Toggled live from `ProfilePage`'s dark-mode `Switch`.

**`src/hooks/`** — `useCartCount` (shared between `TopNav`/`BottomTabBar` so they don't each fetch independently), `useCountdown` (OTP resend), `usePrefersReducedMotion`.

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
/orders                   → order history landing (currently an EmptyState — see note below)
/orders/success            → post-payment success screen (needs an orderId in navigation state)
/profile                  → personal info + default address management, dark-mode toggle
/assistant                → AI shopping assistant, demo UI behind VITE_ENABLE_ASSISTANT
```

**Note:** the backend's user order routes only expose `checkout` / `create-order` / `verify-payment` — there is no endpoint to list past orders or fetch one order's detail/tracking status. `/orders` is therefore an honest empty state rather than a fabricated list, and there is no `/orders/:orderId` tracking page. See `doc/KARTLY_MIGRATION_NOTES.md` section "4.6" for detail.

### Authentication flow

Login is two-step and accepts **either** an email or a phone number (a single "identifier" field, no password): POST `/auth/login` with `{ email }` or `{ phone }` → backend sends OTP → POST `/auth/verify-login` with the same identifier + otp → receives JWT → stored in `localStorage` as `userToken`.

Register is two-step and requires a password: POST `/auth/register` → POST `/auth/verify-registration` → receives JWT → stored as `userToken`.

The backend returns the OTP in the response body ("for testing/demo purposes" — there is no real email/SMS delivery). Both auth pages surface it in a clearly-labelled `Badge tone="warn"` dev-notice card, not as ordinary UI copy.

### Payment flow

Checkout page POSTs to `/order/checkout` to calculate summary → user clicks "Place Order & Pay" → POSTs to `/order/create-order` → loads Razorpay JS SDK dynamically → opens Razorpay modal (themed to the Kartly accent, `#A87BF5`) → on success POSTs to `/order/verify-payment` (a blocking overlay covers the page while this is in flight) → navigates to `/orders/success` with `{ orderId }` in navigation state.

### The AI assistant (flagged, no backend yet)

`product_selling_app_agent/` is documentation-only today (see its `doc/AGENT_DEV_PLAN.md`) — there is no agent service to call. `AssistantPage.tsx` and its entry points (the `TopNav` "Ask AI" pill, the `BottomTabBar` AI tab, the `ProductListPage` teaser row) are all gated behind `VITE_ENABLE_ASSISTANT` (default `false`). With the flag on, the page renders static demo content with every non-functional control explicitly `disabled`; with it off, reaching `/assistant` directly shows an `EmptyState`.

### Styling

Tailwind CSS v4 (via `@tailwindcss/vite` plugin — **not** `tailwind.config.js`, which Tailwind v4 does not read; there is no `@config` directive in `src/index.css`, and the file was deleted). All design tokens live in `src/index.css`:

- **Raw custom properties** (`--k-*`) on `:root` and `[data-theme="dark"]` — these actually flip when the theme toggles. Includes a fixed (theme-independent) status palette (`--k-ok-*`, `--k-warn-*`, `--k-bad-*`, `--k-plum-fg`, `--k-danger`) and `--k-on-soft` / `--k-on-soft-muted` for text sitting on the `--k-soft` wash.
- **Tailwind `@theme` mappings** (`--color-*`, `--radius-*`, `--font-*`, `--animate-*`) pointing at those properties — these generate the utilities used everywhere (`bg-card`, `text-ink`, `border-line`, `bg-accent`, `rounded-card`, `animate-up`, etc).
- Ten ported prototype keyframes (`kfPop`, `kfDraw`, `kfRing`, `kfUp`, `kfFloat`, `kfRoll`, `kfDot`, `kfShim`, `kfConf`, `kfBar`) plus hover-lift/transition utility classes (`.lift`, `.lift-card`, `.slide-x`, `.t-base`, etc), all disabled under `prefers-reduced-motion: reduce`.

Dark mode is a real, working feature — `data-theme="dark"|"light"` on `<html>`, with a no-flash inline script in `index.html` reading `localStorage.kartlyTheme` before React mounts.

Toast notifications use `react-toastify`, restyled to the Kartly card/border/shadow tokens in `App.tsx`; `showKartlyToast()` (`src/components/ui/Toast.tsx`) renders the dark inline toast variant for key moments (e.g. add-to-cart). Icons from `react-icons` (Feather set, `fi` prefix).

### TypeScript

Strict mode is on (`noUnusedLocals`, `noUnusedParameters`). Module resolution is `bundler` (Vite). Run `npm run build` to catch type errors.

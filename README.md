# ShopNow — Buyer Storefront

A buyer-facing React SPA for browsing products, managing a cart, and placing orders with Razorpay payment integration. Part of the `product_selling_app` monorepo, implementing the **Kartly** design system.

> This file was significantly out of date (pre-Kartly-migration routes, design tokens, and auth flow) until this pass corrected it against the actual current code. For full, actively-maintained architecture detail — routing table, styling tokens, known backend gaps — see this app's own `CLAUDE.md`, which this file now defers to rather than duplicating.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| Routing | react-router-dom v7 |
| HTTP client | Axios |
| Notifications | react-toastify |
| Icons | react-icons (Feather `fi` prefix) |
| Payment | Razorpay JS SDK (dynamically loaded) |

No global state management — all state is local `useState` per page.

## Getting Started

### Prerequisites

- Node.js 18+
- A running instance of `product_selling_app_server` (or use the hosted backend)

### Installation

```bash
cd product_selling_app_client_user
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SERVER_URL=https://product-selling-app-server.onrender.com
VITE_PORT=5204
```

| Variable | Description | Default |
|---|---|---|
| `VITE_SERVER_URL` | Backend base URL | `https://product-selling-app-server.onrender.com` |
| `VITE_PORT` | Dev server port | `5204` |

### Running the App

```bash
npm run dev       # Start dev server at http://localhost:5204
npm run build     # Type-check then build to dist/
npm run lint      # oxlint
npm run preview   # Serve the built dist/ locally
```

## Features

- **Authentication** — Two-step OTP flow for both login (email or phone, no password) and registration (name/email/password, then OTP)
- **Product Browsing** — Paginated product grid with search and category filtering; browsable without logging in
- **Product Detail** — Image gallery, multi-attribute variant selector (size, color, etc.), offer badges, wishlist toggle
- **Cart** — Add/remove items with per-variant tracking, live order summary, drawer preview
- **Wishlist** — Save/remove products for later
- **Checkout** — Address management (new or saved), order cost breakdown, Razorpay payment modal
- **Orders** — Post-payment success screen; order history listing is an honest empty state (no backend order-listing endpoint exists yet — see `CLAUDE.md`)
- **Profile** — Personal info, default address, dark-mode toggle
- **AI Assistant** — Demo UI behind `VITE_ENABLE_ASSISTANT`; not wired to a real backend yet (see `CLAUDE.md`)

## Routes

| Path | Page | Notes |
|---|---|---|
| `/` | Redirects to `/welcome` or `/products` | Depends on login state / first visit |
| `/welcome` | One-time onboarding screen | — |
| `/login` | Two-step OTP login | — |
| `/signup` | Registration + OTP verify | — |
| `/products` | Product grid | Browsable while logged out |
| `/products/:productId` | Product detail | Browsable while logged out; add-to-cart/wishlist require login |
| `/cart` | Cart | Redirects to `/login` if not logged in |
| `/checkout` | Checkout + payment | Redirects to `/login` if not logged in |
| `/orders` | Order history | Empty state — no listing endpoint yet |
| `/orders/success` | Post-payment success | Needs an `orderId` in navigation state |
| `/wishlist` | Saved products | Redirects to `/login` if not logged in |
| `/profile` | Account settings | Redirects to `/login` if not logged in |
| `/assistant` | AI assistant demo | Gated by `VITE_ENABLE_ASSISTANT` |
| `*` | 404 page | Catch-all |

There's no route-level auth gate (unlike the admin app's `RequireSellerAuth`) — each protected page checks `localStorage.getItem('userToken')` itself and redirects if absent.

## Authentication Flow

```
Login:    POST /auth/login (email OR phone — no password)
            → backend sends OTP
          POST /auth/verify-login (email/phone + otp)
            → JWT stored as userToken in localStorage

Register: POST /auth/register (name, email, password)
          POST /auth/verify-registration (email + otp)
            → JWT stored as userToken in localStorage
```

Login and registration are asymmetric by design (as currently implemented): registration collects a password, login does not check one — only email/phone plus a fresh OTP. The OTP is returned directly in the API response for testing/demo purposes; there's no real email/SMS delivery.

## Payment Flow

```
1. POST /orders/checkout          → cost breakdown (subTotal, discount, shipping, total)
2. POST /orders/create-order      → razorpayOrderId + amount
3. Razorpay modal opens           → user completes payment
4. POST /orders/verify-payment    → payment confirmed
5. Navigate to /orders/success    → success screen with orderId
```

## Design Tokens

Purple `primary`/`accent` tokens from an earlier design are gone. Current Kartly tokens (defined as CSS custom properties + a Tailwind v4 `@theme` block in `src/index.css`, with full light/dark theming):

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--k-accent` | `#A87BF5` | `#B999F7` | Buttons, links, active states |

See `CLAUDE.md` → Styling for the full token/component inventory — it's substantially larger than one accent color and kept there rather than duplicated here to avoid this section going stale again.

## Related Apps

| App | Description | Port |
|---|---|---|
| `product_selling_app_server` | Node.js + Express backend | 4000 |
| `product_selling_app_clinet_admin` | Seller admin dashboard | 5203 |
| `product_selling_app_client_user` | Buyer storefront (this app) | 5204 |
| `product_selling_app_agent` | AI shopping-assistant service | 4100 |

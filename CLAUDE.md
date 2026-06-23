# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server (default port 5204, or VITE_PORT)
npm run build      # Type-check with tsc -b, then Vite production build → dist/
npm run preview    # Serve the built dist/ locally
```

There is no test suite configured in this project.

## Environment Variables

Create a `.env` file at the project root:

```
VITE_SERVER_URL=https://product-selling-app-server.onrender.com   # Backend base URL
VITE_PORT=5204                                                      # Dev server port (optional)
```

## Architecture

This is a **React 19 + TypeScript + Vite SPA** serving as the buyer-facing storefront for a product-selling platform. It has no global state management — all state is local `useState` per page.

### Key layers

**`src/api/userApi.ts`** — Axios instance:
- Base URL: `{VITE_SERVER_URL}/api/v1/user`
- Attaches `Authorization: Bearer {userToken}` from localStorage on every request via a request interceptor.

**`src/pages/`** — One component per route. Each page manages its own loading/error/data state with `useEffect` + `userApi` calls. Auth guard pattern: protected pages check `localStorage.getItem('userToken')` and redirect to `/login` if absent.

**`src/components/`** — Shared UI:
- `Button.tsx` — Primary action button (purple).
- `Navbar.tsx` — Sticky top nav with logo, Products, Cart (badge), Orders, Login/Logout.

**`src/api/userApi.ts`** — Single Axios instance targeting `/api/v1/user`.

### Routing (App.tsx)

```
/                         → redirect to /products
/login                    → two-step OTP login (credentials → OTP verify)
/signup                   → buyer registration (details → OTP verify)
/products                 → product grid with search, category filter, pagination
/products/:productId      → product detail with image gallery, variant selector, add to cart
/cart                     → cart items, remove, order summary
/checkout                 → address selection/entry, order breakdown, Razorpay payment
/orders                   → post-payment success landing with order ID
```

### Authentication flow

Login is two-step: POST `/auth/login` with email+password → backend sends OTP to email → POST `/auth/verify-login` with email+otp → receives JWT → stored in `localStorage` as `userToken`.

Register is two-step: POST `/auth/register` → POST `/auth/verify-registration` → receives JWT → stored as `userToken`.

### Payment flow

Checkout page POSTs to `/order/checkout` to calculate summary → user clicks "Place Order" → POSTs to `/order/create-order` → loads Razorpay JS SDK dynamically → opens Razorpay modal → on success POSTs to `/order/verify-payment` → navigates to `/orders` with order ID.

### Styling

Tailwind CSS v4 (via `@tailwindcss/vite` plugin). Design tokens in `tailwind.config.js`:
- `primary`: `#A78BFA` (purple)
- `accent`: `#4C1D95` (dark purple)
- `secondary`: `#F3F4F6`
- `background`: `#F9FAFB`
- `text`: `#1F2937`

Toast notifications use `react-toastify`. Icons from `react-icons` (Feather set, `fi` prefix).

### TypeScript

Strict mode is on (`noUnusedLocals`, `noUnusedParameters`). Module resolution is `bundler` (Vite). Run `npm run build` to catch type errors.

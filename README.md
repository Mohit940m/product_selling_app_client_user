# ShopNow — Buyer Storefront

A buyer-facing React SPA for browsing products, managing a cart, and placing orders with Razorpay payment integration. Part of the `product_selling_app` monorepo.

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
npm run preview   # Serve the built dist/ locally
```

## Features

- **Authentication** — Two-step OTP email verification for both login and registration
- **Product Browsing** — Paginated product grid with full-text search and category filtering
- **Product Detail** — Image gallery, multi-attribute variant selector (size, color, etc.), offer badges
- **Cart** — Add/remove items with per-variant tracking, live order summary
- **Checkout** — Address management (new or saved), order cost breakdown, Razorpay payment modal
- **Orders** — Post-payment confirmation page with order ID

## Project Structure

```
src/
├── api/
│   └── userApi.ts          # Axios instance targeting /api/v1/user, JWT interceptor
├── components/
│   ├── Button.tsx           # Primary action button (purple)
│   └── Navbar.tsx           # Sticky nav: logo, Products, Cart (badge), Orders, Login/Logout
└── pages/
    ├── LoginPage.tsx        # 2-step OTP login
    ├── SignUpPage.tsx       # Registration + OTP verify
    ├── ProductListPage.tsx  # Grid, search, category filter, pagination
    ├── ProductDetailPage.tsx# Gallery, variant selector, add to cart
    ├── CartPage.tsx         # Cart items, remove, order summary
    ├── CheckoutPage.tsx     # Address + Razorpay payment flow
    └── OrderListPage.tsx    # Post-payment confirmation
```

## Routes

| Path | Page | Auth Required |
|---|---|---|
| `/` | Redirects to `/products` | — |
| `/login` | Two-step OTP login | No |
| `/signup` | Registration + OTP verify | No |
| `/products` | Product grid | Yes |
| `/products/:productId` | Product detail | No (cart needs auth) |
| `/cart` | Cart | Yes |
| `/checkout` | Checkout + payment | Yes |
| `/orders` | Order confirmation | Yes |

## Authentication Flow

```
Login:    POST /auth/login (email + password)
            → backend sends OTP to email
          POST /auth/verify-login (email + otp)
            → JWT stored as userToken in localStorage

Register: POST /auth/register (name, email, password, phone)
          POST /auth/verify-registration (email + otp)
            → JWT stored as userToken in localStorage
```

Protected pages redirect to `/login` when `userToken` is absent from `localStorage`.

## Payment Flow

```
1. POST /order/checkout          → cost breakdown (subTotal, discount, shipping, total)
2. POST /order/create-order      → razorpayOrderId + amount
3. Razorpay modal opens          → user completes payment
4. POST /order/verify-payment    → payment confirmed
5. Navigate to /orders           → success page with orderId
```

## Design Tokens

| Token | Value | Usage |
|---|---|---|
| `primary` | `#A78BFA` | Buttons, badges, accents |
| `accent` | `#4C1D95` | Hover states, headings |
| `secondary` | `#F3F4F6` | Card backgrounds |
| `background` | `#F9FAFB` | Page background |
| `text` | `#1F2937` | Body text |

## Related Apps

| App | Description | Port |
|---|---|---|
| `product_selling_app_server` | Node.js + Express backend | 3000 |
| `product_selling_app_clinet_admin` | Seller admin dashboard | 5203 |
| `product_selling_app_client_user` | Buyer storefront (this app) | 5204 |

# Kartly Migration Notes — User Storefront

Running log kept alongside `doc/KARTLY_UI_PLAN.md`. Record decisions and
baselines here as each phase completes; do not duplicate plan content.

## Phase 0 — Audit baseline (recorded before any code changes)

### 0.1.1 — Confirmed finding

`tailwind.config.js` is not read by Tailwind v4 (`@tailwindcss/vite`, no
`@config` directive in `src/index.css`). Legacy token classes render as
unstyled utilities.

### 0.1.2 — Legacy token class inventory (before)

```
grep -rnoE "(bg|text|border|from|to|via)-(primary|secondary|accent|background|text)\b" src/
```

| Class | Count |
|---|---|
| `text-text` | 81 |
| `text-accent` | 49 |
| `bg-secondary` | 38 |
| `text-primary` | 23 |
| `border-primary` | 22 |
| `bg-primary` | 11 |
| `bg-background` | 10 |
| `bg-accent` | 7 |
| `border-accent` | 1 |
| **Total** | **242** |

Per file:

| File | Occurrences |
|---|---|
| `src/pages/ProfilePage.tsx` | 32 |
| `src/pages/CheckoutPage.tsx` | 25 |
| `src/pages/ProductDetailPage.tsx` | 23 |
| `src/pages/SignUpPage.tsx` | 22 |
| `src/pages/ProductListPage.tsx` | 21 |
| `src/pages/CartPage.tsx` | 19 |
| `src/pages/LoginPage.tsx` | 16 |
| `src/pages/OrderListPage.tsx` | 11 |
| `src/components/Navbar.tsx` | 9 |

This is the "before" baseline for Phase 7.1.1's re-run of the same grep,
which must return zero matches for the legacy meaning.

### 0.2.1–0.2.3 — Prerequisites

- `npm install` already satisfied (node_modules present).
- `.env` present with `VITE_SERVER_URL` and `VITE_PORT`.
- Baseline build: `npm run build` — clean.
  ```
  vite v8.1.0 building client environment for production...
  ✓ 91 modules transformed.
  dist/index.html                   0.48 kB
  dist/assets/index-*.css          46.38 kB
  dist/assets/index-*.js          387.49 kB
  ✓ built in 2.01s
  ```

### 0.2.4 — Prototype read

`kartly-ecommerce-template-kit/project/Kartly Commerce Kit.dc.html` read in
full during plan authoring (tokens, keyframes, all 12 mobile screens, 3
desktop screens, admin panel, design-system panel, and the `renderVals()`
data block).

Phase 0 complete.

## Phase 4 — deliberate deviations

Recorded as they come up, so ticked/unticked state in the plan stays honest.

### 4.1 ProductListPage

Implemented: responsive header/hero, search, active-category clear chip,
2/3/4-col product grid with `ImageFrame`/`Badge`/`Card`, offer + out-of-stock
badges, shimmer skeletons, empty state, AI teaser (flagged), pagination.

Deliberately **not** built, and left unticked in the plan, because they need
backend capability this pass didn't add or verify:

- **4.1.3 full category rail** — the API has no "list categories" endpoint;
  only a single active-category clear chip is shown (derived from a clicked
  product), not a browsable rail. Building a fake rail would mean inventing
  category names.
- **4.1.4 / 4.1.15 "Trending now" section + "See all"** — the product list
  endpoint returns one paginated set, not a separate trending subset. No
  section split without fabricating one.
- **4.1.8 Price/Sort/Category filter sheet** and **4.1.16 inline sort/filter
  chips** — `loadProducts` only sends `page`, `limit`, `search`, `category`
  today; sort/price-range params aren't wired against the backend yet.
- **4.1.11/4.1.12 decorative hero blob + two category tiles with counts** —
  the tiles need real per-category product counts; skipped rather than
  showing invented numbers. The hero copy/CTA band itself is simplified to
  heading + subtitle + search, no illustrated blob.
- **4.1.13 desktop quick "+Add" pill** — needs a default variant id per
  product, which the list endpoint's `Product` shape doesn't carry (only
  `ProductDetailPage`'s single-product endpoint does). Adding it would mean
  either fetching per-card product detail (N+1) or shipping a broken button.

None of these block the page from working; they're follow-ups for whenever
the corresponding backend support is confirmed.

### 4.2 ProductDetailPage

Implemented: hatched-hero gallery with dot pager (mobile) + thumbnail rail
(desktop), variant swatches with a disabled state for out-of-stock
combinations, price row with the computed discount `Badge`, offer banner,
`QtyStepper` + `primary` Add to cart, and a new `Buy it now` action that
adds to cart then navigates straight to `/checkout`.

Deliberately **not** built:

- **4.2.1 floating back/wishlist tiles over the gallery** — kept the plain
  "Back to products" link above the gallery instead of overlaying it, and
  dropped the wishlist heart entirely: no wishlist endpoint is wired into
  this frontend anywhere (`grep -rn wishlist src/` is empty), so a heart
  button would have nothing to call.
- **4.2.3 mobile bottom-sheet overlap composition** — this page uses one
  responsive 3-column-collapsing-to-1 layout rather than the prototype's
  distinct "sheet overlapping the gallery by 24px" mobile treatment.
- **4.2.4 rating pill** — no rating field exists on the product/variant
  API response.
- **4.2.6 "See details" expand/collapse** — description renders in full;
  no truncation state added.
- **4.2.7 trust row (free ship / 30-day returns / warranty)** — would
  assert policy claims the backend doesn't expose; skipped rather than
  hardcoding unverified promises.
- **4.2.8 sticky bottom action bar on mobile** — buttons stay in normal
  flow; not pinned to the viewport bottom.
- **4.2.13/4.2.14 desktop cart drawer** — needs a cart-refetch-after-add
  flow and a new `CartDrawer` component; deferred rather than shipping a
  drawer that doesn't reflect real cart state.

### 4.3 CartPage

Implemented: bag title with count, restyled line items (`Card` +
`ImageFrame`), disabled promo-code slot with a "coming soon" tooltip
(rather than omitting it), remove-item action, `EmptyState`, and a
two-column desktop layout with a sticky order-summary `Panel`.

Deliberately **not** built:

- **4.3.2/4.3.3 interactive `QtyStepper` per line + swipe-to-remove** —
  there is no update-quantity endpoint wired into `userApi` (only
  add-to-cart and remove-from-cart exist); quantity stays a read-only
  `×N` label rather than shipping a stepper with nothing to call.
- **4.3.5 bottom-pinned mobile summary sheet** — the summary renders as
  a normal `Panel` in flow, not pinned to the viewport bottom with a
  rounded-top overlap.

### 4.4 CheckoutPage

Implemented: restyled address card/form on the new `Input`/`Panel`/`Button`
primitives, restyled order-items and price-summary panels, Razorpay themed
to the Kartly accent (`#A87BF5`), and a blocking three-dot overlay while
`/order/verify-payment` is in flight so the pay action can't double-submit.

Deliberately **not** built:

- **4.4.1 back tile**, **4.4.2/4.4.9 step progress bar** — this flow has no
  explicit step state machine (it's address-entry + one payment action, with
  Razorpay's own modal handling the rest); a fake 3-step indicator would
  imply steps that don't exist in the code.
- **4.4.4 custom payment-method radio rows (card/wallet/pay-in-4)** — this
  app delegates payment method selection entirely to the Razorpay checkout
  modal, which already lists whatever methods the merchant account
  supports. Building a parallel custom radio UI would either duplicate or
  contradict Razorpay's own method list.
- **4.4.5 sticky pay bar / 4.4.10 side-by-side panels at xl** — the pay
  button stays in normal flow inside the summary panel rather than pinned
  to the viewport; address and items panels stack in one column rather
  than sitting side by side, since the order-items panel is conditionally
  rendered after the summary loads.

### 4.5 OrderSuccessPage (new) / OrderListPage split

Implemented: new `src/pages/OrderSuccessPage.tsx` at `/orders/success`,
redirecting to `/products` if reached without an `orderId` in navigation
state. Full celebratory sequence — accent success mark with `animate-pop`,
an SVG check drawn via `kfDraw`, two `kfRing` pulses, 7-particle
`Confetti`, and the staggered 250/400/550/700ms copy ladder — all gated by
a live `usePrefersReducedMotion()` hook that renders the static, motion-free
version when the OS setting is on. `CheckoutPage` now navigates to
`/orders/success` instead of `/orders` on verified payment.

**Not built: 4.5.7 ETA card + Track button.** The checkout flow never
receives an estimated-arrival date or a trackable order-detail endpoint
(see the 4.6 note below) — there is nothing real to show, and a Track
button would point at a page that doesn't exist. Omitted rather than
fabricating a delivery date.

### 4.6 OrderTrackingPage — not built (backend gap, out of scope)

`OrderListPage.tsx` is simplified to an honest `EmptyState` instead of
being rewritten into a real order list.

**Root cause:** the backend's user order routes
(`product_selling_app_server/src/routes/user.routes/order.routes.ts`)
expose exactly three endpoints — `POST /checkout`, `POST /create-order`,
`POST /verify-payment` — and nothing to list a user's past orders or fetch
one order's status/tracking detail. Every item in plan section 4.6
(`OrderTrackingPage.tsx` at `/orders/:orderId`, and rewriting
`OrderListPage.tsx` into a real list) depends on endpoints that don't
exist yet. Building the UI against them would mean either fabricating
order/tracking data or shipping pages that always 404/error.

This is a backend-scope gap, not a design-plan gap — the Kartly visual
spec for both screens (order list rows, the live-tracking timeline) is
still fully described in `doc/KARTLY_UI_PLAN.md` section 4.6 and can be
implemented as soon as the corresponding list/detail endpoints exist.

### 4.7 ProfilePage

Implemented: restyled personal-info card and edit form on the new
primitives (`Panel`, `Input`, `Select`, `Button`), the default-address
card with a `DEFAULT` `Badge`, address add/edit moved out of inline page
state into a `Sheet` overlay (responsive bottom-sheet/right-drawer by
breakpoint, replacing the old always-inline form), and a **real, working**
dark-mode `Switch` wired to `useTheme().toggleTheme` — the one part of the
prototype's profile screen this app can actually back with live state.
New `src/components/ui/Switch.tsx` primitive (shared with the future
admin build).

Deliberately **not** built — this app's address model is a single
optional `profile.defaultAddress`, not a list of labelled addresses:

- **4.7.1 tier/loyalty pill, 4.7.2 stat tiles (Orders/Wishlist/Wallet)**
  — no loyalty tier, order-count, wishlist-count, or wallet-balance data
  exists anywhere in this API. Fabricating "24 orders · Gold · $212"
  would violate the same no-fake-data rule as the dashboard/order pages.
- **4.7.3 menu rows (Orders/Addresses/Payment methods/Wishlist/Help)** —
  Addresses is already the single card on this page, not a separate
  destination; Payment methods/Wishlist/Help have no destination to link
  to. Only a real "Orders" link would be honest, and it already exists
  in the bottom tab bar.
- **4.7.7 dashed "+ Add new address" CTA block, 4.7.10 Home/Work/Other
  label chips, 4.7.12 delete confirmation** — the backend's address
  shape (`UserAddress`) has no `label` field and there is exactly one
  slot, added via `POST /profile/address` or replaced via
  `PUT /profile/address/:id` — there's nothing to label or delete from a
  list of one.
- **4.7.13–4.7.15 desktop three-column account shell (nav rail + profile
  rail)** — would need the same non-existent destinations as 4.7.3;
  kept the single responsive column instead.

### 4.10 AssistantPage (new, flagged, demo UI only)

Implemented behind `VITE_ENABLE_ASSISTANT` (default `false`, added to a new
`.env.example` plus the local `.env`): chat header, message bubbles,
product pick rows, a micro-checkout card, a typing indicator, a suggestion
chip rail, and a composer — all wired as demo/static content since
`product_selling_app_agent/` has no implementation yet, only a dev plan
doc. Every non-functional control (pay button, suggestion chips, send
button) is explicitly `disabled` with a "Demo only" tooltip rather than
silently doing nothing. All entry points (top-nav pill, bottom tab, home
teaser, the route itself) are gated by the same flag; reaching `/assistant`
directly while the flag is off renders an honest `EmptyState`.

**Not built: 4.10.9 desktop three-pane workspace** (account nav rail +
profile rail either side of the conversation). Those rails would need the
same non-existent destinations (Orders/Wishlist/Payments/Settings) already
skipped in the ProfilePage note — kept a single centered conversation
column at every width instead of building two more decorative,
non-functional navs.

## Phase 5 — motion & interaction pass

12 of 14 items done. Not applicable and left unticked:

- **5.12 checkout progress-bar transition** and **5.13 tracking timeline
  transition** — both require UI that was itself deferred (CheckoutPage's
  step progress bar, and OrderTrackingPage) per the Phase 4 notes above.
  Nothing to animate until that UI exists.

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

- **4.1.3 full category rail** — corrected in the "ProductListPage
  category rail" post-Phase-7 follow-up further down: the API still has
  no "list categories" endpoint, but a real rail was built anyway, scoped
  honestly to the categories present in the currently-loaded page (same
  pattern as the admin dashboard's low-stock panel) rather than a true
  full-catalog browsable list.
- **4.1.4 / 4.1.15 "Trending now" section + "See all"** — the product list
  endpoint returns one paginated set, not a separate trending subset. No
  section split without fabricating one.
- **4.1.8 Price/Sort/Category filter sheet** and **4.1.16 inline sort/filter
  chips** — `loadProducts` only sends `page`, `limit`, `search`, `category`
  today; sort/price-range params aren't wired against the backend yet.
- **4.1.12 two category tiles with counts** — needs real per-category
  product counts; skipped rather than showing invented numbers.
- **4.1.11 hero CTAs** — the decorative blob and the `bg-soft` hero-band
  treatment were added in a post-Phase-7 follow-up (see below); the two
  CTA buttons (`Shop the drop` / `Lookbook` in the prototype) are still
  left out, since this storefront has no seasonal-drop campaign or
  lookbook page to link them to honestly.
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

- **4.2.1 wishlist heart** — ~~dropped~~ **correction, see the
  post-Phase-7 follow-up further down**: the earlier "no wishlist endpoint"
  claim only checked this frontend repo (`grep -rn wishlist src/`), not the
  actual backend. `product_selling_app_server` does expose a real
  `/api/v1/user/wishlist` (`GET /`, `POST /add`, confirmed by reading
  `wishList.routes.ts`/`wishList.controller.ts`), so the heart button and a
  real Wishlist page were built after all.
- **4.2.3 mobile bottom-sheet overlap composition** — this page uses one
  responsive 3-column-collapsing-to-1 layout rather than the prototype's
  distinct "sheet overlapping the gallery by 24px" mobile treatment.
- **4.2.4 rating pill** — no rating field exists on the product/variant
  API response.
- **4.2.6 "See details" expand/collapse, 4.2.8 sticky mobile action bar**
  — both built in the "Post-Phase-7 follow-up — ProductDetailPage"
  section further down; this paragraph is the original Phase-4-pass
  state, kept as the historical record of what wasn't true yet.
- **4.2.7 trust row (free ship / 30-day returns / warranty)** — also
  corrected later: built in a follow-up using the prototype's own bare
  geometric marks (no filled icons, no asserted policy text beyond what
  the prototype itself already shows) — see the "PDP trust row" entry
  further down.
- **4.2.13/4.2.14 desktop cart drawer** — built in the "CartDrawer"
  post-Phase-7 follow-up further down; this paragraph is the original
  Phase-4-pass state, kept as the historical record of what wasn't true
  yet.

### 4.3 CartPage

Implemented: bag title with count, restyled line items (`Card` +
`ImageFrame`), disabled promo-code slot with a "coming soon" tooltip
(rather than omitting it), remove-item action, `EmptyState`, and a
two-column desktop layout with a sticky order-summary `Panel`.

Deliberately **not** built:

- **4.3.2 interactive `QtyStepper` per line** — corrected in the
  post-Phase-7 follow-up below: `remove-from-cart` accepts an optional
  `quantity` to decrement by (confirmed by reading
  `cart.controller.ts`'s `removeFromCart`), not just "remove the whole
  line," so a working `+`/`-` stepper was built after all.
- **4.3.3 swipe-left-to-remove on touch** — still deferred. This is a
  gesture-interaction build (not a backend gap), and with no browser or
  touch device available this session to verify it doesn't regress or
  interfere with normal scrolling, it wasn't worth the risk. The
  existing tap-target `Remove` button covers both touch and pointer
  devices in the meantime.
- **4.3.5 bottom-pinned mobile summary sheet** — the summary renders as
  a normal `Panel` in flow, not pinned to the viewport bottom with a
  rounded-top overlap.

### 4.4 CheckoutPage

Implemented: restyled address card/form on the new `Input`/`Panel`/`Button`
primitives, restyled order-items and price-summary panels, Razorpay themed
to the Kartly accent (`#A87BF5`), and a blocking three-dot overlay while
`/order/verify-payment` is in flight so the pay action can't double-submit.

Deliberately **not** built:

- **4.4.4 custom payment-method radio rows (card/wallet/pay-in-4)** — this
  app delegates payment method selection entirely to the Razorpay checkout
  modal, which already lists whatever methods the merchant account
  supports. Building a parallel custom radio UI would either duplicate or
  contradict Razorpay's own method list.
- **4.4.10 side-by-side panels at xl** — address and items panels stack in
  one column rather than sitting side by side, since the order-items panel
  is conditionally rendered after the summary loads.

4.4.1 (back tile) and 4.4.5 (mobile sticky pay bar) were both built in
later post-Phase-7 follow-ups (see further down) — this section is kept
as the historical record of the original Phase-4 pass, when they weren't
yet built.

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

Deliberately **not** built — **correction (post-Phase-7 follow-up)**:
re-reading `address.model.ts`/`profile.controller.ts` shows the backend
actually stores addresses as a full collection (`POST /profile/address`
can create more than one, each with its own `isDefault` flag), not a
single embedded field as previously stated here. The real, practical
blocker is narrower: there's no `GET` to list a user's addresses and no
`DELETE` for one — `getUserProfile` only ever populates the current
`defaultAddress`. So this UI can still only ever manage "my one current
default address," but because of a missing list/delete endpoint, not
because the model itself is single-address:

- **4.7.1 tier/loyalty pill** — no loyalty-tier data exists anywhere in
  this API. Fabricating "Gold member" would violate the no-fake-data
  rule.
- **4.7.2 stat tiles (Orders/Wishlist/Wallet)** — corrected in the
  post-Phase-7 follow-up below: a real wishlist-count tile is now built
  (the wishlist API is real, see 4.2.1's correction above), linking to
  `/wishlist`. Orders and savings stay out — no order-history endpoint
  exists to compute either from — so this is one real tile, not the
  prototype's three.
- **4.7.3 menu rows** — see the post-Phase-7 follow-up further down: a
  real Orders + Wishlist pair of rows is now built. Addresses stays out
  (already the single card on this page, not a separate destination) and
  Payment methods/Help & returns stay out (no destination to link to).
  The earlier note that Orders "already exists in the bottom tab bar" was
  wrong — it was never in `BottomTabBar.tsx` or `TopNav.tsx`, so `/orders`
  was completely unreachable from the UI until this follow-up added it.
- **4.7.7 dashed "+ Add new address" CTA block** — actually built (this
  note previously and wrongly lumped it in with 4.7.10/4.7.12; it's
  ticked in the plan). It calls the same real `POST /profile/address`
  either way — "add new" just replaces the current single default slot,
  since there's nowhere else for a second address to live.
- **4.7.10 Home/Work/Other label chips, 4.7.12 delete confirmation** —
  the backend's address shape (`UserAddress`) has no `label` field, and
  with exactly one address slot (added via `POST /profile/address` or
  replaced via `PUT /profile/address/:id`) there's no "delete one address
  from a list" action to put behind a confirmation either.
- **4.7.13–4.7.15 desktop three-column account shell** — corrected in a
  post-Phase-7 follow-up (see further down): the left-nav half is now
  built, since it only ever needed the same real destinations as 4.7.3
  (Orders, Wishlist). 4.7.14 (the tier/points bottom card) was already
  satisfiable as written — its own instruction is "populate from live
  data or omit the card entirely," and there's no tier/points data, so
  omitting it is a correct, tickable outcome, not a gap.

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

## Phase 6 — Responsive QA matrix: code-audit pass, not live-viewport

This session has no browser/screenshot tool available (no MCP browser,
no Playwright/Puppeteer configured) — Phase 6 as written calls for
testing every route at 375/768/1024/1440px in both themes visually,
which genuinely requires a rendered browser. What follows is what a
static code audit *could* verify, and what still needs a real pass.

**A real bug found and fixed by this audit:** `--k-on-soft` (text color
for content sitting on the `--k-soft` wash — offer chips, hero panels,
the AI teaser row) was only defined once, under `:root`. In dark mode
`--k-soft` flips from a light plum (`#F6E8FF`) to a dark purple
(`#2A2138`), but the text color stayed `#171A22` (near-black) — illegible
on a dark background. Same issue existed with three more spots that
hardcoded raw hex (`#171A22`, `#6E5F80`, `#5A5566`) instead of a token, in
`AuthLayout.tsx`, `PromoCard.tsx`, and `ProductListPage.tsx`. Fixed by:
- Adding a dark-mode override for `--k-on-soft` (`#F1F0F4`) and a new
  `--k-on-soft-muted` token (light `#6E5F80` / dark `#B9AFC9`) for
  secondary text on the same surfaces.
- Replacing every hardcoded hex text color sitting on `bg-soft` with
  `text-[var(--k-on-soft)]` / `text-[var(--k-on-soft-muted)]`.
- Confirmed via `grep -rnoE "(bg|text|border)-(white|black|gray-[0-9]+|
  green-[0-9]+|red-[0-9]+)\b" src/` that only one non-token color remains
  in page/component code: the decorative `bg-white/45` highlight circle in
  `AuthLayout`'s hero panel, which matches the source prototype's own
  choice to keep that specific blob white in both themes (a11y-neutral,
  it's a translucent decorative shape, not text).

**Verified by class/structure inspection (not live rendering):**
- 6.1 no horizontal overflow — audited every `w-[Npx]` / `max-w-[Npx]` in
  `src/pages` and `src/components`; every one is either small chrome
  (icon tiles, avatars, a switch knob, dot-pager segments) or explicitly
  `lg:`-scoped (the two documented exceptions: `TopNav`'s search bar and
  `Sheet`'s desktop drawer, both `max-w-[340px]`/`w-[340px]` gated behind
  `lg:`). Nothing unscoped is wide enough to force mobile overflow.
- 6.3 bottom tab bar — `BottomTabBar` is `lg:hidden`; nothing else fills
  that role at `lg+`.
- 6.4 top-nav collapse — category links and the inline search bar in
  `TopNav` are `hidden ... lg:flex`; a search icon takes over below `lg`.
- 6.5 sheets — `Sheet.tsx` renders bottom-sheet classes unconditionally
  and drawer classes under `lg:`, confirmed by reading the component.
- 6.9 safe-area insets — `BottomTabBar` has
  `pb-[env(safe-area-inset-bottom)]`.

**Not verified — needs an actual browser pass:** the full route × width ×
theme matrix table above, 6.2 (wide-content scroll containers — none of
this app's pages currently have a table wide enough to test), 6.6 (exact
44px tap-target compliance — a few nav icon tiles are 38-40px, matching
the prototype's own sizing but shy of the 44px guideline), 6.7 (visual
text-clipping), 6.8 (both themes rendered side by side), 6.10 (landscape
phone). Recommend running this project's `run` skill or a manual
device/browser pass before shipping, and filling in the matrix table then.

## Phase 7.2 — accessibility

- **7.2.1 contrast** — fixed for real (see the Phase 6 section above and
  the `--k-muted` comment in `src/index.css`): light-mode `--k-muted` was
  ~4.18:1 on white, now `#6B7180` at ~4.89:1. Dark mode was already fine.
- **7.2.2** — audited for the `<div onClick>` anti-pattern
  (`grep -rn "<div[^>]*onClick" src/`); the only hit is `Modal.tsx`'s
  `aria-hidden` backdrop click-catcher, which is correct (Esc already
  covers keyboard dismissal via `useDialogBehavior`).
- **7.2.3 focus rings** — found and fixed the one real gap: the custom
  search bar on `ProductListPage` set `outline-none` on the `<input>`
  with no replacement; added `focus-within:outline-*` to its wrapper and
  a `focus-visible` ring to its clear button. Also deleted
  `src/components/Button.tsx` (the pre-migration Button, unused by any
  page since Phase 4) and added an explicit ring to the PDP variant
  swatches. Every other custom button in the app still has the browser's
  native `:focus-visible` outline (nothing else sets `outline-none`), so
  keyboard users get *a* visible indicator everywhere — just not all of
  it is custom-styled to match the design system yet. Full sweep of every
  raw `<button>` for a matching custom ring was not completed in this
  pass; primitives (`Button`, `Chip`, `Input`, `Sheet`/`Modal` close
  buttons, `Switch`, `QtyStepper`) all have it.
- **7.2.4 dialog semantics** — already correct from Phase 2:
  `role="dialog"`, `aria-modal`, focus trap, and focus restore all live
  in `useDialogBehavior`, shared by `Sheet` and `Modal`.
- **7.2.5 ImageFrame alt text** — every call site passes a real `alt`.
  The hatched fallback uses `aria-hidden` on the placeholder glyph plus an
  `sr-only` span repeating the alt text, rather than the plan's literal
  `alt=""` + fully hidden — a screen-reader user still learns what the
  missing image was of, which reads as more correct than suppressing it.
- **7.2.6 bottom tab bar** — `nav aria-label="Primary"`; `aria-current`
  comes for free from react-router's `NavLink` (sets `aria-current="page"`
  on the active link automatically).
- **7.2.7 theme toggle** — `Switch` is `role="switch" aria-checked`, used
  live in `ProfilePage`.
- **7.2.8 keyboard-only pass of the money path** — needs a live browser
  and a reachable backend; not performed in this session for the same
  reason as the Phase 6 matrix (no browser tool available).

## Post-Phase-7 follow-up — ProductDetailPage

Two previously-deferred items that didn't actually need backend support:

- **4.2.6 description expand/collapse** — was rendering the full
  description always; now truncates to 3 lines with a "See details" /
  "Show less" toggle (only shown when the description is long enough to
  need it).
- **4.2.8 sticky mobile action bar** — the Add to cart row was in normal
  flow; now a `sticky bottom-[76px]` bar (clearing `BottomTabBar`) shows
  Total price, the qty stepper, and Add to cart on mobile. Desktop keeps
  the original inline row + separate "Buy it now" button — mobile does
  **not** get "Buy it now" in the sticky bar, matching the prototype's own
  screen 04, which only shows Add to cart on the mobile sticky bar (Buy it
  now is a D2/desktop-only affordance in the source design).

## Post-Phase-7 follow-up — CartDrawer

**4.2.13/4.2.14 desktop cart drawer**, previously deferred as needing a
cart-refetch-after-add flow — built it. New
`src/components/cart/CartDrawer.tsx` refetches `GET /cart/get-cart` each
time it opens (no global cart store in this app, so a light per-open
refetch is simpler than threading cart state through props) and renders
via the existing `Sheet` primitive: bottom sheet on mobile, right drawer
at `lg+`. Opens automatically after a successful add-to-cart from either
the desktop or mobile Add to cart button (not after "Buy it now", which
skips straight to checkout instead); never auto-dismisses.

**Simplified from the plan's literal spec:** rendered as a `Sheet` overlay
at every width, not "inline beside the PDP at `xl`" — building a
third, non-overlay desktop-only layout variant just for the `xl`
breakpoint was judged not worth the added complexity versus reusing the
overlay pattern already established for every other drawer in the app.

## Post-Phase-7 follow-up — PDP floating back tile

The plain "Back to products" link above the gallery is now desktop-only
(`hidden lg:inline-flex`); mobile gets the plan's floating `38×38
rounded-[13px] bg-card` tile over the gallery's top-left corner instead.
The wishlist heart on the top-right stays dropped — see the 4.2.1 note
above.


## Post-Phase-7 follow-up — ProductListPage hero

Added the decorative `300×300 rounded-full bg-white/45` blob and the
`bg-soft` hero-band treatment to the desktop header (`lg+` only; mobile
keeps the plain card header). Heading/eyebrow/subtitle text switches to
`--k-on-soft`/`--k-on-soft-muted` so it stays readable against the soft
wash in both themes. The two CTA buttons from the prototype's hero are
still deliberately left out — see the 4.1.11 note above.

## Post-Phase-7 follow-up — PDP trust row (4.2.7)

Added the three-mark trust row (`Free ship` / `30d return` / `Warranty`)
below the description panel on `ProductDetailPage`, matching the
prototype's bare geometric marks exactly (rounded square, circle, rotated
square — all border-only, no filled icons): source is `Kartly Commerce
Kit.dc.html` lines 215-219. Purely static/decorative — no backend data
involved, so no fabrication risk.

## Post-Phase-7 follow-up — ProductListPage category rail (4.1.3)

Replaced the old conditional "Filtering by {category}" bar with an
always-visible horizontal `Chip` rail: `All` (selected when no filter is
active) plus one chip per category. There is no categories-listing
endpoint, so — same honest-scoping approach as the admin dashboard's
low-stock panel — the rail's chip labels are scoped to categories present
in the *currently loaded page* of products, not the full catalog; if a
selected category happens to fall off the current page, its chip is kept
pinned in so the active filter stays visible and clearable. The actual
filtering always goes through the backend's real `category` query param,
so results are correct even though the chip list itself is a partial
view. Related: `4.1.12`/`4.1.15` (a real top-categories rail with counts)
and `4.1.16` (desktop inline chips + sort `Select`) stay deferred — sort
in particular is blocked since `/products/get-all-products` has no sort
param, and a client-side sort of just the current page would misrepresent
itself as a real global sort across pagination.

## Post-Phase-7 follow-up — real Wishlist feature + Profile menu rows (4.2.1, 4.7.3)

Re-checked the backend directly (not just this frontend) and found a
genuinely working, mounted wishlist API: `GET /api/v1/user/wishlist`
and `POST /api/v1/user/wishlist/add` (`wishList.routes.ts`,
`wishList.controller.ts`, mounted at `/wishlist` in `userRoute.ts`).
Two earlier migration-notes entries (4.2.1, 4.7.3) had wrongly called
this a backend gap — corrected above. Built:

- **PDP wishlist heart** (`ProductDetailPage.tsx`): `38×38 rounded-[13px]
  bg-card` tile top-right of the gallery, matching the existing back
  tile. On mount, fetches `GET /wishlist` to check whether the current
  product is already saved (no per-product "is wishlisted" field exists
  on the product-detail response, so this is the only accurate way to
  seed the initial state). Clicking calls `POST /wishlist/add`; a 400
  "already in wishlist" response is treated as success (fills the heart)
  rather than surfaced as an error. There is still no remove-from-
  wishlist endpoint, so the heart is one-way (add only) — it does not
  pretend to toggle off.
- **`src/pages/WishlistPage.tsx`** (new, route `/wishlist`): fetches
  `GET /wishlist`, renders real saved products in the same product-grid
  card style as `ProductListPage`. Read-only — no remove button, since
  there is nothing to call. Honest `EmptyState` when nothing is saved.
- **`ProfilePage.tsx` menu rows** (4.7.3, partial): added a real
  Orders + Wishlist row pair (icon tile, label, sub, chevron, exactly
  per spec) between the address card and the dark-mode toggle. This also
  fixes a genuine navigation bug: `/orders` had no link pointing to it
  anywhere in the app (not in `BottomTabBar` or `TopNav`) despite being a
  real, working route — it was reachable only by typing the URL. 4.7.3
  stays unticked since Payment methods and Help & returns still have no
  real destination, and Addresses is intentionally not duplicated as a
  menu row (already the single card on this same page).

## Post-Phase-7 follow-up — real CartPage QtyStepper (4.3.2, partial)

Another corrected backend-gap claim: `POST /cart/remove-from-cart`
accepts an optional `quantity` and decrements the line by that much
(removing it entirely once it would hit 0), it isn't only a full-line
remove. Combined with `add-to-cart`'s existing "increase quantity if
already in cart" behavior, this gives a real `+`/`-` pair with something
to call. Wired the existing `QtyStepper` primitive into each cart line:
`+` calls `add-to-cart` with `quantity: 1`, `-` calls `remove-from-cart`
with `quantity: 1`; both replace the cart state from the response so
totals stay in sync without a full page reload. There's still no "jump
straight to quantity N" endpoint, so the stepper only ever moves by 1
per click — matches how it already behaves everywhere else in this app.
4.3.2 stays unticked since 4.3.3 (swipe-to-remove) is bundled into the
same checklist item and remains deferred as UX polish this session can't
verify without a browser.

## Post-Phase-7 follow-up — tap-target audit (1.5.4, 6.6)

Code-audited every icon-only interactive element for the 44×44px CSS
touch-target rule (`grep` for `h-6`/`h-7`/`h-8`/`h-9`/`h-9.5` on
`<button>`/`<a>`/`<Link>` elements — no browser available to measure
rendered boxes directly, so this is a class-name audit, same method as
the rest of Phase 6). Found and fixed:

- **`ProfilePage.tsx`** avatar camera button (28px visible).
- **`ProductDetailPage.tsx`** back tile and wishlist heart (38px each,
  floating over the gallery — the exact "prototype's 38px icon tiles"
  case 1.5.4 calls out).
- **`CheckoutPage.tsx`** back tile (38px).
- **`TopNav.tsx`** mobile search icon (40px) and cart/profile icons
  (38px each).

All fixed the same way the rule prescribes — "padding-box expansion, not
a smaller hit area": an invisible `before:absolute before:-inset-*`
pseudo-element enlarges the actual clickable/tappable box without
changing the visible circle/tile size or the layout. Used `-inset-2`
(+16px total) for isolated tiles with generous surrounding space, and
the smaller `-inset-1` (+8px total) for the three TopNav icons that sit
only `gap-3` (12px) apart, so their expanded hit areas don't overlap
each other.

Decorative, non-interactive elements at the same sizes (the `Toast`
accent dot, `AssistantPage`'s bot-icon `<span>`) were left alone — they
aren't tap targets.

## Post-Phase-7 follow-up — text-overflow audit (6.7)

Code-audited every place a user/product-controlled name or address
renders (grep for `.name`/`.fullName` interpolations across
`ProductListPage`, `ProductDetailPage`, `CartPage`, `CartDrawer`,
`WishlistPage`, `CheckoutPage`, `ProfilePage`). Card/grid contexts
already use `line-clamp-1`/`line-clamp-2`/`truncate` with a `min-w-0`
flex/grid ancestor (product cards, cart lines, the cart drawer, the new
wishlist grid); free-flowing panel contexts (profile fields, shipping
address blocks, the PDP `<h1>`) rely on normal text wrapping, which the
rule explicitly allows ("long addresses wrap"). No clipped-without-
wrapping case found.

## Post-Phase-7 follow-up — mobile sticky pay bar (4.4.5)

Below `lg`, the Price Summary `Panel` (with its Pay button) previously
sat in normal document flow after the address and items panels — a
buyer had to scroll past the whole form to reach "Place Order & Pay."
Added a mobile-only sticky pay bar (`sticky bottom-[76px]`, same pattern
as `ProductDetailPage`'s sticky add-to-cart bar, positioned above the
bottom tab bar) showing `Pay total` + amount and a `Pay now` button that
calls the exact same `placeOrder` handler — the create-order → Razorpay
modal → verify-payment flow itself is untouched, only reachability
changed. The in-panel desktop button is now `hidden lg:inline-flex` so
there's exactly one visible pay action per breakpoint, never two.

## Post-Phase-7 follow-up — real ETA card on OrderSuccessPage (4.5.7, partial)

The `checkout` summary endpoint's response already includes real
per-seller `shippingDetails[].time` estimates (computed by
`SellerShipping.calculateShipping`, e.g. `"3-5 Days"`) — data that was
sitting unused. `CheckoutPage` now picks the longest (worst-case) time
across sellers via `pickEstimatedTime()` and carries it through
`navigate('/orders/success', { state: { orderId, estimatedTime } })`;
`OrderSuccessPage` renders it as the spec's `ESTIMATED ARRIVAL` card,
only when a value was actually passed (no fabricated fallback).

4.5.7 stays unticked: the spec also wants a `Track` button linking to
`/orders/:orderId`, and that page still doesn't exist (no order-detail
endpoint — same blocker as `OrderTrackingPage`, section 4.6). Rather
than link to a page that would 404 or fake the button's destination,
the ETA card ships without a Track action.

## Post-Phase-7 follow-up — ProfilePage: real wishlist stat tile + verified badges

Two small real-data additions:

- A single stat tile (`rounded-[18px] border border-line p-3.75`, value
  `font-extrabold text-[19px]`, label `text-[10.5px] text-muted font-bold`,
  per 4.7.2's spec) showing the live wishlist item count from `GET
  /wishlist`, linking to `/wishlist`. Shows `—` while loading, never a
  fabricated `0`. Only one tile — Orders/Wallet stay out since neither
  has a backing endpoint.
- `Verified` badges next to Email/Phone when `profile.isEmailVerified`/
  `isPhoneVerified` are true — both fields were already being fetched
  from `GET /profile` and simply never rendered.

## Post-Phase-7 follow-up — checkout progress indicator (4.4.2, 4.4.9)

Reconsidered the earlier "no step state machine" deferral: the objection
was specifically about converting this single-page flow into a real
multi-step wizard (gating content behind steps), which is still correctly
out of scope — but a purely decorative progress indicator that reflects
where the buyer already is, without changing the page's structure or
gating anything, carries none of that risk.

Added `currentStep` (0 = address/summary still loading, 1 = a real
breakdown is showing and ready to pay, 2 = payment has been initiated —
`isPlacingOrder || isVerifying`), driving: a plain 3-bar `flex gap-2`
indicator on mobile per 4.4.2's exact spec (`h-[5px] rounded-full`,
`bg-accent`/`bg-line`), and a labelled dot-and-connector stepper on
desktop per 4.4.9. Both use the existing `t-base` transition utility so
the fill animates on step change, and neither adds new page states or
touches the actual payment call path — `placeOrder` is untouched.

## Post-Phase-7 follow-up — 5.12 checked off with the checkout stepper

The checkout progress indicator built above uses the shared `t-base`
transition utility (`all 0.25s cubic-bezier(...)`, the same timing used
for every other hover/state transition in this app) rather than a
bespoke `400ms`, so the fill animates on step change per 5.12's intent
with the app's standard transition speed instead of a one-off value.

## Post-Phase-7 follow-up — ProfilePage left-nav sidebar (4.7.13, partial; 4.7.14)

Reconsidered the earlier "same non-existent destinations as 4.7.3"
deferral — that was true when it was written, but 4.7.3's Orders +
Wishlist rows are real now (see the earlier follow-up). Added the
spec's left nav at `lg+`: `hidden lg:block lg:w-[250px] lg:border-r`,
real Orders/Wishlist links only, `rounded-[13px] px-3.5 py-3` rows with
the spec's hover treatment. The existing mobile menu-rows `Panel`
(4.7.3) now gets `lg:hidden` so the two don't both show at desktop.
`Container`'s max width grows to `lg:max-w-5xl!` only at `lg+` to make
room, leaving the mobile/tablet single-column width untouched.

Stays **partial** — the spec's right profile rail (`w-[300px] border-l
bg-soft2` holding the identity card + saved-addresses list) is not
built. Duplicating the identity/address cards that already live in the
center column into a second rail would be redundant rather than
simplifying anything, and no `active` nav-item state applies since this
sidebar lives only on `ProfilePage` itself (Orders/Wishlist are separate
routes, not sub-views of one shared account layout) — building that as
a real shared shell wrapping all three pages would be a real routing/
architecture change, out of scope for this pass. 4.7.15 (right rail's
mobile collapse behavior) stays unticked for the same reason — there's
no rail to collapse.

## Post-Phase-7 follow-up — tick 4.3.2, already fully matching spec

`CartPage`'s line-item markup already matches 4.3.2's spec exactly —
`rounded-card border border-line p-3 flex gap-3.25` (rounded/border from
the `Card` primitive's own base classes, `p-3`/`flex`/`gap-3.25`
explicit), `64×64` `ImageFrame` thumb, name/variant/total text sizes,
`QtyStepper` padding overridden to `px-2 py-1`, hover `border-accent
slide-x`. This was built during the original Phase-4 pass but the
checkbox was never checked off; just correcting the tracking, no code
change.

## Post-Phase-7 follow-up — Chip aria-pressed

Same fix as the admin app: the shared `Chip` primitive's `selected` prop
drove visual state only, with no ARIA state for screen readers. Added
`aria-pressed={selected}` to the component itself so every existing and
future `Chip` usage (category rail, sort/filter chips, address label
chips if they're ever built) picks it up automatically.

## Post-Phase-7 follow-up — top-level ErrorBoundary

Neither app had a React error boundary anywhere — an unhandled render
error in any component would white-screen the entire app with no
recovery path short of a manual URL edit. Not a Kartly-plan item, but a
real robustness gap in the same "cross-cutting hardening" spirit as the
tap-target/text-overflow/dead-controls audits. Added
`src/components/ErrorBoundary.tsx` (a class component — `componentDidCatch`
has no hook equivalent) wrapping `<Routes>` inside `<Router>` (kept
outside `ToastContainer` so a page crash doesn't also swallow toast
notifications), rendering a themed fallback with a "Reload page" button
instead of a blank screen.

## Post-Phase-7 follow-up — guard the axios token read against a blocked localStorage

`localStorage` can throw (privacy-mode storage blocking, some corporate
browser policies) — `userApi.ts`'s request interceptor read
`localStorage.getItem('userToken')` unguarded, so a throw there would
have failed every single API call before it was even sent, app-wide.
Wrapped in a `try/catch` that falls through to an unauthenticated
request instead. The per-page `localStorage.getItem` auth-guard checks
elsewhere are left unguarded — a throw there now hits the new
`ErrorBoundary`'s fallback rather than a blank screen, which is an
acceptable outcome for a rare edge case not worth 19 individual
try/catch additions.

## Post-Phase-7 follow-up — global 401 handling (expired/invalid token)

Another real gap: there was no response interceptor at all, so an
expired or invalid `userToken` meant every page's own fetch failed with
a generic "failed to load" toast and no path back to a working state
except manually navigating to `/login`. Added a response interceptor on
`userApi` that, on a `401`, clears the stored token and redirects to
`/login` — but only when a token was actually present (a `401` with no
stored token is the expected outcome of an anonymous action like adding
to cart while logged out, already handled per-page) and only when not
already on `/login`/`/signup` (so it can't create a redirect loop or
clobber a real invalid-OTP error shown on those pages). The rejection
still propagates to each page's own `catch`, so the existing "failed to
load" toast can still show briefly before the redirect completes — a
minor, acceptable overlap against the alternative of leaving the user
stuck.

## Post-Phase-7 follow-up — request timeout

`userApi` had no timeout configured (axios default is none), so a
dropped connection — not a 4xx/5xx, just no response ever arriving —
left a page's loading spinner stuck indefinitely with no recovery. Added
`timeout: 45000`, generous enough to not interrupt the production
backend's real cold-start delay (this app points at a Render free-tier
deployment, which sleeps the service after inactivity and can take real
time to wake). Every existing error handler already copes correctly —
a timeout produces an `AxiosError` with no `response`, so the
established `axios.isAxiosError(err) ? err.response?.data?.message ??
fallback : fallback` pattern used everywhere already falls through to
the same generic fallback message used for other network failures.

## Post-Phase-7 follow-up — race condition when navigating between products quickly

`ProductDetailPage`'s load effect had no protection against a real race:
navigating from one product straight to another (e.g. clicking a
related-product link before the first page finished loading) fires a
new fetch for the new `productId` while the previous one is still in
flight. If the *stale* fetch happened to resolve after the new one — not
unusual with network jitter — its response would silently overwrite the
correct, newer product's data, since nothing else re-triggers a reload
afterward. Added the standard guard: an `isCurrent` flag captured by the
effect's cleanup, checked before every `setState` call in the load
function, so a response for an abandoned `productId` is discarded
instead of applied.

## Post-Phase-7 follow-up — same race condition on ProductListPage

Same class of bug as `ProductDetailPage`'s fix, on the list page:
`loadProducts` re-runs on `page`/`search`/`category` changes with no
protection against two requests overlapping — a rapid double-click on
"Next page" (or fast category-chip switching) could let a stale
response land after a newer one and silently show the wrong page's
results. Added the same `isCurrent` guard.

## Post-Phase-7 follow-up — explicit double-submit guards

Same fix as the admin app: every submit/save/action handler already
disabled its trigger via the `disabled` attribute while a request was in
flight, but that only takes effect on React's *next* render, not
synchronously — a fast double-click or double Enter could still fire a
handler twice before then. Added an explicit guard as the first real
line of every handler (`placeOrder`, `submitLogin`, `submitRegister`,
`saveProfile`, `saveAddress`, `toggleWishlist`, `addToCart`,
`removeItem`, `updateQuantity`) — belt-and-suspenders on top of the
disabled attribute, not a replacement for it. `placeOrder` is the one
place in this app where this is genuinely consequential (a double-click
could otherwise create two Razorpay orders for the same cart).
`removeItem`/`updateQuantity` share one cart line's key, so each also
guards against the *other* action already being in flight for the same
line, not just itself.

## Post-Phase-7 follow-up — object-URL leak in ProfilePage's avatar preview

`ProfilePage.tsx` calls `URL.createObjectURL(file)` when the shopper picks a
new avatar image and stores the resulting `blob:` URL in `previewImage` for
the `<img>` preview. That URL was never revoked — picking a new image
after already staging one, or navigating away from the page mid-edit,
leaked the previous blob until the whole tab unloaded. Added a `useEffect`
right after the `previewImage` state declaration whose cleanup revokes it:

```tsx
useEffect(() => {
  return () => {
    if (previewImage) URL.revokeObjectURL(previewImage);
  };
}, [previewImage]);
```

Keyed on `previewImage` itself, so the *previous* URL is revoked both when
it's replaced by a new pick and on unmount (the cleanup for the effect run
holding the current value fires either way) — no extra revoke call needed
at each of the state's individual setters (cancel, re-pick, save-success).
Verified the actual upload (`formData.append('profileImage', imageFile)`)
sends the raw `File` object, never the `previewImage` string, so revoking
it can't affect a successful save.

## Post-Phase-7 follow-up — stray timer on ProductDetailPage's "Added" feedback

`addToCart` set a bare `setTimeout(() => setJustAdded(false), 900)` after
a successful add, to flip the button back from its "Added" state. Nothing
cleared it if the shopper navigated away within that 900ms window right
after adding an item — a harmless no-op `setState` on an unmounted
component today, but a stray timer nonetheless, and inconsistent with
every other timer in this app (`useCountdown`, the search debounce) which
are all cleared on unmount. Tracked the timeout id in a ref and added an
unmount-cleanup effect, matching the existing pattern:

```tsx
const justAddedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => () => {
  if (justAddedTimeoutRef.current) clearTimeout(justAddedTimeoutRef.current);
}, []);

// in addToCart, after a successful post:
setJustAdded(true);
if (justAddedTimeoutRef.current) clearTimeout(justAddedTimeoutRef.current);
justAddedTimeoutRef.current = setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS);
```

The extra `clearTimeout` before scheduling a new one also fixes a minor
edge case where clicking "Add to cart" twice in quick succession (once
the double-submit guard's window has passed, e.g. two separate adds of
different quantities) would otherwise leave two competing timers alive.

## Post-Phase-7 follow-up — closed a gap in CheckoutPage's double-submit guard

The `if (isPlacingOrder) return;` guard added in an earlier follow-up
(see above) was checked correctly, but `setIsPlacingOrder(true)` wasn't
called until *after* `await loadRazorpayScript()` — and the first time
that script tag doesn't already exist in the DOM, loading it is a real
network fetch, not an instant resolve. That left a wide window, on a
shopper's very first checkout in a tab, where `isPlacingOrder` was still
`false` and a second click on "Pay" would slip past the guard entirely
and fire a second `/order/create-order` call. Moved
`setIsPlacingOrder(true)` to immediately after the guard check, before
the `await`, with a matching `setIsPlacingOrder(false)` added to the
"payment gateway failed to load" early-return branch (the two existing
reset points — the create-order catch block, and the Razorpay modal's
`ondismiss` — were already correct and untouched). This is the one
double-submit guard in the app protecting a call that creates real
Razorpay orders, so it's worth being exact about, not just present.

## Backend fix (cross-repo) — stock could go negative under concurrent checkout

Found while re-auditing the checkout flow for correctness, not a
frontend change: the server's `createOrder` re-checks each variant's
stock right before the Razorpay modal opens, but `verifyPayment`
deducted stock afterward with an unconditional `$inc`. Those two points
are separated by however long the buyer spends completing payment —
long enough that two concurrent buyers for the last unit of something
could both pass `createOrder`'s check and both pay successfully, taking
stock negative once both payments verified. Fixed server-side
(`product_selling_app_server` commit `399a162`) by making the deduction
atomic and floor-safe (`stock: { $gte: quantity }` on the query) so it
can no longer go negative; an order that turns out to be oversold still
stays `PAID`/`CONFIRMED` (failing it after the customer's already been
charged would be worse) and gets logged server-side instead. Deciding
what to actively *do* about an oversold order — refund, backorder,
notify the seller — is a business-policy call, not something to invent
unilaterally, and is left as a follow-up need; this fix only stops the
underlying data corruption.

## Backend fix (cross-repo) — search 500'd on normal punctuation

Found the most impactful bug of this audit: `getAllProducts` built its
search filter as `new RegExp(search, 'i')` straight from the raw query
string. Any search term containing a regex metacharacter throws a
`SyntaxError` there instead of returning results — and this app's
`ProductListPage` search is debounced live-as-you-type, so a shopper
typing something as ordinary as `"Samsung (Galaxy"` hits an unbalanced
paren mid-keystroke and 500s the request before ever finishing the
word. Verified the exact crash (`Unterminated group`) before fixing.
Fixed server-side with a shared `escapeRegex()` utility applied at
every `new RegExp(userInput, ...)` call site across both the user- and
seller-facing product search/filter endpoints (`product_selling_app_server`
commit `c4f8ebb`) — no frontend change needed, this app was already
sending the right thing.

## Critical backend fix (cross-repo) — phone-only login could match the wrong user

The most severe bug found this session. This app's login flow accepts
*either* email or phone as the identifier — but `loginUser` and
`verifyOtpForLogin` on the backend both looked the user up with
`User.findOne({ $or: [{ email }, { phone }] })` unconditionally. When a
shopper logs in with phone only (leaving `email` as `undefined`),
Mongoose/the Mongo driver drop keys with an `undefined` value from a
query filter — so `{ email: undefined }` silently became `{}`, which
matches *every* document. The `$or` as a whole then matched every user
in the collection, and `findOne` returned whichever one the query
happened to return first — **not** the user who actually owns the
phone number entered. Concretely: `verifyOtpForLogin`'s lookup result
is who `generateAuthToken` issues a JWT for, so a phone-only login
could authenticate the caller as an arbitrary, unrelated account.
Verified with an isolated Mongoose query-casting test before and after
the fix — confirmed the unconditional `$or` really did produce
`{"$or":[{},{"phone":...}]}`, and the fix produces
`{"$or":[{"phone":...}]}`. Fixed server-side
(`product_selling_app_server` commit `3243884`) by building the `$or`
conditionally from only the identifiers actually supplied, mirroring
the pattern `registerUser` already used correctly for its own
uniqueness check in the very same file — this was a same-file
inconsistency, not a new rule. No frontend change needed.

## Backend fix (cross-repo) — Razorpay checkout modal's email prefill was always blank

`CheckoutPage.tsx`'s Razorpay `options.prefill.email` comes straight
from `data.data.user.email` in `create-order`'s response, which the
backend builds from `req.user.email`. `authenticateUser`'s
`User.findById(...).select(" isActive isDeleted ")` only ever returns
`_id` plus those two fields — a `.select()` with only inclusions
returns nothing else — so `req.user.email` was `undefined` on every
single checkout, regardless of whether the shopper actually had an
email on file. Swept every other `req.user.`/`req.seller.` field
access across the backend controllers to confirm this was the only one
relying on a field the auth middleware didn't select (everything else
only reads `._id`, always present regardless of projection). Fixed by
adding `email` to the middleware's select (`product_selling_app_server`
commit `0a55d47`). No frontend change needed — `CheckoutPage.tsx` was
already reading the right field, it just never had real data.

## Found, not fixed — SignUpPage's password is collected and silently discarded

A genuine finding, but a product decision rather than a bug fix, so
left as-is pending direction: `SignUpPage.tsx` collects a password
(`payload = { name, email, password }`, with a full show/hide toggle
UI) and sends it to `/auth/register`. The backend embeds it into the
short-lived registration JWT via `...otherFields`, and at the final
`verify-registration` step calls `User.create(userData)` — but the
`User` Mongoose schema (`product_selling_app_server/src/models/userModels/user.model.ts`)
**has no `password` field at all**. Mongoose schemas default to strict
mode, so `password` is silently dropped on create; grepped the entire
user-side backend (controllers + models) for any reference to
`password` and found none. Consistent with this: `loginUser` and
`verifyOtpForLogin` never check a password anywhere — this app's login
really is OTP-only, exactly as this file's own "Authentication flow"
section already documented above. So today, a shopper who sets a
password at signup has that password read, briefly carried inside a
signed-but-not-encrypted JWT that round-trips through their browser,
and then thrown away with nothing to show for it — it can never
actually be used to log in, and isn't stored anywhere for a future
password-login feature either. Two honest ways to resolve this, both
requiring an actual decision rather than a unilateral fix: (a) remove
the password field from this signup form entirely, matching the
OTP-only reality, or (b) actually persist and hash it if password-based
login is meant to exist as a fallback path (mirroring how the seller
side already does this correctly with bcrypt on `Seller.model.ts`).
Left unfixed rather than guessing which direction is intended.

## Post-Phase-7 follow-up — race condition on CartDrawer reopen

Missed in the earlier race-condition sweep because it's a component
triggered by a modal-open boolean, not a page keyed on a route param —
`CartDrawer.tsx` refetches `/cart/get-cart` every time `open` flips
true, with no guard against closing and quickly reopening the drawer
firing a second request before the first resolves. A slower first
response landing after the second could overwrite fresher cart data
with stale data. Added the same `isCurrent` guard pattern used
everywhere else in this app. Swept both apps for any other
open-boolean-triggered fetch with the same gap — found none (the
admin app's only comparable case, `ProductDetailsPage`'s Manage
Variant modal, pre-populates from already-loaded local state rather
than refetching on open, so it was never exposed to this).

## Known gap (cross-repo) — payment confirmation has no server-side fallback

Found while reviewing `.env.example`: `RAZORPAY_WEBHOOK_SECRET` is
declared there but grepping the entire backend for "webhook" turns up
nothing else — there is no Razorpay webhook route or handler
implemented at all. `CheckoutPage.tsx`'s flow (open Razorpay modal →
on success, `POST /order/verify-payment`) is the *only* path that ever
marks an order `PAID`/`CONFIRMED`. If the browser closes, the tab
crashes, or the network drops in the gap between Razorpay capturing
the payment and that `verify-payment` call completing, the shopper has
been charged but the order silently stays `CREATED`/`PENDING` forever
— nothing server-side is listening for Razorpay's own
`payment.captured` webhook event as a fallback. This is a real,
understood gap, not something to improvise a fix for here: a proper
webhook handler needs raw-body signature verification (the backend's
global `express.json()` middleware would otherwise consume the body
before a signature check could see it) and idempotent order/payment
reconciliation — a genuine feature to design and build, tracked as a
known gap in `product_selling_app_server`'s `.env.example` (commit
`4c8a585`) rather than attempted unilaterally.

## Post-Phase-7 follow-up — fixed a false claim on OrderSuccessPage

`OrderSuccessPage.tsx` told every shopper "We've sent the details to
your email" — but there is no email infrastructure anywhere in this
system (grepped the entire backend for nodemailer/sendgrid/smtp/mailer
and `package.json` for the same — nothing; matches this project's own
documented "no real email/SMS delivery" for OTPs). Unlike the OTP
screens' "sent to your email/phone" copy — which sits directly next to
a `Badge tone="warn"` dev-notice card showing the raw OTP, so it isn't
actually misleading in context — this claim had no such compensating
disclosure anywhere nearby. It was just a bare, false statement about
something that never happens, contrary to this project's own stated
discipline of honest states over fabricated ones. Changed to "Keep the
order ID above for reference," which is both true and still useful.

## Backend fix (cross-repo) — profile-photo upload had no size limit at all

Found while auditing the upload path behind `ProfilePage.tsx`'s avatar
picker: the backend's multer/Cloudinary storage config had no
`limits` option — an authenticated shopper could upload an
arbitrarily large file with nothing stopping it, consuming unbounded
bandwidth and Cloudinary storage per request. Checked this app's own
side too: `ProfilePage.tsx` has no client-side file-size check either,
so this was a total gap end to end, not a missing backstop behind an
existing client-side guard. Fixed server-side with a generous 10MB
ceiling (`product_selling_app_server` commit `f6d8106`) — large enough
that no legitimate photo is ever affected, so no frontend change was
needed or made.

## Post-Phase-7 follow-up — ImageFrame didn't actually handle a broken image

The component's own doc comment claimed it falls back to the hatched
placeholder for a "broken/absent" image, but the implementation only
ever checked `!src` (absent) — a `src` that's present but fails to
load (a deleted Cloudinary asset, a malformed URL, a network failure)
rendered the browser's raw broken-image icon instead, contrary to what
the component claimed to do. Added an `onError` handler plus a
`failed` state flag that gates the placeholder branch alongside `!src`.
The one real subtlety: `ProductDetailPage`'s gallery reuses a single
`ImageFrame` instance across a *changing* `src` as the shopper clicks
between thumbnails, so `failed` needed resetting on every `src` change
— otherwise one broken thumbnail would incorrectly blank out every
other, perfectly-fine image switched to afterward. Used React's
"adjust state during render" pattern (track the `src` a `failed` flag
applies to, compare and reset directly in the render body when it
changes) rather than a `useEffect` reset, since the admin app's
`react-hooks/set-state-in-effect` rule rejects the effect version
outright, and the render-time version avoids an extra render cycle on
every image switch anyway — applied identically to both apps' copies
of this component for consistency.

## Post-Phase-7 follow-up — the nav cart badge never updated after the first load

A significant, highly-visible bug: `AppLayout`'s own doc comment says
it's "rendered once by the router so navigating between pages does not
remount the chrome," and `useCartCount()`'s `useEffect` only depends on
`isLoggedIn` — a value read once from `localStorage` and effectively
frozen for the session. Combined, this meant the `/cart/get-cart` fetch
behind the `TopNav`/`BottomTabBar` badge ran *exactly once* for the
whole session. Adding an item, removing one, changing quantity, or
completing checkout (which clears the cart server-side) never touched
that count again — the badge just froze at whatever it showed on first
load, for the rest of the session, until a full page reload.

This app has no global state management by design, so rather than
introduce one just for this, added a plain `window` custom event
(`notifyCartChanged()` / a `kartly:cart-changed` listener, both in
`useCartCount.ts`) — every real cart-mutating call site now calls
`notifyCartChanged()` after a successful request: `ProductDetailPage`'s
`addToCart`, `CartPage`'s `removeItem` and `updateQuantity` (both
increment and decrement branches — a decrement can empty a line and
change the distinct-item count the badge is based on), and
`CheckoutPage`'s payment-success handler (the cart is cleared
server-side once `verify-payment` succeeds). Grepped for every
`/cart/add-to-cart` and `/cart/remove-from-cart` call site to confirm
all of them are now covered.

While rewriting the hook to support being re-triggered by the event
(not just once on mount), also closed a related race: `load()` can now
fire repeatedly (mount + every event), and a plain per-effect
`isCurrent` flag would only have guarded against unmount, not two of
these calls landing out of order relative to each other (e.g. two fast
cart edits). Added a `requestId` counter so only the most recently
*started* call is allowed to commit its result.

## Backend fix (cross-repo) — cart-value-gated offers checked the wrong number

Found while re-auditing offer resolution: `calculateBestPrice`'s
`minCartValue` gate (a seller-configured "spend over ₹X" threshold)
was checked against a single item's own price, not the actual cart or
order total — even in `getCart`, `checkout`, and `createOrder`, all of
which have a real cart total available. A cart of five ₹500 items
totalling ₹2500 would never qualify for a "spend ₹2000+" offer, since
no single item alone reached ₹2000 — defeating the entire point of a
cart-value-gated offer for every shopper on this app whose qualifying
purchase was spread across multiple items, which is the normal case.
Fixed server-side (`product_selling_app_server` commit `5221b1d`) by
threading the real pre-discount cart subtotal through to
`findApplicableOffers` from all three real-cart call sites; the two
product-browsing endpoints (which have no cart to check against yet)
keep the old per-item approximation, unchanged. No frontend change
needed — `CartPage.tsx`/`CheckoutPage.tsx` already just display
whatever `discountedPrice` the backend returns.

## Post-Phase-7 follow-up — added a 404 page (there was no catch-all route)

`App.tsx` had no `path="*"` route. In React Router v6, a path-less
parent `<Route>` — which is exactly what `AppLayout`'s wrapper route
is — only ever matches when one of its nested children's path matches
the current URL; it doesn't match everything by default. With no
catch-all anywhere, any unmatched URL (a typo, a stale bookmark, a
broken external link) rendered `<Routes>` down to nothing at all: a
completely blank white screen, no nav chrome, no message, no way back
into the app short of manually editing the address bar. Added
`NotFoundPage.tsx` (reuses the existing `EmptyState` primitive,
consistent with every other empty/missing state in this app) and wired
it as a top-level `path="*"` route, outside `AppLayout` so it renders
regardless of auth state, with a single "Back to shopping" action.

## Post-Phase-7 follow-up — every page now has a real document.title (13/13)

`document.title` was never touched anywhere — every page showed the
same static "Kartly | ShopNow" from `index.html` regardless of which
page was actually open, so browser tabs, history entries, and
bookmarks were all indistinguishable. Added a small
`useDocumentTitle(title)` hook (`src/hooks/useDocumentTitle.ts` — sets
the title on mount, restores the previous value on unmount) and called
it from all 13 pages, including `NotFoundPage`. `ProductDetailPage`
uses the loaded product's name (falling back to "Product" before it
loads); every other page uses a fixed, page-appropriate title.

## Post-Phase-7 follow-up — added a skip-to-content link (WCAG 2.4.1)

Neither this app nor its shared components had a skip link anywhere.
`AppLayout` is the persistent shell wrapping every authenticated page
— its `TopNav` (category links, search, cart, profile) repeats
identically on every single navigation, so without a way to bypass it,
a keyboard or screen-reader user had to tab through the full nav on
every page before ever reaching that page's actual content. Added a
"Skip to content" link as the very first element in `AppLayout`,
visually hidden until focused (`sr-only focus:not-sr-only`, matching
the standard pattern), pointing at a new `id="main-content"` on the
`<main>` element. Left the pre-login routes (`WelcomePage`, `LoginPage`,
`SignUpPage`, via `AuthLayout`) alone — their nav chrome is a single
brand-mark link at most, not a repeating multi-item nav, so the
bypass burden a skip link solves for doesn't really apply there.

## Post-Phase-7 follow-up — two more toggle-button accessibility gaps

Found while sweeping for the same "disclosure toggle with no state
reflected to assistive tech" class as the admin app's hamburger fix
(see its notes): `ProductDetailPage.tsx`'s description "See details" /
"Show less" button had no `aria-expanded` (its changing label already
conveys state reasonably, but the ARIA Authoring Practices Guide
specifically calls for `aria-expanded` on this exact "show more"
pattern) — added it.

More seriously, `SignUpPage.tsx`'s show/hide-password button had
`tabIndex={-1}`, which doesn't just deprioritize it in the tab order —
it removes a real, interactive `<button>` from keyboard reachability
entirely. A keyboard-only user could never toggle password visibility
on this form; the mouse was the only way to reach it. Removed the
`tabIndex={-1}` (native buttons are focusable by default, so this
needed removing, not replacing), added `aria-pressed={showPassword}`
(the correct role for a toggle button, matching the `Chip` primitive's
existing pattern), and added the standard `focus-visible` ring styling
used everywhere else in this app — the button had none at all, so even
once reachable it would have been focused with no visible indicator.
Checked: this is the only password-visibility toggle in either app
(the user client's `LoginPage` has no password field at all — login is
OTP-only — and the admin app's password fields have no visibility
toggle to begin with), so this was an isolated instance, not a
recurring pattern.

## Post-Phase-7 follow-up — two placeholder-only inputs missing aria-label

An earlier round added `aria-label` to search inputs relying on
placeholder-only text as their only visual label, but missed two:
`ProductListPage.tsx`'s actual search `<input>` (as opposed to
`TopNav.tsx`'s mobile search *icon link*, which already had one) and
`AssistantPage.tsx`'s demo chat input. Added `aria-label="Search
products"` and `aria-label="Ask the assistant"` respectively. Verified
(not changed, already correct) `ProfilePage.tsx`'s "Set as default"
checkbox — it's properly wrapped in a `<label htmlFor>`.

## Post-Phase-7 follow-up — form error messages weren't linked to their fields

`Input.tsx`, `Textarea.tsx`, and `Select.tsx` — the three shared form
primitives every form in this app is built from — each correctly set
`aria-invalid={!!error}` and rendered the error text visually below
the field, but never linked the two together with `aria-describedby`.
A screen reader user landing on an invalid field heard that it was
invalid, but not *why* — the error text had no programmatic connection
to the field at all, only proximity on screen. Added an `errorId`
(`${fieldId}-error`) to all three components: the error `<p>` now
carries that `id`, and the field carries `aria-describedby={error ?
errorId : undefined}` pointing at it. This fixes every form across the
whole app at once, since they're all built from these three
primitives — no page-level changes needed.

## Post-Phase-7 follow-up — removed an orphaned Modal component

Swept for genuinely-unused components (following the admin app's
`Toolbar.tsx`/`Button.tsx` cleanups) and found `Modal.tsx` has zero
imports anywhere in this app. Unlike those admin-app cases, this one
needed real judgment: `Sheet.tsx` (a bottom-sheet on mobile, a
right-side drawer on desktop, sharing the same `useDialogBehavior`
hook `Modal` used) is this app's actual, actively-used dialog
primitive — `CartDrawer` and `ProfilePage`'s address form both use it.
`Modal` was just a different visual presentation (a centered box) of
the exact same underlying behavior, and unlike `QueueList.tsx`/
`BarChart.tsx` in the admin app's notes, nothing here documents it as
the intended implementation for a specific feature still blocked on a
missing backend endpoint — it's a superseded, generic alternative this
app has simply never needed, not scaffolding for something not yet
buildable. Deleted it. Left `PromoCard.tsx` alone despite also having
zero current usage: it was actively edited in an earlier dark-mode
color-token fix (see the entry above), suggesting real intended use
rather than leftover scaffolding, and its name suggests a specific
promotional-content purpose that may still be planned — not enough
evidence either way to justify deleting it, unlike `Modal`.
`useDialogBehavior.ts` stays untouched; `Sheet.tsx` still needs it.

## Post-Phase-7 follow-up — oxlint was stale and missing real rule coverage

Worth its own entry: this session's own earlier summary documents
fixing `react-hooks/refs`/`set-state-in-effect`/`purity` violations,
but all of those were in the *admin* app's ESLint setup — checking
this app's actual effective oxlint config (`oxlint --print-config`)
found `react/refs`, `react/purity`, and `react/set-state-in-effect`
genuinely absent from the installed version (1.71.0), leaving a real
gap versus what the admin app's linter catches for the equivalent
React-Compiler-era hook-safety issues. The declared range in
`package.json` (`^1.69.0`) already permitted 1.80.0 — this was a
stale install, not a version-constraint change. Updated via `npm
update oxlint` (a devDependency, no runtime/build risk); the newer
version adds those three rules plus several more (21 `react/*` rules
before, 33 after).

Running the full lint with the upgraded version immediately surfaced
one real, previously-invisible violation: `CartDrawer.tsx` called
`setIsLoading(true)` synchronously at the top of its effect body —
code from *this same session's* earlier cart-badge race-condition
fix, that the old oxlint version simply couldn't have caught. Fixed
by routing it through `requestAnimationFrame`, matching the exact
pattern `StatCard.tsx`'s `useCountUp` already uses for the same rule.
A useful reminder that "the linter is clean" is only as strong a
signal as the linter's actual, currently-installed rule set — worth
periodically checking `--print-config` against what a fix is assumed
to be protected by, not just assuming version pins stay current on
their own.

## 2026-09-09 — wishlist remove endpoint added, page/toggle no longer read-only

`WishlistPage.tsx` has carried an explicit "read-only, no remove
endpoint yet" note since its Kartly migration, and
`ProductDetailPage.tsx`'s `toggleWishlist` was genuinely add-only —
its guard clause (`isWishlisted && return`) made a second click on an
already-saved product a silent no-op, despite the button's own
`aria-pressed`/label already implying a real toggle. Re-checked
`product_selling_app_server/src/routes/user.routes/wishList.routes.ts`
directly rather than assuming the earlier note was still accurate (the
same discipline this file's Phase-7 entries used for other "endpoint
doesn't exist" claims) — confirmed only `POST /add` and `GET /` existed.

Added `DELETE /wishlist/remove/:productId` server-side
(`removeProductFromWishList`, mirroring `addProductToWishList`'s auth
guard and `mongoose.isValidObjectId()` validation, scoped to the
authenticated user via `WishList.findOneAndDelete({ userId, productId
})`) — see `product_selling_app_server` commit `f7a7ff3`. Wired both
consumers here: `toggleWishlist` now really toggles, and
`WishlistPage.tsx` gained a per-card remove (X) button.

One real correctness issue caught while wiring the remove button: the
first draft put it *inside* the card's `<Link>` (matching
`ProductListPage.tsx`'s `Card as={Link}` pattern), which would have
nested a `<button>` inside an `<a>` — invalid HTML, since both are
interactive content, and something browsers handle inconsistently by
implicitly closing the anchor early. `ProductListPage`'s card has no
second interactive control, so it never hit this. Restructured so the
remove button is a sibling of the `Link`, not a child — the `Link`
wraps only the image/text, `Card` itself stays a plain `div`.

Verified with `npm run build` (server + this app, both clean) and
`npm run lint` (only the 2 pre-existing `only-export-components`
warnings, unrelated).

## 2026-09-09 — CRITICAL: the entire checkout flow was calling the wrong URL

Found immediately after fixing the identical bug class in the admin
app (`product_selling_app_clinet_admin` commit `c509c70`,
`/offer/create-offer` vs the real `/offers` mount) — prompted a
systematic re-check of every `userApi`/`sellerApi` call site in both
frontend apps against the actual backend route mounts, rather than
trusting that this session's earlier, extensive checkout-related
review (cart-total offer gating, atomic stock deduction on
`verifyPayment`, the auth `$or` fix, etc.) had ever exercised the real
URL — it hadn't; that review was all controller-level, and no browser
tool has been available in this environment to click through the app.

`CheckoutPage.tsx` called `userApi.post('/order/checkout', ...)`,
`'/order/create-order'`, and `'/order/verify-payment'` — singular
`order` — but `src/routes/user.routes/userRoute.ts` mounts
`order.routes.ts` at `/orders` (plural). Every checkout summary
calculation, order creation, and post-Razorpay payment verification
through the real UI has been hitting a 404 since this page was built.
This is likely the single most severe bug found in this app across
every session's worth of migration work — worse than the earlier
auth `$or` bug, because that one only widened who could log in;
this one meant no purchase could complete at all through the actual
frontend, full stop.

Fixed all three call sites to `/orders/checkout`, `/orders/create-order`,
`/orders/verify-payment`. Grepped every remaining call site in this
app (auth, profile, products, cart, wishlist) against its real mount
to rule out further instances — none found; this was isolated to
`CheckoutPage.tsx`.

Verified with `npm run build` (clean) and `npm run lint` (only the 2
pre-existing `only-export-components` warnings, unrelated). No
automated or manual browser test could confirm the fix end-to-end
against a live Razorpay flow in this environment — the fix is
verified as "now matches the real route," not as "a real payment was
completed," and should get a real click-through pass when one is
possible.

## Backend fix (cross-repo) — verifyPayment wasn't idempotent

Prompted directly by the `/order` vs `/orders` fix above — having just
audited the checkout flow's URLs, re-examined `verifyPayment`'s
authorization/idempotency properties too, since it's the financially
critical endpoint at the end of the same flow this page's
`handler` callback calls.

Nothing stopped `verifyPayment` from running its full body — including
the stock-deduction loop — more than once for the same order. This
page's own Razorpay `handler` isn't guaranteed exactly-once by
Razorpay's own docs, and a network retry or replayed request with the
same still-valid signature would each succeed and deduct stock again
for an order already paid and already stocked-out for. Fixed
server-side by returning early once a payment is found already `PAID`,
before re-verifying or re-deducting — see
`product_selling_app_server` commit `ef55abb`. No change needed here;
this page's own retry behavior (there isn't any — one `handler` call
per successful Razorpay checkout) was never the problem, the backend's
missing guard was.

## Backend fixes (cross-repo) — malformed-id CastErrors across the user-facing API

A batch of related fixes in `product_selling_app_server`, all the same
pattern: a malformed Mongo id (not valid ObjectId hex) reaching a
`findOne`/`findOneAndUpdate`/`$in` query unguarded throws a Mongoose
CastError, caught by that function's own generic catch block and reported
as a 500 instead of a clean 400/404. First found and fixed in
`getProductById` and `addProductToWishList` earlier this session; a
systematic sweep of every controller touching `req.params`/`req.body`
found and fixed three more instances that affect this app directly:
`addToCart`/`removeFromCart` (cart controller, commit `7fdce44`) and
`editShippingAddress` (profile controller, commit `abb702c` — this app's
own `ProfilePage.tsx` address-edit flow). No frontend change needed for
any of these — this app already only ever sends real ObjectIds it got
from its own prior API responses; the fixes matter for a malformed direct
API call, or a future bug elsewhere that ends up sending a bad id.

Verified with `npm run build` (server, clean) for each.

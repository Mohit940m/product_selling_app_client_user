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
- **4.2.13/4.2.14 desktop cart drawer** — needs a cart-refetch-after-add
  flow and a new `CartDrawer` component; deferred rather than shipping a
  drawer that doesn't reflect real cart state.

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
- **4.7.7 dashed "+ Add new address" CTA block, 4.7.10 Home/Work/Other
  label chips, 4.7.12 delete confirmation** — the backend's address
  shape (`UserAddress`) has no `label` field and there is exactly one
  slot, added via `POST /profile/address` or replaced via
  `PUT /profile/address/:id` — there's nothing to label or delete from a
  list of one.
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

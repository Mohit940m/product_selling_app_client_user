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

- **4.2.1 wishlist heart** — the floating back tile is now built (see the
  post-Phase-7 follow-up below); the heart stays dropped entirely, since no
  wishlist endpoint is wired into this frontend anywhere
  (`grep -rn wishlist src/` is empty), so a heart button would have
  nothing to call.
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

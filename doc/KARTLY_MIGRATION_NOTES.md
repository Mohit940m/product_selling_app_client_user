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

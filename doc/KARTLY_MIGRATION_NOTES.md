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

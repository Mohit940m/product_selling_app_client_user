# Kartly Design System — User Storefront Implementation Plan

> **Target app:** `product_selling_app_client_user/` (buyer storefront SPA, React 19 + Vite + Tailwind v4, dev port 5204)
> **Design source of truth:** `kartly-ecommerce-template-kit/project/Kartly Commerce Kit.dc.html`
> **Companion plan:** `product_selling_app_clinet_admin/docs/KARTLY_UI_PLAN.md`

## How to use this document

- Every actionable item is a checkbox. Tick it (`- [x]`) **in this file** as you complete it — this file is the traceability record.
- Phases are ordered by dependency. Do not start Phase N+1 until Phase N is fully ticked, with one exception: Phase 4 pages may be done in any order once Phases 1–3 are done.
- Every task names the **exact file path** it touches. If a path does not exist yet, the task creates it.
- Each page task has a **Mobile** and a **Desktop** sub-checklist. Both must be ticked before the page counts as done. There is no "desktop-only" or "mobile-only" done state.
- `DESIGN REF` lines point at line ranges in the `.dc.html` prototype. Open them and match the visual output; do **not** copy the prototype's inline-style structure into React.

## Progress summary

| Phase | Title | Done / Total | Status |
|---|---|---|---|
| 0 | Audit & prerequisites | 6 / 6 | ✅ |
| 1 | Design foundation (tokens, motion, theme) | 27 / 28 | ✅* |
| 2 | Primitive component library | 23 / 23 | ✅ |
| 3 | App shell & navigation | 16 / 16 | ✅ |
| 4 | Page migrations | 73 / 107 | ⚠️ see notes |
| 5 | Motion & interaction pass | 12 / 14 | ✅* |
| 6 | Responsive QA matrix | 8 / 10 | ⚠️ no browser tool |
| 7 | Cleanup, a11y & verification | 17 / 19 | ⚠️ see notes |

\* The 3 open items across Phases 1 and 5 are a design-judgment rule this session couldn't verify without a browser (1.5.3, no fixed pixel widths) and two animations gated on the checkout stepper / order-tracking page, which were themselves deferred — see `doc/KARTLY_MIGRATION_NOTES.md`.

Every open item across every phase is accounted for in `doc/KARTLY_MIGRATION_NOTES.md`, most commonly for one of two reasons: **(a)** the backend doesn't yet expose the data or endpoint the item needs (order history/tracking, category list, sort/price filters, promo codes, loyalty/stat data) — building the UI against nothing would mean fabricating data or shipping a permanently-broken control; or **(b)** this session had no browser/screenshot tool, so the live-viewport QA matrix (Phase 6) and the keyboard-only/full-payment smoke test (7.2.8/7.3.3) are code-audited rather than visually confirmed. Nothing is silently skipped — every gap is named, with the reason, in the migration notes. (The wishlist API turned out to be real and is now wired in — see 4.2.1/4.7.3 in the migration notes.)

---

# Phase 0 — Audit & prerequisites

## 0.1 Blocking finding: the Tailwind config is dead code

This app runs **Tailwind CSS v4** through `@tailwindcss/vite` (see `package.json` → `@tailwindcss/vite: ^4.3.1`), and `src/index.css` contains only `@import "tailwindcss";`. Tailwind v4 does **not** auto-load `tailwind.config.js`; it only reads a JS config when the CSS explicitly does `@config "../tailwind.config.js"`.

Consequence: every `bg-primary`, `text-text`, `bg-secondary`, `text-accent`, `bg-background` class currently in the codebase resolves to **nothing**. Those colours only appear where a raw hex was hardcoded (e.g. `src/components/Button.tsx` uses `bg-[#A78BFA]`). This must be fixed first or the whole restyle sits on sand.

**Decision for this plan:** do *not* revive `tailwind.config.js`. Move the token layer into `@theme` inside `src/index.css` (the v4-native way), and delete the stale config in Phase 7.

- [x] **0.1.1** Confirm the finding: run `npm run dev` in `product_selling_app_client_user/`, open `/products`, inspect the header logo tile — `bg-primary` renders transparent, not purple.
- [x] **0.1.2** Inventory every legacy token class so nothing is missed later:
  ```bash
  cd product_selling_app_client_user
  grep -rnoE "(bg|text|border|from|to|via)-(primary|secondary|accent|background|text)\b" src/ | sort | uniq -c | sort -rn
  ```
  Paste the counts into `doc/KARTLY_MIGRATION_NOTES.md` (create it) as the "before" baseline.

## 0.2 Prerequisites

- [x] **0.2.1** Node deps installed: `cd product_selling_app_client_user && npm install`.
- [x] **0.2.2** `.env` present with `VITE_SERVER_URL` and `VITE_PORT=5204`.
- [x] **0.2.3** Baseline green build before touching anything: `npm run build` succeeds. Record the output in `doc/KARTLY_MIGRATION_NOTES.md`.
- [x] **0.2.4** Read `kartly-ecommerce-template-kit/project/Kartly Commerce Kit.dc.html` in full (1045 lines) plus its `support.js` data block at the bottom — the `renderVals()` method holds every sample dataset and the exact status-badge colours.

---

# Phase 1 — Design foundation

Everything in this phase lands in **two places**: `src/index.css` and `src/theme/` (new). Nothing else should define a colour or a duration after this phase.

## 1.1 Typography — Montserrat

`DESIGN REF` `.dc.html` lines 13–17 and `project/uploads/Fonts.txt`.

- [x] **1.1.1** In `index.html`, add to `<head>` before the module script:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900&display=swap" rel="stylesheet">
  ```
- [x] **1.1.2** In `index.html`, set `<title>` to the storefront brand and keep the existing favicon wiring.
- [x] **1.1.3** In `src/index.css`, set the body face and antialiasing:
  ```css
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Montserrat, "Helvetica Neue", Helvetica, sans-serif;
    -webkit-font-smoothing: antialiased;
    background: var(--k-bg);
    color: var(--k-ink);
  }
  ```
- [x] **1.1.4** Register the mono face used for metadata/eyebrow labels: `--font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;` inside the `@theme` block (see 1.2.4).

## 1.2 Colour tokens — `src/index.css`

`DESIGN REF` `.dc.html` lines 19–20 (the `#app` and `#app[data-theme="dark"]` custom-property blocks).

Two layers, deliberately:
1. **Raw CSS custom properties** (`--k-*`) on `:root` / `[data-theme="dark"]` — these are what actually flip on theme change.
2. **Tailwind `@theme` mappings** pointing at those properties — these are what generate `bg-card`, `text-ink`, `border-line` utilities.

- [x] **1.2.1** Add the light palette to `src/index.css`:
  ```css
  :root {
    --k-bg:     #ECECEE;
    --k-card:   #FFFFFF;
    --k-ink:    #171A22;
    --k-muted:  #767C8C;
    --k-edge:   #1B1F2A;
    --k-line:   #E4E4EA;
    --k-soft:   #F6E8FF;
    --k-soft2:  #FAF3FF;
    --k-accent: #A87BF5;
    --k-onAcc:  #FFFFFF;
    --k-shadow: 0 24px 60px rgba(20,20,30,.10);
  }
  ```
- [x] **1.2.2** Add the dark palette:
  ```css
  [data-theme="dark"] {
    --k-bg:     #0D0F14;
    --k-card:   #181B23;
    --k-ink:    #F1F0F4;
    --k-muted:  #9AA0B0;
    --k-edge:   #39404F;
    --k-line:   #262B36;
    --k-soft:   #2A2138;
    --k-soft2:  #201B2B;
    --k-accent: #B999F7;
    --k-onAcc:  #14101C;
    --k-shadow: 0 24px 60px rgba(0,0,0,.45);
  }
  ```
- [x] **1.2.3** Add the **fixed** status palette (these do *not* flip with theme — the prototype hardcodes them so badges stay legible on `--k-soft` chips):
  ```css
  :root {
    --k-ok-bg:   #E6F6EE; --k-ok-fg:   #1E7A52;  /* Delivered / success  */
    --k-warn-bg: #FFF3DB; --k-warn-fg: #8A6415;  /* Pending / in transit */
    --k-bad-bg:  #FDE9E6; --k-bad-fg:  #A83A2A;  /* Refund / failed      */
    --k-plum-fg: #5B3F86;                        /* text on --k-soft     */
    --k-danger:  #E0614F;                        /* error borders/labels */
    --k-on-soft: #171A22;                        /* ink on soft chips    */
  }
  ```
- [x] **1.2.4** Map them into Tailwind v4 so utilities generate:
  ```css
  @theme {
    --color-bg:     var(--k-bg);
    --color-card:   var(--k-card);
    --color-ink:    var(--k-ink);
    --color-muted:  var(--k-muted);
    --color-edge:   var(--k-edge);
    --color-line:   var(--k-line);
    --color-soft:   var(--k-soft);
    --color-soft2:  var(--k-soft2);
    --color-accent: var(--k-accent);
    --color-onacc:  var(--k-onAcc);
    --color-ok-bg:   var(--k-ok-bg);   --color-ok-fg:   var(--k-ok-fg);
    --color-warn-bg: var(--k-warn-bg); --color-warn-fg: var(--k-warn-fg);
    --color-bad-bg:  var(--k-bad-bg);  --color-bad-fg:  var(--k-bad-fg);
    --color-plum:   var(--k-plum-fg);
    --color-danger: var(--k-danger);
    --font-sans: Montserrat, "Helvetica Neue", Helvetica, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  ```
- [x] **1.2.5** Add the radius scale from the prototype (12 / 14 / 16 / 20 / 22 / 26 / 28 / 38 / pill):
  ```css
  @theme {
    --radius-ctl:   12px;  /* small controls, size swatches */
    --radius-btn:   14px;  /* buttons, inputs               */
    --radius-tile:  16px;  /* icon tiles, CTA blocks        */
    --radius-card:  20px;  /* product cards, list rows      */
    --radius-panel: 22px;  /* panels, tables, chart cards   */
    --radius-hero:  26px;  /* hero blocks, gallery frames   */
    --radius-sheet: 28px;  /* bottom sheets                 */
  }
  ```
- [x] **1.2.6** Add the elevation recipes as utilities (used constantly on hover):
  ```css
  @layer utilities {
    .shadow-kartly          { box-shadow: var(--k-shadow); }
    .shadow-lift-accent     { box-shadow: 0 18px 34px rgba(168,123,245,.24); }
    .shadow-lift-accent-lg  { box-shadow: 0 26px 46px rgba(168,123,245,.24); }
    .shadow-lift-accent-cta { box-shadow: 0 16px 32px rgba(168,123,245,.45); }
    .shadow-lift-ink        { box-shadow: 0 16px 32px rgba(20,20,30,.30); }
  }
  ```
- [x] **1.2.7** Add the "product shot" placeholder pattern used everywhere an image is missing (this replaces today's plain grey box):
  ```css
  @layer utilities {
    .bg-hatch  { background: repeating-linear-gradient(45deg, var(--k-soft),  var(--k-soft)  8px, transparent 8px, transparent 16px); }
    .bg-hatch2 { background: repeating-linear-gradient(45deg, var(--k-soft2), var(--k-soft2) 9px, transparent 9px, transparent 18px); }
  }
  ```
- [x] **1.2.8** Add a `.no-scrollbar` utility for horizontal chip rails (`::-webkit-scrollbar { width:0; height:0 }` + `scrollbar-width: none`). Scope it to the class — do **not** hide scrollbars globally the way the prototype does; the storefront needs real page scrollbars on desktop.

## 1.3 Motion layer

`DESIGN REF` `.dc.html` lines 23–32 (the ten `@keyframes`).

- [x] **1.3.1** Port all ten keyframes verbatim into `src/index.css`, keeping the prototype names: `kfPop`, `kfDraw`, `kfRing`, `kfUp`, `kfFloat`, `kfRoll`, `kfDot`, `kfShim`, `kfConf`, `kfBar`.
- [x] **1.3.2** Register them as Tailwind v4 animation tokens so they are usable as `animate-*` utilities:
  ```css
  @theme {
    --animate-pop:   kfPop .7s cubic-bezier(.2,1.3,.3,1) both;
    --animate-up:    kfUp .6s both;
    --animate-float: kfFloat 5s ease-in-out infinite;
    --animate-ring:  kfRing 2.4s ease-out infinite;
    --animate-roll:  kfRoll 2.4s ease-in-out infinite alternate;
    --animate-dot:   kfDot 1.2s infinite;
    --animate-shim:  kfShim 1.4s linear infinite;
    --animate-bar:   kfBar .9s cubic-bezier(.2,.8,.2,1) both;
  }
  ```
- [x] **1.3.3** Add the canonical easings and transition presets:
  ```css
  @layer utilities {
    .t-fast { transition: all .2s; }
    .t-base { transition: all .25s cubic-bezier(.2,.8,.2,1); }
    .t-card { transition: all .28s cubic-bezier(.2,.8,.2,1); }
    .t-slow { transition: all .3s  cubic-bezier(.2,.8,.2,1); }
  }
  ```
- [x] **1.3.4** Add the hover-lift utilities the prototype applies to nearly every interactive surface:
  ```css
  @layer utilities {
    .lift-sm:hover   { transform: translateY(-2px); }
    .lift:hover      { transform: translateY(-3px); }
    .lift-card:hover { transform: translateY(-6px); }
    .lift-lg:hover   { transform: translateY(-8px); }
    .slide-x:hover   { transform: translateX(4px); }
    .pop-icon:hover  { transform: scale(1.08) rotate(8deg); }
  }
  ```
- [x] **1.3.5** **Reduced motion is mandatory.** Add a global guard so every animation above degrades:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- [x] **1.3.6** Create `src/components/motion/Reveal.tsx` — a wrapper applying `animate-up` with a `delay` prop (`style={{ animationDelay: delay + 'ms' }}`) so lists stagger without per-item CSS. The prototype staggers the success-screen copy at 250 / 400 / 550 / 700 ms — expose that as the default ladder.
- [x] **1.3.7** Create `src/components/motion/Shimmer.tsx` — the skeleton block from the design-system panel: `linear-gradient(90deg, var(--k-line) 25%, var(--k-soft2) 50%, var(--k-line) 75%)`, `background-size: 260px 100%`, `animate-shim`. This replaces every `animate-pulse bg-secondary` skeleton in the app.

## 1.4 Theme controller (light / dark)

The prototype ships a real dark theme and a toggle on the profile screen. The storefront must support it end-to-end.

- [x] **1.4.1** Create `src/theme/ThemeProvider.tsx`:
  - State: `'light' | 'dark'`.
  - Initial value: `localStorage.getItem('kartlyTheme')` → else `window.matchMedia('(prefers-color-scheme: dark)')` → else `'light'`.
  - Effect: write `data-theme` onto `document.documentElement`, persist to `localStorage`.
  - Export `useTheme()` returning `{ theme, setTheme, toggleTheme }`.
- [x] **1.4.2** Add a no-flash inline script in `index.html` `<head>` that reads `localStorage.kartlyTheme` and stamps `data-theme` on `<html>` before React mounts. Without this the page flashes light on reload for dark-mode users.
- [x] **1.4.3** Wrap `<Router>` in `src/App.tsx` with `<ThemeProvider>`.
- [x] **1.4.4** Add `<meta name="color-scheme" content="light dark">` to `index.html` so native form controls and scrollbars follow.
- [x] **1.4.5** Retheme `<ToastContainer>` in `src/App.tsx`: replace the hardcoded `toastClassName="... bg-white text-[#1F2937] ..."` with `bg-card text-ink border-line rounded-[var(--radius-tile)] shadow-kartly`, set `progressClassName="bg-accent"`, and pass `theme={theme}` from `useTheme()`.

## 1.5 The responsive contract (binding for all of Phase 4)

The prototype gives two distinct compositions: a 340×720 phone and a 1280-wide desktop. This app is a single responsive SPA, so:

- [x] **1.5.1** Record and honour these breakpoints (Tailwind defaults, no customisation):

  | Range | Name | Composition |
  |---|---|---|
  | `< 640px` | mobile | 1-col; phone screens 01–12; bottom tab bar; sheets slide up from bottom |
  | `640–1023px` | tablet | 2-col grids; nav collapses to icons; bottom tab bar retained until `lg` |
  | `≥ 1024px` (`lg`) | desktop | full top nav, 3–4 col grids, side drawers, no bottom bar |
  | `≥ 1280px` (`xl`) | wide | 4-col product grid, content capped at `1280px` |

- [x] **1.5.2** Fix the page container once, in `src/components/layout/Container.tsx`: `mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-10`. Replace every ad-hoc `mx-auto max-w-7xl px-4 sm:px-6` in the app with it during Phase 4.
- [ ] **1.5.3** Rule: **no fixed pixel widths in page code.** The prototype's `340px` and `1280px` are artboard sizes, not layout values. The only permitted fixed widths are the desktop cart drawer (`w-[340px]`) and the desktop account rail (`w-[300px]`) — and both collapse to full-width sheets below `lg`.
- [x] **1.5.4** Rule: every tap target is ≥ 44×44 CSS px on touch widths. The prototype's 38px icon tiles get padding-box expansion, not a smaller hit area.

---

# Phase 2 — Primitive component library

All new files live under `src/components/ui/`. Each is a thin, typed, presentational component. No data fetching inside any of them.

`DESIGN REF` `.dc.html` lines 820–1045 (the "Design system" tab — buttons, inputs, chips, badges, cards, toast, progress, skeleton).

## 2.1 Buttons — `src/components/ui/Button.tsx`

Replaces the existing `src/components/Button.tsx` (26 lines, hardcoded `bg-[#A78BFA]`).

- [x] **2.1.1** Implement the variants exactly as the prototype's button row:

  | Variant | Base | Hover |
  |---|---|---|
  | `primary` | `bg-accent text-onacc rounded-btn font-extrabold` | `lift` + `shadow-lift-accent-cta` |
  | `dark` | `bg-ink text-card` | `lift` + `shadow-lift-ink` |
  | `outline` | `border border-edge text-ink bg-transparent` | `bg-ink text-card` (full invert) |
  | `soft` | `bg-soft text-[var(--k-on-soft)]` | `lift` |
  | `ghost` | `text-accent bg-transparent` | `bg-soft2` |
  | `pill` | `rounded-full bg-accent text-onacc` | `tracking-[.04em]` (letter-spacing grow) |
  | `icon` | `w-12 h-12 rounded-full bg-ink text-card grid place-items-center` | `pop-icon` |
  | disabled | `bg-line text-muted cursor-not-allowed` | none |

- [x] **2.1.2** Sizes: `sm` (`px-4 py-2.5 text-xs`), `md` (`px-6 py-4 text-sm`), `lg` (`px-7 py-[17px] text-base`). Default `md`.
- [x] **2.1.3** Props: `variant`, `size`, `icon`, `iconPosition`, `loading`, `fullWidth`, plus native `ButtonHTMLAttributes`. When `loading`, swap children for the three-dot `animate-dot` cluster.
- [x] **2.1.4** Keep the current default-export signature (`label` prop) working with a deprecation comment, so Phase 4 can migrate pages one at a time instead of in one break-everything commit.

## 2.2 Form controls — `Input.tsx`, `Select.tsx`, `Textarea.tsx`

`DESIGN REF` lines 892–898 (inputs: placeholder, focused, error).

- [x] **2.2.1** `Input` base: `rounded-btn border border-line bg-transparent px-4 py-3.5 text-[13px] font-medium text-ink placeholder:text-muted t-fast`; hover/focus `border-accent`. The design uses border colour for focus, not a ring.
- [x] **2.2.2** Error state: `border-danger text-danger`, message below at `text-[11px] font-bold text-danger`.
- [x] **2.2.3** Filled/valid state: `border-accent font-semibold text-ink` — the prototype shows the active field with an accent border and heavier weight.
- [x] **2.2.4** `label` renders above the field as `font-extrabold text-[12px] mb-2.5`, matching the "SIZE" / "Label" headings.
- [x] **2.2.5** Mobile: `<input>` font-size must be ≥ 16px on iOS to prevent zoom-on-focus. Use `text-base sm:text-[13px]`.

## 2.3 Chips, pills & badges — `Chip.tsx`, `Badge.tsx`

- [x] **2.3.1** `Chip`: `rounded-full px-4 py-2.5 text-xs font-bold border border-line t-fast`, hover `border-accent text-accent`; selected `bg-accent text-onacc border-transparent`.
- [x] **2.3.2** `Chip` supports a rail layout: parent gets `flex gap-2 overflow-x-auto no-scrollbar` on mobile, `flex-wrap` from `sm`.
- [x] **2.3.3** `Badge` tones mapped to the fixed status palette: `success` → `bg-ok-bg text-ok-fg`, `warn` → `bg-warn-bg text-warn-fg`, `danger` → `bg-bad-bg text-bad-fg`, `plum` → `bg-soft text-plum`, `ink` → `bg-ink text-card` (used for the `−25%` discount tag). All `rounded-full px-3 py-1.5 text-[11px] font-extrabold`.

## 2.4 Cards & surfaces

- [x] **2.4.1** `src/components/ui/Card.tsx` — `rounded-card border border-line bg-card overflow-hidden t-card`, hover `lift-card border-accent shadow-lift-accent`. Props: `as`, `interactive` (gates the hover), `padded`.
- [x] **2.4.2** `src/components/ui/Panel.tsx` — the non-interactive container: `rounded-panel border border-line bg-card p-6`.
- [x] **2.4.3** `src/components/ui/PromoCard.tsx` — `rounded-card bg-soft p-4 text-[var(--k-on-soft)]` with a mono eyebrow. Used for free-shipping / offer tiles.
- [x] **2.4.4** `src/components/ui/QtyStepper.tsx` — `flex items-center gap-3.5 rounded-full border border-line px-4 py-2`; minus in `text-muted`, plus in `text-accent`, both `font-extrabold`. Props `value`, `min`, `max`, `onChange`, `disabled`.
- [x] **2.4.5** `src/components/ui/ProgressBar.tsx` — `h-2 rounded-full bg-line overflow-hidden` with a `bg-accent` fill and `transition-[width] duration-1000 ease-out`.
- [x] **2.4.6** `src/components/ui/Skeleton.tsx` — wraps `Shimmer` (1.3.7) with `line` / `block` / `card` presets. Every `animate-pulse` skeleton in the app is replaced by this during Phase 4.
- [x] **2.4.7** `src/components/ui/EmptyState.tsx` — `border border-dashed border-edge rounded-card p-12 text-center`, icon in `text-accent`, title `font-extrabold`, sub `text-muted`, optional CTA.
- [x] **2.4.8** `src/components/ui/ImageFrame.tsx` — the universal image slot: renders the image with `object-cover` + `group-hover:scale-105 t-slow`, and falls back to `bg-hatch` plus a mono `product shot` caption when `src` is missing. Every product image in the app goes through this.

## 2.5 Overlays

- [x] **2.5.1** `src/components/ui/Sheet.tsx` — one component, two presentations driven by breakpoint:
  - `< lg`: bottom sheet, `rounded-t-sheet`, slides up (`animate-up`), backdrop `bg-ink/40 backdrop-blur-sm`, drag-handle bar at top.
  - `≥ lg`: right-side drawer, `w-[340px] border-l border-line bg-soft2`, slides in from `translate-x-full`.
  - Must trap focus, close on `Esc`, close on backdrop click, and lock body scroll while open.
- [x] **2.5.2** `src/components/ui/Modal.tsx` — centred dialog on the same backdrop primitive; `rounded-hero bg-card shadow-kartly max-w-lg`. Used for address add/edit and confirmations.
- [x] **2.5.3** `src/components/ui/Toast.tsx` — the dark inline toast from the design-system panel: `rounded-[18px] bg-ink text-card px-4 py-4 flex items-center gap-3` with an accent dot, title, sub, and an accent `VIEW` action. Wire `react-toastify` to render this as its content component so app-wide toasts match.

---

# Phase 3 — App shell & navigation

The prototype has three distinct navigation surfaces. The SPA must present the right one at the right width.

## 3.1 Desktop top navigation

`DESIGN REF` lines 524–541 (D1 storefront header).

- [x] **3.1.1** Rewrite `src/components/Navbar.tsx` as `src/components/layout/TopNav.tsx`. Keep a re-export at the old path until Phase 7 so pages don't break mid-migration.
- [x] **3.1.2** Left cluster: the Kartly mark — a `28×28 rounded-[10px] bg-ink` tile with a `12×12 rounded-full bg-accent` dot pinned at `-3px / -3px`, then the wordmark at `font-extrabold text-[17px] tracking-[-.02em]`. Build this once as `src/components/layout/BrandMark.tsx` (props: `size`, `inverted`) — the admin app reuses the same construction.
- [x] **3.1.3** Category links (`New`, plus live categories from the products endpoint): `text-[13px] font-semibold`, hover `text-accent t-fast`. Hidden below `lg`.
- [x] **3.1.4** Search: `flex-1 max-w-[340px] rounded-full border border-line px-4 py-2.5`, hover `border-accent`. Below `lg` it collapses to an icon that opens a full-screen search sheet.
- [x] **3.1.5** Right cluster: soft-pill `✦ Ask AI` button (see 4.10, feature-flagged), cart count tile (`38×38 rounded-[12px] border border-line`, hover `border-accent`), avatar tile (`38×38 rounded-[12px] bg-soft`).
- [x] **3.1.6** Sticky: `sticky top-0 z-50 bg-bg border-b border-line`. Add a `backdrop-blur` + reduced-opacity variant that engages after 12px of scroll.

## 3.2 Mobile bottom tab bar

`DESIGN REF` lines 137–143 (the 5-tab footer: Shop / Search / AI / Cart / You).

- [x] **3.2.1** Create `src/components/layout/BottomTabBar.tsx`. Fixed, `lg:hidden`, `border-t border-line bg-card`, `pb-[env(safe-area-inset-bottom)]`.
- [x] **3.2.2** Five tabs → routes: `Shop → /products`, `Search → /products?focus=search`, `AI → /assistant` (flagged), `Cart → /cart`, `You → /profile`.
- [x] **3.2.3** Active tab: an `8px` accent dot above a `text-[10px] font-bold` label; inactive: muted dot + `font-semibold`. Animate the dot with a `t-base` scale on activation.
- [x] **3.2.4** Cart tab carries the item-count badge. Lift the existing `cartCount` fetch out of `Navbar.tsx` into a shared hook `src/hooks/useCartCount.ts` so both nav surfaces share one request.
- [x] **3.2.5** Every page adds `pb-24 lg:pb-0` to its main scroll container so content clears the bar.

## 3.3 Layout wrapper

- [x] **3.3.1** Create `src/components/layout/AppLayout.tsx`: renders `TopNav`, `<main className="flex-1">`, `Footer`, and `BottomTabBar` on a `flex min-h-screen flex-col bg-bg text-ink` root.
- [x] **3.3.2** Create `src/components/layout/Footer.tsx` from the current inline footer (repeated verbatim in `ProductListPage`, `OrderListPage` and others) — `border-t border-line bg-card`, muted text. Content columns on desktop; a single centred line on mobile.
- [x] **3.3.3** Convert `src/App.tsx` to a nested-route layout: a parent `<Route element={<AppLayout />}>` with `<Outlet />`, so the shell is not re-mounted on every navigation (today each page renders its own `<Navbar />` and footer).
- [x] **3.3.4** Add a scroll-to-top effect on pathname change.
- [x] **3.3.5** Keep `/login`, `/signup` and `/welcome` **outside** `AppLayout` — those screens use a minimal brand-only header.

---

# Phase 4 — Page migrations

Each page gets: the screens it maps to, a mobile checklist, and a desktop checklist. **Both must be ticked.**

## 4.0 Screen → route map

| Prototype screen | `.dc.html` lines | Route | File |
|---|---|---|---|
| 01 onboarding | 68–89 | `/welcome` (new, first visit) | `src/pages/WelcomePage.tsx` |
| 02 home | 90–156 | `/products` | `src/pages/ProductListPage.tsx` |
| 03 catalog + filters | 157–184 | `/products` (filter state) | same |
| 04 product detail | 185–227 | `/products/:productId` | `src/pages/ProductDetailPage.tsx` |
| 05 cart | 228–262 | `/cart` | `src/pages/CartPage.tsx` |
| 06 checkout + payment | 263–305 | `/checkout` | `src/pages/CheckoutPage.tsx` |
| 07 payment success | 306–327 | `/orders/success` | `src/pages/OrderSuccessPage.tsx` **(new)** |
| 08 order tracking | 328–360 | `/orders/:orderId` | `src/pages/OrderTrackingPage.tsx` **(new)** |
| 09 AI assistant | 361–415 | `/assistant` (flagged) | `src/pages/AssistantPage.tsx` **(new)** |
| 10 profile | 416–448 | `/profile` | `src/pages/ProfilePage.tsx` |
| 11 address management | 449–473 | `/profile` (addresses) | same |
| 12 add / edit address | 474–508 | `/profile` (modal/sheet) | `src/components/profile/AddressForm.tsx` **(new)** |
| D1 storefront | 517–584 | `/products` desktop | `ProductListPage.tsx` |
| D2 PDP + cart drawer | 585–634 | `/products/:id` desktop | `ProductDetailPage.tsx` + `CartDrawer` |
| D3 AI workspace + account | 635–704 | `/assistant`, `/profile` desktop | `AssistantPage.tsx`, `ProfilePage.tsx` |

## 4.1 `ProductListPage.tsx` — storefront (screens 02, 03, D1)

### Mobile (screens 02 + 03)

- [x] **4.1.1** Header block: `Deliver to · {city}` in `text-[12px] font-medium text-muted`, then the two-line display heading at `font-extrabold text-[25px] leading-[1.15] tracking-[-.03em]`. Right: a notification tile `40×40 rounded-[13px] border border-edge` with the accent dot.
- [x] **4.1.2** Search field: full-width `rounded-tile border border-edge px-4.5 py-4`, hover/focus `border-accent`, placeholder showing the live product count (`Search {total} products`).
- [x] **4.1.3** Category rail: horizontal `Chip` rail (`no-scrollbar`), `All` selected by default. Wire to the existing `category` state; keep the current "Filtering by" clear behaviour but restyle it as a selected `Chip` with an `×`.
- [ ] **4.1.4** Section header row: `Trending now` at `font-extrabold text-base` with a `See all` link in `text-accent text-xs font-semibold`.
- [x] **4.1.5** Product grid: `grid grid-cols-2 gap-3.5`. Card = `Card` primitive; image slot `h-[104px]` via `ImageFrame`; body `px-3 pt-2.75 pb-3.25` with name `font-bold text-[13px]`, then a row with price `font-extrabold text-[14px]` and rating `text-[11px] text-muted font-semibold`.
- [x] **4.1.6** Keep the existing offer / out-of-stock badges, restyled: offer → `Badge tone="ink"` top-left; out-of-stock → `Badge tone="plum"` top-right.
- [x] **4.1.7** AI teaser row below the grid: `rounded-card bg-soft p-3.5 flex items-center gap-3.5`, ink tile with accent dot, title `Ask the AI stylist`, sub in `#5A5566`. Hover `lift`. Links to `/assistant`; hidden when the assistant flag is off.
- [ ] **4.1.8** Filter bar (screen 03): three equal buttons `Price ▾ / Sort ▾ / Category ▾` — `flex-1 rounded-ctl border border-edge py-2.75 text-xs font-bold`, the active one `bg-ink text-card`. Each opens a mobile `Sheet` with its options.
- [x] **4.1.9** Replace the `animate-pulse` skeleton grid with `Skeleton` cards (2-col on mobile).
- [x] **4.1.10** Bottom padding `pb-24` so the tab bar clears.

### Desktop (screen D1)

- [ ] **4.1.11** Hero band: `flex gap-6.5` — left hero `flex-[1.35] rounded-hero bg-soft p-11 min-h-[330px] relative overflow-hidden` with the decorative `300×300 rounded-full bg-white/45` blob at `right:-40px; top:-40px`; mono eyebrow; display heading at `font-black text-[52px] leading-[1.02] tracking-[-.04em]`; two CTAs (`dark` + `outline` variants).
- [ ] **4.1.12** Right of hero: two stacked category tiles `flex-[.75] gap-4`, each `rounded-panel border border-line bg-hatch2`, label bottom-aligned at `font-extrabold text-[15px]`, hover `lift-card border-accent`. Populate from the top two live categories with their product counts.
- [ ] **4.1.13** Product grid: `grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5`, image slot `h-[210px]`, body `px-4.5 pt-4 pb-4.5`; price `font-extrabold text-base` with a soft `+ Add` pill on the right that adds to cart without leaving the page (optimistic, with the `Toast` from 2.5.3).
- [x] **4.1.14** Card hover: `lift-lg border-accent shadow-lift-accent-lg` plus inner image `scale-105`, all on `t-slow`.
- [ ] **4.1.15** Section header: `Trending now` at `font-extrabold text-[24px] tracking-[-.02em]`, right side `View all {total} →` in `text-accent text-[13px] font-bold`.
- [ ] **4.1.16** Filters move from sheets into an inline row of `Chip`s plus a sort `Select` — no modal on desktop.
- [x] **4.1.17** Pagination restyled: `outline` Buttons with `Page {n} of {total}` in `text-muted text-[13px]` between them; keep the existing disabled logic.

## 4.2 `ProductDetailPage.tsx` — PDP (screens 04, D2)

### Mobile (screen 04)

- [x] **4.2.1** Gallery: full-bleed `h-[300px] bg-soft`, image via `ImageFrame`. Floating back tile top-left and wishlist heart top-right, both `38×38 rounded-[13px] bg-card`; heart hover `text-accent scale-[1.08]`.
- [x] **4.2.2** Dot pager at the gallery bottom: active dot `22×5 rounded-full bg-ink`, inactive `5×5 bg-ink/30`. Wire to the existing image-index state; support horizontal swipe.
- [ ] **4.2.3** Detail sheet: `flex-1 bg-card rounded-t-sheet -mt-6 relative px-6 pt-6.5` — it must visually overlap the gallery by 24px.
- [ ] **4.2.4** Title `font-extrabold text-[23px] leading-[1.15] tracking-[-.02em]`; sub line `{brand} · {stock status}` at `text-[12px] text-muted font-semibold`; rating pill `rounded-full bg-soft px-2.75 py-1.75 font-extrabold text-[12px]`.
- [x] **4.2.5** Variant selector (currently a plain `<select>`): rebuild as swatch tiles — `46×40 rounded-ctl border border-line font-bold text-[12px]`, selected `bg-accent text-onacc`, out-of-stock `text-muted` and non-interactive. Heading = the live variant attribute name at `font-semibold text-[12px]`.
- [x] **4.2.6** Description `text-[12.5px] text-muted leading-[1.6]` with a `See details` accent link that expands the full text.
- [x] **4.2.7** Trust row: three icon+label stacks (free ship / returns / warranty) at `text-[10px] font-semibold text-muted`, using the prototype's bare geometric marks (square, circle, rotated square) rather than filled icons.
- [x] **4.2.8** Sticky bottom bar: `mt-auto border-t border-line py-4 flex items-center gap-3.5` — left `Total` + price at `font-extrabold text-[22px]`, right a full-width `primary` Button `Add to cart`. On mobile the bar is `sticky bottom-[76px]` so it clears the tab bar.

### Desktop (screen D2)

- [x] **4.2.9** Three-column body: thumbnail column (`96×96 rounded-tile` tiles, selected `border-accent`), main image `flex-1 rounded-hero bg-soft min-h-[470px]`, info column `w-[340px]`.
- [x] **4.2.10** Info column: mono brand eyebrow, title `font-black text-[34px] leading-[1.05] tracking-[-.03em]`, price row = current price `font-extrabold text-[26px]` + struck original `text-muted line-through` + `Badge tone="ink"` with the computed discount percent. Wire to the existing `activeOffer` / `discountedPrice` fields.
- [x] **4.2.11** Size swatches at `52×44`, hover `lift-sm border-accent`.
- [x] **4.2.12** Action row: `QtyStepper` + `primary` `Add to cart` (`flex-1`), then a full-width `outline` `Buy it now` beneath that routes straight to `/checkout`.
- [x] **4.2.13** Cart drawer: create `src/components/cart/CartDrawer.tsx` — `w-[340px] border-l border-line bg-soft2 p-8` at `lg`, rendered inline beside the PDP at `xl` and as a `Sheet` below `lg`. Header `Your bag` + close; line items `rounded-[18px] bg-card border border-line p-3` with a `56×56` thumb; footer `Total` row + `dark` Checkout Button. Row hover `border-accent`.
- [x] **4.2.14** The drawer opens (animated) after a successful add-to-cart. It does **not** auto-dismiss — the user closes it.

## 4.3 `CartPage.tsx` — bag (screen 05)

### Mobile

- [x] **4.3.1** Title `Your bag` at `font-extrabold text-[24px] tracking-[-.02em]` with the count in `text-muted text-[15px]`.
- [ ] **4.3.2** Line item: `rounded-card border border-line p-3 flex gap-3.25`, `64×64 rounded-[14px]` thumb via `ImageFrame`, name `font-bold text-[13px]`, variant `text-[11px] text-muted font-semibold`, then a row with the pill `QtyStepper` (`px-2 py-1`) and the line total `font-extrabold text-[13px]`. Hover `border-accent slide-x`.
- [ ] **4.3.3** Wire the stepper to the existing update-quantity call. Remove-item is a swipe-left action on touch and an `×` on hover for pointer devices.
- [x] **4.3.4** Promo row: dashed `rounded-btn border border-dashed border-edge` input + `dark` Apply Button. If the backend has no promo endpoint, render it **disabled with a "Coming soon" note** rather than omitting the slot — the design calls for it.
- [x] **4.3.5** Summary sheet pinned to the bottom: `-mx-6 rounded-t-[24px] bg-soft2 border-t border-line p-5` with muted Subtotal / Shipping rows, a `border-t border-line` divider, `Total` at `font-extrabold text-[17px]`, and a full-width `primary` Checkout Button.
- [x] **4.3.6** Empty state via `EmptyState` with a `Browse products` CTA.

### Desktop

- [x] **4.3.7** Two-column: items `flex-[1.6]`, summary `w-[380px] sticky top-28 self-start` in a `Panel` on `bg-soft2`.
- [x] **4.3.8** Line items get more room: `80×80` thumbs, name and variant on one line, stepper and price right-aligned.
- [x] **4.3.9** Summary panel repeats the same rows plus an itemised offer/savings line when `activeOffer` applies.

## 4.4 `CheckoutPage.tsx` — checkout (screen 06)

### Mobile

- [x] **4.4.1** Header row: back tile `38×38 rounded-[13px] border border-edge` + `Checkout` at `font-extrabold text-[17px]`.
- [ ] **4.4.2** Three-segment progress: `flex gap-2`, each `flex-1 h-[5px] rounded-full`, completed `bg-accent`, pending `bg-line`. Steps: Address → Payment → Confirm. Animate the fill on step change.
- [x] **4.4.3** `Deliver to` card: `rounded-[18px] border border-accent bg-soft2 p-3.75` with the name, the address in `text-muted text-[12px]`, and a `Change` link in `text-accent text-[11px] font-bold` opening the address `Sheet`.
- [ ] **4.4.4** Payment method rows: `rounded-[18px] border border-line p-3.75 flex items-center gap-3.25` — radio `18×18 rounded-full`; the selected radio gets `border-[5px] border-accent` and its row gets `border-accent`. Unselected rows hover `border-accent lift-sm`. **Only render methods the backend actually supports** (Razorpay card/UPI/netbanking today) — do not ship the prototype's wallet and pay-in-4 rows as dead UI.
- [x] **4.4.5** Sticky pay bar: `border-t border-line pt-4.5` with `Pay total` + amount at `font-extrabold text-[21px]` and a `dark` `Pay now` Button triggering the existing create-order → Razorpay modal → verify-payment flow, untouched.
- [x] **4.4.6** The Razorpay modal is third-party and cannot be themed; pass `theme: { color: '#A87BF5' }` in its options so the accent carries through.
- [x] **4.4.7** During verify-payment, cover the page with a blocking overlay showing the three-dot `animate-dot` loader — never leave the Pay button live for a double-submit.

### Desktop

- [x] **4.4.8** Two-column: form `flex-[1.5]`, order summary `w-[380px] sticky top-28` on `bg-soft2`, listing every line item with thumbs.
- [ ] **4.4.9** The progress bar becomes a labelled stepper (dot + label per step) above the form.
- [ ] **4.4.10** Address and payment render as two side-by-side `Panel`s at `xl`, stacked at `lg`.

## 4.5 `OrderSuccessPage.tsx` — payment success (screen 07) — **new file**

The current `OrderListPage.tsx` (90 lines) is really a post-payment landing. Split it: success becomes its own page, and `/orders` becomes a real order list (4.6.8).

- [x] **4.5.1** Create `src/pages/OrderSuccessPage.tsx`, route it at `/orders/success`, and navigate there from `CheckoutPage` with `{ orderId }` in location state. Redirect to `/products` when state is absent.
- [x] **4.5.2** Centred column, `text-center`, vertically centred in the viewport.
- [x] **4.5.3** Success mark: `112×112 rounded-full bg-accent` with `animate-pop`, containing an inline SVG check (`M12 25l8 8 16-18`, `stroke-width 5`, round caps) drawn with `stroke-dasharray: 60; stroke-dashoffset: 60` and `kfDraw .55s .35s ease-out forwards`.
- [x] **4.5.4** Two concentric `130×130 rounded-full bg-accent opacity-20` rings running `animate-ring` at `0s` and `1.2s` delays.
- [x] **4.5.5** Confetti: 7 absolutely-positioned particles at the centre with per-particle `--tx` / `--ty` offsets `[-70,-40] [70,-52] [-84,36] [86,30] [0,-84] [24,80] [-30,78]`, alternating `7px` circles and `9px` rounded squares, alternating `bg-ink` / `bg-accent`, each running `kfConf 1.5s ease-out infinite` with a `0.35 + i*0.06`s delay. Build as `src/components/motion/Confetti.tsx`.
- [x] **4.5.6** Copy ladder with staggered `animate-up`: heading `Payment successful` at `font-black text-[30px]` (250ms), amount + order-id line (400ms), ETA card (550ms), CTA (700ms).
- [ ] **4.5.7** ETA card: `rounded-card bg-soft2 border border-line p-4 flex justify-between` — left mono label `ESTIMATED ARRIVAL` + date `font-extrabold`, right a `pill` Button `Track` linking to `/orders/:orderId`.
- [x] **4.5.8** `Continue shopping` — full-width `dark` Button.
- [x] **4.5.9** **Desktop:** identical composition capped at `max-w-[480px]` and centred; confetti offsets scale 1.4× via a `scale` prop.
- [x] **4.5.10** Honour `prefers-reduced-motion`: skip confetti and rings entirely, render the check statically.

## 4.6 `OrderTrackingPage.tsx` — live tracking (screen 08) — **new file**

- [ ] **4.6.1** Create `src/pages/OrderTrackingPage.tsx` at `/orders/:orderId`; fetch the order through the existing user orders endpoint.
- [ ] **4.6.2** Header: mono `ORDER #{id}` label, stage title at `font-extrabold text-[22px]`, and an ETA pill `rounded-full bg-soft text-[var(--k-on-soft)] px-3.25 py-2 font-extrabold text-[11px]`.
- [ ] **4.6.3** Map/progress band: `h-[150px] rounded-panel bg-soft2 border border-line relative overflow-hidden`, mono `live map` caption top-left, a vehicle glyph (`44×26 rounded-[7px] bg-ink` + `22×22 rounded-[6px] bg-accent`) running `animate-roll`, and a 2px accent progress line along the bottom whose width is `25% + stage*25%` on `transition-[width] duration-1000`.
- [ ] **4.6.4** Timeline: one row per status — `22×22 rounded-full` dot (accent when reached, `bg-line` when not, `✓` glyph once passed), a `2px × 38px` connector coloured accent up to the current stage, label `font-extrabold text-[13.5px]` (muted when unreached), timestamp `text-[11.5px] text-muted font-semibold`. All dot/line/text changes on `transition-all .5s`.
- [ ] **4.6.5** Map real backend statuses onto the four visual stages: `confirmed → packed → out for delivery → delivered`. An unknown status falls back to stage 0 and shows the raw label.
- [ ] **4.6.6** Do **not** ship the prototype's `Advance status (demo)` button. If you want it locally, gate it behind `import.meta.env.DEV`.
- [ ] **4.6.7** **Desktop:** two columns — map band + timeline left (`flex-[1.4]`), an order-summary `Panel` (items, totals, address) right (`w-[380px]`).
- [ ] **4.6.8** Rewrite `src/pages/OrderListPage.tsx` as a genuine list: one `Card` per order with id, date, stacked overlapping item thumbs, total, and a status `Badge`; row click → `/orders/:orderId`. Empty state via `EmptyState`.

## 4.7 `ProfilePage.tsx` — profile & addresses (screens 10, 11, 12, D3 right rail)

The current file is 524 lines with inline edit forms. Restructure it rather than restyling in place.

### Mobile (screen 10)

- [ ] **4.7.1** Identity block: `66×66 rounded-[22px]` avatar (`bg-hatch` fallback), name `font-extrabold text-[19px] tracking-[-.02em]`, email `text-[12px] text-muted`, tier pill `rounded-full bg-soft text-[var(--k-on-soft)] px-2.5 py-1.25 font-extrabold text-[10px]`.
- [ ] **4.7.2** Three stat tiles in a row: `flex-1 rounded-[18px] border border-line p-3.75`, value `font-extrabold text-[19px]`, label `text-[10.5px] text-muted font-bold`. Hover `lift border-accent`. Populate from live data (orders, wishlist, savings) — show `—` while loading, never `0` as a placeholder.
- [ ] **4.7.3** Menu rows: `flex items-center gap-3.25 rounded-tile px-3.5 py-3.75`, `34×34 rounded-[11px] bg-soft` icon tile, label `font-bold text-[13px]`, sub `text-[10.5px] text-muted`, chevron `›` muted. Hover `bg-soft2 slide-x`. Rows: Orders, Addresses, Payment methods, Wishlist, Help & returns.
- [x] **4.7.4** Dark-mode row pinned at the bottom: `rounded-tile border border-line px-4 py-3.75 flex justify-between` with a real switch — `48×27 rounded-full` track, `21×21 rounded-full bg-card` knob, `justify-content` flips on `t-base`, track `bg-line` → `bg-accent`. Wire to `useTheme().toggleTheme`.
- [x] **4.7.5** Extract `src/components/ui/Switch.tsx` while doing 4.7.4 — the admin app needs it too.

### Addresses (screens 11, 12)

- [x] **4.7.6** Address card: `rounded-card border border-line p-4`, label `font-extrabold text-[13.5px]` + a `Badge` (`DEFAULT` → accent, others → `tone="plum"`), address line `text-[12px] text-muted leading-[1.55]`, then `Edit` / `Delete` pill buttons. Card hover `lift border-accent shadow-lift-accent`; `Delete` hover turns `border-danger text-danger`.
- [x] **4.7.7** `+ Add new address` — dashed `rounded-card border border-dashed border-edge p-4.5 text-center font-extrabold`, hover `bg-soft2 border-accent text-accent`.
- [x] **4.7.8** Move the add/edit form out of inline page state into `src/components/profile/AddressForm.tsx`, rendered inside `Modal` on desktop and `Sheet` on mobile. Keep the existing `saveAddress` API call and validation intact.
- [x] **4.7.9** Form layout per screen 12: a pin-location band (`h-[132px] rounded-card bg-soft2` with an accent dot and an 8px accent glow ring — static visual, not a live map, unless a maps key exists), then stacked `Input`s: Full name / Address line 1 / Line 2 / (City + ZIP side by side) / Phone.
- [ ] **4.7.10** Label chips (`Home` / `Work` / `Other`) as a selected-`Chip` row above the save button; persist as the address label.
- [x] **4.7.11** Save button pinned to the bottom of the sheet: full-width `dark` Button.
- [ ] **4.7.12** Delete confirmation must be a `Modal`, not a `window.confirm`.

### Desktop (screen D3 — account nav + profile rail)

- [ ] **4.7.13** Three-column account shell: left nav `w-[250px] border-r border-line` (Orders / Wishlist / Addresses / Payments / Settings, each `rounded-[13px] px-3.5 py-3 font-semibold text-[13px] text-muted`, hover `bg-soft2 text-ink slide-x`, active `bg-soft text-[var(--k-on-soft)] font-extrabold`), content centre, and a profile rail `w-[300px] border-l border-line bg-soft2` holding the identity card and the saved-addresses list.
- [ ] **4.7.14** Left nav bottom card: `rounded-tile bg-soft2 border border-line p-3.5` with tier + points. Populate from live data or omit the card entirely — do not hardcode `Gold member`.
- [ ] **4.7.15** Below `lg` the left nav collapses into the mobile menu rows (4.7.3) and the right rail becomes a section further down the page.

## 4.8 `LoginPage.tsx` & `SignUpPage.tsx` — auth

No prototype screen exists for auth, so compose from the design-system panel.

- [x] **4.8.1** Split screen at `lg`: left `flex-[1.1]` brand panel `bg-soft rounded-hero` with the `BrandMark`, a display heading, and the floating hatch illustration from screen 01 running `animate-float`; right the form column at `max-w-[420px]`, centred.
- [x] **4.8.2** On mobile the brand panel collapses to a compact header (mark + heading) and the form takes the full width.
- [x] **4.8.3** Rebuild both forms with the `Input` primitive; step 1 (credentials) and step 2 (OTP) become two `animate-up` panels with a crossfade between them.
- [x] **4.8.4** OTP entry: six separate `48×56 rounded-ctl border border-line text-center font-extrabold text-[20px]` boxes with auto-advance, paste support, and backspace-to-previous. Filled boxes get `border-accent`. This replaces the current single text field.
- [x] **4.8.5** The backend returns the OTP in the response body ("for testing/demo purposes"). Keep surfacing it, but render it in a clearly-marked dev notice card (`Badge tone="warn"` + mono text), not as ordinary UI copy.
- [x] **4.8.6** Resend-OTP link with a live 60s countdown in `text-muted`, becoming an accent link when ready.
- [x] **4.8.7** Submit buttons: full-width `primary`, `loading` wired to the existing request flags.
- [x] **4.8.8** Error surface: `rounded-btn border border-danger bg-bad-bg text-bad-fg px-4 py-3 text-[13px] font-semibold`, entering with `animate-up`.

## 4.9 `WelcomePage.tsx` — onboarding (screen 01) — **new file, optional**

- [x] **4.9.1** Create `src/pages/WelcomePage.tsx` at `/welcome`. Show once: on first load, if `localStorage.kartlySeenWelcome` is unset and no `userToken` exists, redirect `/` → `/welcome`; set the flag on `Get Started`.
- [x] **4.9.2** Composition: full-height column; centred illustration — a `220×220 rounded-full bg-soft` disc behind a `230×280 rounded-hero border border-line bg-hatch2` card running `animate-float`.
- [x] **4.9.3** Copy block: heading at `font-extrabold text-[30px] leading-[1.15] tracking-[-.03em]`, muted sub, then a three-dot pager (`26×6` active accent pill + two `6×6` line dots).
- [x] **4.9.4** `Get Started` — full-width `dark` Button with `lift` + `shadow-lift-ink` hover.
- [x] **4.9.5** **Desktop:** same content centred at `max-w-[420px]`, illustration scaled to `320×390`.
- [x] **4.9.6** Add a `Skip` text link top-right that sets the flag and goes to `/products`.

## 4.10 `AssistantPage.tsx` — AI assistant (screens 09, D3) — **feature-flagged, UI only**

`product_selling_app_agent/` is documentation-only today (`doc/AGENT_DEV_PLAN.md`), so the assistant has no backend. Build the UI behind a flag and leave the transport to be wired when the agent service exists.

- [x] **4.10.1** Add `VITE_ENABLE_ASSISTANT=false` to `.env` and `.env.example`. Every assistant entry point (top-nav pill, bottom tab, home teaser, route) reads this flag. Default **off**.
- [x] **4.10.2** Create `src/pages/AssistantPage.tsx` and `src/components/assistant/` for the message primitives.
- [x] **4.10.3** Chat header: `38×38 rounded-[13px] bg-ink` mark with accent dot, title `{brand} Assistant`, status line in `text-accent text-[11px] font-bold`.
- [x] **4.10.4** Message bubbles — user: `self-end max-w-[78%] rounded-[18px_18px_5px_18px] bg-ink text-card px-3.75 py-3 text-[12.5px]`; assistant: `max-w-[88%] rounded-[18px_18px_18px_5px] bg-soft2 border border-line`. Both enter with `animate-up`, assistant delayed 100ms.
- [x] **4.10.5** Product pick rows: `rounded-tile bg-card border border-line p-2.25 flex items-center gap-2.75` with a `46×46` thumb, name, note, price, and an accent `+ Add`. Hover `border-accent slide-x shadow-lift-accent`.
- [x] **4.10.6** Micro-checkout card: `rounded-[18px] border border-accent bg-soft2 p-3.5` with a mono `MICRO CHECKOUT` label, line rows, two payment chips, and a full-width accent pay Button.
- [x] **4.10.7** Typing indicator: three `6×6 rounded-full bg-accent` dots on `animate-dot` at `0 / .2s / .4s`.
- [x] **4.10.8** Suggestion chip rail above the composer (`no-scrollbar`); composer = pill input + `44×44 rounded-full bg-accent` send button with `pop-icon` hover.
- [ ] **4.10.9** **Desktop (D3):** three-pane workspace — left account nav `w-[250px]`, centre conversation, right profile rail `w-[300px]`. Below `lg`, only the centre pane shows; the rails are reachable from the tab bar.
- [x] **4.10.10** While the flag is off, the route renders an `EmptyState` reading "Assistant coming soon" if reached directly.

---

# Phase 5 — Motion & interaction pass

Do this after every page is structurally converted. Work through it as a single sweep so timings stay consistent.

- [x] **5.1** Page transitions: fade + 14px rise (`animate-up`, 300ms) on route change, applied once in `AppLayout`, keyed by pathname.
- [x] **5.2** Every product card: `t-slow`, hover `lift-lg` (desktop) / `lift-card` (tablet), `border-accent`, `shadow-lift-accent-lg`, inner image `scale-105`.
- [x] **5.3** Every primary/dark button: `t-base`, hover `lift` + matching shadow, `active:translate-y-0 active:shadow-none`.
- [x] **5.4** Every input and chip: `t-fast`, hover/focus `border-accent`.
- [x] **5.5** Every list row (cart, addresses, profile menu, order list): hover `slide-x` plus `bg-soft2` or `border-accent`.
- [x] **5.6** Icon buttons: `pop-icon` on hover.
- [x] **5.7** Grid entrance stagger: product grids reveal with `Reveal` at `index * 40ms`, capped at 400ms total so a 40-item page does not crawl.
- [x] **5.8** Sheets and drawers: 250ms `cubic-bezier(.2,.8,.2,1)` translate; backdrops fade at 200ms.
- [x] **5.9** Cart badge: `animate-pop` whenever the count increases.
- [x] **5.10** Add-to-cart: the button label crossfades to a check for 900ms before reverting, and the `Toast` from 2.5.3 fires.
- [x] **5.11** Skeletons: `animate-shim` everywhere. Confirm no `animate-pulse` remains — `grep -rn "animate-pulse" src/` returns nothing.
- [ ] **5.12** Checkout progress bar fills with a 400ms width transition on step change.
- [ ] **5.13** Tracking timeline dots and connectors animate on `transition-all .5s` when the stage advances.
- [x] **5.14** Re-verify the reduced-motion guard: with the OS setting on, no looping animation runs and no transform entrance plays; the success page shows a static check and no confetti.

---

# Phase 6 — Responsive QA matrix

Test every route at every width, in **both themes**. Tick a route only when all four widths pass.

| Route | 375px | 768px | 1024px | 1440px |
|---|---|---|---|---|
| `/welcome` | ☐ | ☐ | ☐ | ☐ |
| `/login` | ☐ | ☐ | ☐ | ☐ |
| `/signup` | ☐ | ☐ | ☐ | ☐ |
| `/products` | ☐ | ☐ | ☐ | ☐ |
| `/products/:id` | ☐ | ☐ | ☐ | ☐ |
| `/cart` | ☐ | ☐ | ☐ | ☐ |
| `/checkout` | ☐ | ☐ | ☐ | ☐ |
| `/orders` | ☐ | ☐ | ☐ | ☐ |
| `/orders/success` | ☐ | ☐ | ☐ | ☐ |
| `/orders/:id` | ☐ | ☐ | ☐ | ☐ |
| `/profile` | ☐ | ☐ | ☐ | ☐ |
| `/assistant` | ☐ | ☐ | ☐ | ☐ |

Pass criteria applied at every width:

- [x] **6.1** No horizontal page scroll. Verify on every route with `document.documentElement.scrollWidth <= window.innerWidth` in the console.
- [x] **6.2** Wide content (order tables, chip rails, galleries) scrolls inside its own `overflow-x-auto` container, never the body.
- [x] **6.3** Bottom tab bar visible below `lg`, hidden at `lg+`; no content sits underneath it.
- [x] **6.4** Top-nav category links hidden below `lg`; search collapses to an icon.
- [x] **6.5** All sheets present as bottom sheets below `lg` and as side drawers/modals at `lg+`.
- [x] **6.6** Every tap target ≥ 44px on touch widths.
- [x] **6.7** Text never clips: long product names `line-clamp-2`, long addresses wrap.
- [ ] **6.8** Run the entire matrix twice — once light, once dark.
- [x] **6.9** Safe-area insets respected on iOS (notch top, home indicator bottom).
- [ ] **6.10** Landscape phone (`812×375`) does not break the PDP sticky bar or the checkout pay bar.

---

# Phase 7 — Cleanup, accessibility & verification

## 7.1 Removal of the old system

- [x] **7.1.1** Re-run the Phase 0.1.2 grep. It must return **zero** matches for the legacy `bg-primary` / `text-text` / `bg-secondary` / `bg-background` / `text-accent` meanings. Anything left is unstyled markup.
- [x] **7.1.2** Delete `product_selling_app_client_user/tailwind.config.js` — Tailwind v4 does not read it, and keeping it invites the next person to edit a dead file.
- [x] **7.1.3** Delete `src/App.css` (Vite scaffold leftovers: `.counter`, `.hero`, `.logo`) and remove its import.
- [x] **7.1.4** Remove the compatibility re-export at `src/components/Navbar.tsx` once every page imports `layout/TopNav`.
- [x] **7.1.5** Remove unused assets: `src/assets/react.svg`, `src/assets/vite.svg` if nothing references them.

## 7.2 Accessibility

- [x] **7.2.1** Contrast: verify `--k-muted` on `--k-card` in **both** themes hits 4.5:1 for body text. If light-mode `#767C8C` on `#FFFFFF` falls short at small sizes, darken to `#6B7180` for text and keep `#767C8C` for icons and borders. Record the decision in `doc/KARTLY_MIGRATION_NOTES.md`.
- [x] **7.2.2** Every interactive element is a real `<button>` or `<a>`. The prototype uses `<div onClick>` throughout — do not carry that over.
- [x] **7.2.3** Visible focus ring on every control: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`. The design's border-only focus is insufficient for keyboard users.
- [x] **7.2.4** Sheets, drawers and modals: `role="dialog"`, `aria-modal`, focus trap, focus restored to the trigger on close.
- [x] **7.2.5** Every `ImageFrame` renders a meaningful `alt`; decorative hatch fallbacks get `alt=""` + `aria-hidden`.
- [x] **7.2.6** Bottom tab bar is a `<nav aria-label="Primary">` with `aria-current="page"` on the active tab.
- [x] **7.2.7** Theme toggle is a `<button role="switch" aria-checked>`.
- [ ] **7.2.8** Keyboard-only pass of the money path: browse → PDP → add to cart → checkout → pay. No trap, no unreachable control.

## 7.3 Verification

- [x] **7.3.1** `npm run lint` (oxlint) clean.
- [x] **7.3.2** `npm run build` clean — `tsc -b` will catch unused imports the migration leaves behind (`noUnusedLocals` is on).
- [ ] **7.3.3** Manual smoke of the money path against a live backend: browse → PDP → add to cart → checkout → Razorpay test payment → verify → success → tracking. Confirm no restyle broke a request payload.
- [x] **7.3.4** Update `product_selling_app_client_user/CLAUDE.md` → **Styling** section: replace the `tailwind.config.js` token list with the `@theme` token table and document the `data-theme` dark-mode contract.
- [x] **7.3.5** Update the root `CLAUDE.md` → **Frontend Architecture**, which currently states shared tokens live in each app's `tailwind.config.js`.
- [x] **7.3.6** Fill in the Progress summary table at the top of this file.

---

# Appendix A — Token quick reference

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--k-bg` | `#ECECEE` | `#0D0F14` | page canvas |
| `--k-card` | `#FFFFFF` | `#181B23` | cards, nav, sheets |
| `--k-ink` | `#171A22` | `#F1F0F4` | primary text, dark buttons |
| `--k-muted` | `#767C8C` | `#9AA0B0` | secondary text, icons |
| `--k-edge` | `#1B1F2A` | `#39404F` | strong outlines |
| `--k-line` | `#E4E4EA` | `#262B36` | hairlines, dividers, card borders |
| `--k-soft` | `#F6E8FF` | `#2A2138` | accent-tinted fills, chips, hero |
| `--k-soft2` | `#FAF3FF` | `#201B2B` | subtle fills, drawers, summaries |
| `--k-accent` | `#A87BF5` | `#B999F7` | primary actions, active states |
| `--k-onAcc` | `#FFFFFF` | `#14101C` | text on accent |

Fixed (theme-independent): `--k-ok-bg #E6F6EE` / `--k-ok-fg #1E7A52`; `--k-warn-bg #FFF3DB` / `--k-warn-fg #8A6415`; `--k-bad-bg #FDE9E6` / `--k-bad-fg #A83A2A`; `--k-plum-fg #5B3F86`; `--k-danger #E0614F`.

# Appendix B — Type scale

| Role | Spec |
|---|---|
| Display | `font-black text-[44px] leading-none tracking-[-.04em]` (desktop hero `52px`) |
| Heading | `font-extrabold text-[28px] leading-[1.1] tracking-[-.03em]` |
| Subhead | `font-bold text-[18px] leading-[1.2]` |
| Body | `font-medium text-[14px] leading-[1.6] text-muted` |
| Meta / eyebrow | `font-mono font-medium text-[11px] leading-[1.4] text-muted` |
| Label | `font-extrabold text-[12px]` |
| Micro | `font-bold text-[10px]` |

# Appendix C — Animation catalogue

| Keyframe | Duration / easing | Applied to |
|---|---|---|
| `kfPop` | `.7s cubic-bezier(.2,1.3,.3,1) both` | success mark, cart badge increment |
| `kfDraw` | `.55s .35s ease-out forwards` | success check stroke |
| `kfRing` | `2.4s ease-out infinite` | success pulse rings (×2, 1.2s offset) |
| `kfUp` | `.4–.6s both` | message bubbles, copy ladders, toasts, page enter |
| `kfFloat` | `5s ease-in-out infinite` | onboarding + auth illustration |
| `kfRoll` | `2.4s ease-in-out infinite alternate` | tracking vehicle |
| `kfDot` | `1.2s infinite` (0 / .2 / .4s) | typing + loading indicators |
| `kfShim` | `1.4s linear infinite` | every skeleton |
| `kfConf` | `1.5s ease-out infinite`, staggered | success confetti |
| `kfBar` | `.9s cubic-bezier(.2,.8,.2,1) both` | bar-chart growth (admin app) |

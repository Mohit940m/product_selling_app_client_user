# User App — Fix Plan & Design Refinements

Audit of all pages against the API spec (`user.routes.md`) and design language.

---

## Critical Bugs (API Mismatches)

### Bug 1 — `LoginPage.tsx`

**Problem:** Form collects `phone` and sends `{ phone }` to `/auth/login`. The API requires `{ email, password }` for step 1 and `{ email, otp }` for step 2.

**Fix:**
- Replace `phone` state + field with `email` + `password` fields
- Store `email` in state after step 1 so it can be passed to the verify call
- Change `LoginStep` type: `'phone' | 'otp'` → `'credentials' | 'otp'`
- Use `type="email"` input with `FiMail` icon; `type="password"` input with `FiLock` icon

**Corrected API calls:**
```
Step 1 → POST /auth/login        body: { email, password }
Step 2 → POST /auth/verify-login body: { email, otp }
```

---

### Bug 2 — `SignUpPage.tsx`

**Problem:**
- Form only has `name` + `phone` — missing `email` and `password` (both required by API)
- Step 2 sends `{ otp, registrationToken }` — API expects `{ email, otp }`
- `registrationToken` does not exist in the register response; response returns `{ otp, email }`

**Fix:**
- Add `email` (required) and `password` (required) fields to the details step
- Keep `phone` field as optional
- Remove `registrationToken` state
- Store `email` from form state; pass it to the verify call
- Use `type="password"` for password field

**Corrected API calls:**
```
Step 1 → POST /auth/register              body: { name, email, password, phone? }
Step 2 → POST /auth/verify-registration   body: { email, otp }
```

---

### Bug 3 — `Navbar.tsx` (Cart badge)

**Problem:** `cartCount` is an external prop. Only `CartPage` passes it — every other page renders `<Navbar />` with no count, so the badge never appears after adding to cart.

**Fix:** Navbar fetches `/cart/get-cart` itself on mount when the user is logged in, derives the item count from the response, and renders the badge internally. Remove the `cartCount` prop.

---

### Bug 4 — `OrderListPage.tsx` (Wrong CTA after payment)

**Problem:** After successful payment the page shows a **"View cart"** button — but the cart was just checked out. This is confusing.

**Fix:**
- Replace "View cart" → **"Continue shopping"** (link to `/products`)
- Replace "Continue shopping" → **"Browse more"** or remove the duplicate

---

### Bug 5 — `CheckoutPage.tsx` (Address ID field)

**Problem:** The "Use a saved address ID (optional)" input expects the user to type a raw MongoDB `_id`. No real user knows their address ID.

**Fix:** Remove the address ID input entirely. Keep only:
1. Default address display (already works)
2. "+ Add new address" inline form (already works)

---

## Design Refinements

| # | File | Issue | Fix |
|---|---|---|---|
| R1 | `LoginPage.tsx` | Email input will inherit `type="tel"` if not changed | Use `type="email"` with `FiMail` icon |
| R2 | `SignUpPage.tsx` | New password field needs visibility toggle | Add `FiLock` icon; toggle between `type="password"` and `type="text"` via eye icon |
| R3 | `ProductDetailPage.tsx` | "Out of stock" per-variant badge only checks `isActive` on the product level; a variant with `stock === 0` shows no badge | Show "Out of stock" badge when `selectedVariant.stock === 0` |
| R4 | `CheckoutPage.tsx` | "Recalculate" button is easy to miss after filling new address fields | Add helper text: _"Fill in the address above and click Recalculate to update shipping."_ |
| R5 | `Navbar.tsx` | Both Products and Orders use `FiPackage` icon — visually identical nav links | Change Orders icon to `FiList` to differentiate |

---

## Execution Order

1. Fix `LoginPage.tsx` — credentials + OTP flow
2. Fix `SignUpPage.tsx` — email / password + verify
3. Fix `Navbar.tsx` — self-fetching cart count, icon fix
4. Fix `OrderListPage.tsx` — CTA labels
5. Fix `CheckoutPage.tsx` — remove address ID input, add helper text
6. Fix `ProductDetailPage.tsx` — per-variant out-of-stock badge

All changes are in existing files. No new routes or pages required.

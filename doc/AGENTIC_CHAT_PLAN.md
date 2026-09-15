# Agentic Shopping Chat — Plan (branch `agentic-chat`)

Master plan (architecture, chat protocol, blocks):
`product_selling_app_agent/doc/MCP_AGENT_PLAN.md`.

## Goal
Replace the demo `AssistantPage` with a real chat backed by the agent
service. The assistant searches products, shows them as real product cards,
manages the cart and wishlist, and shows orders — with proper Kartly UI, not
just text.

## What the page shows
- **Chat thread**: user bubbles, assistant text, and rich **blocks** under
  assistant messages:
  - `products` → grid of product cards (image, name, price, sale price,
    offer badge) with **View**, **Add to cart** (variant picked in a small
    sheet when a product has several variants) and **wishlist** buttons.
  - `product` → detail card with variant chips, stock, and add to cart.
  - `cart` → line items with quantity stepper and remove, subtotal /
    discount / cashback / total, **Checkout** button (goes to `/checkout`).
  - `wishlist`, `orders`, `order` → compact lists linking to existing pages
    (per-item status and tracking for orders).
  - `notice` → success / error line.
- **Pending action card**: "Add 2 × Classic Tee (M) to your cart?" with
  Confirm / Cancel, sent back as `action: confirm|cancel`.
- **Composer** with send button, disabled while waiting, and a typing
  indicator; **suggestion chips** on an empty chat ("Show hoodies under
  ₹1500", "What's in my cart?", "Track my last order").
- **Conversation list** (sheet on mobile, side column on desktop) with
  "New chat".
- Buttons inside blocks call the **REST API directly** (`userApi`) for instant
  feedback (add to cart, wishlist, quantity), then refresh the cart count.
  Typed requests go through the agent (with confirmation).

## Steps — commit after each
1. ✅ **Plan** — this file.
2. ✅ **Agent API client + types** — `src/api/agentApi.ts` (`VITE_AGENT_URL`,
   same `userToken`), `src/components/assistant/types.ts`; `.env.example`;
   `VITE_ENABLE_ASSISTANT` defaults to on in this branch.
3. ✅ **Block components** — `src/components/assistant/blocks/*`.
4. ✅ **AssistantPage** — thread, composer, suggestions, pending action,
   conversation list, login redirect, error states.
5. ✅ **Entry points & docs** — nav/tab entries always shown on this branch,
   `CLAUDE.md`, migration notes.

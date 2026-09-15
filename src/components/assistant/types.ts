// Mirrors product_selling_app_agent/src/agent/blocks.ts (buyer blocks) and its chat API.
import type { OrderStatus, OrderTracking } from '../order/orderMeta';

export type ProductCard = {
  id: string;
  name: string;
  category?: string;
  image: string | null;
  price: number;
  discountedPrice: number;
  offer: string | null;
};

export type ProductVariant = { id: string; attributes: Record<string, string>; price: number; stock: number };

export type ProductDetail = ProductCard & {
  description?: string;
  images: string[];
  selectedVariantId: string;
  variants: ProductVariant[];
};

export type CartLine = {
  productId: string;
  variantId: string;
  name: string;
  image: string | null;
  attributes: Record<string, string>;
  quantity: number;
  price: number;
  discountedPrice: number;
  stock: number;
  offer: string | null;
};

export type CartView = { items: CartLine[]; subTotal: number; discount: number; cashback: number; total: number };

export type WishlistEntry = { productId: string; name: string; category?: string; image: string | null; price?: number };

export type AssistantOrderItem = {
  subOrderId: string;
  productId: string;
  name: string;
  image: string | null;
  quantity: number;
  priceAtPurchase: number;
  attributes: Record<string, string>;
  status: OrderStatus;
  tracking: OrderTracking | null;
};

export type AssistantOrder = {
  id: string;
  orderId: string;
  createdAt: string;
  orderStatus: OrderStatus;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  totalAmount: number;
  items: AssistantOrderItem[];
};

export type CheckoutView = {
  items: { name: string; image: string | null; quantity: number; price: number; discountedPrice: number; total: number }[];
  breakdown: { subTotal?: number; discount?: number; cashback?: number; shipping?: number; tax?: number; total?: number };
  shippingAddress: { fullName?: string; city?: string; state?: string } | null;
};

export type Block =
  | { type: 'products'; data: { items: ProductCard[]; total: number } }
  | { type: 'product'; data: ProductDetail }
  | { type: 'cart'; data: CartView }
  | { type: 'wishlist'; data: { items: WishlistEntry[] } }
  | { type: 'orders'; data: { items: AssistantOrder[]; total: number } }
  | { type: 'order'; data: AssistantOrder }
  | { type: 'checkout'; data: CheckoutView }
  | { type: 'notice'; data: { tone: 'success' | 'error'; message: string } };

export type PendingAction = { id: string; tool: string; summary: string };

export type ChatAction = { type: 'confirm' | 'cancel'; actionId: string };

export type ChatResponse = {
  success: boolean;
  conversationId: string;
  reply: string;
  blocks: Block[];
  pendingAction: PendingAction | null;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  kind?: 'text' | 'action';
  text: string;
  blocks?: Block[];
  pendingAction?: (PendingAction & { status: 'pending' | 'confirmed' | 'cancelled' }) | null;
};

export type ConversationSummary = { _id: string; title: string; updatedAt: string };

export type ConversationDetail = {
  _id: string;
  title: string;
  messages: Omit<ChatMessage, 'id'>[];
  pendingAction: PendingAction | null;
};

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Same mapping as the agent's get_cart block, for refreshing the cart card after a button press. */
export const toCartView = (d: Json): CartView => ({
  items: (d.items ?? []).map((item: Json) => ({
    productId: String(item.productId?._id ?? ''),
    variantId: String(item.variantId?._id ?? ''),
    name: item.productId?.name,
    image: item.productId?.images?.[0] ?? null,
    attributes: item.variantId?.attributes ?? item.attributes ?? {},
    quantity: item.quantity,
    price: item.price,
    discountedPrice: item.discountedPrice ?? item.price,
    stock: item.variantId?.stock ?? 0,
    offer: item.activeOffer?.name ?? null,
  })),
  subTotal: d.subTotal ?? 0,
  discount: d.discount ?? 0,
  cashback: d.cashback ?? 0,
  total: d.total ?? 0,
});

export const attributeLabel = (attributes: Record<string, string> | undefined) =>
  Object.values(attributes ?? {}).join(' / ');

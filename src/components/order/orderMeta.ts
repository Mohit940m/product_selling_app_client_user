import type { BadgeTone } from '../ui/Badge';

export type OrderItem = {
  productId: string;
  variantId: string;
  name: string;
  image: string;
  priceAtPurchase: number;
  quantity: number;
  attributes: Record<string, unknown>;
};

export type OrderAddress = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type OrderStatus = 'CREATED' | 'CONFIRMED' | 'SHIPPED' | 'OUT FOR DELIVERY' | 'DELIVERED' | 'CANCELLED';

export type Order = {
  _id: string;
  orderId: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  subTotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  tracking?: { courier?: string; trackingId?: string; trackingUrl?: string };
  createdAt: string;
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export const formatOrderDate = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  CREATED: { label: 'Awaiting payment', tone: 'warn' },
  CONFIRMED: { label: 'Confirmed', tone: 'plum' },
  SHIPPED: { label: 'Shipped', tone: 'plum' },
  'OUT FOR DELIVERY': { label: 'Out for delivery', tone: 'warn' },
  DELIVERED: { label: 'Delivered', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
};

/** Payment state overrides fulfilment state when it's the more important fact. */
export const getOrderStatusMeta = (order: Pick<Order, 'orderStatus' | 'paymentStatus'>) => {
  if (order.paymentStatus === 'REFUNDED') return { label: 'Refunded', tone: 'ink' as BadgeTone };
  if (order.paymentStatus === 'FAILED') return { label: 'Payment failed', tone: 'danger' as BadgeTone };
  return ORDER_STATUS_META[order.orderStatus] ?? { label: order.orderStatus, tone: 'plum' as BadgeTone };
};

export const formatAttributes = (attributes: Record<string, unknown> | undefined) =>
  Object.entries(attributes ?? {})
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');

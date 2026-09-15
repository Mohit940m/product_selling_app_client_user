import type { BadgeTone } from '../ui/Badge';

export type OrderTracking = { courier?: string; trackingId?: string; trackingUrl?: string };

/** Each item is its own sub-order with its own status and tracking. */
export type OrderItem = {
  subOrderId: string;
  status: OrderStatus;
  tracking?: OrderTracking;
  statusUpdatedAt?: string;
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
  /** Least advanced stage among the items. */
  orderStatus: OrderStatus;
  subTotal: number;
  discount: number;
  cashback?: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
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

export const getItemStatusMeta = (status: OrderStatus) =>
  ORDER_STATUS_META[status] ?? { label: status, tone: 'plum' as BadgeTone };

/**
 * Payment state overrides fulfilment state when it's the more important fact.
 * When items are at different stages, say so rather than showing only the slowest.
 */
export const getOrderStatusMeta = (order: Pick<Order, 'orderStatus' | 'paymentStatus'> & { items?: Pick<OrderItem, 'status'>[] }) => {
  if (order.paymentStatus === 'REFUNDED') return { label: 'Refunded', tone: 'ink' as BadgeTone };
  if (order.paymentStatus === 'FAILED') return { label: 'Payment failed', tone: 'danger' as BadgeTone };
  const stages = new Set((order.items ?? []).map((item) => item.status));
  if (stages.size > 1 && order.orderStatus !== 'CREATED') {
    return { label: `${getItemStatusMeta(order.orderStatus).label} · items vary`, tone: 'plum' as BadgeTone };
  }
  return getItemStatusMeta(order.orderStatus);
};

export const FULFILMENT_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'OUT FOR DELIVERY', label: 'Out for delivery' },
  { status: 'DELIVERED', label: 'Delivered' },
];

export const formatAttributes = (attributes: Record<string, unknown> | undefined) =>
  Object.entries(attributes ?? {})
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');

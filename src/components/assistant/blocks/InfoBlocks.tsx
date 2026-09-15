import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiCheckCircle, FiExternalLink, FiXCircle } from 'react-icons/fi';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import ImageFrame from '../../ui/ImageFrame';
import { formatCurrency, formatOrderDate, getItemStatusMeta, getOrderStatusMeta } from '../../order/orderMeta';
import type { AssistantOrder, ChatMessage, CheckoutView, WishlistEntry } from '../types';

const shell = 'overflow-hidden rounded-card border border-line bg-card';

export const WishlistBlock = ({ data }: { data: { items: WishlistEntry[] } }) =>
  data.items.length === 0 ? (
    <p className={`${shell} p-3.5 text-[13px] font-medium text-muted`}>Your wishlist is empty.</p>
  ) : (
    <div className={shell}>
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <span className="font-mono text-[10.5px] font-extrabold text-muted">WISHLIST · {data.items.length}</span>
        <Link to="/wishlist" className="text-[11.5px] font-bold text-accent hover:underline">
          Open wishlist
        </Link>
      </div>
      <ul className="flex gap-2.5 overflow-x-auto p-3.5">
        {data.items.map((item) => (
          <li key={item.productId} className="w-28 shrink-0">
            <Link to={`/products/${item.productId}`} className="group block">
              <ImageFrame src={item.image} alt={item.name} className="h-24 w-28" rounded="rounded-btn" />
              <p className="mt-1.5 line-clamp-2 text-[12px] font-bold text-ink group-hover:text-accent">{item.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

const OrderItems = ({ order }: { order: AssistantOrder }) => (
  <ul className="space-y-2.5">
    {order.items.map((item) => {
      const status = getItemStatusMeta(item.status);
      const trackingUrl = item.tracking?.trackingUrl && /^https?:\/\//i.test(item.tracking.trackingUrl) ? item.tracking.trackingUrl : null;
      return (
        <li key={item.subOrderId} className="flex items-center gap-2.5">
          <ImageFrame src={item.image} alt={item.name} className="h-10 w-10 shrink-0" rounded="rounded-[10px]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-bold text-ink">
              {item.name} <span className="font-medium text-muted">× {item.quantity}</span>
            </p>
            <p className="truncate font-mono text-[10.5px] text-muted">
              {item.subOrderId}
              {item.tracking?.trackingId && ` · ${item.tracking.courier ?? 'Courier'} ${item.tracking.trackingId}`}
            </p>
          </div>
          {order.paymentStatus === 'PAID' && <Badge tone={status.tone}>{status.label}</Badge>}
          {trackingUrl && (
            <a href={trackingUrl} target="_blank" rel="noopener noreferrer" aria-label={`Track ${item.name}`} className="p-1 text-accent">
              <FiExternalLink size={14} />
            </a>
          )}
        </li>
      );
    })}
  </ul>
);

const OrderCard = ({ order }: { order: AssistantOrder }) => {
  const status = getOrderStatusMeta(order);
  return (
    <div className="space-y-2.5 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to={`/orders/${order.id}`} className="font-mono text-[11.5px] font-bold text-ink hover:text-accent">
          {order.orderId}
        </Link>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <p className="text-[11.5px] font-medium text-muted">
        {formatOrderDate(order.createdAt)} · {formatCurrency(order.totalAmount)}
      </p>
      <OrderItems order={order} />
    </div>
  );
};

export const OrdersBlock = ({ data }: { data: { items: AssistantOrder[]; total: number } }) =>
  data.items.length === 0 ? (
    <p className={`${shell} p-3.5 text-[13px] font-medium text-muted`}>You have no orders yet.</p>
  ) : (
    <div className={shell}>
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <span className="font-mono text-[10.5px] font-extrabold text-muted">ORDERS · {data.items.length} OF {data.total}</span>
        <Link to="/orders" className="text-[11.5px] font-bold text-accent hover:underline">
          All orders
        </Link>
      </div>
      <ul className="divide-y divide-line">
        {data.items.map((order) => (
          <li key={order.id}>
            <OrderCard order={order} />
          </li>
        ))}
      </ul>
    </div>
  );

export const OrderBlock = ({ data }: { data: AssistantOrder }) => (
  <div className={shell}>
    <OrderCard order={data} />
  </div>
);

export const CheckoutBlock = ({ data }: { data: CheckoutView }) => {
  const b = data.breakdown;
  return (
    <div className={`${shell} p-3.5`}>
      <p className="mb-2.5 font-mono text-[10.5px] font-extrabold text-muted">
        CHECKOUT SUMMARY{data.shippingAddress ? ` · TO ${data.shippingAddress.city?.toUpperCase()}` : ''}
      </p>
      <dl className="space-y-1.5 text-[12.5px]">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal ({data.items.reduce((s, i) => s + i.quantity, 0)} items)</dt>
          <dd className="font-semibold text-ink">{formatCurrency(b.subTotal ?? 0)}</dd>
        </div>
        {(b.discount ?? 0) > 0 && (
          <div className="flex justify-between text-ok-fg">
            <dt>Discount</dt>
            <dd className="font-semibold">−{formatCurrency(b.discount ?? 0)}</dd>
          </div>
        )}
        {(b.cashback ?? 0) > 0 && (
          <div className="flex justify-between text-ok-fg">
            <dt>Cashback</dt>
            <dd className="font-semibold">−{formatCurrency(b.cashback ?? 0)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted">Shipping</dt>
          <dd className="font-semibold text-ink">{b.shipping ? formatCurrency(b.shipping) : 'Free'}</dd>
        </div>
        <div className="flex justify-between pt-1 text-[14px]">
          <dt className="font-extrabold text-ink">Total</dt>
          <dd className="font-black text-ink">{formatCurrency(b.total ?? 0)}</dd>
        </div>
      </dl>
      <Link
        to="/checkout"
        className="mt-3 flex items-center justify-center rounded-btn bg-accent px-4 py-3 text-[13px] font-extrabold text-onacc lift"
      >
        Go to checkout
      </Link>
    </div>
  );
};

export const NoticeBlock = ({ data }: { data: { tone: 'success' | 'error'; message: string } }) => (
  <p
    role={data.tone === 'error' ? 'alert' : 'status'}
    className={`flex items-center gap-2 rounded-btn px-3.5 py-2.5 text-[12.5px] font-bold ${
      data.tone === 'success' ? 'bg-ok-bg text-ok-fg' : 'bg-bad-bg text-bad-fg'
    }`}
  >
    {data.tone === 'success' ? <FiCheckCircle size={15} /> : <FiXCircle size={15} />}
    {data.message}
  </p>
);

type PendingProps = {
  pending: NonNullable<ChatMessage['pendingAction']>;
  isLatest: boolean;
  busy: boolean;
  onDecide: (actionId: string, confirmed: boolean) => void;
};

export const PendingActionCard = ({ pending, isLatest, busy, onDecide }: PendingProps) => {
  const open = pending.status === 'pending' && isLatest;
  return (
    <div className="rounded-card border border-line bg-soft p-3.5 text-[var(--k-on-soft)]">
      <p className="flex items-start gap-2 text-[13px] font-bold">
        <FiAlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>{pending.summary}?</span>
      </p>
      {open ? (
        <div className="mt-3 flex gap-2.5">
          <Button variant="outline" size="sm" disabled={busy} onClick={() => onDecide(pending.id, false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={busy} onClick={() => onDecide(pending.id, true)}>
            Confirm
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-[11.5px] font-semibold opacity-75">
          {pending.status === 'confirmed' ? 'Confirmed' : pending.status === 'cancelled' ? 'Cancelled' : 'Expired'}
        </p>
      )}
    </div>
  );
};

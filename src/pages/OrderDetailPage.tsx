import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiExternalLink, FiPackage } from 'react-icons/fi';
import axios from 'axios';
import userApi from '../api/userApi';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Panel from '../components/ui/Panel';
import ImageFrame from '../components/ui/ImageFrame';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  formatAttributes,
  formatCurrency,
  formatOrderDate,
  getOrderStatusMeta,
  type Order,
  type OrderStatus,
} from '../components/order/orderMeta';

const FULFILMENT_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'OUT FOR DELIVERY', label: 'Out for delivery' },
  { status: 'DELIVERED', label: 'Delivered' },
];

type LoadState = { key: string; order: Order | null; error: string | null };

/** Backed by `GET /orders/:orderId`; `:orderId` is the Mongo _id or the ORD-... id. */
const OrderDetailPage = () => {
  const { orderId = '' } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState | null>(null);
  const isLoading = state?.key !== orderId;
  const order = isLoading ? null : state.order;
  useDocumentTitle(order ? `Order ${order.orderId}` : 'Order');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }

    let cancelled = false;
    userApi
      .get(`/orders/${encodeURIComponent(orderId)}`)
      .then(({ data }) => {
        if (!cancelled) setState({ key: orderId, order: data.data ?? null, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        const notFound = axios.isAxiosError(err) && err.response?.status === 404;
        const msg = notFound
          ? null
          : axios.isAxiosError(err)
            ? err.response?.data?.message ?? 'Failed to load this order.'
            : 'Failed to load this order.';
        setState({ key: orderId, order: null, error: msg });
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, orderId]);

  const backLink = (
    <Link
      to="/orders"
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted t-fast hover:text-accent"
    >
      <FiArrowLeft size={15} /> All orders
    </Link>
  );

  if (isLoading) {
    return (
      <Container className="py-6 lg:py-10">
        {backLink}
        <Skeleton className="mb-6 h-7 w-1/2" />
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <Skeleton preset="block" className="h-64 w-full" />
          <Skeleton preset="block" className="h-64 w-full" />
        </div>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-6 lg:py-10">
        {backLink}
        <EmptyState
          icon={<FiPackage size={32} />}
          title={state?.error ? "Couldn't load this order" : 'Order not found'}
          description={state?.error ?? "This order doesn't exist or doesn't belong to your account."}
          action={
            <Button variant="primary" onClick={() => navigate('/orders')}>
              Back to orders
            </Button>
          }
        />
      </Container>
    );
  }

  const status = getOrderStatusMeta(order);
  const stepIndex = FULFILMENT_STEPS.findIndex((step) => step.status === order.orderStatus);
  const showTimeline = order.paymentStatus === 'PAID' && stepIndex !== -1;
  const { tracking, shippingAddress: address } = order;

  return (
    <Container className="py-6 lg:py-10">
      {backLink}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 lg:mb-8">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-bold text-muted">PLACED {formatOrderDate(order.createdAt).toUpperCase()}</p>
          <h1 className="mt-1.5 break-all font-extrabold text-[22px] tracking-[-.02em]">{order.orderId}</h1>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {showTimeline && (
            <Panel aria-label="Order progress" className="p-4 sm:p-6">
              <ol className="grid grid-cols-4 gap-2">
                {FULFILMENT_STEPS.map((step, i) => {
                  const done = i <= stepIndex;
                  return (
                    <li key={step.status} className="flex flex-col items-center gap-2 text-center">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          done ? 'bg-accent text-onacc' : 'border border-line bg-soft2 text-muted'
                        }`}
                        aria-hidden="true"
                      >
                        {done ? <FiCheck size={15} /> : <span className="text-[11px] font-bold">{i + 1}</span>}
                      </span>
                      <span className={`text-[11px] font-bold leading-tight ${done ? 'text-ink' : 'text-muted'}`}>
                        {step.label}
                        <span className="sr-only">{done ? ' (done)' : ' (pending)'}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
              {tracking?.trackingId && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-btn bg-soft2 p-3">
                  <span className="text-sm">
                    <span className="font-bold text-ink">{tracking.courier || 'Courier'}</span>{' '}
                    <span className="font-mono text-muted">{tracking.trackingId}</span>
                  </span>
                  {tracking.trackingUrl && /^https?:\/\//i.test(tracking.trackingUrl) && (
                    <a
                      href={tracking.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-extrabold text-accent hover:underline"
                    >
                      Track package <FiExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}
            </Panel>
          )}

          <Panel className="p-4 sm:p-6">
            <h2 className="mb-4 font-extrabold text-ink">Items</h2>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={`${item.productId}-${item.variantId}`} className="flex gap-3.5 py-3.5 first:pt-0 last:pb-0">
                  <ImageFrame src={item.image} alt={item.name} className="h-16 w-16 shrink-0" rounded="rounded-btn" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/products/${item.productId}`} className="line-clamp-2 text-[14px] font-bold text-ink hover:text-accent">
                      {item.name}
                    </Link>
                    {formatAttributes(item.attributes) && (
                      <p className="mt-1 text-xs font-medium text-muted">{formatAttributes(item.attributes)}</p>
                    )}
                    <p className="mt-1 text-xs font-medium text-muted">
                      {formatCurrency(item.priceAtPurchase)} × {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 text-[14px] font-extrabold text-ink">
                    {formatCurrency(item.priceAtPurchase * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel className="p-4 sm:p-6">
            <h2 className="mb-4 font-extrabold text-ink">Summary</h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-bold text-ink">{formatCurrency(order.subTotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd className="font-bold text-ok-fg">−{formatCurrency(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className="font-bold text-ink">{order.shippingCost > 0 ? formatCurrency(order.shippingCost) : 'Free'}</dd>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">Tax</dt>
                  <dd className="font-bold text-ink">{formatCurrency(order.tax)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-extrabold text-ink">Total</dt>
                <dd className="font-black text-ink">{formatCurrency(order.totalAmount)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel className="p-4 sm:p-6">
            <h2 className="mb-3 font-extrabold text-ink">Shipping to</h2>
            <address className="text-sm not-italic leading-relaxed text-muted">
              <span className="block font-bold text-ink">{address.fullName}</span>
              {address.addressLine1}
              {address.addressLine2 && <>, {address.addressLine2}</>}
              <br />
              {address.city}, {address.state} {address.pincode}
              <br />
              {address.country}
              <span className="mt-1.5 block font-mono text-xs">{address.phone}</span>
            </address>
          </Panel>
        </div>
      </div>
    </Container>
  );
};

export default OrderDetailPage;

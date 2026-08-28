import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { FiClock } from 'react-icons/fi';
import Container from '../components/layout/Container';
import Confetti from '../components/motion/Confetti';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type LocationState = {
  orderId?: string;
  /** The real per-seller delivery-time estimate from the checkout summary
   * (e.g. "3-5 Days") — not a fabricated date, just carried forward from
   * `SellerShipping.calculateShipping`'s actual output. */
  estimatedTime?: string;
};

/**
 * Payment-success screen (Kartly Commerce Kit.dc.html screen 07). Split
 * out of the old OrderListPage so /orders can become a real order list
 * once the backend exposes one. Only renders with a real orderId passed
 * via navigation state from CheckoutPage — no fabricated order data.
 */
const OrderSuccessPage = () => {
  useDocumentTitle('Order Confirmed');
  const location = useLocation();
  const state = location.state as LocationState | null;
  const orderId = state?.orderId;
  const estimatedTime = state?.estimatedTime;
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!orderId) {
    return <Navigate to="/products" replace />;
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-10">
      <div className="mx-auto w-full max-w-[480px] text-center">
        <div className="relative mx-auto mb-8 flex items-center justify-center">
          {!prefersReducedMotion && (
            <>
              <div className="absolute h-[130px] w-[130px] animate-ring rounded-full bg-accent opacity-20" />
              <div
                className="absolute h-[130px] w-[130px] animate-ring rounded-full bg-accent opacity-20"
                style={{ animationDelay: '1.2s' }}
              />
              <Confetti />
            </>
          )}
          <div
            className={`flex h-28 w-28 items-center justify-center rounded-full bg-accent ${
              prefersReducedMotion ? '' : 'animate-pop'
            }`}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path
                d="M12 25l8 8 16-18"
                stroke="var(--k-onAcc)"
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={60}
                strokeDashoffset={prefersReducedMotion ? 0 : 60}
                style={prefersReducedMotion ? undefined : { animation: 'kfDraw .55s .35s ease-out forwards' }}
              />
            </svg>
          </div>
        </div>

        <h1
          className="font-black text-[30px] leading-[1.1] tracking-[-.03em]"
          style={prefersReducedMotion ? undefined : { animation: 'kfUp .6s .25s both' }}
        >
          Payment successful
        </h1>
        <div
          className="mt-3.5 rounded-btn bg-soft2 p-3"
          style={prefersReducedMotion ? undefined : { animation: 'kfUp .6s .4s both' }}
        >
          <p className="text-xs text-muted">Order ID</p>
          <p className="break-all font-mono text-sm font-bold text-accent">{orderId}</p>
        </div>
        <p
          className="mt-3.5 text-sm font-medium text-muted"
          style={prefersReducedMotion ? undefined : { animation: 'kfUp .6s .55s both' }}
        >
          Your order is confirmed. Keep the order ID above for reference.
        </p>

        {estimatedTime && (
          <div
            className="mt-3.5 flex items-center justify-between rounded-card border border-line bg-soft2 p-4"
            style={prefersReducedMotion ? undefined : { animation: 'kfUp .6s .55s both' }}
          >
            <span className="flex items-center gap-2 font-mono text-[11px] font-bold text-muted">
              <FiClock size={14} />
              ESTIMATED ARRIVAL
            </span>
            <span className="font-extrabold text-ink">{estimatedTime}</span>
          </div>
        )}

        <div
          className="mt-8 grid gap-3 sm:grid-cols-2"
          style={prefersReducedMotion ? undefined : { animation: 'kfUp .6s .7s both' }}
        >
          <Link
            to="/products"
            className="flex items-center justify-center gap-2 rounded-btn border border-line bg-card px-4 py-3 text-sm font-semibold text-ink t-fast hover:border-accent hover:text-accent"
          >
            Continue shopping
          </Link>
          <Link
            to="/products"
            className="flex items-center justify-center gap-2 rounded-btn bg-ink px-4 py-3 text-sm font-extrabold text-card t-base hover:shadow-lift-ink"
          >
            Browse more products
          </Link>
        </div>
      </div>
    </Container>
  );
};

export default OrderSuccessPage;

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiMapPin, FiPackage, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Panel from '../components/ui/Panel';
import Input from '../components/ui/Input';
import ImageFrame from '../components/ui/ImageFrame';
import Skeleton from '../components/ui/Skeleton';
import { notifyCartChanged } from '../hooks/useCartCount';

type CheckoutItem = {
  productId: string;
  variantId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  discountedPrice: number;
  total: number;
  savings: number;
};

type ShippingAddress = {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

type Breakdown = {
  subTotal: number;
  discount: number;
  discountedAmount: number;
  shipping: number;
  tax: number;
  total: number;
};

type ShippingDetail = {
  sellerId: string;
  cost: number;
  time: string;
  type: string;
};

type CheckoutSummary = {
  shippingAddress: ShippingAddress;
  items: CheckoutItem[];
  breakdown: Breakdown;
  shippingDetails?: ShippingDetail[];
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const CHECKOUT_STEPS = ['Address', 'Payment', 'Confirm'] as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

/** With multiple sellers in one order, show the longest (worst-case)
 * delivery window rather than an arbitrary one — falls back to the
 * first entry's raw text if none of the times parse as "N-M Days". */
const pickEstimatedTime = (shippingDetails?: ShippingDetail[]): string | undefined => {
  if (!shippingDetails?.length) return undefined;
  let worst = shippingDetails[0];
  let worstMax = -1;
  for (const detail of shippingDetails) {
    const match = detail.time.match(/(\d+)\D*$/);
    const max = match ? Number(match[1]) : -1;
    if (max > worstMax) {
      worstMax = max;
      worst = detail;
    }
  }
  return worst.time;
};

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const LoadingOverlay = () => (
  <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-ink/60 backdrop-blur-sm">
    <div className="flex items-center gap-2" role="status" aria-label="Verifying payment">
      <span className="h-3 w-3 animate-dot rounded-full bg-accent" />
      <span className="h-3 w-3 animate-dot rounded-full bg-accent" style={{ animationDelay: '.2s' }} />
      <span className="h-3 w-3 animate-dot rounded-full bg-accent" style={{ animationDelay: '.4s' }} />
    </div>
    <p className="text-sm font-bold text-card">Confirming your payment…</p>
  </div>
);

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [useNewAddress, setUseNewAddress] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    calculateSummary({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildAddressPayload = () => {
    if (useNewAddress) return { fullName, phone, addressLine1, addressLine2, city, state, pincode };
    return {};
  };

  const calculateSummary = async (payload: Record<string, unknown>) => {
    setIsLoadingSummary(true);
    try {
      const { data } = await userApi.post('/order/checkout', payload);
      setSummary(data.data);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Failed to calculate checkout.'
        : 'Failed to calculate checkout.';
      toast.error(msg);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleAddressChange = () => {
    calculateSummary(buildAddressPayload());
  };

  const placeOrder = async () => {
    // The disabled attribute on the Pay button only takes effect after
    // React's next render — a fast double-click could otherwise fire two
    // Razorpay order-create calls before then. This is the one place in
    // the app where that would be genuinely consequential (real money).
    // isPlacingOrder must flip to true *before* the first await (script
    // load) rather than after it — script load is a real network fetch
    // the first time it runs, leaving a wide window where a second click
    // would still see isPlacingOrder as false and slip past this guard.
    if (isPlacingOrder) return;
    setIsPlacingOrder(true);
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Failed to load payment gateway. Please try again.');
      setIsPlacingOrder(false);
      return;
    }

    try {
      const payload = buildAddressPayload();
      const { data } = await userApi.post('/order/create-order', payload);
      const { orderId, razorpayOrderId, amount, currency, key, user } = data.data;

      const options = {
        key,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: 'ShopNow',
        description: 'Order Payment',
        prefill: { name: user.name, email: user.email, contact: user.phone },
        theme: { color: '#A87BF5' },
        handler: async (response: Record<string, string>) => {
          setIsVerifying(true);
          try {
            await userApi.post('/order/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            // verifyPayment clears the cart server-side on success — keep
            // the nav badge in sync rather than leaving it showing the
            // now-checked-out item count.
            notifyCartChanged();
            toast.success('Payment successful! Order placed.');
            navigate('/orders/success', { state: { orderId, estimatedTime: pickEstimatedTime(summary?.shippingDetails) } });
          } catch {
            toast.error('Payment verification failed. Please contact support.');
          } finally {
            setIsVerifying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPlacingOrder(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Failed to create order.'
        : 'Failed to create order.';
      toast.error(msg);
      setIsPlacingOrder(false);
    }
  };

  const currentStep = isPlacingOrder || isVerifying ? 2 : summary ? 1 : 0;

  return (
    <Container className="py-6 lg:py-10">
      {isVerifying && <LoadingOverlay />}

      <div className="mb-6 flex items-center gap-3.5 lg:mb-8">
        <Link
          to="/cart"
          aria-label="Back to cart"
          className="relative flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-[13px] border border-edge t-fast before:absolute before:-inset-2 before:content-[''] hover:border-accent"
        >
          <FiArrowLeft size={16} />
        </Link>
        <div>
          <p className="font-mono text-[11px] font-bold text-muted">FINAL STEP</p>
          <h1 className="mt-1 font-extrabold text-[22px] tracking-[-.02em]">Checkout</h1>
        </div>
      </div>

      {/* Progress indicator — purely reflects where the buyer already is in
          this single-page flow (no step gating, nothing to regress): 0
          while the address/summary is still loading, 1 once a real
          breakdown is showing and ready to pay, 2 once payment has been
          initiated. Mobile gets the spec's plain 3-bar treatment (4.4.2);
          desktop gets a labelled dot stepper (4.4.9). */}
      <div className="mb-6 flex gap-2 lg:hidden">
        {CHECKOUT_STEPS.map((_, i) => (
          <div key={i} className={`h-[5px] flex-1 rounded-full t-base ${i <= currentStep ? 'bg-accent' : 'bg-line'}`} />
        ))}
      </div>
      <div className="mb-8 hidden items-center lg:flex">
        {CHECKOUT_STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold t-base ${
                  i <= currentStep ? 'bg-accent text-onacc' : 'bg-line text-muted'
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-[12.5px] font-bold t-base ${i <= currentStep ? 'text-ink' : 'text-muted'}`}>{label}</span>
            </div>
            {i < CHECKOUT_STEPS.length - 1 && (
              <div className={`mx-3.5 h-px flex-1 t-base ${i < currentStep ? 'bg-accent' : 'bg-line'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Panel>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-tile bg-soft text-[var(--k-on-soft)]">
                <FiMapPin size={20} />
              </span>
              <div>
                <h2 className="text-lg font-extrabold text-ink">Delivery Address</h2>
                <p className="text-sm text-muted">Select or enter a shipping address.</p>
              </div>
            </div>

            {summary?.shippingAddress && !useNewAddress && (
              <div className="mb-4 rounded-btn border border-accent bg-soft2 p-3.5 text-sm">
                <p className="font-extrabold text-ink">{summary.shippingAddress.fullName}</p>
                <p className="text-muted">
                  {summary.shippingAddress.addressLine1}
                  {summary.shippingAddress.addressLine2 ? `, ${summary.shippingAddress.addressLine2}` : ''}
                </p>
                <p className="text-muted">
                  {summary.shippingAddress.city}, {summary.shippingAddress.state} – {summary.shippingAddress.pincode}
                </p>
                <p className="text-muted">{summary.shippingAddress.phone}</p>
                <p className="mt-1 text-xs font-bold text-accent">Default address</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setUseNewAddress(!useNewAddress)}
                className="text-sm font-bold text-accent hover:underline"
              >
                {useNewAddress ? '− Cancel new address' : '+ Use a different address'}
              </button>

              {useNewAddress && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
                  <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" />
                  <Input
                    label="Address line 1"
                    wrapperClassName="sm:col-span-2"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Street / house number"
                  />
                  <Input
                    label="Address line 2 (optional)"
                    wrapperClassName="sm:col-span-2"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Landmark, area"
                  />
                  <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                  <Input label="State" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                  <Input label="Pincode" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode" />
                  <div className="flex flex-col justify-end gap-1.5">
                    <p className="text-xs text-muted">Fill in the fields above, then recalculate shipping.</p>
                    <Button variant="dark" size="sm" onClick={handleAddressChange}>
                      Recalculate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {summary && (
            <Panel>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-tile bg-soft text-[var(--k-on-soft)]">
                  <FiPackage size={20} />
                </span>
                <h2 className="text-lg font-extrabold text-ink">Order Items</h2>
              </div>
              <div className="space-y-3">
                {summary.items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 rounded-btn border border-line p-3">
                    <ImageFrame src={item.image} alt={item.name} className="h-12 w-12 shrink-0 rounded-[12px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                      <p className="text-xs text-muted">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-ink">{formatCurrency(item.total)}</p>
                      {item.savings > 0 && <p className="text-xs font-semibold text-ok-fg">Save {formatCurrency(item.savings)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Panel className="bg-soft2">
            <h2 className="mb-4 text-lg font-extrabold text-ink">Price Summary</h2>
            {isLoadingSummary ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4" />
                ))}
              </div>
            ) : summary ? (
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-muted">Subtotal</span>
                  <span className="font-semibold text-ink">{formatCurrency(summary.breakdown.subTotal)}</span>
                </div>
                {summary.breakdown.discount > 0 && (
                  <div className="flex justify-between text-ok-fg">
                    <span className="font-medium">Discount</span>
                    <span className="font-semibold">-{formatCurrency(summary.breakdown.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="flex items-center gap-1 font-medium text-muted">
                    <FiTruck size={13} /> Shipping
                  </span>
                  <span className="font-semibold text-ink">
                    {summary.breakdown.shipping === 0 ? 'Free' : formatCurrency(summary.breakdown.shipping)}
                  </span>
                </div>
                {summary.breakdown.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="font-medium text-muted">Tax</span>
                    <span className="font-semibold text-ink">{formatCurrency(summary.breakdown.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-3">
                  <span className="font-extrabold text-ink">Total</span>
                  <span className="text-[17px] font-extrabold text-ink">{formatCurrency(summary.breakdown.total)}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Enter an address to see the full breakdown.</p>
            )}

            <Button
              variant="dark"
              onClick={placeOrder}
              loading={isPlacingOrder}
              disabled={isPlacingOrder || !summary || isLoadingSummary}
              fullWidth
              className="mt-4 hidden lg:inline-flex"
            >
              Place Order & Pay
            </Button>
          </Panel>
        </aside>
      </div>

      {/* Mobile sticky pay bar — sits just above the bottom tab bar, same
          pattern as ProductDetailPage's sticky add-to-cart bar, so the pay
          action is always reachable without scrolling past the whole form. */}
      {summary && (
        <div className="sticky bottom-[76px] z-30 -mx-5 mt-5 flex items-center gap-3.5 border-t border-line bg-card px-5 py-4 sm:-mx-8 sm:px-8 lg:hidden">
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-muted">Pay total</p>
            <p className="font-extrabold text-[21px] text-ink">{formatCurrency(summary.breakdown.total)}</p>
          </div>
          <Button
            variant="dark"
            onClick={placeOrder}
            loading={isPlacingOrder}
            disabled={isPlacingOrder || isLoadingSummary}
            className="flex-1"
          >
            Pay now
          </Button>
        </div>
      )}
    </Container>
  );
};

export default CheckoutPage;

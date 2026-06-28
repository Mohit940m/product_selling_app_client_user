import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiPackage, FiTruck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import Navbar from '../components/Navbar';
import Button from '../components/Button';

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

type CheckoutSummary = {
  shippingAddress: ShippingAddress;
  items: CheckoutItem[];
  breakdown: Breakdown;
};

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

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

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
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
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      toast.error('Failed to load payment gateway. Please try again.');
      return;
    }

    setIsPlacingOrder(true);
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
        theme: { color: '#A78BFA' },
        handler: async (response: Record<string, string>) => {
          try {
            await userApi.post('/order/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful! Order placed.');
            navigate('/orders', { state: { orderId } });
          } catch {
            toast.error('Payment verification failed. Please contact support.');
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

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Final step</p>
            <h1 className="text-2xl font-bold text-text">Checkout</h1>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                    <FiMapPin size={20} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-text">Delivery Address</h2>
                    <p className="text-sm text-gray-600">Select or enter a shipping address.</p>
                  </div>
                </div>

                {summary?.shippingAddress && !useNewAddress && (
                  <div className="mb-4 rounded-lg border border-primary bg-secondary p-3 text-sm">
                    <p className="font-bold text-text">{summary.shippingAddress.fullName}</p>
                    <p className="text-gray-600">{summary.shippingAddress.addressLine1}{summary.shippingAddress.addressLine2 ? `, ${summary.shippingAddress.addressLine2}` : ''}</p>
                    <p className="text-gray-600">{summary.shippingAddress.city}, {summary.shippingAddress.state} – {summary.shippingAddress.pincode}</p>
                    <p className="text-gray-600">{summary.shippingAddress.phone}</p>
                    <p className="mt-1 text-xs font-semibold text-accent">Default address</p>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setUseNewAddress(!useNewAddress)}
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    {useNewAddress ? '− Cancel new address' : '+ Use a different address'}
                  </button>

                  {useNewAddress && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-text">Full name</label>
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Full name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text">Phone</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                          placeholder="9876543210" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-text">Address line 1</label>
                        <input type="text" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Street / house number" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-text">Address line 2 (optional)</label>
                        <input type="text" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Landmark, area" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text">City</label>
                        <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                          placeholder="City" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text">State</label>
                        <input type="text" value={state} onChange={(e) => setState(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                          placeholder="State" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text">Pincode</label>
                        <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Pincode" />
                      </div>
                      <div className="flex flex-col justify-end gap-1">
                        <p className="text-xs text-gray-500">Fill in the fields above, then click Recalculate to update shipping.</p>
                        <button
                          type="button"
                          onClick={handleAddressChange}
                          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-accent"
                        >
                          Recalculate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {summary && (
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                      <FiPackage size={20} />
                    </span>
                    <h2 className="text-lg font-bold text-text">Order Items</h2>
                  </div>
                  <div className="space-y-3">
                    {summary.items.map((item) => (
                      <div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-text">{item.name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-accent">{formatCurrency(item.total)}</p>
                          {item.savings > 0 && (
                            <p className="text-xs text-green-700">Save {formatCurrency(item.savings)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                <h2 className="mb-4 text-lg font-bold text-text">Price Summary</h2>
                {isLoadingSummary ? (
                  <div className="animate-pulse space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-4 rounded bg-secondary" />
                    ))}
                  </div>
                ) : summary ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">{formatCurrency(summary.breakdown.subTotal)}</span>
                    </div>
                    {summary.breakdown.discount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Discount</span>
                        <span className="font-semibold">-{formatCurrency(summary.breakdown.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 flex items-center gap-1">
                        <FiTruck size={13} /> Shipping
                      </span>
                      <span className="font-semibold">
                        {summary.breakdown.shipping === 0 ? 'Free' : formatCurrency(summary.breakdown.shipping)}
                      </span>
                    </div>
                    {summary.breakdown.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-semibold">{formatCurrency(summary.breakdown.tax)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3 flex justify-between">
                      <span className="font-bold text-text">Total</span>
                      <span className="text-lg font-bold text-accent">{formatCurrency(summary.breakdown.total)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Enter an address to see the full breakdown.</p>
                )}

                <Button
                  label={isPlacingOrder ? 'Processing...' : 'Place Order & Pay'}
                  onClick={placeOrder}
                  disabled={isPlacingOrder || !summary || isLoadingSummary}
                  className="mt-4 w-full py-3"
                />
              </div>
            </aside>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>ShopNow</p>
          <p>Discover and shop from thousands of products.</p>
        </div>
      </footer>
    </div>
  );
};

export default CheckoutPage;

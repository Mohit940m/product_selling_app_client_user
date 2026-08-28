import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiShoppingCart, FiTrash2, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Panel from '../components/ui/Panel';
import ImageFrame from '../components/ui/ImageFrame';
import QtyStepper from '../components/ui/QtyStepper';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { notifyCartChanged } from '../hooks/useCartCount';

type CartVariant = {
  _id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
};

type CartProduct = {
  _id: string;
  name: string;
  category: string;
  images: string[];
};

type CartItem = {
  productId: CartProduct;
  variantId: CartVariant;
  quantity: number;
  attributes: Record<string, string>;
  priceSnapshot: number;
  price: number;
  discountedPrice: number;
  activeOffer: { name: string } | null;
  savings: number;
};

type Cart = {
  _id: string;
  items: CartItem[];
  subTotal: number;
  discount: number;
  total: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCart = async () => {
    setIsLoading(true);
    try {
      const { data } = await userApi.get('/cart/get-cart');
      setCart(data.data);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Failed to load cart.'
        : 'Failed to load cart.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (productId: string, variantId: string) => {
    const key = `${productId}-${variantId}`;
    if (removingId === key || updatingId === key) return;
    setRemovingId(key);
    try {
      const { data } = await userApi.post('/cart/remove-from-cart', { productId, variantId });
      setCart(data.data);
      notifyCartChanged();
      toast.success('Item removed from cart.');
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Failed to remove item.'
        : 'Failed to remove item.';
      toast.error(msg);
    } finally {
      setRemovingId(null);
    }
  };

  // No "set quantity to N" endpoint exists — /cart/add-to-cart increments
  // and /cart/remove-from-cart decrements (optionally removing the line
  // once it hits 0), so the stepper always moves by exactly 1 per click.
  const updateQuantity = async (productId: string, variantId: string, delta: 1 | -1) => {
    const key = `${productId}-${variantId}`;
    if (updatingId === key || removingId === key) return;
    setUpdatingId(key);
    try {
      const { data } = delta === 1
        ? await userApi.post('/cart/add-to-cart', { productId, variantId, quantity: 1 })
        : await userApi.post('/cart/remove-from-cart', { productId, variantId, quantity: 1 });
      setCart(data.data);
      // A decrement that empties a line changes the distinct-line count
      // the nav badge is based on; an increment doesn't, but notifying
      // either way keeps this correct regardless of exactly which count
      // semantic the badge ends up using.
      notifyCartChanged();
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Failed to update quantity.'
        : 'Failed to update quantity.';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const cartItemCount = cart?.items?.length ?? 0;

  return (
    <Container className="py-6 lg:py-10">
      <div className="mb-6 lg:mb-8">
        <h1 className="font-extrabold text-[24px] tracking-[-.02em]">
          Your bag{' '}
          {cartItemCount > 0 && <span className="text-[15px] font-medium text-muted">({cartItemCount})</span>}
        </h1>
      </div>

      {isLoading ? (
        <div className="space-y-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} interactive={false} className="flex gap-3.25 p-3">
              <Skeleton className="h-16 w-16 rounded-[14px]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : !cart || cartItemCount === 0 ? (
        <EmptyState
          icon={<FiShoppingCart size={32} />}
          title="Your cart is empty"
          description="Add products to get started."
          action={
            <Button variant="primary" onClick={() => navigate('/products')} icon={<FiShoppingCart size={16} />}>
              Browse products
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            {cart.items.map((item) => {
              const pid = item.productId._id;
              const vid = item.variantId._id;
              const key = `${pid}-${vid}`;
              const isRemoving = removingId === key;
              const isUpdating = updatingId === key;

              return (
                <Card key={`${pid}-${vid}`} interactive className="flex gap-3.25 p-3 slide-x hover:border-accent">
                  <Link to={`/products/${pid}`} className="shrink-0">
                    <ImageFrame
                      src={item.productId.images?.[0]}
                      alt={item.productId.name}
                      className="h-16 w-16 rounded-[14px] lg:h-20 lg:w-20"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <Link to={`/products/${pid}`} className="line-clamp-1 text-[13px] font-bold text-ink hover:text-accent">
                      {item.productId.name}
                    </Link>
                    <p className="text-[11px] font-semibold text-muted">
                      {Object.entries(item.attributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </p>
                    {item.activeOffer && <p className="text-[11px] font-bold text-accent">{item.activeOffer.name}</p>}
                    <div className="mt-1 flex items-center gap-2.5">
                      <QtyStepper
                        value={item.quantity}
                        max={item.variantId.stock}
                        disabled={isUpdating || isRemoving}
                        onChange={(next) => updateQuantity(pid, vid, next > item.quantity ? 1 : -1)}
                        className="px-2! py-1!"
                      />
                      <p className="text-[13px] font-extrabold text-ink">
                        {formatCurrency(item.discountedPrice * item.quantity)}
                      </p>
                    </div>
                    {item.savings > 0 && (
                      <p className="text-[11px] font-semibold text-ok-fg">Save {formatCurrency(item.savings * item.quantity)}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      onClick={() => removeItem(pid, vid)}
                      disabled={isRemoving}
                      className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1.5 text-[11px] font-bold text-muted t-fast hover:border-danger hover:text-danger disabled:opacity-50"
                    >
                      <FiTrash2 size={13} />
                      {isRemoving ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Panel className="-mx-5 rounded-t-3xl rounded-b-none border-x-0 border-b-0 bg-soft2 sm:-mx-8 lg:mx-0 lg:rounded-panel lg:border">
              <h2 className="mb-4 text-lg font-extrabold text-ink">Order Summary</h2>
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  disabled
                  placeholder="Promo code"
                  title="Promo codes are coming soon"
                  className="flex-1 rounded-btn border border-dashed border-edge bg-transparent px-3.75 py-3.25 text-xs font-semibold text-muted placeholder:text-muted"
                />
                <button
                  type="button"
                  disabled
                  title="Promo codes are coming soon"
                  className="cursor-not-allowed rounded-btn bg-line px-4.5 py-3.25 text-xs font-bold text-muted"
                >
                  Apply
                </button>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-muted">Subtotal</span>
                  <span className="font-semibold text-ink">{formatCurrency(cart.subTotal)}</span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-ok-fg">
                    <span className="font-medium">Discount</span>
                    <span className="font-semibold">-{formatCurrency(cart.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-3">
                  <span className="font-extrabold text-ink">Total</span>
                  <span className="text-[17px] font-extrabold text-ink">{formatCurrency(cart.total)}</span>
                </div>
              </div>
              <Button
                variant="primary"
                icon={<FiArrowRight size={16} />}
                onClick={() => navigate('/checkout')}
                fullWidth
                className="mt-4"
              >
                Checkout
              </Button>
            </Panel>

            <Link
              to="/products"
              className="block rounded-btn border border-line bg-card px-4 py-3 text-center text-sm font-semibold text-ink t-fast hover:border-accent hover:text-accent"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </Container>
  );
};

export default CartPage;

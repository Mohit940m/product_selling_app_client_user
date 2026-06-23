import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiShoppingCart, FiTrash2, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import Navbar from '../components/Navbar';
import Button from '../components/Button';

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
    setRemovingId(`${productId}-${variantId}`);
    try {
      const { data } = await userApi.post('/cart/remove-from-cart', { productId, variantId });
      setCart(data.data);
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

  const cartItemCount = cart?.items?.length ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar cartCount={cartItemCount} />
      <main className="flex-1">
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Shopping</p>
            <h1 className="text-2xl font-bold text-text">Your Cart</h1>
            <p className="text-sm text-gray-600">{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 rounded-lg bg-secondary" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-secondary" />
                      <div className="h-4 w-1/2 rounded bg-secondary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !cart || cartItemCount === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
              <FiShoppingCart className="mx-auto text-primary" size={32} />
              <h3 className="mt-3 text-lg font-bold text-text">Your cart is empty</h3>
              <p className="mt-1 text-sm text-gray-600">Add products to get started.</p>
              <Link
                to="/products"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-accent"
              >
                <FiShoppingCart size={16} />
                Browse products
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {cart.items.map((item) => {
                  const pid = item.productId._id;
                  const vid = item.variantId._id;
                  const isRemoving = removingId === `${pid}-${vid}`;

                  return (
                    <article key={`${pid}-${vid}`} className="flex gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                      <Link to={`/products/${pid}`} className="shrink-0">
                        {item.productId.images?.[0] ? (
                          <img
                            src={item.productId.images[0]}
                            alt={item.productId.name}
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-secondary text-primary">
                            <FiShoppingCart size={24} />
                          </div>
                        )}
                      </Link>

                      <div className="flex flex-1 flex-col gap-1">
                        <Link to={`/products/${pid}`} className="text-sm font-bold text-text hover:text-accent line-clamp-1">
                          {item.productId.name}
                        </Link>
                        <p className="text-xs text-gray-600">{item.productId.category}</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(item.attributes).map(([k, v]) => (
                            <span key={k} className="rounded bg-secondary px-2 py-0.5 text-xs text-text">
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        {item.activeOffer && (
                          <p className="text-xs font-semibold text-accent">{item.activeOffer.name}</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end justify-between">
                        <div className="text-right">
                          <p className="text-sm font-bold text-accent">{formatCurrency(item.discountedPrice * item.quantity)}</p>
                          {item.savings > 0 && (
                            <p className="text-xs text-green-700">Save {formatCurrency(item.savings * item.quantity)}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(pid, vid)}
                          disabled={isRemoving}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                        >
                          <FiTrash2 size={13} />
                          {isRemoving ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                  <h2 className="mb-4 text-lg font-bold text-text">Order Summary</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold text-text">{formatCurrency(cart.subTotal)}</span>
                    </div>
                    {cart.discount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Discount</span>
                        <span className="font-semibold">-{formatCurrency(cart.discount)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3 flex justify-between">
                      <span className="font-bold text-text">Total</span>
                      <span className="text-lg font-bold text-accent">{formatCurrency(cart.total)}</span>
                    </div>
                  </div>
                  <Button
                    label="Proceed to Checkout"
                    icon={<FiArrowRight size={16} />}
                    onClick={() => navigate('/checkout')}
                    className="mt-4 w-full py-3"
                  />
                </div>

                <Link
                  to="/products"
                  className="block rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-semibold text-text shadow-md hover:border-primary hover:text-accent"
                >
                  Continue shopping
                </Link>
              </aside>
            </div>
          )}
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

export default CartPage;

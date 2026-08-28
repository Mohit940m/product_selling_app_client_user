import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FiShoppingCart } from 'react-icons/fi';
import userApi from '../../api/userApi';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import ImageFrame from '../ui/ImageFrame';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

type CartVariant = { _id: string; sku: string; attributes: Record<string, string>; price: number; stock: number };
type CartProduct = { _id: string; name: string; category: string; images: string[] };
type CartItem = {
  productId: CartProduct;
  variantId: CartVariant;
  quantity: number;
  attributes: Record<string, string>;
  discountedPrice: number;
};
type Cart = { _id: string; items: CartItem[]; subTotal: number; discount: number; total: number };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The desktop-drawer / mobile-sheet cart preview that opens after a
 * successful add-to-cart (Kartly Commerce Kit.dc.html screen D2's right
 * panel). Refetches the cart each time it opens rather than tracking cart
 * state globally — this app has no global store, so a light refetch on
 * open keeps it simple and always accurate.
 */
const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    // Guards against a real race: closing and quickly reopening the
    // drawer fires a second get-cart call before the first resolves — a
    // slower first response landing after the second would otherwise
    // overwrite fresher cart data with stale data.
    let isCurrent = true;
    // setIsLoading(true) goes through requestAnimationFrame rather than
    // running synchronously at the top of the effect body — matches the
    // pattern StatCard.tsx's useCountUp already uses for the same
    // react(set-state-in-effect) rule (a newer oxlint version, upgraded
    // alongside this fix, is what actually caught this here).
    const frame = requestAnimationFrame(() => {
      if (isCurrent) setIsLoading(true);
    });
    userApi
      .get('/cart/get-cart')
      .then(({ data }) => {
        if (isCurrent) setCart(data.data);
      })
      .catch((err) => {
        if (!isCurrent) return;
        const msg = axios.isAxiosError(err) ? err.response?.data?.message ?? 'Failed to load cart.' : 'Failed to load cart.';
        toast.error(msg);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => {
      isCurrent = false;
      cancelAnimationFrame(frame);
    };
  }, [open]);

  const itemCount = cart?.items?.length ?? 0;

  const goToCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <Sheet open={open} onClose={onClose} title="Your bag">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-14 w-14 rounded-[12px]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : itemCount === 0 ? (
        <EmptyState
          icon={<FiShoppingCart size={26} />}
          title="Your bag is empty"
          action={
            <Link to="/products" onClick={onClose} className="text-sm font-bold text-accent hover:underline">
              Browse products
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-2.5">
            {cart!.items.map((item) => (
              <div
                key={`${item.productId._id}-${item.variantId._id}`}
                className="flex gap-3 rounded-[18px] border border-line bg-card p-3 t-fast hover:border-accent"
              >
                <ImageFrame src={item.productId.images?.[0]} alt={item.productId.name} className="h-14 w-14 shrink-0 rounded-[12px]" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[12.5px] font-bold text-ink">{item.productId.name}</p>
                  <p className="mt-0.5 text-[10.5px] font-semibold text-muted">
                    {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(' · ')} · ×{item.quantity}
                  </p>
                  <p className="mt-1.5 text-[13px] font-extrabold text-ink">{formatCurrency(item.discountedPrice * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-line pt-4.5">
            <div className="mb-4 flex justify-between text-[17px] font-extrabold text-ink">
              <span>Total</span>
              <span>{formatCurrency(cart!.total)}</span>
            </div>
            <Button variant="dark" fullWidth onClick={goToCheckout}>
              Checkout
            </Button>
          </div>
        </>
      )}
    </Sheet>
  );
};

export default CartDrawer;

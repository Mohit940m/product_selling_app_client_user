import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiTrash2 } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import userApi from '../../../api/userApi';
import { notifyCartChanged } from '../../../hooks/useCartCount';
import Button from '../../ui/Button';
import ImageFrame from '../../ui/ImageFrame';
import QtyStepper from '../../ui/QtyStepper';
import { formatCurrency } from '../../order/orderMeta';
import { attributeLabel, toCartView, type CartLine, type CartView } from '../types';

/**
 * Live cart card. Quantity and remove buttons call the cart API directly
 * and re-read the cart, so totals (offers, cashback) stay the server's.
 */
const CartBlock = ({ data }: { data: CartView }) => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(data);
  const [busyLine, setBusyLine] = useState<string | null>(null);

  const change = async (line: CartLine, nextQuantity: number) => {
    const key = `${line.productId}-${line.variantId}`;
    setBusyLine(key);
    try {
      const diff = nextQuantity - line.quantity;
      if (diff > 0) {
        await userApi.post('/cart/add-to-cart', { productId: line.productId, variantId: line.variantId, quantity: diff });
      } else if (diff < 0) {
        await userApi.post('/cart/remove-from-cart', { productId: line.productId, variantId: line.variantId, quantity: -diff });
      }
      const { data: res } = await userApi.get('/cart/get-cart');
      setCart(toCartView(res.data ?? {}));
      notifyCartChanged();
    } catch (err) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.message ?? 'Couldn’t update your bag.' : 'Couldn’t update your bag.');
    } finally {
      setBusyLine(null);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="rounded-card border border-line bg-card p-4 text-center">
        <p className="text-[13px] font-semibold text-muted">Your bag is empty.</p>
        <Link to="/products" className="mt-2 inline-block text-[12.5px] font-extrabold text-accent hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <span className="font-mono text-[10.5px] font-extrabold text-muted">YOUR BAG · {cart.items.length}</span>
        <Link to="/cart" className="text-[11.5px] font-bold text-accent hover:underline">
          Open bag
        </Link>
      </div>
      <ul className="divide-y divide-line">
        {cart.items.map((line) => {
          const key = `${line.productId}-${line.variantId}`;
          const busy = busyLine === key;
          return (
            <li key={key} className="flex gap-3 p-3.5">
              <ImageFrame src={line.image} alt={line.name} className="h-14 w-14 shrink-0" rounded="rounded-btn" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Link to={`/products/${line.productId}`} className="line-clamp-1 text-[13px] font-bold text-ink hover:text-accent">
                  {line.name}
                </Link>
                <p className="text-[11.5px] font-medium text-muted">
                  {attributeLabel(line.attributes)}
                  {line.offer && ` · ${line.offer}`}
                </p>
                <div className="flex items-center gap-2.5">
                  <QtyStepper
                    value={line.quantity}
                    max={Math.max(line.quantity, Math.min(line.stock, 10))}
                    onChange={(q) => change(line, q)}
                    disabled={busyLine !== null}
                    className="py-1!"
                  />
                  <button
                    type="button"
                    onClick={() => change(line, 0)}
                    disabled={busyLine !== null}
                    aria-label={`Remove ${line.name}`}
                    className="p-1.5 text-muted t-fast hover:text-danger disabled:opacity-40"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
              <div className={`shrink-0 text-right ${busy ? 'opacity-50' : ''}`}>
                <p className="text-[13.5px] font-extrabold text-ink">{formatCurrency(line.discountedPrice * line.quantity)}</p>
                {line.discountedPrice < line.price && (
                  <p className="text-[11px] font-semibold text-muted line-through">{formatCurrency(line.price * line.quantity)}</p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <dl className="space-y-1.5 border-t border-line px-3.5 py-3 text-[12.5px]">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd className="font-semibold text-ink">{formatCurrency(cart.subTotal)}</dd>
        </div>
        {cart.discount > 0 && (
          <div className="flex justify-between text-ok-fg">
            <dt>Discount</dt>
            <dd className="font-semibold">−{formatCurrency(cart.discount)}</dd>
          </div>
        )}
        {cart.cashback > 0 && (
          <div className="flex justify-between text-ok-fg">
            <dt>Cashback</dt>
            <dd className="font-semibold">−{formatCurrency(cart.cashback)}</dd>
          </div>
        )}
        <div className="flex justify-between pt-1 text-[14px]">
          <dt className="font-extrabold text-ink">Total</dt>
          <dd className="font-black text-ink">{formatCurrency(cart.total)}</dd>
        </div>
        <p className="text-[11px] text-muted">Shipping is added at checkout.</p>
      </dl>
      <div className="p-3.5 pt-0">
        <Button variant="primary" fullWidth icon={<FiArrowRight size={15} />} iconPosition="right" onClick={() => navigate('/checkout')}>
          Checkout
        </Button>
      </div>
    </div>
  );
};

export default CartBlock;

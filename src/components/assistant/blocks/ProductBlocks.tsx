import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import userApi from '../../../api/userApi';
import { notifyCartChanged } from '../../../hooks/useCartCount';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import Chip from '../../ui/Chip';
import ImageFrame from '../../ui/ImageFrame';
import QtyStepper from '../../ui/QtyStepper';
import Sheet from '../../ui/Sheet';
import { showKartlyToast } from '../../ui/Toast';
import { formatCurrency } from '../../order/orderMeta';
import { attributeLabel, type ProductCard, type ProductDetail, type ProductVariant } from '../types';

const apiMessage = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

type Callbacks = {
  /** Called after a successful cart change so the chat can refresh its cart card. */
  onCartChanged: () => void;
};

async function addToCart(product: { id: string; name: string }, variant: ProductVariant | undefined, quantity: number) {
  if (!localStorage.getItem('userToken')) {
    toast.info('Log in to add items to your bag.');
    return false;
  }
  try {
    await userApi.post('/cart/add-to-cart', { productId: product.id, variantId: variant?.id, quantity });
    notifyCartChanged();
    showKartlyToast({ title: 'Added to bag', sub: `${product.name}${variant ? ` · ${attributeLabel(variant.attributes)}` : ''} · ×${quantity}` });
    return true;
  } catch (err) {
    toast.error(apiMessage(err, 'Couldn’t add to your bag.'));
    return false;
  }
}

async function saveToWishlist(product: { id: string; name: string }) {
  if (!localStorage.getItem('userToken')) {
    toast.info('Log in to save items.');
    return;
  }
  try {
    await userApi.post('/wishlist/add', { productId: product.id });
    showKartlyToast({ title: 'Saved to wishlist', sub: product.name });
  } catch (err) {
    if (axios.isAxiosError(err) && /already/i.test(String(err.response?.data?.message ?? ''))) {
      showKartlyToast({ title: 'Already in your wishlist', sub: product.name });
    } else {
      toast.error(apiMessage(err, 'Couldn’t save to your wishlist.'));
    }
  }
}

const Price = ({ price, discountedPrice }: { price: number; discountedPrice: number }) => (
  <span className="flex items-baseline gap-1.5">
    <span className="text-[14px] font-extrabold text-ink">{formatCurrency(discountedPrice)}</span>
    {discountedPrice < price && <span className="text-[11.5px] font-semibold text-muted line-through">{formatCurrency(price)}</span>}
  </span>
);

/** Variant chips + quantity + add. Shared by the picker sheet and the product card. */
const VariantChooser = ({
  product,
  variants,
  initialVariantId,
  onAdded,
}: {
  product: { id: string; name: string };
  variants: ProductVariant[];
  initialVariantId?: string;
  onAdded: () => void;
}) => {
  const firstInStock = variants.find((v) => v.stock > 0);
  const [variantId, setVariantId] = useState(
    variants.find((v) => v.id === initialVariantId && v.stock > 0)?.id ?? firstInStock?.id ?? variants[0]?.id,
  );
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const variant = variants.find((v) => v.id === variantId);
  const outOfStock = !variant || variant.stock <= 0;

  const add = async () => {
    setAdding(true);
    const ok = await addToCart(product, variant, quantity);
    setAdding(false);
    if (ok) onAdded();
  };

  return (
    <div className="space-y-3">
      {variants.length > 1 && (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Choose a variant">
          {variants.map((v) => (
            <Chip
              key={v.id}
              selected={v.id === variantId}
              disabled={v.stock <= 0}
              onClick={() => {
                setVariantId(v.id);
                setQuantity(1);
              }}
              className="disabled:opacity-40"
            >
              {attributeLabel(v.attributes) || 'Default'}
            </Chip>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[12px] font-semibold text-muted">
          {variant ? (variant.stock > 0 ? `${variant.stock} in stock · ${formatCurrency(variant.price)}` : 'Out of stock') : 'No variants'}
        </span>
        <div className="flex items-center gap-2.5">
          <QtyStepper value={quantity} max={Math.max(1, Math.min(variant?.stock ?? 1, 10))} onChange={setQuantity} disabled={outOfStock} className="py-1.5!" />
          <Button variant="primary" size="sm" icon={<FiShoppingBag size={14} />} loading={adding} disabled={outOfStock} onClick={add}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

const ProductTile = ({ item, onPick }: { item: ProductCard; onPick: (item: ProductCard) => void }) => (
  <li className="flex flex-col overflow-hidden rounded-card border border-line bg-card">
    <Link to={`/products/${item.id}`} className="block">
      <ImageFrame src={item.image} alt={item.name} className="h-28 sm:h-32" />
    </Link>
    <div className="flex flex-1 flex-col gap-1.5 p-3">
      {item.offer && (
        <Badge tone="ink" className="w-fit px-2! py-0.5! text-[9.5px]!">
          {item.offer}
        </Badge>
      )}
      <Link to={`/products/${item.id}`} className="line-clamp-2 text-[12.5px] font-bold text-ink hover:text-accent">
        {item.name}
      </Link>
      <Price price={item.price} discountedPrice={item.discountedPrice} />
      <div className="mt-auto flex gap-2 pt-1.5">
        <Button variant="dark" size="sm" className="flex-1 px-2! py-2!" icon={<FiShoppingBag size={13} />} onClick={() => onPick(item)}>
          Add
        </Button>
        <Button variant="soft" size="sm" className="px-2.5! py-2!" aria-label={`Save ${item.name} to wishlist`} onClick={() => saveToWishlist(item)}>
          <FiHeart size={14} />
        </Button>
      </div>
    </div>
  </li>
);

export const ProductCardsBlock = ({ data, onCartChanged }: { data: { items: ProductCard[]; total: number } } & Callbacks) => {
  const [picking, setPicking] = useState<ProductCard | null>(null);
  const [variants, setVariants] = useState<ProductVariant[] | null>(null);

  const pick = async (item: ProductCard) => {
    setPicking(item);
    setVariants(null);
    try {
      const { data: res } = await userApi.get(`/products/get-product/${item.id}`);
      const list: ProductVariant[] = (res.data?.variants ?? []).map((v: ProductVariant & { _id: string }) => ({
        id: v._id,
        attributes: v.attributes ?? {},
        price: v.price,
        stock: v.stock ?? 0,
      }));
      if (list.length === 1) {
        setPicking(null);
        if (await addToCart(item, list[0], 1)) onCartChanged();
        return;
      }
      setVariants(list);
    } catch (err) {
      setPicking(null);
      toast.error(apiMessage(err, 'Couldn’t load this product.'));
    }
  };

  if (data.items.length === 0) {
    return <p className="rounded-card border border-line bg-card p-3.5 text-[13px] font-medium text-muted">No matching products.</p>;
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {data.items.map((item) => (
          <ProductTile key={item.id} item={item} onPick={pick} />
        ))}
      </ul>
      <Sheet open={!!picking} onClose={() => setPicking(null)} title={picking?.name ?? 'Choose a variant'}>
        {picking && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ImageFrame src={picking.image} alt={picking.name} className="h-16 w-16 shrink-0" rounded="rounded-btn" />
              <div>
                <p className="text-[14px] font-extrabold text-ink">{picking.name}</p>
                <Price price={picking.price} discountedPrice={picking.discountedPrice} />
              </div>
            </div>
            {variants ? (
              <VariantChooser
                product={picking}
                variants={variants}
                onAdded={() => {
                  setPicking(null);
                  onCartChanged();
                }}
              />
            ) : (
              <p className="text-[13px] font-medium text-muted">Loading options…</p>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
};

export const ProductDetailBlock = ({ data, onCartChanged }: { data: ProductDetail } & Callbacks) => (
  <div className="overflow-hidden rounded-card border border-line bg-card">
    <div className="flex gap-3.5 p-3.5">
      <Link to={`/products/${data.id}`} className="shrink-0">
        <ImageFrame src={data.image} alt={data.name} className="h-24 w-24" rounded="rounded-btn" />
      </Link>
      <div className="min-w-0 flex-1 space-y-1">
        {data.offer && (
          <Badge tone="ink" className="px-2! py-0.5! text-[9.5px]!">
            {data.offer}
          </Badge>
        )}
        <Link to={`/products/${data.id}`} className="line-clamp-2 block text-[14px] font-extrabold text-ink hover:text-accent">
          {data.name}
        </Link>
        <Price price={data.price} discountedPrice={data.discountedPrice} />
        {data.description && <p className="line-clamp-2 text-[12px] font-medium text-muted">{data.description}</p>}
      </div>
      <Button variant="soft" size="sm" className="self-start px-2.5! py-2!" aria-label={`Save ${data.name} to wishlist`} onClick={() => saveToWishlist(data)}>
        <FiHeart size={14} />
      </Button>
    </div>
    <div className="border-t border-line p-3.5">
      <VariantChooser product={data} variants={data.variants} initialVariantId={data.selectedVariantId} onAdded={onCartChanged} />
    </div>
  </div>
);

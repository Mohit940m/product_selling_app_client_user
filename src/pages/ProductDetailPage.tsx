import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiShoppingCart, FiTag } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ImageFrame from '../components/ui/ImageFrame';
import QtyStepper from '../components/ui/QtyStepper';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { showKartlyToast } from '../components/ui/Toast';
import CartDrawer from '../components/cart/CartDrawer';

const ADDED_FEEDBACK_MS = 900;

type Variant = {
  _id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
  discountedPrice?: number;
  activeOffer?: ActiveOffer | null;
};

type ActiveOffer = {
  _id: string;
  name: string;
  type: string;
  config: { discountType: string; value: number };
  minCartValue?: number;
};

type Product = {
  _id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  isActive: boolean;
  price: number;
  discountedPrice: number;
  activeOffer: ActiveOffer | null;
  variants: Variant[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadProduct = async () => {
    setIsLoading(true);
    try {
      const { data } = await userApi.get(`/products/get-product/${productId}`);
      const { product: productData, selectedVariant: defaultVariant, variants } = data.data;
      const enrichedVariants: Variant[] = (variants ?? []).map((v: Variant) =>
        v._id === defaultVariant?._id
          ? { ...v, discountedPrice: defaultVariant.discountedPrice, activeOffer: defaultVariant.activeOffer ?? null }
          : v
      );
      const p: Product = {
        ...productData,
        isActive: productData.isActive ?? true,
        price: defaultVariant?.price ?? 0,
        discountedPrice: defaultVariant?.discountedPrice ?? defaultVariant?.price ?? 0,
        activeOffer: defaultVariant?.activeOffer ?? null,
        variants: enrichedVariants,
      };
      setProduct(p);
      if (enrichedVariants.length > 0) {
        setSelectedVariant(enrichedVariants[0]);
      }
      setQuantity(1);
      setSelectedImage(0);
      setDescriptionExpanded(false);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Failed to load product.'
        : 'Failed to load product.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (options?: { openDrawer?: boolean }): Promise<boolean> => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      toast.error('Please login to add items to cart.');
      navigate('/login');
      return false;
    }
    if (!product) return false;

    setIsAddingToCart(true);
    try {
      await userApi.post('/cart/add-to-cart', {
        productId: product._id,
        variantId: selectedVariant?._id,
        quantity,
      });
      showKartlyToast({ title: 'Added to bag', sub: `${product.name}${selectedVariant ? ` · ×${quantity}` : ''}` });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS);
      if (options?.openDrawer !== false) setCartDrawerOpen(true);
      return true;
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Failed to add to cart.'
        : 'Failed to add to cart.';
      toast.error(msg);
      return false;
    } finally {
      setIsAddingToCart(false);
    }
  };

  const buyItNow = async () => {
    const added = await addToCart({ openDrawer: false });
    if (added) navigate('/checkout');
  };

  const getAttributeValues = (attrKey: string): string[] => {
    if (!product?.variants) return [];
    return [...new Set(product.variants.map((v) => v.attributes[attrKey]).filter(Boolean))];
  };

  const getAttributeKeys = (): string[] => {
    if (!product?.variants?.length) return [];
    return Object.keys(product.variants[0].attributes);
  };

  const selectVariantByAttribute = (key: string, value: string) => {
    if (!selectedVariant || !product) return;
    const current = { ...selectedVariant.attributes, [key]: value };
    const match = product.variants.find((v) =>
      Object.entries(current).every(([k, val]) => v.attributes[k] === val)
    );
    if (match) setSelectedVariant(match);
  };

  const isVariantAvailable = (key: string, value: string): boolean => {
    if (!product) return true;
    return product.variants.some(
      (v) => v.attributes[key] === value && v.stock > 0,
    );
  };

  if (isLoading) {
    return (
      <Container className="py-6 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton preset="card" className="h-[300px] w-full rounded-hero lg:h-[470px]" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
          </div>
        </div>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Product not found"
          action={
            <Link to="/products" className="text-sm font-bold text-accent hover:underline">
              Back to products
            </Link>
          }
        />
      </Container>
    );
  }

  const rawPrice = selectedVariant?.price ?? product.price;
  const shownPrice = selectedVariant?.discountedPrice ?? rawPrice;
  const savings = rawPrice - shownPrice;
  const discountPercent = rawPrice > 0 ? Math.round((savings / rawPrice) * 100) : 0;
  const offer = selectedVariant?.activeOffer ?? product.activeOffer;
  const outOfStock = !product.isActive || (selectedVariant?.stock ?? 0) === 0;

  return (
    <Container className="py-6 lg:py-10">
      <Link
        to="/products"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted t-fast hover:text-accent"
      >
        <FiArrowLeft size={16} />
        Back to products
      </Link>

      <div className="grid gap-8 lg:grid-cols-[96px_1fr_340px] lg:items-start lg:gap-8.5">
        {/* Desktop thumbnail rail */}
        {product.images.length > 1 && (
          <div className="hidden flex-col gap-3 lg:flex">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(idx)}
                className={`h-24 w-24 overflow-hidden rounded-tile border t-fast ${
                  selectedImage === idx ? 'border-accent' : 'border-line hover:border-accent'
                }`}
              >
                <img src={img} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Gallery */}
        <div className="lg:order-none">
          <div className="relative overflow-hidden rounded-hero bg-soft">
            <ImageFrame
              src={product.images[selectedImage]}
              alt={product.name}
              className="h-[300px] w-full lg:h-[470px]"
            />
            {outOfStock && (
              <Badge tone="plum" className="absolute right-4 top-4">
                Out of stock
              </Badge>
            )}
            {product.images.length > 1 && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 lg:hidden">
                {product.images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    aria-label={`Show image ${idx + 1}`}
                    className={`h-[5px] rounded-full t-base ${
                      selectedImage === idx ? 'w-5.5 bg-ink' : 'w-[5px] bg-ink/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:hidden">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-tile border-2 t-fast ${
                    selectedImage === idx ? 'border-accent' : 'border-line'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="font-mono text-[11px] font-bold text-muted">{product.category.toUpperCase()}</p>
            <h1 className="mt-2 font-black text-[23px] leading-[1.15] tracking-[-.02em] lg:text-[34px] lg:leading-[1.05] lg:tracking-[-.03em]">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[26px] font-extrabold text-ink">{formatCurrency(shownPrice)}</span>
            {savings > 0 && (
              <>
                <span className="text-sm font-semibold text-muted line-through">{formatCurrency(rawPrice)}</span>
                <Badge tone="ink">−{discountPercent}%</Badge>
              </>
            )}
          </div>

          {offer && (
            <div className="flex items-start gap-2.5 rounded-btn border border-accent bg-soft2 p-3.5">
              <FiTag className="mt-0.5 shrink-0 text-accent" size={16} />
              <div>
                <p className="text-sm font-bold text-ink">{offer.name}</p>
                {offer.minCartValue && (
                  <p className="text-xs text-muted">Min. cart value: {formatCurrency(offer.minCartValue)}</p>
                )}
              </div>
            </div>
          )}

          {getAttributeKeys().map((key) => (
            <div key={key}>
              <p className="mb-2.5 text-[12px] font-extrabold text-ink">
                {key.toUpperCase()}: <span className="font-semibold text-accent">{selectedVariant?.attributes[key] ?? ''}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {getAttributeValues(key).map((val) => {
                  const selected = selectedVariant?.attributes[key] === val;
                  const available = isVariantAvailable(key, val);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => selectVariantByAttribute(key, val)}
                      disabled={!available}
                      className={[
                        'h-11 min-w-[46px] rounded-ctl border px-3 text-[12px] font-bold t-fast lift-sm',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                        selected
                          ? 'border-transparent bg-accent text-onacc'
                          : available
                            ? 'border-line text-ink hover:border-accent'
                            : 'cursor-not-allowed border-line text-muted opacity-50',
                      ].join(' ')}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {selectedVariant && (
            <p className="text-sm text-muted">
              Stock:{' '}
              <span className={`font-semibold ${selectedVariant.stock > 0 ? 'text-ok-fg' : 'text-bad-fg'}`}>
                {selectedVariant.stock > 0 ? `${selectedVariant.stock} units available` : 'Out of stock'}
              </span>
            </p>
          )}

          <div className="rounded-panel border border-line bg-card p-4">
            <h3 className="mb-2 text-sm font-extrabold text-ink">Description</h3>
            <p
              className={`whitespace-pre-wrap text-sm leading-relaxed text-muted ${
                descriptionExpanded ? '' : 'line-clamp-3'
              }`}
            >
              {product.description}
            </p>
            {product.description.length > 160 && (
              <button
                type="button"
                onClick={() => setDescriptionExpanded((v) => !v)}
                className="mt-1.5 text-xs font-bold text-accent hover:underline"
              >
                {descriptionExpanded ? 'Show less' : 'See details'}
              </button>
            )}
          </div>

          {/* Desktop: inline action row. Mobile: sticky bar above the tab bar (see below). */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <QtyStepper
              value={quantity}
              onChange={setQuantity}
              max={selectedVariant?.stock || 99}
              disabled={outOfStock}
            />
            <Button
              variant={justAdded ? 'dark' : 'primary'}
              icon={justAdded ? <FiCheck size={18} /> : <FiShoppingCart size={18} />}
              onClick={() => addToCart()}
              loading={isAddingToCart}
              disabled={outOfStock}
              fullWidth
              className="flex-1"
            >
              {justAdded ? 'Added' : 'Add to cart'}
            </Button>
          </div>
          <Button variant="outline" onClick={buyItNow} disabled={outOfStock || isAddingToCart} fullWidth className="hidden lg:inline-flex">
            Buy it now
          </Button>
        </div>
      </div>

      {/* Mobile sticky action bar — sits just above the bottom tab bar. */}
      <div className="sticky bottom-[76px] z-30 -mx-5 mt-5 flex items-center gap-3.5 border-t border-line bg-card px-5 py-4 sm:-mx-8 sm:px-8 lg:hidden">
        <div>
          <p className="text-[10px] font-semibold text-muted">Total</p>
          <p className="font-extrabold text-[22px] text-ink">{formatCurrency(shownPrice * quantity)}</p>
        </div>
        <QtyStepper value={quantity} onChange={setQuantity} max={selectedVariant?.stock || 99} disabled={outOfStock} />
        <Button
          variant={justAdded ? 'dark' : 'primary'}
          icon={justAdded ? <FiCheck size={18} /> : <FiShoppingCart size={18} />}
          onClick={() => addToCart()}
          loading={isAddingToCart}
          disabled={outOfStock}
          fullWidth
          className="flex-1"
        >
          {justAdded ? 'Added' : 'Add to cart'}
        </Button>
      </div>

      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </Container>
  );
};

export default ProductDetailPage;

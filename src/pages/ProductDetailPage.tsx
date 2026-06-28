import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiShoppingCart, FiTag } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import Navbar from '../components/Navbar';
import Button from '../components/Button';

type Variant = {
  _id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  stock: number;
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
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadProduct = async () => {
    setIsLoading(true);
    try {
      const { data } = await userApi.get(`/products/get-product/${productId}`);
      const { product: productData, selectedVariant: defaultVariant, variants } = data.data;
      const p: Product = {
        ...productData,
        isActive: productData.isActive ?? true,
        price: defaultVariant?.price ?? 0,
        discountedPrice: defaultVariant?.discountedPrice ?? defaultVariant?.price ?? 0,
        activeOffer: defaultVariant?.activeOffer ?? null,
        variants: variants ?? [],
      };
      setProduct(p);
      if (variants?.length > 0) {
        setSelectedVariant(variants[0]);
      }
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Failed to load product.'
        : 'Failed to load product.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      toast.error('Please login to add items to cart.');
      navigate('/login');
      return;
    }
    if (!product) return;

    setIsAddingToCart(true);
    try {
      await userApi.post('/cart/add-to-cart', {
        productId: product._id,
        variantId: selectedVariant?._id,
        quantity: 1,
      });
      toast.success('Added to cart successfully.');
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Failed to add to cart.'
        : 'Failed to add to cart.';
      toast.error(msg);
    } finally {
      setIsAddingToCart(false);
    }
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-text">
        <Navbar />
        <main className="flex-1">
          <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="h-96 rounded-lg bg-secondary" />
              <div className="space-y-4">
                <div className="h-6 w-3/4 rounded bg-secondary" />
                <div className="h-4 w-1/2 rounded bg-secondary" />
                <div className="h-10 w-1/3 rounded bg-secondary" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-text">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-text">Product not found</h2>
            <Link to="/products" className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">
              Back to products
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const displayPrice = selectedVariant?.price ?? product.price;
  const isDefaultVariant = !selectedVariant || selectedVariant._id === product.variants[0]?._id;
  const shownPrice = isDefaultVariant ? product.discountedPrice : displayPrice;
  const savings = isDefaultVariant ? product.price - product.discountedPrice : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Link
            to="/products"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-accent"
          >
            <FiArrowLeft size={16} />
            Back to products
          </Link>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md">
                {product.images[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="h-96 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-96 items-center justify-center bg-secondary text-primary">
                    <FiShoppingCart size={48} />
                  </div>
                )}
                {(!product.isActive || (selectedVariant && selectedVariant.stock === 0)) && (
                  <span className="absolute right-3 top-3 rounded-lg bg-gray-500 px-2 py-0.5 text-xs font-bold text-white">
                    Out of stock
                  </span>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                        selectedImage === idx ? 'border-primary' : 'border-gray-200'
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-accent">{product.category}</p>
                <h1 className="mt-1 text-2xl font-bold text-text">{product.name}</h1>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-accent">{formatCurrency(shownPrice)}</span>
                {savings > 0 && (
                  <>
                    <span className="text-lg text-gray-400 line-through">{formatCurrency(product.price)}</span>
                    <span className="rounded-lg bg-green-50 px-2 py-1 text-sm font-bold text-green-700">
                      Save {formatCurrency(savings)}
                    </span>
                  </>
                )}
              </div>

              {product.activeOffer && (
                <div className="flex items-start gap-2 rounded-lg border border-primary bg-secondary p-3">
                  <FiTag className="mt-0.5 shrink-0 text-primary" size={16} />
                  <div>
                    <p className="text-sm font-bold text-accent">{product.activeOffer.name}</p>
                    {product.activeOffer.minCartValue && (
                      <p className="text-xs text-gray-600">Min. cart value: {formatCurrency(product.activeOffer.minCartValue)}</p>
                    )}
                  </div>
                </div>
              )}

              {getAttributeKeys().map((key) => (
                <div key={key}>
                  <p className="mb-2 text-sm font-semibold text-text">
                    {key}: <span className="text-accent">{selectedVariant?.attributes[key] ?? ''}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getAttributeValues(key).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => selectVariantByAttribute(key, val)}
                        className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all duration-150 ${
                          selectedVariant?.attributes[key] === val
                            ? 'border-accent bg-secondary text-accent shadow-sm'
                            : 'border-gray-200 bg-white text-text hover:border-primary hover:bg-secondary hover:text-accent hover:scale-105'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {selectedVariant && (
                <p className="text-sm text-gray-600">
                  Stock: <span className={`font-semibold ${selectedVariant.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {selectedVariant.stock > 0 ? `${selectedVariant.stock} units available` : 'Out of stock'}
                  </span>
                </p>
              )}

              <Button
                label={isAddingToCart ? 'Adding...' : 'Add to Cart'}
                icon={<FiShoppingCart size={18} />}
                onClick={addToCart}
                disabled={isAddingToCart || !product.isActive || (selectedVariant?.stock ?? 0) === 0}
                className="w-full py-3 text-base"
              />

              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                <h3 className="mb-2 text-sm font-bold text-text">Description</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{product.description}</p>
              </div>
            </div>
          </div>
        </div>
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

export default ProductDetailPage;

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiTag, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import Navbar from '../components/Navbar';

type ActiveOffer = {
  _id: string;
  name: string;
  type: string;
  config: { discountType: string; value: number };
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
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const ProductListPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const limit = 9;

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, category]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const { data } = await userApi.get('/products/get-all-products', {
        params: { page, limit, search: search || undefined, category: category || undefined },
      });
      setProducts(data.data?.products ?? []);
      setTotal(data.data?.total ?? 0);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? 'Failed to load products.'
        : 'Failed to load products.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const clearCategory = () => {
    setCategory('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">Marketplace</p>
              <h1 className="mt-2 text-2xl font-bold text-text">All Products</h1>
              <p className="mt-2 text-sm text-gray-600">{total} product{total !== 1 ? 's' : ''} available</p>
            </div>
            <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center gap-2">
              <div className="flex flex-1 items-center rounded-lg border border-gray-200 bg-white px-3 shadow-sm focus-within:ring-2 focus-within:ring-primary">
                <FiSearch className="shrink-0 text-primary" size={18} />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm outline-none"
                  placeholder="Search products..."
                />
                {searchInput && (
                  <button type="button" onClick={clearSearch} className="text-gray-400 hover:text-text">
                    <FiX size={16} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-accent"
              >
                Search
              </button>
            </form>
          </div>
        </section>

        {category && (
          <div className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-7xl items-center gap-2">
              <span className="text-sm text-gray-600">Filtering by:</span>
              <span className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1 text-sm font-semibold text-accent">
                <FiTag size={14} />
                {category}
                <button type="button" onClick={clearCategory} className="ml-1 text-gray-500 hover:text-text">
                  <FiX size={14} />
                </button>
              </span>
            </div>
          </div>
        )}

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white p-4 shadow-md">
                  <div className="mb-3 h-48 rounded-lg bg-secondary" />
                  <div className="mb-2 h-4 w-3/4 rounded bg-secondary" />
                  <div className="h-4 w-1/2 rounded bg-secondary" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
              <FiShoppingCart className="mx-auto text-primary" size={32} />
              <h3 className="mt-3 text-lg font-bold text-text">No products found</h3>
              <p className="mt-1 text-sm text-gray-600">Try a different search term or category.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="group rounded-lg border border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg"
                >
                  <div className="relative overflow-hidden rounded-t-lg bg-secondary">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-52 w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-52 items-center justify-center text-primary">
                        <FiShoppingCart size={36} />
                      </div>
                    )}
                    {product.activeOffer && (
                      <span className="absolute left-3 top-3 rounded-lg bg-accent px-2 py-0.5 text-xs font-bold text-white">
                        {product.activeOffer.name}
                      </span>
                    )}
                    {!product.isActive && (
                      <span className="absolute right-3 top-3 rounded-lg bg-gray-500 px-2 py-0.5 text-xs font-bold text-white">
                        Out of stock
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setCategory(product.category); setPage(1); }}
                      className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent hover:underline"
                    >
                      {product.category}
                    </button>
                    <h3 className="line-clamp-2 text-sm font-bold text-text">{product.name}</h3>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-lg font-bold text-accent">{formatCurrency(product.discountedPrice)}</span>
                      {product.discountedPrice < product.price && (
                        <>
                          <span className="text-sm text-gray-400 line-through">{formatCurrency(product.price)}</span>
                          <span className="rounded-lg bg-green-50 px-2 py-0.5 text-xs font-bold text-green-700">
                            Save {formatCurrency(product.price - product.discountedPrice)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-text shadow-sm hover:border-primary hover:text-accent disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-text shadow-sm hover:border-primary hover:text-accent disabled:opacity-50"
              >
                Next
              </button>
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

export default ProductListPage;

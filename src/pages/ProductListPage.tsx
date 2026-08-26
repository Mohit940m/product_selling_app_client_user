import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiTag, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ImageFrame from '../components/ui/ImageFrame';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import Reveal from '../components/motion/Reveal';

const ASSISTANT_ENABLED = import.meta.env.VITE_ENABLE_ASSISTANT === 'true';

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

  const handleSearch = (e: FormEvent) => {
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
    <div className="bg-bg text-ink">
      <section className="relative overflow-hidden border-b border-line bg-card lg:border-none lg:bg-soft">
        <div className="pointer-events-none absolute -right-10 -top-10 hidden h-[300px] w-[300px] rounded-full bg-white/45 lg:block" aria-hidden="true" />
        <Container className="relative flex flex-col gap-6 py-8 lg:flex-row lg:items-end lg:justify-between lg:py-14">
          <div>
            <p className="font-mono text-[11px] font-bold text-muted lg:text-[var(--k-on-soft-muted)]">MARKETPLACE</p>
            <h1 className="mt-2 font-black text-[28px] leading-[1.1] tracking-[-.03em] lg:max-w-[460px] lg:text-[44px] lg:leading-[1.02] lg:tracking-[-.04em] lg:text-[var(--k-on-soft)]">
              Find what you need today
            </h1>
            <p className="mt-2.5 text-sm font-medium text-muted lg:text-[var(--k-on-soft-muted)]">
              {total} product{total !== 1 ? 's' : ''} available
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex w-full items-center gap-2 lg:max-w-[380px]">
            <div className="flex flex-1 items-center gap-2.5 rounded-full border border-line bg-transparent px-4 py-3 t-fast focus-within:border-accent focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent hover:border-accent">
              <FiSearch className="shrink-0 text-muted" size={16} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-transparent text-base outline-none placeholder:text-muted sm:text-[13px]"
                placeholder={`Search ${total || ''} products`.trim()}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Clear search"
                  className="shrink-0 text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
            <Button type="submit" variant="dark" size="sm">
              Search
            </Button>
          </form>
        </Container>
      </section>

      {category && (
        <div className="border-b border-line bg-card py-3">
          <Container className="flex items-center gap-2">
            <span className="text-sm text-muted">Filtering by</span>
            <Chip selected onClick={clearCategory}>
              <FiTag size={13} />
              {category}
              <FiX size={13} />
            </Chip>
          </Container>
        </div>
      )}

      <Container className="py-6 lg:py-10">
        {isLoading ? (
          <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} interactive={false}>
                <Skeleton preset="block" className="h-[104px] w-full rounded-none lg:h-[210px]" />
                <div className="space-y-2 p-3 lg:p-4.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3.5 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<FiShoppingCart size={32} />}
            title="No products found"
            description="Try a different search term or category."
          />
        ) : (
          <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
            {products.map((product, i) => (
              <Reveal key={product._id} delay={Math.min(i, 10) * 40}>
                <Card as={Link} to={`/products/${product._id}`} className="block lift-lg hover:shadow-lift-accent-lg">
                  <div className="relative">
                    <ImageFrame
                      src={product.images[0]}
                      alt={product.name}
                      className="h-[104px] lg:h-[210px]"
                    />
                    {product.activeOffer && (
                      <Badge tone="ink" className="absolute left-3 top-3">
                        {product.activeOffer.name}
                      </Badge>
                    )}
                    {!product.isActive && (
                      <Badge tone="plum" className="absolute right-3 top-3">
                        Out of stock
                      </Badge>
                    )}
                  </div>

                  <div className="p-3 pt-2.75 pb-3.25 lg:p-4.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setCategory(product.category);
                        setPage(1);
                      }}
                      className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wide text-muted hover:text-accent"
                    >
                      {product.category}
                    </button>
                    <h3 className="line-clamp-2 text-[13px] font-bold text-ink">{product.name}</h3>
                    <div className="mt-2.5 flex items-center gap-2 lg:mt-3">
                      <span className="text-[14px] font-extrabold text-ink lg:text-base">
                        {formatCurrency(product.discountedPrice)}
                      </span>
                      {product.discountedPrice < product.price && (
                        <span className="text-[11px] font-semibold text-muted line-through">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        )}

        {ASSISTANT_ENABLED && (
          <Link
            to="/assistant"
            className="mt-5 flex items-center gap-3.5 rounded-card bg-soft p-3.5 lift t-base lg:mt-8"
          >
            <span className="relative h-10.5 w-10.5 shrink-0 rounded-tile bg-ink">
              <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-accent" />
            </span>
            <span>
              <span className="block text-[13px] font-extrabold text-[var(--k-on-soft)]">Ask the AI stylist</span>
              <span className="block text-[11px] font-medium text-[var(--k-on-soft-muted)]">
                "Gift under ₹5,000 for my sister"
              </span>
            </span>
          </Link>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-[13px] font-semibold text-muted">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
};

export default ProductListPage;

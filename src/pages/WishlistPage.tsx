import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ImageFrame from '../components/ui/ImageFrame';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

type WishlistProduct = {
  _id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  isFeatured?: boolean;
};

type WishlistItem = {
  _id: string;
  productId: WishlistProduct | null;
  addedAt: string;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

/**
 * Backed by the real `/wishlist` endpoints (`GET /` here, `POST /add` from
 * the ProductDetailPage heart button). There is no remove-from-wishlist
 * endpoint yet, so this page is read-only — no remove control is shown,
 * since one would have nothing to call.
 */
const WishlistPage = () => {
  useDocumentTitle('Wishlist');
  const navigate = useNavigate();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }

    userApi
      .get('/wishlist')
      .then(({ data }) => setItems(data.data ?? []))
      .catch((err) => {
        const msg = axios.isAxiosError(err)
          ? err.response?.data?.message ?? 'Failed to load wishlist.'
          : 'Failed to load wishlist.';
        toast.error(msg);
      })
      .finally(() => setIsLoading(false));
  }, [navigate]);

  const validItems = items.filter((item): item is WishlistItem & { productId: WishlistProduct } => !!item.productId);

  return (
    <Container className="py-6 lg:py-10">
      <div className="mb-6 lg:mb-8">
        <p className="font-mono text-[11px] font-bold text-muted">SAVED FOR LATER</p>
        <h1 className="mt-1.5 font-extrabold text-[22px] tracking-[-.02em]">Wishlist</h1>
      </div>

      {isLoading ? (
        <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} interactive={false}>
              <Skeleton preset="block" className="h-[104px] w-full rounded-none lg:h-[210px]" />
              <div className="space-y-2 p-3 lg:p-4.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3.5 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : validItems.length === 0 ? (
        <EmptyState
          icon={<FiHeart size={32} />}
          title="Your wishlist is empty"
          description="Tap the heart on a product page to save it here."
          action={
            <Button variant="primary" onClick={() => navigate('/products')}>
              Browse products
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-5">
          {validItems.map((item) => (
            <Card key={item._id} as={Link} to={`/products/${item.productId._id}`} className="block lift-lg hover:shadow-lift-accent-lg">
              <ImageFrame src={item.productId.images?.[0]} alt={item.productId.name} className="h-[104px] lg:h-[210px]" />
              <div className="p-3 pt-2.75 pb-3.25 lg:p-4.5">
                <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wide text-muted">{item.productId.category}</p>
                <h3 className="line-clamp-2 text-[13px] font-bold text-ink">{item.productId.name}</h3>
                <span className="mt-2.5 block text-[14px] font-extrabold text-ink lg:mt-3 lg:text-base">
                  {formatCurrency(item.productId.price)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default WishlistPage;

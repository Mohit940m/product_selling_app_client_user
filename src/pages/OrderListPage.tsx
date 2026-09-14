import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiChevronRight, FiPackage, FiShoppingCart } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axios from 'axios';
import userApi from '../api/userApi';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import ImageFrame from '../components/ui/ImageFrame';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatCurrency, formatOrderDate, getOrderStatusMeta, type Order } from '../components/order/orderMeta';

const PAGE_SIZE = 10;

type Pagination = { total: number; page: number; limit: number; totalPages: number };

/** Backed by `GET /orders` — paid/refunded orders only (the endpoint's default). */
const OrderListPage = () => {
  useDocumentTitle('Orders');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadedPage, setLoadedPage] = useState<number | null>(null);
  const isLoading = loadedPage !== page;

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
      return;
    }

    let cancelled = false;
    userApi
      .get('/orders', { params: { page, limit: PAGE_SIZE } })
      .then(({ data }) => {
        if (cancelled) return;
        setOrders(data.data ?? []);
        setPagination(data.pagination ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = axios.isAxiosError(err)
          ? err.response?.data?.message ?? 'Failed to load orders.'
          : 'Failed to load orders.';
        toast.error(msg);
        setOrders([]);
        setPagination(null);
      })
      .finally(() => {
        if (!cancelled) setLoadedPage(page);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, page]);

  const goToPage = (next: number) => {
    setSearchParams(next === 1 ? {} : { page: String(next) });
    window.scrollTo(0, 0);
  };

  return (
    <Container className="py-6 lg:py-10">
      <div className="mb-6 lg:mb-8">
        <p className="font-mono text-[11px] font-bold text-muted">MY ORDERS</p>
        <h1 className="mt-1.5 font-extrabold text-[22px] tracking-[-.02em]">Orders</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} interactive={false} padded>
              <div className="flex gap-3.5">
                <Skeleton preset="block" className="h-16 w-16 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3.5 w-1/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<FiPackage size={32} />}
          title="No orders yet"
          description="After you place an order, it will appear here."
          action={
            <Button variant="primary" icon={<FiShoppingCart size={16} />} onClick={() => navigate('/products')}>
              Browse products
            </Button>
          }
        />
      ) : (
        <>
          <ul className="space-y-3.5">
            {orders.map((order) => {
              const status = getOrderStatusMeta(order);
              const first = order.items[0];
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
              const extraLines = order.items.length - 1;
              return (
                <li key={order._id}>
                  <Card as={Link} to={`/orders/${order._id}`} padded className="block">
                    <div className="flex items-start gap-3.5">
                      <ImageFrame src={first?.image} alt={first?.name ?? 'Order item'} className="h-16 w-16 shrink-0" rounded="rounded-btn" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="break-all font-mono text-[11px] font-bold text-muted">{order.orderId}</span>
                          <Badge tone={status.tone} className="px-2.5! py-1! text-[10px]!">
                            {status.label}
                          </Badge>
                        </div>
                        <p className="mt-1.5 line-clamp-1 text-[14px] font-bold text-ink">
                          {first?.name}
                          {extraLines > 0 && <span className="font-semibold text-muted"> + {extraLines} more</span>}
                        </p>
                        <p className="mt-1 text-xs font-medium text-muted">
                          {formatOrderDate(order.createdAt)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 self-center">
                        <span className="text-[15px] font-extrabold text-ink">{formatCurrency(order.totalAmount)}</span>
                        <FiChevronRight size={18} className="text-muted" aria-hidden="true" />
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          {pagination && pagination.totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-between gap-3" aria-label="Orders pagination">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                Previous
              </Button>
              <span className="font-mono text-[11px] font-bold text-muted">
                PAGE {pagination.page} / {pagination.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => goToPage(page + 1)}>
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </Container>
  );
};

export default OrderListPage;

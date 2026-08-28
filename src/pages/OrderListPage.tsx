import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiShoppingCart } from 'react-icons/fi';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Order history landing. There is currently no backend endpoint to list a
 * user's past orders (`user.routes/order.routes.ts` only exposes
 * checkout/create-order/verify-payment), so this stays an honest empty
 * state rather than fabricating order rows. Wire this up to a real
 * "list my orders" endpoint once one exists.
 */
const OrderListPage = () => {
  useDocumentTitle('Orders');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <Container className="py-6 lg:py-10">
      <div className="mb-6 lg:mb-8">
        <p className="font-mono text-[11px] font-bold text-muted">MY ORDERS</p>
        <h1 className="mt-1.5 font-extrabold text-[22px] tracking-[-.02em]">Orders</h1>
      </div>

      <EmptyState
        icon={<FiPackage size={32} />}
        title="No recent orders"
        description="After you place an order, it will appear here."
        action={
          <Button variant="primary" icon={<FiShoppingCart size={16} />} onClick={() => navigate('/products')}>
            Browse products
          </Button>
        }
      />
    </Container>
  );
};

export default OrderListPage;

import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiShoppingCart } from 'react-icons/fi';
import Navbar from '../components/Navbar';

type LocationState = {
  orderId?: string;
};

const OrderListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const orderId = state?.orderId;

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-text">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">My Orders</p>
            <h1 className="text-2xl font-bold text-text">Orders</h1>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          {orderId ? (
            <div className="mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-8 text-center shadow-md">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600 mx-auto">
                <FiCheckCircle size={36} />
              </span>
              <h2 className="mt-4 text-2xl font-bold text-text">Order Placed!</h2>
              <p className="mt-2 text-sm text-gray-600">Your payment was successful and your order is confirmed.</p>
              <div className="mt-4 rounded-lg bg-secondary p-3">
                <p className="text-xs text-gray-600">Order ID</p>
                <p className="font-mono text-sm font-bold text-accent break-all">{orderId}</p>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  to="/products"
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-text shadow-md hover:border-primary hover:text-accent"
                >
                  <FiShoppingCart size={16} />
                  Continue shopping
                </Link>
                <Link
                  to="/cart"
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-accent"
                >
                  <FiPackage size={16} />
                  View cart
                </Link>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-lg rounded-lg border border-dashed border-gray-300 p-12 text-center">
              <FiPackage className="mx-auto text-primary" size={32} />
              <h3 className="mt-3 text-lg font-bold text-text">No recent orders</h3>
              <p className="mt-1 text-sm text-gray-600">After you place an order, it will appear here.</p>
              <Link
                to="/products"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-accent"
              >
                <FiShoppingCart size={16} />
                Browse products
              </Link>
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

export default OrderListPage;

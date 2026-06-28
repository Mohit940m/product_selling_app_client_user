import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiList, FiLogOut, FiShoppingBag, FiShoppingCart, FiPackage, FiUser } from 'react-icons/fi';
import userApi from '../api/userApi';

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('userToken');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    userApi.get('/cart/get-cart')
      .then(({ data }) => setCartCount(data.data?.items?.length ?? 0))
      .catch(() => {});
  }, [isLoggedIn]);

  const logout = () => {
    localStorage.removeItem('userToken');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link to="/products" className="flex items-center gap-2 text-text">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <FiShoppingBag size={22} />
          </span>
          <span className="text-lg font-bold">ShopNow</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-600">
          <Link className="rounded-lg px-3 py-2 hover:bg-secondary hover:text-accent" to="/products">
            <span className="flex items-center gap-1.5">
              <FiPackage size={16} />
              Products
            </span>
          </Link>

          {isLoggedIn && (
            <Link className="relative rounded-lg px-3 py-2 hover:bg-secondary hover:text-accent" to="/cart">
              <span className="flex items-center gap-1.5">
                <FiShoppingCart size={16} />
                Cart
                {cartCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </span>
            </Link>
          )}

          {isLoggedIn && (
            <Link className="rounded-lg px-3 py-2 hover:bg-secondary hover:text-accent" to="/orders">
              <span className="flex items-center gap-1.5">
                <FiList size={16} />
                Orders
              </span>
            </Link>
          )}

          {isLoggedIn && (
            <Link className="rounded-lg px-3 py-2 hover:bg-secondary hover:text-accent" to="/profile">
              <span className="flex items-center gap-1.5">
                <FiUser size={16} />
                Profile
              </span>
            </Link>
          )}

          {isLoggedIn ? (
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-text hover:border-primary hover:text-accent"
            >
              <FiLogOut size={18} />
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-text hover:border-primary hover:text-accent"
            >
              <FiUser size={18} />
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

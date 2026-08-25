import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiLogOut, FiSearch, FiShoppingCart, FiUser } from 'react-icons/fi';
import BrandMark from './BrandMark';

const ASSISTANT_ENABLED = import.meta.env.VITE_ENABLE_ASSISTANT === 'true';

const CATEGORY_LINKS = ['New', 'Apparel', 'Tech', 'Home', 'Sale'];

interface TopNavProps {
  cartCount: number;
}

/**
 * Desktop top navigation (Kartly Commerce Kit.dc.html lines 524-541).
 * Category links and inline search collapse away below `lg`; the mobile
 * BottomTabBar covers Shop/Search/Cart/Profile navigation instead.
 */
const TopNav = ({ cartCount }: TopNavProps) => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('userToken');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const logout = () => {
    localStorage.removeItem('userToken');
    navigate('/login');
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b border-line bg-bg t-fast ${scrolled ? 'bg-bg/90 backdrop-blur-md' : ''}`}
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-6 px-5 py-3.5 sm:px-8 lg:px-10">
        <Link to="/products" aria-label="Home">
          <BrandMark size={28} />
        </Link>

        <nav className="hidden items-center gap-6.5 text-[13px] font-semibold lg:flex" aria-label="Categories">
          {CATEGORY_LINKS.map((label) => (
            <Link
              key={label}
              to={label === 'New' ? '/products' : `/products?category=${encodeURIComponent(label)}`}
              className="t-fast hover:text-accent"
            >
              {label}
            </Link>
          ))}
        </nav>

        <Link
          to="/products?focus=search"
          className="hidden max-w-[340px] flex-1 items-center gap-2.75 rounded-full border border-line px-4 py-2.5 t-fast hover:border-accent lg:flex"
        >
          <FiSearch className="text-muted" size={14} />
          <span className="text-[12.5px] font-medium text-muted">Search products</span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <Link
            to="/products?focus=search"
            aria-label="Search"
            className="grid h-10 w-10 place-items-center rounded-[12px] border border-line t-fast hover:border-accent lg:hidden"
          >
            <FiSearch size={16} />
          </Link>

          {ASSISTANT_ENABLED && (
            <Link
              to="/assistant"
              className="hidden items-center gap-1.5 rounded-full bg-soft px-4 py-2.5 text-xs font-extrabold text-[var(--k-on-soft)] lift sm:inline-flex"
            >
              ✦ Ask AI
            </Link>
          )}

          {isLoggedIn && (
            <Link
              to="/cart"
              aria-label="Cart"
              className="relative grid h-9.5 w-9.5 place-items-center rounded-[12px] border border-line t-fast hover:border-accent"
            >
              <FiShoppingCart size={16} />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-extrabold text-onacc animate-pop">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {isLoggedIn ? (
            <>
              <Link
                to="/profile"
                aria-label="Profile"
                className="hidden h-9.5 w-9.5 place-items-center rounded-[12px] bg-soft sm:grid"
              >
                <FiUser size={16} className="text-[var(--k-on-soft)]" />
              </Link>
              <button
                type="button"
                onClick={logout}
                aria-label="Log out"
                className="hidden items-center gap-1.5 rounded-[12px] border border-line px-3 py-2 text-xs font-bold text-ink t-fast hover:border-accent hover:text-accent sm:flex"
              >
                <FiLogOut size={15} />
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-btn bg-ink px-4 py-2.5 text-xs font-extrabold text-card lift hover:shadow-lift-ink"
            >
              <FiUser size={14} />
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;

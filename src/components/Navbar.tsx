import TopNav from './layout/TopNav';
import { useCartCount } from '../hooks/useCartCount';

/**
 * @deprecated Superseded by `layout/TopNav`, rendered once by `layout/AppLayout`.
 * Kept as a drop-in, zero-prop replacement for any page not yet migrated
 * onto the shared app shell (Phase 7.1.4 removes this once none remain).
 */
const Navbar = () => {
  const cartCount = useCartCount();
  return <TopNav cartCount={cartCount} />;
};

export default Navbar;

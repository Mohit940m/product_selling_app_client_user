import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopNav from './TopNav';
import BottomTabBar from './BottomTabBar';
import Footer from './Footer';
import { useCartCount } from '../../hooks/useCartCount';

/**
 * The shared authenticated-app shell: sticky top nav, routed page content,
 * footer, and the mobile bottom tab bar. Rendered once by the router so
 * navigating between pages does not remount the chrome.
 */
const AppLayout = () => {
  const { pathname } = useLocation();
  const cartCount = useCartCount();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <TopNav cartCount={cartCount} />
      <main className="flex-1 pb-24 lg:pb-0">
        <div key={pathname} className="animate-up">
          <Outlet />
        </div>
      </main>
      <Footer />
      <BottomTabBar cartCount={cartCount} />
    </div>
  );
};

export default AppLayout;

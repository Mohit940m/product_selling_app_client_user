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
      {/* Visually hidden until focused — the first Tab stop on every page,
          so a keyboard/screen-reader user isn't forced through the full
          nav (category links, search, cart, profile) before reaching the
          actual page content on every single navigation. WCAG 2.4.1. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-btn focus:bg-accent focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-onacc focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        Skip to content
      </a>
      <TopNav cartCount={cartCount} />
      <main id="main-content" className="flex-1 pb-24 lg:pb-0">
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

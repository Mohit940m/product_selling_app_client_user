import { useEffect, useState } from 'react';
import userApi from '../api/userApi';

const CART_CHANGED_EVENT = 'kartly:cart-changed';

/**
 * Call after any successful cart mutation (add/remove/checkout) so every
 * `useCartCount()` listener re-fetches. Needed because AppLayout — which
 * owns the one `useCartCount()` instance behind the TopNav/BottomTabBar
 * badge — is rendered once for the whole session and never remounts on
 * navigation, so without this the badge would fetch its count exactly
 * once and then stay frozen at that number for the rest of the session,
 * regardless of anything added or removed afterward. A plain window
 * event is used rather than a state library, matching this app's
 * existing no-global-state-management design.
 */
export const notifyCartChanged = () => {
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
};

/**
 * Shared cart item count for the top nav and the mobile bottom tab bar,
 * so both nav surfaces don't each fire their own /cart/get-cart request.
 */
export const useCartCount = () => {
  const isLoggedIn = !!localStorage.getItem('userToken');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;

    // load() can now fire repeatedly (mount + every cart-changed event),
    // not just once — a plain per-effect isCurrent flag would guard
    // against unmount but not against two of these calls racing each
    // other (e.g. two fast cart mutations). requestId tags each call so
    // only the most recently *started* one is allowed to commit.
    let requestId = 0;
    let isCurrent = true;

    const load = () => {
      const thisRequest = ++requestId;
      userApi
        .get('/cart/get-cart')
        .then(({ data }) => {
          if (isCurrent && thisRequest === requestId) setCartCount(data.data?.items?.length ?? 0);
        })
        .catch(() => {});
    };

    load();
    window.addEventListener(CART_CHANGED_EVENT, load);
    return () => {
      isCurrent = false;
      window.removeEventListener(CART_CHANGED_EVENT, load);
    };
  }, [isLoggedIn]);

  return cartCount;
};

import { useEffect, useState } from 'react';
import userApi from '../api/userApi';

/**
 * Shared cart item count for the top nav and the mobile bottom tab bar,
 * so both nav surfaces don't each fire their own /cart/get-cart request.
 */
export const useCartCount = () => {
  const isLoggedIn = !!localStorage.getItem('userToken');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    userApi
      .get('/cart/get-cart')
      .then(({ data }) => setCartCount(data.data?.items?.length ?? 0))
      .catch(() => {});
  }, [isLoggedIn]);

  return cartCount;
};

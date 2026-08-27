import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL ?? 'https://product-selling-app-server.onrender.com';

const userApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/user`,
  // No timeout was set before this — axios defaults to none, so a
  // dropped connection (not a 4xx/5xx, just no response ever arriving)
  // left a page's isLoading spinner stuck forever. 45s is generous
  // enough to not interrupt the production backend's real cold-start
  // delay (Render's free tier sleeps the service after inactivity) while
  // still eventually giving up on a genuinely dead connection. Every
  // existing `axios.isAxiosError(err) ? err.response?.data?.message ??
  // fallback : fallback` error handler already copes with this — a
  // timeout has no `err.response`, so it falls through to the same
  // generic fallback message already used for other network failures.
  timeout: 45000,
});

userApi.interceptors.request.use((config) => {
  // localStorage can throw (privacy mode with storage blocked, some
  // corporate browser policies) — if it does, every request should still
  // go out unauthenticated rather than fail outright before it's sent.
  let token: string | null = null;
  try {
    token = localStorage.getItem('userToken');
  } catch {
    // Fall through with no token.
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// No global 401 handling existed before this — an expired/invalid token
// just meant every page's own fetch failed with a generic "failed to
// load" toast, with no path back to a working state except the user
// manually navigating to /login themselves. Only act when a token is
// actually stored (a 401 with no stored token is an expected outcome of
// an anonymous action, e.g. adding to cart while logged out, and is
// already handled per-page) and we're not already on the login/signup
// screen, so this can't create a redirect loop or clobber a real
// invalid-OTP error on those pages.
userApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      let hadToken = false;
      try {
        hadToken = !!localStorage.getItem('userToken');
        if (hadToken) localStorage.removeItem('userToken');
      } catch {
        // If storage itself is the problem, there's nothing more to clean up.
      }

      const onAuthPage = window.location.pathname === '/login' || window.location.pathname === '/signup';
      if (hadToken && !onAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default userApi;

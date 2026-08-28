import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { ThemeProvider, useTheme } from './theme/ThemeProvider'
import ErrorBoundary from './components/ErrorBoundary'
import AppLayout from './components/layout/AppLayout'
import WelcomePage, { WELCOME_SEEN_KEY } from './pages/WelcomePage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ProductListPage from './pages/ProductListPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderListPage from './pages/OrderListPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import WishlistPage from './pages/WishlistPage'
import ProfilePage from './pages/ProfilePage'
import AssistantPage from './pages/AssistantPage'
import NotFoundPage from './pages/NotFoundPage'

const RootRedirect = () => {
  const hasSeenWelcome = typeof window !== 'undefined' && localStorage.getItem(WELCOME_SEEN_KEY);
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('userToken');
  if (!hasSeenWelcome && !isLoggedIn) {
    return <Navigate to="/welcome" replace />;
  }
  return <Navigate to="/products" replace />;
};

const AppRoutes = () => {
  const { theme } = useTheme()

  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          <Route element={<AppLayout />}>
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/:productId" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrderListPage />} />
            <Route path="/orders/success" element={<OrderSuccessPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/assistant" element={<AssistantPage />} />
          </Route>

          {/* Catch-all: React Router renders nothing for an unmatched path
              otherwise — a blank white screen with no way back. */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme={theme}
        toastClassName="rounded-[var(--radius-tile)] border border-line bg-card text-ink shadow-kartly"
        progressClassName="bg-accent"
      />
    </Router>
  )
}

const App = () => {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  )
}

export default App

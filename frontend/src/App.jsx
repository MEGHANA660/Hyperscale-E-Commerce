import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ProductSearch from './pages/ProductSearch'
import ProductDetail from './pages/ProductDetail'
import ShoppingCart from './pages/ShoppingCart'
import PerformanceDashboard from './pages/PerformanceDashboard'
import Wishlist from './pages/Wishlist'
import UserProfile from './pages/UserProfile'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'

export default function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="search" element={<ProductSearch />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="cart" element={<ShoppingCart />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="performance" element={<PerformanceDashboard />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WishlistProvider>
    </CartProvider>
  )
}

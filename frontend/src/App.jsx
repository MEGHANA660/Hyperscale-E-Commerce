import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ProductSearch from './pages/ProductSearch'
import ProductDetail from './pages/ProductDetail'
import ShoppingCart from './pages/ShoppingCart'
import PerformanceDashboard from './pages/PerformanceDashboard'
import { CartProvider } from './context/CartContext'

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<ProductSearch />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route path="cart" element={<ShoppingCart />} />
            <Route path="performance" element={<PerformanceDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg-premium flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-full w-full mx-auto px-6 sm:px-12 lg:px-16 xl:px-24 py-6 sm:py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

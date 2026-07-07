import { Link } from 'react-router-dom'
import { Send, ArrowUp } from 'lucide-react'

export default function Footer() {
  const handleSubscribe = (e) => {
    e.preventDefault()
    alert('Thank you for subscribing to aeterna. newsletter!')
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 mt-16 sm:mt-24">
      {/* Newsletter Section */}
      <div className="max-w-full w-full mx-auto px-6 sm:px-12 lg:px-16 xl:px-24 py-12 border-b border-slate-800">
        <div className="grid lg:grid-cols-5 gap-8 items-center">
          <div className="lg:col-span-3 text-left space-y-2">
            <h3 className="text-white text-lg font-black tracking-tight">Stay updated with aeterna.</h3>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">Subscribe to our newsletter for exclusive drops, private sale codes, and curated design essays.</p>
          </div>
          <div className="lg:col-span-2">
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email address"
                required
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-450 focus:bg-slate-800"
              />
              <button
                type="submit"
                className="bg-white text-slate-900 font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                Subscribe
                <Send size={11} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Company Details */}
      <div className="max-w-full w-full mx-auto px-6 sm:px-12 lg:px-16 xl:px-24 py-16 grid grid-cols-2 md:grid-cols-5 gap-8 text-left">
        
        {/* Column 1: Company Profile & Contacts */}
        <div className="col-span-2 space-y-4">
          <Link to="/" className="text-xl font-black text-white tracking-tighter select-none">
            aeterna<span className="text-blue-500 font-black">.</span>
          </Link>
          <p className="text-xs sm:text-sm leading-relaxed max-w-sm font-medium text-slate-450">
            Exceptional everyday essentials, exceptionally made. Delivering premium lifestyle items globally with mathematically optimized logistics and prioritised fulfillment.
          </p>
          <div className="space-y-1.5 text-xs font-semibold text-slate-400">
            <p>📍 142 Premium Lane, Indiranagar, Bangalore, KA, India</p>
            <p>📞 +91 80 4992 0000</p>
            <p>✉️ hello@aeterna.co</p>
          </div>
        </div>

        {/* Column 2: Shop */}
        <div className="space-y-4">
          <h4 className="text-white text-[10px] font-extrabold tracking-widest uppercase">Collections</h4>
          <ul className="space-y-2 text-xs font-semibold">
            <li><Link to="/search" className="hover:text-white transition-colors">Shop All</Link></li>
            <li><Link to="/search?category=Fashion" className="hover:text-white transition-colors">Fashion Edit</Link></li>
            <li><Link to="/search?category=Electronics" className="hover:text-white transition-colors">Electronics</Link></li>
            <li><Link to="/search?category=Laptops" className="hover:text-white transition-colors">Premium Laptops</Link></li>
            <li><Link to="/search?category=Home%20%26%20Living" className="hover:text-white transition-colors">Home & Living</Link></li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="space-y-4">
          <h4 className="text-white text-[10px] font-extrabold tracking-widest uppercase">Company</h4>
          <ul className="space-y-2 text-xs font-semibold">
            <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Press Releases</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Our Labs</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Sustainability</a></li>
          </ul>
        </div>

        {/* Column 4: Customer Support & Legal */}
        <div className="space-y-4">
          <h4 className="text-white text-[10px] font-extrabold tracking-widest uppercase">Let Us Help</h4>
          <ul className="space-y-2 text-xs font-semibold">
            <li><Link to="/profile" className="hover:text-white transition-colors">Your Account</Link></li>
            <li><Link to="/cart" className="hover:text-white transition-colors">Fulfillment Queue</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Shipping Rates & Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Returns & Exchanges</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
          </ul>
        </div>

      </div>

      {/* Bottom Section */}
      <div className="border-t border-slate-800 bg-slate-950 py-8 text-xs font-semibold">
        <div className="max-w-full w-full mx-auto px-6 sm:px-12 lg:px-16 xl:px-24 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-slate-500">© 2026 aeterna. All rights reserved. Designed for VTU Phase II Review.</p>
          
          {/* Socials & Back to Top */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Instagram */}
              <a href="#" className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              {/* Twitter */}
              <a href="#" className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              {/* Facebook */}
              <a href="#" className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
            <button 
              onClick={scrollToTop}
              className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
              title="Back to Top"
            >
              <span>Top</span>
              <ArrowUp size={11} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

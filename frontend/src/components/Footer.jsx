import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-bg-premium border-t border-slate-200 text-slate-500">
      {/* Top section with link columns */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
        
        <div className="space-y-4">
          <h4 className="text-slate-800 text-xs font-bold tracking-widest uppercase">Get to Know Us</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#" className="hover:text-slate-800 transition-colors">About aeterna.</a></li>
            <li><a href="#" className="hover:text-slate-800 transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-slate-800 transition-colors">Press Releases</a></li>
            <li><a href="#" className="hover:text-slate-800 transition-colors">aeterna. Science</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-slate-800 text-xs font-bold tracking-widest uppercase">Connect with Us</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#" className="hover:text-slate-800 transition-colors">Instagram</a></li>
            <li><a href="#" className="hover:text-slate-800 transition-colors">Pinterest</a></li>
            <li><a href="#" className="hover:text-slate-800 transition-colors">Twitter</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-slate-800 text-xs font-bold tracking-widest uppercase">Make Money with Us</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#" className="hover:text-slate-800 transition-colors">Sell on aeterna.</a></li>
            <li><a href="#" className="hover:text-slate-800 transition-colors">Become an Affiliate</a></li>
            <li><a href="#" className="hover:text-slate-800 transition-colors">Design collaborations</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-slate-800 text-xs font-bold tracking-widest uppercase">Let Us Help You</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#" className="hover:text-slate-800 transition-colors">Your Account</a></li>
            <li><a href="#" className="hover:text-slate-800 transition-colors">Your Orders</a></li>
            <li><a href="#" className="hover:text-slate-800 transition-colors">Shipping & Returns</a></li>
            <li><a href="#" className="hover:text-slate-800 transition-colors">Contact Support</a></li>
          </ul>
        </div>

      </div>

      {/* Bottom section with copyright */}
      <div className="border-t border-slate-200 py-8 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-lg font-black text-slate-900 tracking-tighter">
            aeterna<span className="text-slate-900">.</span>
          </span>
          <p className="text-slate-400 font-medium">© 2026 aeterna. All rights reserved. Exceptional everyday essentials.</p>
        </div>
      </div>
    </footer>
  )
}

import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, RotateCcw, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { MOCK } from '../services/api'
import ProductCard from '../components/ProductCard'

const CATEGORIES = [
  { name: 'Fashion',         count: '820 styles',    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=600&q=80',  query: 'Fashion' },
  { name: 'Electronics',    count: '412 products',  image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',  query: 'Electronics' },
  { name: 'Home & Living',  count: '642 products',  image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',  query: 'Home' },
  { name: 'Beauty',         count: '928 essentials', image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80', query: 'Beauty' },
  { name: 'Laptops',        count: '180 models',    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',  query: 'Laptops' },
  { name: 'Phones',         count: '340 devices',   image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80',  query: 'Phones' },
]

const TESTIMONIALS = [
  {
    quote: 'Clean, fast, and beautifully organized. The aesthetic is genuinely second to none — I find myself browsing just to enjoy the UI.',
    author: 'Charlotte M.',
    role: 'Design Lead, Figma',
    initials: 'CM',
    rating: 5,
    avatarBg: 'bg-violet-100 text-violet-700',
  },
  {
    quote: 'The attention to detail in packaging and delivery speeds is spectacular. Express delivery actually arrived in 90 minutes.',
    author: 'Julian K.',
    role: 'Senior Engineer, Google',
    initials: 'JK',
    rating: 5,
    avatarBg: 'bg-blue-100 text-blue-700',
  },
  {
    quote: 'A platform that actually respects simplicity. Product quality is exceptional and the return process was genuinely hassle-free.',
    author: 'Sophie V.',
    role: 'Architect & Founder',
    initials: 'SV',
    rating: 5,
    avatarBg: 'bg-emerald-100 text-emerald-700',
  },
]

export default function Home() {
  const categoriesRef = useRef(null)

  const scrollToCategories = (e) => {
    e.preventDefault()
    categoriesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const bestsellers  = MOCK.products.filter(p => [1, 2, 3, 7].includes(p.id))
  const recommended  = MOCK.products.filter(p => [15, 19, 8, 13].includes(p.id))

  return (
    <div className="space-y-14 sm:space-y-20 animate-in">

      {/* ─── 1. HERO SECTION ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[32px] bg-[#e8e8e0] border border-slate-200/40">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 items-center gap-8 p-8 sm:p-12 lg:p-16">
          {/* Hero copy */}
          <div className="space-y-7 text-left z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/80 border border-slate-200/60 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-700">
              <Sparkles size={11} className="text-amber-500 fill-amber-500" />
              Summer Edit — 2026
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-[0.92] max-w-lg">
              Everyday essentials,<br />exceptionally made.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-md leading-relaxed font-medium">
              Discover 50,000+ products across fashion, electronics, beauty, and home. Hand-picked quality, fairly priced, delivered fast.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/search" className="btn-pill-dark inline-flex items-center gap-2 group text-sm px-6 py-3">
                Shop the edit <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a href="#categories" onClick={scrollToCategories} className="btn-pill-light text-sm px-6 py-3">
                Browse categories
              </a>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative aspect-[4/3] lg:aspect-square w-full rounded-[24px] overflow-hidden border border-white/60 shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80"
              alt="Premium fashion lifestyle curated edit"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ─── 2. TRUST FEATURES BAR ───────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Free 2-day shipping', detail: 'On orders over ₹5,000', icon: Truck },
          { label: '60-day returns',      detail: 'No questions asked',     icon: RotateCcw },
          { label: 'Buyer protection',   detail: 'Every purchase secured',  icon: ShieldCheck },
          { label: 'Member rewards',     detail: 'Earn 2× points always',   icon: Sparkles },
        ].map((feat, idx) => {
          const Icon = feat.icon
          return (
            <div key={idx} className="flex gap-3.5 items-center bg-white border border-slate-200/60 rounded-2xl p-4 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
                <Icon size={17} />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 tracking-tight">{feat.label}</p>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{feat.detail}</p>
              </div>
            </div>
          )
        })}
      </section>

      {/* ─── 3. SHOP BY CATEGORY ─────────────────────────────────────────── */}
      <section id="categories" ref={categoriesRef} className="space-y-6">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Shop by category</h2>
            <p className="text-slate-400 text-xs font-medium mt-1">20,000+ items across 6 curated collections</p>
          </div>
          <Link to="/search" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors">
            All categories <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <Link 
              key={cat.name} 
              to={`/search?category=${cat.query}`}
              className="group relative aspect-[3/4] rounded-[20px] overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-lg transition-all duration-300"
            >
              <img 
                src={cat.image} 
                alt={cat.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-5 sm:p-6 text-left transition-opacity duration-300">
                <h3 className="text-white text-base sm:text-lg font-black tracking-tight leading-tight">{cat.name}</h3>
                <span className="inline-block w-fit px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-slate-900 bg-white/95 backdrop-blur-xs mt-2 shadow-xs transition-colors duration-300 group-hover:bg-slate-900 group-hover:text-white">
                  {cat.count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 4. BESTSELLERS ──────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Trending this week</h2>
            <p className="text-slate-400 text-xs font-medium mt-1">Our most-loved picks right now</p>
          </div>
          <Link to="/search" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {bestsellers.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ─── 5. PREMIUM PROMO BANNER ─────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[28px] sm:rounded-[36px] border border-slate-800 shadow-2xl shadow-indigo-950/45" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
        {/* Background texture pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        {/* Decorative image */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 sm:w-2/5 opacity-30 sm:opacity-40">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80"
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-14 sm:py-20">
          <div className="max-w-lg text-left space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-400">Limited Drop — Ends Sunday</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                Knapsack DP Optimized Coupon
              </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.0]">
              Up to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">40% off</span> select bestsellers.
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Premium electronics, fashion, and home essentials — curated for the discerning shopper. Limited quantities available.
            </p>
            
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 w-fit px-3.5 py-1.5 rounded-xl shadow-inner">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Use Code:</span>
              <span className="font-mono text-xs font-black text-amber-400 tracking-wider">AETERNA40</span>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/search" className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full hover:bg-slate-100 hover:text-slate-950 transition-all hover:-translate-y-0.5 shadow-lg group">
                Shop deals now <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/search?category=Electronics" className="inline-flex items-center gap-2 border border-white/20 text-white font-semibold text-xs sm:text-sm px-6 py-2.5 rounded-full hover:bg-white/10 transition-all hover:-translate-y-0.5">
                Electronics sale
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. RECOMMENDED PICKS ────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Picked for you</h2>
            <p className="text-slate-400 text-xs font-medium mt-1">Fresh arrivals across Fashion and Beauty</p>
          </div>
          <Link to="/search" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors">
            Refresh <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {recommended.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ─── 7. TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="text-left border-b border-slate-200 pb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">What our members say</h2>
          <p className="text-slate-400 text-xs font-medium mt-1">Trusted by 50,000+ shoppers across India</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200/60 rounded-[24px] p-6 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4 text-left"
            >
              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-slate-700 leading-relaxed font-medium flex-1">
                "{item.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${item.avatarBg}`}>
                  {item.initials}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{item.author}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
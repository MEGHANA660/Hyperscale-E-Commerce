import React, { useRef, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, RotateCcw, ShieldCheck, Sparkles, Star, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { MOCK } from '../services/api'
import ProductCard from '../components/ProductCard'

const CATEGORIES = [
  { name: 'Fashion',         count: '820 styles',    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=600&q=80',  query: 'Fashion' },
  { name: 'Electronics',    count: '412 products',  image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',  query: 'Electronics' },
  { name: 'Home & Living',  count: '642 products',  image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',  query: 'Home & Living' },
  { name: 'Beauty',         count: '928 essentials', image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80', query: 'Beauty' },
  { name: 'Laptops',        count: '180 models',    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',  query: 'Laptops' },
  { name: 'Phones',         count: '340 devices',   image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80',  query: 'Phones' },
  { name: 'Accessories',    count: '150 items',     image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80',  query: 'Accessories' },
]

const PROMO_SLIDES = [
  {
    title: 'Up to 40% off select bestsellers',
    subtitle: 'Limited Drop — Ends Sunday',
    desc: 'Premium electronics, fashion, and home essentials — curated for the discerning shopper.',
    code: 'AETERNA40',
    color: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
    badge: 'Knapsack DP Optimized Coupon',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Upgrade your workspace essentials',
    subtitle: 'New Arrival Specials',
    desc: 'Take ₹5,000 off high-end mechanical keyboards, 4K monitors, and ergonomic seats.',
    code: 'WORKDXP5',
    color: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #1e1b4b 100%)',
    badge: 'Exclusive Tech Member Deal',
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80'
  },
  {
    title: 'Premium Skincare Curations',
    subtitle: 'Voted Best Beauty Edit of 2026',
    desc: 'Get an extra 15% off hydration serums, night creams, and glow kits.',
    code: 'LUMINOUS15',
    color: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #022c22 100%)',
    badge: 'Limited Quantity Release',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'
  }
]

const TESTIMONIALS = [
  {
    quote: 'Clean, fast, and beautifully organized. The aesthetic is genuinely second to none — I find myself browsing just to enjoy the UI.',
    author: 'Charlotte M.',
    role: 'Design Lead, Figma',
    initials: 'CM',
    rating: 5,
    avatarBg: 'bg-violet-100 text-violet-750',
  },
  {
    quote: 'The attention to detail in packaging and delivery speeds is spectacular. Express delivery actually arrived in 90 minutes.',
    author: 'Julian K.',
    role: 'Senior Engineer, Google',
    initials: 'JK',
    rating: 5,
    avatarBg: 'bg-blue-100 text-blue-750',
  },
  {
    quote: 'A platform that respects simplicity. Product quality is exceptional, checkout calculations are mathematically optimized, and returns are hassle-free.',
    author: 'Sophie V.',
    role: 'Architect & Founder',
    initials: 'SV',
    rating: 5,
    avatarBg: 'bg-emerald-100 text-emerald-750',
  },
]

export default function Home() {
  const categoriesRef = useRef(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Automatic Promo Carousel slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % PROMO_SLIDES.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % PROMO_SLIDES.length)
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length)

  const scrollToCategories = (e) => {
    e.preventDefault()
    categoriesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // --- Dynamic Products Categorization based on requirements ---
  // Best Sellers (includes IDs 1, 2, 3, 5)
  const bestsellers = MOCK.products.filter(p => [1, 2, 3, 5].includes(p.id))

  // Trending Products (IDs 6, 7, 8, 9, 10, 11)
  const trending = MOCK.products.filter(p => [6, 7, 8, 9, 10, 11].includes(p.id))

  // New Arrivals (IDs 21, 22, 34, 35, 72, 73, 106, 107)
  const newArrivals = MOCK.products.filter(p => [21, 22, 34, 35, 72, 73, 106, 107].includes(p.id))

  // Premium Picks (products with price > 90,000)
  const premiumPicks = MOCK.products.filter(p => p.price >= 90000).slice(0, 4)

  // Flash Sale Items (curated high discount items)
  const flashSaleItems = MOCK.products.filter(p => [8, 13, 15, 19].includes(p.id))

  // Recommended Products (fresh picks, Accessories, Beauty)
  const recommended = MOCK.products.filter(p => p.category === 'Accessories' || p.category === 'Beauty').slice(0, 4)

  return (
    <div className="space-y-16 sm:space-y-24 animate-in">

      {/* ─── 1. HERO SECTION ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[32px] bg-[#e8e8e0] border border-slate-200/40">
        <div className="grid lg:grid-cols-2 items-center gap-12 p-8 sm:p-14 lg:p-20 text-left">
          {/* Hero copy */}
          <div className="space-y-8 z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/80 border border-slate-200/60 px-4 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-slate-800 shadow-2xs">
              <Sparkles size={12} className="text-amber-500 fill-amber-500" />
              Summer Edit — 2026
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] max-w-lg">
              Everyday essentials,<br />exceptionally made.
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-650 leading-relaxed font-medium">
              Discover curated designs and high-performance items. Hand-picked quality, mathematically optimized pricing, and express delivery directly to your door.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/search" className="btn-pill-dark inline-flex items-center gap-2 group text-xs sm:text-sm px-7 py-3.5 shadow-md">
                Shop the edit <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a href="#categories" onClick={scrollToCategories} className="btn-pill-light text-xs sm:text-sm px-7 py-3.5 shadow-sm">
                Browse collections
              </a>
            </div>
          </div>

          {/* Hero image */}
          <div className="relative aspect-[4/3] lg:aspect-[1.1] w-full rounded-[28px] overflow-hidden border border-white/60 shadow-xl">
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
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Free 2-day shipping', detail: 'On orders over ₹5,000', icon: Truck },
          { label: '60-day returns',      detail: 'No questions asked',     icon: RotateCcw },
          { label: 'Buyer protection',   detail: 'Every purchase secured',  icon: ShieldCheck },
          { label: 'Member rewards',     detail: 'Earn 2× points always',   icon: Sparkles },
        ].map((feat, idx) => {
          const Icon = feat.icon
          return (
            <div key={idx} className="flex gap-4 items-center bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Icon size={19} />
              </div>
              <div className="text-left">
                <p className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">{feat.label}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-0.5">{feat.detail}</p>
              </div>
            </div>
          )
        })}
      </section>

      {/* ─── 3. SHOP BY CATEGORY ─────────────────────────────────────────── */}
      <section id="categories" ref={categoriesRef} className="space-y-8">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4 text-left">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">Shop by Category</h2>
            <p className="text-slate-450 text-xs sm:text-sm font-medium mt-1">100+ items across 7 premium curated collections</p>
          </div>
          <Link to="/search" className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
            All categories <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {CATEGORIES.map((cat) => (
            <Link 
              key={cat.name} 
              to={`/search?category=${encodeURIComponent(cat.name)}`}
              className="group relative aspect-[3/4] rounded-[22px] overflow-hidden border border-slate-150/80 shadow-xs hover:shadow-lg transition-all duration-500"
            >
              <img 
                src={cat.image} 
                alt={cat.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-4 text-left">
                <h3 className="text-white text-sm sm:text-base font-extrabold tracking-tight leading-tight">{cat.name}</h3>
                <span className="inline-block w-fit px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-slate-900 bg-white/95 backdrop-blur-xs mt-2 shadow-xs transition-colors duration-300 group-hover:bg-slate-900 group-hover:text-white">
                  {cat.count}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 4. FLASH SALE WITH TIMER ───────────────────────────────────── */}
      <section className="bg-red-50/50 border border-red-100 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-100/70 pb-4 text-left">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
              Flash Deal of the Day
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Limited Hours Offer</h2>
          </div>
          <div className="flex items-center gap-2 text-red-600 font-mono text-sm sm:text-base font-black bg-white border border-red-150 px-4 py-2 rounded-xl">
            <Clock size={16} className="animate-pulse" />
            <span>04 : 18 : 39</span>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {flashSaleItems.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ─── 5. BEST SELLERS ──────────────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4 text-left">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">Best Sellers</h2>
            <p className="text-slate-450 text-xs sm:text-sm font-medium mt-1">Our most popular products, loved by customers</p>
          </div>
          <Link to="/search" className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {bestsellers.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ─── 6. PREMIUM PROMO BANNER CAROUSEL ────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[36px] shadow-2xl border border-slate-900">
        <div 
          className="relative transition-all duration-700 ease-in-out py-16 sm:py-24 px-8 sm:px-16 lg:px-24"
          style={{ background: PROMO_SLIDES[currentSlide].color }}
        >
          {/* Slider Background Texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />

          {/* Banner Layout */}
          <div className="grid lg:grid-cols-5 gap-8 items-center text-left relative z-10">
            <div className="lg:col-span-3 space-y-6">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-400">
                  {PROMO_SLIDES[currentSlide].subtitle}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {PROMO_SLIDES[currentSlide].badge}
                </span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white tracking-tight leading-[1.0] max-w-lg">
                {PROMO_SLIDES[currentSlide].title}
              </h2>
              <p className="text-slate-350 text-xs sm:text-sm lg:text-base leading-relaxed max-w-md">
                {PROMO_SLIDES[currentSlide].desc}
              </p>
              
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 w-fit px-4 py-2 rounded-xl shadow-inner">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Use Code:</span>
                <span className="font-mono text-xs sm:text-sm font-black text-amber-400 tracking-wider">
                  {PROMO_SLIDES[currentSlide].code}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/search" className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold text-xs sm:text-sm px-6 py-3 rounded-full hover:bg-slate-100 transition-all hover:-translate-y-0.5 shadow-lg group">
                  Claim discount <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 hidden lg:block aspect-square w-full rounded-[24px] overflow-hidden border border-white/10 shadow-lg">
              <img 
                src={PROMO_SLIDES[currentSlide].image} 
                alt="Curated Offer Item" 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>

          {/* Carousel Arrows */}
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/15 transition-colors cursor-pointer"
            aria-label="Previous Offer"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/15 transition-colors cursor-pointer"
            aria-label="Next Offer"
          >
            <ChevronRight size={20} />
          </button>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {PROMO_SLIDES.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === idx ? 'bg-white w-6' : 'bg-white/30'}`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. TRENDING PRODUCTS ─────────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4 text-left">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">Trending Products</h2>
            <p className="text-slate-450 text-xs sm:text-sm font-medium mt-1">Our top-rated products of the week</p>
          </div>
          <Link to="/search" className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {trending.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ─── 8. NEW ARRIVALS ──────────────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4 text-left">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">New Arrivals</h2>
            <p className="text-slate-450 text-xs sm:text-sm font-medium mt-1">Fresh additions to our catalog this season</p>
          </div>
          <Link to="/search" className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {newArrivals.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ─── 9. PREMIUM PICKS ─────────────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4 text-left">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">Premium Picks</h2>
            <p className="text-slate-450 text-xs sm:text-sm font-medium mt-1">Luxury and high-performance items</p>
          </div>
          <Link to="/search" className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
            Explore all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {premiumPicks.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ─── 10. DEALS OF THE DAY ─────────────────────────────────────────── */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-8 sm:p-12 text-left shadow-lg">
          <div className="space-y-4 max-w-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-300">
              Electronics Sale
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Premium Acoustics Up to 25% Off
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm font-semibold">
              Save on high-end audio setups, monitors, and headphones. Includes verified manufacturer warranty.
            </p>
            <Link to="/search?category=Electronics" className="inline-flex items-center gap-2 bg-white text-slate-950 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full hover:bg-slate-100 transition-all hover:-translate-y-0.5 mt-2">
              Browse Audio <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-purple-900 to-fuchsia-950 text-white p-8 sm:p-12 text-left shadow-lg">
          <div className="space-y-4 max-w-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-fuchsia-300">
              Apparel Curations
            </span>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Premium Cashmere & Silks 30% Off
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm font-semibold">
              Refresh your wardrobe with certified organic cotton, merino wools, and tailored fits.
            </p>
            <Link to="/search?category=Fashion" className="inline-flex items-center gap-2 bg-white text-slate-950 font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full hover:bg-slate-100 transition-all hover:-translate-y-0.5 mt-2">
              Shop Collections <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 11. RECOMMENDED PRODUCTS ─────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4 text-left">
          <div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">Recommended Products</h2>
            <p className="text-slate-450 text-xs sm:text-sm font-medium mt-1">Fresh arrivals across Accessories and Beauty</p>
          </div>
          <Link to="/search" className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
            Explore more <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {recommended.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ─── 12. TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="space-y-10">
        <div className="text-left border-b border-slate-200 pb-4">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">What Our Members Say</h2>
          <p className="text-slate-455 text-xs sm:text-sm font-medium mt-1">Trusted by 50,000+ shoppers across India</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-100 rounded-[24px] p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col gap-5 text-left"
            >
              {/* Stars */}
              <div className="flex items-center gap-0.5">
                {[...Array(item.rating)].map((_, i) => (
                  <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-slate-650 leading-relaxed font-semibold flex-1">
                "{item.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3.5 pt-4 border-t border-slate-50">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${item.avatarBg} shadow-xs`}>
                  {item.initials}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">{item.author}</p>
                  <p className="text-[10px] text-slate-450 font-bold">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
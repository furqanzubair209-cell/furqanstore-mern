import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "../api/product.api";
import { ShieldCheck, Truck, Sparkles, Headset, Star, ArrowRight } from "lucide-react";
import WishlistButton from "../components/WishlistButton";

const TESTIMONIALS = [
  {
    name: "Ayesha R.",
    role: "Verified customer",
    rating: 5,
    quote: "Ordering from three different vendors and getting one smooth checkout is genuinely rare. Delivery was fast too.",
  },
  {
    name: "Bilal H.",
    role: "Verified customer",
    rating: 5,
    quote: "The quality checks actually show — every product I've bought here has matched the photos and description.",
  },
  {
    name: "Sana K.",
    role: "Vendor, Sana's Studio",
    rating: 4,
    quote: "Payouts are predictable and the dashboard makes it easy to track what's selling. Support responds quickly when it matters.",
  },
];

export default function Landing() {
  const { data: featured } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => productApi.list({ limit: 8, sort: "rating" }),
  });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: productApi.categories });

  return (
    <div className="animate-fadeIn">
      <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center border-b border-[rgb(var(--c-border)/0.1)] gradient-border">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--c-surface)/0.05)] to-transparent -z-10" />
        <div className="absolute inset-0 animate-shimmer opacity-20 -z-10" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gold/10 rounded-full blur-[100px] animate-pulseGlow -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px] animate-float -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center relative z-10">
          <div className="inline-block animate-slideUp stagger-1">
            <p className="uppercase tracking-[0.4em] text-gold text-xs font-semibold mb-6 px-4 py-1.5 rounded-full border border-gold/20 bg-gold/5">
              Premium Multi-vendor Marketplace
            </p>
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-tight max-w-5xl mx-auto animate-slideUp stagger-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70">
            Curated elegance for the modern lifestyle.
          </h1>
          <p className="text-[rgb(var(--c-text)/0.6)] text-lg md:text-xl max-w-2xl mx-auto mt-8 animate-slideUp stagger-3 font-light">
            Discover extraordinary products from independent artisans and premium brands. A seamless luxury shopping experience awaits.
          </p>
          <div className="flex flex-col xs:flex-row justify-center gap-6 mt-12 animate-slideUp stagger-4">
            <Link to="/products" className="group px-8 py-4 rounded-full bg-gold text-ink font-semibold hover:bg-gold-light hover:shadow-[0_0_30px_rgba(201,164,92,0.4)] transition-all flex items-center justify-center gap-2">
              Explore Collection <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/register" className="px-8 py-4 rounded-full glass border border-[rgb(var(--c-border)/0.2)] hover:border-gold hover:bg-[rgb(var(--c-surface)/0.05)] transition-all font-medium">
              Become a Vendor
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-16 animate-slideUp">
          <h2 className="font-display text-3xl md:text-4xl">Shop by Category</h2>
          <div className="w-24 h-1 bg-gold mx-auto mt-6 rounded-full opacity-50" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-6">
          {categories?.data?.map((c: any, i: number) => (
            <Link
              key={c.id}
              to={`/products?category=${c.slug}`}
              className="glass rounded-xl p-5 sm:p-8 text-center card-hover group border-[rgb(var(--c-border)/0.1)] relative overflow-hidden animate-slideUp"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-base font-medium relative z-10 group-hover:text-gold transition-colors">{c.name}</p>
              <p className="text-xs text-[rgb(var(--c-text)/0.4)] mt-2 relative z-10 font-light tracking-wide">{c._count?.products ?? 0} ITEMS</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[rgb(var(--c-surface)/0.02)] py-24 border-y border-[rgb(var(--c-border)/0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-16 gap-6">
            <div>
              <h2 className="font-display text-3xl md:text-4xl">Featured Curations</h2>
              <p className="text-[rgb(var(--c-text)/0.5)] mt-3">Handpicked selections of our finest pieces</p>
            </div>
            <Link to="/products" className="group flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors uppercase tracking-widest font-semibold border-b border-transparent hover:border-gold pb-1">
              View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured?.data?.items?.map((p: any, i: number) => (
              <div key={p.id} className="group card-hover animate-slideUp" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="relative rounded-2xl overflow-hidden bg-[rgb(var(--c-surface)/0.03)] border border-[rgb(var(--c-border)/0.05)]">
                  {(p.rating >= 4.8 || p.stock < 10) && (
                    <div className="absolute top-4 left-4 z-10">
                      {p.stock < 10 ? (
                        <span className="bg-red-900/80 text-red-100 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md">Rare</span>
                      ) : (
                        <span className="bg-gold/90 text-ink text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md">Best</span>
                      )}
                    </div>
                  )}
                  
                  <Link to={`/products/${p.id}`} className="block aspect-[4/5] relative">
                    <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                  </Link>
                  <WishlistButton productId={p.id} className="absolute top-4 right-4 z-20 bg-ink/50 backdrop-blur-md border border-white/10 hover:bg-gold hover:text-ink hover:border-gold transition-all" />
                </div>
                <Link to={`/products/${p.id}`} className="block mt-5">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-base font-medium group-hover:text-gold transition-colors line-clamp-1">{p.name}</p>
                      <p className="text-xs text-[rgb(var(--c-text)/0.5)] mt-1">{p.category?.name || 'Curated'}</p>
                    </div>
                    <p className="text-gold font-semibold whitespace-nowrap">Rs. {Number(p.price).toLocaleString()}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {[
              { icon: ShieldCheck, title: "Verified Excellence", desc: "Rigorous quality checks for every vendor and product." },
              { icon: Truck, title: "Premium Delivery", desc: "White-glove shipping for an impeccable unboxing experience." },
              { icon: Sparkles, title: "Curated Aesthetics", desc: "A thoughtfully selected collection of exceptional design." },
              { icon: Headset, title: "Concierge Support", desc: "Dedicated assistance whenever you need it." },
            ].map((f, i) => (
              <div key={f.title} className="animate-slideUp" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center mb-6 border border-gold/20 text-gold shadow-[0_0_30px_rgba(201,164,92,0.1)]">
                  <f.icon size={32} strokeWidth={1.5} />
                </div>
                <p className="text-lg font-display mb-3">{f.title}</p>
                <p className="text-sm text-[rgb(var(--c-text)/0.6)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[rgb(var(--c-surface)/0.03)] border-t border-[rgb(var(--c-border)/0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl">Words from our Clientele</h2>
            <div className="w-24 h-1 bg-gold mx-auto mt-6 rounded-full opacity-50" />
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className="glass rounded-2xl p-8 flex flex-col card-hover animate-slideUp" style={{ animationDelay: `${i * 0.2}s` }}>
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      size={16}
                      className={j < t.rating ? "fill-gold text-gold drop-shadow-[0_0_5px_rgba(201,164,92,0.5)]" : "text-[rgb(var(--c-text)/0.2)]"}
                    />
                  ))}
                </div>
                <p className="text-lg text-[rgb(var(--c-text)/0.8)] font-display italic flex-1 leading-relaxed">"{t.quote}"</p>
                <div className="mt-8 pt-6 border-t border-[rgb(var(--c-border)/0.1)] flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-ink font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-base font-medium">{t.name}</p>
                    <p className="text-xs text-[rgb(var(--c-text)/0.5)] uppercase tracking-wide mt-1">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-dark via-gold to-gold-light opacity-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="font-display text-4xl md:text-5xl mb-6">Join the Inner Circle</h2>
          <p className="text-lg text-[rgb(var(--c-text)/0.7)] mb-10 font-light">Subscribe to receive exclusive access to new collections, private sales, and editorial content.</p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1 bg-ink/50 backdrop-blur-md border border-[rgb(var(--c-border)/0.2)] rounded-full px-6 py-4 text-base focus:border-gold transition-colors"
              required
            />
            <button type="submit" className="px-8 py-4 rounded-full bg-gold text-ink font-semibold hover:bg-gold-light transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

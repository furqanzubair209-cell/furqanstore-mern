import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "../api/product.api";
import { ShieldCheck, Truck, Sparkles, Headset, Star } from "lucide-react";
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
    <div>
      <section className="relative overflow-hidden border-b border-[rgb(var(--c-border)/0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 md:py-36 text-center">
          <p className="uppercase tracking-[0.3em] text-gold text-xs mb-6">Multi-vendor marketplace</p>
          <h1 className="font-display text-4xl md:text-6xl leading-tight max-w-3xl mx-auto">
            Curated goods from vendors who care about craft.
          </h1>
          <p className="text-[rgb(var(--c-text)/0.6)] max-w-xl mx-auto mt-6">
            Browse thousands of products across electronics, fashion, and lifestyle —
            every purchase supports an independent seller.
          </p>
          <div className="flex flex-col xs:flex-row justify-center gap-4 mt-10">
            <Link to="/products" className="px-6 py-3 rounded-full bg-gold text-ink font-medium hover:opacity-90 transition">
              Shop the collection
            </Link>
            <Link to="/register" className="px-6 py-3 rounded-full border border-[rgb(var(--c-border)/0.2)] hover:border-gold transition">
              Sell on FurqanStore
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-2xl mb-8">Shop by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories?.data?.map((c: any) => (
            <Link
              key={c.id}
              to={`/products?category=${c.slug}`}
              className="rounded-xl border border-[rgb(var(--c-border)/0.1)] p-6 text-center hover:border-gold transition"
            >
              <p className="text-sm">{c.name}</p>
              <p className="text-xs text-[rgb(var(--c-text)/0.4)] mt-1">{c._count?.products ?? 0} items</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl">Featured products</h2>
          <Link to="/products" className="text-sm text-gold">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featured?.data?.items?.map((p: any) => (
            <div key={p.id} className="group">
              <div className="relative">
                <Link to={`/products/${p.id}`}>
                  <div className="aspect-square rounded-xl overflow-hidden bg-[rgb(var(--c-surface)/0.05)]">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                </Link>
                <WishlistButton productId={p.id} className="absolute top-2 right-2" />
              </div>
              <Link to={`/products/${p.id}`}>
                <p className="mt-3 text-sm truncate">{p.name}</p>
                <p className="text-gold text-sm">Rs. {Number(p.price).toLocaleString()}</p>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[rgb(var(--c-border)/0.1)] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
          {[
            { icon: ShieldCheck, title: "Verified vendors", desc: "Every seller is reviewed before going live." },
            { icon: Truck, title: "Fast delivery", desc: "Reliable shipping across the country." },
            { icon: Sparkles, title: "Quality first", desc: "Ratings and reviews on every product." },
            { icon: Headset, title: "Real support", desc: "A team that actually answers." },
          ].map((f) => (
            <div key={f.title}>
              <f.icon className="mx-auto text-gold mb-3" size={28} />
              <p className="text-sm font-medium">{f.title}</p>
              <p className="text-xs text-[rgb(var(--c-text)/0.5)] mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-2xl mb-8 text-center sm:text-left">What people are saying</h2>
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="border border-[rgb(var(--c-border)/0.1)] rounded-xl p-5 sm:p-6 flex flex-col">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < t.rating ? "fill-gold text-gold" : "text-[rgb(var(--c-text)/0.2)]"}
                  />
                ))}
              </div>
              <p className="text-sm text-[rgb(var(--c-text)/0.7)] flex-1">"{t.quote}"</p>
              <div className="mt-4 pt-4 border-t border-[rgb(var(--c-border)/0.1)]">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-[rgb(var(--c-text)/0.4)]">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

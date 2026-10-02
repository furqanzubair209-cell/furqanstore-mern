import { useSearchParams, Link } from "react-router-dom";
import { useState } from "react";
import { Eye, Search, ShoppingBag, Star } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { productApi } from "../api/product.api";
import { cartApi } from "../api/cart.api";
import WishlistButton from "../components/WishlistButton";
import QuickViewModal from "../components/QuickViewModal";
import { useToastStore } from "../store/toast.store";

const PAGE_SIZE = 24;

export default function Products() {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const { addToast } = useToastStore();
  const [quickViewId, setQuickViewId] = useState<number | null>(null);
  
  const category = params.get("category") || undefined;
  const sort = params.get("sort") || undefined;
  const search = params.get("search") || undefined;
  const page = Math.max(1, Number(params.get("page")) || 1);

  const { data: categoriesData } = useQuery({ queryKey: ["categories"], queryFn: productApi.categories });
  const categories = categoriesData?.data || [];

  const { data, isLoading } = useQuery({
    queryKey: ["products", { category, sort, search, page }],
    queryFn: () => productApi.list({ category, sort, search, page, limit: PAGE_SIZE }),
  });

  const totalPages = data?.data?.totalPages || 1;

  const goToPage = (p: number) => {
    setParams((prev) => { prev.set("page", String(p)); return prev; });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = async (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await cartApi.add(productId, 1);
      qc.invalidateQueries({ queryKey: ["cart"] });
      addToast("Item added to your shopping bag", "success");
    } catch (err) {
      addToast("Failed to add item to bag", "error");
    }
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge?.toUpperCase()) {
      case 'NEW': return 'bg-emerald-900/80 text-emerald-100 border-emerald-500/30';
      case 'HOT': return 'bg-orange-900/80 text-orange-100 border-orange-500/30';
      case 'SALE': return 'bg-red-900/80 text-red-100 border-red-500/30';
      case 'BEST': return 'bg-gold/90 text-ink border-gold/50';
      case 'LOW_STOCK': return 'bg-yellow-900/80 text-yellow-100 border-yellow-500/30';
      default: return 'bg-ink/80 text-white border-white/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-fadeIn">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl md:text-5xl mb-4">The Collection</h1>
        <p className="text-[rgb(var(--c-text)/0.6)]">Explore our curated selection of premium goods.</p>
      </div>

      <div className="glass rounded-2xl p-4 sm:p-6 mb-10 lg:sticky lg:top-20 z-40 border-[rgb(var(--c-border)/0.1)] shadow-xl shadow-ink/50">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
          <div className="flex-1 flex overflow-x-auto pb-2 lg:pb-0 gap-3 hide-scrollbar items-center">
            <button
              onClick={() => { setParams(p => { p.delete("category"); p.delete("page"); return p; }) }}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-colors border ${
                !category ? 'bg-gold text-ink border-gold' : 'bg-transparent text-[rgb(var(--c-text)/0.7)] border-[rgb(var(--c-border)/0.2)] hover:border-gold/50'
              }`}
            >
              All Items
            </button>
            {categories.map((c: any) => (
              <button
                key={c.id}
                onClick={() => { setParams(p => { p.set("category", c.slug); p.delete("page"); return p; }) }}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-colors border ${
                  category === c.slug ? 'bg-gold text-ink border-gold' : 'bg-transparent text-[rgb(var(--c-text)/0.7)] border-[rgb(var(--c-border)/0.2)] hover:border-gold/50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 lg:min-w-fit">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--c-text)/0.4)]" />
              <input
                defaultValue={search}
                placeholder="Search collection..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = (e.target as HTMLInputElement).value;
                    setParams((p) => { v ? p.set("search", v) : p.delete("search"); p.delete("page"); return p; });
                  }
                }}
                className="bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.2)] rounded-full pl-11 pr-4 py-2.5 text-sm w-full sm:w-64 focus:border-gold focus:bg-[rgb(var(--c-surface)/0.1)] transition-colors"
              />
            </div>
            <select
              value={sort || ""}
              onChange={(e) => setParams((p) => { e.target.value ? p.set("sort", e.target.value) : p.delete("sort"); p.delete("page"); return p; })}
              className="bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.2)] rounded-full px-5 py-2.5 text-sm appearance-none focus:border-gold cursor-pointer min-w-[160px]"
            >
              <option value="">Sort by: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-2xl animate-shimmer" />
              <div className="mt-4 h-4 w-3/4 rounded bg-[rgb(var(--c-surface)/0.1)]" />
              <div className="mt-2 h-4 w-1/4 rounded bg-[rgb(var(--c-surface)/0.1)]" />
            </div>
          ))}
        </div>
      ) : data?.data?.items?.length ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {data.data.items.map((p: any, i: number) => (
              <div key={p.id} className="group card-hover animate-slideUp flex flex-col" style={{ animationDelay: `${(i % 8) * 0.05}s` }}>
                <div className="relative rounded-2xl overflow-hidden bg-[rgb(var(--c-surface)/0.03)] border border-[rgb(var(--c-border)/0.05)] mb-4">
                  
                  {p.badge && (
                    <div className="absolute top-4 left-4 z-20">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full backdrop-blur-md border ${getBadgeColor(p.badge)}`}>
                        {p.badge}
                      </span>
                    </div>
                  )}

                  <Link to={`/products/${p.id}`} className="block aspect-[3/4] relative">
                    <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                    <img 
                      src={p.imageUrl} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                    />
                  </Link>

                  <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20 flex gap-2">
                    <button
                      onClick={() => setQuickViewId(p.id)}
                      className="flex-1 bg-white/90 backdrop-blur-md text-ink font-medium text-sm py-3 rounded-xl hover:bg-gold transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye size={16} /> Quick View
                    </button>
                    <button
                      onClick={(e) => handleAddToCart(e, p.id)}
                      className="w-12 h-12 bg-white/90 backdrop-blur-md text-ink rounded-xl hover:bg-gold transition-colors flex items-center justify-center shrink-0"
                      aria-label="Add to bag"
                    >
                      <ShoppingBag size={18} />
                    </button>
                  </div>

                  <WishlistButton 
                    productId={p.id} 
                    className="absolute top-4 right-4 z-20 bg-ink/50 backdrop-blur-md border border-white/10 hover:bg-gold hover:text-ink hover:border-gold transition-all" 
                  />
                </div>

                <div className="flex flex-col flex-1">
                  <Link to={`/products/${p.id}`} className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <Star size={12} className="fill-gold text-gold" />
                      <span className="text-xs text-[rgb(var(--c-text)/0.6)]">{Number(p.rating || 5).toFixed(1)}</span>
                    </div>
                    <h3 className="text-base font-medium group-hover:text-gold transition-colors line-clamp-2 leading-snug">
                      {p.name}
                    </h3>
                  </Link>
                  <div className="mt-3 flex items-end justify-between">
                    <p className="text-lg font-display text-gold">Rs. {Number(p.price).toLocaleString()}</p>
                    <p className="text-xs text-[rgb(var(--c-text)/0.4)] uppercase tracking-wider">{p.category?.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-16">
              <div className="inline-flex items-center gap-2 bg-[rgb(var(--c-surface)/0.03)] border border-[rgb(var(--c-border)/0.1)] rounded-full p-2">
                <button
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  className="px-5 py-2 text-sm font-medium rounded-full hover:bg-[rgb(var(--c-surface)/0.1)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= page - 1 && pageNum <= page + 1)) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                            page === pageNum ? 'bg-gold text-ink' : 'hover:bg-[rgb(var(--c-surface)/0.1)]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === page - 2 || pageNum === page + 2) {
                      return <span key={pageNum} className="text-[rgb(var(--c-text)/0.3)]">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                  className="px-5 py-2 text-sm font-medium rounded-full hover:bg-[rgb(var(--c-surface)/0.1)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-32 glass rounded-2xl border border-[rgb(var(--c-border)/0.1)]">
          <Search size={48} className="mx-auto text-[rgb(var(--c-text)/0.2)] mb-4" />
          <h3 className="text-2xl font-display mb-2">No items found</h3>
          <p className="text-[rgb(var(--c-text)/0.5)] max-w-md mx-auto">
            We couldn't find any products matching your current criteria. Try adjusting your search or filters.
          </p>
          <button
            onClick={() => { setParams(new URLSearchParams()); }}
            className="mt-6 px-6 py-3 rounded-full bg-gold text-ink font-medium hover:bg-gold-light transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {quickViewId !== null && (
        <QuickViewModal productId={quickViewId} onClose={() => setQuickViewId(null)} />
      )}
    </div>
  );
}

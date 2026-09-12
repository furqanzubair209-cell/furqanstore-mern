import { useSearchParams, Link } from "react-router-dom";
import { useState } from "react";
import { Eye } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { productApi } from "../api/product.api";
import { cartApi } from "../api/cart.api";
import WishlistButton from "../components/WishlistButton";
import QuickViewModal from "../components/QuickViewModal";

const PAGE_SIZE = 24;

export default function Products() {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const [quickViewId, setQuickViewId] = useState<number | null>(null);
  const category = params.get("category") || undefined;
  const sort = params.get("sort") || undefined;
  const search = params.get("search") || undefined;
  const page = Math.max(1, Number(params.get("page")) || 1);

  const { data, isLoading } = useQuery({
    queryKey: ["products", { category, sort, search, page }],
    queryFn: () => productApi.list({ category, sort, search, page, limit: PAGE_SIZE }),
  });

  const totalPages = data?.data?.totalPages || 1;

  const goToPage = (p: number) => {
    setParams((prev) => { prev.set("page", String(p)); return prev; });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-8">
        <input
          defaultValue={search}
          placeholder="Search products..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = (e.target as HTMLInputElement).value;
              setParams((p) => { v ? p.set("search", v) : p.delete("search"); p.delete("page"); return p; });
            }
          }}
          className="bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-full px-4 py-2 text-sm w-full md:w-80"
        />
        <select
          value={sort || ""}
          onChange={(e) => setParams((p) => { e.target.value ? p.set("sort", e.target.value) : p.delete("sort"); p.delete("page"); return p; })}
          className="bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-full px-4 py-2 text-sm"
        >
          <option value="">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square rounded-xl bg-[rgb(var(--c-surface)/0.05)] animate-pulse" />)}
        </div>
      ) : data?.data?.items?.length ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {data.data.items.map((p: any) => (
              <div key={p.id} className="group">
                <div className="relative">
                  <Link to={`/products/${p.id}`}>
                    <div className="aspect-square rounded-xl overflow-hidden bg-[rgb(var(--c-surface)/0.05)]">
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>
                  </Link>
                  <WishlistButton productId={p.id} className="absolute top-2 right-2" />
                  <button
                    onClick={() => setQuickViewId(p.id)}
                    aria-label={`Quick view ${p.name}`}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 sm:transition sm:duration-200 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[rgb(var(--c-bg)/0.9)] border border-[rgb(var(--c-border)/0.2)] whitespace-nowrap"
                  >
                    <Eye size={13} /> Quick view
                  </button>
                </div>
                <Link to={`/products/${p.id}`}>
                  <p className="mt-3 text-sm truncate">{p.name}</p>
                  <p className="text-gold text-sm">Rs. {Number(p.price).toLocaleString()}</p>
                </Link>
                <button
                  onClick={async () => { await cartApi.add(p.id, 1); qc.invalidateQueries({ queryKey: ["cart"] }); }}
                  className="mt-2 w-full text-xs border border-[rgb(var(--c-border)/0.2)] rounded-full py-1.5 hover:border-gold transition"
                >
                  Add to cart
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
              <button
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="px-4 py-2 text-sm rounded-full border border-[rgb(var(--c-border)/0.2)] disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-sm text-[rgb(var(--c-text)/0.5)] px-2">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
                className="px-4 py-2 text-sm rounded-full border border-[rgb(var(--c-border)/0.2)] disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-[rgb(var(--c-text)/0.5)] text-center py-20">No products found.</p>
      )}

      {quickViewId !== null && (
        <QuickViewModal productId={quickViewId} onClose={() => setQuickViewId(null)} />
      )}
    </div>
  );
}

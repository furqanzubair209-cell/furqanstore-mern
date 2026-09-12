import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { productApi } from "../api/product.api";
import { cartApi } from "../api/cart.api";
import WishlistButton from "./WishlistButton";

export default function QuickViewModal({ productId, onClose }: { productId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["product", productId], queryFn: () => productApi.detail(productId) });
  const product = data?.data;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const addToCart = async () => {
    if (!product) return;
    await cartApi.add(product.id, qty);
    qc.invalidateQueries({ queryKey: ["cart"] });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[rgb(var(--c-bg))] border border-[rgb(var(--c-border)/0.1)] rounded-2xl p-5 sm:p-8"
      >
        <button
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-4 right-4 p-1.5 rounded-full bg-[rgb(var(--c-surface)/0.08)] hover:bg-[rgb(var(--c-surface)/0.15)] transition z-10"
        >
          <X size={18} />
        </button>

        {isLoading || !product ? (
          <div className="py-24 text-center text-[rgb(var(--c-text)/0.5)] text-sm">Loading...</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="relative">
              <div className="aspect-square rounded-xl overflow-hidden bg-[rgb(var(--c-surface)/0.05)]">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <WishlistButton productId={product.id} className="absolute top-3 right-3" />
            </div>
            <div className="flex flex-col">
              <p className="text-xs text-gold uppercase tracking-widest">{product.category?.name}</p>
              <h2 className="font-display text-2xl mt-2">{product.name}</h2>
              <p className="text-[rgb(var(--c-text)/0.5)] text-sm mt-1">
                Sold by {product.vendor?.vendorName || product.vendor?.fullName}
              </p>
              <p className="text-xl text-gold mt-4">Rs. {Number(product.price).toLocaleString()}</p>
              <p className="text-[rgb(var(--c-text)/0.6)] text-sm mt-3 line-clamp-4">{product.description}</p>
              <p className="text-xs text-[rgb(var(--c-text)/0.4)] mt-3">
                {product.stock} in stock · {Number(product.rating)}★ ({product.reviews} reviews)
              </p>

              <div className="flex items-center gap-3 mt-auto pt-6">
                <div className="flex items-center justify-center border border-[rgb(var(--c-border)/0.2)] rounded-full shrink-0">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2">-</button>
                  <span className="px-2 text-sm">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="px-3 py-2">+</button>
                </div>
                <button
                  onClick={addToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-gold text-ink rounded-full py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  {added ? "Added ✓" : product.stock === 0 ? "Out of stock" : "Add to cart"}
                </button>
              </div>
              <Link to={`/products/${product.id}`} onClick={onClose} className="text-xs text-gold mt-4 inline-block">
                View full details →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Star, ShoppingBag } from "lucide-react";
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[rgb(var(--c-bg))] border border-[rgb(var(--c-border)/0.2)] rounded-2xl shadow-2xl animate-scaleIn"
      >
        <button
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-4 right-4 p-2 rounded-full bg-[rgb(var(--c-surface)/0.1)] hover:bg-gold hover:text-ink transition-colors z-10"
        >
          <X size={18} />
        </button>

        {isLoading || !product ? (
          <div className="py-32 flex flex-col items-center justify-center text-[rgb(var(--c-text)/0.5)]">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm">Loading product details...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative aspect-square md:aspect-auto md:h-full bg-[rgb(var(--c-surface)/0.03)] border-b md:border-b-0 md:border-r border-[rgb(var(--c-border)/0.1)]">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[rgb(var(--c-text)/0.2)]">
                  <ShoppingBag size={48} />
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-gold text-ink rounded-full">
                  {product.category?.name || "Premium"}
                </span>
              </div>
              <WishlistButton productId={product.id} className="absolute top-4 right-14 md:right-4 bg-[rgb(var(--c-bg))] shadow-md border-none" />
            </div>
            
            <div className="p-6 sm:p-8 flex flex-col">
              <div className="mb-6">
                <h2 className="font-display text-2xl sm:text-3xl leading-tight mb-2 pr-8">{product.name}</h2>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 text-gold">
                    <Star size={14} fill="currentColor" />
                    <span className="font-medium">{Number(product.rating).toFixed(1)}</span>
                  </div>
                  <span className="text-[rgb(var(--c-text)/0.3)]">|</span>
                  <span className="text-[rgb(var(--c-text)/0.6)] underline decoration-dashed underline-offset-4">{product.reviews} reviews</span>
                  <span className="text-[rgb(var(--c-text)/0.3)]">|</span>
                  <span className="text-[rgb(var(--c-text)/0.6)]">By <span className="text-[rgb(var(--c-text))]">{product.vendor?.vendorName || product.vendor?.fullName}</span></span>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-2xl sm:text-3xl font-display text-gold">Rs. {Number(product.price).toLocaleString()}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${product.stock > 0 ? "bg-emerald-500" : "bg-red-500"}`}></span>
                  <span className="text-xs text-[rgb(var(--c-text)/0.6)]">
                    {product.stock > 0 ? `${product.stock} units in stock` : "Currently out of stock"}
                  </span>
                </div>
              </div>
              
              <div className="mb-8">
                <p className="text-[rgb(var(--c-text)/0.7)] text-sm leading-relaxed line-clamp-4">
                  {product.description}
                </p>
              </div>

              <div className="mt-auto pt-4 border-t border-[rgb(var(--c-border)/0.1)]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-between border border-[rgb(var(--c-border)/0.2)] rounded-full shrink-0 w-28 h-12 bg-[rgb(var(--c-surface)/0.02)]">
                    <button 
                      onClick={() => setQty((q) => Math.max(1, q - 1))} 
                      className="w-10 h-full flex items-center justify-center text-lg hover:text-gold transition-colors"
                      disabled={product.stock === 0}
                    >-</button>
                    <span className="text-sm font-medium">{qty}</span>
                    <button 
                      onClick={() => setQty((q) => Math.min(product.stock, q + 1))} 
                      className="w-10 h-full flex items-center justify-center text-lg hover:text-gold transition-colors"
                      disabled={product.stock === 0}
                    >+</button>
                  </div>
                  <button
                    onClick={addToCart}
                    disabled={product.stock === 0}
                    className="flex-1 bg-gradient-to-r from-gold to-gold-light text-ink rounded-full h-12 text-sm font-medium hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {added ? (
                      <>Added to Cart ✓</>
                    ) : product.stock === 0 ? (
                      "Out of Stock"
                    ) : (
                      <>
                        <ShoppingBag size={16} />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-5 text-center">
                  <Link 
                    to={`/products/${product.id}`} 
                    onClick={onClose} 
                    className="text-xs text-[rgb(var(--c-text)/0.5)] hover:text-gold transition-colors uppercase tracking-widest inline-flex items-center gap-1"
                  >
                    View full details <span className="text-[10px]">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

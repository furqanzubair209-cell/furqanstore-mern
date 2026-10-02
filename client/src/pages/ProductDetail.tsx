import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { productApi } from "../api/product.api";
import { cartApi } from "../api/cart.api";
import WishlistButton from "../components/WishlistButton";
import { useToastStore } from "../store/toast.store";
import { ChevronRight, Star, Shield, Truck, RefreshCcw, Minus, Plus, ShoppingBag } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { addToast } = useToastStore();
  const [qty, setQty] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ["product", id], queryFn: () => productApi.detail(id!) });
  const product = data?.data;

  const handleAddToCart = async () => {
    try {
      await cartApi.add(product.id, qty);
      qc.invalidateQueries({ queryKey: ["cart"] });
      addToast(`Added ${qty} ${qty === 1 ? 'item' : 'items'} to your shopping bag`, "success");
    } catch (err) {
      addToast("Failed to add to cart", "error");
    }
  };

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-4 py-24 min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
        <p className="text-[rgb(var(--c-text)/0.5)] uppercase tracking-widest text-sm">Curating details...</p>
      </div>
    </div>
  );

  if (!product) return (
    <div className="max-w-3xl mx-auto px-4 py-32 text-center">
      <h2 className="font-display text-4xl mb-4">Item Not Found</h2>
      <p className="text-[rgb(var(--c-text)/0.6)] mb-8">The product you are looking for does not exist or has been removed.</p>
      <Link to="/products" className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-gold text-ink font-semibold hover:bg-gold-light transition-colors">
        Return to Collection
      </Link>
    </div>
  );

  const stockStatus = product.stock === 0 
    ? { label: "Out of Stock", color: "text-red-400 bg-red-400/10" }
    : product.stock < 10 
    ? { label: "Low Stock", color: "text-orange-400 bg-orange-400/10" }
    : { label: "In Stock", color: "text-emerald-400 bg-emerald-400/10" };

  return (
    <div className="animate-fadeIn pb-24">
      <div className="border-b border-[rgb(var(--c-border)/0.05)] bg-[rgb(var(--c-surface)/0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-2 text-xs text-[rgb(var(--c-text)/0.5)] uppercase tracking-wider">
          <Link to="/" className="hover:text-gold transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-gold transition-colors">Products</Link>
          <ChevronRight size={12} />
          {product.category && (
            <>
              <Link to={`/products?category=${product.category.slug}`} className="hover:text-gold transition-colors">
                {product.category.name}
              </Link>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-[rgb(var(--c-text)/0.9)] truncate max-w-[200px] sm:max-w-md">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid lg:grid-cols-2 gap-12 lg:gap-20">
        <div className="relative group">
          <div className="sticky top-24 aspect-[4/5] rounded-2xl overflow-hidden bg-[rgb(var(--c-surface)/0.03)] border border-[rgb(var(--c-border)/0.05)]">
            <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--c-surface)/0.05)] -z-10 animate-pulse" />
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover transform origin-center transition-transform duration-700 ease-out group-hover:scale-[1.03] cursor-zoom-in" 
            />
            <WishlistButton 
              productId={product.id} 
              className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center bg-ink/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-gold hover:text-ink hover:border-gold transition-all" 
            />
            {product.badge && (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-ink/90 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full backdrop-blur-md border border-white/20">
                  {product.badge}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col pt-4 lg:pt-8">
          <div className="mb-8 border-b border-[rgb(var(--c-border)/0.1)] pb-8">
            <div className="flex items-center justify-between mb-4">
              <Link to={`/products?category=${product.category?.slug}`} className="text-xs font-semibold text-gold uppercase tracking-widest hover:text-gold-light transition-colors">
                {product.category?.name || "Curated"}
              </Link>
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${stockStatus.color}`}>
                {stockStatus.label}
              </span>
            </div>
            
            <h1 className="font-display text-4xl lg:text-5xl leading-tight mb-4">{product.name}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.round(Number(product.rating || 5)) ? "fill-gold text-gold" : "text-[rgb(var(--c-text)/0.2)]"}
                  />
                ))}
                <span className="ml-2 text-[rgb(var(--c-text)/0.8)] font-medium">{Number(product.rating || 5).toFixed(1)}</span>
                <span className="text-[rgb(var(--c-text)/0.4)] ml-1">({product.reviews || 0} Reviews)</span>
              </div>
              <span className="text-[rgb(var(--c-text)/0.2)]">|</span>
              <span className="text-[rgb(var(--c-text)/0.6)] flex items-center gap-1.5">
                <Shield size={14} className="text-gold" />
                Vendor: <span className="text-[rgb(var(--c-text)/0.9)] font-medium">{product.vendor?.vendorName || product.vendor?.fullName || "Premium Partner"}</span>
              </span>
            </div>

            <p className="text-3xl font-display text-gold mt-8">Rs. {Number(product.price).toLocaleString()}</p>
          </div>

          <div className="prose prose-invert prose-p:text-[rgb(var(--c-text)/0.7)] prose-p:leading-relaxed max-w-none mb-10">
            <p>{product.description}</p>
          </div>

          <div className="mt-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center justify-between sm:justify-center border border-[rgb(var(--c-border)/0.2)] rounded-full bg-[rgb(var(--c-surface)/0.03)] px-2 h-14 sm:w-40">
                <button 
                  onClick={() => setQty((q) => Math.max(1, q - 1))} 
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[rgb(var(--c-surface)/0.1)] text-[rgb(var(--c-text)/0.6)] hover:text-white transition-colors"
                  disabled={qty <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 text-lg font-medium w-12 text-center">{qty}</span>
                <button 
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))} 
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[rgb(var(--c-surface)/0.1)] text-[rgb(var(--c-text)/0.6)] hover:text-white transition-colors"
                  disabled={qty >= product.stock}
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 h-14 bg-gold text-ink rounded-full font-semibold text-lg hover:bg-gold-light transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(201,164,92,0.2)] hover:shadow-[0_0_30px_rgba(201,164,92,0.4)]"
              >
                <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                {product.stock === 0 ? "Out of Stock" : "Add to Bag"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 pt-8 border-t border-[rgb(var(--c-border)/0.1)]">
            <div className="flex items-start gap-3 text-sm text-[rgb(var(--c-text)/0.6)] p-4 rounded-xl bg-[rgb(var(--c-surface)/0.02)] border border-[rgb(var(--c-border)/0.05)]">
              <Truck size={20} className="text-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-[rgb(var(--c-text)/0.9)] font-medium mb-1">Premium Shipping</p>
                <p>Carefully packaged and delivered securely to your door.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm text-[rgb(var(--c-text)/0.6)] p-4 rounded-xl bg-[rgb(var(--c-surface)/0.02)] border border-[rgb(var(--c-border)/0.05)]">
              <RefreshCcw size={20} className="text-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-[rgb(var(--c-text)/0.9)] font-medium mb-1">Easy Returns</p>
                <p>14-day return policy for items in original condition.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

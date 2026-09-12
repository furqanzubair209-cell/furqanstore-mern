import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { productApi } from "../api/product.api";
import { cartApi } from "../api/cart.api";
import WishlistButton from "../components/WishlistButton";

export default function ProductDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ["product", id], queryFn: () => productApi.detail(id!) });
  const product = data?.data;

  if (isLoading) return <div className="max-w-5xl mx-auto px-4 py-20 text-center text-[rgb(var(--c-text)/0.5)]">Loading...</div>;
  if (!product) return <div className="max-w-5xl mx-auto px-4 py-20 text-center text-[rgb(var(--c-text)/0.5)]">Product not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-2 gap-12">
      <div className="relative">
        <div className="aspect-square rounded-xl overflow-hidden bg-[rgb(var(--c-surface)/0.05)]">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <WishlistButton productId={product.id} className="absolute top-3 right-3" />
      </div>
      <div>
        <p className="text-xs text-gold uppercase tracking-widest">{product.category?.name}</p>
        <h1 className="font-display text-3xl mt-2">{product.name}</h1>
        <p className="text-[rgb(var(--c-text)/0.5)] text-sm mt-1">Sold by {product.vendor?.vendorName || product.vendor?.fullName}</p>
        <p className="text-2xl text-gold mt-6">Rs. {Number(product.price).toLocaleString()}</p>
        <p className="text-[rgb(var(--c-text)/0.6)] text-sm mt-4">{product.description}</p>
        <p className="text-xs text-[rgb(var(--c-text)/0.4)] mt-4">{product.stock} in stock · {Number(product.rating)}★ ({product.reviews} reviews)</p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-8">
          <div className="flex items-center justify-center border border-[rgb(var(--c-border)/0.2)] rounded-full shrink-0">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2">-</button>
            <span className="px-2 text-sm">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="px-3 py-2">+</button>
          </div>
          <button
            onClick={async () => { await cartApi.add(product.id, qty); qc.invalidateQueries({ queryKey: ["cart"] }); }}
            className="flex-1 bg-gold text-ink rounded-full py-3 font-medium hover:opacity-90 transition"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}

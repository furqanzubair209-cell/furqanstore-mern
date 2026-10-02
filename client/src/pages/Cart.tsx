import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight } from "lucide-react";
import { cartApi } from "../api/cart.api";

export default function Cart() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["cart"], queryFn: cartApi.get });
  const items = data?.data || [];
  const total = items.reduce((s: number, i: any) => s + Number(i.product.price) * i.quantity, 0);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cart"] });

  if (isLoading) return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-[rgb(var(--c-text)/0.5)]">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 animate-fadeIn">
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-2xl sm:text-3xl">Your Cart</h1>
        <Link to="/products" className="text-sm text-[rgb(var(--c-text)/0.5)] hover:text-gold transition">
          Continue Shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 rounded-full bg-[rgb(var(--c-surface)/0.05)] flex items-center justify-center mb-6">
            <ShoppingBag size={48} className="text-[rgb(var(--c-text)/0.2)]" />
          </div>
          <h2 className="font-display text-2xl mb-3">Your cart is empty</h2>
          <p className="text-[rgb(var(--c-text)/0.5)] mb-8 max-w-md text-center">
            Looks like you haven't added any items to your cart yet. Discover our premium collection.
          </p>
          <Link to="/products" className="bg-gradient-to-r from-gold to-gold-light text-ink px-8 py-3 rounded-full font-medium hover:shadow-lg hover:shadow-gold/20 transition-all">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {items.map((item: any) => (
              <div key={item.id} className="glass card-hover flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-[rgb(var(--c-border)/0.1)]">
                <img src={item.product.imageUrl} alt={item.product.name} className="w-24 h-24 shrink-0 rounded-lg object-cover bg-[rgb(var(--c-surface)/0.1)]" />
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-lg mb-1 break-words">{item.product.name}</h3>
                  <p className="text-[rgb(var(--c-text)/0.5)] text-sm mb-2">{item.product.store?.vendorName || "Premium Store"}</p>
                  <p className="text-gold font-medium">Rs. {Number(item.product.price).toLocaleString()}</p>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-8 mt-2 sm:mt-0">
                  <div className="flex items-center bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-full">
                    <button onClick={async () => { await cartApi.update(item.id, item.quantity - 1); invalidate(); }} aria-label="Decrease quantity" className="p-2.5 text-[rgb(var(--c-text)/0.6)] hover:text-gold transition">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={async () => { await cartApi.update(item.id, item.quantity + 1); invalidate(); }} aria-label="Increase quantity" className="p-2.5 text-[rgb(var(--c-text)/0.6)] hover:text-gold transition">
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  <div className="text-right hidden sm:block w-24">
                    <p className="text-sm text-[rgb(var(--c-text)/0.5)]">Subtotal</p>
                    <p className="font-medium">Rs. {(Number(item.product.price) * item.quantity).toLocaleString()}</p>
                  </div>

                  <button onClick={async () => { await cartApi.remove(item.id); invalidate(); }} aria-label="Remove item" className="p-2.5 text-[rgb(var(--c-text)/0.4)] hover:text-red-400 transition-colors bg-red-400/5 rounded-full">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full lg:w-80 shrink-0">
            <div className="glass border border-[rgb(var(--c-border)/0.1)] rounded-xl p-6 lg:sticky lg:top-24">
              <h2 className="font-display text-xl mb-6">Order Summary</h2>
              
              <div className="space-y-4 text-sm mb-6 border-b border-[rgb(var(--c-border)/0.1)] pb-6">
                <div className="flex justify-between">
                  <span className="text-[rgb(var(--c-text)/0.6)]">Subtotal ({items.length} items)</span>
                  <span>Rs. {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[rgb(var(--c-text)/0.6)]">Shipping</span>
                  <span className="text-emerald-400">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[rgb(var(--c-text)/0.6)]">Taxes</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              
              <div className="flex justify-between items-end mb-8">
                <span className="text-base font-medium">Total</span>
                <span className="text-2xl font-display text-gold">Rs. {total.toLocaleString()}</span>
              </div>
              
              <button onClick={() => navigate("/checkout")} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold-light text-ink py-4 rounded-full font-medium hover:shadow-lg hover:shadow-gold/20 transition-all">
                Proceed to Checkout <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

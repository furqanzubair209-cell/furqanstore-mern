import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "../api/cart.api";

export default function Cart() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["cart"], queryFn: cartApi.get });
  const items = data?.data || [];
  const total = items.reduce((s: number, i: any) => s + Number(i.product.price) * i.quantity, 0);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cart"] });

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-[rgb(var(--c-text)/0.5)]">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl mb-8">Your cart</h1>
      {items.length === 0 ? (
        <div className="text-center py-20 text-[rgb(var(--c-text)/0.5)]">
          Your cart is empty. <Link to="/products" className="text-gold">Continue shopping →</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item: any) => (
              <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-4 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4">
                <img src={item.product.imageUrl} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm">{item.product.name}</p>
                  <p className="text-gold text-sm">Rs. {Number(item.product.price).toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                  <div className="flex items-center border border-[rgb(var(--c-border)/0.2)] rounded-full">
                    <button onClick={async () => { await cartApi.update(item.id, item.quantity - 1); invalidate(); }} className="px-3 py-1">-</button>
                    <span className="px-2 text-sm">{item.quantity}</span>
                    <button onClick={async () => { await cartApi.update(item.id, item.quantity + 1); invalidate(); }} className="px-3 py-1">+</button>
                  </div>
                  <button onClick={async () => { await cartApi.remove(item.id); invalidate(); }} className="text-xs text-[rgb(var(--c-text)/0.4)] hover:text-red-400">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 border-t border-[rgb(var(--c-border)/0.1)] pt-6">
            <p className="text-lg">Total: <span className="text-gold">Rs. {total.toLocaleString()}</span></p>
            <Link to="/checkout" className="text-center bg-gold text-ink px-6 py-3 rounded-full font-medium hover:opacity-90 transition">
              Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

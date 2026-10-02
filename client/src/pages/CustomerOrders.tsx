import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { orderApi } from "../api/order.api";

export default function CustomerOrders() {
  const { data, isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: orderApi.mine });
  const orders = data?.data || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl">Your orders</h1>
        <div className="flex gap-4 text-sm">
          <Link to="/wishlist" className="text-gold hover:underline">Wishlist</Link>
          <Link to="/account/addresses" className="text-gold hover:underline">Addresses</Link>
        </div>
      </div>
      {isLoading ? <p className="text-[rgb(var(--c-text)/0.5)]">Loading...</p> : orders.length === 0 ? (
        <p className="text-[rgb(var(--c-text)/0.5)]">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o: any) => (
            <div key={o.id} className="border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p>Order #{o.id}</p>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-xs border border-[rgb(var(--c-border)/0.2)]">{o.status}</span>
              </div>
              <p className="text-gold mt-2">Rs. {Number(o.total).toLocaleString()}</p>
              <p className="text-xs text-[rgb(var(--c-text)/0.4)] mt-1">{o.items.length} item(s) · {new Date(o.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

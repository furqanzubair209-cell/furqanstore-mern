import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cartApi } from "../api/cart.api";
import { orderApi } from "../api/order.api";
import { addressApi } from "../api/account.api";

export default function Checkout() {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["cart"], queryFn: cartApi.get });
  const items = data?.data || [];
  const total = items.reduce((s: number, i: any) => s + Number(i.product.price) * i.quantity, 0);

  const { data: addressData } = useQuery({ queryKey: ["addresses"], queryFn: addressApi.list });
  const savedAddresses = addressData?.data || [];

  const [address, setAddress] = useState("");

  useEffect(() => {
    const def = savedAddresses.find((a: any) => a.isDefault) || savedAddresses[0];
    if (def && !address) setAddress(`${def.line1}, ${def.city}`);
  }, [savedAddresses]);
  const [payment, setPayment] = useState<"COD" | "CARD">("COD");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!address.trim()) return setError("Please enter a shipping address");
    setLoading(true);
    try {
      const res = await orderApi.place({ shippingAddress: address, paymentMethod: payment });
      navigate(`/account/orders/${res.data.id}`, { state: { placed: true } });
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl mb-8">Checkout</h1>

      {savedAddresses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {savedAddresses.map((a: any) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAddress(`${a.line1}, ${a.city}`)}
              className="text-xs px-3 py-1.5 rounded-full border border-[rgb(var(--c-border)/0.2)] hover:border-gold transition"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
      <label className="text-sm text-[rgb(var(--c-text)/0.6)]">Shipping address</label>
      <textarea
        value={address} onChange={(e) => setAddress(e.target.value)}
        className="w-full mt-2 bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" rows={3}
      />
      <Link to="/account/addresses" className="text-xs text-gold mt-2 inline-block">Manage saved addresses →</Link>
      <label className="text-sm text-[rgb(var(--c-text)/0.6)] mt-6 block">Payment method</label>
      <div className="flex gap-4 mt-2">
        {(["COD", "CARD"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setPayment(m)}
            className={`px-4 py-2 rounded-full text-sm border ${payment === m ? "border-gold text-gold" : "border-[rgb(var(--c-border)/0.2)]"}`}
          >
            {m === "COD" ? "Cash on delivery" : "Card"}
          </button>
        ))}
      </div>

      <div className="mt-8 border-t border-[rgb(var(--c-border)/0.1)] pt-6 flex justify-between">
        <p>Total</p>
        <p className="text-gold">Rs. {total.toLocaleString()}</p>
      </div>

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

      <button
        onClick={submit} disabled={loading || items.length === 0}
        className="w-full mt-8 bg-gold text-ink py-3 rounded-full font-medium disabled:opacity-50"
      >
        {loading ? "Placing order..." : "Place order"}
      </button>
    </div>
  );
}

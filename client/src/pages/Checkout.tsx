import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Banknote, MapPin, CheckCircle, ChevronRight } from "lucide-react";
import { cartApi } from "../api/cart.api";
import { orderApi } from "../api/order.api";
import { addressApi } from "../api/account.api";
import { paymentApi } from "../api/payment.api";

const steps = ["Shipping", "Payment", "Review"];

export default function Checkout() {
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["cart"], queryFn: cartApi.get });
  const items = data?.data || [];
  const total = items.reduce((s: number, i: any) => s + Number(i.product.price) * i.quantity, 0);

  const { data: addressData } = useQuery({ queryKey: ["addresses"], queryFn: addressApi.list });
  const savedAddresses = addressData?.data || [];

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<"COD" | "CARD">("COD");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const def = savedAddresses.find((a: any) => a.isDefault) || savedAddresses[0];
    if (def && !address) setAddress(`${def.line1}, ${def.city}`);
  }, [savedAddresses]);

  const nextStep = () => {
    setError("");
    if (step === 0 && !address.trim()) return setError("Please enter a shipping address");
    setStep(Math.min(step + 1, 2));
  };

  const prevStep = () => setStep(Math.max(step - 1, 0));

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (payment === "CARD") {
        const res = await paymentApi.createCheckoutSession({ shippingAddress: address });
        window.location.href = res.data.url;
      } else {
        const res = await orderApi.place({ shippingAddress: address, paymentMethod: payment });
        navigate(`/account/orders/${res.data.id}`, { state: { placed: true } });
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not place order");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fadeIn">
      <div className="max-w-3xl mx-auto mb-8 sm:mb-12">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-[rgb(var(--c-border)/0.1)] -z-10" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gold transition-all duration-500 -z-10" style={{ width: `${(step / 2) * 100}%` }} />
          
          {steps.map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-2 bg-[rgb(var(--c-bg))] px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                i < step ? "bg-gold text-ink" : i === step ? "border-2 border-gold text-gold" : "bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] text-[rgb(var(--c-text)/0.4)]"
              }`}>
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className={`text-xs uppercase tracking-wider ${i <= step ? "text-gold" : "text-[rgb(var(--c-text)/0.4)]"}`}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="flex-1">
          {error && (
            <div className="mb-6 flex items-center gap-2 text-red-400 text-sm bg-red-400/5 border border-red-400/10 rounded-xl px-4 py-3">
              <span>{error}</span>
            </div>
          )}

          {step === 0 && (
            <div className="glass border border-[rgb(var(--c-border)/0.1)] rounded-2xl p-6 sm:p-8 animate-slideUp">
              <h2 className="font-display text-2xl mb-6">Shipping Information</h2>
              
              {savedAddresses.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-[rgb(var(--c-text)/0.6)] mb-3">Saved Addresses</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((a: any) => (
                      <div
                        key={a.id}
                        onClick={() => setAddress(`${a.line1}, ${a.city}`)}
                        className={`cursor-pointer p-4 rounded-xl border transition-all ${address.includes(a.line1) ? "border-gold bg-gold/5" : "border-[rgb(var(--c-border)/0.1)] bg-[rgb(var(--c-surface)/0.05)] hover:border-gold/30"}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin size={14} className={address.includes(a.line1) ? "text-gold" : "text-[rgb(var(--c-text)/0.4)]"} />
                          <span className="text-sm font-medium">{a.label}</span>
                        </div>
                        <p className="text-xs text-[rgb(var(--c-text)/0.6)] truncate">{a.line1}, {a.city}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm text-[rgb(var(--c-text)/0.6)] flex justify-between">
                  <span>Delivery Address</span>
                  <Link to="/account/addresses" className="text-gold hover:underline">Manage addresses</Link>
                </label>
                <textarea
                  value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter full shipping address..."
                  className="w-full mt-2 bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] focus:border-gold/50 rounded-xl p-4 text-sm transition-all" rows={4}
                />
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={nextStep} className="flex items-center justify-center gap-2 bg-gold text-ink px-6 sm:px-8 py-3 rounded-full font-medium hover:opacity-90 transition">
                  Continue to Payment <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="glass border border-[rgb(var(--c-border)/0.1)] rounded-2xl p-6 sm:p-8 animate-slideUp">
              <h2 className="font-display text-2xl mb-6">Payment Method</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div onClick={() => setPayment("CARD")} className={`cursor-pointer p-6 rounded-xl border transition-all ${payment === "CARD" ? "border-gold bg-gold/5 shadow-[0_0_15px_rgba(201,164,92,0.1)]" : "border-[rgb(var(--c-border)/0.1)] bg-[rgb(var(--c-surface)/0.05)] hover:border-gold/30"}`}>
                  <CreditCard size={24} className={payment === "CARD" ? "text-gold mb-3" : "text-[rgb(var(--c-text)/0.4)] mb-3"} />
                  <h3 className="font-medium mb-1">Credit / Debit Card</h3>
                  <p className="text-xs text-[rgb(var(--c-text)/0.5)]">Secure payment via Stripe</p>
                </div>
                
                <div onClick={() => setPayment("COD")} className={`cursor-pointer p-6 rounded-xl border transition-all ${payment === "COD" ? "border-gold bg-gold/5 shadow-[0_0_15px_rgba(201,164,92,0.1)]" : "border-[rgb(var(--c-border)/0.1)] bg-[rgb(var(--c-surface)/0.05)] hover:border-gold/30"}`}>
                  <Banknote size={24} className={payment === "COD" ? "text-gold mb-3" : "text-[rgb(var(--c-text)/0.4)] mb-3"} />
                  <h3 className="font-medium mb-1">Cash on Delivery</h3>
                  <p className="text-xs text-[rgb(var(--c-text)/0.5)]">Pay when you receive</p>
                </div>
              </div>

              {payment === "CARD" && (
                <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 mt-0.5"><CreditCard size={16} /></div>
                  <div>
                    <p className="text-sm font-medium text-indigo-300">Secure Stripe Checkout</p>
                    <p className="text-xs text-[rgb(var(--c-text)/0.6)] mt-1">You will be redirected to Stripe's secure checkout page to complete your payment.</p>
                  </div>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between">
                <button onClick={prevStep} className="text-sm text-[rgb(var(--c-text)/0.6)] hover:text-gold transition px-2 py-3">
                  Back
                </button>
                <button onClick={nextStep} className="flex items-center justify-center gap-2 bg-gold text-ink px-6 sm:px-8 py-3 rounded-full font-medium hover:opacity-90 transition">
                  Review Order <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="glass border border-[rgb(var(--c-border)/0.1)] rounded-2xl p-6 sm:p-8 animate-slideUp">
              <h2 className="font-display text-2xl mb-6">Review Your Order</h2>
              
              <div className="space-y-6">
                <div className="p-5 bg-[rgb(var(--c-surface)/0.05)] rounded-xl border border-[rgb(var(--c-border)/0.05)] flex justify-between items-center gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-[rgb(var(--c-text)/0.5)] uppercase tracking-wider mb-1">Shipping To</p>
                    <p className="text-sm break-words">{address}</p>
                  </div>
                  <button onClick={() => setStep(0)} className="text-xs text-gold hover:underline">Edit</button>
                </div>
                
                <div className="p-5 bg-[rgb(var(--c-surface)/0.05)] rounded-xl border border-[rgb(var(--c-border)/0.05)] flex justify-between items-center">
                  <div>
                    <p className="text-xs text-[rgb(var(--c-text)/0.5)] uppercase tracking-wider mb-1">Payment Method</p>
                    <p className="text-sm flex items-center gap-2">
                      {payment === "CARD" ? <><CreditCard size={14} className="text-indigo-400" /> Card via Stripe</> : <><Banknote size={14} className="text-emerald-400" /> Cash on Delivery</>}
                    </p>
                  </div>
                  <button onClick={() => setStep(1)} className="text-xs text-gold hover:underline">Edit</button>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[rgb(var(--c-border)/0.1)] flex items-center justify-between">
                <button onClick={prevStep} className="text-sm text-[rgb(var(--c-text)/0.6)] hover:text-gold transition px-2 py-3">
                  Back
                </button>
                <button
                  onClick={submit} disabled={loading || items.length === 0}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold-light text-ink px-6 sm:px-8 py-3 rounded-full font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-gold/20 transition-all"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" /> Processing...</>
                  ) : payment === "CARD" ? "Pay with Stripe" : "Place Order"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[360px] shrink-0">
          <div className="glass border border-[rgb(var(--c-border)/0.1)] rounded-2xl p-6 lg:sticky lg:top-24">
            <h3 className="font-display text-xl mb-4">Order Summary</h3>
            
            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item: any) => (
                <div key={item.id} className="flex gap-3">
                  <div className="relative">
                    <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 rounded-lg object-cover bg-[rgb(var(--c-surface)/0.1)]" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-[rgb(var(--c-surface))] border border-[rgb(var(--c-border)/0.2)] rounded-full flex items-center justify-center text-[10px]">{item.quantity}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-gold text-sm mt-1">Rs. {(Number(item.product.price) * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-sm pt-4 border-t border-[rgb(var(--c-border)/0.1)] mb-4">
              <div className="flex justify-between text-[rgb(var(--c-text)/0.7)]">
                <span>Subtotal</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[rgb(var(--c-text)/0.7)]">
                <span>Shipping</span>
                <span className="text-emerald-400">Free</span>
              </div>
            </div>

            <div className="flex justify-between items-end pt-4 border-t border-[rgb(var(--c-border)/0.1)]">
              <span className="font-medium">Total</span>
              <span className="text-xl font-display text-gold">Rs. {total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

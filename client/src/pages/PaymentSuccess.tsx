import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { paymentApi } from "../api/payment.api";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const sessionId = params.get("session_id");
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      paymentApi.verifySession(sessionId)
        .then((res) => {
          setSession(res.data);
          qc.invalidateQueries({ queryKey: ["cart"] });
          qc.invalidateQueries({ queryKey: ["my-orders"] });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sessionId, qc]);

  const paid = session?.status === "paid";
  const failed = !loading && !paid;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto mb-6 animate-scaleIn">
          <CheckCircle size={40} className="text-emerald-400" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl mb-3">{failed ? "Payment Not Confirmed" : "Payment Successful"}</h1>
        <p className="text-[rgb(var(--c-text)/0.5)] mb-8">
          {loading ? "Verifying your payment..." : failed ? "We could not confirm this payment. If you were charged, please contact support." : "Your order has been placed and is being processed. You'll receive a confirmation shortly."}
        </p>

        {session && (
          <div className="border border-[rgb(var(--c-border)/0.1)] rounded-xl p-6 mb-8 text-left">
            <p className="text-xs text-[rgb(var(--c-text)/0.4)] uppercase tracking-wider mb-3">Payment Details</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[rgb(var(--c-text)/0.5)]">Status</span>
                <span className="text-emerald-400 font-medium capitalize">{session.status}</span>
              </div>
              {session.amountTotal && (
                <div className="flex justify-between">
                  <span className="text-[rgb(var(--c-text)/0.5)]">Amount</span>
                  <span className="text-gold font-medium">Rs. {(session.amountTotal / 100).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/account" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold-light text-ink px-6 py-3 rounded-full font-medium hover:shadow-lg hover:shadow-gold/20 transition-all">
            <ShoppingBag size={16} /> View Orders
          </Link>
          <Link to="/products" className="inline-flex items-center justify-center gap-2 border border-[rgb(var(--c-border)/0.2)] px-6 py-3 rounded-full text-sm hover:border-gold transition">
            Continue Shopping <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

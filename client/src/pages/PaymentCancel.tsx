import { Link } from "react-router-dom";
import { XCircle, ShoppingCart, ArrowRight } from "lucide-react";

export default function PaymentCancel() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-6 animate-scaleIn">
          <XCircle size={40} className="text-red-400" />
        </div>
        <h1 className="font-display text-3xl mb-3">Payment Cancelled</h1>
        <p className="text-[rgb(var(--c-text)/0.5)] mb-8">
          Your payment was not completed. Don't worry — your cart items are still saved and no charges were made.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/checkout" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold-light text-ink px-6 py-3 rounded-full font-medium hover:shadow-lg hover:shadow-gold/20 transition-all">
            <ShoppingCart size={16} /> Try Again
          </Link>
          <Link to="/products" className="inline-flex items-center justify-center gap-2 border border-[rgb(var(--c-border)/0.2)] px-6 py-3 rounded-full text-sm hover:border-gold transition">
            Continue Shopping <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

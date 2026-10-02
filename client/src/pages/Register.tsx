import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Phone, Lock, ShieldCheck, ShoppingBag, Star, Eye, EyeOff } from "lucide-react";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";

export default function Register() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", role: "CUSTOMER", vendorName: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setNotice(""); setLoading(true);
    try {
      const res = await authApi.register(form);
      if (form.role === "VENDOR") {
        setNotice(res.message);
      } else {
        setSession(res.data.accessToken, res.data.user);
        navigate("/");
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  const getPasswordStrength = () => {
    const len = form.password.length;
    if (len === 0) return 0;
    if (len < 6) return 1;
    if (len < 10) return 2;
    return 3;
  };
  const strength = getPasswordStrength();
  
  return (
    <div className="min-h-[calc(100vh-80px)] flex">
      <div className="hidden md:flex md:w-1/2 lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-ink via-[#131318] to-ink items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gold/5 animate-float" />
          <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full bg-gold/3 animate-float stagger-2" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-gold/5 animate-float stagger-4" />
        </div>
        <div className="relative z-10 text-center">
          <p className="font-display text-gold text-4xl mb-4">FurqanStore</p>
          <p className="text-[rgb(255_255_255/0.5)] text-sm max-w-xs mx-auto leading-relaxed">
            Your premium multi-vendor marketplace for curated goods from artisans who care about craft.
          </p>
          <div className="flex justify-center gap-8 mt-10">
            <div className="text-center">
              <ShieldCheck className="mx-auto text-gold/60 mb-2" size={22} />
              <p className="text-[10px] text-[rgb(255_255_255/0.4)] uppercase tracking-wider">Secure</p>
            </div>
            <div className="text-center">
              <ShoppingBag className="mx-auto text-gold/60 mb-2" size={22} />
              <p className="text-[10px] text-[rgb(255_255_255/0.4)] uppercase tracking-wider">10k+ Items</p>
            </div>
            <div className="text-center">
              <Star className="mx-auto text-gold/60 mb-2" size={22} />
              <p className="text-[10px] text-[rgb(255_255_255/0.4)] uppercase tracking-wider">Top Rated</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-sm animate-fadeIn py-8">
          <h1 className="font-display text-3xl mb-2">Create account</h1>
          <p className="text-sm text-[rgb(var(--c-text)/0.5)] mb-8">Join our premium marketplace</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(["CUSTOMER", "VENDOR"] as const).map((r) => (
                <div key={r} onClick={() => update("role", r)}
                  className={`cursor-pointer p-4 rounded-xl text-center transition-all ${form.role === r ? "bg-gold/10 border-gold shadow-[0_0_15px_rgba(201,164,92,0.15)]" : "bg-[rgb(var(--c-surface)/0.05)] border-[rgb(var(--c-border)/0.1)] hover:border-gold/30"} border`}>
                  <p className={`font-medium ${form.role === r ? "text-gold" : "text-[rgb(var(--c-text)/0.7)]"}`}>
                    {r === "CUSTOMER" ? "I want to shop" : "I want to sell"}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--c-text)/0.3)]" />
              <input required placeholder="Full name" value={form.fullName} onChange={(e) => update("fullName", e.target.value)}
                className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl pl-10 pr-4 py-3 text-sm transition-all" />
            </div>

            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--c-text)/0.3)]" />
              <input type="email" required placeholder="Email address" value={form.email} onChange={(e) => update("email", e.target.value)}
                className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl pl-10 pr-4 py-3 text-sm transition-all" />
            </div>

            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--c-text)/0.3)]" />
              <input required placeholder="Phone number" value={form.phone} onChange={(e) => update("phone", e.target.value)}
                className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl pl-10 pr-4 py-3 text-sm transition-all" />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--c-text)/0.3)]" />
              <input type={showPassword ? "text" : "password"} required placeholder="Password" value={form.password} onChange={(e) => update("password", e.target.value)}
                className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl pl-10 pr-10 py-3 text-sm transition-all" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--c-text)/0.3)] hover:text-[rgb(var(--c-text)/0.6)]">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {form.password.length > 0 && (
              <div className="flex items-center gap-1 mt-1 px-1">
                <div className={`h-1 flex-1 rounded-full ${strength >= 1 ? (strength >= 2 ? (strength >= 3 ? 'bg-emerald-400' : 'bg-gold') : 'bg-red-400') : 'bg-[rgb(var(--c-surface)/0.1)]'}`} />
                <div className={`h-1 flex-1 rounded-full ${strength >= 2 ? (strength >= 3 ? 'bg-emerald-400' : 'bg-gold') : 'bg-[rgb(var(--c-surface)/0.1)]'}`} />
                <div className={`h-1 flex-1 rounded-full ${strength >= 3 ? 'bg-emerald-400' : 'bg-[rgb(var(--c-surface)/0.1)]'}`} />
              </div>
            )}

            {form.role === "VENDOR" && (
              <div className="relative animate-slideUp">
                <ShoppingBag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--c-text)/0.3)]" />
                <input required placeholder="Store name" value={form.vendorName} onChange={(e) => update("vendorName", e.target.value)}
                  className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl pl-10 pr-4 py-3 text-sm transition-all" />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/5 border border-red-400/10 rounded-xl px-4 py-2.5">
                <span>{error}</span>
              </div>
            )}
            
            {notice && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/5 border border-emerald-400/10 rounded-xl px-4 py-2.5">
                <span>{notice}</span>
              </div>
            )}

            <button disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-gold to-gold-light text-ink py-3 rounded-full font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-gold/20 transition-all">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-[rgb(var(--c-text)/0.5)] mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-gold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

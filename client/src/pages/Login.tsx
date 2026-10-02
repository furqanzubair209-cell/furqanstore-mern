import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ShoppingBag, Star } from "lucide-react";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setSession(res.data.accessToken, res.data.user);
      const role = res.data.user.role;
      navigate(role === "VENDOR" ? "/vendor" : role === "CUSTOMER" ? "/" : "/admin");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Login failed");
    } finally { setLoading(false); }
  };

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

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fadeIn">
          <h1 className="font-display text-3xl mb-2">Welcome back</h1>
          <p className="text-sm text-[rgb(var(--c-text)/0.5)] mb-8">Sign in to your account to continue</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--c-text)/0.3)]" />
              <input
                type="email" required placeholder="Email address" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl pl-10 pr-4 py-3 text-sm transition-all"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--c-text)/0.3)]" />
              <input
                type={showPassword ? "text" : "password"} required placeholder="Password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl pl-10 pr-10 py-3 text-sm transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--c-text)/0.3)] hover:text-[rgb(var(--c-text)/0.6)]">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/5 border border-red-400/10 rounded-xl px-4 py-2.5">
                <span>{error}</span>
              </div>
            )}

            <button disabled={loading}
              className="w-full bg-gradient-to-r from-gold to-gold-light text-ink py-3 rounded-full font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-gold/20 transition-all">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-[rgb(var(--c-text)/0.5)] mt-8">
            Don't have an account?{" "}
            <Link to="/register" className="text-gold hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

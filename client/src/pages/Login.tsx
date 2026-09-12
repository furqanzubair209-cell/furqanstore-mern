import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="max-w-sm mx-auto px-4 py-20">
      <h1 className="font-display text-3xl mb-8 text-center">Welcome back</h1>
      <form onSubmit={submit} className="space-y-4">
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
        <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button disabled={loading} className="w-full bg-gold text-ink py-3 rounded-full font-medium disabled:opacity-50">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm text-[rgb(var(--c-text)/0.5)] mt-6">
        No account? <Link to="/register" className="text-gold">Create one</Link>
      </p>
    </div>
  );
}

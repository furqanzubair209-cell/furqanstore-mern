import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";

export default function Register() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", role: "CUSTOMER", vendorName: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <h1 className="font-display text-3xl mb-8 text-center">Create account</h1>
      <form onSubmit={submit} className="space-y-4">
        <input required placeholder="Full name" value={form.fullName} onChange={(e) => update("fullName", e.target.value)}
          className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
        <input type="email" required placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)}
          className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
        <input required placeholder="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)}
          className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
        <input type="password" required placeholder="Password" value={form.password} onChange={(e) => update("password", e.target.value)}
          className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
        <div className="flex gap-4">
          {(["CUSTOMER", "VENDOR"] as const).map((r) => (
            <button type="button" key={r} onClick={() => update("role", r)}
              className={`px-4 py-2 rounded-full text-sm border ${form.role === r ? "border-gold text-gold" : "border-[rgb(var(--c-border)/0.2)]"}`}>
              {r === "CUSTOMER" ? "Shop" : "Sell"}
            </button>
          ))}
        </div>
        {form.role === "VENDOR" && (
          <input required placeholder="Store name" value={form.vendorName} onChange={(e) => update("vendorName", e.target.value)}
            className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {notice && <p className="text-green-400 text-sm">{notice}</p>}
        <button disabled={loading} className="w-full bg-gold text-ink py-3 rounded-full font-medium disabled:opacity-50">
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="text-center text-sm text-[rgb(var(--c-text)/0.5)] mt-6">
        Already have an account? <Link to="/login" className="text-gold">Sign in</Link>
      </p>
    </div>
  );
}

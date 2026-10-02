import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addressApi } from "../api/account.api";

export default function Addresses() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["addresses"], queryFn: addressApi.list });
  const addresses = data?.data || [];

  const [form, setForm] = useState({ label: "Home", line1: "", city: "", isDefault: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["addresses"] });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.line1.trim() || !form.city.trim()) { setError("Address and city are required"); return; }
    setSaving(true);
    try {
      await addressApi.create(form);
      setForm({ label: "Home", line1: "", city: "", isDefault: false });
      invalidate();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Could not save address");
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (id: number) => { await addressApi.update(id, { isDefault: true }); invalidate(); };
  const remove = async (id: number) => { await addressApi.remove(id); invalidate(); };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl mb-8">Your addresses</h1>

      {isLoading ? (
        <p className="text-[rgb(var(--c-text)/0.5)]">Loading...</p>
      ) : addresses.length === 0 ? (
        <p className="text-[rgb(var(--c-text)/0.5)] mb-8">No saved addresses yet.</p>
      ) : (
        <div className="space-y-3 mb-10">
          {addresses.map((a: any) => (
            <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4">
              <div>
                <p className="text-sm">
                  {a.label}{a.isDefault && <span className="ml-2 text-xs text-gold">Default</span>}
                </p>
                <p className="text-xs text-[rgb(var(--c-text)/0.5)] mt-1">{a.line1}, {a.city}</p>
              </div>
              <div className="flex gap-3 shrink-0">
                {!a.isDefault && (
                  <button onClick={() => makeDefault(a.id)} className="text-xs text-gold hover:underline">Make default</button>
                )}
                <button onClick={() => remove(a.id)} className="text-xs text-[rgb(var(--c-text)/0.4)] hover:text-red-400">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-display text-xl mb-4">Add a new address</h2>
      <form onSubmit={submit} className="space-y-3">
        <input placeholder="Label (e.g. Home, Office)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
          className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
        <textarea required placeholder="Address" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })}
          className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" rows={2} />
        <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
          className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
        <label className="flex items-center gap-2 text-sm text-[rgb(var(--c-text)/0.6)]">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
          Set as default address
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button disabled={saving} className="bg-gold text-ink px-6 py-2.5 rounded-full text-sm font-medium disabled:opacity-50">
          {saving ? "Saving..." : "Save address"}
        </button>
      </form>
    </div>
  );
}

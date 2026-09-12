import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { vendorApi, orderStatusApi } from "../api/order.api";
import { getSocket } from "../lib/socket";
import { useThemeStore } from "../store/theme.store";

const STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function VendorDashboard() {
  const qc = useQueryClient();
  const theme = useThemeStore((s) => s.theme);
  const axisColor = theme === "light" ? "rgba(11,11,15,0.4)" : "rgba(255,255,255,0.4)";
  const gridColor = theme === "light" ? "rgba(11,11,15,0.08)" : "rgba(255,255,255,0.08)";
  const tooltipBg = theme === "light" ? "#faf9f6" : "#0b0b0f";
  const tooltipBorder = theme === "light" ? "rgba(11,11,15,0.1)" : "rgba(255,255,255,0.1)";
  const { data: stats } = useQuery({ queryKey: ["vendor-stats"], queryFn: vendorApi.stats });
  const { data: products } = useQuery({ queryKey: ["vendor-products"], queryFn: vendorApi.products });
  const { data: orderItems } = useQuery({ queryKey: ["vendor-orders"], queryFn: vendorApi.orders });
  const s = stats?.data;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ["vendor-stats"] });
      qc.invalidateQueries({ queryKey: ["vendor-orders"] });
    };
    socket.on("vendor:new-order", refresh);
    socket.on("order:status-changed", refresh);
    return () => {
      socket.off("vendor:new-order", refresh);
      socket.off("order:status-changed", refresh);
    };
  }, [qc]);

  const [form, setForm] = useState({ name: "", price: "", stock: "", imageUrl: "", description: "" });
  const [saving, setSaving] = useState(false);

  const cards = [
    { label: "Total earnings", value: s?.totalEarnings },
    { label: "Pending earnings", value: s?.pendingEarnings },
    { label: "Completed earnings", value: s?.completedEarnings },
    { label: "Commission paid", value: s?.totalCommissionPaid },
    { label: "Units sold", value: s?.unitsSold, raw: true },
    { label: "Products listed", value: s?.productCount, raw: true },
  ];

  const items: any[] = orderItems?.data || [];

  const chartData = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const item of items) {
      const day = new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      byDay.set(day, (byDay.get(day) || 0) + Number(item.vendorEarning));
    }
    return Array.from(byDay.entries()).slice(-14).map(([day, earnings]) => ({ day, earnings }));
  }, [items]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await vendorApi.createProduct({ ...form, price: Number(form.price), stock: Number(form.stock) });
      setForm({ name: "", price: "", stock: "", imageUrl: "", description: "" });
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
    } finally { setSaving(false); }
  };

  const updateStatus = async (orderId: number, status: string) => {
    await orderStatusApi.update(orderId, status);
    qc.invalidateQueries({ queryKey: ["vendor-orders"] });
    qc.invalidateQueries({ queryKey: ["vendor-stats"] });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl mb-8">Vendor dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4">
            <p className="text-xs text-[rgb(var(--c-text)/0.5)]">{c.label}</p>
            <p className="text-lg sm:text-xl text-gold mt-1">{c.raw ? c.value ?? 0 : `Rs. ${Number(c.value || 0).toLocaleString()}`}</p>
          </div>
        ))}
      </div>

      <div className="border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4 sm:p-6 mb-12">
        <h2 className="font-display text-xl mb-4">Earnings, last 14 days</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-[rgb(var(--c-text)/0.4)]">No sales yet.</p>
        ) : (
          <div className="h-64 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" stroke={axisColor} fontSize={12} />
                <YAxis stroke={axisColor} fontSize={12} />
                <Tooltip
                  contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
                  formatter={(v: number) => [`Rs. ${v.toLocaleString()}`, "Earnings"]}
                />
                <Bar dataKey="earnings" fill="#c9a45c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-12">
        <div>
          <h2 className="font-display text-xl mb-4">Add a product</h2>
          <form onSubmit={submit} className="space-y-3">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
            <div className="flex flex-col sm:flex-row gap-3">
              <input required type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
              <input required type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
            </div>
            <input placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" rows={3} />
            <button disabled={saving} className="bg-gold text-ink px-6 py-2.5 rounded-full text-sm font-medium disabled:opacity-50">
              {saving ? "Saving..." : "Submit for approval"}
            </button>
          </form>
        </div>

        <div>
          <h2 className="font-display text-xl mb-4">Your products</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {products?.data?.length ? products.data.map((p: any) => (
              <div key={p.id} className="flex justify-between items-center gap-3 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm">
                <span className="truncate">{p.name}</span>
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full border border-[rgb(var(--c-border)/0.2)]">{p.status}</span>
              </div>
            )) : <p className="text-[rgb(var(--c-text)/0.4)] text-sm">No products yet.</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl mb-4">Recent orders</h2>
        {items.length === 0 ? (
          <p className="text-[rgb(var(--c-text)/0.4)] text-sm">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 20).map((item: any) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate">{item.productName} × {item.quantity}</p>
                  <p className="text-xs text-[rgb(var(--c-text)/0.4)] mt-1">
                    Order #{item.orderId} · Rs. {Number(item.vendorEarning).toLocaleString()} earning · {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <select
                  value={item.order.status}
                  onChange={(e) => updateStatus(item.orderId, e.target.value)}
                  className="bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-full px-3 py-1.5 text-xs shrink-0"
                >
                  {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

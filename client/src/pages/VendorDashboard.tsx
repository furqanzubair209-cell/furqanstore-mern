import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DollarSign, TrendingUp, Package, BarChart3, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { vendorApi, orderStatusApi } from "../api/order.api";
import { getSocket } from "../lib/socket";
import { useThemeStore } from "../store/theme.store";
import { useToastStore } from "../store/toast.store";

const STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    PENDING: "border-yellow-400/30 text-yellow-400 bg-yellow-400/5",
    PROCESSING: "border-blue-400/30 text-blue-400 bg-blue-400/5",
    SHIPPED: "border-purple-400/30 text-purple-400 bg-purple-400/5",
    DELIVERED: "border-emerald-400/30 text-emerald-400 bg-emerald-400/5",
    CANCELLED: "border-red-400/30 text-red-400 bg-red-400/5",
    ACTIVE: "border-emerald-400/30 text-emerald-400 bg-emerald-400/5",
    INACTIVE: "border-red-400/30 text-red-400 bg-red-400/5"
  };
  return map[status] || "border-[rgb(var(--c-border)/0.2)] text-[rgb(var(--c-text)/0.5)]";
};

export default function VendorDashboard() {
  const qc = useQueryClient();
  const theme = useThemeStore((s) => s.theme);
  const addToast = useToastStore((s) => s.addToast);
  
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
  const [showProductForm, setShowProductForm] = useState(false);

  const cards = [
    { label: "Total earnings", value: s?.totalEarnings, icon: DollarSign, isMoney: true },
    { label: "Pending earnings", value: s?.pendingEarnings, icon: TrendingUp, isMoney: true },
    { label: "Completed earnings", value: s?.completedEarnings, icon: DollarSign, isMoney: true },
    { label: "Commission paid", value: s?.totalCommissionPaid, icon: BarChart3, isMoney: true },
    { label: "Units sold", value: s?.unitsSold, icon: Package, isMoney: false },
    { label: "Products listed", value: s?.productCount, icon: Package, isMoney: false },
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
      setShowProductForm(false);
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      addToast("Product submitted for approval");
    } catch (e: any) {
      addToast(e?.response?.data?.message || "Failed to add product", "error");
    } finally { setSaving(false); }
  };

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await orderStatusApi.update(orderId, status);
      qc.invalidateQueries({ queryKey: ["vendor-orders"] });
      qc.invalidateQueries({ queryKey: ["vendor-stats"] });
      addToast("Order status updated");
    } catch {
      addToast("Failed to update status", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 animate-fadeIn">
      <div className="mb-8 border-b border-[rgb(var(--c-border)/0.1)] pb-6">
        <h1 className="font-display text-3xl">Vendor Dashboard</h1>
        <p className="text-sm text-[rgb(var(--c-text)/0.5)] mt-1">Manage your store, products, and track performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`relative overflow-hidden rounded-xl p-5 border border-[rgb(var(--c-border)/0.1)] card-hover stagger-${i + 1} bg-gradient-to-br from-[rgb(var(--c-surface)/0.05)] to-transparent`}>
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-medium text-[rgb(var(--c-text)/0.6)] uppercase tracking-wider">{c.label}</p>
                <div className="p-2 rounded-full bg-gold/10 text-gold">
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-2xl font-display text-[rgb(var(--c-text))] mt-1">
                {c.isMoney ? `Rs. ${Number(c.value || 0).toLocaleString()}` : c.value ?? 0}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border border-[rgb(var(--c-border)/0.1)] rounded-xl p-6 mb-12 bg-[rgb(var(--c-surface)/0.02)]">
        <h2 className="font-display text-xl mb-6">Earnings Overview (Last 14 Days)</h2>
        {chartData.length === 0 ? (
          <div className="h-40 flex items-center justify-center border border-dashed border-[rgb(var(--c-border)/0.2)] rounded-lg">
            <p className="text-sm text-[rgb(var(--c-text)/0.4)]">No sales data available yet.</p>
          </div>
        ) : (
          <div className="h-72 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c9a45c" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#c9a45c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="day" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs. ${v}`} />
                <Tooltip
                  contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(v: number) => [`Rs. ${v.toLocaleString()}`, "Earnings"]}
                />
                <Area type="monotone" dataKey="earnings" stroke="#c9a45c" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">Products Management</h2>
          <button 
            onClick={() => setShowProductForm(!showProductForm)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-gold text-ink font-medium hover:shadow-lg hover:shadow-gold/20 transition-all"
          >
            {showProductForm ? <ChevronUp size={16} /> : <Plus size={16} />} 
            {showProductForm ? "Cancel" : "Add Product"}
          </button>
        </div>

        {showProductForm && (
          <div className="border border-gold/30 rounded-xl p-5 mb-8 animate-slideUp bg-gradient-to-r from-gold/5 to-transparent">
            <h3 className="font-medium mb-4 text-[rgb(var(--c-text))]">New Product Details</h3>
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[rgb(var(--c-surface)/0.5)] border border-[rgb(var(--c-border)/0.2)] rounded-xl p-3 text-sm focus:border-gold/50 outline-none transition" />
              <input placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full bg-[rgb(var(--c-surface)/0.5)] border border-[rgb(var(--c-border)/0.2)] rounded-xl p-3 text-sm focus:border-gold/50 outline-none transition" />
              <input required type="number" placeholder="Price (Rs.)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full bg-[rgb(var(--c-surface)/0.5)] border border-[rgb(var(--c-border)/0.2)] rounded-xl p-3 text-sm focus:border-gold/50 outline-none transition" />
              <input required type="number" placeholder="Stock Quantity" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full bg-[rgb(var(--c-surface)/0.5)] border border-[rgb(var(--c-border)/0.2)] rounded-xl p-3 text-sm focus:border-gold/50 outline-none transition" />
              <textarea placeholder="Product Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="md:col-span-2 w-full bg-[rgb(var(--c-surface)/0.5)] border border-[rgb(var(--c-border)/0.2)] rounded-xl p-3 text-sm focus:border-gold/50 outline-none transition" rows={3} />
              <div className="md:col-span-2 flex justify-end">
                <button disabled={saving} className="bg-gold text-ink px-6 py-2.5 rounded-full text-sm font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-gold/20 transition-all">
                  {saving ? "Submitting..." : "Submit for Approval"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products?.data?.length ? products.data.map((p: any) => (
            <div key={p.id} className="flex gap-4 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4 card-hover bg-[rgb(var(--c-surface)/0.02)]">
              <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-[rgb(var(--c-surface)/0.1)]">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[rgb(var(--c-text)/0.2)]">
                    <Package size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="font-medium text-sm truncate" title={p.name}>{p.name}</h3>
                  <p className="text-gold text-sm mt-0.5">Rs. {Number(p.price).toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor(p.status)}`}>{p.status}</span>
                  <p className="text-xs text-[rgb(var(--c-text)/0.5)]">Stock: {p.stock}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center border border-dashed border-[rgb(var(--c-border)/0.2)] rounded-xl">
              <Package size={40} className="mx-auto text-[rgb(var(--c-text)/0.2)] mb-3" />
              <p className="text-[rgb(var(--c-text)/0.4)] text-sm">You haven't listed any products yet.</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl mb-6">Recent Orders</h2>
        {items.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-[rgb(var(--c-border)/0.2)] rounded-xl">
            <p className="text-[rgb(var(--c-text)/0.4)] text-sm">No orders yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 20).map((item: any) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-5 card-hover bg-[rgb(var(--c-surface)/0.02)]">
                <div className="flex gap-4 items-center min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-[rgb(var(--c-surface)/0.1)] flex items-center justify-center shrink-0 text-gold">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-sm truncate">{item.productName} <span className="text-[rgb(var(--c-text)/0.5)] font-normal">× {item.quantity}</span></p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[rgb(var(--c-text)/0.5)]">
                      <span className="font-medium text-[rgb(var(--c-text)/0.8)]">Order #{item.orderId}</span>
                      <span>•</span>
                      <span className="text-gold font-medium">Earned: Rs. {Number(item.vendorEarning).toLocaleString()}</span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-2 shrink-0 border-t sm:border-t-0 border-[rgb(var(--c-border)/0.05)] pt-3 sm:pt-0">
                  <select
                    value={item.order.status}
                    onChange={(e) => updateStatus(item.orderId, e.target.value)}
                    className={`bg-[rgb(var(--c-surface)/0.05)] rounded-full px-3 py-1.5 text-xs outline-none cursor-pointer border ${statusColor(item.order.status)} transition-colors hover:bg-[rgb(var(--c-surface)/0.1)]`}
                  >
                    {STATUSES.map((st) => <option key={st} value={st} className="text-ink bg-white dark:bg-ink dark:text-white">{st}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

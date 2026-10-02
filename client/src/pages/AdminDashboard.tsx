import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, TrendingUp, DollarSign, Users, Package, ShoppingCart, BarChart3, Check, X, ShieldAlert } from "lucide-react";
import { adminApi, orderStatusApi } from "../api/order.api";
import { getSocket } from "../lib/socket";
import { useThemeStore } from "../store/theme.store";
import { exportRowsAsCsv } from "../lib/csv";

const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const TABS = ["overview", "orders", "products", "vendors", "users", "commission"] as const;
type Tab = (typeof TABS)[number];

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    PENDING: "border-yellow-400/30 text-yellow-400 bg-yellow-400/5",
    PROCESSING: "border-blue-400/30 text-blue-400 bg-blue-400/5",
    SHIPPED: "border-purple-400/30 text-purple-400 bg-purple-400/5",
    DELIVERED: "border-emerald-400/30 text-emerald-400 bg-emerald-400/5",
    CANCELLED: "border-red-400/30 text-red-400 bg-red-400/5",
    ACTIVE: "border-emerald-400/30 text-emerald-400 bg-emerald-400/5",
    INACTIVE: "border-red-400/30 text-red-400 bg-red-400/5",
    SUSPENDED: "border-red-400/40 text-red-400 bg-red-400/5",
  };
  return map[status] || "border-[rgb(var(--c-border)/0.2)] text-[rgb(var(--c-text)/0.5)]";
};

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 shrink-0 text-xs px-4 py-2 rounded-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.2)] text-[rgb(var(--c-text)/0.7)] hover:border-gold hover:text-gold hover:shadow-lg hover:shadow-gold/5 transition-all"
    >
      <Download size={14} /> Export CSV
    </button>
  );
}

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");

  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: adminApi.stats });
  const { data: pending } = useQuery({ queryKey: ["pending-vendors"], queryFn: adminApi.pendingVendors });
  const { data: commission } = useQuery({ queryKey: ["commission"], queryFn: adminApi.commission });
  const { data: orders } = useQuery({ queryKey: ["admin-orders"], queryFn: adminApi.orders, enabled: tab === "orders" || tab === "overview" });
  const { data: pendingProducts } = useQuery({ queryKey: ["admin-products", "PENDING"], queryFn: () => adminApi.products("PENDING"), enabled: tab === "products" });
  const { data: performance } = useQuery({ queryKey: ["vendor-performance"], queryFn: adminApi.vendorPerformance, enabled: tab === "vendors" });
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const { data: users } = useQuery({ queryKey: ["admin-users", userRoleFilter], queryFn: () => adminApi.users(userRoleFilter || undefined), enabled: tab === "users" });

  const theme = useThemeStore((t) => t.theme);
  const axisColor = theme === "light" ? "rgba(11,11,15,0.4)" : "rgba(255,255,255,0.4)";
  const gridColor = theme === "light" ? "rgba(11,11,15,0.08)" : "rgba(255,255,255,0.08)";
  const tooltipBg = theme === "light" ? "#faf9f6" : "#0b0b0f";
  const tooltipBorder = theme === "light" ? "rgba(11,11,15,0.1)" : "rgba(255,255,255,0.1)";

  const s = stats?.data;
  const [rate, setRate] = useState("");

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["pending-vendors"] });
    };
    socket.on("admin:new-order", refresh);
    return () => { socket.off("admin:new-order", refresh); };
  }, [qc]);

  const cards = [
    { label: "Total revenue", value: s?.totalRevenue, money: true, icon: TrendingUp },
    { label: "Platform commission", value: s?.totalPlatformCommission, money: true, icon: DollarSign },
    { label: "Orders", value: s?.totalOrders, icon: ShoppingCart },
    { label: "Vendors", value: s?.totalVendors, icon: Users },
    { label: "Customers", value: s?.totalCustomers, icon: Users },
    { label: "Products", value: s?.totalProducts, icon: Package },
  ];

  const updateRate = async () => {
    if (!rate) return;
    await adminApi.setCommission(Number(rate));
    setRate("");
    qc.invalidateQueries({ queryKey: ["commission"] });
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    await orderStatusApi.update(orderId, status);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const moderateProduct = async (id: number, status: "ACTIVE" | "INACTIVE") => {
    await adminApi.updateProductStatus(id, status);
    qc.invalidateQueries({ queryKey: ["admin-products", "PENDING"] });
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const approveVendor = async (id: number) => {
    await adminApi.approveVendor(id);
    qc.invalidateQueries({ queryKey: ["pending-vendors"] });
  };

  const toggleUserSuspension = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    await adminApi.updateUserStatus(id, nextStatus);
    qc.invalidateQueries({ queryKey: ["admin-users", userRoleFilter] });
  };

  const perfChartData = (performance?.data || []).map((r: any) => ({
    name: r.vendor?.vendorName || r.vendor?.fullName || `Vendor #${r.vendor?.id}`,
    earnings: Number(r.earnings),
  }));

  const exportOrders = () => {
    exportRowsAsCsv(
      `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      orders?.data || [],
      [
        { header: "Order ID", value: (o: any) => o.id },
        { header: "Customer", value: (o: any) => o.user?.fullName },
        { header: "Email", value: (o: any) => o.user?.email },
        { header: "Status", value: (o: any) => o.status },
        { header: "Items", value: (o: any) => o.items.length },
        { header: "Total", value: (o: any) => Number(o.total) },
        { header: "Placed at", value: (o: any) => new Date(o.createdAt).toISOString() },
      ]
    );
  };

  const exportVendorPerformance = () => {
    exportRowsAsCsv(
      `vendor-performance-${new Date().toISOString().slice(0, 10)}.csv`,
      performance?.data || [],
      [
        { header: "Vendor", value: (r: any) => r.vendor?.vendorName || r.vendor?.fullName },
        { header: "Units sold", value: (r: any) => r.unitsSold },
        { header: "Gross", value: (r: any) => Number(r.gross) },
        { header: "Commission", value: (r: any) => Number(r.commission) },
        { header: "Earnings", value: (r: any) => Number(r.earnings) },
      ]
    );
  };

  const exportUsers = () => {
    exportRowsAsCsv(
      `users-${new Date().toISOString().slice(0, 10)}.csv`,
      users?.data || [],
      [
        { header: "ID", value: (u: any) => u.id },
        { header: "Name", value: (u: any) => u.fullName },
        { header: "Email", value: (u: any) => u.email },
        { header: "Phone", value: (u: any) => u.phone },
        { header: "Role", value: (u: any) => u.role },
        { header: "Status", value: (u: any) => u.status },
        { header: "Joined", value: (u: any) => new Date(u.createdAt).toISOString() },
      ]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-fadeIn">
      <div className="mb-8 border-b border-[rgb(var(--c-border)/0.1)] pb-6">
        <h1 className="font-display text-3xl">Admin Dashboard</h1>
        <p className="text-sm text-[rgb(var(--c-text)/0.5)] mt-1">Platform management and analytics overview</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-10 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 px-5 py-2.5 rounded-full text-sm capitalize font-medium transition-all ${
              tab === t 
                ? "bg-gold text-ink shadow-lg shadow-gold/20" 
                : "border border-[rgb(var(--c-border)/0.1)] text-[rgb(var(--c-text)/0.6)] hover:border-gold/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="animate-fadeIn">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {cards.map((c, i) => {
              const Icon = c.icon || BarChart3;
              return (
                <div key={c.label} className={`relative overflow-hidden border border-[rgb(var(--c-border)/0.1)] rounded-2xl p-5 card-hover stagger-${i + 1} bg-gradient-to-br from-[rgb(var(--c-surface)/0.03)] to-transparent`}>
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-xs font-medium text-[rgb(var(--c-text)/0.5)] uppercase tracking-wider">{c.label}</p>
                    <div className="p-2 rounded-xl bg-gold/10 text-gold">
                      <Icon size={18} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-display text-[rgb(var(--c-text))] mt-1">
                    {c.money ? `Rs. ${Number(c.value || 0).toLocaleString()}` : c.value ?? 0}
                  </p>
                </div>
              );
            })}
          </div>
          
          <div className="bg-[rgb(var(--c-surface)/0.02)] border border-[rgb(var(--c-border)/0.1)] rounded-2xl p-6">
            <h2 className="font-display text-xl mb-6">Pending Vendor Approvals</h2>
            <div className="space-y-3">
              {pending?.data?.length ? pending.data.map((v: any) => (
                <div key={v.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4 text-sm bg-[rgb(var(--c-bg))]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[rgb(var(--c-surface)/0.1)] flex items-center justify-center shrink-0">
                      <Users size={18} className="text-gold" />
                    </div>
                    <div>
                      <p className="font-medium text-base">{v.vendorName || v.fullName}</p>
                      <p className="text-xs text-[rgb(var(--c-text)/0.5)] mt-0.5">{v.email}</p>
                    </div>
                  </div>
                  <button onClick={() => approveVendor(v.id)} className="shrink-0 flex items-center justify-center gap-1.5 text-xs px-4 py-2 rounded-full bg-gold text-ink font-medium hover:shadow-lg hover:shadow-gold/20 transition-all">
                    <Check size={14} /> Approve Vendor
                  </button>
                </div>
              )) : (
                <div className="py-10 text-center border border-dashed border-[rgb(var(--c-border)/0.2)] rounded-xl">
                  <ShieldAlert size={32} className="mx-auto text-[rgb(var(--c-text)/0.2)] mb-3" />
                  <p className="text-[rgb(var(--c-text)/0.4)] text-sm">No vendors pending approval.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-2xl">All Orders</h2>
            <ExportButton onClick={exportOrders} />
          </div>
          {orders?.data?.length ? orders.data.map((o: any) => (
            <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-5 text-sm card-hover bg-[rgb(var(--c-surface)/0.02)]">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-base">Order #{o.id}</p>
                  <span className="text-[rgb(var(--c-text)/0.4)]">•</span>
                  <p className="text-[rgb(var(--c-text)/0.8)]">{o.user?.fullName}</p>
                </div>
                <p className="text-xs text-[rgb(var(--c-text)/0.5)] mt-1.5 flex gap-2 items-center">
                  <span className="text-gold font-medium">Rs. {Number(o.total).toLocaleString()}</span>
                  <span>•</span>
                  <span>{o.items.length} item(s)</span>
                  <span>•</span>
                  <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
              <select
                value={o.status}
                onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                className={`bg-[rgb(var(--c-surface)/0.05)] rounded-full px-4 py-2 text-xs outline-none cursor-pointer border ${statusColor(o.status)} transition-colors hover:bg-[rgb(var(--c-surface)/0.1)] shrink-0`}
              >
                {ORDER_STATUSES.map((st) => <option key={st} value={st} className="text-ink bg-white dark:bg-ink dark:text-white">{st}</option>)}
              </select>
            </div>
          )) : (
            <div className="py-16 text-center border border-dashed border-[rgb(var(--c-border)/0.2)] rounded-xl">
              <ShoppingCart size={40} className="mx-auto text-[rgb(var(--c-text)/0.2)] mb-3" />
              <p className="text-[rgb(var(--c-text)/0.4)] text-sm">No orders yet.</p>
            </div>
          )}
        </div>
      )}

      {tab === "products" && (
        <div className="animate-fadeIn">
          <h2 className="font-display text-2xl mb-6">Pending Product Approvals</h2>
          <div className="grid gap-4">
            {pendingProducts?.data?.length ? pendingProducts.data.map((p: any) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-5 text-sm card-hover bg-[rgb(var(--c-surface)/0.02)]">
                <div className="flex gap-4 items-center min-w-0">
                  <div className="w-16 h-16 rounded-lg bg-[rgb(var(--c-surface)/0.1)] overflow-hidden shrink-0">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[rgb(var(--c-text)/0.2)]">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-base truncate">{p.name}</p>
                    <p className="text-xs text-[rgb(var(--c-text)/0.5)] mt-1">
                      Vendor: <span className="text-[rgb(var(--c-text))]">{p.vendor?.vendorName || p.vendor?.fullName}</span>
                    </p>
                    <p className="text-gold font-medium mt-1">Rs. {Number(p.price).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 border-t sm:border-t-0 border-[rgb(var(--c-border)/0.05)] pt-4 sm:pt-0">
                  <button onClick={() => moderateProduct(p.id, "ACTIVE")} className="flex items-center gap-1 text-xs px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition">
                    <Check size={14} /> Approve
                  </button>
                  <button onClick={() => moderateProduct(p.id, "INACTIVE")} className="flex items-center gap-1 text-xs px-4 py-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition">
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-16 text-center border border-dashed border-[rgb(var(--c-border)/0.2)] rounded-xl">
                <Package size={40} className="mx-auto text-[rgb(var(--c-text)/0.2)] mb-3" />
                <p className="text-[rgb(var(--c-text)/0.4)] text-sm">No products awaiting approval.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "vendors" && (
        <div className="animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="font-display text-2xl">Vendor Performance</h2>
            {(performance?.data || []).length > 0 && <ExportButton onClick={exportVendorPerformance} />}
          </div>
          
          {perfChartData.length > 0 && (
            <div className="h-80 mb-10 border border-[rgb(var(--c-border)/0.1)] rounded-2xl p-4 sm:p-6 bg-[rgb(var(--c-surface)/0.02)]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perfChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={axisColor} fontSize={11} interval={0} angle={-25} textAnchor="end" height={60} tickLine={false} axisLine={false} />
                  <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs. ${v}`} />
                  <Tooltip
                    contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(v: number) => [`Rs. ${v.toLocaleString()}`, "Earnings"]}
                    cursor={{ fill: 'rgba(201, 164, 92, 0.1)' }}
                  />
                  <Bar dataKey="earnings" fill="url(#colorEarningsBar)" radius={[4, 4, 0, 0]}>
                    <defs>
                      <linearGradient id="colorEarningsBar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4b36e" />
                        <stop offset="100%" stopColor="#c9a45c" />
                      </linearGradient>
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(performance?.data || []).map((r: any) => (
              <div key={r.vendor?.id} className="border border-[rgb(var(--c-border)/0.1)] rounded-xl p-5 card-hover bg-[rgb(var(--c-surface)/0.02)]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center shrink-0">
                    <Users size={18} />
                  </div>
                  <h3 className="font-medium truncate">{r.vendor?.vendorName || r.vendor?.fullName}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-[rgb(var(--c-border)/0.05)] pb-2">
                    <span className="text-[rgb(var(--c-text)/0.5)]">Units Sold</span>
                    <span className="font-medium">{r.unitsSold}</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgb(var(--c-border)/0.05)] pb-2">
                    <span className="text-[rgb(var(--c-text)/0.5)]">Gross Sales</span>
                    <span className="font-medium">Rs. {Number(r.gross).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-[rgb(var(--c-text)/0.5)]">Total Earned</span>
                    <span className="font-medium text-gold">Rs. {Number(r.earnings).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="font-display text-2xl">User Management</h2>
            <div className="flex items-center gap-3">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-full px-4 py-2 text-sm outline-none focus:border-gold transition-colors"
              >
                <option value="">All Roles</option>
                <option value="CUSTOMER">Customers</option>
                <option value="VENDOR">Vendors</option>
                <option value="ADMIN">Admins</option>
              </select>
              {(users?.data || []).length > 0 && <ExportButton onClick={exportUsers} />}
            </div>
          </div>
          
          <div className="grid gap-3">
            {users?.data?.length ? users.data.map((u: any) => (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-5 text-sm card-hover bg-[rgb(var(--c-surface)/0.02)]">
                <div className="flex gap-4 items-center min-w-0">
                  <div className="w-12 h-12 rounded-full bg-[rgb(var(--c-surface)/0.1)] flex items-center justify-center shrink-0">
                    <span className="text-lg font-medium text-[rgb(var(--c-text)/0.6)]">
                      {(u.vendorName || u.fullName).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-base truncate">{u.vendorName || u.fullName}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgb(var(--c-surface)/0.1)] border border-[rgb(var(--c-border)/0.1)] capitalize tracking-wide">{u.role.toLowerCase()}</span>
                    </div>
                    <p className="text-xs text-[rgb(var(--c-text)/0.5)] mt-1 truncate">{u.email} {u.phone ? `• ${u.phone}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 border-t sm:border-t-0 border-[rgb(var(--c-border)/0.05)] pt-4 sm:pt-0">
                  <span className={`text-xs px-3 py-1 rounded-full border ${statusColor(u.status)}`}>
                    {u.status}
                  </span>
                  {u.status !== "PENDING" && (
                    <button
                      onClick={() => toggleUserSuspension(u.id, u.status)}
                      className={`text-xs px-4 py-1.5 rounded-full border transition-all ${
                        u.status === "SUSPENDED"
                          ? "border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/10"
                          : "border-red-400/40 text-red-400 hover:bg-red-400/10"
                      }`}
                    >
                      {u.status === "SUSPENDED" ? "Reactivate User" : "Suspend User"}
                    </button>
                  )}
                </div>
              </div>
            )) : (
              <div className="py-16 text-center border border-dashed border-[rgb(var(--c-border)/0.2)] rounded-xl">
                <Users size={40} className="mx-auto text-[rgb(var(--c-text)/0.2)] mb-3" />
                <p className="text-[rgb(var(--c-text)/0.4)] text-sm">No users found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "commission" && (
        <div className="grid md:grid-cols-2 gap-8 animate-fadeIn">
          <div className="border border-[rgb(var(--c-border)/0.1)] rounded-2xl p-6 lg:p-8 bg-gradient-to-br from-[rgb(var(--c-surface)/0.05)] to-transparent">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-full bg-gold/10 text-gold">
                <DollarSign size={24} />
              </div>
              <h2 className="font-display text-2xl">Platform Commission</h2>
            </div>
            
            <div className="mb-8">
              <p className="text-sm text-[rgb(var(--c-text)/0.6)] mb-2">Current Rate</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-display text-gold">{commission?.data?.currentRate}%</span>
                <span className="text-xs text-[rgb(var(--c-text)/0.4)] pb-2 border-b border-gold/30">Active for new orders</span>
              </div>
            </div>
            
            <div className="pt-6 border-t border-[rgb(var(--c-border)/0.1)]">
              <h3 className="font-medium text-sm mb-4">Update Rate</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input 
                    type="number" 
                    placeholder="New percentage (e.g., 15)" 
                    value={rate} 
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full bg-[rgb(var(--c-bg))] border border-[rgb(var(--c-border)/0.2)] rounded-xl p-3 pr-8 text-sm focus:border-gold outline-none transition" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgb(var(--c-text)/0.4)]">%</span>
                </div>
                <button 
                  onClick={updateRate} 
                  disabled={!rate}
                  className="bg-gold text-ink px-6 py-3 rounded-xl text-sm font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-gold/20 transition-all shrink-0"
                >
                  Apply Rate
                </button>
              </div>
              <p className="text-xs text-[rgb(var(--c-text)/0.4)] mt-3">Changes will only apply to orders placed after this update.</p>
            </div>
          </div>
          
          <div className="border border-[rgb(var(--c-border)/0.1)] rounded-2xl p-6 bg-[rgb(var(--c-surface)/0.02)]">
            <h2 className="font-display text-xl mb-6">Rate History</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {commission?.data?.history?.length ? commission.data.history.map((h: any, i: number) => (
                <div key={h.id} className="flex justify-between items-center border border-[rgb(var(--c-border)/0.1)] bg-[rgb(var(--c-bg))] rounded-xl p-4 text-sm relative overflow-hidden">
                  {h.active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold"></div>}
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-medium ${h.active ? 'text-gold pl-2' : ''}`}>{Number(h.rate)}%</span>
                    {h.active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">Current</span>}
                  </div>
                  <span className="text-xs text-[rgb(var(--c-text)/0.5)]">
                    {new Date(h.effectiveFrom).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )) : (
                <div className="py-12 text-center text-[rgb(var(--c-text)/0.4)] text-sm border border-dashed border-[rgb(var(--c-border)/0.2)] rounded-xl">
                  No rate history available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { adminApi, orderStatusApi } from "../api/order.api";
import { getSocket } from "../lib/socket";
import { useThemeStore } from "../store/theme.store";
import { exportRowsAsCsv } from "../lib/csv";

const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const TABS = ["overview", "orders", "products", "vendors", "users", "commission"] as const;
type Tab = (typeof TABS)[number];

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 shrink-0 text-xs px-3 py-1.5 rounded-full border border-[rgb(var(--c-border)/0.2)] text-[rgb(var(--c-text)/0.7)] hover:border-gold hover:text-gold transition"
    >
      <Download size={13} /> Export CSV
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
    { label: "Total revenue", value: s?.totalRevenue, money: true },
    { label: "Platform commission", value: s?.totalPlatformCommission, money: true },
    { label: "Orders", value: s?.totalOrders },
    { label: "Vendors", value: s?.totalVendors },
    { label: "Customers", value: s?.totalCustomers },
    { label: "Products", value: s?.totalProducts },
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-display text-3xl mb-6">Admin dashboard</h1>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm border capitalize ${tab === t ? "border-gold text-gold" : "border-[rgb(var(--c-border)/0.2)] text-[rgb(var(--c-text)/0.6)]"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
            {cards.map((c) => (
              <div key={c.label} className="border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4">
                <p className="text-xs text-[rgb(var(--c-text)/0.5)]">{c.label}</p>
                <p className="text-lg sm:text-xl text-gold mt-1">{c.money ? `Rs. ${Number(c.value || 0).toLocaleString()}` : c.value ?? 0}</p>
              </div>
            ))}
          </div>
          <h2 className="font-display text-xl mb-4">Pending vendor approvals</h2>
          <div className="space-y-2">
            {pending?.data?.length ? pending.data.map((v: any) => (
              <div key={v.id} className="flex justify-between items-center gap-3 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm">
                <span className="truncate">{v.vendorName || v.fullName}</span>
                <button onClick={() => approveVendor(v.id)} className="shrink-0 text-xs px-3 py-1 rounded-full border border-gold text-gold">
                  Approve
                </button>
              </div>
            )) : <p className="text-[rgb(var(--c-text)/0.4)] text-sm">No pending approvals.</p>}
          </div>
        </>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          <div className="flex justify-end mb-1">
            <ExportButton onClick={exportOrders} />
          </div>
          {orders?.data?.length ? orders.data.map((o: any) => (
            <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4 text-sm">
              <div className="min-w-0">
                <p>Order #{o.id} · <span className="text-[rgb(var(--c-text)/0.5)]">{o.user?.fullName}</span></p>
                <p className="text-xs text-[rgb(var(--c-text)/0.4)] mt-1">
                  Rs. {Number(o.total).toLocaleString()} · {o.items.length} item(s) · {new Date(o.createdAt).toLocaleDateString()}
                </p>
              </div>
              <select
                value={o.status}
                onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                className="bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-full px-3 py-1.5 text-xs shrink-0"
              >
                {ORDER_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
          )) : <p className="text-[rgb(var(--c-text)/0.4)] text-sm">No orders yet.</p>}
        </div>
      )}

      {tab === "products" && (
        <div>
          <h2 className="font-display text-xl mb-4">Pending product approvals</h2>
          <div className="space-y-2">
            {pendingProducts?.data?.length ? pendingProducts.data.map((p: any) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate">{p.name}</p>
                  <p className="text-xs text-[rgb(var(--c-text)/0.4)] mt-1">
                    {p.vendor?.vendorName || p.vendor?.fullName} · Rs. {Number(p.price).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => moderateProduct(p.id, "ACTIVE")} className="text-xs px-3 py-1 rounded-full border border-gold text-gold">Approve</button>
                  <button onClick={() => moderateProduct(p.id, "INACTIVE")} className="text-xs px-3 py-1 rounded-full border border-[rgb(var(--c-border)/0.2)] text-[rgb(var(--c-text)/0.6)]">Reject</button>
                </div>
              </div>
            )) : <p className="text-[rgb(var(--c-text)/0.4)] text-sm">No products awaiting approval.</p>}
          </div>
        </div>
      )}

      {tab === "vendors" && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-display text-xl">Vendor performance</h2>
            {(performance?.data || []).length > 0 && <ExportButton onClick={exportVendorPerformance} />}
          </div>
          {perfChartData.length > 0 && (
            <div className="h-64 sm:-ml-4 mb-8 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-2 sm:p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perfChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" stroke={axisColor} fontSize={11} interval={0} angle={-20} textAnchor="end" height={60} />
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
          <div className="space-y-2">
            {(performance?.data || []).map((r: any) => (
              <div key={r.vendor?.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm">
                <span className="truncate">{r.vendor?.vendorName || r.vendor?.fullName}</span>
                <span className="text-xs text-[rgb(var(--c-text)/0.5)] shrink-0">
                  {r.unitsSold} units · Rs. {Number(r.gross).toLocaleString()} gross · Rs. {Number(r.earnings).toLocaleString()} earned
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="font-display text-xl">Users</h2>
            <div className="flex items-center gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-full px-3 py-1.5 text-xs"
              >
                <option value="">All roles</option>
                <option value="CUSTOMER">Customers</option>
                <option value="VENDOR">Vendors</option>
                <option value="ADMIN">Admins</option>
              </select>
              {(users?.data || []).length > 0 && <ExportButton onClick={exportUsers} />}
            </div>
          </div>
          <div className="space-y-2">
            {users?.data?.length ? users.data.map((u: any) => (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate">
                    {u.vendorName || u.fullName}
                    <span className="ml-2 text-xs text-[rgb(var(--c-text)/0.4)] capitalize">{u.role.toLowerCase()}</span>
                  </p>
                  <p className="text-xs text-[rgb(var(--c-text)/0.4)] mt-1 truncate">{u.email} · {u.phone}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      u.status === "SUSPENDED"
                        ? "border-red-400/40 text-red-400"
                        : u.status === "PENDING"
                        ? "border-[rgb(var(--c-border)/0.2)] text-[rgb(var(--c-text)/0.5)]"
                        : "border-gold text-gold"
                    }`}
                  >
                    {u.status}
                  </span>
                  {u.status !== "PENDING" && (
                    <button
                      onClick={() => toggleUserSuspension(u.id, u.status)}
                      className={`text-xs px-3 py-1 rounded-full border transition ${
                        u.status === "SUSPENDED"
                          ? "border-gold text-gold"
                          : "border-red-400/40 text-red-400 hover:bg-red-400/10"
                      }`}
                    >
                      {u.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                    </button>
                  )}
                </div>
              </div>
            )) : <p className="text-[rgb(var(--c-text)/0.4)] text-sm">No users found.</p>}
          </div>
        </div>
      )}

      {tab === "commission" && (
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display text-xl mb-4">Commission rate</h2>
            <p className="text-sm text-[rgb(var(--c-text)/0.6)] mb-3">
              Current: <span className="text-gold">{commission?.data?.currentRate}%</span> — applies to future orders only.
            </p>
            <div className="flex flex-wrap gap-3">
              <input type="number" placeholder="New rate %" value={rate} onChange={(e) => setRate(e.target.value)}
                className="bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm w-32" />
              <button onClick={updateRate} className="bg-gold text-ink px-6 py-2.5 rounded-full text-sm font-medium">Update</button>
            </div>
          </div>
          <div>
            <h2 className="font-display text-xl mb-4">Rate history</h2>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {commission?.data?.history?.length ? commission.data.history.map((h: any) => (
                <div key={h.id} className="flex justify-between items-center border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm">
                  <span>{Number(h.rate)}%{h.active && <span className="ml-2 text-xs text-gold">Active</span>}</span>
                  <span className="text-xs text-[rgb(var(--c-text)/0.4)]">{new Date(h.effectiveFrom).toLocaleDateString()}</span>
                </div>
              )) : <p className="text-[rgb(var(--c-text)/0.4)] text-sm">No history yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

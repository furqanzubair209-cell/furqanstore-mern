import { useState, useEffect } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, MapPin, Heart, User, LayoutDashboard, Plus, Pencil, Trash2, Star, ChevronDown, ChevronUp, Check, X, Shield } from "lucide-react";
import { orderApi } from "../api/order.api";
import { addressApi, wishlistApi, profileApi } from "../api/account.api";
import { useAuthStore } from "../store/auth.store";
import { useToastStore } from "../store/toast.store";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "orders", label: "Orders", icon: Package },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "wishlist", label: "Wishlist", icon: Heart },
  { key: "profile", label: "Profile", icon: User },
] as const;
type Tab = typeof TABS[number]["key"];

export default function CustomerDashboard() {
  const qc = useQueryClient();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const addToast = useToastStore((s) => s.addToast);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    const tabParam = searchParams.get("tab") as Tab | null;
    if (tabParam && ["overview", "orders", "addresses", "wishlist", "profile"].includes(tabParam)) {
      setTab(tabParam);
    } else if (location.pathname.includes("/orders") || id) {
      setTab("orders");
      if (id) setExpandedOrder(Number(id));
    } else if (location.pathname.includes("/addresses")) {
      setTab("addresses");
    } else if (location.pathname.includes("/wishlist")) {
      setTab("wishlist");
    } else if (location.pathname.includes("/profile")) {
      setTab("profile");
    }
  }, [location.pathname, searchParams, id]);

  const { data: ordersData } = useQuery({ queryKey: ["my-orders"], queryFn: orderApi.mine });
  const { data: addressData } = useQuery({ queryKey: ["addresses"], queryFn: addressApi.list });
  const { data: wishlistData } = useQuery({ queryKey: ["wishlist"], queryFn: wishlistApi.list });

  const orders = ordersData?.data || [];
  const addresses = addressData?.data || [];
  const wishlist = wishlistData?.data || [];

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({ label: "Home", line1: "", city: "", isDefault: false });

  const [profileForm, setProfileForm] = useState({ fullName: "", email: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      setProfileForm({ fullName: user.fullName, email: user.email, phone: "" });
    }
  }, [user]);

  const resetAddressForm = () => {
    setAddressForm({ label: "Home", line1: "", city: "", isDefault: false });
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const saveAddress = async () => {
    try {
      if (editingAddress) {
        await addressApi.update(editingAddress, addressForm);
        addToast("Address updated");
      } else {
        await addressApi.create(addressForm);
        addToast("Address added");
      }
      qc.invalidateQueries({ queryKey: ["addresses"] });
      resetAddressForm();
    } catch (e: any) {
      addToast(e?.response?.data?.message || "Failed to save address", "error");
    }
  };

  const deleteAddress = async (id: number) => {
    try {
      await addressApi.remove(id);
      addToast("Address removed");
      qc.invalidateQueries({ queryKey: ["addresses"] });
    } catch (e: any) {
      addToast(e?.response?.data?.message || "Failed to remove", "error");
    }
  };

  const editAddress = (addr: any) => {
    setEditingAddress(addr.id);
    setAddressForm({ label: addr.label, line1: addr.line1, city: addr.city, isDefault: addr.isDefault });
    setShowAddressForm(true);
  };

  const removeWishlistItem = async (productId: number) => {
    await wishlistApi.remove(productId);
    addToast("Removed from wishlist");
    qc.invalidateQueries({ queryKey: ["wishlist"] });
  };

  const updateProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await profileApi.update(profileForm);
      if (res.data && user) {
        setSession(useAuthStore.getState().accessToken!, { ...user, fullName: res.data.fullName, email: res.data.email });
      }
      addToast("Profile updated");
    } catch (e: any) {
      addToast(e?.response?.data?.message || "Update failed", "error");
    } finally { setProfileLoading(false); }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast("Passwords don't match", "error");
      return;
    }
    setPasswordLoading(true);
    try {
      await profileApi.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      addToast("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: any) {
      addToast(e?.response?.data?.message || "Failed to change password", "error");
    } finally { setPasswordLoading(false); }
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "border-yellow-400/30 text-yellow-400 bg-yellow-400/5",
      PROCESSING: "border-blue-400/30 text-blue-400 bg-blue-400/5",
      SHIPPED: "border-purple-400/30 text-purple-400 bg-purple-400/5",
      DELIVERED: "border-emerald-400/30 text-emerald-400 bg-emerald-400/5",
      CANCELLED: "border-red-400/30 text-red-400 bg-red-400/5",
    };
    return map[status] || "border-[rgb(var(--c-border)/0.2)] text-[rgb(var(--c-text)/0.5)]";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 animate-fadeIn">
      <div className="mb-8">
        <h1 className="font-display text-3xl">Welcome back, {user?.fullName?.split(" ")[0]}</h1>
        <p className="text-sm text-[rgb(var(--c-text)/0.5)] mt-1">Manage your orders, addresses, and account settings</p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                tab === t.key
                  ? "bg-gold text-ink font-medium"
                  : "border border-[rgb(var(--c-border)/0.1)] text-[rgb(var(--c-text)/0.6)] hover:border-gold/30"
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Orders", value: orders.length, icon: Package },
              { label: "Total Spent", value: `Rs. ${orders.reduce((s: number, o: any) => s + Number(o.total), 0).toLocaleString()}`, icon: LayoutDashboard },
              { label: "Saved Addresses", value: addresses.length, icon: MapPin },
              { label: "Wishlist Items", value: wishlist.length, icon: Heart },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={`border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4 card-hover stagger-${i + 1} animate-fadeIn`}>
                  <Icon size={18} className="text-gold mb-2" />
                  <p className="text-xs text-[rgb(var(--c-text)/0.5)]">{card.label}</p>
                  <p className="text-lg text-gold mt-1 font-medium">{card.value}</p>
                </div>
              );
            })}
          </div>

          <div>
            <h2 className="font-display text-xl mb-4">Recent Orders</h2>
            {orders.length === 0 ? (
              <p className="text-[rgb(var(--c-text)/0.4)] text-sm">No orders yet. <Link to="/products" className="text-gold">Start shopping →</Link></p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((o: any) => (
                  <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4 text-sm card-hover">
                    <div>
                      <p>Order #{o.id}</p>
                      <p className="text-xs text-[rgb(var(--c-text)/0.4)] mt-1">Rs. {Number(o.total).toLocaleString()} · {o.items?.length} item(s) · {new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full border ${statusColor(o.status)}`}>{o.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3 animate-fadeIn">
          {orders.length === 0 ? (
            <div className="text-center py-20">
              <Package size={40} className="mx-auto text-[rgb(var(--c-text)/0.2)] mb-4" />
              <p className="text-[rgb(var(--c-text)/0.4)]">No orders yet</p>
              <Link to="/products" className="text-gold text-sm mt-2 inline-block">Browse products →</Link>
            </div>
          ) : orders.map((o: any) => (
            <div key={o.id} className="border border-[rgb(var(--c-border)/0.1)] rounded-xl overflow-hidden card-hover">
              <button
                onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 text-sm text-left"
              >
                <div>
                  <p className="font-medium">Order #{o.id}</p>
                  <p className="text-xs text-[rgb(var(--c-text)/0.4)] mt-1">
                    {new Date(o.createdAt).toLocaleDateString()} · {o.paymentMethod} · {o.items?.length} item(s)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gold font-medium">Rs. {Number(o.total).toLocaleString()}</span>
                  <span className={`text-xs px-3 py-1 rounded-full border ${statusColor(o.status)}`}>{o.status}</span>
                  {expandedOrder === o.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
              {expandedOrder === o.id && (
                <div className="border-t border-[rgb(var(--c-border)/0.1)] px-4 py-3 space-y-2 bg-[rgb(var(--c-surface)/0.02)] animate-fadeIn">
                  {o.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-[rgb(var(--c-text)/0.7)]">{item.productName} × {item.quantity}</span>
                      <span className="text-[rgb(var(--c-text)/0.5)]">Rs. {Number(item.grossAmount).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-[rgb(var(--c-border)/0.05)] flex justify-between text-sm font-medium">
                    <span>Shipping Address</span>
                    <span className="text-[rgb(var(--c-text)/0.5)] text-xs max-w-[200px] text-right">{o.shippingAddress}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "addresses" && (
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl">Your Addresses</h2>
            <button onClick={() => { resetAddressForm(); setShowAddressForm(true); }}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full bg-gold text-ink font-medium hover:shadow-lg hover:shadow-gold/20 transition-all">
              <Plus size={15} /> Add Address
            </button>
          </div>

          {showAddressForm && (
            <div className="border border-gold/20 rounded-xl p-5 mb-6 animate-fadeIn">
              <h3 className="text-sm font-medium mb-4">{editingAddress ? "Edit Address" : "New Address"}</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input placeholder="Label (e.g. Home, Office)" value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  className="bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
                <input placeholder="City" value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
                <input placeholder="Address line" value={addressForm.line1}
                  onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                  className="sm:col-span-2 bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
              </div>
              <label className="flex items-center gap-2 mt-3 text-sm text-[rgb(var(--c-text)/0.6)] cursor-pointer">
                <input type="checkbox" checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="accent-gold" />
                Set as default address
              </label>
              <div className="flex gap-2 mt-4">
                <button onClick={saveAddress}
                  className="px-5 py-2 rounded-full bg-gold text-ink text-sm font-medium">
                  {editingAddress ? "Update" : "Save"}
                </button>
                <button onClick={resetAddressForm}
                  className="px-5 py-2 rounded-full border border-[rgb(var(--c-border)/0.2)] text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {addresses.length === 0 ? (
              <div className="text-center py-16">
                <MapPin size={40} className="mx-auto text-[rgb(var(--c-text)/0.2)] mb-4" />
                <p className="text-[rgb(var(--c-text)/0.4)] text-sm">No saved addresses</p>
              </div>
            ) : addresses.map((a: any) => (
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[rgb(var(--c-border)/0.1)] rounded-xl p-4 card-hover">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{a.label}</p>
                    {a.isDefault && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">Default</span>}
                  </div>
                  <p className="text-xs text-[rgb(var(--c-text)/0.5)] mt-1">{a.line1}, {a.city}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!a.isDefault && (
                    <button onClick={async () => { await addressApi.update(a.id, { isDefault: true }); addToast("Default address updated"); qc.invalidateQueries({ queryKey: ["addresses"] }); }}
                      className="text-xs px-3 py-1.5 rounded-full border border-[rgb(var(--c-border)/0.2)] hover:border-gold transition"><Check size={12} className="inline mr-1" />Set Default</button>
                  )}
                  <button onClick={() => editAddress(a)}
                    className="p-2 rounded-full border border-[rgb(var(--c-border)/0.2)] hover:border-gold transition"><Pencil size={13} /></button>
                  <button onClick={() => deleteAddress(a.id)}
                    className="p-2 rounded-full border border-red-400/20 text-red-400 hover:bg-red-400/5 transition"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "wishlist" && (
        <div className="animate-fadeIn">
          {wishlist.length === 0 ? (
            <div className="text-center py-20">
              <Heart size={40} className="mx-auto text-[rgb(var(--c-text)/0.2)] mb-4" />
              <p className="text-[rgb(var(--c-text)/0.4)]">Your wishlist is empty</p>
              <Link to="/products" className="text-gold text-sm mt-2 inline-block">Discover products →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {wishlist.map((item: any) => (
                <div key={item.id} className="group card-hover">
                  <Link to={`/products/${item.product.id}`}>
                    <div className="aspect-square rounded-xl overflow-hidden bg-[rgb(var(--c-surface)/0.05)]">
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>
                    <p className="mt-3 text-sm truncate">{item.product.name}</p>
                    <p className="text-gold text-sm">Rs. {Number(item.product.price).toLocaleString()}</p>
                  </Link>
                  <button onClick={() => removeWishlistItem(item.product.id)}
                    className="mt-2 w-full text-xs border border-red-400/20 text-red-400 rounded-full py-1.5 hover:bg-red-400/5 transition">
                    Remove from wishlist
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "profile" && (
        <div className="grid md:grid-cols-2 gap-10 animate-fadeIn">
          <div>
            <h2 className="font-display text-xl mb-4 flex items-center gap-2"><User size={20} className="text-gold" /> Personal Info</h2>
            <div className="space-y-3">
              <input placeholder="Full name" value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
              <input type="email" placeholder="Email" value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
              <input placeholder="Phone" value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
              <button onClick={updateProfile} disabled={profileLoading}
                className="bg-gradient-to-r from-gold to-gold-light text-ink px-6 py-2.5 rounded-full text-sm font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-gold/20 transition-all">
                {profileLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl mb-4 flex items-center gap-2"><Shield size={20} className="text-gold" /> Change Password</h2>
            <div className="space-y-3">
              <input type="password" placeholder="Current password" value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
              <input type="password" placeholder="New password" value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
              <input type="password" placeholder="Confirm new password" value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full bg-[rgb(var(--c-surface)/0.05)] border border-[rgb(var(--c-border)/0.1)] rounded-xl p-3 text-sm" />
              <button onClick={changePassword} disabled={passwordLoading}
                className="bg-gradient-to-r from-gold to-gold-light text-ink px-6 py-2.5 rounded-full text-sm font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-gold/20 transition-all">
                {passwordLoading ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

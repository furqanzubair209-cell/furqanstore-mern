import { Link, Outlet } from "react-router-dom";
import { Menu, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/auth.store";
import { useQuery } from "@tanstack/react-query";
import { cartApi } from "../api/cart.api";
import { authApi } from "../api/auth.api";
import { disconnectSocket } from "../lib/socket";
import NotificationBell from "../components/NotificationBell";
import ThemeToggle from "../components/ThemeToggle";

const NAV_LINKS = [
  { to: "/products", label: "Shop" },
  { to: "/products?category=electronics", label: "Electronics" },
  { to: "/products?category=fashion", label: "Fashion" },
];

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.get,
    enabled: !!user,
  });
  const cartCount = data?.data?.length || 0;
  const accountPath = user?.role === "CUSTOMER" ? "/account" : user?.role === "VENDOR" ? "/vendor" : "/admin";

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    disconnectSocket();
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur bg-[rgb(var(--c-bg)/0.8)] border-b border-[rgb(var(--c-border)/0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden p-1.5 -ml-1.5 text-[rgb(var(--c-text)/0.8)]"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="font-display text-lg sm:text-xl tracking-wide text-gold shrink-0">
            FurqanStore
          </Link>

          <nav className="hidden md:flex gap-8 text-sm text-[rgb(var(--c-text)/0.8)]">
            {NAV_LINKS.map((l) => (
              <Link key={l.label} to={l.to} className="hover:text-gold transition">{l.label}</Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link to="/cart" className="relative shrink-0" aria-label="Cart">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold text-ink text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {user && <NotificationBell />}
            {user ? (
              <div className="hidden sm:flex items-center gap-3">
                <Link to={accountPath} className="flex items-center gap-1 text-sm">
                  <User size={16} /> {user.fullName.split(" ")[0]}
                </Link>
                <button onClick={handleLogout} className="text-xs text-[rgb(var(--c-text)/0.5)] hover:text-[rgb(var(--c-text))]">Log out</button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-full border border-gold text-gold hover:bg-gold hover:text-ink transition whitespace-nowrap"
              >
                Sign in
              </Link>
            )}
            {user && (
              <Link to={accountPath} className="sm:hidden" aria-label="Account">
                <User size={20} />
              </Link>
            )}
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden border-t border-[rgb(var(--c-border)/0.1)] px-4 sm:px-6 py-4 flex flex-col gap-4 text-sm text-[rgb(var(--c-text)/0.8)]">
            {NAV_LINKS.map((l) => (
              <Link key={l.label} to={l.to} onClick={() => setMenuOpen(false)} className="hover:text-gold transition">
                {l.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="text-left text-[rgb(var(--c-text)/0.5)] hover:text-[rgb(var(--c-text))]"
              >
                Log out
              </button>
            )}
            <div className="flex items-center gap-2 pt-2 border-t border-[rgb(var(--c-border)/0.1)]">
              <ThemeToggle />
              <span className="text-[rgb(var(--c-text)/0.5)]">Toggle theme</span>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-[rgb(var(--c-border)/0.1)] mt-20 py-10 text-sm text-[rgb(var(--c-text)/0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <p className="font-display text-gold mb-3">FurqanStore</p>
            <p>A premium multi-vendor marketplace.</p>
          </div>
          <div>
            <p className="text-[rgb(var(--c-text))] mb-3">Shop</p>
            <ul className="space-y-2">
              <li><Link to="/products">All products</Link></li>
              <li><Link to="/products?sort=rating">Trending</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[rgb(var(--c-text))] mb-3">Account</p>
            <ul className="space-y-2">
              <li><Link to="/login">Sign in</Link></li>
              <li><Link to="/register">Become a vendor</Link></li>
              <li><Link to="/wishlist">Wishlist</Link></li>
              <li><Link to="/account/addresses">Addresses</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[rgb(var(--c-text))] mb-3">Support</p>
            <ul className="space-y-2">
              <li><Link to="/contact">Contact us</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, ShoppingBag, User, X, Facebook, Twitter, Instagram } from "lucide-react";
import { useState, useEffect } from "react";
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
  { to: "/products?category=mobiles", label: "Mobiles" },
  { to: "/products?category=fashion", label: "Fashion" },
  { to: "/products?category=gaming", label: "Gaming" },
  { to: "/products?category=watches", label: "Watches" },
];

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  
  const { data } = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.get,
    enabled: !!user,
  });
  const cartCount = data?.data?.length || 0;
  const accountPath = user?.role === "CUSTOMER" ? "/account" : user?.role === "VENDOR" ? "/vendor" : "/admin";

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    disconnectSocket();
    logout();
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-gold/30 selection:text-gold">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[rgb(var(--c-bg)/0.75)] border-b border-[rgb(var(--c-border)/0.1)] glass transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="lg:hidden p-2 -ml-2 text-[rgb(var(--c-text)/0.8)] hover:text-gold transition-colors rounded-full hover:bg-[rgb(var(--c-surface)/0.1)]"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="font-display text-xl sm:text-2xl tracking-wide text-gold shrink-0 hover:opacity-80 transition-opacity">
            FurqanStore
          </Link>

          <nav className="hidden lg:flex gap-6 text-sm font-medium text-[rgb(var(--c-text)/0.7)]">
            {NAV_LINKS.map((l) => (
              <Link 
                key={l.label} 
                to={l.to} 
                className={`hover:text-gold transition-colors py-1 ${location.pathname === l.to.split('?')[0] && !location.search ? 'text-gold border-b border-gold/50' : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            
            <Link to="/cart" className="relative shrink-0 text-[rgb(var(--c-text)/0.8)] hover:text-gold transition-colors p-1" aria-label="Cart">
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-ink text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center animate-scaleIn shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
            
            {user && (
              <div className="p-1">
                <NotificationBell />
              </div>
            )}
            
            {user ? (
              <div className="hidden sm:flex items-center gap-4 border-l border-[rgb(var(--c-border)/0.2)] pl-4 ml-1">
                <Link to={accountPath} className="flex items-center gap-2 text-sm font-medium hover:text-gold transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[rgb(var(--c-surface)/0.1)] border border-[rgb(var(--c-border)/0.2)] flex items-center justify-center">
                    <User size={14} />
                  </div>
                  <span className="truncate max-w-[100px]">{user.fullName.split(" ")[0]}</span>
                </Link>
                <button onClick={handleLogout} className="text-xs text-[rgb(var(--c-text)/0.5)] hover:text-red-400 transition-colors">Log out</button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs sm:text-sm px-5 py-2 rounded-full bg-gold text-ink font-medium hover:shadow-lg hover:shadow-gold/20 transition-all whitespace-nowrap hidden sm:block"
              >
                Sign In
              </Link>
            )}
            
            {user && (
              <Link to={accountPath} className="sm:hidden p-1 text-[rgb(var(--c-text)/0.8)] hover:text-gold transition-colors" aria-label="Account">
                <User size={22} />
              </Link>
            )}
          </div>
        </div>

        <div 
          className={`lg:hidden absolute top-full left-0 right-0 bg-[rgb(var(--c-bg))] border-b border-[rgb(var(--c-border)/0.1)] shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${
            menuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="px-6 py-4 flex flex-col gap-4 text-sm text-[rgb(var(--c-text)/0.8)]">
            {NAV_LINKS.map((l) => (
              <Link key={l.label} to={l.to} className="py-2 border-b border-[rgb(var(--c-border)/0.05)] hover:text-gold transition-colors font-medium">
                {l.label}
              </Link>
            ))}
            {!user && (
              <Link to="/login" className="py-2 text-gold font-medium">Sign In / Register</Link>
            )}
            {user && (
              <button
                onClick={handleLogout}
                className="text-left py-2 text-red-400/80 hover:text-red-400 font-medium"
              >
                Log Out
              </button>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-[rgb(var(--c-border)/0.1)] mt-2">
              <span className="text-[rgb(var(--c-text)/0.6)] font-medium">Theme</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="relative mt-auto pt-16 pb-8 border-t border-[rgb(var(--c-border)/0.1)] overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-12">
            <div className="lg:col-span-2">
              <Link to="/" className="font-display text-2xl text-gold mb-4 inline-block">FurqanStore</Link>
              <p className="text-sm text-[rgb(var(--c-text)/0.6)] leading-relaxed max-w-sm mb-6">
                A premium multi-vendor marketplace curating the finest electronics, fashion, and lifestyle products for discerning customers.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-9 h-9 rounded-full border border-[rgb(var(--c-border)/0.2)] flex items-center justify-center text-[rgb(var(--c-text)/0.6)] hover:border-gold hover:text-gold transition-colors">
                  <Facebook size={16} />
                </a>
                <a href="#" className="w-9 h-9 rounded-full border border-[rgb(var(--c-border)/0.2)] flex items-center justify-center text-[rgb(var(--c-text)/0.6)] hover:border-gold hover:text-gold transition-colors">
                  <Twitter size={16} />
                </a>
                <a href="#" className="w-9 h-9 rounded-full border border-[rgb(var(--c-border)/0.2)] flex items-center justify-center text-[rgb(var(--c-text)/0.6)] hover:border-gold hover:text-gold transition-colors">
                  <Instagram size={16} />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-[rgb(var(--c-text))] mb-4 uppercase tracking-wider text-xs">Shop Categories</h3>
              <ul className="space-y-3 text-sm text-[rgb(var(--c-text)/0.6)]">
                <li><Link to="/products" className="hover:text-gold transition-colors">All Products</Link></li>
                <li><Link to="/products?category=electronics" className="hover:text-gold transition-colors">Electronics</Link></li>
                <li><Link to="/products?category=fashion" className="hover:text-gold transition-colors">Fashion</Link></li>
                <li><Link to="/products?sort=rating" className="hover:text-gold transition-colors">Trending Now</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-[rgb(var(--c-text))] mb-4 uppercase tracking-wider text-xs">Account</h3>
              <ul className="space-y-3 text-sm text-[rgb(var(--c-text)/0.6)]">
                {user ? (
                  <>
                    <li><Link to={accountPath} className="hover:text-gold transition-colors">My Dashboard</Link></li>
                    <li><Link to="/account/orders" className="hover:text-gold transition-colors">Order History</Link></li>
                    <li><Link to="/wishlist" className="hover:text-gold transition-colors">Wishlist</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/login" className="hover:text-gold transition-colors">Sign In</Link></li>
                    <li><Link to="/register" className="hover:text-gold transition-colors">Create Account</Link></li>
                  </>
                )}
                <li><Link to="/register?role=VENDOR" className="hover:text-gold transition-colors text-gold/80">Become a Vendor</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-[rgb(var(--c-text))] mb-4 uppercase tracking-wider text-xs">Support</h3>
              <ul className="space-y-3 text-sm text-[rgb(var(--c-text)/0.6)]">
                <li><Link to="/contact" className="hover:text-gold transition-colors">Contact Us</Link></li>
                <li><a href="#" className="hover:text-gold transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Shipping Policy</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Returns & Exchanges</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-[rgb(var(--c-border)/0.1)] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[rgb(var(--c-text)/0.4)]">
            <p>&copy; {new Date().getFullYear()} FurqanStore. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-[rgb(var(--c-text)/0.8)] transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-[rgb(var(--c-text)/0.8)] transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

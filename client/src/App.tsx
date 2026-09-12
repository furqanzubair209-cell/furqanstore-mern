import { Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import Landing from "./pages/Landing";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Contact from "./pages/Contact";
import CustomerOrders from "./pages/CustomerOrders";
import Wishlist from "./pages/Wishlist";
import Addresses from "./pages/Addresses";
import VendorDashboard from "./pages/VendorDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/account" element={<CustomerOrders />} />
          <Route path="/account/orders/:id" element={<CustomerOrders />} />
          <Route path="/account/addresses" element={<Addresses />} />
          <Route path="/wishlist" element={<Wishlist />} />
        </Route>

        <Route element={<ProtectedRoute roles={["VENDOR"]} />}>
          <Route path="/vendor" element={<VendorDashboard />} />
        </Route>

        <Route element={<ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<div className="text-center py-32 text-[rgb(var(--c-text)/0.5)]">Page not found.</div>} />
      </Route>
    </Routes>
  );
}

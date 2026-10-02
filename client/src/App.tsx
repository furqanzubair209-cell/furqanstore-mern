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
import CustomerDashboard from "./pages/CustomerDashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import VendorDashboard from "./pages/VendorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ToastContainer from "./components/Toast";

export default function App() {
  return (
    <>
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
            <Route path="/account" element={<CustomerDashboard />} />
            <Route path="/account/orders" element={<CustomerDashboard />} />
            <Route path="/account/orders/:id" element={<CustomerDashboard />} />
            <Route path="/account/addresses" element={<CustomerDashboard />} />
            <Route path="/account/wishlist" element={<CustomerDashboard />} />
            <Route path="/account/profile" element={<CustomerDashboard />} />
            <Route path="/wishlist" element={<CustomerDashboard />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
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
      <ToastContainer />
    </>
  );
}

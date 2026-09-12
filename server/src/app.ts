import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import vendorRoutes from "./routes/vendor.routes";
import adminRoutes from "./routes/admin.routes";
import contactRoutes from "./routes/contact.routes";
import accountRoutes from "./routes/account.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());
// Credentialed CORS locked to the configured client origin — the old
// project's `Access-Control-Allow-Origin: *` alongside session cookies
// was a real vulnerability; it is not repeated here.
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const globalLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300 });
app.use(globalLimiter);

app.get("/api/health", (_req, res) => res.json({ success: true, message: "FurqanStore API is running" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/account", accountRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

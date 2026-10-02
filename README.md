<div align="center">

# 🛒 FurqanStore

### A multi-vendor marketplace with transaction-safe checkout, a commission engine, and realtime notifications

React + TypeScript storefront · Express + Prisma + MySQL API · Stripe (test mode) · Socket.IO

<br>

![Node](https://img.shields.io/badge/Node.js-20%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square&logo=mysql&logoColor=white)
![Tests](https://img.shields.io/badge/tests-Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)

<br>

![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-433E38?style=for-the-badge)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge)

![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)

<br>

[Overview](#-overview) · [Features](#-features) · [Screenshots](#-screenshots) · [How It Works](#-how-it-works) · [Getting Started](#-getting-started) · [API](#-api-overview) · [Deployment](#-deployment) · [Limitations](#-known-limitations)

</div>

---

## 📖 Overview

FurqanStore is a full-stack marketplace with four account types. **Customers** browse and buy, **vendors** submit products and earn revenue minus a platform commission, and **admins** approve vendors and products, manage orders, set the commission rate, and view reports.

It is a TypeScript rewrite of an earlier PHP/MySQL version. The concepts were kept (roles, products, cart, orders, vendor earnings, approvals, reports) while several security and correctness bugs from the original were fixed. See [Bugs Fixed from the PHP Version](#-bugs-fixed-from-the-php-version).

Prices are displayed in **Rs.** and Stripe sessions are created in **PKR**.

---

## ✨ Features

### 🛍️ Customers
- Browse the catalog with category filter, search, sorting (newest, price, rating) and pagination
- Quick-view modal on product cards and a full product detail page
- Cart with stock-aware quantity limits
- Three-step checkout (**Shipping → Payment → Review**) with saved-address autofill
- Pay by **Cash on Delivery** or **card via Stripe Checkout**
- Account area with tabs for **Overview, Orders, Addresses, Wishlist, and Profile** (including password change)
- Notification bell with unread count, updated live over Socket.IO
- Dark / light theme toggle, remembered between visits

### 🏪 Vendors
- Register as a vendor, then wait for admin approval (pending vendors cannot log in)
- Submit products, which start as `PENDING` until an admin approves them
- Edit or delete own products, and switch approved products between `ACTIVE` and `INACTIVE`
- Dashboard with total, pending and completed earnings, commission paid, units sold, and a 14-day earnings chart
- See orders containing their products and update the order status
- Live "new order" and "status changed" updates

### 🛡️ Admins
Six-tab dashboard: **Overview, Orders, Products, Vendors, Users, Commission**.
- Platform stats (revenue, commission, orders, vendors, customers, products)
- Approve pending vendors, and approve or reject pending products
- Update order status, and suspend or reactivate users (with a role filter)
- Set the commission rate and view its change history
- Vendor performance report with chart
- **CSV export** for orders, users and vendor performance

### ⚙️ Platform
- Transaction-safe checkout with row-level stock locking
- Commission rate history, with each order item storing the rate and amount used at purchase time
- Automatic stock handling: `LOW_STOCK` badge at 5 units or fewer, `OUT_OF_STOCK` at zero, and stock restored on cancellation
- Contact form (messages stored in the database; admins can list them through the API)

---

## 🖼️ Screenshots

### Storefront

<table>
  <tr>
    <td width="50%"><img src="images/1.png" alt="Landing page"><br><sub><b>Landing page</b></sub></td>
    <td width="50%"><img src="images/2.png" alt="Catalog, dark theme"><br><sub><b>Catalog (dark theme)</b></sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="images/3.png" alt="Catalog, light theme"><br><sub><b>Catalog (light theme)</b></sub></td>
    <td width="50%"><img src="images/14.png" alt="Quick view modal"><br><sub><b>Product quick view</b></sub></td>
  </tr>
</table>

### Authentication

<table>
  <tr>
    <td width="50%"><img src="images/4.png" alt="Sign in"><br><sub><b>Sign in</b></sub></td>
    <td width="50%"><img src="images/5.png" alt="Create account"><br><sub><b>Create account: "I want to shop" or "I want to sell"</b></sub></td>
  </tr>
</table>

### Cart & Checkout

<table>
  <tr>
    <td width="50%"><img src="images/15.png" alt="Cart"><br><sub><b>Cart</b></sub></td>
    <td width="50%"><img src="images/16.png" alt="Checkout, shipping step"><br><sub><b>Step 1: Shipping</b></sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="images/17.png" alt="Checkout, payment step"><br><sub><b>Step 2: Payment (Card or Cash on Delivery)</b></sub></td>
    <td width="50%"><img src="images/18.png" alt="Checkout, review step"><br><sub><b>Step 3: Review and place order</b></sub></td>
  </tr>
</table>

### Admin Dashboard

<table>
  <tr>
    <td width="50%"><img src="images/6.png" alt="Admin overview"><br><sub><b>Overview and pending vendor approvals</b></sub></td>
    <td width="50%"><img src="images/7.png" alt="Admin orders"><br><sub><b>Orders with status control and CSV export</b></sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="images/8.png" alt="Admin users"><br><sub><b>User management</b></sub></td>
    <td width="50%"><img src="images/9.png" alt="Commission settings"><br><sub><b>Commission rate and history</b></sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="images/10.png" alt="Vendor performance"><br><sub><b>Vendor performance report</b></sub></td>
    <td width="50%"></td>
  </tr>
</table>

### Vendor Dashboard

<table>
  <tr>
    <td width="50%"><img src="images/11.png" alt="Vendor earnings overview"><br><sub><b>Earnings overview</b></sub></td>
    <td width="50%"><img src="images/12.png" alt="Vendor products"><br><sub><b>Product management</b></sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="images/13.png" alt="Vendor recent orders"><br><sub><b>Recent orders and earnings per order</b></sub></td>
    <td width="50%"></td>
  </tr>
</table>

---

## 🧠 How It Works

### System overview

```mermaid
flowchart LR
    subgraph Client["React SPA (Vite)"]
      UI[Pages & components]
      RQ[TanStack Query]
      ZS[Zustand: auth, theme, toast]
    end

    subgraph Server["Express API (TypeScript)"]
      R[Routes] --> M["Middleware<br/>JWT · role guards · Zod"]
      M --> C[Controllers]
      C --> S["Services<br/>order · commission · stripe · notification"]
      WS[Socket.IO]
    end

    DB[(MySQL via Prisma)]
    ST[Stripe]

    UI --> RQ -->|"REST + Bearer token"| R
    UI <-->|WebSocket| WS
    S --> DB
    S <--> ST
    ST -->|webhook| R
```

### Checkout and commission

Checkout runs in a single Prisma transaction. For every cart line it locks the product row (`SELECT … FOR UPDATE`), then re-checks that the product is `ACTIVE` and that enough stock remains, regardless of what the customer saw on the page.

```mermaid
flowchart TD
    A["Customer places order"] --> B["BEGIN transaction"]
    B --> C["Lock each product row<br/>SELECT ... FOR UPDATE"]
    C --> D{"Active and<br/>enough stock?"}
    D -- No --> E["Roll back, return error"]
    D -- Yes --> F["Read active commission rate"]
    F --> G["Create order + items<br/>store rate, commission, vendor earning"]
    G --> H["Decrement stock, set badge/status<br/>clear cart"]
    H --> I["COMMIT"]
    I --> J["Socket.IO + stored notifications<br/>to vendors and admins"]
```

- **Commission** is `gross × rate`; the vendor earns the rest. The rate is stored on every `OrderItem`, so changing it later never rewrites history.
- **Order status** starts as `PENDING` for Cash on Delivery and `PROCESSING` for card payments.
- **Delivered** marks vendor earnings `COMPLETED`; **Cancelled** marks them `CANCELLED` and puts the stock back. A cancelled order cannot be changed again.

### Stripe payment flow

1. The client sends the shipping address to `POST /api/payments/create-checkout-session` and is redirected to Stripe.
2. The order is created **after** payment succeeds, by either the signed webhook (`checkout.session.completed`) or the `/payment/success` page calling `verify-session`.
3. Both paths use the same `placeOrder` function, and the Stripe session id is unique on `Order`, so whichever runs second returns the existing order instead of creating a duplicate.

> [!IMPORTANT]
> The server only accepts **test-mode** Stripe keys (`sk_test_...`). Anything else is rejected with an error. This is a demo/portfolio setup and not production payments.

### Auth and sessions

- Short-lived **access token** (JWT, default 15 min) sent as `Authorization: Bearer`.
- **Refresh token** (JWT, default 7 days) kept in an `httpOnly` cookie named `fs_refresh`, scoped to `/api/auth`. Only its SHA-256 hash is stored in the database, and it is rotated on every refresh.
- The client silently refreshes once on a `401`, then logs out if that fails.
- Sockets authenticate with the access token; each user joins a private room, and admins also join an `admins` room.

### Roles

| Role | What they can do |
|---|---|
| `CUSTOMER` | Shop, manage cart, orders, addresses, wishlist, profile |
| `VENDOR` | Everything under `/api/vendor`, plus status updates on orders containing their items |
| `ADMIN` | Everything under `/api/admin`, plus status updates on any order |
| `SUPER_ADMIN` | Same permissions as `ADMIN` in the current code |

All role checks happen on the server. The client only hides UI for convenience.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand (persisted), React Router, React Hook Form, Recharts, Lucide icons, `fetch`-based API client |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, Zod |
| **Database** | MySQL 8 (full-text index on product name and description) |
| **Realtime** | Socket.IO |
| **Payments** | Stripe Checkout (test mode, PKR) |
| **Security** | bcrypt (cost 12), JWT, Helmet, CORS locked to `CLIENT_URL`, `express-rate-limit` |
| **Testing** | Vitest, Testing Library, jsdom |

---

## 📁 Project Structure

```text
furqanstore-mern/
├── client/                      # React + Vite app
│   └── src/
│       ├── api/                 # API wrappers (auth, product, cart, order, account, payment)
│       ├── components/          # Toast, QuickViewModal, WishlistButton, NotificationBell, ThemeToggle
│       ├── layouts/             # MainLayout
│       ├── lib/                 # socket client, CSV export helpers
│       ├── pages/               # Landing, Products, ProductDetail, Cart, Checkout, dashboards, auth, payment result
│       ├── routes/              # ProtectedRoute (login + role gating)
│       └── store/               # auth, theme, toast
├── server/                      # Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma        # 12 models
│   │   └── seed.ts              # demo users, 14 categories, 20 products
│   ├── src/
│   │   ├── routes/              # auth, products, cart, orders, vendor, admin, account, payments, contact
│   │   ├── controllers/
│   │   ├── services/            # order (checkout txn), commission, stripe, notification
│   │   ├── middleware/          # auth + role guards, Zod validation, error handler
│   │   ├── sockets/             # Socket.IO setup and emit helpers
│   │   └── utils/
│   └── tests/                   # Vitest unit tests
├── docs/                        # API, ARCHITECTURE, DATABASE, DEPLOYMENT, MIGRATION
└── images/                      # README screenshots
```

**Data models:** `User`, `RefreshToken`, `Address`, `Category`, `Product`, `CartItem`, `Order`, `OrderItem`, `CommissionSetting`, `ContactMessage`, `Wishlist`, `Notification`.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** and npm
- **MySQL 8** running locally or hosted
- *(Optional)* a Stripe account in **test mode** for card payments. Cash on Delivery works without it.

### 1. Clone

```bash
git clone https://github.com/furqanzubair209-cell/furqanstore-mern.git
cd furqanstore-mern
```

### 2. Backend

```bash
cd server
npm install
```

Create `server/.env` (there is no `.env.example` in the repo yet):

```env
DATABASE_URL="mysql://user:password@localhost:3306/furqanstore"
PORT=5000
CLIENT_URL="http://localhost:5173"

JWT_ACCESS_SECRET="use-a-long-random-string"
JWT_REFRESH_SECRET="use-a-different-long-random-string"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

DEFAULT_COMMISSION_RATE=10

# Only needed for card payments (test mode keys only)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Create the database first (for example `CREATE DATABASE furqanstore;`), then:

```bash
npm run db:push          # create tables from schema.prisma
npm run prisma:seed      # demo accounts, categories, products
npm run dev              # API on http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

### 3. Frontend

```bash
cd client
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm install
npm run dev              # app on http://localhost:5173
```

### 🔑 Demo accounts

The seed creates four accounts, all with the password **`Password123!`**:

| Role | Email |
|---|---|
| Super Admin | `superadmin@furqanstore.com` |
| Admin | `admin@furqanstore.com` |
| Vendor (store "Nike Store") | `vendor@furqanstore.com` |
| Customer | `customer@furqanstore.com` |

The seed also creates a 10% commission rate, 14 categories and 20 active products owned by the demo vendor.

> [!WARNING]
> For local development and demos only. Never seed these accounts into a real production database.

### 💳 Testing card payments locally

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

Copy the `whsec_...` secret it prints into `STRIPE_WEBHOOK_SECRET`, then pay with Stripe's test card `4242 4242 4242 4242`. Even without the webhook running, the success page verifies the session and creates the order.

### 🧪 Tests

```bash
cd server && npm test    # JWT, password hashing, auth middleware, Zod validation, commission math
cd client && npm test    # WishlistButton, theme store, CSV helpers
```

### Useful scripts

| Where | Command | Purpose |
|---|---|---|
| `server` | `npm run dev` | API with hot reload (`tsx watch`) |
| `server` | `npm run build` / `npm start` | Compile to `dist/` and run it |
| `server` | `npm run db:push` | Sync schema to the database |
| `server` | `npm run prisma:seed` | Load demo data |
| `client` | `npm run dev` | Vite dev server |
| `client` | `npm run build` | Type-check and production build |

---

## 🔌 API Overview

Base URL: `http://localhost:5000/api`. Every response uses the same envelope:

```json
{ "success": true, "message": "Success", "data": {} }
```

| Group | Prefix | Access | Highlights |
|---|---|---|---|
| Auth | `/auth` | Public, `/me` needs login | register, login, refresh, logout, me. Register/login limited to 20 requests per 15 min |
| Products | `/products` | Public | list (`category`, `vendor`, `search`, `sort`, `minPrice`, `maxPrice`, `page`, `limit`), categories, detail |
| Cart | `/cart` | Login | get, add, update quantity, remove |
| Orders | `/orders` | Login | place order, my orders, order detail, status update (vendor/admin only) |
| Payments | `/payments` | Login (webhook is public) | create Stripe session, verify session, webhook |
| Account | `/account` | Login | profile, password, addresses, wishlist, notifications |
| Vendor | `/vendor` | Vendor | stats, product list/create/update/delete, orders |
| Admin | `/admin` | Admin | stats, users, vendor approval, products, orders, commission, vendor-performance report |
| Contact | `/contact` | Public to send, admin to read | contact form |
| Health | `/health` | Public | liveness check |

A global limit of 300 requests per minute also applies. Full request and response details: **[docs/API.md](docs/API.md)**.

More documentation: [Architecture](docs/ARCHITECTURE.md) · [Database](docs/DATABASE.md) · [Deployment](docs/DEPLOYMENT.md) · [Migration](docs/MIGRATION.md)

---

## 🐛 Bugs Fixed from the PHP Version

| Original issue | Fix in this version |
|---|---|
| Hardcoded 10% commission | `CommissionSetting` table; every `OrderItem` stores the rate and amount used |
| `Access-Control-Allow-Origin: *` with session cookies | CORS locked to `CLIENT_URL` with `credentials: true` |
| Mixed password hashing (raw MD5 and bcrypt) | bcrypt (cost 12) everywhere |
| Stock race condition (non-atomic check and decrement) | `SELECT … FOR UPDATE` row locks inside one Prisma transaction |
| No re-validation of product status or stock at order time | Re-checked against the locked row |
| DB credentials duplicated in source files | Single `DATABASE_URL` environment variable |
| Missing RBAC on some admin and vendor actions | Every such route runs through `requireAuth` plus a role guard on the server |

---

## 🌐 Deployment

| Piece | Suggested host |
|---|---|
| **Frontend** | Netlify or Vercel. Root `client/`, build `npm run build`, publish `dist/` |
| **Backend** | Render (or similar) web service. Root `server/`, build `npm install && npm run build && npx prisma generate`, start `npm start` |
| **Database** | Railway, Aiven or any MySQL 8 host |

1. Create the MySQL database and set `DATABASE_URL`.
2. Deploy `server/` with the environment variables from the setup section. Run `npx prisma db push` once (the repo has no migration files yet, so `migrate deploy` has nothing to apply).
3. Deploy `client/` with `VITE_API_URL=https://<api-host>/api`.
4. Set `CLIENT_URL` on the server to the exact frontend origin.
5. For card payments, add `https://<api-host>/api/payments/webhook` as a Stripe webhook for `checkout.session.completed`.

> [!WARNING]
> **Cross-site cookies:** the refresh cookie is `httpOnly`, `Secure` in production and `SameSite=Lax`. If the frontend and API are on unrelated domains (for example `*.netlify.app` and `*.onrender.com`), the browser will not send it on API calls, so silent token refresh will fail and users get logged out when the 15-minute access token expires. Serve both from subdomains of the same parent domain, or change the cookie to `SameSite=None; Secure` in `auth.controller.ts`.

> [!NOTE]
> Socket.IO events are emitted in-process, so run **a single server instance** unless you add the Socket.IO Redis adapter. The reverse proxy must forward WebSocket upgrades on `/socket.io/`.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for more.

---


## 🤝 Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: your change"`
4. Push the branch and open a Pull Request

Please run `npm test` in both `client/` and `server/` before submitting.

---

## 📄 License

No license file is included yet. Add a `LICENSE` file to the repository root (for example MIT) to state how others may use this code.

---

<div align="center">

**🛒 FurqanStore** · Browse • Sell • Earn • Track

⭐ If you find this project useful, consider giving it a star.

</div>

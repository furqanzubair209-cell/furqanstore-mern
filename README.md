# FurqanStore — MERN Migration

Migrated from the original PHP/MySQL FurqanStore into a modern stack:

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + TanStack Query + Zustand + React Router
- **Backend**: Node.js + Express + TypeScript + Prisma ORM
- **Database**: MySQL (schema in `server/prisma/schema.prisma`)
- **Realtime**: Socket.IO for vendor/admin order + commission notifications

## What was preserved from the old project

Roles (`CUSTOMER`, `VENDOR`, `ADMIN`, `SUPER_ADMIN`), products/categories/cart/orders/order_items,
vendor earnings with a commission split, vendor approval flow, admin reports, and the
stock-triggers concept (out_of_stock / low_stock badges) — all reimplemented in `server/src`.

## Bugs found in the original PHP project and fixed here

- **Hardcoded 10% commission** in `place-order.php` → replaced with a `CommissionSetting` table;
  every `OrderItem` snapshots the rate/amount used at order time, so changing the rate never
  rewrites history.
- **`Access-Control-Allow-Origin: *` combined with session cookies** → CORS is now locked to
  `CLIENT_URL` with `credentials: true`.
- **Mixed password hashing** (some users had raw MD5 hashes, others bcrypt) → all passwords are
  bcrypt (cost 12) end to end; login recognizes only that format.
- **Race condition on stock**: the old trigger checked stock in one statement and decremented in
  another, non-atomically. The new checkout uses `SELECT ... FOR UPDATE` row locks inside a single
  Prisma transaction, so two simultaneous orders on the last unit can't both succeed.
- **No re-validation of product status/stock at order time** → checkout now re-checks status and
  stock against the locked row, not against whatever was last fetched on the product page.
- **Duplicated DB credentials** hardcoded directly inside `api/orders/place-order.php` → single
  `DATABASE_URL` env var used everywhere via Prisma.
- **No RBAC enforcement on some admin/vendor actions** → every admin/vendor route runs through
  `requireAuth` + `requireRole` middleware on the server; nothing is authorized by hiding UI.

## Project structure

```
furqanstore-mern/
├── server/                  # Express + Prisma API
│   ├── prisma/schema.prisma # Database schema
│   ├── prisma/seed.ts       # Demo accounts + sample products
│   └── src/
│       ├── routes/          # auth, products, cart, orders, vendor, admin, contact
│       ├── controllers/
│       ├── services/        # commission.service.ts, order.service.ts (the checkout transaction)
│       ├── middleware/      # auth (JWT + RBAC), error handling, validation
│       └── sockets/         # Socket.IO room-based realtime events
└── client/                  # React + Vite storefront + dashboards
    └── src/
        ├── api/             # axios wrappers per resource
        ├── pages/           # Landing, Products, Cart, Checkout, dashboards, auth
        ├── layouts/, routes/, store/
```

## Local setup

**Database**: create a MySQL 8 database locally, or use a free hosted one (see below).

```bash
# 1. Backend
cd server
cp .env.example .env      # fill in DATABASE_URL, JWT secrets, CLIENT_URL
npm install
npm run db:push           # creates tables from schema.prisma
npm run prisma:seed       # demo accounts (password: Password123!) + sample products
npm run dev                # http://localhost:5000

# 2. Frontend
cd ../client
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm install
npm run dev                # http://localhost:5173
```

Demo logins after seeding (all use `Password123!`):
- `superadmin@furqanstore.com`
- `admin@furqanstore.com`
- `vendor@furqanstore.com`
- `customer@furqanstore.com`

## Free-hosting deployment

| Piece      | Recommended free option                          |
|------------|---------------------------------------------------|
| Frontend   | Netlify or Vercel — connect the `client/` folder, build command `npm run build`, publish `dist/` |
| Backend    | Render free web service — root `server/`, build `npm install && npm run build && npx prisma generate`, start `npm start` |
| Database   | Railway free MySQL, or Aiven free MySQL plan       |

Steps:
1. Push this repo to GitHub.
2. Create the MySQL database on Railway/Aiven, copy its connection string into `DATABASE_URL`.
3. Deploy `server/` to Render as a Web Service; set all `.env.example` variables in Render's
   dashboard; run `npx prisma migrate deploy` (or `db push`) once via Render's shell, then
   `npx tsx prisma/seed.ts` if you want demo data.
4. Deploy `client/` to Netlify; set `VITE_API_URL` to your Render backend's URL + `/api`.
5. Set `CLIENT_URL` on the backend to your Netlify URL (needed for CORS and cookies).

Render's free tier supports WebSockets, so Socket.IO works without a fallback — but if you land on
a host that doesn't, TanStack Query's `refetchInterval` on the dashboard queries is a one-line
substitute (not wired in by default here, to keep sockets as the primary path).

## What's included vs. what's left as follow-up work

Included and working end-to-end: auth (JWT access + rotating httpOnly refresh cookie), RBAC,
product catalog with filters/search/pagination, cart, transaction-safe checkout with row-level
stock locking, the commission engine (rate history + frozen per-order snapshots), vendor product
submission + approval flow, vendor/admin dashboards with real aggregated figures, order status
updates with realtime push, contact form.

Not built out in this pass (the original request's scope — full design-system component library,
charts on every dashboard panel, order-status-history timeline UI, wishlist, address book UI,
notification center UI, CSV export on reports, dark/light theme toggle): the backend already has
the data model and endpoints to support most of these; they're straightforward additions once you
tell me which to prioritize.

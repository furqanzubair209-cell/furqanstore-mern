# API Reference

Base URL: `${VITE_API_URL}` on the client, defaulting to `http://localhost:5000/api`.

All responses share this envelope:

```json
{ "success": true, "message": "Success", "data": { } }
```

Errors:

```json
{ "success": false, "message": "Something went wrong", "errors": null }
```

Authenticated requests send `Authorization: Bearer <accessToken>`. The refresh token travels
only as an httpOnly cookie set by `/auth/login` and `/auth/register` — it is never present in a
JSON body.

Role legend: **Public** (no auth), **Auth** (any logged-in user), **Vendor**, **Admin**
(ADMIN or SUPER_ADMIN).

## Auth — `/auth`

| Method | Path | Access | Body | Notes |
|---|---|---|---|---|
| POST | `/register` | Public | `{ fullName, email, phone, password, role?, vendorName? }` | `role` is `CUSTOMER` or `VENDOR`. Vendors are created with `status: PENDING` and do not receive a session until an admin approves them. Rate-limited (20 / 15 min). |
| POST | `/login` | Public | `{ email, password }` | Returns `{ accessToken, user }` and sets the refresh cookie. Rate-limited (20 / 15 min). |
| POST | `/refresh` | Public (cookie) | — | Reads the refresh cookie, rotates it, returns a new `accessToken`. |
| POST | `/logout` | Public | — | Clears the refresh cookie and revokes the stored token hash. |
| GET | `/me` | Auth | — | Returns the current user profile. |

## Products — `/products`

| Method | Path | Access | Query / Body | Notes |
|---|---|---|---|---|
| GET | `/` | Public | `category, sort, search, page, limit` | `sort` in `price_asc`, `price_desc`, `rating`, default newest. Paginated: `{ items, totalPages }`. |
| GET | `/categories` | Public | — | Categories with product counts. |
| GET | `/:id` | Public | — | Full product detail including vendor and category. |

## Cart — `/cart` (Auth)

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/` | — | Current user's cart items with product data. |
| POST | `/` | `{ productId, quantity }` | Adds or increments a line item. |
| PATCH | `/:id` | `{ quantity }` | Updates quantity of a cart item by its own id. |
| DELETE | `/:id` | — | Removes a cart item. |

## Orders — `/orders` (Auth)

| Method | Path | Access | Body | Notes |
|---|---|---|---|---|
| POST | `/` | Auth | `{ shippingAddress, paymentMethod }` | Atomic checkout — see `ARCHITECTURE.md`. Clears the cart on success. |
| GET | `/` | Auth | — | Current user's own orders. |
| GET | `/:id` | Auth | — | Single order detail (must belong to the requester). |
| PATCH | `/:id/status` | Vendor/Admin | `{ status }` | `status` in `PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED`. |

## Vendor — `/vendor` (Vendor role, approved)

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/stats` | — | Earnings summary (total / pending / completed / commission paid), units sold, product count. |
| GET | `/products` | — | Vendor's own product listings. |
| POST | `/products` | `{ name, price, stock, imageUrl?, description? }` | Created with `status: PENDING`, awaiting admin approval. |
| PATCH | `/products/:id` | Partial product fields | Vendor may only edit their own products. |
| DELETE | `/products/:id` | — | Removes a vendor's own product. |
| GET | `/orders` | — | Order items belonging to this vendor across all orders. |

## Admin — `/admin` (Admin role)

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/stats` | — | Platform-wide totals (users, vendors, customers, products, orders, revenue, commission, pending vendor approvals). |
| GET | `/users` | Query: `role?` | All users, optionally filtered by role. |
| PATCH | `/users/:id/status` | `{ status }` | `status` in `ACTIVE, PENDING, SUSPENDED`. Used for the Users tab's suspend/reactivate action; also emits a socket event and a notification to the affected user. |
| GET | `/vendors/pending` | — | Vendors awaiting approval. |
| PATCH | `/vendors/:id/approve` | — | Approves a vendor (`status -> ACTIVE`), notifies them. |
| GET | `/products` | Query: `status?` | All products, optionally filtered by status. |
| PATCH | `/products/:id/status` | `{ status }` | Moderation — approve/reject a listing. |
| GET | `/orders` | — | Most recent 100 orders platform-wide. |
| GET | `/commission` | — | Current active rate plus rate change history. |
| PATCH | `/commission` | `{ rate }` | 0-100. Deactivates the previous rate row and creates a new active one; does not touch past orders. |
| GET | `/reports/vendor-performance` | — | Per-vendor units sold, gross, commission, earnings, grouped from `OrderItem`. |

CSV export (Orders, Vendor performance, Users) is generated client-side from these same
responses — there is no dedicated `/export` endpoint.

## Account — `/account` (Auth)

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/addresses` | — | Saved shipping addresses. |
| POST | `/addresses` | `{ label?, line1, city, isDefault? }` | |
| PATCH | `/addresses/:id` | Partial | |
| DELETE | `/addresses/:id` | — | |
| GET | `/wishlist` | — | Wishlisted products. |
| POST | `/wishlist/:productId` | — | |
| DELETE | `/wishlist/:productId` | — | |
| GET | `/notifications` | — | `{ notifications, unreadCount }`. |
| PATCH | `/notifications/:id/read` | — | |
| PATCH | `/notifications/read-all` | — | |

## Contact — `/contact`

| Method | Path | Access | Body | Notes |
|---|---|---|---|---|
| POST | `/` | Public | `{ name, email, subject?, message }` | Stores a `ContactMessage`. |
| GET | `/` | Admin | — | List all contact messages. |

## Misc

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | Liveness check. |

## Socket.IO events

Connects with the same JWT. Server -> client events used by the dashboards:

- `vendor:new-order`, `order:status-changed` -> vendor dashboard refetches stats/orders.
- `admin:new-order` -> admin dashboard refetches stats/orders/pending vendors.
- `account:approved`, `account:status-changed` -> fired at a specific user (vendor approval,
  suspension/reactivation).
- `notification:new` -> any user, triggers a notification-list refetch.

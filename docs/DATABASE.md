# Database

MySQL, accessed exclusively through Prisma (`server/prisma/schema.prisma`). This document is a
guide to the schema, not a copy of it — see the schema file for exact field types and defaults.

## Entity overview

```
User ──< Product (as vendor)
User ──< CartItem >── Product
User ──< Order ──< OrderItem >── Product
                              └── vendor: User
User ──< Address
User ──< Wishlist >── Product
User ──< Notification
User ──< RefreshToken
User ──< CommissionSetting (as changedBy)
Category ──< Product
```

## `User`

One table for all three roles (`CUSTOMER`, `VENDOR`, `ADMIN`, `SUPER_ADMIN`) rather than
separate tables per role — vendor-specific fields (`vendorName`, `vendorBio`) are simply
nullable on rows that aren't vendors. This keeps auth, sessions, and addresses role-agnostic at
the cost of a few always-null columns on customer rows, which is the right trade at this scale.

`status` (`ACTIVE | PENDING | SUSPENDED`) does double duty:
- For vendors, `PENDING` means "awaiting admin approval" — they can register but not log in
  or list products until approved.
- For any user, `SUSPENDED` is set by an admin via `PATCH /admin/users/:id/status` and should be
  checked wherever login/session issuance happens.

## `Product`

- `status` (`ACTIVE | INACTIVE | PENDING | OUT_OF_STOCK`) is set to `PENDING` on vendor
  creation and only becomes `ACTIVE` after admin moderation (`PATCH /admin/products/:id/status`).
- `badge` is informational only (`NEW`, `HOT`, `SALE`, `BEST`, `LOW_STOCK`) — `LOW_STOCK` is set
  automatically by the order service when stock drops to 5 or below; `OUT_OF_STOCK` status is
  set automatically when stock hits 0.
- Full-text index on `(name, description)` backs the product search box.

## `Order` / `OrderItem`

An `Order` is the customer-facing unit (one shipping address, one payment method, one status
progression). `OrderItem` is per-product-per-vendor and carries its own **frozen** commission
figures: `commissionRate`, `commissionAmount`, `vendorEarning`, `grossAmount`. These are computed
once at checkout time from whatever `CommissionSetting` is active, and never recalculated —
that's what makes changing the platform commission rate safe to do at any time without
retroactively changing what a vendor already earned on a past sale.

`earningStatus` on `OrderItem` (`PENDING | COMPLETED | CANCELLED`) tracks payout state
independently of the order's own `status`, since an order can be `DELIVERED` while its payout is
still pending a settlement cycle.

## `CommissionSetting`

Append-only history table. `setCommissionRate()` (in `commission.service.ts`) deactivates the
current active row and inserts a new one in the same transaction — there is never more than one
`active: true` row. `getActiveCommissionRate()` is the only function that should be treated as
"the current rate."

## `Wishlist`, `Address`, `Notification`, `CartItem`

Straightforward join/ownership tables, each scoped to a `userId` with `onDelete: Cascade` so
deleting a user cleans up their cart, wishlist, addresses, and notifications. `CartItem` and
`Wishlist` both have a `@@unique([userId, productId])` constraint — adding an already-present
product updates/increments rather than duplicating a row.

## `RefreshToken`

Stores only `tokenHash` (SHA-256 of the actual refresh token), never the token itself. See
`ARCHITECTURE.md` for why.

## Migrations

```bash
# Generate a new migration from schema changes
npx prisma migrate dev --name <description>

# Apply pending migrations in production
npx prisma migrate deploy

# Regenerate the Prisma client after a schema change (also run by migrate dev)
npx prisma generate

# Seed reference/demo data
npm run prisma:seed
```

See `MIGRATION.md` for the specific steps needed to bring an existing deployment up to date with
the schema in this changeset (the `Wishlist` model in particular).

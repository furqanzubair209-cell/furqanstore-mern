# Architecture

## Overview

FurqanStore is a multi-vendor marketplace with three user roles — customer, vendor, and admin
(super admin and admin share the same permission tier) — sharing one codebase. It is a
conventional two-tier web app: a React single-page app talking to a REST API over HTTPS, plus a
Socket.IO channel for real-time push (new orders, status changes, notifications).

```
┌─────────────┐        HTTPS (REST)        ┌──────────────┐        SQL         ┌──────────┐
│   React SPA │ ─────────────────────────► │  Express API │ ─────────────────► │  MySQL   │
│  (Vite)     │ ◄───────────────────────── │  (Node/TS)   │ ◄───────────────── │ (Prisma) │
└─────────────┘        WebSocket (Socket.IO) └──────────────┘
```

## Client (`/client`)

- **Vite + React 18 + TypeScript.**
- **Routing:** `react-router-dom`, with `ProtectedRoute` gating authenticated and
  role-restricted routes (`/vendor`, `/admin`).
- **Server state:** `@tanstack/react-query` for all API data — caching, invalidation, and
  background refetch. There is no separate client-side data-fetching layer; every page calls
  a typed function from `src/api/*.ts` through `useQuery`/`useMutation`-style hooks.
- **Client state:** `zustand` with the `persist` middleware for the two pieces of state that
  need to survive a reload without a network round trip: `auth.store.ts` (access token + user
  profile) and `theme.store.ts` (dark/light preference).
- **Styling:** Tailwind CSS. Color is expressed through CSS custom properties
  (`--c-bg`, `--c-surface`, `--c-border`, `--c-text`) set on `[data-theme]` in `index.css`, so
  components use `bg-[rgb(var(--c-bg))]`-style arbitrary values instead of hardcoded colors.
  This is what makes the dark/light toggle a CSS-variable flip rather than a per-component
  conditional. `gold` and `ink` remain literal Tailwind colors — they're the brand accent and
  its always-dark counterpart text, and both are legible against either theme's background.
- **Real-time:** `src/lib/socket.ts` wraps a single Socket.IO client instance, connected only
  once a user is authenticated and disconnected on logout.

## Server (`/server`)

- **Express + TypeScript**, compiled with `tsc` for production, run with `tsx` in development.
- **Layering:**
  - `routes/*.ts` — path + middleware wiring only, no business logic.
  - `controllers/*.ts` — request/response handling, calls into services or Prisma directly for
    simple reads.
  - `services/*.ts` — logic that's non-trivial enough to need its own tests and reuse
    (`commission.service.ts`, `order.service.ts`, `notification.service.ts`).
  - `middleware/*.ts` — `auth` (JWT verification + role guards), `validate` (Zod schema
    validation), `errorHandler` (maps `AppError` and unexpected errors to a consistent JSON
    shape).
  - `utils/*.ts` — small stateless helpers (`jwt.ts`, `password.ts`, `AppError.ts`,
    `asyncHandler.ts`, `response.ts`).
- **Database access:** Prisma Client (`lib/prisma.ts`) is the only thing that talks to MySQL.
  The checkout path (`order.service.ts`) takes a row lock (`SELECT ... FOR UPDATE`) inside a
  Prisma transaction to prevent two concurrent checkouts from oversubscribing the same stock.
- **Real-time:** `sockets/io.ts` exposes `emitToUser`, `emitToAdmins`, and a Socket.IO server
  instance. Sockets authenticate with the same JWT used for the REST API.
- **Auth model:** short-lived JWT access tokens (returned in the response body, kept in memory /
  zustand-persisted storage on the client) plus a long-lived refresh token stored **only** in an
  httpOnly cookie and hashed before it's written to the `RefreshToken` table — so a leaked
  database dump can't be replayed as a live session, and a leaked access token expires quickly.

## Request lifecycle (typical authenticated write)

1. Client attaches `Authorization: Bearer <accessToken>` (axios interceptor in
   `client/src/api/client.ts`).
2. `requireAuth` middleware verifies the JWT and attaches `req.user`.
3. Role-specific middleware (`requireVendor`, `requireAdmin`, `requireRole(...)`) rejects if the
   role doesn't match.
4. `validate(schema)` (where present) parses `req.body`/`req.query`/`req.params` with Zod and
   400s on failure before the controller runs.
5. Controller calls a service or Prisma, wraps the result with `ok()`/`fail()` for a consistent
   `{ success, message, data }` envelope, and any side effects (notifications, socket emits) fire
   after the database transaction has committed.
6. `errorHandler` catches anything thrown (including `AppError`) and returns a JSON error instead
   of leaking a stack trace.

## Commission & earnings model

Every `OrderItem` snapshots `commissionRate`, `commissionAmount`, and `vendorEarning` at the
moment the order is placed, using whatever `CommissionSetting` row is currently `active`.
Changing the platform commission rate afterward never rewrites historical order items — it only
takes effect for orders placed after the change. See `DATABASE.md` for the schema and
`API.md` for the commission endpoints.

## Theming (dark/light)

- `client/index.html` sets `data-theme` on `<html>` synchronously (before React mounts) by
  reading the persisted `theme.store.ts` value out of `localStorage`, which avoids a flash of
  the wrong theme on load.
- `theme.store.ts` is the single source of truth at runtime; `ThemeToggle.tsx` is the only UI
  that mutates it.
- Chart colors (Recharts axis/grid/tooltip) aren't CSS and can't read CSS variables, so
  `AdminDashboard.tsx` and `VendorDashboard.tsx` pick their chart colors in JS based on
  `useThemeStore((s) => s.theme)`.

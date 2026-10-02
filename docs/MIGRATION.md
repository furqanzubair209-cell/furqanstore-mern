# Migration notes

## Bringing an existing deployment up to date

This changeset assumes the `Wishlist` model already exists in `schema.prisma` (it's used by the
wishlist feature on the client and by `account.controller.ts`). If you're deploying this on top
of a database that predates it, run:

```bash
cd server
npx prisma migrate dev --name add_wishlist
```

This generates and applies a migration that creates the `Wishlist` table
(`id, userId, productId, createdAt`, unique on `[userId, productId]`, cascading deletes on both
foreign keys). In production, use `npx prisma migrate deploy` instead of `migrate dev` — `dev`
is interactive and assumes a local/throwaway database.

Nothing else in this changeset requires a schema change: the dark/light theme, quick view modal,
testimonials section, CSV export, and the admin Users tab are all client-side or reuse existing
endpoints (`GET /admin/users`, `PATCH /admin/users/:id/status`).

## General migration workflow

1. Make the schema change in `server/prisma/schema.prisma`.
2. `npx prisma migrate dev --name <short_description>` locally — this both writes the SQL
   migration file under `server/prisma/migrations/` and applies it to your dev database.
3. Commit the generated migration folder along with the schema change — migrations are meant to
   be reviewed like any other code change, not regenerated per-environment.
4. In each downstream environment (staging, production), run `npx prisma migrate deploy` as part
   of the deploy pipeline, before the new server code starts serving traffic.
5. Run `npx prisma generate` (usually a no-op if `migrate dev`/`deploy` already ran it) so the
   TypeScript types in `@prisma/client` match the new schema before you build.

## Backward compatibility

- Prefer additive migrations (new nullable columns, new tables) over destructive ones
  (dropping/renaming columns) when a previous server version might still be running during a
  rolling deploy.
- If a column must be renamed or dropped, do it in two deploys: first stop reading/writing the
  old name, then drop it in a follow-up migration once you're confident nothing depends on it.
- `UserStatus`, `ProductStatus`, `OrderStatus`, and the other enums are read by both string
  comparisons in controllers and by hardcoded option lists in the client (e.g.
  `ORDER_STATUSES` in `AdminDashboard.tsx`, `STATUSES` in `VendorDashboard.tsx`). Adding a new
  enum value requires updating those client-side lists in the same change, or the new value will
  be valid in the database but unselectable in the UI.

## Rollback

Prisma migrations don't have an automatic "down" — to roll back, either restore from a database
backup taken before the migration, or write and apply a new forward migration that reverses the
change. Keep backups current before any migration that touches production.

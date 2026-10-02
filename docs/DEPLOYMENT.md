# Deployment

## Prerequisites

- Node.js 20+
- A MySQL 8 instance reachable from the server host
- Two separate deploy targets: `server/` (Node API) and `client/` (static Vite build)

## Environment variables

### Server (`server/.env`, see `server/.env.example`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL connection string, e.g. `mysql://user:pass@host:3306/furqanstore` |
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Exact origin of the deployed client, used for CORS — must match exactly since credentials are enabled |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Long random strings, kept separate so a leaked access secret can't forge refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | e.g. `15m`, `7d` |
| `DEFAULT_COMMISSION_RATE` | Fallback rate used only if no `CommissionSetting` row exists yet |
| `NODE_ENV` | `production` enables combined access logs |

### Client (`client/.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Full base URL of the deployed API, e.g. `https://api.example.com/api` |

## Build steps

```bash
# Server
cd server
npm install
npx prisma generate
npx prisma migrate deploy
npm run build        # tsc -> dist/
npm start             # node dist/server.js

# Client
cd client
npm install
npm run build         # vite build -> dist/
# serve dist/ from any static host (nginx, S3+CDN, Vercel, Netlify, etc.)
```

## Process management

The API is a single long-running Node process (Express + a Socket.IO server sharing one HTTP
server instance) — it is not stateless-safe to run multiple instances behind a load balancer
without enabling Socket.IO's Redis adapter, since real-time events are currently emitted only to
sockets connected to the same process. For a single-node deployment, a process manager (pm2,
systemd, or the platform's own restart policy) is sufficient.

## Reverse proxy notes

- Forward `Upgrade`/`Connection` headers for the Socket.IO WebSocket path (`/socket.io/`).
- The refresh token is an httpOnly, `Secure` cookie in production — the client and API should
  either share a parent domain or the cookie needs `SameSite=None` with HTTPS on both sides, or
  cross-site refresh will silently fail.
- `helmet()` sets a conservative default CSP; if the client is served from a different origin
  than the API and you introduce inline scripts beyond the theme-flash snippet in `index.html`,
  revisit the CSP.

## Rolling out a schema change

See `MIGRATION.md` — always run `prisma migrate deploy` before starting the new server version,
never after, so the running process never sees a schema it doesn't expect.

## Health check

`GET /api/health` returns `{ success: true }` with no auth required — point your load balancer
or uptime monitor at it.

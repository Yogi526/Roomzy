# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── mobile/             # Expo React Native mobile app (StayBook)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Application: StayBook (Mobile App)

Room booking marketplace connecting room owners with renters for short-term bookings (hourly/daily).

### Features
- **Onboarding**: 3-step signup (welcome → role selection → details)
- **Explore**: Browse and search rooms with city/type filters
- **Orders**: View booking orders as renter or owner with status management
- **My Rooms**: List and manage rooms (for owners)
- **Profile**: User info and settings

### User Roles
- `renter`: Can browse and book rooms
- `owner`: Can list rooms and manage booking orders  
- `both`: Can do everything

### Order Flow
1. Renter finds a room → clicks "Book Now"
2. Booking form: select hourly/daily, set duration, guests
3. Order is sent to owner with `pending` status
4. Owner sees order in their Orders tab → can Accept or Reject
5. Once accepted, owner can mark as Completed

## API Endpoints

### Users
- `POST /api/users` — Create or login by phone
- `GET /api/users/:userId` — Get user

### Rooms
- `GET /api/rooms` — List rooms (filter by ownerId, city)
- `POST /api/rooms` — Create room listing
- `GET /api/rooms/:roomId` — Get room
- `PUT /api/rooms/:roomId` — Update room
- `DELETE /api/rooms/:roomId` — Delete room

### Orders
- `GET /api/orders` — List orders (filter by renterId, ownerId, status)
- `POST /api/orders` — Create booking order
- `GET /api/orders/:orderId` — Get order
- `PATCH /api/orders/:orderId` — Update order status

## Database Tables
- `users` — User accounts with role (renter/owner/both)
- `rooms` — Room listings with pricing, amenities, availability
- `orders` — Booking orders with status flow (pending→accepted/rejected→completed)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)
Express 5 API server. Routes in `src/routes/`.

### `artifacts/mobile` (`@workspace/mobile`)
Expo React Native mobile app. File-based routing with Expo Router.

### `lib/db` (`@workspace/db`)
Database layer using Drizzle ORM with PostgreSQL.
- `pnpm --filter @workspace/db run push` — push schema changes

### `lib/api-spec` (`@workspace/api-spec`)
OpenAPI spec + Orval codegen.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate client

### `lib/api-zod` (`@workspace/api-zod`)
Generated Zod schemas.

### `lib/api-client-react` (`@workspace/api-client-react`)
Generated React Query hooks.

### `scripts` (`@workspace/scripts`)
Utility scripts.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PickMe Store — a full-stack e-commerce application for a gift/accessory store. Russian-language UI. Built as a pnpm monorepo.

**Stack**: React 19 + Vite + Tailwind CSS 4 + shadcn/ui (frontend), Express 5 + Pino + sharp (backend), PostgreSQL + Drizzle ORM (database), Orval (API codegen from OpenAPI spec).

## Common Commands

```bash
# Root-level
pnpm run build          # typecheck + build all packages
pnpm run typecheck      # full TypeScript validation across workspace
pnpm run typecheck:libs # typecheck lib packages only

# Frontend (pickme-store)
pnpm --filter @workspace/pickme-store run dev    # Vite dev server
pnpm --filter @workspace/pickme-store run build  # production build
pnpm --filter @workspace/pickme-store run serve  # preview production build

# Backend (api-server)
pnpm --filter @workspace/api-server run dev    # dev server with watch
pnpm --filter @workspace/api-server run build  # esbuild bundle
pnpm --filter @workspace/api-server run start  # run bundled server

# Database
pnpm --filter @workspace/db run push        # apply schema to PostgreSQL
pnpm --filter @workspace/db run push-force  # force push schema changes

# API code generation (run after editing openapi.yaml)
pnpm --filter @workspace/api-spec run codegen

# Image migration (run on server)
cd artifacts/api-server
DATABASE_URL=... npx tsx scripts/migrate-images.ts /path/to/uploads
```

## Architecture

### Monorepo Layout

- `artifacts/api-server/` — Express REST API. Routes under `src/routes/`, entry point `src/main.ts`.
- `artifacts/pickme-store/` — React SPA. Pages in `src/pages/`, components in `src/components/`, theming via `src/context/ThemeContext.tsx`.
- `lib/api-spec/` — OpenAPI 3.1 spec (`openapi.yaml`) + Orval config. Source of truth for the API contract.
- `lib/api-client-react/` — **Generated** React Query hooks (do not edit by hand; regenerate with codegen command).
- `lib/api-zod/` — **Generated** Zod validation schemas (do not edit by hand).
- `lib/db/` — Drizzle ORM schema (`src/schema.ts`) and connection setup.

### Code Splitting

Pages are lazy-loaded via `React.lazy()`:
- `/` — Home (loaded immediately, not lazy)
- `/catalog` — `src/pages/CatalogPage.tsx` (lazy)
- `/product/:id` — `src/pages/ProductPage.tsx` (lazy)
- `/gift/:id` — `src/pages/GiftPage.tsx` (lazy)
- `/admin` — `src/pages/admin.tsx` (lazy, includes recharts ~436KB)

Shared components live in `src/shared.tsx`: Header, Footer, ProductCard, CompactCard, utilities.

Vendor chunks configured in `vite.config.ts` → `manualChunks`: `ui-vendor` (Radix UI), `query-vendor` (React Query).

### Image Processing

Upload endpoint (`/api/admin/upload`) auto-converts images via sharp:
- Creates 3 WebP sizes: `-thumb.webp` (400px), `-medium.webp` (800px), `-full.webp` (1600px)
- Plus default `.webp` (medium size)
- Original file is deleted after conversion
- Image processing code: `api-server/src/lib/image-processing.ts`
- Migration script for existing images: `api-server/scripts/migrate-images.ts`

Frontend uses `srcSet` via `src/lib/image-utils.ts` → `getImageSrcSet()` to serve responsive images.

### Fonts (Self-hosted)

All fonts are self-hosted WOFF2 in `public/fonts/` (no Google Fonts CDN):
- Playfair Display (400, 700) — female headings
- Nunito (400, 600, 700) — female body
- Caveat (400) — female accent/script
- Cormorant Garamond (400, 600) — male headings
- Montserrat (400, 500, 600, 700) — male body

`@font-face` declarations in `src/index.css` with `font-display: swap` and `unicode-range` (cyrillic + latin subsets). Preload for critical fonts in `index.html`.

### Animations

**No framer-motion** — all animations use CSS + native JS:
- Scroll reveal: `useInView` hook (`src/hooks/useInView.ts`) + CSS classes `animate-fade-up` / `animate-fade-up-stagger`
- Hero parallax: native `scroll` event + `requestAnimationFrame` + `translate3d`
- Splash screen / mobile menu: CSS `@keyframes` with `closing` state
- No infinite animations — all one-shot or interaction-based

### Theming System

Two gender themes (female/male) with light/dark mode for male. Theme is stored in React Context + localStorage and applied via `data-theme` attribute on `<html>`. Female theme is pink and light-only. The `/gift/:id` route forces female theme.

CSS variables: `--pm-primary`, `--pm-font-heading`, `--pm-font-accent`, `--pm-font-body`, `--pm-surface`, etc. — defined per-theme in `index.css`.

### Splash Screen

Modal popup (not fullscreen) at first visit. Uses CSS animations, not framer-motion. Close button defaults to female theme. Not shown on `/product/:id` or `/gift/:id`.

### API Codegen Flow

`openapi.yaml` → Orval → `lib/api-client-react/` (React Query hooks) + `lib/api-zod/` (Zod schemas). When changing API endpoints: edit the OpenAPI spec first, run codegen, then update the backend route handlers to match.

### Auth Model

Admin routes use Bearer token auth against the `ADMIN_PASSWORD` env var. No user accounts — this is a single-admin storefront.

### Key API Routes (all under `/api`)

- `GET /healthz` — health check
- Products: CRUD at `/products`, with published/pending workflow
- Admin: `/admin/login`, `/admin/upload`, `/admin/upload-multiple`, product management
- Analytics: public POST endpoints for pageviews/clicks, admin GET for dashboard
- OG tags: server-rendered OpenGraph metadata for `/gift/:id` sharing

### Environment Variables

- `PORT` — server port
- `DATABASE_URL` — PostgreSQL connection string
- `ADMIN_PASSWORD` — admin auth token
- `BASE_PATH` — frontend base path (used by Vite)
- `LOG_LEVEL` — Pino log level (default: info)

## TypeScript

Composite project references with `tsconfig.base.json` at root. Each package has its own `tsconfig.json` extending base. Target is ES2022.

## Performance Notes

Current bundle sizes (after optimization):
- `index.js`: ~306 KB (91 KB gzip) — main chunk with Home + shared
- `ui-vendor.js`: 65 KB — Radix UI components
- `query-vendor.js`: 42 KB — React Query
- `admin.js`: 436 KB — lazy, only on /admin
- Page chunks: 10-23 KB each — lazy loaded

Key optimizations applied:
- Hero images: WebP with 3 sizes + srcset + preload with media query (desktop only)
- Product images: auto-conversion to WebP with 3 sizes on upload
- Self-hosted fonts with preload for critical subset
- No framer-motion (removed, replaced with CSS + native JS)
- Code splitting: pages + vendor chunks
- No infinite CSS animations
- Transitions only on interactive elements (not `*`)
- Nginx: WebP auto-serve config in `api-server/nginx-webp.conf`

## Deployment

Production server at `/var/www/pickme-store`. Deploy via `git pull` + rebuild + `pm2 restart pickme`. See memory file `reference_deploy.md` for full commands.

Always commit AND push — user deploys from GitHub.

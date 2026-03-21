# Adga Factor — Project Memory

## Deployment
- **Platform**: Cloudflare Pages (project: `adgafactor`)
- **Live URL**: https://adgafactor.pages.dev
- **Deploy**: `cd /Users/savantrock/Desktop/factoring && ./deploy-cloudflare.sh`
- **Build**: `cd app && CLOUDFLARE_PAGES=1 NODE_ENV=production npm run build`
- GitHub Pages also deployed (uses `/adgafactor` basePath prefix)

## Architecture
- Next.js 15/16 static export (`output: "export"`) in `/app`
- Cloudflare Pages Functions in `/functions/api/`
- D1 database `adgafactor-errors` (id: `d60aed9f-9f32-42f9-b81b-67f9bdd6d6bf`)
- R2 bucket `adgafactor-observability` (replay chunks + source maps)
- wrangler.toml at project root with D1 + R2 bindings

## Design System
- Fonts: Cormorant Garamond (serif) + Inter (sans)
- Zero border radius everywhere EXCEPT buttons (5px) and UI elements
- Light mode default — never dark default
- CSS utility classes: `responsive-grid-4`, `responsive-grid-2`, `responsive-grid-3`, `charts-row`, `page-pad`, `table-scroll-outer`
- No decorative icons, no text animations

## Custom Observability (Sentry Replacement)
- SDK init: `app/components/observability-init.tsx` (mounted in root layout)
- Error capture: `app/lib/observability/error-capture.ts`
- Session replay: `app/lib/observability/session-replay.ts` (rrweb, 10s chunks)
- Public API: `app/lib/observability/index.ts`
- Error boundary: `app/components/error-boundary.tsx`
- Pages Functions:
  - `functions/api/errors.ts` — ingest + fingerprint + Discord spike alerts
  - `functions/api/replay/index.ts` — upload rrweb chunks to R2
  - `functions/api/replay/[sessionId].ts` — serve assembled replay
  - `functions/api/admin/errors.ts` — admin CRUD (GET groups/events/summary, PATCH status)
  - `functions/api/sourcemaps/resolve.ts` — source map lookup from R2
- Admin UI:
  - `/admin/errors` — error groups list with status tabs + summary cards
  - `/admin/errors/[id]` — event list + rrweb replay viewer (lazy-loaded)
- D1 migration: `migrations/001_errors.sql` (error_groups, error_events, sessions)

## Key Patterns
- Dynamic routes in static export: server wrapper (generateStaticParams) + `detail-client.tsx`
- `CLOUDFLARE_PAGES=1` env var disables basePath prefix for CF Pages builds
- rrweb dynamic import in replay viewer to keep bundle lean
- `navigator.sendBeacon` for reliable chunk delivery on page unload

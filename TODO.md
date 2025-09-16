## Instagram Integration Roadmap

### 1) Data model and types
- [ ] Make `IgUser.username`, `name`, `profilePictureUrl`, `accountType` optional in Prisma
- [ ] Migrate database (baseline or reset as needed)
- [ ] Align TS types and property names (`profilePictureUrl`, not `profilePictureURl`)
- [ ] Ensure `igUserId` is handled as `bigint` in Prisma calls

### 2) Auth flow hardening
- [ ] Fix and normalize structured logs instead of string interpolation
- [ ] Return unified response types from services
- [ ] Centralize error handling and response shapes

### 3) Media API
- [ ] Add `src/types/igMedia.ts` interfaces for IG media
- [ ] Add `src/schema/igmedia.ts` Zod schemas (query + response)
- [ ] Implement `GET /api/media` route and controller using validation

### 4) Connection status tracking
- [ ] Extend `IgUser` with fields: `connectedAt`, `lastTokenRefreshAt`, `lastTokenRefreshError`, `deauthorizedAt`, `tokenStatus`, `scopes`
- [ ] Migrate database and backfill sensible defaults
- [ ] Create helpers: `isIgConnected`, `verifyToken`, `markRevoked`

### 5) Token refresh and scheduling
- [ ] Implement long-lived token refresh service (60-day refresh)
- [ ] Schedule refresh N hours before `tokenExpireDay`
- [ ] Implement worker (BullMQ or in-process scheduler) and health checks

### 6) Webhooks
- [ ] Add deauthorization callback route (Facebook App settings)
- [ ] Verify signatures and handle event parsing
- [ ] Mark account revoked on deauth event; clear or rotate tokens

### 7) Operational
- [ ] Add health/ready endpoints (health exists; add readiness if needed)
- [ ] Add request logging + correlation IDs
- [ ] Add basic metrics (timings, error counts) if needed

### 8) DX and CI
- [ ] Add scripts: generate, push, migrate, reset, lint
- [ ] Ensure `prisma` and `@prisma/client` versions match
- [ ] Document `.env` requirements in README

### 9) Nice-to-haves
- [ ] Rate limit external calls and add retries with backoff
- [ ] Add caching for media requests with short TTL
- [ ] Implement a rules engine for `AutomationRule`

---





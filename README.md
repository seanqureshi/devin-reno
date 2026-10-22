# Renovation Planner

Plan, budget and run a home renovation: rooms, task board, budget tracker, contractor quotes,
receipt scanning, dependency-aware schedule, and role-based sharing (Owner / Partner / Contractor).

## Quick start

```bash
npm install          # also runs prisma generate
npm run db:reset     # create SQLite DB (prisma/dev.db) and load sample data
npm run dev          # http://localhost:3000
```

Sign in with a demo account (password `password123`) — the login page has one-click buttons:

| Who | Email | Role |
| --- | --- | --- |
| Alex Rivera | owner@example.com | Owner |
| Jordan Rivera | partner@example.com | Partner |
| Mike Chen (Brightline Electric) | mike@brightline-electric.example | Contractor |
| Sara Lopez (Summit Plumbing) | sara@summit-plumbing.example | Contractor |

## Tests

```bash
npm test             # unit tests (Vitest)
npm run test:e2e     # end-to-end (Playwright; reseeds DB, starts dev server on :3100)
npm run typecheck && npm run lint
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for architecture and conventions.

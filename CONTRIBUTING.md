# Architecture & conventions

**Stack:** Next.js 15 (App Router, TypeScript) · Tailwind CSS v4 · Prisma 6 + SQLite (`prisma/dev.db`) ·
zod · Vitest (unit) · Playwright (e2e). No external services required.

## Layout

```
prisma/schema.prisma       full data model (money = integer cents, enum-like fields = strings)
prisma/seed.ts             sample data (Kitchen + Primary Bath, ~$85k); dates relative to today
src/lib/
  db.ts                    prisma client
  auth.ts                  requireProjectPage / requireProjectApi (membership + capability checks), ApiError
  session.ts               signed cookie session (rp_session)
  permissions.ts           role -> capability matrix, canSeeTask()
  constants.ts             statuses, categories, roles + labels
  budget.ts                budget roll-up rules: computeBudgetSummary / getBudgetSummary  (single source of truth)
  schedule.ts              computeBlockers / wouldCreateCycle
  money.ts dates.ts        formatting/parsing helpers
  api.ts                   withApi() error wrapper, parseBody(zod), json()
  nav.ts                   sidebar items (gated by capability)
src/components/ui.tsx      shared UI primitives (Card, PageHeader, Badge, ProgressBar, buttonClasses, inputClasses...)
src/app/projects/[projectId]/<feature>/page.tsx      feature pages
src/app/api/projects/[projectId]/<feature>/...       feature API routes
tests/unit/*.test.ts       Vitest
tests/e2e/*.spec.ts        Playwright (helpers in tests/e2e/helpers.ts: openProject(page, "owner"|"partner"|"electrician"|"plumber"), resetDb())
```

## Conventions

- **Pages** are server components that call `requireProjectPage(projectId, capability?)` and load data via Prisma;
  interactive parts are client components in the same folder or `src/components/<feature>/`.
  After a mutation, client components call `router.refresh()` (from `next/navigation`).
- **API routes** live under `src/app/api/projects/[projectId]/...`, are wrapped in `withApi`, call
  `requireProjectApi(projectId, capability)` first, validate bodies with zod via `parseBody`, and must check
  that any referenced IDs (rooms, tasks, contractors, ...) belong to the same project.
- **Permissions** are enforced server-side in every API route (UI hiding is not enough). Contractors only see/update
  tasks where `task.contractorId === member.contractorId` (`canSeeTask`).
- **Money** is stored and passed as integer cents; display with `formatMoney`, parse input with `parseMoneyToCents`.
- **Dates** are stored as UTC midnight `DateTime`; use helpers in `dates.ts`.
- **Budget numbers** always come from `src/lib/budget.ts` — don't re-implement roll-ups.
- Add `data-testid`s / accessible labels so e2e tests can target elements by role/label.
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e` must pass.

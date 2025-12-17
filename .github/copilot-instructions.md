# Copilot / AI Agent guidance for Sotkon-Planning (Planning App)

This file contains focused, actionable instructions for AI coding agents to be immediately productive in this repository. Keep suggestions concrete and repo-specific.

## Quick facts
- Tech stack: Next.js 15 (App Router), TypeScript, Prisma (SQL Server), NextAuth (Credentials provider), Tailwind CSS.
- Run locally: `npm run dev` (or `.\\dev.ps1`).
- Build/test/standalone: `.\test-prod.ps1` (validate build), `.\deploy.ps1` (create `.next/standalone`).
- DB: SQL Server (expected instance `localhost\\PLANNING` and `PlanningDB`). Use `DATABASE_URL` env var.

## Architecture & patterns to know (read these files first)
- `app/` — Next.js App Router; pages are server components by default. Use `"use client"` at top for client components (see `components/*/FilterBar.tsx`).
- `app/api/*/route.ts` — This repo uses Route Handlers (exported GET/POST functions). Return values with `NextResponse.json(...)` and use try/catch + `console.error` on failures (see `app/api/cargas/route.ts` and `app/api/cargas/[id]/route.ts`).
- `lib/prisma.ts` — single Prisma client (`prisma`) instance imported from `@/lib/prisma` (use it directly in API routes). Prisma is configured to log queries/errors.
- `lib/auth.ts` + `app/api/auth/[...nextauth]/route.ts` — NextAuth is configured with a CredentialsProvider and uses JWT sessions. Session token contains `id` and `role` (callbacks add these). Sign-in page is `/login`.
- `prisma/schema.prisma` — authoritative DB schema; after schema edits run `npx prisma generate` (README also documents `npx prisma db pull`).

## Conventions & small details
- Pagination: GET `/api/cargas` uses `pageIndex` and `pageSize` (default pageSize = 48) and returns `pagesCount` and `totalCount` (see `app/api/cargas/route.ts`).
- Date handling: dates are parsed from input strings (`YYYY-MM-DD` and `HH:mm`). Check `app/api/cargas/route.ts` for parsing/formatting examples.
- Filters: `GET /api/cargas` builds a `whereClause` and uses `contains` filters; note SQL Server default is case-insensitive — code relies on that.
- Response style: JSON-only; errors return JSON with `{ error: '...' }` and HTTP 500 status.
- Entity naming: DB models have `tblPlanning*` naming (e.g., `tblPlanningCargas`, `tblPlanningCargaServicos`).
- Role & auth: user objects include `role` and `id` in JWT and session; use the token values consistently (`session.user.id`, `session.user.role`).

## CI / Deploy / Runtime
- GitHub Actions workflow: `.github/workflows/deploy.yml` builds on a self-hosted runner, runs `npx prisma generate`, `npm run build`, verifies `BUILD_ID`, then mirrors `/.next/standalone` to production path and uses NSSM to control the Windows service.
- Local production test: run `.\test-prod.ps1` to simulate production build and run (this script builds and starts the app for verification).
- Service management: `manage-service.ps1` wraps NSSM commands and logs live tails (logs live at `logs/output.log` and `logs/error.log`).

## Secrets & environment
- Required env vars: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NODE_ENV`. See README for recommended formats and `NEXTAUTH_SECRET` generation snippet.
- IMPORTANT: several places assume secrets are available; do NOT hard-code secrets. Example: `app/api/cargas/primavera/route.ts` contains hard-coded Primavera credentials — treat them as secrets and move to env if you modify this code.

## How to add or modify an API route (example pattern)
1. Create `app/api/<resource>/route.ts`.
2. Export `GET`, `POST`, etc. as named async functions that accept `NextRequest`. Use `const { searchParams } = request.nextUrl` for query params.
3. Use `try/catch` and return `NextResponse.json(payload, { status })` on success/error.
4. Use `import { prisma } from '@/lib/prisma'` for DB access.

Snippet pattern:
```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const items = await prisma.tblPlanningCargas.findMany({ /* ... */ });
    return NextResponse.json({ items });
  } catch (err) {
    console.error('Error', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

## Coding and review tips (for AI pull requests)
- Prefer small, focused PRs: common tasks here are adding API endpoints, schema adjustments, or UI updates.
- After changing Prisma schema, include `npx prisma generate` in your PR description and (if relevant) a DB migration description.
- Keep client/server surface clear: server-only modules (Prisma, NextAuth callbacks) must not be imported into client components.
- Verify localization keys and translations: `components/*/FilterBar.tsx` and `app/api/cargas/route.ts` include language maps for PT/EN/FR/ES.
- If touching integrations (Primavera external API), ensure credentials are moved to env vars and network timeouts/ retry logic are considered.

## Files worth reading for context
- `README.md` (project setup, envs, scripts) ✅
- `app/api/cargas/route.ts` and `app/api/cargas/[id]/route.ts` (filtering, create/update/delete patterns) ✅
- `app/api/cargas/primavera/route.ts` (external import flow — **contains hard-coded creds**) ✅
- `lib/auth.ts` and `app/api/auth/[...nextauth]/route.ts` (auth patterns) ✅
- `lib/prisma.ts` (Prisma client instantiation) ✅
- `.github/workflows/deploy.yml` (build/deploy pipeline; self-hosted runner + NSSM) ✅

---
If anything looks unclear or you'd like the instructions to emphasize a particular workflow (eg. debugging, tests, or how to refactor a specific API), tell me which area to expand and I'll iterate. ✅

# CLAUDE.md — BigTurbo Project Instructions

This file provides project context for Claude Code when working in this repository.

---

## Project Overview

**BigTurbo** is a multi-agent SaaS workflow system built with Next.js. It provides:

1. **Agent Orchestration** — 12 specialized AI subagents for different development tasks
2. **Workflow Commands** — 6 slash commands (`/feature`, `/bugfix`, etc.) that orchestrate agent sequences
3. **Trace Observability** — Automatic tracing of command execution via Langfuse hooks
4. **Audit Dashboard** — Web UI for viewing traces, metrics, and agent activity

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, React 19) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS 3.4 |
| Database | Neon/Postgres (via `@vercel/postgres` + `pg`) |
| Auth | Clerk (`@clerk/nextjs`) |
| Tracing | Langfuse (self-hosted, localhost:3001) |
| Charts | Recharts |

---

## Key Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server

# Quality
npm run lint         # ESLint checks
npm run type-check   # TypeScript type checking (tsc --noEmit)

# No test runner configured yet — see docs/qa/ for manual testing procedures
```

---

## Project Structure

```
.claude/
├── agents/           # 12 subagent definitions (markdown prompts)
├── commands/         # 6 workflow commands (slash commands)
├── hooks/            # Trace hooks for Langfuse integration
└── settings.json     # Hook configuration

docs/
├── ai/               # Agent system documentation
│   ├── AGENT_CHARTER.md    # Agent responsibilities & rules
│   ├── WORKFLOWS.md        # Loop A/B/C/D workflow definitions
│   ├── CHECKLISTS.md       # Clerk/Stripe/Next.js security checklists
│   └── HANDOFF_TEMPLATE.md # Standard handoff format
├── devops/           # Deployment & monitoring docs
├── qa/               # Testing documentation
└── tracing.md        # Trace system documentation

src/
├── app/
│   ├── (audit)/      # Audit dashboard (protected routes)
│   │   └── audit/    # /audit/* pages
│   ├── (marketing)/  # Public marketing pages
│   └── api/
│       ├── audit/    # Trace ingestion, metrics, export APIs
│       └── health/   # Health check endpoint
├── components/
│   ├── audit/        # Dashboard components
│   └── ui/           # Shared UI components
├── lib/
│   ├── audit/        # Trace parsing, metrics, export logic
│   ├── langfuse/     # Langfuse client & types
│   └── db.ts         # Database connection
└── middleware.ts     # Clerk auth middleware
```

---

## Agent System

### Available Agents (`.claude/agents/`)

| Agent | Purpose |
|-------|---------|
| `orchestrator` | Coordinates multi-agent workflows |
| `fullstack-developer` | End-to-end feature implementation |
| `api-designer` | API contracts, error models, server actions |
| `sql-pro` | Migrations, indexes, query optimization |
| `code-reviewer` | Code quality and architecture review |
| `qa-expert` | Tests, test plans, regression coverage |
| `security-auditor` | Auth, tenant isolation, payment security |
| `devops-engineer` | Deployment, monitoring, runbooks |
| `dependency-manager` | Updates, CVEs, bundle optimization |
| `documentation-engineer` | User docs, support docs |
| `refactoring-specialist` | Code cleanup (no behavior changes) |
| `prompt-engineer` | Prompt optimization and analysis |

### Workflow Commands (`.claude/commands/`)

| Command | Workflow | Description |
|---------|----------|-------------|
| `/feature` | Loop A | Full feature delivery (8 agents) |
| `/bugfix` | Loop B | Streamlined bug fix (6 agents) |
| `/migration` | Loop C | Database schema changes (6 agents) |
| `/maintenance` | Loop D | Weekly cleanup and updates (6 agents) |
| `/plop` | — | Quick scaffolding |
| `/spot` | — | Spot fixes |

### Tracing System

Hooks in `.claude/settings.json` capture command execution:

- **UserPromptSubmit** → Creates trace via `/api/audit/traces/ingest`
- **PostToolUse** → Creates span for each tool call
- **SubagentStop** → Logs subagent completions
- **Stop** → Finalizes trace

Traces are viewable at `/audit/traces` in the dashboard.

---

## Conventions

### File Naming

- React components: `PascalCase.tsx`
- Utilities/lib: `kebab-case.ts` or `camelCase.ts`
- API routes: `route.ts` in folder structure
- Pages: `page.tsx` in App Router structure

### Component Patterns

```typescript
// Server Component (default)
export default async function MyPage() {
  const data = await fetchData();
  return <div>{/* ... */}</div>;
}

// Client Component
'use client';
export function MyClientComponent() {
  const [state, setState] = useState();
  return <div>{/* ... */}</div>;
}
```

### API Route Patterns

```typescript
// src/app/api/example/route.ts
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... handle request
}
```

### Database Access

```typescript
import { query, getClient } from '@/lib/db';

// Simple query
const result = await query('SELECT * FROM traces WHERE id = $1', [id]);

// Transaction
const client = await getClient();
try {
  await client.query('BEGIN');
  // ... operations
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

---

## Important Notes

### Langfuse Configuration

- **Self-hosted** on `localhost:3001`
- Traces sent to `/api/audit/traces/ingest`
- View at `/audit/traces` in the dashboard

### Route Groups

- `(audit)` — Protected routes requiring Clerk auth
- `(marketing)` — Public routes

### Multi-Tenant Architecture

- Always get `orgId` from `auth()`, never from client
- Validate tenant boundaries on all data access
- See `docs/ai/CHECKLISTS.md` for Clerk security patterns

### Hook System Active

The `.claude/hooks/` scripts run automatically on:
- Every prompt submission
- Every tool use
- Every subagent completion

This enables full observability of command execution.

### Build Requirements

- Node.js ≥18.17.0
- npm ≥9.0.0
- TypeScript strict mode enabled
- ESLint and type errors fail builds

---

## Quick Reference

```bash
# Start development
npm run dev

# Type check before committing
npm run type-check && npm run lint

# View audit dashboard
open http://localhost:3000/audit

# View Langfuse traces
open http://localhost:3001
```

---

## Documentation Links

- [Agent Charter](docs/ai/AGENT_CHARTER.md) — Agent responsibilities and escalation rules
- [Workflows](docs/ai/WORKFLOWS.md) — Loop A/B/C/D definitions
- [Checklists](docs/ai/CHECKLISTS.md) — Clerk/Stripe/Next.js security checklists
- [Tracing](docs/tracing.md) — How automatic command tracing works
- [Deployment](docs/devops/DEPLOYMENT_GUIDE.md) — Deployment procedures

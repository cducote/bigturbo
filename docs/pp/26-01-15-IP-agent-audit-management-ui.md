# Past Plan: Agent Audit & Management UI

**Completed**: January 15, 2026
**Duration**: ~3 phases over multiple sessions
**Status**: COMPLETED

---

## Summary

Built a comprehensive agent audit and management UI for the BigTurbo system. The dashboard provides visibility into 11 specialized Claude Code agents, visualizes their workflows, displays execution traces, and exports data for optimization by the prompt-engineer agent.

---

## What Was Built

### Phase 1: Foundation & MVP
- **Database**: PostgreSQL schema with tables for agents, workflows, commands, traces, spans, decisions, prompts, exports
- **Markdown Parser**: `src/lib/audit/parser.ts` - parses `.claude/agents/*.md` and `.claude/commands/*.md` files
- **API Routes**:
  - `GET /api/audit/agents` - List/detail agents
  - `GET /api/audit/workflows` - List workflows
  - `GET /api/audit/commands` - List commands
  - `POST /api/audit/sync` - Re-parse markdown files
- **UI Pages**:
  - `/audit` - Dashboard home with stats and recent activity
  - `/audit/agents` - Agent roster with cards
  - `/audit/agents/[name]` - Agent detail view
  - `/audit/workflows` - Workflow visualizer with diagrams
  - `/audit/prompts` - Prompt browser with version history

### Phase 2: Observability Integration
- **Langfuse Integration**: Self-hosted via Docker, connected to NeonDB
- **Langfuse SDK**: `src/lib/langfuse/` - client, ingest, types
- **Trace Ingestion**: `POST /api/audit/traces/ingest` webhook endpoint
- **Trace Viewing**:
  - `/audit/traces` - List all traces with filtering
  - `/audit/traces/[id]` - Detailed trace view with span timeline
- **Export**: TOON/JSON/CSV export functionality

### Phase 3: Advanced Features
- **Real-Time Monitoring**:
  - SSE endpoint at `/api/audit/traces/stream`
  - Live trace indicator on traces page
  - Active agents count on dashboard
- **Metrics Dashboard** (`/audit/metrics`):
  - Traces over time chart
  - Status breakdown pie chart
  - Agent performance bar chart
  - Agent details table with color-coded IDs
  - Tool usage grid
- **Prompt Versioning**:
  - Git-based version history for agent prompts
  - `/api/audit/prompts/history` and `/api/audit/prompts/version` endpoints
  - Diff visualization between versions

---

## Key Files Created/Modified

### API Routes
- `src/app/api/audit/agents/route.ts`
- `src/app/api/audit/agents/[name]/route.ts`
- `src/app/api/audit/workflows/route.ts`
- `src/app/api/audit/commands/route.ts`
- `src/app/api/audit/traces/route.ts`
- `src/app/api/audit/traces/[id]/route.ts`
- `src/app/api/audit/traces/ingest/route.ts`
- `src/app/api/audit/traces/stream/route.ts`
- `src/app/api/audit/metrics/route.ts`
- `src/app/api/audit/prompts/history/route.ts`
- `src/app/api/audit/prompts/version/route.ts`
- `src/app/api/audit/export/route.ts`
- `src/app/api/audit/sync/route.ts`

### Libraries
- `src/lib/db.ts` - PostgreSQL client
- `src/lib/audit/parser.ts` - Markdown parser
- `src/lib/audit/types.ts` - TypeScript types
- `src/lib/audit/metrics.ts` - Performance metrics
- `src/lib/audit/git.ts` - Git version history
- `src/lib/langfuse/client.ts` - Langfuse SDK wrapper
- `src/lib/langfuse/ingest.ts` - Trace ingestion
- `src/lib/langfuse/types.ts` - Langfuse types

### UI Components
- `src/components/audit/AgentBadge.tsx`
- `src/components/audit/AgentCard.tsx`
- `src/components/audit/AgentRoster.tsx`
- `src/components/audit/AuditNav.tsx`
- `src/components/audit/DecisionTree.tsx`
- `src/components/audit/ExportPanel.tsx`
- `src/components/audit/PromptViewer.tsx`
- `src/components/audit/SearchBar.tsx`
- `src/components/audit/StatCard.tsx`
- `src/components/audit/TraceList.tsx`
- `src/components/audit/TraceViewer.tsx`
- `src/components/audit/WorkflowDiagram.tsx`

### Pages
- `src/app/(audit)/layout.tsx`
- `src/app/(audit)/audit/page.tsx`
- `src/app/(audit)/audit/agents/page.tsx`
- `src/app/(audit)/audit/agents/[name]/page.tsx`
- `src/app/(audit)/audit/workflows/page.tsx`
- `src/app/(audit)/audit/prompts/page.tsx`
- `src/app/(audit)/audit/traces/page.tsx`
- `src/app/(audit)/audit/traces/[id]/page.tsx`
- `src/app/(audit)/audit/metrics/page.tsx`

### Database
- `scripts/schema.sql` - Full PostgreSQL schema

---

## Design Decisions

1. **Langfuse for Backend**: Self-hosted observability storing traces in PostgreSQL
2. **Viewer-Only for Prompts**: Read-only display; edits happen in `.claude/` directory
3. **Single Tenant**: Optimized for 1-2 users, simpler schema
4. **UI Design System**: Engineering-grade, monospace fonts, pale yellow/navy colors, no rounded corners
5. **Agent Color Coding**: Each agent has assigned color and human name for easy identification

---

## What's NOT Included (Known Gap)

The audit UI is a **viewer/dashboard** that displays traces. It does NOT:
- Execute agents
- Automatically create traces when agents run
- Instrument Claude Code

**To see traces automatically**, an instrumentation layer is needed that sends trace data when `/commands` are executed. This is planned as a follow-up implementation.

---

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL v18 (NeonDB)
- **Observability**: Langfuse (self-hosted)
- **Charts**: Recharts
- **Markdown**: gray-matter, react-syntax-highlighter

---

## Verification

All verification steps pass:
- Build passes with no TypeScript errors
- All pages load without errors
- API routes return expected data
- Langfuse connection configured
- Export functionality operational

# Agent Audit & Management UI - Implementation Plan

## Overview

Build a comprehensive agent audit and management UI by repurposing the existing BigTurbo Next.js app. The system will provide visibility into our 11 specialized Claude Code agents, visualize their workflows, audit their decisions, and export data for optimization by the prompt-engineer agent.

### Key Requirements
- **Database**: PostgreSQL v18 (NeonDB) - credentials already configured
- **Auth**: Clerk with simple setup, week-long sessions, minimal friction for 1-2 users
- **Observability**: Langfuse (self-hosted) for tracing/data + AgentPrism (React components) for visualization
- **Local-first**: Self-hosted, no external dependencies beyond NeonDB
- **Purpose**: Meta-project tooling to improve the agent team itself

---

## Architecture: Langfuse + AgentPrism Integration

### Why Both Tools?

**Langfuse (Backend/Data Layer)**:
- Self-hosted observability platform (MIT licensed)
- Stores conversation traces in PostgreSQL
- Provides prompt versioning and management
- Evaluation framework for testing prompt changes
- REST API for data access
- Think: "Data warehouse for agent execution"

**AgentPrism (Frontend/Visualization Layer)**:
- React components for interactive trace visualization
- OpenTelemetry-compatible visualization
- Decision tree rendering
- Real-time response streaming visualization
- Think: "UI components for rendering Langfuse data"

**How They Work Together**:
```
.claude/agents/*.md → Parser → PostgreSQL ← Langfuse (traces/prompts)
                                    ↓
                            Next.js API Routes
                                    ↓
                    React Components + AgentPrism Components
                                    ↓
                            Audit Dashboard UI
```

### Tech Stack
- **Frontend**: React 19 + TypeScript + TailwindCSS (existing)
- **Backend**: Next.js 15 API Routes
- **Database**: PostgreSQL v18 (NeonDB)
- **Auth**: Clerk 6.36.7
- **Observability**: Langfuse (self-hosted via Docker)
- **Visualization**: AgentPrism React components
- **Parsing**: gray-matter (frontmatter) + marked (markdown)
- **Charts**: Recharts or D3.js for metrics
- **Real-time**: Server-Sent Events (simpler than WebSocket for read-heavy app)

---

## Database Schema (PostgreSQL)

### Core Tables

```sql
-- Agent definitions (parsed from .claude/agents/*.md)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  tools TEXT[] NOT NULL,
  capabilities JSONB NOT NULL,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow definitions (from docs/ai/WORKFLOWS.md)
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- 'feature', 'bugfix', 'migration', 'maintenance'
  type TEXT NOT NULL, -- 'sequential' or 'parallel'
  description TEXT,
  agent_sequence TEXT[] NOT NULL, -- ordered list of agent names
  gates JSONB, -- conditions that must pass
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commands (from .claude/commands/*.md)
CREATE TABLE commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- '/feature', '/bugfix', etc.
  description TEXT NOT NULL,
  workflow_id UUID REFERENCES workflows(id),
  min_agents INT,
  max_agents INT,
  allows_parallel BOOLEAN DEFAULT FALSE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation traces (OpenTelemetry compatible)
CREATE TABLE traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT UNIQUE NOT NULL, -- External trace ID for correlation
  workflow_id UUID REFERENCES workflows(id),
  command_name TEXT,
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual agent actions within traces
CREATE TABLE spans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  span_id TEXT UNIQUE NOT NULL,
  trace_id UUID REFERENCES traces(id) ON DELETE CASCADE,
  parent_span_id TEXT, -- for nested spans
  agent_id UUID REFERENCES agents(id),
  operation TEXT NOT NULL, -- 'read_file', 'write_file', 'decision', etc.
  input JSONB,
  output JSONB,
  tool_calls JSONB,
  reasoning TEXT,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spans_trace_id ON spans(trace_id);
CREATE INDEX idx_spans_agent_id ON spans(agent_id);

-- Agent decision points
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  span_id UUID REFERENCES spans(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  reasoning TEXT,
  confidence DECIMAL(3,2), -- 0.00 to 1.00
  tool_used TEXT,
  alternatives JSONB, -- other options considered
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Versioned prompts (Git-like versioning)
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  version INT NOT NULL,
  content TEXT NOT NULL,
  changes TEXT, -- diff from previous version
  author TEXT,
  commit_message TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_prompts_agent_version ON prompts(agent_id, version);

-- Audit data exports
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type TEXT NOT NULL, -- 'full_audit', 'agent_performance', 'decision_log'
  format TEXT NOT NULL, -- 'toon', 'json', 'csv'
  file_path TEXT,
  file_size INT,
  record_count INT,
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,
  filters JSONB,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clerk user sessions (managed by Clerk, but we track usage)
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'view_agent', 'export_data', 'edit_prompt'
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activity_clerk_id ON user_activity(clerk_user_id);
CREATE INDEX idx_user_activity_created_at ON user_activity(created_at);
```

### Indexes for Performance
```sql
CREATE INDEX idx_traces_status ON traces(status);
CREATE INDEX idx_traces_started_at ON traces(started_at DESC);
CREATE INDEX idx_spans_started_at ON spans(started_at DESC);
CREATE INDEX idx_decisions_span_id ON decisions(span_id);
CREATE INDEX idx_exports_created_at ON exports(created_at DESC);
```

---

## Authentication Setup (Clerk)

### Environment Variables (.env)
```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... # User provides
CLERK_SECRET_KEY=sk_test_... # User provides

# Week-long sessions (604800000ms = 7 days)
CLERK_SESSION_MAX_AGE=604800000
```

### Clerk Configuration

**middleware.ts** - Protect audit routes:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);
const isAuditRoute = createRouteMatcher(['/audit(.*)']);

export default clerkMiddleware((auth, req) => {
  // Protect all audit routes
  if (isAuditRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**app/layout.tsx** - Wrap with ClerkProvider:
```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: '#2563eb' } // Match brand colors
      }}
      sessionTokenMaxAge={604800} // 7 days in seconds
    >
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Simple Login Flow
- Use Clerk's prebuilt components (no custom forms needed)
- Single sign-on option: GitHub OAuth (minimal friction)
- No email verification required for 1-2 trusted users
- Week-long sessions = no re-login for 7 days

---

## Implementation Phases

### Phase 1: Foundation & MVP (Today - 4-6 hours)

**Goal**: Basic audit dashboard with agent roster, workflow visualization, and prompt browser.

#### Tasks:
1. **Database Setup**
   - Run PostgreSQL schema creation
   - Create database client (`src/lib/db.ts`)
   - Test connection with NeonDB

2. **Clerk Integration**
   - Install Clerk (already done)
   - Configure middleware
   - Wrap layout with ClerkProvider
   - Test auth flow

3. **Markdown Parser**
   - Create `src/lib/audit/parser.ts`
   - Parse `.claude/agents/*.md` (frontmatter + content)
   - Parse `.claude/commands/*.md`
   - Store in PostgreSQL

4. **API Routes**
   - `GET /api/audit/agents` - List all agents
   - `GET /api/audit/agents/:name` - Single agent detail
   - `GET /api/audit/workflows` - List workflows
   - `GET /api/audit/commands` - List commands
   - `POST /api/audit/sync` - Re-parse markdown files

5. **UI Components**
   - Agent roster cards (grid layout)
   - Workflow diagram (static SVG/Mermaid)
   - Prompt browser (markdown viewer)
   - Search bar (filter agents)
   - Navigation layout

6. **Routes**
   - `/audit` - Dashboard home
   - `/audit/agents` - Agent roster
   - `/audit/agents/:name` - Agent detail
   - `/audit/workflows` - Workflow visualizer
   - `/audit/prompts` - Prompt browser

**Deliverables**:
- Working auth with Clerk
- Database populated with agent/workflow data
- 5 pages showing agent team information
- Functional search

---

### Phase 2: Observability Integration (This Week - 6-8 hours)

**Goal**: Integrate Langfuse for conversation tracing and AgentPrism for visualization.

#### Tasks:
1. **Langfuse Self-Hosted Setup**
   - Docker Compose for Langfuse (uses same PostgreSQL)
   - Configure connection to NeonDB
   - Test trace ingestion
   - Generate API keys

2. **Langfuse SDK Integration**
   - Install `@langfuse/node`
   - Create trace ingestion endpoint
   - Instrument sample agent conversations
   - Store traces in PostgreSQL

3. **AgentPrism Components**
   - Install AgentPrism (if npm package exists, else copy components)
   - Create trace visualization page
   - Integrate with Langfuse data
   - Add decision tree visualization

4. **Conversation Log Viewer**
   - `/audit/traces` - List all traces
   - `/audit/traces/:id` - Detailed trace view with AgentPrism
   - Filter by agent, date, status
   - Search within conversations

5. **Export Functionality**
   - Export audit data as TOON (Token-Oriented Object Notation)
   - 30-60% fewer tokens than JSON, optimized for LLM consumption
   - Store export records in database
   - Download generated `.toon` files

**Deliverables**:
- Langfuse running locally
- Traces viewable in UI
- AgentPrism visualizations working
- Export functionality operational

---

### Phase 3: Advanced Features (Future - 8-10 hours)

**Goal**: Real-time monitoring, performance metrics, optimization recommendations.

#### Tasks:
1. **Real-Time Monitoring**
   - Server-Sent Events (SSE) endpoint
   - Live trace streaming
   - Active agent indicators

2. **Performance Metrics**
   - Agent execution time statistics
   - Success/failure rates
   - Tool usage frequency
   - Workflow bottleneck analysis

3. **Prompt Optimization**
   - Prompt versioning UI
   - A/B test configuration
   - Evaluation metrics dashboard
   - Rollback capability

4. **Agent Recommendations**
   - Feed audit data to prompt-engineer agent
   - Display optimization suggestions
   - Track improvement over time

**Deliverables**:
- Real-time dashboard
- Metrics and analytics
- Prompt optimization workflow
- Continuous improvement loop

---

## File Structure

```
bigturbo/
├── src/
│   ├── app/
│   │   ├── (marketing)/          # Existing marketing pages
│   │   │   └── ...
│   │   │
│   │   ├── (audit)/               # New audit dashboard (protected)
│   │   │   ├── layout.tsx         # Audit-specific layout with nav
│   │   │   ├── audit/
│   │   │   │   ├── page.tsx       # Dashboard home
│   │   │   │   ├── agents/
│   │   │   │   │   ├── page.tsx   # Agent roster
│   │   │   │   │   └── [name]/
│   │   │   │   │       └── page.tsx # Agent detail
│   │   │   │   ├── workflows/
│   │   │   │   │   └── page.tsx   # Workflow visualizer
│   │   │   │   ├── prompts/
│   │   │   │   │   └── page.tsx   # Prompt browser/editor
│   │   │   │   ├── traces/
│   │   │   │   │   ├── page.tsx   # Trace list
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx # Trace detail (AgentPrism)
│   │   │   │   └── export/
│   │   │   │       └── page.tsx   # Export interface
│   │   │
│   │   ├── api/
│   │   │   └── audit/
│   │   │       ├── agents/
│   │   │       │   ├── route.ts   # GET /api/audit/agents
│   │   │       │   └── [name]/
│   │   │       │       └── route.ts # GET /api/audit/agents/:name
│   │   │       ├── workflows/
│   │   │       │   └── route.ts   # GET /api/audit/workflows
│   │   │       ├── commands/
│   │   │       │   └── route.ts   # GET /api/audit/commands
│   │   │       ├── traces/
│   │   │       │   ├── route.ts   # GET /api/audit/traces (list)
│   │   │       │   ├── ingest/
│   │   │       │   │   └── route.ts # POST (Langfuse webhook)
│   │   │       │   └── [id]/
│   │   │       │       └── route.ts # GET (single trace)
│   │   │       ├── export/
│   │   │       │   └── route.ts   # POST /api/audit/export
│   │   │       └── sync/
│   │   │           └── route.ts   # POST (re-parse .claude/)
│   │   │
│   │   ├── layout.tsx             # Root layout (wrap with ClerkProvider)
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── audit/
│   │   │   ├── AgentCard.tsx      # Agent info card
│   │   │   ├── AgentRoster.tsx    # Grid of agents
│   │   │   ├── WorkflowDiagram.tsx # SVG workflow visualization
│   │   │   ├── PromptViewer.tsx   # Markdown display with syntax highlighting
│   │   │   ├── TraceList.tsx      # List of traces (table)
│   │   │   ├── TraceViewer.tsx    # AgentPrism integration
│   │   │   ├── DecisionTree.tsx   # Decision visualization
│   │   │   ├── ExportPanel.tsx    # Export configuration UI
│   │   │   ├── SearchBar.tsx      # Full-text search
│   │   │   ├── MetricCard.tsx     # Stats display
│   │   │   └── AuditNav.tsx       # Navigation sidebar
│   │   │
│   │   └── ui/                    # Existing UI components
│   │       └── ...
│   │
│   └── lib/
│       ├── db.ts                  # PostgreSQL client (Neon)
│       │
│       ├── audit/
│       │   ├── parser.ts          # Parse .claude/ markdown files
│       │   ├── analyzer.ts        # Analyze agent patterns
│       │   ├── exporter.ts        # Generate audit exports
│       │   ├── types.ts           # TypeScript types
│       │   └── utils.ts           # Helper functions
│       │
│       ├── langfuse/
│       │   ├── client.ts          # Langfuse SDK client
│       │   ├── ingest.ts          # Trace ingestion logic
│       │   └── types.ts           # Langfuse data types
│       │
│       └── clerk/
│           └── utils.ts           # Auth helper functions
│
├── middleware.ts                  # Clerk auth middleware
│
├── .env                           # Environment variables (NeonDB, Clerk)
│
├── docker-compose.yml             # Langfuse self-hosted setup
│
└── scripts/
    ├── seed-db.ts                 # Initial data seeding
    └── parse-agents.ts            # One-time agent parsing script
```

---

## Dependencies to Install

```bash
# Database & ORM
npm install pg @vercel/postgres

# Markdown parsing
npm install gray-matter marked
npm install -D @types/marked

# Langfuse
npm install langfuse

# AgentPrism (check if npm package exists, else manual installation)
# npm install agent-prism  # If available
# Or copy components from: https://github.com/evilmartians/agent-prism

# Visualization
npm install recharts
npm install react-syntax-highlighter
npm install -D @types/react-syntax-highlighter

# Utilities
npm install date-fns
npm install clsx

# TOON Format (Token-Oriented Object Notation)
npm install @toon-format/toon
```

---

## Environment Variables

Update `.env`:
```bash
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_SESSION_MAX_AGE=604800000

# Langfuse (self-hosted)
LANGFUSE_HOST=http://localhost:3001
LANGFUSE_PUBLIC_KEY=pk_...
LANGFUSE_SECRET_KEY=sk_...

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Implementation Checklist

### Phase 1 (MVP - Today)
- [ ] Create PostgreSQL schema in NeonDB
- [ ] Set up database client (`src/lib/db.ts`)
- [ ] Configure Clerk middleware and layout
- [ ] Build markdown parser (`src/lib/audit/parser.ts`)
- [ ] Create API routes for agents, workflows, commands
- [ ] Build agent roster UI (`/audit/agents`)
- [ ] Build workflow visualizer (`/audit/workflows`)
- [ ] Build prompt browser (`/audit/prompts`)
- [ ] Add search functionality
- [ ] Test auth flow (login/logout)
- [ ] Seed database with parsed `.claude/` data
- [ ] Verify all pages load correctly

### Phase 2 (Observability - This Week)
- [ ] Set up Langfuse with Docker Compose
- [ ] Configure Langfuse to use NeonDB
- [ ] Install Langfuse SDK
- [ ] Create trace ingestion endpoint
- [ ] Test manual trace creation
- [ ] Install/integrate AgentPrism components
- [ ] Build trace list page (`/audit/traces`)
- [ ] Build trace detail page with AgentPrism visualization
- [ ] Build export functionality
- [ ] Test end-to-end trace flow

### Phase 3 (Advanced - Future)
- [ ] Implement SSE for real-time updates
- [ ] Build performance metrics dashboard
- [ ] Add prompt versioning UI
- [ ] Create optimization recommendation system
- [ ] Integrate with prompt-engineer agent

---

## Verification Steps

### After Phase 1:
1. **Database Connection**: Run `npm run seed-db` successfully
2. **Auth**: Login with Clerk, verify 7-day session
3. **API Routes**:
   - `curl http://localhost:3000/api/audit/agents` returns all 11 agents
   - `curl http://localhost:3000/api/audit/workflows` returns 4 workflows
4. **UI Pages**:
   - `/audit` loads dashboard
   - `/audit/agents` shows 11 agent cards
   - `/audit/workflows` displays 4 workflow diagrams
   - `/audit/prompts` shows markdown files
5. **Search**: Type "security" in search bar, filters to security-auditor
6. **Navigation**: All links work, no 404s

### After Phase 2:
1. **Langfuse**:
   - Access Langfuse UI at `http://localhost:3001`
   - Verify connection to NeonDB
   - Create test trace via API
2. **Trace Viewing**:
   - `/audit/traces` lists traces from database
   - Click trace → `/audit/traces/:id` shows AgentPrism visualization
3. **Export**:
   - Generate TOON export (`audit.toon`)
   - Verify file downloads
   - Check `exports` table has record

### After Phase 3:
1. **Real-time**: Open `/audit` in two browsers, see live updates
2. **Metrics**: `/audit/metrics` shows agent performance stats
3. **Optimization**: Export audit data → feed to prompt-engineer → receive suggestions

---

## Critical Files Summary

### Database
- `scripts/schema.sql` - PostgreSQL schema
- `src/lib/db.ts` - Database client

### Parsing
- `src/lib/audit/parser.ts` - Markdown parser
- `src/lib/audit/types.ts` - TypeScript types

### API
- `src/app/api/audit/agents/route.ts` - Agent CRUD
- `src/app/api/audit/traces/route.ts` - Trace list
- `src/app/api/audit/traces/ingest/route.ts` - Langfuse webhook
- `src/app/api/audit/export/route.ts` - Export generation

### UI Pages
- `src/app/(audit)/audit/page.tsx` - Dashboard
- `src/app/(audit)/audit/agents/page.tsx` - Agent roster
- `src/app/(audit)/audit/workflows/page.tsx` - Workflows
- `src/app/(audit)/audit/traces/[id]/page.tsx` - Trace detail

### Components
- `src/components/audit/AgentRoster.tsx` - Agent grid
- `src/components/audit/TraceViewer.tsx` - AgentPrism integration
- `src/components/audit/WorkflowDiagram.tsx` - SVG diagrams

### Config
- `middleware.ts` - Clerk auth
- `src/app/layout.tsx` - ClerkProvider wrapper
- `docker-compose.yml` - Langfuse setup

---

## Design Decisions (Confirmed)

1. **Langfuse Deployment**: ✅ Docker Compose locally - simple setup connected to NeonDB

2. **Data Ingestion**: ✅ Build API endpoint for programmatic ingestion - allows automated conversation log capture

3. **Prompt Editing**: ✅ View only - Read-only markdown viewer for observability. The prompt-engineer agent and user will review but edit files directly in `.claude/` directory for safety.

4. **Multi-Tenancy**: ✅ Single tenant design - optimized for 1-2 users, simpler schema

5. **Purpose**: Observability and improvement tool specifically for the prompt-engineer agent to review decisions and for user oversight

6. **AgentPrism**: If no npm package exists, copy components directly from Evil Martians GitHub repo

7. **Branding**: Keep "BigTurbo" branding for now

---

## UI Design System

**Design the BigTurbo UI using a developer-first technical infographic style inspired by retro engineering documentation and modern API specs.**

### Core Style Direction
- Visual tone: **engineering-grade, precise, documentation-like**
- Feel: *"Built by engineers, for engineers"*
- No marketing gloss, no playful UI, no consumer app tropes

### Color System
- Background: warm pale yellow / off-white paper tone
- Foreground: deep navy or near-black blue
- Accent: same navy used sparingly with **diagonal hatch patterns** to indicate transformation, compression, or processing
- No gradients, no shadows, no transparency

### Typography
- Primary font: **monospaced or mono-inspired sans serif**
- All UI labels feel code-adjacent
- Clear hierarchy:
  - Large, bold headings
  - Compact subheadings
  - Small, utilitarian labels
- Use technical symbols (`→`, `≈`, `ø`, `⋯`) where appropriate

### Layout & Structure
- Strong grid alignment
- Left-to-right information flow
- Sections feel like documentation panels, not cards
- Sharp corners only (no rounding)
- Thin, consistent stroke widths

### UI Components
- Panels: flat rectangles with thin borders
- Dividers: solid or dashed lines to indicate boundaries or interfaces
- Buttons: text-first, minimal padding, no hover animations beyond subtle underline or color shift
- Inputs: boxed, monospace text, terminal-adjacent feel

### Visual Language
- Use **diagrams over illustrations**
- Prefer arrows, boxes, and labeled flows
- Dashed lines = abstraction or interface boundary
- Hatched fills = compression, encoding, or reduced entropy
- Icons should be geometric, line-based, and minimal

### Data Presentation
- Favor relative comparisons over decorative charts
- Flat bars, arrows, and percentages
- No chart chrome (axes, grids, legends unless essential)
- Numbers feel factual, not promotional

### Content Tone
- Short, declarative phrases
- No hype language
- Assume a technically literate user
- Commands and code snippets displayed inline in monospace

### What to Avoid
- Rounded corners
- Drop shadows
- Gradients or glass effects
- Emoji, illustrations, or mascots
- Marketing copy or buzzwords

### Overall Goal
The BigTurbo UI should feel like:
- A technical spec made interactive
- A GitHub README turned into a product
- A system diagram you can operate

---

## Agent Orchestration

This section maps the 11 custom agents (`.claude/agents/*.md`) to specific implementation tasks. Agents are organized for maximum parallelization where dependencies allow.

### Phase 1: Foundation & MVP

#### Wave 1.1 — Database & Dependencies (Parallel)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **sql-pro** | Create PostgreSQL schema in NeonDB | `scripts/schema.sql`, verified tables, indexes |
| **dependency-manager** | Install & configure packages | gray-matter, marked, langfuse, recharts, date-fns, @toon-format/toon |

#### Wave 1.2 — Core Infrastructure (Parallel)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **fullstack-developer** | Database client setup | `src/lib/db.ts` with NeonDB connection |
| **fullstack-developer** | Clerk middleware & layout | `middleware.ts`, updated `app/layout.tsx` |
| **api-designer** | Design API route structure | Route specs for `/api/audit/*` endpoints |

#### Wave 1.3 — Parser & API Routes (Parallel)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **fullstack-developer** | Markdown parser | `src/lib/audit/parser.ts`, `types.ts` |
| **api-designer** | Implement API routes | Routes for agents, workflows, commands, sync |

#### Wave 1.4 — UI Components (Parallel)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **fullstack-developer** | Audit UI components | AgentCard, AgentRoster, WorkflowDiagram, PromptViewer, SearchBar, AuditNav |
| **fullstack-developer** | Audit pages | `/audit`, `/audit/agents`, `/audit/agents/[name]`, `/audit/workflows`, `/audit/prompts` |

#### Wave 1.5 — Review & QA (Sequential)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **security-auditor** | Review Clerk auth setup | Security assessment of middleware, session config |
| **code-reviewer** | Review Phase 1 code | Code quality report, suggested fixes |
| **qa-expert** | Verification testing | Test all Phase 1 deliverables per checklist |

### Phase 2: Observability Integration

#### Wave 2.1 — Langfuse Setup (Sequential)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **devops-engineer** | Docker Compose for Langfuse | `docker-compose.yml`, NeonDB connection config |
| **devops-engineer** | Environment configuration | Updated `.env` with Langfuse keys |

#### Wave 2.2 — SDK & Ingestion (Parallel)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **fullstack-developer** | Langfuse SDK client | `src/lib/langfuse/client.ts`, `ingest.ts`, `types.ts` |
| **api-designer** | Trace ingestion endpoint | `POST /api/audit/traces/ingest` webhook |

#### Wave 2.3 — Visualization & Export (Parallel)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **fullstack-developer** | AgentPrism integration | TraceViewer, DecisionTree components |
| **fullstack-developer** | Trace pages | `/audit/traces`, `/audit/traces/[id]` |
| **fullstack-developer** | TOON export functionality | `src/lib/audit/exporter.ts` with TOON encoding |
| **api-designer** | Export API | `POST /api/audit/export` route (returns `.toon` files) |

#### Wave 2.4 — Review & QA (Sequential)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **security-auditor** | Review trace ingestion | Security assessment of webhook, data handling |
| **code-reviewer** | Review Phase 2 code | Code quality report |
| **qa-expert** | End-to-end testing | Langfuse → UI → TOON Export flow verified |

### Phase 3: Advanced Features

#### Wave 3.1 — Real-Time (Sequential)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **fullstack-developer** | SSE endpoint | Real-time trace streaming |
| **fullstack-developer** | Live dashboard updates | Active agent indicators, live trace list |

#### Wave 3.2 — Metrics & Analytics (Parallel)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **sql-pro** | Performance queries | Agent stats, success rates, bottleneck analysis SQL |
| **fullstack-developer** | Metrics dashboard | MetricCard components, charts with Recharts |

#### Wave 3.3 — Prompt Optimization (Parallel)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **fullstack-developer** | Prompt versioning UI | Version history, diff view, rollback UI |
| **prompt-engineer** | Optimization workflow | TOON audit data → recommendations pipeline |

#### Wave 3.4 — Final Review (Sequential)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **security-auditor** | Full security audit | Comprehensive security report |
| **code-reviewer** | Final code review | Technical debt assessment |
| **qa-expert** | Full test suite | All verification steps passed |
| **documentation-engineer** | API documentation | OpenAPI spec, TOON format guide |

### Agent Utilization Summary

| Agent | Phase 1 | Phase 2 | Phase 3 | Total |
|-------|---------|---------|---------|-------|
| fullstack-developer | 5 | 5 | 4 | **14** |
| api-designer | 2 | 2 | 0 | **4** |
| sql-pro | 1 | 0 | 1 | **2** |
| devops-engineer | 0 | 2 | 0 | **2** |
| dependency-manager | 1 | 0 | 0 | **1** |
| security-auditor | 1 | 1 | 1 | **3** |
| code-reviewer | 1 | 1 | 1 | **3** |
| qa-expert | 1 | 1 | 1 | **3** |
| prompt-engineer | 0 | 0 | 1 | **1** |
| documentation-engineer | 0 | 0 | 1 | **1** |

### Execution Strategy

**Parallelization Rules:**
1. Agents in the same "Wave" run in parallel (single message, multiple Task tool calls)
2. Waves execute sequentially within each phase
3. Review agents (security-auditor, code-reviewer, qa-expert) gate each phase

**Critical Path:**
```
Wave 1.1 (db + deps) → Wave 1.2 (infrastructure) → Wave 1.3 (parser + api) → Wave 1.4 (ui) → Wave 1.5 (review) → Phase 2...
```

---

## Summary

This plan provides a clear path to build a comprehensive agent audit UI in three phases:

1. **Phase 1 (Today)**: Core dashboard with agent roster, workflows, and prompt browser
2. **Phase 2 (This Week)**: Langfuse integration for tracing + AgentPrism for visualization
3. **Phase 3 (Future)**: Real-time monitoring, metrics, and optimization loop

The architecture leverages:
- **Langfuse** for data storage and prompt management
- **AgentPrism** for beautiful React visualizations
- **PostgreSQL** as the single source of truth
- **Clerk** for simple, long-session authentication

All features are designed to serve the meta-project goal: improving the agent team itself through systematic auditing and data-driven optimization.

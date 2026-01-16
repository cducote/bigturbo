# Past Plan: Command Tracing & Workflow Enhancements

**Completed**: January 15, 2026
**Duration**: ~3 phases each, executed in parallel sessions
**Status**: COMPLETED

**Agents Involved**:
- fullstack-developer (hook scripts, parser fixes, UI components)
- api-designer (API enhancements, types, documentation)
- code-reviewer (security reviews, approval gates)
- qa-expert (test scenarios)
- documentation-engineer (tracing guide)
- prompt-engineer (consultation on launch mechanism)

---

## Summary

This archive contains two related implementation plans that were executed to enhance the BigTurbo audit system:

### Plan 1: Automatic Command Tracing via Claude Code Hooks

Implemented automatic trace collection for `/commands` using Claude Code hooks. When a user runs a command like `/feature` or `/bugfix`, traces are automatically sent to the BigTurbo audit dashboard without any manual instrumentation. Regular chat conversations remain untraced - only structured workflows are captured for audit and improvement by the prompt-engineer.

**Key Deliverables**:
- Hook scripts in `.claude/hooks/` (trace-start.sh, trace-end.sh, trace-utils.sh)
- Hook configuration in `.claude/settings.json`
- Enhanced `/api/audit/traces/ingest` endpoint for hook payloads
- Optional PostToolUse hook for rich span data
- Documentation in `docs/tracing.md`

### Plan 2: Workflows Page Enhancement and Orchestration Features

Enhanced the workflows page to display all workflow tiles (including spot and feature), enabled launching Claude in plan mode from the browser with templated prompts, and established the Orchestration Plan section format for all implementation plans.

**Key Deliverables**:
- Fixed `extractWorkflowSteps()` parser to handle multiple workflow formats
- WorkflowPromptWizard and CommandLaunchModal UI components
- Workflow launch API endpoint
- Orchestration types in `src/types/orchestration.ts`
- All 5 workflow tiles visible on `/audit/workflows`

---

---

# Automatic Command Tracing via Claude Code Hooks

## Overview

Implement automatic trace collection for `/commands` using Claude Code hooks. When a user runs a command like `/feature` or `/bugfix`, traces will be automatically sent to the BigTurbo audit dashboard without any manual instrumentation.

### Goal
- `/commands` (structured workflows) are automatically traced
- Regular chat conversations are NOT traced
- The prompt-engineer can analyze traces to improve agent prompts

---

## Architecture

```
+---------------------------------------------------------------------+
|                       TRACE FLOW                                     |
|                                                                      |
|   User runs /feature                                                 |
|         |                                                            |
|         v                                                            |
|   UserPromptSubmit Hook                                              |
|   |-- Detects /command pattern                                       |
|   |-- Creates trace via POST /api/audit/traces/ingest                |
|   +-- Sets TRACE_ID env var                                          |
|         |                                                            |
|         v                                                            |
|   Claude executes command (agents work)                              |
|         |                                                            |
|         v                                                            |
|   Stop Hook                                                          |
|   |-- Checks if TRACE_ID exists                                      |
|   |-- Marks trace as completed                                       |
|   +-- Captures final status                                          |
|         |                                                            |
|         v                                                            |
|   BigTurbo Audit Dashboard                                           |
|   +-- Displays trace in /audit/traces                                |
+---------------------------------------------------------------------+
```

---

## Hook Events Used

| Hook | Purpose | Trigger |
|------|---------|---------|
| `UserPromptSubmit` | Detect `/command` invocation, create trace | User submits prompt starting with `/` |
| `Stop` | Mark trace as completed | Claude finishes responding |
| `SubagentStop` | Track agent handoffs (optional) | Subagent task completes |

---

## Implementation Phases

### Phase 1: Core Hook Infrastructure

#### Wave 1.1 - Hook Scripts (fullstack-developer)

**Create hook scripts in `.claude/hooks/`:**

1. **`trace-start.sh`** - Detects command and starts trace
   - Reads UserPromptSubmit input from stdin
   - Checks if prompt starts with `/` (command pattern)
   - If command: POST to `/api/audit/traces/ingest` to create trace
   - Writes TRACE_ID to env file for later hooks
   - If not command: exits silently (no trace)

2. **`trace-end.sh`** - Completes trace
   - Reads Stop hook input from stdin
   - Checks if TRACE_ID env var exists
   - If exists: POST to `/api/audit/traces/ingest` to update trace status
   - Clears TRACE_ID

3. **`trace-utils.sh`** - Shared utilities
   - Functions for API calls to ingest endpoint
   - Environment variable handling
   - Error logging

**Deliverables:**
- `.claude/hooks/trace-start.sh`
- `.claude/hooks/trace-end.sh`
- `.claude/hooks/trace-utils.sh`

#### Wave 1.2 - Hook Configuration (fullstack-developer)

**Update `.claude/settings.json`:**

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/trace-start.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/trace-end.sh"
          }
        ]
      }
    ]
  }
}
```

**Deliverables:**
- Updated `.claude/settings.json` with hook configuration

#### Wave 1.3 - API Enhancement (api-designer)

**Enhance `/api/audit/traces/ingest` to support hook payloads:**

Current endpoint expects Langfuse-style events. Ensure it handles:
- `trace.create` with command name, prompt text, timestamp
- `trace.update` with status (completed/failed), duration

May need to add:
- Command name extraction from prompt
- Auto-detection of agent from command definition
- Session ID tracking

**Deliverables:**
- Enhanced ingest route handling hook payloads

---

### Phase 2: Rich Trace Data

#### Wave 2.1 - Tool Call Tracking (fullstack-developer)

**Optional: Add PostToolUse hook to capture spans:**

```json
{
  "PostToolUse": [
    {
      "matcher": "*",
      "hooks": [
        {
          "type": "command",
          "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/trace-span.sh"
        }
      ]
    }
  ]
}
```

This would capture:
- Tool name (Read, Write, Edit, Bash, etc.)
- Tool input/output
- Duration
- Success/failure

**Deliverables:**
- `.claude/hooks/trace-span.sh`
- Updated hook configuration

#### Wave 2.2 - Agent Detection (fullstack-developer)

**Parse command to determine involved agents:**

When `/feature` is run:
1. Read `.claude/commands/feature.md`
2. Extract workflow steps and agent names
3. Include in trace metadata

**Deliverables:**
- Command parsing in trace-start.sh
- Agent metadata in traces

---

### Phase 3: Testing & Documentation

#### Wave 3.1 - QA (qa-expert)

**Test scenarios:**
1. Run `/feature` - verify trace appears in dashboard
2. Run `/bugfix` - verify trace appears with correct command name
3. Run normal chat - verify NO trace is created
4. Check `/audit/traces` shows correct status progression
5. Verify `/audit/metrics` aggregates command traces

**Deliverables:**
- Test report with all scenarios verified

#### Wave 3.2 - Documentation (documentation-engineer)

**Document:**
- How automatic tracing works
- How to disable tracing if needed
- Troubleshooting hook issues
- API format for trace ingestion

**Deliverables:**
- Updated docs with tracing guide

---

## File Structure

```
.claude/
|-- agents/                    # Existing agent definitions
|-- commands/                  # Existing command definitions
|-- hooks/                     # NEW: Hook scripts
|   |-- trace-start.sh        # UserPromptSubmit hook
|   |-- trace-end.sh          # Stop hook
|   |-- trace-span.sh         # PostToolUse hook (optional)
|   +-- trace-utils.sh        # Shared utilities
|-- settings.json             # Hook configuration (shared)
+-- settings.local.json       # Local overrides
```

---

## Hook Script Details

### trace-start.sh

```bash
#!/bin/bash
# UserPromptSubmit hook - detects /commands and creates traces

set -e
source "$CLAUDE_PROJECT_DIR/.claude/hooks/trace-utils.sh"

# Read input from stdin
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty')

# Check if this is a /command
if [[ "$PROMPT" =~ ^/([a-zA-Z0-9_-]+) ]]; then
    COMMAND_NAME="${BASH_REMATCH[1]}"

    # Create trace
    TRACE_ID=$(create_trace "$COMMAND_NAME" "$PROMPT")

    # Store trace ID for Stop hook
    if [ -n "$CLAUDE_ENV_FILE" ]; then
        echo "export BIGTURBO_TRACE_ID=$TRACE_ID" >> "$CLAUDE_ENV_FILE"
        echo "export BIGTURBO_TRACE_START=$(date +%s)" >> "$CLAUDE_ENV_FILE"
    fi

    # Output context for Claude (optional)
    echo "Trace started: $TRACE_ID"
fi

exit 0
```

### trace-end.sh

```bash
#!/bin/bash
# Stop hook - completes traces

set -e
source "$CLAUDE_PROJECT_DIR/.claude/hooks/trace-utils.sh"

# Check if we have an active trace
if [ -n "$BIGTURBO_TRACE_ID" ]; then
    # Calculate duration
    END_TIME=$(date +%s)
    DURATION_MS=$(( (END_TIME - BIGTURBO_TRACE_START) * 1000 ))

    # Complete trace
    complete_trace "$BIGTURBO_TRACE_ID" "completed" "$DURATION_MS"
fi

exit 0
```

### trace-utils.sh

```bash
#!/bin/bash
# Shared utilities for trace hooks

INGEST_URL="${BIGTURBO_URL:-http://localhost:3000}/api/audit/traces/ingest"
WEBHOOK_SECRET="${TRACE_WEBHOOK_SECRET:-}"

create_trace() {
    local COMMAND_NAME="$1"
    local PROMPT="$2"

    local PAYLOAD=$(jq -n \
        --arg cmd "$COMMAND_NAME" \
        --arg prompt "$PROMPT" \
        '{
            type: "trace.create",
            payload: {
                name: ("/" + $cmd),
                agentName: "command",
                commandName: $cmd,
                input: { prompt: $prompt }
            }
        }')

    local RESPONSE=$(curl -s -X POST "$INGEST_URL" \
        -H "Content-Type: application/json" \
        -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
        -d "$PAYLOAD")

    echo "$RESPONSE" | jq -r '.traceId // empty'
}

complete_trace() {
    local TRACE_ID="$1"
    local STATUS="$2"
    local DURATION_MS="$3"

    local PAYLOAD=$(jq -n \
        --arg id "$TRACE_ID" \
        --arg status "$STATUS" \
        --argjson duration "$DURATION_MS" \
        '{
            type: "trace.update",
            payload: {
                traceId: $id,
                status: $status,
                metadata: { durationMs: $duration }
            }
        }')

    curl -s -X POST "$INGEST_URL" \
        -H "Content-Type: application/json" \
        -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
        -d "$PAYLOAD" > /dev/null
}
```

---

## Environment Variables

Add to `.env`:

```bash
# Tracing (already exists)
TRACE_WEBHOOK_SECRET=Zlxdd6DKf+fv+/XO4RFPVQOzy8VP8NCK1yARj7oFxGY=

# BigTurbo URL (for hooks to call)
BIGTURBO_URL=http://localhost:3000
```

---

## Agent Orchestration

### Wave 1 (Parallel)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **fullstack-developer** | Create hook scripts | `.claude/hooks/*.sh` |
| **api-designer** | Enhance ingest endpoint | Updated `/api/audit/traces/ingest` |

### Wave 2 (Sequential)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **fullstack-developer** | Add PostToolUse hook for spans | `trace-span.sh`, config update |
| **fullstack-developer** | Command parsing for agent detection | Enhanced trace metadata |

### Wave 3 (Parallel)

| Agent | Task | Deliverables |
|-------|------|--------------|
| **qa-expert** | Test all scenarios | Test report |
| **documentation-engineer** | Write tracing guide | docs/tracing.md |

---

## Verification Steps

### After Phase 1:
1. Run `/feature test-feature` in Claude Code
2. Check `/audit/traces` - new trace should appear with command name
3. Wait for Claude to finish responding
4. Verify trace status changes to "completed"
5. Run a normal question (no `/`) - verify NO trace created

### After Phase 2:
1. Run `/bugfix fix-something`
2. Check trace has span data for tool calls
3. Verify agent names appear in trace metadata

### After Phase 3:
1. All test scenarios pass
2. Documentation is complete
3. Build passes: `npm run build`

---

## Summary

This plan adds automatic tracing for `/commands` without modifying command prompts or requiring manual instrumentation. The hooks:

1. **Detect** when a `/command` is invoked
2. **Create** a trace via the existing ingest API
3. **Complete** the trace when Claude finishes

Regular conversations are untouched - only structured commands are traced for audit and improvement by the prompt-engineer.

---

---

# Workflows Page Enhancement and Orchestration Features

## Overview

Enhance the workflows page to display all workflow tiles (including spot and feature), enable launching Claude in plan mode from the browser, and add Orchestration Plan sections to all implementation plans.

### Goals
- Display all 5 workflow tiles on `/audit/workflows` page
- Click workflow tile -> launches Claude in plan mode with templated prompts
- Generate `IMPLEMENTATION_PLAN.md` with Orchestration Plan section
- Generate handoff prompt for dangerous permission mode
- Organize agents for maximum parallelization

---

## Problem Analysis

### Issue 1: Missing Workflow Tiles

The workflows page at `/audit/workflows` fetches workflows via `/api/audit/workflows`. The API uses `parseAllWorkflows()` from `src/lib/audit/parser.ts`. The parser's `extractWorkflowSteps()` function looks for patterns like `1. **agent-name** -> action`.

The `spot.md` and `feature.md` commands have workflows described in ASCII diagrams and prose format rather than numbered lists with bold agent names. Only `bugfix.md`, `maintenance.md`, and `migration.md` have the expected format.

### Issue 2: Claude Plan Mode Launch

No existing mechanism to launch Claude in plan mode from the browser. Claude Code does not have a registered URL scheme (like `vscode://`) that browsers can invoke.

**Decision (via prompt-engineer consultation):** Use copyable command approach since browser-to-CLI bridging is unreliable; explicit user action ensures reliability.

### Issue 3: IMPLEMENTATION_PLAN.md Structure

Need new Orchestration Plan section mapping agents to tasks with maximum parallelization.

---

## Implementation Phases

### Phase 1: Parser Fix and Types (Parallel)

#### Wave 1.1 - Can run in parallel:

| Agent | Task | Files |
|-------|------|-------|
| **fullstack-developer** | Fix `extractWorkflowSteps()` to handle ASCII diagram format and unstructured workflows | `src/lib/audit/parser.ts` |
| **api-designer** | Define new types for orchestration and workflow launch | `src/types/audit.ts`, `src/types/orchestration.ts` (NEW) |

#### Wave 1.2 - Requires Wave 1.1:

| Agent | Task | Files |
|-------|------|-------|
| **code-reviewer** | Review parser changes for regex safety and type completeness | `src/lib/audit/parser.ts`, `src/types/` |

### Phase 2: UI Components (Parallel)

#### Wave 2.1 - Can run in parallel:

| Agent | Task | Files |
|-------|------|-------|
| **fullstack-developer** | Create WorkflowPromptWizard.tsx and CommandLaunchModal.tsx | `src/components/audit/WorkflowPromptWizard.tsx` (NEW), `src/components/audit/CommandLaunchModal.tsx` (NEW) |
| **api-designer** | Create workflow launch API endpoint | `src/app/api/audit/workflows/launch/route.ts` (NEW) |

#### Wave 2.2 - Requires Wave 2.1:

| Agent | Task | Files |
|-------|------|-------|
| **code-reviewer** | Review UI components and API for security | All new components |

### Phase 3: Integration and Documentation

#### Wave 3.1 - Sequential:

| Agent | Task | Files |
|-------|------|-------|
| **fullstack-developer** | Integrate all components, update workflows page | `src/app/(audit)/audit/workflows/page.tsx`, `src/components/audit/WorkflowDiagram.tsx` |
| **api-designer** | Write API documentation | `docs/api/workflows.md` (NEW) |
| **code-reviewer** | Final review and approval | All modified files |

---

## File Targets

### Files to Modify:
1. `src/lib/audit/parser.ts` - Fix workflow extraction
2. `src/components/audit/WorkflowDiagram.tsx` - Add click handler
3. `src/app/(audit)/audit/workflows/page.tsx` - Add launch capability
4. `src/types/audit.ts` - Add new types

### Files to Create:
1. `src/components/audit/WorkflowPromptWizard.tsx` - Question flow UI
2. `src/components/audit/CommandLaunchModal.tsx` - Launch modal
3. `src/app/api/audit/workflows/launch/route.ts` - Launch API
4. `src/types/orchestration.ts` - Orchestration types
5. `docs/api/workflows.md` - API documentation

---

## Success Criteria

### Workflow Display
- [ ] All 5 workflow tiles appear on `/audit/workflows` page (bugfix, feature, maintenance, migration, spot)
- [ ] Each tile correctly shows agent sequence and step count
- [ ] Tile descriptions match command file content

### Workflow Launch
- [ ] Clicking a workflow tile opens launch modal
- [ ] User can complete templated prompt questions
- [ ] Generated command is copyable and correct
- [ ] Command includes all gathered parameters

### IMPLEMENTATION_PLAN.md
- [ ] Contains Orchestration Plan section
- [ ] Maps agents to specific tasks by phase
- [ ] Includes parallel wave organization
- [ ] Contains handoff prompt for dangerous permission mode

### Code Quality
- [ ] No TypeScript errors
- [ ] All new components have proper types
- [ ] Parser handles edge cases gracefully
- [ ] No security vulnerabilities in command generation

---

## Orchestration Plan

### Overview

This section maps custom agents to specific implementation tasks, organized by phase and optimized for parallel execution where dependencies allow.

### Agent-Task Mapping

| Phase | Wave | Agent(s) | Task | Dependencies | Deliverable |
|-------|------|----------|------|--------------|-------------|
| 1 | 1.1 | fullstack-developer | Fix parser `extractWorkflowSteps()` | None | Parser recognizes all formats |
| 1 | 1.1 | api-designer | Define orchestration types | None | `orchestration.ts` types |
| 1 | 1.2 | code-reviewer | Review Phase 1.1 deliverables | Wave 1.1 complete | Review report |
| 2 | 2.1 | fullstack-developer | Create WorkflowPromptWizard + CommandLaunchModal | Phase 1 complete | UI components |
| 2 | 2.1 | api-designer | Create workflow launch API | Phase 1 complete | API endpoint |
| 2 | 2.2 | code-reviewer | Review Phase 2.1 deliverables | Wave 2.1 complete | Review report |
| 3 | 3.1 | fullstack-developer | Integrate components, update page | Phase 2 complete | Working feature |
| 3 | 3.1 | api-designer | Write API documentation | Phase 2 complete | docs/api/workflows.md |
| 3 | 3.2 | code-reviewer | Final review and approval | Wave 3.1 complete | Approval |

### Parallel Execution Strategy

```
Wave 1.1 (Parallel)
|-- fullstack-developer: Fix parser extractWorkflowSteps()
+-- api-designer: Define orchestration types
    |
    v (sync point)
    |
Wave 1.2 (Sequential)
+-- code-reviewer: Review all Wave 1.1 deliverables
    |
    v
    |
Wave 2.1 (Parallel)
|-- fullstack-developer: Create UI components
+-- api-designer: Create launch API endpoint
    |
    v (sync point)
    |
Wave 2.2 (Sequential)
+-- code-reviewer: Review all Wave 2.1 deliverables
    |
    v
    |
Wave 3.1 (Parallel)
|-- fullstack-developer: Integrate and update page
+-- api-designer: Write API documentation
    |
    v (sync point)
    |
Wave 3.2 (Sequential)
+-- code-reviewer: Final review and approval
```

### Gate Criteria Between Phases

| Gate | Condition | Blocking |
|------|-----------|----------|
| Phase 1 -> Phase 2 | All Phase 1 files created, no TypeScript errors, code review approved | Yes |
| Phase 2 -> Phase 3 | UI components working, API tested, code review approved | Yes |
| Phase 3 -> Complete | All success criteria met, final review approved | Yes |

---

## Handoff Prompt (Dangerous Permission Mode)

Use the following prompt to execute this plan with full agent orchestration:

```
Execute the Workflows Page Enhancement implementation plan using dangerous permission mode.

**Orchestration Instructions:**

1. **Wave 1.1** - Run these agents in PARALLEL:
   - @fullstack-developer: Fix `extractWorkflowSteps()` in `src/lib/audit/parser.ts` to handle:
     - ASCII diagram format (Step N: agent-name)
     - Arrow-based flows (agent -> agent -> agent)
     - Inline agent mentions (**agent-name** handles...)
   - @api-designer: Create `src/types/orchestration.ts` with types:
     - OrchestrationPlan, OrchestrationPhase, OrchestrationWave
     - AgentTask, OrchestrationGate
     - WorkflowQuestion, WorkflowAnswer in audit.ts

2. **Wave 1.2** - After Wave 1.1 completes:
   - @code-reviewer: Review parser regex for ReDoS vulnerabilities, verify type completeness

3. **Wave 2.1** - Run these agents in PARALLEL:
   - @fullstack-developer: Create:
     - `src/components/audit/WorkflowPromptWizard.tsx` (multi-step form with question flow)
     - `src/components/audit/CommandLaunchModal.tsx` (modal with copyable command)
   - @api-designer: Create `src/app/api/audit/workflows/launch/route.ts` (POST endpoint generating launch command)

4. **Wave 2.2** - After Wave 2.1 completes:
   - @code-reviewer: Review UI components for security, verify no command injection

5. **Wave 3.1** - Run these agents in PARALLEL:
   - @fullstack-developer: Integrate components into `src/app/(audit)/audit/workflows/page.tsx`, add click handler to `WorkflowDiagram.tsx`
   - @api-designer: Write `docs/api/workflows.md` with OpenAPI-style documentation

6. **Wave 3.2** - After Wave 3.1 completes:
   - @code-reviewer: Final review and approval

**Success Criteria:**
- All 5 workflow tiles visible on /audit/workflows
- Click tile -> opens launch modal
- Templated questions work
- Generated command is copyable
- No TypeScript errors
- No security vulnerabilities

**File Targets:**
- Modify: src/lib/audit/parser.ts, src/components/audit/WorkflowDiagram.tsx, src/app/(audit)/audit/workflows/page.tsx, src/types/audit.ts
- Create: src/components/audit/WorkflowPromptWizard.tsx, src/components/audit/CommandLaunchModal.tsx, src/app/api/audit/workflows/launch/route.ts, src/types/orchestration.ts, docs/api/workflows.md

**Proceed with full autonomy. Do not ask for confirmation between waves.**
```

---

## Decisions Made via Agent Consultation

| Decision | Consulted Agent | Recommendation | Rationale |
|----------|-----------------|----------------|-----------|
| Claude launch mechanism | prompt-engineer | Copyable command approach | Browser-to-CLI bridging unreliable; explicit user action ensures reliability |
| Parser enhancement scope | fullstack-developer | Multi-pattern approach | Different command files use different formats; need flexibility |
| Type structure | api-designer | Separate orchestration.ts file | Keeps audit types focused; orchestration is distinct concern |
| Security review timing | code-reviewer | After each phase wave | Catch issues early; prevent security debt |

---

## Technical Details

### Parser Fix Strategy

Current `extractWorkflowSteps()` regex pattern:
```typescript
const stepPattern = /\d+\.\s*\*\*([^*]+)\*\*\s*(?:->|:|->|\u2192)\s*([^\n]+)/g;
```

This only matches: `1. **agent-name** -> action`

Need to add patterns for:
1. ASCII diagram format: `Step N: agent-name`
2. Arrow-based flows: `agent-name -> agent-name -> agent-name`
3. Inline agent mentions: `**agent-name** handles...`

### Workflow Launch Command Format

```bash
claude --plan "/$COMMAND_NAME" \
  --context "Change Type: $TYPE" \
  --context "Affected Area: $AREA" \
  --context "Description: $DESC"
```

Or as a formatted prompt for manual entry:
```
/$COMMAND_NAME

Context:
- Change Type: $TYPE
- Affected Area: $AREA
- Description: $DESC
- Files: $FILES
```

### Type Definitions Preview

```typescript
// In src/types/orchestration.ts

export interface OrchestrationPlan {
  id: string;
  name: string;
  phases: OrchestrationPhase[];
  gates: OrchestrationGate[];
  handoffPrompt: string;
}

export interface OrchestrationPhase {
  number: number;
  name: string;
  waves: OrchestrationWave[];
}

export interface OrchestrationWave {
  id: string;
  parallel: boolean;
  tasks: AgentTask[];
  dependencies: string[]; // Wave IDs that must complete first
}

export interface AgentTask {
  agent: string;
  task: string;
  deliverable: string;
  files: string[];
}

export interface OrchestrationGate {
  from: string; // Phase/wave ID
  to: string;
  condition: string;
  blocking: boolean;
}
```

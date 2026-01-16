# Implementation Plan

## Claude Code Self‑Improvement Audit Workflow

## Purpose

This document defines a **safe, agent‑native self‑improvement loop** for Claude Code using Langfuse observability.

The goal is to:

* Turn Langfuse traces and spans into actionable insights
* Use specialist agents to audit behavior (not tokens)
* Produce a **human‑approved implementation plan**
* Execute improvements via Claude Code using a controlled `/plop` handoff

This workflow explicitly avoids unsafe self‑modification and respects the opacity of Claude Code’s LLM runtime.

---

## Core Idea

> **Observability → Diagnosis → Plan → Human‑Approved Execution**

Claude Code does not expose LLM generation or token data. Langfuse is therefore used for **behavioral observability**, not cost accounting.

The system optimizes:

* Planning discipline
* Tool usage efficiency
* Subagent delegation
* Task structure

---

## High‑Level Flow

```
User Command
  ↓
Claude Code Run
  ↓
Langfuse Trace (tasks, tools, subagents)
  ↓
Trace Audit Summary
  ↓
Prompt‑Engineer Audit
  ↓
Refactoring Specialist Translation
  ↓
IMPLEMENTATION_PLAN.md
  ↓
Human‑approved /plop execution
```

---

## `/audit` Command

### Invocation

```
/audit <trace_id | last | sample:N>
```

Implementation notes:
- **last** = most recent completed trace; **sample:N** = random sample of N completed traces.
- Lives in the audit app; fetches trace list then detail per ID.
- Writes normalized summary to `docs/audit/summaries/<trace_id>.json`.

### Responsibilities

1. Retrieve trace + span data from Langfuse
2. Normalize data into an audit‑friendly summary
3. Invoke specialist agents for analysis
4. Produce a concrete implementation plan
5. Write results to `docs/audit/IMPLEMENTATION_PLAN.md`

---

## Step 1: Trace Ingestion

Data collected from Langfuse:

* Span hierarchy
* Task durations
* Tool usage counts
* Subagent invocations
* Error / failure signals

**Raw Langfuse data is not passed directly to agents.** The normalized summary is persisted to `docs/audit/summaries/<trace_id>.json` for reproducibility.

---

## Step 2: Trace Normalization

Create a structured **Trace Audit Summary**:

```json
{
  "trace_id": "abc123",
  "goal": "Add auth middleware",
  "duration_ms": 182000,
  "tasks": 12,
  "subagents": ["security-auditor"],
  "tool_usage": {
    "read": 41,
    "grep": 22,
    "write": 6
  },
  "notable_patterns": [
    "repeated_file_reads",
    "late_planning",
    "tool_thrash"
  ],
  "outcome": "partial_success"
}
```

This summary is the **single shared context** for all auditing agents and is the only artifact they read.

---

## Step 3: `@prompt-engineer` Audit (Diagnosis)

### Role

* Identify behavioral issues
* Map observed patterns → prompt causes
* Propose **prompt‑level** improvements only

### Output (Structured)

```json
{
  "issues": [
    {
      "symptom": "Excessive file reads",
      "root_cause": "No enforced planning phase",
      "recommendation": "Require an explicit PLAN section before tool usage"
    }
  ]
}
```

Constraints:

* No code changes
* No file writes
* No execution instructions

---

## Step 4: `@refactoring-specialist` (Translation)

### Role

* Translate recommendations into concrete repo changes
* Identify affected files
* Define new constraints or conventions

### Output (Structured)

```json
{
  "files_to_change": [
    "prompts/system.md",
    "prompts/tooling.md"
  ],
  "new_constraints": [
    "Require PLAN section before tools",
    "Limit redundant file reads"
  ]
}
```

---

## Step 5: Synthesis → `IMPLEMENTATION_PLAN.md`

The system combines agent outputs into a **single canonical artifact**:

```
docs/audit/IMPLEMENTATION_PLAN.md
```

Canonical location for this artifact: `docs/audit/IMPLEMENTATION_PLAN.md` (keep a single source of truth).

---

## `IMPLEMENTATION_PLAN.md` Structure

```markdown
# Audit Implementation Plan

## Source Trace
- Trace ID: abc123
- Goal: Add auth middleware
- Date: 2026‑01‑15

## Observed Issues
- Excessive file reads before planning
- Redundant grep usage
- Late todo creation

## Root Causes (Prompt‑Level)
- System prompt does not enforce early planning
- Tool usage rules are overly permissive

## Proposed Changes
### 1. Enforce Planning Phase
- Require explicit PLAN section
- Limit plans to ≤7 steps

### 2. Tool Discipline
- Read each file at most once unless justified
- Consolidate grep usage

### 3. Subagent Usage Rules
- Subagents only after core logic stabilizes

## Files to Modify
- prompts/system.md
- prompts/tooling.md

## Claude Code Execution Prompt

Guardrails:
- No runtime code changes; prompt/config files only.
- No package upgrades or installs.
- No infra changes, secrets, or environment edits.
- Stop and ask if scope is unclear.

/plop
Goal: Improve agent planning and tool discipline based on audit findings.

Steps:
1. Update `prompts/system.md` to enforce a mandatory PLAN section before tool usage.
2. Add a rule limiting redundant file reads unless explicitly justified.
3. Update tooling guidelines to discourage repeated grep calls.
4. Ensure subagents are invoked only after core logic is stable.
5. Do NOT modify runtime code — prompt changes only.

Acceptance Criteria (measurable):
- ≥1 post-change run shows a PLAN section emitted before first tool call.
- Tool calls per task decrease versus the audited trace.
- Task success rate does not drop (binary success flag unchanged or improved).
```

---

## Design Principles

* **No automatic self‑mutation**
* **Human‑approved execution only**
* **Behavioral optimization, not token optimization**
* **Agents propose, humans decide**

---

## What This System Is Not

* ❌ RLHF
* ❌ Fine‑tuning
* ❌ Token cost optimization
* ❌ Autonomous self‑modifying agents

---

## What This System Enables

* Continuous improvement of agent behavior
* Prompt governance with audit trails
* Safer long‑running agent evolution
* Reproducible, reviewable changes

---

## Mental Model

> **Prompt‑Engineer = Systems Diagnostician**

> **Refactoring‑Specialist = Change Translator**

> **Claude Code = Executor (on human approval)**

Langfuse provides the telemetry backbone; agents provide insight; humans retain control.

---

## Future Extensions (Optional)

* Confidence scoring per recommendation
* Risk level tagging (Low / Medium / High)
* Regression tracking across audits
* Audit history in `docs/audit/YYYY‑MM‑DD‑*.md`

---

**This workflow treats agent improvement like software engineering — not magic.**
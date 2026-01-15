# Implementation Plan — Multi-Agent SaaS Workflow (Next.js + Neon/Postgres + Stripe + Clerk)

This project will use a small, repeatable set of Claude Code subagents (installed into `.claude/agents/`) plus lightweight “loops” for feature work, bugfixes, migrations, and maintenance.

Team (10 agents):
- fullstack-developer
- api-designer
- sql-pro
- code-reviewer
- qa-expert
- security-auditor
- devops-engineer
- dependency-manager
- documentation-engineer
- refactoring-specialist

Agents are sourced from VoltAgent’s `awesome-claude-code-subagents` repo. :contentReference[oaicite:0]{index=0}

---

## Task 1 — Programmatically install (clone/copy) the 10 agents into this repo

### Goal
Automate pulling the latest versions of the 10 agent markdown files from:
`https://github.com/VoltAgent/awesome-claude-code-subagents`

The upstream repo explicitly supports “copy desired agent files to `.claude/agents/`” and provides a standalone installer script. :contentReference[oaicite:1]{index=1}

### Option A (recommended): “no clone required” installer + deterministic selection
Upstream provides a standalone installer script that downloads agents directly from GitHub (no clone required). :contentReference[oaicite:2]{index=2}  
However, it’s interactive by default. For deterministic installs, we’ll add our own script that downloads *only* our 10 agents by raw URL (Option B), which is fully repeatable in CI and local dev.

### Option B (deterministic): add a repo script that fetches exact agent files
Create: `scripts/install-claude-agents.sh`

It should:
1) Create `.claude/agents/`
2) Download the 10 markdown files from their canonical paths in the upstream repo
3) Save them as `.claude/agents/<agent-name>.md`
4) (Optional) write a `scripts/agents.lock` file containing the upstream commit SHA for traceability

**Canonical upstream paths (as of the current repo layout):**
- `categories/01-core-development/fullstack-developer.md` :contentReference[oaicite:3]{index=3}
- `categories/01-core-development/api-designer.md` :contentReference[oaicite:4]{index=4}
- `categories/02-language-specialists/sql-pro.md` :contentReference[oaicite:5]{index=5}
- `categories/04-quality-security/code-reviewer.md` :contentReference[oaicite:6]{index=6}
- `categories/04-quality-security/qa-expert.md` :contentReference[oaicite:7]{index=7}
- `categories/04-quality-security/security-auditor.md` :contentReference[oaicite:8]{index=8}
- `categories/03-infrastructure/devops-engineer.md` :contentReference[oaicite:9]{index=9}
- `categories/06-developer-experience/dependency-manager.md` :contentReference[oaicite:10]{index=10}
- `categories/06-developer-experience/documentation-engineer.md` :contentReference[oaicite:11]{index=11}
- `categories/06-developer-experience/refactoring-specialist.md` :contentReference[oaicite:12]{index=12}

**Implementation notes:**
- Use `curl -fsSL` against raw GitHub content:
  - `https://raw.githubusercontent.com/VoltAgent/awesome-claude-code-subagents/main/<path>`
- Fail fast if any download fails (so CI catches upstream renames)
- Print a short summary at the end (installed agents list)

**Acceptance criteria**
- Running `./scripts/install-claude-agents.sh` results in exactly 10 files under `.claude/agents/`
- A fresh clone of this repo can install agents without manual steps
- Script is safe to re-run (idempotent overwrite is OK)

---

## Task 2 — Add a project “Agent Charter” (how agents are used here)

Create: `docs/ai/AGENT_CHARTER.md`

Include:
- The 10 agents + what each owns (one job each)
- What each agent must output (structured handoff)
- “Escalation rules” (when to pull in security/devops/docs)
- “Stop rules” (when the agent should stop and ask for human decision)

**Suggested ownership**
- fullstack-developer: implements end-to-end features (Next.js + Clerk + Stripe + Postgres)
- api-designer: API contracts + server actions/route handlers shapes + error model
- sql-pro: migrations, indexes, query performance, data fixes
- code-reviewer: correctness + maintainability + architecture smells
- qa-expert: tests + test plan + regression coverage
- security-auditor: authz/tenant isolation, secrets, input validation, webhooks, payment integrity
- devops-engineer: env vars, deployment, observability, runbooks
- dependency-manager: upgrades, lockfiles, CVEs, bundle weight, breaking changes
- documentation-engineer: user docs + support docs + runbooks polish
- refactoring-specialist: cleanup passes (no behavior change)

---

## Task 3 — Define the “handoff format” (the thing you’ll paste into Copilot in VS Code)

Create: `docs/ai/HANDOFF_TEMPLATE.md`

### Handoff format (required sections)
When you hand off a feature/bug to Copilot or another agent, use:

1) **Context**
- What problem are we solving?
- What repo area is touched?

2) **Acceptance Criteria**
- Bullet list of “done means…”

3) **Constraints**
- Stack: Next.js + Neon/Postgres + Stripe + Clerk
- Any product/UX constraints
- Non-goals

4) **Design Notes**
- Data model changes (tables/columns/indexes)
- API endpoints / route handlers / server actions
- Stripe objects involved (Customer, Subscription, Checkout Session, Webhooks)
- Clerk concepts involved (orgs, roles, JWT claims, middleware)

5) **Implementation Steps (ordered)**
- Each step: file(s) + what changes + why

6) **Testing Plan**
- Unit/integration/e2e
- Manual checklist for local QA

7) **Security Checklist**
- Tenant isolation
- Webhook signature verification
- Authz checks
- PII handling

8) **Release Notes / Rollout**
- Env vars
- Migration order
- Backfill steps
- Monitoring/alerts to watch

**Acceptance criteria**
- Template is short enough to actually use
- Works for: feature, bug, migration

---

## Task 4 — Implement the core “loops” as repeatable workflows

> These are operational patterns: run the same sequence of agents repeatedly.

Create: `docs/ai/WORKFLOWS.md`

### Loop A: Feature delivery (default)
1) api-designer → API/design + acceptance criteria
2) fullstack-developer → implement (small increments)
3) code-reviewer → review (blockers/non-blockers)
4) qa-expert → tests + manual checklist
5) security-auditor → quick threat check (required if auth/billing/data boundary)
6) devops-engineer → rollout + monitoring notes
7) documentation-engineer → docs/support notes
8) (optional) refactoring-specialist → cleanup after feature is correct

### Loop B: Bugfix
1) qa-expert → repro + minimal failing test (when possible)
2) fullstack-developer → fix
3) code-reviewer → review
4) qa-expert → confirm + regression coverage
5) (optional) security-auditor → if auth/billing/tenant boundary touched
6) documentation-engineer → only if behavior changed

### Loop C: Schema change / migration (Neon/Postgres)
1) sql-pro → migration + backfill plan + index changes
2) devops-engineer → deploy/rollback order + monitoring
3) fullstack-developer → implement expand/contract pattern
4) qa-expert → migration test + smoke checklist
5) security-auditor → confirm tenant isolation & least privilege
6) documentation-engineer → runbook updates if ops/support needs them

### Loop D: Maintenance (weekly or pre-release)
1) dependency-manager → safe updates + risk notes
2) refactoring-specialist → cleanup (no behavior change)
3) code-reviewer → guardrails
4) qa-expert → regression
5) devops-engineer → CI health / flaky tests / build perf
6) documentation-engineer → docs freshness

**Acceptance criteria**
- Workflows are “copy/paste runnable” as checklists
- Clear gates: tests exist, security reviewed when relevant, rollout notes written

---

## Task 5 — Add “project-specific checklists” for Clerk + Stripe + Next.js

Create: `docs/ai/CHECKLISTS.md`

Include:
- **Clerk checklist**
  - Middleware / route protection
  - Organization vs user-scoped authorization
  - Server-side auth checks (don’t trust client claims)

- **Stripe checklist**
  - Use webhooks as source-of-truth for subscription state
  - Verify webhook signatures
  - Idempotency keys for writes
  - Avoid trusting client-provided price IDs without server validation

- **Next.js checklist**
  - Server actions vs route handlers decision
  - Caching/revalidation strategy
  - Error boundaries + logging
  - Env var usage (build-time vs runtime)

---

## Task 6 — (Optional) Wire workflows into Claude Code commands
If you want one-command usage, add command files (if you use Claude Code’s command system) that simply embed the workflow checklists and required output format:

- `.claude/commands/feature.md`
- `.claude/commands/bugfix.md`
- `.claude/commands/migration.md`
- `.claude/commands/maintenance.md`

(If you skip this, you can still run the loops manually using the docs above.)

---

## Definition of Done (for this whole plan)
- Script installs the 10 agents into `.claude/agents/`
- Handoff template exists and is used for at least one feature end-to-end
- Workflows doc exists and clearly defines when to invoke which agent
- Clerk/Stripe/Postgres checklists exist so security/review doesn’t miss obvious SaaS footguns

## scripts/install-claude-agents.sh
```
#!/usr/bin/env bash
set -euo pipefail

# Installs a curated set of Claude Code subagents into .claude/agents/
# Source: https://github.com/VoltAgent/awesome-claude-code-subagents

REPO_OWNER="VoltAgent"
REPO_NAME="awesome-claude-code-subagents"
REPO_REF="${REPO_REF:-main}"   # override like: REPO_REF=<commit_sha> ./scripts/install-claude-agents.sh

DEST_DIR=".claude/agents"
LOCK_DIR="scripts"
LOCK_FILE="${LOCK_DIR}/agents.lock"

RAW_BASE="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_REF}"

mkdir -p "${DEST_DIR}"
mkdir -p "${LOCK_DIR}"

# name|relative_path_in_upstream_repo
AGENTS=(
  "fullstack-developer|categories/01-core-development/fullstack-developer.md"
  "api-designer|categories/01-core-development/api-designer.md"
  "sql-pro|categories/02-language-specialists/sql-pro.md"
  "code-reviewer|categories/04-quality-security/code-reviewer.md"
  "qa-expert|categories/04-quality-security/qa-expert.md"
  "security-auditor|categories/04-quality-security/security-auditor.md"
  "devops-engineer|categories/03-infrastructure/devops-engineer.md"
  "dependency-manager|categories/06-developer-experience/dependency-manager.md"
  "documentation-engineer|categories/06-developer-experience/documentation-engineer.md"
  "refactoring-specialist|categories/06-developer-experience/refactoring-specialist.md"
)

echo "Installing Claude subagents into: ${DEST_DIR}"
echo "Upstream: https://github.com/${REPO_OWNER}/${REPO_NAME} @ ${REPO_REF}"
echo

installed=()

for entry in "${AGENTS[@]}"; do
  name="${entry%%|*}"
  relpath="${entry#*|}"
  url="${RAW_BASE}/${relpath}"
  out="${DEST_DIR}/${name}.md"

  echo "- Fetching ${name}..."
  # -f: fail on non-2xx, -S: show errors, -s: silent progress, -L: follow redirects
  if ! curl -fSsL "${url}" -o "${out}"; then
    echo
    echo "ERROR: Failed to download: ${url}"
    echo "Tip: the upstream file path may have changed. Check the repo and update this script."
    exit 1
  fi

  installed+=("${name}")
done

# Record a simple lock for traceability.
# If you want a true commit SHA lock, run with REPO_REF=<sha>.
{
  echo "source_repo=https://github.com/${REPO_OWNER}/${REPO_NAME}"
  echo "source_ref=${REPO_REF}"
  echo "installed_agents=$(IFS=, ; echo "${installed[*]}")"
  echo "installed_at_utc=$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
} > "${LOCK_FILE}"

echo
echo "Done. Installed ${#installed[@]} agents:"
for name in "${installed[@]}"; do
  echo "  - ${name}"
done
echo
echo "Wrote lock file: ${LOCK_FILE}"
```
- Save as: scripts/install-claude-agents.sh
- Then run:
```
chmod +x scripts/install-claude-agents.sh
./scripts/install-claude-agents.sh
```
- (optional) (pin to a specific upstream commit for stability):
```
REPO_REF=<commit_sha_here> ./scripts/install-claude-agents.sh
```
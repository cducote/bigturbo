# Feature Delivery Command

Use this command to implement a **complete feature** following the full production workflow.

## When to Use `/feature`

- ✅ New feature implementation
- ✅ Complex multi-file changes
- ✅ Features requiring full QA, security, and deployment pipeline
- ✅ Changes touching auth, billing, or data boundaries

## When NOT to Use `/feature`

- ❌ Quick fixes or targeted changes (use `/spot`)
- ❌ Database migrations (use `/migration`)
- ❌ Bug investigation and fixes (use `/bugfix`)

---

## Workflow

```
User runs /feature
    ↓
Step 1: Select agents (AskUserQuestion with multiSelect)
    ↓
Step 2: Answer templated questions about the feature
    ↓
Step 3: Orchestrator crafts comprehensive implementation plan
    ↓
Step 4: Sequential agent execution with handoffs
    ↓
Gates checked between phases
    ↓
Feature delivered
```

---

## Step 1: Agent Selection

**REQUIRED**: Use `AskUserQuestion` tool with `multiSelect: true` to present agent options.

**Default Feature Team** (pre-selected):
- api-designer
- fullstack-developer
- code-reviewer
- qa-expert

**Optional Additions**:
- security-auditor (if auth/billing/data boundary)
- devops-engineer (if deployment needed)
- documentation-engineer (if user-facing)
- sql-pro (if database changes)
- refactoring-specialist (if cleanup needed)

```json
{
  "questions": [{
    "question": "Which agents should work on this feature? (Recommended team pre-selected)",
    "header": "Agents",
    "multiSelect": true,
    "options": [
      {"label": "api-designer (Recommended)", "description": "Design API contract + acceptance criteria"},
      {"label": "fullstack-developer (Recommended)", "description": "Implement in small increments"},
      {"label": "code-reviewer (Recommended)", "description": "Review for blockers/non-blockers"},
      {"label": "qa-expert (Recommended)", "description": "Write tests + manual checklist"}
    ]
  }]
}
```

Follow-up for additional agents if needed:
- security-auditor, devops-engineer, documentation-engineer, sql-pro, refactoring-specialist, prompt-engineer, dependency-manager

---

## Step 2: Templated Questions

After agent selection, gather feature requirements using `AskUserQuestion`:

### Question Set

1. **What problem does this feature solve?**
   - Free text input (user selects "Other")

2. **What type of feature is this?**
   - Options: User-facing feature, Internal tooling, API endpoint, Data/reporting, Integration

3. **Which areas of the codebase will this touch?**
   - Options: Frontend only, Backend only, Full stack, Database + API, Infrastructure
   - `multiSelect: true`

4. **Does this feature involve sensitive areas?**
   - Options: Authentication/Authorization, Billing/Payments, User data/PII, Multi-tenancy, None of the above
   - `multiSelect: true`

5. **What does "done" look like?** (Acceptance criteria)
   - Free text input (user selects "Other")

6. **Any constraints or non-goals?**
   - Free text input (user selects "Other")

---

## Step 3: Orchestrator Creates Implementation Plan

After gathering answers, invoke the **orchestrator** agent via Task tool:

```
Prompt to orchestrator:
"Based on the following feature requirements, create a comprehensive implementation plan:

Selected Agents: [list from Step 1]
Problem Statement: [answer 1]
Feature Type: [answer 2]
Codebase Areas: [answer 3]
Sensitive Areas: [answer 4]
Acceptance Criteria: [answer 5]
Constraints/Non-goals: [answer 6]

Create a detailed implementation plan with:
1. Overview - Feature summary and scope
2. Architecture - High-level design decisions
3. Agent Workflow - Sequential execution order with handoffs
4. Phase Breakdown:
   - Phase 1: API Design (api-designer)
   - Phase 2: Implementation (fullstack-developer)
   - Phase 3: Review (code-reviewer)
   - Phase 4: Testing (qa-expert)
   - Phase 5: Security (if sensitive areas flagged)
   - Phase 6: Deployment (if devops selected)
   - Phase 7: Documentation (if selected)
5. Gate Criteria - What must pass between phases
6. Success Criteria - How we know the feature is complete

IMPORTANT: If you need clarification on any aspect, do NOT ask the user. Instead:
1. Identify which agent in .claude/agents/ is best suited to make that decision
2. Consult that agent and get their recommendation
3. Document the decision and reasoning in the plan
4. Proceed with the agent's recommendation"
```

---

## Step 4: Sequential Execution with Handoffs

Unlike `/spot`, features run agents **sequentially** with handoffs:

### Standard Flow

1. **api-designer** → Design API contract + acceptance criteria
   - Output: API spec, data models, acceptance criteria

2. **fullstack-developer** → Implement in small increments
   - Input: API spec from api-designer
   - Output: Working code, ready for review

3. **code-reviewer** → Review for blockers/non-blockers
   - Input: Implementation from fullstack-developer
   - Output: Review feedback, approval or changes needed

4. **qa-expert** → Write tests + manual checklist
   - Input: Implementation + review feedback
   - Output: Test suite, manual QA checklist

5. **security-auditor** → Threat check (if auth/billing/data)
   - Gate: Tests must pass first
   - Output: Security assessment, required fixes

6. **devops-engineer** → Rollout + monitoring notes
   - Gate: Security reviewed if required
   - Output: Deployment plan, monitoring setup

7. **documentation-engineer** → Docs/support notes
   - Output: User-facing docs, internal notes

8. **refactoring-specialist** → Cleanup (optional)
   - Output: Code improvements, tech debt addressed

---

## Clarification Protocol

**CRITICAL**: When clarification is needed during planning or execution:

1. **Do NOT** ask the user
2. **Instead**, consult the most relevant agent in `.claude/agents/`:
   - API design decisions → `api-designer`
   - Technical implementation → `fullstack-developer`
   - Security concerns → `security-auditor`
   - Testing approach → `qa-expert`
   - Database design → `sql-pro`
   - Code quality → `code-reviewer`
   - Infrastructure → `devops-engineer`
   - Documentation → `documentation-engineer`
3. **Document** the agent consulted and their recommendation
4. **Proceed** with the agent's decision

---

## Gates

Quality gates between phases:

- ✅ **Before Security Review**: Tests pass
- ✅ **Before Deployment**: Security reviewed (if auth/billing/tenant touched)
- ✅ **Before Complete**: Rollout notes written

---

## Checklists

### Clerk (Authentication)
- [ ] Auth checked server-side
- [ ] Org/user scope correct
- [ ] Middleware protecting routes

### Stripe (Payments)
- [ ] Webhook signatures verified
- [ ] Prices validated server-side
- [ ] Idempotency keys used

### Next.js
- [ ] Cache/revalidation strategy clear
- [ ] Error boundaries in place
- [ ] Env vars correctly scoped

---

## Output Format

Each agent provides a handoff report:

**Agent: [name]**
1. **Summary** — What was done
2. **Changes** — Files modified/created
3. **Decisions** — Tradeoffs chosen
4. **Open Questions** — Resolved via agent consultation (documented)
5. **Next Steps** — For next agent in sequence
6. **Blockers** — If any

---

## Example Flow

### User runs `/feature`

**Step 1 - Agent Selection:**
```
Claude uses AskUserQuestion:
"Which agents should work on this feature?"
User confirms: api-designer, fullstack-developer, code-reviewer, qa-expert, security-auditor
```

**Step 2 - Templated Questions:**
```
Claude asks:
- Problem? → "Users can't export their data"
- Type? → "User-facing feature"
- Areas? → "Full stack"
- Sensitive? → "User data/PII"
- Done criteria? → "User can download all their data as JSON/CSV"
- Constraints? → "Must complete within rate limits"
```

**Step 3 - Orchestrator Plans:**
```
Orchestrator creates plan with:
- API: GET /api/export endpoint design
- Implementation: Export service + UI button
- Security: PII handling review required
- Sequential execution with handoffs
```

**Step 4 - Sequential Execution:**
```
api-designer → fullstack-developer → code-reviewer → qa-expert → security-auditor
Each agent receives handoff from previous
```

---

## Tips

- **Use for complete features** - not quick fixes
- **Trust the workflow** - gates ensure quality
- **Sensitive areas trigger security** - don't skip
- **Agent decisions documented** - transparency in planning
- **Sequential > Parallel** - handoffs matter for features

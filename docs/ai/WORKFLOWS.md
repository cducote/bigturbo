# Workflows

This document defines the standard agent workflows (loops) for different types of work.

---

## Loop A: Feature Delivery

The default workflow for implementing new features.

```
┌─────────────────────────────────────────────────────────────────┐
│  1. api-designer      → API design + acceptance criteria       │
│  2. fullstack-developer → Implement (small increments)          │
│  3. code-reviewer     → Review (blockers/non-blockers)         │
│  4. qa-expert         → Tests + manual checklist               │
│  5. security-auditor  → Threat check (if auth/billing/data)    │
│  6. devops-engineer   → Rollout + monitoring notes             │
│  7. documentation-engineer → Docs/support notes                │
│  8. refactoring-specialist → Cleanup (optional, after correct) │
└─────────────────────────────────────────────────────────────────┘
```

### Checklist

- [ ] **api-designer**: API contract defined, error model documented
- [ ] **fullstack-developer**: Feature implemented incrementally
- [ ] **code-reviewer**: Code reviewed, all blockers resolved
- [ ] **qa-expert**: Tests written, manual QA passed
- [ ] **security-auditor**: Security review completed (if applicable)
- [ ] **devops-engineer**: Env vars documented, rollout plan ready
- [ ] **documentation-engineer**: User/support docs updated
- [ ] **refactoring-specialist**: Code cleaned up (optional)

### Gates
- ✓ Tests pass before security review
- ✓ Security reviewed if auth/billing/tenant boundary touched
- ✓ Rollout notes written before deploy

---

## Loop B: Bugfix

Streamlined workflow for fixing bugs.

```
┌─────────────────────────────────────────────────────────────────┐
│  1. qa-expert         → Repro + minimal failing test           │
│  2. fullstack-developer → Fix the bug                           │
│  3. code-reviewer     → Review the fix                         │
│  4. qa-expert         → Confirm + regression coverage          │
│  5. security-auditor  → Review (if auth/billing/tenant)        │
│  6. documentation-engineer → Update docs (if behavior changed) │
└─────────────────────────────────────────────────────────────────┘
```

### Checklist

- [ ] **qa-expert**: Bug reproduced, failing test written
- [ ] **fullstack-developer**: Bug fixed
- [ ] **code-reviewer**: Fix reviewed and approved
- [ ] **qa-expert**: Fix confirmed, regression tests added
- [ ] **security-auditor**: Security review (if applicable)
- [ ] **documentation-engineer**: Docs updated (if behavior changed)

### Gates
- ✓ Failing test exists before fix is attempted
- ✓ Regression tests cover the fix
- ✓ Security reviewed if sensitive area touched

---

## Loop C: Schema Change / Migration

For database schema changes using Neon/Postgres.

```
┌─────────────────────────────────────────────────────────────────┐
│  1. sql-pro           → Migration + backfill plan + indexes    │
│  2. devops-engineer   → Deploy/rollback order + monitoring     │
│  3. fullstack-developer → Expand/contract pattern implementation│
│  4. qa-expert         → Migration test + smoke checklist       │
│  5. security-auditor  → Tenant isolation + least privilege     │
│  6. documentation-engineer → Runbook updates                   │
└─────────────────────────────────────────────────────────────────┘
```

### Checklist

- [ ] **sql-pro**: Migration written, backfill plan documented
- [ ] **devops-engineer**: Deploy/rollback order defined
- [ ] **fullstack-developer**: Expand/contract pattern implemented
- [ ] **qa-expert**: Migration tested, smoke tests pass
- [ ] **security-auditor**: Tenant isolation verified
- [ ] **documentation-engineer**: Runbook updated for ops/support

### Expand/Contract Pattern
1. **Expand**: Add new column/table (nullable or with default)
2. **Migrate**: Update code to write to both old and new
3. **Backfill**: Fill new column with existing data
4. **Contract**: Remove old column/table, update code to use only new

### Gates
- ✓ Migration tested in staging before production
- ✓ Rollback plan exists
- ✓ Backfill strategy documented
- ✓ Tenant isolation confirmed

---

## Loop D: Maintenance

Weekly or pre-release maintenance workflow.

```
┌─────────────────────────────────────────────────────────────────┐
│  1. dependency-manager → Safe updates + risk notes              │
│  2. refactoring-specialist → Cleanup (no behavior change)      │
│  3. code-reviewer     → Guardrails check                       │
│  4. qa-expert         → Regression tests                       │
│  5. devops-engineer   → CI health / flaky tests / build perf   │
│  6. documentation-engineer → Docs freshness check              │
└─────────────────────────────────────────────────────────────────┘
```

### Checklist

- [ ] **dependency-manager**: Dependencies updated, CVEs addressed
- [ ] **refactoring-specialist**: Code cleanup complete (no behavior change)
- [ ] **code-reviewer**: Changes reviewed
- [ ] **qa-expert**: Regression tests pass
- [ ] **devops-engineer**: CI healthy, flaky tests addressed
- [ ] **documentation-engineer**: Docs reviewed for freshness

### Gates
- ✓ No behavior changes from refactoring
- ✓ All tests pass after updates
- ✓ CVE scan passes

---

## Quick Reference

| Loop | Primary Use Case | Required Agents | Optional Agents |
|------|-----------------|-----------------|-----------------|
| A | New features | api-designer, fullstack, reviewer, qa, devops, docs | security, refactoring |
| B | Bug fixes | qa, fullstack, reviewer | security, docs |
| C | Schema changes | sql-pro, devops, fullstack, qa, security, docs | — |
| D | Maintenance | dependency-manager, refactoring, reviewer, qa, devops, docs | — |

---

## Workflow Selection Guide

```
Is this a new feature?
  └─ YES → Loop A (Feature Delivery)

Is this a bug fix?
  └─ YES → Loop B (Bugfix)

Does this involve database schema changes?
  └─ YES → Loop C (Migration)

Is this routine maintenance/updates?
  └─ YES → Loop D (Maintenance)
```

# Handoff Template

Use this template when handing off a feature, bug, or migration to Copilot or another agent.

---

## 1. Context

**Problem Statement:**
> What problem are we solving? Why does this matter?

**Affected Area:**
> What part(s) of the codebase does this touch?

---

## 2. Acceptance Criteria

Done means:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

---

## 3. Constraints

**Stack:**
- Next.js (App Router)
- Neon/Postgres (database)
- Stripe (payments)
- Clerk (auth)

**Product/UX Constraints:**
> Any specific product requirements or UX patterns to follow

**Non-goals:**
> What is explicitly out of scope for this task

---

## 4. Design Notes

### Data Model Changes
| Table | Column | Type | Notes |
|-------|--------|------|-------|
| | | | |

### API Endpoints / Server Actions
| Method | Path / Action | Purpose |
|--------|--------------|---------|
| | | |

### Stripe Objects Involved
- [ ] Customer
- [ ] Subscription
- [ ] Checkout Session
- [ ] Payment Intent
- [ ] Webhooks: `event.type`

### Clerk Concepts Involved
- [ ] Organizations
- [ ] Roles / Permissions
- [ ] JWT Claims
- [ ] Middleware protection
- [ ] Server-side auth checks

---

## 5. Implementation Steps

| Step | File(s) | Changes | Why |
|------|---------|---------|-----|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## 6. Testing Plan

### Automated Tests
- [ ] Unit tests for: 
- [ ] Integration tests for:
- [ ] E2E tests for:

### Manual QA Checklist
- [ ] Test case 1
- [ ] Test case 2
- [ ] Test case 3

---

## 7. Security Checklist

- [ ] **Tenant isolation** — Data is scoped to the correct org/user
- [ ] **Webhook signature verification** — Stripe webhooks verify signature
- [ ] **Authorization checks** — Server-side authz (not just client)
- [ ] **Input validation** — All inputs validated/sanitized
- [ ] **PII handling** — Sensitive data handled appropriately
- [ ] **Rate limiting** — Endpoints protected from abuse
- [ ] **Logging** — No secrets/PII in logs

---

## 8. Release Notes / Rollout

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| | | |

### Migration Order
1. 
2. 
3. 

### Backfill Steps
> Any data backfill required?

### Monitoring / Alerts
> What should we watch after deploy?

---

## Quick Copy Template

```markdown
## Context
**Problem:** 
**Area:** 

## Acceptance Criteria
- [ ] 

## Constraints
**Non-goals:** 

## Design Notes
**Data:** 
**API:** 
**Stripe:** 
**Clerk:** 

## Implementation Steps
1. 

## Testing
- [ ] 

## Security
- [ ] Tenant isolation
- [ ] Authz checks
- [ ] Webhook verification

## Rollout
**Env vars:** 
**Migrations:** 
**Monitor:** 
```

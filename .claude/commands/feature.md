# Feature Delivery Command

Use this command to implement a new feature following the standard workflow.

## Workflow

1. **api-designer** → Design API contract + acceptance criteria
2. **fullstack-developer** → Implement in small increments
3. **code-reviewer** → Review for blockers/non-blockers
4. **qa-expert** → Write tests + manual checklist
5. **security-auditor** → Threat check (if auth/billing/data boundary)
6. **devops-engineer** → Rollout + monitoring notes
7. **documentation-engineer** → Docs/support notes
8. **refactoring-specialist** → Cleanup (optional)

## Required Input

Provide a handoff with:
- **Context**: What problem are we solving?
- **Acceptance Criteria**: What does "done" look like?
- **Constraints**: Stack limitations, non-goals
- **Design Notes**: Data model, API, Stripe/Clerk concepts

## Output Format

Each agent must provide:
1. **Summary** — What was done
2. **Changes** — Files modified/created
3. **Decisions** — Tradeoffs chosen
4. **Open Questions** — Need human input
5. **Next Steps** — For next agent
6. **Blockers** — If any

## Gates

- ✓ Tests pass before security review
- ✓ Security reviewed if auth/billing/tenant touched
- ✓ Rollout notes written before deploy

## Checklists

### Clerk
- [ ] Auth checked server-side
- [ ] Org/user scope correct
- [ ] Middleware protecting routes

### Stripe
- [ ] Webhook signatures verified
- [ ] Prices validated server-side
- [ ] Idempotency keys used

### Next.js
- [ ] Cache/revalidation strategy clear
- [ ] Error boundaries in place
- [ ] Env vars correctly scoped

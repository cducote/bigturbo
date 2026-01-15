# Migration Command

Use this command for database schema changes with Neon/Postgres.

## Workflow

1. **sql-pro** → Write migration + backfill plan + index changes
2. **devops-engineer** → Define deploy/rollback order + monitoring
3. **fullstack-developer** → Implement expand/contract pattern
4. **qa-expert** → Test migration + smoke checklist
5. **security-auditor** → Verify tenant isolation + least privilege
6. **documentation-engineer** → Update runbooks

## Required Input

Provide:
- **Schema Change**: What tables/columns are changing
- **Reason**: Why this change is needed
- **Data Impact**: How much data is affected
- **Rollback Plan**: How to undo if something goes wrong

## Output Format

Each agent must provide:
1. **Summary** — What was done
2. **Migration Files** — SQL/Prisma files created
3. **Backfill Strategy** — How existing data will be migrated
4. **Rollback Steps** — How to undo
5. **Testing Notes** — How to verify success
6. **Next Steps** — For next agent

## Expand/Contract Pattern

```
1. EXPAND    → Add new column/table (nullable or with default)
2. MIGRATE   → Update code to write to both old and new
3. BACKFILL  → Fill new column with existing data
4. CONTRACT  → Remove old column/table, use only new
```

## Gates

- ✓ Migration tested in staging before production
- ✓ Rollback plan exists and tested
- ✓ Backfill strategy documented
- ✓ Tenant isolation confirmed
- ✓ Zero-downtime deployment possible

## Checklist

- [ ] Migration written and reviewed
- [ ] Backfill plan documented
- [ ] Deploy/rollback order defined
- [ ] Expand/contract pattern implemented
- [ ] Migration tested in staging
- [ ] Tenant isolation verified
- [ ] Runbook updated
- [ ] Monitoring in place for rollout

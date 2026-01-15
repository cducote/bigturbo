# Bugfix Command

Use this command to fix a bug following the standard workflow.

## Workflow

1. **qa-expert** → Reproduce bug + write minimal failing test
2. **fullstack-developer** → Fix the bug
3. **code-reviewer** → Review the fix
4. **qa-expert** → Confirm fix + add regression coverage
5. **security-auditor** → Review (if auth/billing/tenant touched)
6. **documentation-engineer** → Update docs (if behavior changed)

## Required Input

Provide:
- **Bug Description**: What's happening vs what should happen
- **Reproduction Steps**: How to reproduce the bug
- **Affected Area**: What part of the codebase is involved
- **Severity**: Critical / High / Medium / Low

## Output Format

Each agent must provide:
1. **Summary** — What was done
2. **Changes** — Files modified/created
3. **Root Cause** — What caused the bug
4. **Fix Applied** — How it was fixed
5. **Regression Tests** — Tests added to prevent recurrence
6. **Next Steps** — For next agent

## Gates

- ✓ Failing test exists before fix is attempted
- ✓ Regression tests cover the fix
- ✓ Security reviewed if sensitive area touched

## Checklist

- [ ] Bug reproduced locally
- [ ] Failing test written
- [ ] Fix implemented
- [ ] Fix confirmed working
- [ ] Regression tests added
- [ ] No new issues introduced
- [ ] Documentation updated (if behavior changed)

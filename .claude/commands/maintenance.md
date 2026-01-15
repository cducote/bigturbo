# Maintenance Command

Use this command for weekly or pre-release maintenance tasks.

## Workflow

1. **dependency-manager** → Safe updates + risk notes
2. **refactoring-specialist** → Cleanup (no behavior change)
3. **code-reviewer** → Guardrails check
4. **qa-expert** → Run regression tests
5. **devops-engineer** → CI health / flaky tests / build perf
6. **documentation-engineer** → Docs freshness check

## Required Input

Provide:
- **Scope**: Full maintenance or specific area
- **Priority**: What's most important to address
- **Time Budget**: How much time to spend
- **Risk Tolerance**: How aggressive with updates

## Output Format

Each agent must provide:
1. **Summary** — What was done
2. **Updates Applied** — Dependencies updated, CVEs fixed
3. **Refactoring** — Code cleanup performed
4. **Risks** — Any potential issues from changes
5. **Test Results** — Regression test outcomes
6. **Recommendations** — Follow-up actions needed

## Maintenance Areas

### Dependencies
- [ ] Security vulnerabilities (CVEs) addressed
- [ ] Minor version updates applied
- [ ] Major version updates evaluated
- [ ] Lock file updated
- [ ] Bundle size impact checked

### Code Quality
- [ ] Dead code removed
- [ ] Unused imports cleaned
- [ ] Consistent formatting applied
- [ ] Type errors fixed
- [ ] Lint warnings addressed

### CI/CD Health
- [ ] Flaky tests identified and fixed
- [ ] Build times reviewed
- [ ] Cache effectiveness checked
- [ ] Deployment pipeline validated

### Documentation
- [ ] README accurate
- [ ] API docs current
- [ ] Runbooks up to date
- [ ] Architecture docs reflect reality

## Gates

- ✓ No behavior changes from refactoring
- ✓ All tests pass after updates
- ✓ CVE scan passes
- ✓ Build succeeds in CI

## Checklist

- [ ] Dependency audit complete
- [ ] Security vulnerabilities addressed
- [ ] Safe updates applied
- [ ] Code cleanup complete
- [ ] Regression tests pass
- [ ] CI pipeline healthy
- [ ] Documentation reviewed
- [ ] No breaking changes introduced

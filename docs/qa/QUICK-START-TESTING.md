# Quick Start Testing Guide - BigTurbo MVP

**Last Updated:** 2026-01-14  
**Time to Complete:** 4-5 days for full manual testing

---

## For QA Engineers: Getting Started

### Prerequisites

```bash
# 1. Clone and setup
cd /path/to/bigturbo
npm install

# 2. Verify setup
npm run type-check  # Should pass
npm run lint        # Should pass
npm run build       # Should succeed

# 3. Start dev server
npm run dev         # Visit http://localhost:3000
```

### Testing Tools Checklist

Install browser extensions:
- [ ] Google Lighthouse (Chrome/Edge)
- [ ] axe DevTools (all browsers)
- [ ] React Developer Tools (optional)

Enable screen readers:
- [ ] macOS: VoiceOver (Cmd+F5)
- [ ] Windows: NVDA (free) or JAWS
- [ ] Linux: Orca

### Quick Test Execution

**Day 1 - Functional & Cross-Browser (4-6 hours)**
```bash
# Start application
npm run dev

# Open manual test checklist
open docs/qa/MANUAL-TEST-CHECKLIST.md

# Execute sections 1 & 2:
# - Section 1: Functional Testing (81 tests)
# - Section 2: Cross-Browser Testing (28 tests)
```

**Day 2 - Non-Functional Testing (4-6 hours)**
```bash
# Execute sections 3-9:
# - Section 3: Responsive Design (35 tests)
# - Section 4: Accessibility (53 tests)
# - Section 5: Performance (15 tests)
# - Section 6: SEO (16 tests)
# - Section 7: Security (15 tests)
# - Section 8: Dark Mode (10 tests)
# - Section 9: Build/Deployment (13 tests)
# - Section 10: Edge Cases (12 tests)
```

**Days 3-4 - Issue Resolution & Re-testing**
- Document all defects
- Work with developers on fixes
- Re-test resolved issues
- Regression testing

**Day 5 - Final Validation & Sign-Off**
- Complete any remaining tests
- Final security verification
- Performance audit
- QA sign-off decision

---

## Critical Blockers to Verify

### BLOCKER #1: Security Headers

**Test:** Open DevTools → Network → Reload page → Click any request → Headers

**Expected:**
```
Content-Security-Policy: <policy>
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: <policy>
```

**Status:** ❌ NOT IMPLEMENTED (must fix before production)

**Quick Test:**
```bash
# After deployment
curl -I https://your-domain.com
# Or use: https://securityheaders.com
```

### BLOCKER #2: Environment Validation

**Test:** Start app without required env vars

```bash
# Remove .env file temporarily
mv .env .env.backup

# Start app - should fail with clear error
npm run dev
# Expected: Error message listing missing vars

# Restore .env
mv .env.backup .env
```

**Status:** ❌ NOT IMPLEMENTED (must fix before production)

---

## Quick Performance Test

```bash
# 1. Build production version
npm run build

# 2. Start production server
npm run start

# 3. Open Chrome DevTools
# - Open Lighthouse tab
# - Select "Desktop" or "Mobile"
# - Check all categories
# - Click "Analyze page load"

# 4. Expected Scores:
# Performance: ≥ 90
# Accessibility: ≥ 90
# Best Practices: ≥ 90
# SEO: ≥ 90
```

---

## Quick Accessibility Test

```bash
# 1. Install axe DevTools extension
# 2. Visit http://localhost:3000
# 3. Open DevTools → axe DevTools tab
# 4. Click "Scan ALL of my page"
# 5. Expected: 0 critical or serious issues

# Keyboard Navigation Test:
# 1. Tab through all interactive elements
# 2. Verify focus indicator visible
# 3. Press Enter/Space on buttons
# 4. Expected: All navigation works
```

---

## Quick Cross-Browser Test

**Chrome:**
```bash
# Visit http://localhost:3000
# Test: Home → About → Back
# Check: No console errors
# Status: ___
```

**Firefox:**
```bash
# Visit http://localhost:3000
# Test: Home → About → Back
# Check: No console errors
# Status: ___
```

**Safari:**
```bash
# Visit http://localhost:3000
# Test: Home → About → Back
# Check: No console errors
# Status: ___
```

**Edge:**
```bash
# Visit http://localhost:3000
# Test: Home → About → Back
# Check: No console errors
# Status: ___
```

---

## Quick Responsive Test

```bash
# Chrome DevTools → Toggle Device Toolbar (Cmd+Shift+M)

# Test viewports:
[ ] 375x667 (Mobile - iPhone SE)
[ ] 768x1024 (Tablet - iPad)
[ ] 1366x768 (Laptop)
[ ] 1920x1080 (Desktop)

# For each viewport:
# 1. Check layout doesn't break
# 2. All text readable
# 3. Buttons are tappable
# 4. No horizontal scroll
```

---

## Quick API Test

```bash
# Visit http://localhost:3000/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-01-14T12:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "version": "0.1.0"
}

# Check headers (DevTools → Network):
# Cache-Control: no-store, must-revalidate
```

---

## Quick Security Test

```bash
# 1. Check .gitignore
cat .gitignore | grep .env
# Expected: .env present

# 2. Check no secrets in code
grep -r "sk_" src/
grep -r "pk_live" src/
grep -r "password" src/
# Expected: No matches

# 3. Check external links
grep -r "target=\"_blank\"" src/
# All should have rel="noopener noreferrer"

# 4. Check security headers (BLOCKER)
curl -I http://localhost:3000
# Expected: Security headers present
```

---

## Test Results Template

```markdown
## QA Test Results - [Date]

### Summary
- Total Tests: 278
- Passed: ___
- Failed: ___
- Skipped: ___
- Completion: ___%

### Blockers Found
1. Security headers: NOT IMPLEMENTED ❌
2. Environment validation: NOT IMPLEMENTED ❌

### Critical Issues (P0)
- [List any critical issues found]

### High Priority Issues (P1)
- [List any high priority issues found]

### Browser Compatibility
- Chrome: ✅ / ❌
- Firefox: ✅ / ❌
- Safari: ✅ / ❌
- Edge: ✅ / ❌

### Performance Scores
- Performance: ___/100
- Accessibility: ___/100
- SEO: ___/100
- Best Practices: ___/100

### Recommendations
1. Fix security headers (BLOCKER)
2. Implement env validation (BLOCKER)
3. [Other recommendations]

### QA Sign-Off
Status: [ ] PASS | [ ] CONDITIONAL PASS | [ ] FAIL
Reason: ___________________________________________
Signed: _______________ Date: _______________
```

---

## Common Issues & Solutions

### Issue: Application won't start
```bash
# Solution 1: Clear cache
rm -rf .next
npm run dev

# Solution 2: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run dev

# Solution 3: Check Node version
node --version  # Should be ≥ 18.17.0
```

### Issue: Build fails
```bash
# Check TypeScript errors
npm run type-check

# Check ESLint errors
npm run lint

# Check for syntax errors
npm run build
```

### Issue: Tests timing out
```bash
# Increase timeout in browser DevTools
# Or use Playwright for E2E (future)
```

---

## Test Automation Quick Start (Future)

Once blockers are resolved and manual testing complete:

```bash
# Install test dependencies
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test

# Install Playwright browsers
npx playwright install

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# View test UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

---

## Useful Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npm run type-check    # Check TypeScript

# Testing (after setup)
npm run test          # Run all tests
npm run test:unit     # Unit tests only
npm run test:e2e      # E2E tests only
npm run test:coverage # With coverage report

# Debugging
npm run dev -- --turbo  # Use Turbopack (faster)
DEBUG=* npm run dev     # Verbose logging
```

---

## Resources

### Documentation
- Test Strategy: `/docs/qa/TEST-STRATEGY.md`
- Manual Checklist: `/docs/qa/MANUAL-TEST-CHECKLIST.md`
- Automated Plan: `/docs/qa/AUTOMATED-TEST-PLAN.md`
- QA Summary: `/docs/qa/QA-SUMMARY.md`

### External Tools
- Lighthouse: https://developers.google.com/web/tools/lighthouse
- axe DevTools: https://www.deque.com/axe/devtools/
- Security Headers: https://securityheaders.com
- WAVE: https://wave.webaim.org/

### Learning Resources
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Core Web Vitals: https://web.dev/vitals/
- Next.js Testing: https://nextjs.org/docs/testing
- Playwright Docs: https://playwright.dev/

---

## Contact & Support

**Questions?**
- Check `/docs/qa/` documentation
- Review code comments
- Ask in #qa-team Slack channel

**Found a Bug?**
- Use defect template in manual checklist
- Include screenshots/videos
- Provide steps to reproduce
- Assign appropriate severity

**Need Help?**
- QA Lead: [Contact info]
- Dev Team: [Contact info]
- DevOps: [Contact info]

---

**Ready to Test?** Start with the Manual Test Checklist and work through each section systematically. Good luck!


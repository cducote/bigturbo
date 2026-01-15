# Production Deployment Checklist

## Overview

Comprehensive pre-deployment, deployment, and post-deployment checklist for BigTurbo Next.js application. Use this checklist for every production deployment to ensure quality, security, and reliability.

---

## Pre-Deployment Phase

### Code Quality

- [ ] All code reviewed and approved
- [ ] PR merged to master branch
- [ ] No merge conflicts
- [ ] All tests passing locally
- [ ] ESLint showing no errors: `npm run lint`
- [ ] TypeScript type checking passing: `npm run type-check`
- [ ] Build succeeds locally: `npm run build`
- [ ] Application runs in production mode: `npm run start`

### Critical Blockers Resolution

**From QA Assessment:**

- [ ] **CRITICAL BLOCKER 1:** Security headers middleware implemented
  - [ ] Content Security Policy configured
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Referrer-Policy configured
  - [ ] Permissions-Policy configured
  - [ ] Headers verified in middleware.ts

- [ ] **CRITICAL BLOCKER 2:** Environment variable validation implemented
  - [ ] Zod schema created (utils/env.ts)
  - [ ] All required variables validated
  - [ ] Validation runs on application startup
  - [ ] Type-safe environment access
  - [ ] Error handling for missing variables

### Security Review

- [ ] No secrets in source code
- [ ] No console.logs with sensitive data
- [ ] API routes have proper authentication (when applicable)
- [ ] CORS configured correctly
- [ ] Rate limiting implemented (if needed)
- [ ] Input validation on all forms
- [ ] SQL injection prevention (when database added)
- [ ] XSS prevention measures in place
- [ ] CSRF protection enabled (Next.js default)
- [ ] Dependency audit passing: `npm audit --production`
- [ ] No high/critical vulnerabilities

### Performance Optimization

- [ ] Images optimized (using next/image)
- [ ] Bundle size analyzed: Check `.next/analyze/`
- [ ] No unnecessary dependencies
- [ ] Code splitting implemented
- [ ] Lazy loading for heavy components
- [ ] Fonts optimized (using next/font)
- [ ] CSS minified
- [ ] JavaScript minified (automatic)
- [ ] No console statements in production build

### Environment Configuration

**Development:**
- [ ] `.env.local` configured and working
- [ ] All required variables present
- [ ] Test data available

**Staging:**
- [ ] Staging environment variables set in Vercel
- [ ] `STAGING_APP_URL` in GitHub Secrets
- [ ] Test/sandbox API keys configured
- [ ] Staging database ready (future)

**Production:**
- [ ] Production environment variables set in Vercel
- [ ] `PRODUCTION_APP_URL` in GitHub Secrets
- [ ] Production API keys configured
- [ ] Production database ready (future)
- [ ] Environment validation passing

### Monitoring & Observability

- [ ] Sentry installed and configured
- [ ] `NEXT_PUBLIC_SENTRY_DSN` set for all environments
- [ ] Sentry source maps uploading
- [ ] Test error appears in Sentry dashboard
- [ ] Vercel Analytics enabled
- [ ] Google Analytics configured (if using)
- [ ] Uptime monitoring configured (UptimeRobot/StatusCake)
- [ ] Health check endpoint verified: `/api/health`
- [ ] Alert recipients configured
- [ ] Slack/PagerDuty integration tested

### CI/CD Pipeline

- [ ] GitHub Actions workflows configured
- [ ] `ci.yml` workflow passing
- [ ] `deploy-production.yml` workflow configured
- [ ] `deploy-staging.yml` workflow configured
- [ ] All GitHub Secrets set:
  - [ ] `VERCEL_TOKEN`
  - [ ] `VERCEL_ORG_ID`
  - [ ] `VERCEL_PROJECT_ID`
  - [ ] `PRODUCTION_APP_URL`
  - [ ] `STAGING_APP_URL`
  - [ ] `SENTRY_AUTH_TOKEN`
- [ ] Build artifacts uploading correctly
- [ ] Security scanning passing

### Domain & SSL

- [ ] Custom domain purchased (if not using Vercel subdomain)
- [ ] DNS records configured
- [ ] Domain added to Vercel project
- [ ] SSL certificate provisioned
- [ ] HTTPS enforced
- [ ] WWW redirect configured (if desired)
- [ ] Domain propagation verified

### Documentation

- [ ] Deployment guide reviewed
- [ ] Environment variables documented
- [ ] Runbooks created
- [ ] Team trained on deployment process
- [ ] Rollback procedure documented
- [ ] Incident response plan ready
- [ ] On-call rotation established (if applicable)

### Testing

**Manual Testing:**
- [ ] Homepage loads correctly
- [ ] About page loads correctly
- [ ] Navigation works
- [ ] Mobile responsive
- [ ] All browsers tested (Chrome, Firefox, Safari, Edge)
- [ ] Performance acceptable (Lighthouse score >90)
- [ ] No console errors in browser

**Automated Testing:**
- [ ] Unit tests passing (when implemented)
- [ ] Integration tests passing (when implemented)
- [ ] E2E tests passing (when implemented)
- [ ] Visual regression tests passing (when implemented)

### Stakeholder Communication

- [ ] Deployment scheduled and communicated
- [ ] Maintenance window announced (if needed)
- [ ] Stakeholders notified of deployment window
- [ ] Rollback plan communicated
- [ ] Support team briefed
- [ ] Documentation shared

---

## Deployment Phase

### Pre-Deployment Validation

**Time: T-30 minutes**

- [ ] Final code review completed
- [ ] All checklist items above verified
- [ ] Team available for deployment
- [ ] Rollback plan reviewed
- [ ] Communication channels ready (Slack, etc.)
- [ ] Monitoring dashboards open
- [ ] On-call engineer identified

### Staging Deployment

**Time: T-15 minutes**

- [ ] Deploy to staging first
- [ ] Wait for build to complete
- [ ] Staging smoke tests pass:
  - [ ] Health check: `curl https://staging.yourdomain.com/api/health`
  - [ ] Homepage loads
  - [ ] About page loads
  - [ ] No console errors
  - [ ] Analytics tracking
  - [ ] Error tracking working
- [ ] Performance verification
- [ ] QA team approval (if required)

### Production Deployment

**Time: T-0**

**Automatic Deployment (Recommended):**
- [ ] Merge PR to master branch
- [ ] GitHub Actions triggered automatically
- [ ] CI pipeline passes
- [ ] Deployment workflow starts
- [ ] Monitor deployment progress in GitHub Actions
- [ ] Monitor Vercel deployment dashboard

**Manual Deployment (Fallback):**
```bash
# Via Vercel CLI
vercel --prod

# Or trigger GitHub Action manually
# Go to Actions > Deploy to Production > Run workflow
```

**During Deployment:**
- [ ] Monitor build logs
- [ ] Watch for errors
- [ ] Check deployment time (should be <5 minutes)
- [ ] Note deployment URL/version

---

## Post-Deployment Phase

### Immediate Verification (T+0 to T+5)

**Smoke Tests:**
- [ ] Health check responds 200:
  ```bash
  curl -I https://yourdomain.com/api/health
  ```
- [ ] Homepage loads (200 status):
  ```bash
  curl -I https://yourdomain.com
  ```
- [ ] About page loads (200 status):
  ```bash
  curl -I https://yourdomain.com/about
  ```
- [ ] No 404 errors on known routes
- [ ] Static assets loading (check Network tab)
- [ ] No JavaScript errors in console
- [ ] Fonts loading correctly
- [ ] Images loading correctly

**Functional Tests:**
- [ ] Navigation between pages works
- [ ] All CTAs clickable
- [ ] Forms submitting (when implemented)
- [ ] Mobile responsive
- [ ] Fast loading (< 3 seconds)

**Monitoring Verification:**
- [ ] Sentry receiving events
- [ ] No new errors in Sentry
- [ ] Vercel Analytics tracking page views
- [ ] Uptime monitors showing green
- [ ] Health check passing
- [ ] Performance metrics normal

### Extended Verification (T+5 to T+30)

- [ ] Monitor error rates in Sentry
- [ ] Check response times in Vercel Analytics
- [ ] Verify traffic patterns normal
- [ ] Check Core Web Vitals:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1
- [ ] SSL certificate valid
- [ ] CDN caching working
- [ ] No spike in 500 errors
- [ ] No spike in user complaints

### Monitoring (T+30 to T+24h)

**First Hour:**
- [ ] Monitor Sentry for new errors
- [ ] Watch uptime monitoring
- [ ] Check analytics for traffic patterns
- [ ] Verify performance metrics
- [ ] Monitor response times

**First 24 Hours:**
- [ ] Daily error rate check
- [ ] Performance comparison with baseline
- [ ] User feedback review
- [ ] Support ticket review
- [ ] Uptime percentage verification (target: 99.9%)

### Documentation & Communication

- [ ] Update deployment log with:
  - Deployment time
  - Version/commit hash
  - Deployment duration
  - Any issues encountered
  - Resolution steps
- [ ] Notify stakeholders of successful deployment
- [ ] Update status page (if applicable)
- [ ] Share metrics with team
- [ ] Document any lessons learned
- [ ] Update runbooks if needed

---

## Rollback Procedure

If issues are detected, follow rollback procedure:

### When to Rollback

Immediate rollback if:
- Critical functionality broken
- Security vulnerability exposed
- Major performance degradation (>2x slower)
- High error rate (>5% of requests)
- Data corruption detected
- Unable to access critical features

### Rollback Steps

**Vercel (Immediate):**
1. Go to Vercel Dashboard
2. Click "Deployments"
3. Find last working deployment
4. Click "..." menu > "Promote to Production"
5. Confirm rollback
6. Verify rollback successful (T+1 minute)

**GitHub Actions (Alternative):**
1. Revert commit on master:
   ```bash
   git revert HEAD
   git push origin master
   ```
2. Wait for automatic deployment
3. Verify rollback successful

**After Rollback:**
- [ ] Verify application working
- [ ] Notify stakeholders
- [ ] Investigate root cause
- [ ] Fix issue in separate branch
- [ ] Test thoroughly
- [ ] Redeploy when ready

---

## Deployment Checklist Summary

### Critical Path (Must Complete)

1. [ ] Critical blockers resolved
2. [ ] All tests passing
3. [ ] Environment variables configured
4. [ ] Monitoring active
5. [ ] Staging deployment successful
6. [ ] Production deployment triggered
7. [ ] Smoke tests pass
8. [ ] Monitoring confirms stability

### Success Criteria

- [ ] Application accessible at production URL
- [ ] All core pages loading (< 3 seconds)
- [ ] No critical errors in Sentry
- [ ] Health check returning 200
- [ ] Uptime monitors passing
- [ ] Analytics tracking events
- [ ] Performance metrics acceptable
- [ ] No user complaints in first hour

---

## Troubleshooting

### Deployment Fails

**Build Error:**
```bash
# Check local build
npm run build

# Review error logs in GitHub Actions or Vercel

# Common fixes:
npm ci              # Clean install
npm run type-check  # Fix TypeScript errors
npm run lint        # Fix linting errors
```

**Environment Variable Missing:**
```bash
# Verify in Vercel Dashboard: Settings > Environment Variables
# Ensure variable set for Production scope
# Redeploy after adding variable
```

### Smoke Tests Fail

**Health Check Fails:**
- Check deployment completed successfully
- Verify application started (check Vercel logs)
- Wait 30 seconds and retry
- Check for build errors

**Page Not Loading:**
- Check routing configuration
- Verify file structure in `.next/server/pages/`
- Check for runtime errors in Vercel logs
- Review Sentry for exceptions

### Performance Issues

**Slow Loading:**
- Check bundle size: `.next/analyze/`
- Review Core Web Vitals
- Check CDN caching
- Verify image optimization
- Check database queries (when applicable)

**High Error Rate:**
- Check Sentry for error patterns
- Review recent code changes
- Check environment variables
- Verify external service availability
- Consider rollback if critical

---

## Post-Deployment Actions

### Required

- [ ] Monitor for 24 hours
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify uptime percentage
- [ ] Update deployment documentation

### Recommended

- [ ] Run Lighthouse audit
- [ ] Analyze bundle size
- [ ] Review user analytics
- [ ] Gather team feedback
- [ ] Plan next iteration

---

## Deployment Schedule

### Recommended Timing

**Best Times:**
- Tuesday-Thursday (avoid Mondays and Fridays)
- 10 AM - 2 PM local time (business hours)
- Low traffic periods
- When team available for monitoring

**Avoid:**
- Fridays (limited support coverage)
- Holidays and weekends
- High traffic periods
- Outside business hours (unless urgent)
- During major events (e.g., product launches)

### Deployment Frequency

**Current Stage (MVP):**
- Weekly deployments
- Hotfixes as needed
- Staging deploys daily

**Future (Mature):**
- Multiple daily deployments
- Continuous deployment
- Feature flags for gradual rollouts

---

## Emergency Deployment

For critical hotfixes:

1. [ ] Verify criticality (security, data loss, major outage)
2. [ ] Create hotfix branch from master
3. [ ] Make minimal fix
4. [ ] Test fix locally
5. [ ] Deploy to staging
6. [ ] Fast-track review
7. [ ] Deploy to production
8. [ ] Monitor closely
9. [ ] Document incident

**Skip-able items for emergencies:**
- Full test suite (run relevant tests only)
- Extended staging period
- Stakeholder communication (notify after)

---

## Checklist Templates

### Quick Reference Card

**Pre-Deploy:**
- Code reviewed ✓
- Tests passing ✓
- Environment configured ✓
- Monitoring ready ✓

**Deploy:**
- Staging first ✓
- Production deployment ✓
- Smoke tests ✓

**Post-Deploy:**
- Monitoring checked ✓
- Team notified ✓
- Documentation updated ✓

---

## Resources

- **Deployment Guide:** `/docs/devops/DEPLOYMENT_GUIDE.md`
- **Monitoring Setup:** `/docs/devops/MONITORING_SETUP.md`
- **Environment Variables:** `/docs/devops/ENVIRONMENT_VARIABLES.md`
- **Runbooks:** `/docs/devops/RUNBOOKS.md`
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Sentry Dashboard:** https://sentry.io
- **GitHub Actions:** https://github.com/your-org/bigturbo/actions

---

## Notes

- Update this checklist as deployment process evolves
- Add project-specific items as needed
- Review checklist quarterly for improvements
- Gather feedback from deployment team
- Automate checkable items when possible

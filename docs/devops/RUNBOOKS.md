# Operational Runbooks

## Overview

Standard operating procedures and runbooks for common operational tasks, incidents, and maintenance activities for the BigTurbo Next.js application.

---

## Table of Contents

1. [Common Operations](#common-operations)
2. [Incident Response](#incident-response)
3. [Maintenance Procedures](#maintenance-procedures)
4. [Troubleshooting Guides](#troubleshooting-guides)
5. [Emergency Contacts](#emergency-contacts)

---

## Common Operations

### RB-001: Deploy to Production

**Frequency:** Weekly or as needed
**Duration:** 15-30 minutes
**Risk Level:** Medium

**Prerequisites:**
- All tests passing
- Code reviewed and approved
- Critical blockers resolved

**Procedure:**

1. **Pre-deployment verification** (10 minutes)
   ```bash
   # Ensure on master branch
   git checkout master
   git pull origin master

   # Verify build locally
   npm ci
   npm run build
   npm run start
   ```

2. **Deploy to staging** (5 minutes)
   ```bash
   # Merge to develop branch or deploy manually
   git checkout develop
   git merge master
   git push origin develop

   # Wait for automatic deployment
   # Or deploy manually:
   vercel --env staging
   ```

3. **Staging verification** (5 minutes)
   ```bash
   # Health check
   curl https://staging.yourdomain.com/api/health

   # Visual verification
   # Open https://staging.yourdomain.com in browser
   ```

4. **Production deployment** (5 minutes)
   ```bash
   # Push to master triggers automatic deployment
   git push origin master

   # Monitor deployment
   # Check GitHub Actions: https://github.com/your-org/bigturbo/actions
   ```

5. **Post-deployment verification** (5 minutes)
   ```bash
   # Smoke tests
   curl https://yourdomain.com/api/health
   curl -I https://yourdomain.com
   curl -I https://yourdomain.com/about

   # Check monitoring
   # - Sentry: https://sentry.io
   # - Vercel: https://vercel.com/dashboard
   # - Uptime monitor: https://uptimerobot.com
   ```

**Success Criteria:**
- All endpoints return 200 status
- No errors in Sentry
- Monitoring shows normal metrics
- Uptime monitors passing

**Rollback Procedure:**
See [RB-005: Emergency Rollback](#rb-005-emergency-rollback)

---

### RB-002: Update Environment Variables

**Frequency:** As needed
**Duration:** 5-10 minutes
**Risk Level:** Low to Medium

**Procedure:**

**Via Vercel Dashboard:**

1. **Navigate to settings**
   - Go to https://vercel.com/dashboard
   - Select `bigturbo` project
   - Click "Settings" > "Environment Variables"

2. **Add/Update variable**
   - Click "Add New"
   - Key: `VARIABLE_NAME`
   - Value: `variable_value`
   - Select environments: Production, Preview, Development
   - Click "Save"

3. **Redeploy** (required for changes to take effect)
   - Go to "Deployments"
   - Click "..." on latest deployment
   - Click "Redeploy"
   - Wait for deployment to complete

4. **Verify**
   ```bash
   # Check health endpoint
   curl https://yourdomain.com/api/health

   # Check for errors in logs
   vercel logs
   ```

**Via Vercel CLI:**

```bash
# Add new variable
vercel env add VARIABLE_NAME

# Choose environment when prompted
# Enter value when prompted

# Pull variables to local
vercel env pull .env.local

# Redeploy to apply changes
vercel --prod
```

**Via GitHub Actions (CI/CD):**

```bash
# Add to GitHub Secrets
# Go to: Settings > Secrets and variables > Actions
# Click "New repository secret"
# Name: SECRET_NAME
# Value: secret_value

# Changes apply on next deployment
git push origin master
```

**Important:**
- Never commit secrets to git
- Always redeploy after changing variables
- Test in staging before production
- Document changes in team changelog

---

### RB-003: Monitor Application Health

**Frequency:** Continuous (automated), Daily review
**Duration:** 10-15 minutes
**Risk Level:** Low

**Monitoring Checklist:**

**Daily Health Check (5 minutes):**

1. **Check uptime monitors**
   - UptimeRobot: https://uptimerobot.com/dashboard
   - Verify all monitors green
   - Check uptime percentage (target: >99.9%)

2. **Review error tracking**
   - Sentry: https://sentry.io/organizations/your-org/issues/
   - Check for new errors
   - Verify error rate < 1%
   - Review error trends

3. **Check performance**
   - Vercel Analytics: https://vercel.com/analytics
   - Review page load times (target: <3s)
   - Check Core Web Vitals
   - Monitor traffic patterns

4. **Review deployment status**
   - Verify latest deployment successful
   - Check build times
   - Review deployment frequency

**Weekly Deep Dive (15 minutes):**

1. **Analyze trends**
   - Week-over-week error rate
   - Performance trends
   - Traffic growth
   - User behavior patterns

2. **Review alerts**
   - Slack notifications
   - Email alerts
   - Incident patterns

3. **Check dependencies**
   ```bash
   npm audit
   npm outdated
   ```

4. **Performance audit**
   ```bash
   # Run Lighthouse
   npm install -g @lhci/cli
   lhci autorun --collect.url=https://yourdomain.com
   ```

**Metrics to Track:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Uptime | 99.9% | <99.5% |
| Error Rate | <1% | >5% |
| Page Load Time | <3s | >5s |
| API Response Time | <500ms | >2s |
| Build Time | <5min | >10min |

**Automated Monitoring:**
- Uptime monitors run every 5 minutes
- Sentry captures all errors automatically
- Vercel tracks all requests
- Alerts sent to Slack and email

---

### RB-004: Investigate Error Spike

**Trigger:** Error rate >5% or >10 errors/minute
**Duration:** 30-60 minutes
**Risk Level:** High

**Immediate Response (5 minutes):**

1. **Acknowledge alert**
   - Acknowledge in PagerDuty (if configured)
   - Notify team in Slack

2. **Assess severity**
   - Check user impact
   - Determine affected features
   - Check if revenue-impacting

3. **Quick verification**
   ```bash
   # Check application status
   curl https://yourdomain.com/api/health

   # Check error rate in Sentry
   # Open Sentry dashboard
   ```

**Investigation (15-20 minutes):**

1. **Review Sentry errors**
   - Go to Sentry > Issues
   - Sort by "First Seen" or "Events"
   - Identify error pattern:
     - All same error? (Likely code issue)
     - Different errors? (Likely infrastructure)
     - Specific routes? (Feature-specific issue)

2. **Check recent changes**
   ```bash
   # View recent deployments
   git log --oneline -10

   # Check deployment time vs. error spike time
   # Check Vercel deployment history
   ```

3. **Review logs**
   ```bash
   # Vercel logs
   vercel logs --follow

   # Look for patterns:
   # - Specific endpoint failing
   # - Environment variable missing
   # - External service timeout
   ```

4. **Check dependencies**
   - External API status (if applicable)
   - Database status (future)
   - CDN status
   - Vercel status: https://www.vercel-status.com/

**Resolution:**

**If code-related:**
```bash
# Option 1: Quick fix
git checkout -b hotfix/error-fix
# Make minimal fix
git commit -m "fix: resolve error spike issue"
git push origin hotfix/error-fix
# Create PR and fast-track

# Option 2: Rollback
# See RB-005: Emergency Rollback
```

**If infrastructure-related:**
- Check Vercel status page
- Contact Vercel support
- Monitor for resolution
- Communicate to users

**Post-Incident:**
- Document in incident log
- Create post-mortem (for major incidents)
- Implement preventive measures
- Update runbooks

---

### RB-005: Emergency Rollback

**Trigger:** Critical production issue
**Duration:** 5-10 minutes
**Risk Level:** Medium

**When to Rollback:**
- Critical functionality broken
- Security vulnerability
- Major performance degradation (>2x slower)
- High error rate (>10%)
- Data corruption risk

**Procedure:**

**Method 1: Vercel Dashboard (Fastest - 2 minutes)**

1. **Navigate to deployments**
   - Go to https://vercel.com/dashboard
   - Select `bigturbo` project
   - Click "Deployments" tab

2. **Find last working deployment**
   - Identify deployment before issues started
   - Verify timestamp and commit hash
   - Click "..." menu on that deployment

3. **Promote to production**
   - Click "Promote to Production"
   - Confirm promotion
   - Wait 30 seconds for edge propagation

4. **Verify rollback**
   ```bash
   curl https://yourdomain.com/api/health
   curl -I https://yourdomain.com
   ```

**Method 2: Git Revert (5 minutes)**

1. **Revert problematic commit**
   ```bash
   # Find commit hash
   git log --oneline -5

   # Revert commit
   git revert <commit-hash>

   # Push to trigger deployment
   git push origin master
   ```

2. **Monitor deployment**
   - Check GitHub Actions
   - Wait for deployment to complete

3. **Verify**
   ```bash
   curl https://yourdomain.com/api/health
   ```

**Method 3: Vercel CLI (3 minutes)**

```bash
# List recent deployments
vercel ls

# Promote specific deployment
vercel promote <deployment-url> --scope=<team-name>

# Verify
curl https://yourdomain.com/api/health
```

**Post-Rollback Actions:**

1. **Notify stakeholders**
   ```
   Subject: Production Rollback Completed

   Production has been rolled back to previous version due to [issue].

   - Rollback time: [timestamp]
   - Previous version: [commit hash]
   - Current status: Stable
   - Next steps: Investigating root cause
   ```

2. **Update status page** (if applicable)

3. **Create incident ticket**
   - Document what happened
   - Timeline of events
   - Resolution steps
   - Root cause (when identified)

4. **Schedule post-mortem**
   - Invite relevant team members
   - Review timeline
   - Identify improvements
   - Create action items

---

## Incident Response

### IR-001: Application Down

**Severity:** Critical
**Response Time:** Immediate

**Detection:**
- Uptime monitor alert
- User reports
- Health check failing

**Immediate Response:**

1. **Verify outage** (1 minute)
   ```bash
   # Multiple checks
   curl -I https://yourdomain.com
   curl https://yourdomain.com/api/health

   # Check from different location
   # Use: https://www.isitdownrightnow.com/yourdomain.com
   ```

2. **Check infrastructure** (2 minutes)
   - Vercel status: https://www.vercel-status.com/
   - Vercel dashboard: Any deployment errors?
   - GitHub Actions: Build failures?

3. **Notify team** (1 minute)
   ```
   @here Production is down. Investigating.
   - Detection time: [timestamp]
   - Verifying scope of outage
   - ETA: 5 minutes
   ```

**Investigation:**

1. **Check Vercel deployment**
   - Go to Vercel > Deployments
   - Check latest deployment status
   - Review build logs for errors
   - Check function logs for runtime errors

2. **Check recent changes**
   ```bash
   git log --oneline -5
   # Identify recent deployments
   ```

3. **Review errors**
   - Sentry for exceptions
   - Vercel logs for errors
   - Browser console errors

**Resolution:**

**If deployment failed:**
```bash
# Rollback to last working deployment
# See RB-005: Emergency Rollback
```

**If infrastructure issue:**
- Monitor Vercel status page
- Contact Vercel support: support@vercel.com
- Check Twitter: @vercel

**If configuration issue:**
- Check environment variables
- Verify DNS settings
- Check SSL certificate

**Post-Resolution:**
```bash
# Verify application up
curl https://yourdomain.com/api/health

# Notify team
"Production restored. Root cause: [issue].
Duration: [X minutes]. Post-mortem scheduled."
```

---

### IR-002: Performance Degradation

**Severity:** High
**Response Time:** 15 minutes

**Detection:**
- Slow page loads reported
- Vercel Analytics showing increased response times
- Core Web Vitals declining

**Investigation:**

1. **Measure current performance**
   ```bash
   # Check response time
   time curl -I https://yourdomain.com

   # Run Lighthouse
   lhci autorun --collect.url=https://yourdomain.com
   ```

2. **Check Vercel Analytics**
   - Review response time graph
   - Identify when degradation started
   - Check affected routes

3. **Review recent changes**
   ```bash
   # Check recent deployments
   git log --oneline --since="24 hours ago"
   ```

4. **Check external dependencies**
   - Database response time (future)
   - External API performance
   - CDN performance

**Resolution:**

**If code-related:**
- Identify slow queries (future with database)
- Check for infinite loops
- Review recent changes
- Consider rollback if severe

**If infrastructure-related:**
- Check Vercel function execution times
- Review bundle size: `.next/analyze/`
- Check for CDN issues
- Scale resources if needed (Vercel auto-scales)

**Optimization:**
```bash
# Analyze bundle
npm run build
# Check .next/build-manifest.json

# Profile in browser
# Chrome DevTools > Performance > Reload
```

---

### IR-003: Security Incident

**Severity:** Critical
**Response Time:** Immediate

**Types:**
- Unauthorized access detected
- Security vulnerability disclosed
- Data breach suspected
- DDoS attack

**Immediate Response:**

1. **Assess severity** (5 minutes)
   - Confirm security incident
   - Determine scope and impact
   - Check for data exposure

2. **Contain incident** (10 minutes)
   - Rotate compromised credentials immediately
   - Block malicious IPs (via Vercel or Cloudflare)
   - Take affected system offline if necessary
   - Enable additional logging

3. **Notify stakeholders** (5 minutes)
   - Security team
   - Management
   - Legal (if data breach)
   - Affected users (as required by law)

**Investigation:**

1. **Review logs**
   ```bash
   # Check Vercel logs
   vercel logs --since 24h

   # Check Sentry for suspicious activity
   # Review access logs
   ```

2. **Identify attack vector**
   - Review recent code changes
   - Check for known vulnerabilities
   - Review access logs
   - Check for SQL injection attempts (future with DB)

3. **Document everything**
   - Timeline of events
   - Actions taken
   - Evidence collected
   - Impact assessment

**Resolution:**

1. **Fix vulnerability**
   ```bash
   # Update dependencies
   npm audit fix

   # Deploy security patch
   git checkout -b hotfix/security-patch
   # Make fixes
   git commit -m "security: patch vulnerability"
   git push origin hotfix/security-patch
   # Fast-track deployment
   ```

2. **Verify fix**
   - Retest vulnerability
   - Run security scan
   - Verify no other vulnerabilities

3. **Restore service**
   - Bring system back online
   - Monitor closely
   - Verify normal operation

**Post-Incident:**
- Conduct security review
- Implement additional safeguards
- Update security procedures
- Consider penetration testing
- File incident report
- Notify affected parties

---

## Maintenance Procedures

### MP-001: Update Dependencies

**Frequency:** Monthly
**Duration:** 1-2 hours
**Risk Level:** Medium

**Procedure:**

1. **Check for updates**
   ```bash
   # Check outdated packages
   npm outdated

   # Check for security vulnerabilities
   npm audit
   ```

2. **Update in separate branch**
   ```bash
   # Create update branch
   git checkout -b chore/update-dependencies

   # Update patch versions (safe)
   npm update

   # Update minor/major versions (review carefully)
   npm install <package>@latest
   ```

3. **Test thoroughly**
   ```bash
   # Install dependencies
   npm ci

   # Run linting
   npm run lint

   # Run type checking
   npm run type-check

   # Build application
   npm run build

   # Test locally
   npm run dev
   ```

4. **Review breaking changes**
   - Read CHANGELOG for each updated package
   - Check migration guides
   - Test affected features
   - Update code if needed

5. **Deploy to staging**
   ```bash
   git push origin chore/update-dependencies
   # Test in staging environment
   ```

6. **Deploy to production**
   - Create PR
   - Get approval
   - Merge to master
   - Monitor deployment

**Critical Updates (Security):**
- Deploy immediately after testing
- Skip staging if severe vulnerability
- Monitor closely post-deployment

---

### MP-002: Database Maintenance (Future)

**Frequency:** Weekly
**Duration:** 30 minutes
**Risk Level:** Medium

**When database is integrated:**

1. **Backup database**
   ```bash
   # Neon automatic backups daily
   # Verify backup exists in Neon dashboard
   ```

2. **Check database size**
   - Monitor storage usage
   - Plan for scaling if needed

3. **Optimize queries**
   - Review slow query log
   - Add indexes if needed
   - Optimize expensive queries

4. **Check connection pool**
   - Monitor active connections
   - Adjust pool size if needed

---

### MP-003: SSL Certificate Renewal

**Frequency:** Automatic (every 90 days)
**Duration:** 5 minutes verification
**Risk Level:** Low

**Vercel handles automatic renewal:**
- Certificates auto-renew via Let's Encrypt
- No action required

**Verification:**

1. **Check certificate expiry**
   ```bash
   # Check SSL certificate
   echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
   ```

2. **Verify HTTPS working**
   ```bash
   curl -I https://yourdomain.com
   # Should return 200, not redirect to HTTP
   ```

**If renewal fails:**
- Check domain DNS settings
- Verify domain ownership in Vercel
- Contact Vercel support

---

## Troubleshooting Guides

### TG-001: Build Failures

**Symptoms:**
- Deployment fails in CI/CD
- "Build failed" error in Vercel
- GitHub Actions workflow fails

**Common Causes & Solutions:**

**1. Type Errors**
```bash
# Check for TypeScript errors
npm run type-check

# Fix errors in code
# Then rebuild
npm run build
```

**2. Linting Errors**
```bash
# Check linting
npm run lint

# Auto-fix when possible
npm run lint -- --fix
```

**3. Missing Dependencies**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or in CI/CD, ensure npm ci is used
```

**4. Environment Variables Missing**
```bash
# Check required variables are set
# In Vercel: Settings > Environment Variables
# Ensure correct environment scope
```

**5. Out of Memory**
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

---

### TG-002: 500 Internal Server Error

**Symptoms:**
- API routes return 500
- Pages crash with 500 error
- Sentry shows unhandled exceptions

**Investigation:**

1. **Check Vercel function logs**
   ```bash
   vercel logs
   # Look for error messages
   ```

2. **Check Sentry**
   - Review recent errors
   - Check error stack trace
   - Identify failing code path

3. **Reproduce locally**
   ```bash
   npm run build
   npm run start
   # Visit failing route
   # Check console for errors
   ```

**Common Causes:**

**1. Uncaught Exception**
```typescript
// Fix: Add error handling
try {
  // risky code
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

**2. Missing Environment Variable**
```typescript
// Fix: Add validation
if (!process.env.API_KEY) {
  throw new Error('API_KEY environment variable is required');
}
```

**3. Invalid Data Access**
```typescript
// Fix: Add null checks
const data = await fetchData();
if (!data) {
  return NextResponse.json(
    { error: 'Data not found' },
    { status: 404 }
  );
}
```

---

### TG-003: Slow Performance

**Symptoms:**
- Pages load slowly (>5 seconds)
- Lighthouse score <50
- Users complaining about speed

**Investigation:**

1. **Measure performance**
   ```bash
   # Run Lighthouse
   lhci autorun --collect.url=https://yourdomain.com

   # Check Core Web Vitals
   # Open Chrome DevTools > Lighthouse > Analyze
   ```

2. **Check bundle size**
   ```bash
   npm run build
   # Review .next/build-manifest.json
   # Check for large bundles
   ```

3. **Profile in browser**
   - Chrome DevTools > Performance
   - Record page load
   - Identify slow operations

**Common Solutions:**

**1. Optimize Images**
```typescript
// Use next/image
import Image from 'next/image';

<Image
  src="/image.jpg"
  width={800}
  height={600}
  alt="Description"
  priority={false} // Only true for above-fold images
/>
```

**2. Code Splitting**
```typescript
// Use dynamic imports
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Loading />,
  ssr: false, // If component is client-only
});
```

**3. Reduce Bundle Size**
```bash
# Remove unused dependencies
npm uninstall <unused-package>

# Use bundle analyzer
npm install @next/bundle-analyzer
# Configure in next.config.ts
```

---

## Emergency Contacts

### On-Call Rotation

**Primary On-Call:** Check PagerDuty schedule
**Secondary On-Call:** Check PagerDuty schedule
**Escalation:** Engineering Manager

### Service Contacts

**Vercel Support:**
- Email: support@vercel.com
- Dashboard: https://vercel.com/help
- Status: https://www.vercel-status.com/
- Response Time: <4 hours (Pro plan)

**Sentry Support:**
- Email: support@sentry.io
- Dashboard: https://sentry.io/support/
- Response Time: <24 hours

**Domain Registrar:**
- Provider: [Your registrar]
- Support: [Contact info]
- Login: [Dashboard URL]

### Internal Contacts

**Engineering Team:**
- DevOps Lead: [Name, Slack, Phone]
- Engineering Manager: [Name, Slack, Phone]
- CTO: [Name, Slack, Phone]

**Business Team:**
- Product Manager: [Name, Slack]
- Customer Support: [Team Slack channel]
- Marketing: [Name, Slack]

### Escalation Path

1. **Level 1:** On-call engineer (respond within 15 minutes)
2. **Level 2:** Engineering manager (respond within 30 minutes)
3. **Level 3:** CTO (respond within 1 hour)
4. **Level 4:** CEO (critical business impact)

---

## Incident Severity Levels

### SEV-1: Critical
- Complete service outage
- Security breach
- Data loss
- Response: Immediate
- Escalation: All hands

### SEV-2: High
- Partial service outage
- Major feature broken
- Significant performance degradation
- Response: Within 15 minutes
- Escalation: On-call team

### SEV-3: Medium
- Minor feature broken
- Non-critical bug
- Moderate performance issue
- Response: Within 1 hour
- Escalation: Engineering team

### SEV-4: Low
- Cosmetic issues
- Enhancement requests
- Minor performance optimization
- Response: Next business day
- Escalation: None required

---

## Runbook Maintenance

**Review Schedule:**
- Monthly: Update with new procedures
- Quarterly: Full review and update
- After incidents: Update based on learnings
- When process changes: Immediate update

**Feedback:**
- Slack: #devops-feedback
- GitHub: Create issue in repo
- Direct: Contact DevOps lead

---

## Additional Resources

- **Deployment Guide:** `/docs/devops/DEPLOYMENT_GUIDE.md`
- **Monitoring Setup:** `/docs/devops/MONITORING_SETUP.md`
- **Environment Variables:** `/docs/devops/ENVIRONMENT_VARIABLES.md`
- **Deployment Checklist:** `/docs/devops/DEPLOYMENT_CHECKLIST.md`
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Docs:** https://vercel.com/docs

# Security Configuration

## Overview

Security configuration and hardening guide for the BigTurbo Next.js application, addressing critical security blockers and implementing production-ready security measures.

**Security Goals:**
- Prevent common web vulnerabilities (XSS, CSRF, clickjacking)
- Secure API endpoints and data transmission
- Implement security headers
- Manage secrets securely
- Enable security monitoring

---

## Critical Security Blockers

### BLOCKER 1: Security Headers Implementation

**Status:** REQUIRED BEFORE PRODUCTION
**Priority:** Critical
**Impact:** Prevents clickjacking, XSS, and other attacks

#### Implementation: Security Headers Middleware

**Create: src/middleware.ts**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Create response
  const response = NextResponse.next();

  // Security Headers
  const headers = response.headers;

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (disable unnecessary features)
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self' data:;
    connect-src 'self' https://vercel.live wss://*.pusher.com https://*.sentry.io;
    frame-src 'self' https://vercel.live;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\\s{2,}/g, ' ').trim();

  headers.set('Content-Security-Policy', cspHeader);

  // HSTS (HTTP Strict Transport Security)
  // Only enable after testing HTTPS is working correctly
  if (process.env.NODE_ENV === 'production') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  return response;
}

// Apply middleware to all routes except static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

#### Alternative: Vercel Configuration

**vercel.json** (if middleware not used):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        }
      ]
    }
  ]
}
```

#### Testing Security Headers

```bash
# Check headers are set
curl -I https://yourdomain.com

# Or use online tool
# https://securityheaders.com/?q=yourdomain.com
# Target: A+ rating

# Check CSP
# Open browser DevTools > Console
# Look for CSP violations
```

---

### BLOCKER 2: Environment Variable Validation

**Status:** REQUIRED BEFORE PRODUCTION
**Priority:** Critical
**Impact:** Prevents runtime errors from missing configuration

#### Implementation: Environment Validation Utility

**Install Zod:**

```bash
npm install zod
```

**Create: utils/env.ts**

```typescript
import { z } from 'zod';

// Define environment schema
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Application URLs
  NEXT_PUBLIC_APP_URL: z.string().url().min(1, 'NEXT_PUBLIC_APP_URL is required'),

  // Monitoring (required in production)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Analytics (optional)
  NEXT_PUBLIC_GA_ID: z.string().optional(),

  // Future: Database (uncomment when integrated)
  // DATABASE_URL: z.string().url(),
  // DATABASE_URL_POOLING: z.string().url().optional(),

  // Future: Authentication (uncomment when integrated)
  // NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  // CLERK_SECRET_KEY: z.string().min(1),
  // CLERK_WEBHOOK_SECRET: z.string().optional(),
});

// Refine schema for production-specific requirements
const refinedSchema = envSchema.refine(
  (data) => {
    // In production, require Sentry
    if (data.NODE_ENV === 'production' && !data.NEXT_PUBLIC_SENTRY_DSN) {
      return false;
    }
    return true;
  },
  {
    message: 'NEXT_PUBLIC_SENTRY_DSN is required in production',
  }
);

// Environment variable type
export type Env = z.infer<typeof envSchema>;

// Validate and export environment variables
function validateEnv(): Env {
  try {
    const env = refinedSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
    return env;
  } catch (error) {
    console.error('❌ Invalid environment variables:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Environment validation failed');
  }
}

// Validate on module load
export const env = validateEnv();

// Type-safe environment access
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  return env[key];
}
```

**Usage in application:**

```typescript
// Import validated environment
import { env, getEnv } from '@/utils/env';

// Use type-safe access
const appUrl = env.NEXT_PUBLIC_APP_URL;
const sentryDsn = getEnv('NEXT_PUBLIC_SENTRY_DSN');

// Environment is validated on app start
// App will not start with invalid configuration
```

**Add to src/app/layout.tsx:**

```typescript
// Validate environment on startup (development only to avoid build issues)
if (process.env.NODE_ENV === 'development') {
  import('@/utils/env');
}
```

---

## Additional Security Measures

### API Route Protection

**Rate Limiting (Future):**

```typescript
// utils/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';

const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  request: NextRequest,
  maxRequests = 10,
  windowMs = 60000
): boolean {
  const ip = request.ip ?? 'anonymous';
  const now = Date.now();
  const record = rateLimit.get(ip);

  if (!record || now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Usage in API route
export async function GET(request: NextRequest) {
  if (!checkRateLimit(request)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Handle request
}
```

### Input Validation

**Install validator:**

```bash
npm install validator
npm install @types/validator --save-dev
```

**Create validation utility:**

```typescript
// utils/validation.ts
import validator from 'validator';

export function validateEmail(email: string): boolean {
  return validator.isEmail(email);
}

export function sanitizeInput(input: string): string {
  return validator.escape(input);
}

export function validateUrl(url: string): boolean {
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
  });
}

// Usage in API route
export async function POST(request: Request) {
  const { email } = await request.json();

  if (!validateEmail(email)) {
    return NextResponse.json(
      { error: 'Invalid email address' },
      { status: 400 }
    );
  }

  // Process valid email
}
```

### CORS Configuration

**For API routes that need CORS:**

```typescript
// utils/cors.ts
import { NextRequest, NextResponse } from 'next/server';

export function corsHeaders(origin?: string) {
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
  ];

  const headers = new Headers();

  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
  }

  return headers;
}

// Usage in API route
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const data = { message: 'Hello' };

  return NextResponse.json(data, {
    headers: corsHeaders(origin),
  });
}
```

### Secure Cookie Configuration

**For authentication cookies (future with Clerk):**

```typescript
// Set secure cookie
response.cookies.set('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
});
```

---

## Secrets Management

### Development Secrets

**Use .env.local:**

```bash
# Never commit .env.local
# Add to .gitignore
.env*.local
```

### Production Secrets

**Vercel Environment Variables:**

1. Go to Vercel Dashboard
2. Settings > Environment Variables
3. Mark as "Sensitive" (encrypted at rest)
4. Scope to specific environment

**Best Practices:**

- Use different secrets for each environment
- Rotate secrets regularly (every 90 days)
- Never log secrets
- Use secret management service for enterprise (AWS Secrets Manager, HashiCorp Vault)

### Secret Rotation Procedure

```bash
# 1. Generate new secret
# 2. Update in Vercel (keep old one temporarily)
# 3. Deploy application
# 4. Test with new secret
# 5. Remove old secret from Vercel
# 6. Update documentation
```

---

## Authentication Security (Future)

### Clerk Integration (Planned)

**Security features:**
- JWT token validation
- Session management
- OAuth integration
- Multi-factor authentication
- Rate limiting
- Brute force protection

**Implementation checklist:**

- [ ] Install Clerk SDK
- [ ] Configure environment variables
- [ ] Protect API routes with Clerk middleware
- [ ] Implement role-based access control
- [ ] Configure webhook signatures
- [ ] Set up session timeout
- [ ] Enable MFA
- [ ] Configure OAuth providers

---

## Security Monitoring

### Sentry Security Monitoring

**Configure in Sentry:**

1. Enable Security Issues
2. Set up alerts for:
   - Suspicious activity patterns
   - Failed authentication attempts
   - Rate limit violations
   - Unexpected API calls

### Dependency Scanning

**GitHub Dependabot:**

1. Enable in repository settings
2. Configure auto-merge for security patches
3. Review weekly security reports

**npm audit:**

```bash
# Run security audit
npm audit

# Fix automatically (use with caution)
npm audit fix

# Fix breaking changes
npm audit fix --force
```

**Scheduled scanning:**

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday
  workflow_dispatch:

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm audit --production
      - run: npm outdated
```

---

## Security Testing

### Security Headers Testing

```bash
# Online tool
curl -I https://yourdomain.com | grep -E "X-Frame|X-Content|X-XSS|CSP|Strict-Transport"

# Or use: https://securityheaders.com/
```

### Penetration Testing

**Recommended tools:**

- **OWASP ZAP:** Free security scanner
- **Burp Suite:** Professional security testing
- **Snyk:** Dependency vulnerability scanning

**Testing checklist:**

- [ ] XSS attacks
- [ ] CSRF attacks
- [ ] SQL injection (with database)
- [ ] Authentication bypass
- [ ] Authorization flaws
- [ ] Insecure direct object references
- [ ] Security misconfiguration
- [ ] Sensitive data exposure

### Security Audit Schedule

**Monthly:**
- Dependency audit
- Security headers check
- SSL certificate check

**Quarterly:**
- Full security review
- Penetration testing (basic)
- Access control review

**Annually:**
- Professional security audit
- Compliance review
- Security training

---

## Incident Response

### Security Incident Procedure

1. **Detection** (< 5 minutes)
   - Monitor alerts
   - Verify incident
   - Assess severity

2. **Containment** (< 15 minutes)
   - Rotate compromised credentials
   - Block malicious actors
   - Isolate affected systems

3. **Investigation** (< 1 hour)
   - Review logs
   - Identify attack vector
   - Assess data exposure
   - Document timeline

4. **Remediation** (< 4 hours)
   - Fix vulnerability
   - Deploy patch
   - Verify fix
   - Restore service

5. **Recovery** (< 8 hours)
   - Monitor for recurrence
   - Communicate with stakeholders
   - Review access logs

6. **Post-Incident** (< 1 week)
   - Conduct post-mortem
   - Implement improvements
   - Update documentation
   - Train team

### Security Contacts

**Internal:**
- Security Lead: [Name, Contact]
- DevOps Lead: [Name, Contact]
- Legal: [Name, Contact]

**External:**
- Vercel Security: security@vercel.com
- Sentry Support: support@sentry.io

---

## Compliance

### GDPR Compliance (If applicable)

**Requirements:**
- [ ] Cookie consent
- [ ] Privacy policy
- [ ] Data processing agreement
- [ ] Right to be forgotten
- [ ] Data portability
- [ ] Data encryption
- [ ] Breach notification

### CCPA Compliance (If applicable)

**Requirements:**
- [ ] Privacy notice
- [ ] Opt-out mechanism
- [ ] Data access request handling
- [ ] Data deletion request handling

---

## Security Checklist

### Pre-Production

- [ ] Security headers middleware implemented
- [ ] Environment variable validation implemented
- [ ] All dependencies updated
- [ ] Security audit passed
- [ ] No secrets in code
- [ ] HTTPS enforced
- [ ] CSP configured
- [ ] Input validation implemented
- [ ] Error messages sanitized
- [ ] Logging configured (no sensitive data)

### Production

- [ ] Security monitoring active
- [ ] Incident response plan ready
- [ ] Access controls configured
- [ ] Secrets rotated
- [ ] Backups configured
- [ ] Security team trained
- [ ] Documentation updated

---

## Resources

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Next.js Security:** https://nextjs.org/docs/advanced-features/security-headers
- **Vercel Security:** https://vercel.com/docs/security
- **MDN Security:** https://developer.mozilla.org/en-US/docs/Web/Security
- **Security Headers:** https://securityheaders.com/

---

## Next Steps

1. **Immediate (Before Production):**
   - [ ] Implement security headers middleware
   - [ ] Implement environment validation
   - [ ] Test security headers
   - [ ] Run security audit

2. **Short-term (First Week):**
   - [ ] Set up security monitoring
   - [ ] Configure alerts
   - [ ] Review and update CSP
   - [ ] Document security procedures

3. **Medium-term (First Month):**
   - [ ] Implement rate limiting
   - [ ] Add input validation
   - [ ] Configure CORS properly
   - [ ] Schedule security training

4. **Long-term (Ongoing):**
   - [ ] Regular security audits
   - [ ] Dependency updates
   - [ ] Penetration testing
   - [ ] Compliance reviews

# Environment Variables Documentation

## Overview

Comprehensive documentation of all environment variables used in the BigTurbo Next.js application, including configuration for different environments, security best practices, and validation requirements.

---

## Environment Types

### Development (.env.local)
Local development environment with localhost URLs and test credentials.

### Staging (.env.staging or Vercel Environment Variables)
QA/testing environment with staging URLs and test data.

### Production (.env.production or Vercel Environment Variables)
Live production environment with real credentials and production URLs.

---

## Required Environment Variables

### Application Configuration

#### NODE_ENV
- **Description:** Runtime environment
- **Required:** Yes (auto-set by Next.js)
- **Values:** `development`, `production`, `test`
- **Default:** `development`
- **Used in:** Build process, logging, error handling

```bash
NODE_ENV=production
```

#### NEXT_PUBLIC_APP_URL
- **Description:** Public application URL
- **Required:** Yes
- **Development:** `http://localhost:3000`
- **Staging:** `https://bigturbo-staging.vercel.app`
- **Production:** `https://yourdomain.com`
- **Used in:** API calls, redirects, canonical URLs, Open Graph tags

```bash
# Development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Monitoring & Analytics

### Sentry Configuration

#### NEXT_PUBLIC_SENTRY_DSN
- **Description:** Sentry Data Source Name (public)
- **Required:** Yes (production)
- **Format:** `https://[key]@[organization].ingest.sentry.io/[project-id]`
- **Used in:** Client-side error tracking

```bash
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7890123
```

#### SENTRY_ORG
- **Description:** Sentry organization slug
- **Required:** Yes (for builds with source maps)
- **Example:** `your-org-name`
- **Used in:** Build-time source map upload

```bash
SENTRY_ORG=your-org-name
```

#### SENTRY_PROJECT
- **Description:** Sentry project slug
- **Required:** Yes (for builds with source maps)
- **Example:** `bigturbo`
- **Used in:** Build-time source map upload

```bash
SENTRY_PROJECT=bigturbo
```

#### SENTRY_AUTH_TOKEN
- **Description:** Sentry authentication token
- **Required:** Yes (for builds)
- **Security:** Keep secret, never commit
- **Used in:** Build-time source map upload

```bash
SENTRY_AUTH_TOKEN=sntrys_your_secret_token_here
```

### Analytics Configuration

#### NEXT_PUBLIC_GA_ID
- **Description:** Google Analytics 4 Measurement ID
- **Required:** Optional
- **Format:** `G-XXXXXXXXXX`
- **Used in:** Google Analytics tracking

```bash
NEXT_PUBLIC_GA_ID=G-ABCD123456
```

#### NEXT_PUBLIC_VERCEL_ANALYTICS_ID
- **Description:** Vercel Analytics ID (auto-configured)
- **Required:** No (auto-set by Vercel)
- **Used in:** Vercel Analytics

---

## CI/CD Configuration

### GitHub Actions Secrets

#### VERCEL_TOKEN
- **Description:** Vercel authentication token
- **Required:** Yes (for deployments)
- **Location:** GitHub Secrets
- **Generate:** Vercel Dashboard > Settings > Tokens

```bash
VERCEL_TOKEN=your_vercel_token_here
```

#### VERCEL_ORG_ID
- **Description:** Vercel organization/team ID
- **Required:** Yes (for deployments)
- **Location:** GitHub Secrets
- **Find:** `.vercel/project.json` after `vercel link`

```bash
VERCEL_ORG_ID=team_abc123xyz
```

#### VERCEL_PROJECT_ID
- **Description:** Vercel project ID
- **Required:** Yes (for deployments)
- **Location:** GitHub Secrets
- **Find:** `.vercel/project.json` after `vercel link`

```bash
VERCEL_PROJECT_ID=prj_abc123xyz
```

#### PRODUCTION_APP_URL
- **Description:** Production application URL
- **Required:** Yes (for smoke tests)
- **Location:** GitHub Secrets

```bash
PRODUCTION_APP_URL=https://yourdomain.com
```

#### STAGING_APP_URL
- **Description:** Staging application URL
- **Required:** Yes (for staging deployments)
- **Location:** GitHub Secrets

```bash
STAGING_APP_URL=https://bigturbo-staging.vercel.app
```

---

## Future Services (Planned)

### Database Configuration (Neon PostgreSQL)

#### DATABASE_URL
- **Description:** PostgreSQL connection string
- **Required:** Future (when database integrated)
- **Format:** `postgresql://user:password@host:port/database?sslmode=require`
- **Security:** Keep secret, use Vercel secrets
- **Used in:** Database connections, Prisma/Drizzle ORM

```bash
# Production
DATABASE_URL=postgresql://user:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require

# Development (local)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bigturbo_dev
```

#### DATABASE_URL_POOLING
- **Description:** Connection pooling URL (Neon)
- **Required:** Future (for serverless)
- **Format:** Same as DATABASE_URL with pooler host

```bash
DATABASE_URL_POOLING=postgresql://user:password@ep-cool-name-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Authentication (Clerk)

#### NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- **Description:** Clerk publishable key (public)
- **Required:** Future (when auth integrated)
- **Format:** `pk_test_` or `pk_live_`
- **Used in:** Client-side authentication

```bash
# Development
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_abcd1234

# Production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xyz789
```

#### CLERK_SECRET_KEY
- **Description:** Clerk secret key
- **Required:** Future (when auth integrated)
- **Format:** `sk_test_` or `sk_live_`
- **Security:** Keep secret
- **Used in:** Server-side authentication

```bash
# Development
CLERK_SECRET_KEY=sk_test_secret123

# Production
CLERK_SECRET_KEY=sk_live_secret789
```

#### CLERK_WEBHOOK_SECRET
- **Description:** Clerk webhook signing secret
- **Required:** Future (for webhooks)
- **Security:** Keep secret
- **Used in:** Webhook verification

```bash
CLERK_WEBHOOK_SECRET=whsec_abcd1234xyz
```

### Payment Processing (Stripe)

#### NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- **Description:** Stripe publishable key (public)
- **Required:** Future (when payments integrated)
- **Format:** `pk_test_` or `pk_live_`
- **Used in:** Client-side Stripe.js

```bash
# Development
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51Abc123

# Production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51Xyz789
```

#### STRIPE_SECRET_KEY
- **Description:** Stripe secret key
- **Required:** Future (when payments integrated)
- **Format:** `sk_test_` or `sk_live_`
- **Security:** Keep secret
- **Used in:** Server-side Stripe API calls

```bash
# Development
STRIPE_SECRET_KEY=sk_test_51Abc123

# Production
STRIPE_SECRET_KEY=sk_live_51Xyz789
```

#### STRIPE_WEBHOOK_SECRET
- **Description:** Stripe webhook signing secret
- **Required:** Future (for webhooks)
- **Security:** Keep secret
- **Used in:** Webhook verification

```bash
# Development
STRIPE_WEBHOOK_SECRET=whsec_test_abc123

# Production
STRIPE_WEBHOOK_SECRET=whsec_live_xyz789
```

---

## Environment Variable Naming Conventions

### Prefixes

**NEXT_PUBLIC_**
- Exposed to browser
- Can be used in client components
- Bundled into JavaScript
- Safe for public information only

**No prefix**
- Server-side only
- Never exposed to browser
- Use for secrets and sensitive data

### Naming Style

- Use SCREAMING_SNAKE_CASE
- Be descriptive and specific
- Group related variables with common prefixes
- Example: `DATABASE_URL`, `DATABASE_URL_POOLING`

---

## Security Best Practices

### Never Commit Secrets

**Add to .gitignore:**
```bash
.env*.local
.env.production
.env.staging
.vercel
```

**Keep committed:**
```bash
.env.example  # Template only, no real values
```

### Secret Rotation

**Regular rotation schedule:**
- API keys: Every 90 days
- Database passwords: Every 90 days
- Webhook secrets: On compromise or yearly
- Authentication tokens: Every 180 days

### Access Control

1. **Limit access** to production secrets
2. **Use different keys** for each environment
3. **Implement role-based access** for team members
4. **Audit access logs** regularly
5. **Use secret management tools** (Vercel Secrets, AWS Secrets Manager)

### Environment Variable Validation

**Create validation utility:**

**utils/env.ts:**
```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Monitoring (optional in development)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Analytics (optional)
  NEXT_PUBLIC_GA_ID: z.string().optional(),

  // Future: Database (commented until integrated)
  // DATABASE_URL: z.string().url(),
  // DATABASE_URL_POOLING: z.string().url().optional(),

  // Future: Authentication (commented until integrated)
  // NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
  // CLERK_SECRET_KEY: z.string(),

  // Future: Payments (commented until integrated)
  // NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string(),
  // STRIPE_SECRET_KEY: z.string(),
});

export function validateEnv() {
  try {
    envSchema.parse(process.env);
    console.log('✅ Environment variables validated');
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables');
  }
}

// For type-safe access
export const env = envSchema.parse(process.env);
```

**Install Zod:**
```bash
npm install zod
```

**Use in application:**
```typescript
// src/app/layout.tsx
import { validateEnv } from '@/utils/env';

// Validate on startup (development only)
if (process.env.NODE_ENV === 'development') {
  validateEnv();
}
```

---

## Setting Environment Variables

### Local Development

**Create .env.local:**
```bash
cp .env.example .env.local
# Edit .env.local with your development values
```

**Load order:**
1. `.env.local` (highest priority)
2. `.env.development` / `.env.production`
3. `.env`

### Vercel (Production/Staging)

**Via Dashboard:**
1. Go to Vercel Dashboard
2. Select project
3. Settings > Environment Variables
4. Add variable:
   - Key: `NEXT_PUBLIC_APP_URL`
   - Value: `https://yourdomain.com`
   - Environment: Production, Preview, Development

**Via CLI:**
```bash
# Add production variable
vercel env add NEXT_PUBLIC_APP_URL production
# Enter value when prompted

# Add to all environments
vercel env add DATABASE_URL

# Pull environment variables
vercel env pull .env.local
```

### GitHub Actions

**Add secrets:**
1. Repository > Settings > Secrets and variables > Actions
2. New repository secret
3. Add all required CI/CD secrets

**Use in workflow:**
```yaml
- name: Build application
  env:
    NEXT_PUBLIC_APP_URL: ${{ secrets.PRODUCTION_APP_URL }}
    NEXT_PUBLIC_SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
  run: npm run build
```

---

## Environment Configuration Files

### .env.example (Template)

```bash
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Monitoring (optional in development)
# NEXT_PUBLIC_SENTRY_DSN=
# SENTRY_ORG=
# SENTRY_PROJECT=
# SENTRY_AUTH_TOKEN=

# Analytics (optional)
# NEXT_PUBLIC_GA_ID=

# Database (Neon/PostgreSQL) - to be configured later
# DATABASE_URL=
# DATABASE_URL_POOLING=

# Authentication (Clerk) - to be configured later
# NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
# CLERK_SECRET_KEY=
# CLERK_WEBHOOK_SECRET=

# Payments (Stripe) - to be configured later
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
```

### .env.local (Development)

```bash
# Copy from .env.example and fill in development values
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Add development-specific values
# NEXT_PUBLIC_SENTRY_DSN=https://...ingest.sentry.io/...
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bigturbo_dev
```

### Vercel Environment Variables (Production)

```bash
# Required for production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://...ingest.sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=bigturbo
SENTRY_AUTH_TOKEN=sntrys_...

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Future integrations...
```

---

## Troubleshooting

### Variable Not Loading

**Check:**
1. File name: Must be `.env.local` (not `.env`)
2. Prefix: Use `NEXT_PUBLIC_` for client-side
3. Restart dev server after adding variables
4. Check `.gitignore` isn't excluding the file

**Debug:**
```typescript
// Check if variable is loaded
console.log('APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

// Server-side only
console.log('DATABASE_URL:', process.env.DATABASE_URL);
```

### Variable Empty in Production

**Vercel:**
1. Check variable is set in Vercel Dashboard
2. Verify environment scope (Production/Preview/Development)
3. Redeploy after adding variable
4. Check build logs for errors

### Type Errors

**Solution:** Add to `next-env.d.ts` or create `types/env.d.ts`:

```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      NEXT_PUBLIC_APP_URL: string;
      NEXT_PUBLIC_SENTRY_DSN?: string;
      DATABASE_URL?: string;
      CLERK_SECRET_KEY?: string;
      STRIPE_SECRET_KEY?: string;
    }
  }
}

export {};
```

---

## Environment Variable Checklist

### Development Setup
- [ ] `.env.local` created from `.env.example`
- [ ] `NEXT_PUBLIC_APP_URL` set to `http://localhost:3000`
- [ ] Optional monitoring variables configured
- [ ] Variables loading correctly (test in app)

### Staging Setup
- [ ] All required variables set in Vercel (Preview scope)
- [ ] `STAGING_APP_URL` in GitHub Secrets
- [ ] Test deployment successful
- [ ] Variables accessible in deployed app

### Production Setup
- [ ] All required variables set in Vercel (Production scope)
- [ ] `PRODUCTION_APP_URL` in GitHub Secrets
- [ ] Secrets rotated from staging
- [ ] Environment validation passing
- [ ] No sensitive data in client bundle
- [ ] All CI/CD secrets configured in GitHub

---

## Migration Plan (Future Services)

When integrating new services:

1. **Add to .env.example** (commented with instructions)
2. **Update this documentation** with details
3. **Add to environment validation** (utils/env.ts)
4. **Configure in Vercel** for all environments
5. **Add to GitHub Secrets** if needed for CI/CD
6. **Test in staging** before production
7. **Document in runbooks**

---

## Resources

- **Next.js Environment Variables:** https://nextjs.org/docs/basic-features/environment-variables
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables
- **GitHub Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **Sentry Configuration:** https://docs.sentry.io/platforms/javascript/guides/nextjs/

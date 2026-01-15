# Deployment Guide - BigTurbo Next.js Application

## Overview

This guide provides comprehensive deployment instructions for the BigTurbo Next.js 15 application across multiple hosting platforms with a primary focus on Vercel (recommended for Next.js applications).

**Application Stack:**
- Next.js 15.1.6 with App Router
- React 19
- TypeScript 5.7
- Tailwind CSS 3.4
- Node.js 18.17.0+ / 20.x (recommended)

**Current Status:**
- Code Quality: 85/100
- Build Status: Passing
- Critical Blockers: 2 (security headers, environment validation)

---

## Deployment Strategy

### Recommended: Vercel (Primary Platform)

**Why Vercel?**
- Built by Next.js creators - optimal Next.js support
- Zero-configuration deployments
- Automatic HTTPS/SSL
- Edge network with global CDN
- Built-in monitoring and analytics
- Serverless functions for API routes
- Preview deployments for PRs
- Instant rollbacks

**Performance Characteristics:**
- Cold start: <500ms
- Time to first byte: <100ms
- Global edge locations: 100+
- Auto-scaling: Built-in
- Cost: Free tier available, scales with usage

### Alternative Platforms

#### 1. Netlify
**Pros:** Similar to Vercel, good DX, serverless functions
**Cons:** Slightly slower Next.js builds
**Use Case:** Multi-site management, when already on Netlify

#### 2. AWS (Self-Hosted)
**Services:** ECS Fargate, Lambda@Edge, S3 + CloudFront
**Pros:** Full control, enterprise features, existing AWS infrastructure
**Cons:** Complex setup, more maintenance
**Use Case:** Enterprise deployments, existing AWS commitment

#### 3. Google Cloud Platform
**Services:** Cloud Run, App Engine
**Pros:** Good auto-scaling, integration with GCP services
**Cons:** More configuration needed
**Use Case:** GCP-centric infrastructure

#### 4. Docker/Kubernetes (Self-Hosted)
**Pros:** Full control, portable, multi-cloud
**Cons:** Requires infrastructure expertise
**Use Case:** On-premise deployments, specific compliance needs

---

## Environment Setup

### Development Environment
- **Branch:** `develop` or feature branches
- **URL:** `http://localhost:3000`
- **Auto-deployment:** Disabled
- **Purpose:** Local development and testing

### Staging Environment
- **Branch:** `develop`
- **URL:** `https://bigturbo-staging.vercel.app` (configure)
- **Auto-deployment:** Enabled on develop branch
- **Purpose:** QA testing, client review
- **Data:** Test data, sanitized production replica

### Production Environment
- **Branch:** `master`
- **URL:** `https://yourdomain.com` (configure)
- **Auto-deployment:** Enabled with approval gates
- **Purpose:** Live application
- **Data:** Production data

---

## Vercel Deployment (Recommended)

### Initial Setup

#### 1. Create Vercel Account
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

#### 2. Link Project
```bash
# From project root
vercel link

# Follow prompts:
# - Set up and deploy: Y
# - Scope: Select your team/account
# - Link to existing project: N
# - Project name: bigturbo
# - Directory: ./
```

#### 3. Configure Project Settings

**Via Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings > General
   - Framework Preset: Next.js
   - Node.js Version: 20.x
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm ci`

4. Settings > Environment Variables
   - Add all required variables (see Environment Variables section)

#### 4. Configure GitHub Integration

**Automatic Deployments:**
1. Settings > Git
2. Connect GitHub repository
3. Configure branches:
   - Production Branch: `master`
   - Preview Branches: All branches
   - Auto-deploy: Enable

**Branch Protection:**
- Production: Require PR reviews
- Staging: Auto-deploy on push
- Feature: Preview deployments on PR

### Manual Deployment

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy with environment variables
vercel --prod --env NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Vercel Configuration File

Create `vercel.json` (optional, for advanced configuration):

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1", "sfo1", "cdg1"],
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
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/healthz",
      "destination": "/api/health"
    }
  ]
}
```

---

## Alternative Deployment Options

### Netlify Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
netlify init

# Deploy
netlify deploy --prod
```

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

### AWS Deployment (ECS Fargate)

**Prerequisites:**
- AWS Account with appropriate IAM permissions
- AWS CLI configured
- Docker installed

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**.dockerignore:**
```
node_modules
.next
.git
.env*.local
npm-debug.log
README.md
.gitignore
```

**Update next.config.ts for standalone:**
```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone', // Add this for Docker
  // ... rest of config
};
```

**Build and deploy:**
```bash
# Build image
docker build -t bigturbo:latest .

# Test locally
docker run -p 3000:3000 bigturbo:latest

# Push to ECR and deploy via ECS (requires AWS setup)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag bigturbo:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/bigturbo:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bigturbo:latest
```

### Kubernetes Deployment

**k8s/deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bigturbo
  labels:
    app: bigturbo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bigturbo
  template:
    metadata:
      labels:
        app: bigturbo
    spec:
      containers:
      - name: bigturbo
        image: your-registry/bigturbo:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_PUBLIC_APP_URL
          valueFrom:
            configMapKeyRef:
              name: bigturbo-config
              key: app-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: bigturbo-service
spec:
  selector:
    app: bigturbo
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

## Domain Configuration

### Custom Domain Setup (Vercel)

1. **Add Domain in Vercel Dashboard:**
   - Settings > Domains
   - Add domain: `yourdomain.com`
   - Add `www.yourdomain.com` (optional)

2. **DNS Configuration:**
   ```
   Type  Name  Value
   A     @     76.76.21.21
   CNAME www   cname.vercel-dns.com
   ```

3. **SSL/TLS:**
   - Automatic via Vercel (Let's Encrypt)
   - Certificate auto-renews
   - HTTPS enforced by default

### Subdomain Configuration

**Staging:** `staging.yourdomain.com`
```
Type  Name     Value
CNAME staging  cname-staging.vercel-dns.com
```

**API:** `api.yourdomain.com`
```
Type  Name  Value
CNAME api    cname.vercel-dns.com
```

---

## SSL/TLS Configuration

### Vercel (Automatic)
- SSL certificates automatically provisioned
- Auto-renewal via Let's Encrypt
- Supports custom certificates (Enterprise)

### Nginx (Self-Hosted)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Cost Analysis

### Vercel Pricing

**Hobby (Free):**
- 100GB bandwidth
- 100 deployments/day
- Serverless function executions: 100GB-hours
- Best for: Personal projects, small apps

**Pro ($20/month per member):**
- 1TB bandwidth
- Unlimited deployments
- Serverless function executions: 1000GB-hours
- Team collaboration
- Best for: Professional projects, small teams

**Enterprise (Custom):**
- Custom bandwidth
- Advanced security
- SLA guarantees
- Best for: Large organizations

### AWS Estimated Costs

**Small Deployment (ECS Fargate):**
- 2 vCPU, 4GB RAM: ~$50/month
- ALB: ~$22/month
- Data transfer: ~$10/month
- **Total: ~$82/month**

**Medium Deployment:**
- 4 vCPU, 8GB RAM (3 tasks): ~$300/month
- ALB + CloudFront: ~$50/month
- **Total: ~$350/month**

### Cost Comparison

| Platform | Entry Cost | Medium Scale | Enterprise |
|----------|-----------|--------------|------------|
| Vercel   | Free      | $20/month    | Custom     |
| Netlify  | Free      | $19/month    | Custom     |
| AWS      | ~$50/month| ~$350/month  | $1000+     |
| GCP      | ~$40/month| ~$300/month  | $900+      |

**Recommendation:** Start with Vercel free tier, upgrade to Pro as needed.

---

## Performance Optimization

### Build Optimization

**next.config.ts optimizations:**
```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Compression
  compress: true,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },

  // Production optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

### Caching Strategy

**Static Assets:**
- Immutable assets: `Cache-Control: public, max-age=31536000, immutable`
- Images: CDN caching with automatic optimization

**API Routes:**
- Dynamic content: `Cache-Control: no-store, must-revalidate`
- Health check: No cache (as implemented)

**Pages:**
- Static pages: ISR (Incremental Static Regeneration)
- Dynamic pages: SSR with edge caching

### CDN Configuration

**Vercel Edge Network:**
- Automatic edge caching
- 100+ global locations
- Smart routing

**CloudFront (AWS):**
```json
{
  "DefaultCacheBehavior": {
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
    "CachedMethods": ["GET", "HEAD", "OPTIONS"],
    "Compress": true,
    "ForwardedValues": {
      "QueryString": true,
      "Headers": ["Host", "Accept", "Authorization"]
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  }
}
```

---

## Rollback Procedures

### Vercel Rollback

**Via Dashboard:**
1. Go to Deployments page
2. Find previous successful deployment
3. Click "..." > "Promote to Production"
4. Instant rollback (< 30 seconds)

**Via CLI:**
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

### Docker/Kubernetes Rollback

```bash
# Kubernetes rollback
kubectl rollout undo deployment/bigturbo

# Rollback to specific revision
kubectl rollout undo deployment/bigturbo --to-revision=2

# Check rollout status
kubectl rollout status deployment/bigturbo
```

### Git-Based Rollback

```bash
# Revert last commit
git revert HEAD

# Push to trigger redeployment
git push origin master

# Or revert to specific commit
git revert <commit-hash>
git push origin master
```

---

## Monitoring Integration

Monitoring setup is detailed in `MONITORING_SETUP.md`. Key integrations:

- **Vercel Analytics:** Built-in (enable in dashboard)
- **Sentry:** Error tracking and performance monitoring
- **Uptime monitoring:** StatusCake, UptimeRobot
- **Log aggregation:** Vercel Logs, CloudWatch, Datadog

---

## Security Checklist

Before deploying to production:

- [ ] Environment variables secured (no secrets in code)
- [ ] Security headers configured (see vercel.json)
- [ ] HTTPS enforced
- [ ] CORS configured appropriately
- [ ] Rate limiting implemented (via middleware or Vercel)
- [ ] Dependencies audited (`npm audit`)
- [ ] No console.logs in production
- [ ] Error messages sanitized (no sensitive data)
- [ ] Authentication implemented (when Clerk integrated)
- [ ] API routes protected
- [ ] Input validation on all forms
- [ ] CSP headers configured

**Critical Blockers to Address:**
1. Add security headers middleware (see SECURITY.md)
2. Implement environment variable validation (see ENV_VALIDATION.md)

---

## Troubleshooting

### Build Failures

**Issue:** `Module not found`
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue:** `Type errors`
```bash
# Run type check
npm run type-check

# Fix errors before deployment
```

### Deployment Failures

**Vercel timeout:**
- Increase timeout in vercel.json: `"builds": [{"maxDuration": 900}]`
- Optimize build (reduce dependencies)

**Out of memory:**
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096`

### Runtime Issues

**500 Internal Server Error:**
1. Check Vercel logs: Settings > Logs
2. Check environment variables
3. Review API route implementations

**Slow performance:**
1. Enable Vercel Analytics
2. Check bundle size: `npm run build`
3. Optimize images and assets
4. Implement code splitting

---

## Next Steps

1. **Set up monitoring** (see `MONITORING_SETUP.md`)
2. **Configure CI/CD secrets** (see `CI_CD_SETUP.md`)
3. **Address security blockers** (see `SECURITY.md`)
4. **Set up staging environment**
5. **Configure custom domain**
6. **Enable analytics**
7. **Set up alerting**
8. **Create runbooks** (see `RUNBOOKS.md`)

---

## Support and Resources

**Vercel Documentation:**
- https://vercel.com/docs
- https://nextjs.org/docs/deployment

**Community:**
- Next.js Discord: https://nextjs.org/discord
- Vercel Support: https://vercel.com/support

**Internal:**
- DevOps Team: devops@yourcompany.com
- On-call: See PagerDuty rotation

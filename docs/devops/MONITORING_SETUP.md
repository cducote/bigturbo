# Monitoring and Observability Setup

## Overview

Comprehensive monitoring and observability setup for the BigTurbo Next.js application, covering error tracking, performance monitoring, uptime monitoring, analytics, and alerting.

**Monitoring Goals:**
- 99.9% uptime target
- < 2 second page load time
- < 500ms API response time
- Zero undetected critical errors
- Real-time performance insights

---

## Monitoring Stack

### Recommended Stack

1. **Error Tracking:** Sentry
2. **Application Performance:** Vercel Analytics + Sentry Performance
3. **Uptime Monitoring:** UptimeRobot or StatusCake
4. **Analytics:** Vercel Analytics + Google Analytics 4
5. **Log Aggregation:** Vercel Logs (production) + local logging (development)
6. **Alerting:** PagerDuty or Slack

### Alternative Stack

1. **Error Tracking:** Rollbar, Bugsnag
2. **APM:** New Relic, Datadog
3. **Uptime:** Pingdom, Better Uptime
4. **Analytics:** Plausible, Mixpanel
5. **Logs:** LogRocket, Papertrail

---

## Sentry Setup (Error Tracking)

### Installation

```bash
# Install Sentry SDK
npm install @sentry/nextjs
```

### Configuration

**Run Sentry wizard:**
```bash
npx @sentry/wizard@latest -i nextjs
```

This creates:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Updates `next.config.ts`

### Manual Configuration

**sentry.client.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Tracing
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Performance monitoring
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/yourapp\.com/,
      ],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Error filtering
  beforeSend(event, hint) {
    // Filter out errors from browser extensions
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message && error.message.includes('chrome-extension')) {
        return null;
      }
    }
    return event;
  },

  // Ignore certain errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'ChunkLoadError',
  ],
});
```

**sentry.server.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Server-specific configuration
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  beforeSend(event) {
    // Remove sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },
});
```

**sentry.edge.config.ts:**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

### Update next.config.ts

```typescript
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  // ... existing config
};

export default withSentryConfig(
  nextConfig,
  {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: true,
    widenClientFileUpload: true,
    tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    disableLogger: true,
  }
);
```

### Environment Variables

Add to `.env.local` and Vercel:
```bash
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=bigturbo
SENTRY_AUTH_TOKEN=your-auth-token
```

### Custom Error Boundary

**src/components/ErrorBoundary.tsx:**
```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="mt-2 text-gray-600">
        We've been notified and are working on it.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
      >
        Try again
      </button>
    </div>
  );
}
```

### Manual Error Reporting

```typescript
import * as Sentry from '@sentry/nextjs';

// Capture exception
try {
  // risky code
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: 'checkout',
      user_action: 'payment_submission',
    },
    level: 'error',
  });
}

// Capture message
Sentry.captureMessage('User completed onboarding', {
  level: 'info',
  tags: { feature: 'onboarding' },
});

// Set user context
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username,
});

// Add breadcrumb
Sentry.addBreadcrumb({
  category: 'ui.click',
  message: 'User clicked submit button',
  level: 'info',
});
```

### Testing Sentry

**src/app/api/sentry-test/route.ts:**
```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  throw new Error('Sentry test error - this is intentional');
  return NextResponse.json({ status: 'ok' });
}
```

Visit `/api/sentry-test` to test error reporting.

---

## Vercel Analytics

### Installation

```bash
npm install @vercel/analytics
```

### Setup

**src/app/layout.tsx:**
```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Features

**Automatic tracking:**
- Page views
- User sessions
- Geographic distribution
- Device/browser stats
- Custom events

**Custom events:**
```typescript
import { track } from '@vercel/analytics';

// Track custom event
track('signup', { plan: 'pro' });
track('purchase', { amount: 99.99, product: 'premium' });
```

### Dashboard Access

1. Go to Vercel Dashboard
2. Select project
3. Analytics tab
4. View real-time and historical data

---

## Google Analytics 4

### Setup

**Install package:**
```bash
npm install @next/third-parties
```

**src/app/layout.tsx:**
```typescript
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
      </body>
    </html>
  );
}
```

**Environment variable:**
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Custom Events

**utils/analytics.ts:**
```typescript
export const gtag = {
  event: (action: string, params?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', action, params);
    }
  },

  pageview: (url: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: url,
      });
    }
  },
};
```

**Usage:**
```typescript
import { gtag } from '@/utils/analytics';

// Track button click
gtag.event('click', {
  event_category: 'engagement',
  event_label: 'cta_button',
  value: 1,
});

// Track page view
gtag.pageview(window.location.pathname);
```

---

## Uptime Monitoring

### UptimeRobot Setup (Recommended - Free)

1. **Sign up:** https://uptimerobot.com
2. **Add monitor:**
   - Monitor Type: HTTP(s)
   - URL: https://yourdomain.com/api/health
   - Monitoring Interval: 5 minutes
   - Alert Contacts: Your email, Slack

3. **Create monitors for:**
   - Homepage: `https://yourdomain.com`
   - Health endpoint: `https://yourdomain.com/api/health`
   - About page: `https://yourdomain.com/about`

4. **Configure alerts:**
   - Email notifications
   - Slack integration
   - SMS (premium)

### StatusCake Alternative

1. **Sign up:** https://www.statuscake.com
2. **Add test:**
   - Test Type: Uptime
   - Website URL: https://yourdomain.com
   - Check Rate: 1 minute
   - Test Locations: Multiple regions

### Custom Health Check Enhancement

**src/app/api/health/route.ts:**
```typescript
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    server: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.1.0',
  };

  // Add future checks
  // database: await checkDatabase(),
  // externalApi: await checkExternalApis(),

  const allHealthy = Object.values(checks).every(
    (check) => check !== false && check !== null
  );

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
    },
    {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    }
  );
}
```

---

## Performance Monitoring

### Core Web Vitals Tracking

**src/app/layout.tsx:**
```typescript
'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(
          metric.name === 'CLS' ? metric.value * 1000 : metric.value
        ),
        event_label: metric.id,
        non_interaction: true,
      });
    }

    // Send to Sentry
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureMessage(`Web Vital: ${metric.name}`, {
        level: 'info',
        tags: {
          metric: metric.name,
          value: metric.value,
        },
      });
    });

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(metric);
    }
  });

  return null;
}
```

### Metrics Tracked

- **LCP (Largest Contentful Paint):** Target < 2.5s
- **FID (First Input Delay):** Target < 100ms
- **CLS (Cumulative Layout Shift):** Target < 0.1
- **FCP (First Contentful Paint):** Target < 1.8s
- **TTFB (Time to First Byte):** Target < 600ms

---

## Log Aggregation

### Vercel Logs (Built-in)

**Access logs:**
```bash
# Via CLI
vercel logs [deployment-url]

# Real-time logs
vercel logs --follow

# Filter by type
vercel logs --type=stderr
```

**Dashboard:**
- Settings > Logs
- Real-time streaming
- Filter by severity, timestamp, source

### Custom Logging Utility

**utils/logger.ts:**
```typescript
import * as Sentry from '@sentry/nextjs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    // Console logging
    if (process.env.NODE_ENV === 'development') {
      console[level === 'debug' ? 'log' : level](
        `[${timestamp}] [${level.toUpperCase()}] ${message}`,
        context
      );
    }

    // Production logging
    if (process.env.NODE_ENV === 'production') {
      // Send to external service (e.g., Datadog, LogRocket)
      // For now, only log errors/warnings
      if (level === 'error' || level === 'warn') {
        console[level](JSON.stringify(logData));

        if (level === 'error') {
          Sentry.captureMessage(message, {
            level: 'error',
            contexts: { custom: context },
          });
        }
      }
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    });
  }
}

export const logger = new Logger();
```

**Usage:**
```typescript
import { logger } from '@/utils/logger';

logger.info('User logged in', { userId: '123', method: 'oauth' });
logger.error('Payment failed', error, { userId: '123', amount: 99.99 });
```

---

## Alerting Configuration

### Slack Integration

**1. Create Slack App:**
- Go to https://api.slack.com/apps
- Create new app
- Add Incoming Webhooks
- Copy webhook URL

**2. Configure Sentry Alerts:**
- Sentry Dashboard > Settings > Integrations
- Add Slack integration
- Configure alert rules:
  - New issue created
  - Issue regression
  - High volume errors

**3. Configure UptimeRobot:**
- Add Slack webhook as alert contact
- Set notification preferences

### PagerDuty Integration (Production)

**1. Setup PagerDuty:**
- Create service in PagerDuty
- Generate integration key

**2. Add to Sentry:**
- Settings > Integrations > PagerDuty
- Add integration key
- Configure escalation rules

**3. Alert Rules:**
```yaml
# Example alert rule
name: Critical Error Alert
conditions:
  - event.level: error
  - event.tags.priority: critical
actions:
  - pagerduty: high_priority_service
  - slack: #incidents
frequency: immediate
```

### Email Alerts

Configure email alerts for:
- Deployment failures (GitHub Actions)
- Critical errors (Sentry)
- Downtime (UptimeRobot)
- Performance degradation (custom monitoring)

---

## Monitoring Dashboard Setup

### Creating Custom Dashboard

**Recommended Tools:**
- Grafana (self-hosted)
- Datadog (commercial)
- Vercel Dashboard (built-in)

### Key Metrics to Display

**System Health:**
- Uptime percentage (30-day rolling)
- Error rate
- Response times (p50, p95, p99)
- Deployment frequency
- MTTR (Mean Time to Recovery)

**User Metrics:**
- Active users
- Page views
- Session duration
- Bounce rate
- Conversion funnel

**Performance:**
- Core Web Vitals
- API response times
- Database query performance (future)
- Cache hit rates (future)

### Example Grafana Dashboard

```json
{
  "dashboard": {
    "title": "BigTurbo Monitoring",
    "panels": [
      {
        "title": "Error Rate",
        "type": "graph",
        "datasource": "Sentry",
        "targets": [
          {
            "query": "errors.rate(5m)"
          }
        ]
      },
      {
        "title": "Response Times",
        "type": "graph",
        "datasource": "Vercel",
        "targets": [
          {
            "metric": "http.request.duration",
            "aggregation": "percentile(95)"
          }
        ]
      }
    ]
  }
}
```

---

## Testing Monitoring Setup

### Error Tracking Test

```bash
# Visit test endpoint
curl https://yourdomain.com/api/sentry-test

# Check Sentry dashboard for error
```

### Performance Test

```bash
# Run Lighthouse audit
npm install -g @lhci/cli
lhci autorun --collect.url=https://yourdomain.com

# Check Web Vitals
# Open browser DevTools > Performance > Reload page
```

### Uptime Test

```bash
# Health check
curl https://yourdomain.com/api/health

# Expected response
{
  "status": "healthy",
  "checks": {
    "server": true,
    "timestamp": "2024-01-14T...",
    "uptime": 12345.67,
    "environment": "production",
    "version": "0.1.0"
  }
}
```

### Alert Test

1. **Sentry:** Trigger test error
2. **Slack:** Check for notification
3. **Email:** Verify alert received
4. **PagerDuty:** Acknowledge incident

---

## Monitoring Checklist

Pre-production:
- [ ] Sentry installed and configured
- [ ] Vercel Analytics enabled
- [ ] Google Analytics configured
- [ ] Uptime monitoring active
- [ ] Health check endpoint tested
- [ ] Error boundaries implemented
- [ ] Custom logging in place
- [ ] Alerts configured
- [ ] Slack integration tested
- [ ] Performance budgets set

Post-deployment:
- [ ] All monitors reporting
- [ ] Test errors appear in Sentry
- [ ] Analytics tracking page views
- [ ] Uptime monitors passing
- [ ] Alerts triggering correctly
- [ ] Dashboard accessible
- [ ] Team has access
- [ ] Documentation updated

---

## Monitoring Best Practices

1. **Set meaningful alerts** - Avoid alert fatigue
2. **Track trends** - Monitor week-over-week changes
3. **Regular reviews** - Weekly monitoring review meetings
4. **Incident retrospectives** - Learn from failures
5. **Performance budgets** - Set and enforce limits
6. **User-centric metrics** - Focus on user experience
7. **Proactive monitoring** - Don't wait for users to report issues
8. **Document everything** - Keep runbooks updated

---

## Cost Optimization

### Free Tier Limits

**Sentry:**
- 5,000 errors/month
- 10,000 performance units/month
- Upgrade: $26/month for 50k errors

**Vercel Analytics:**
- Included with all plans
- No additional cost

**UptimeRobot:**
- 50 monitors
- 5-minute intervals
- Upgrade: $7/month for 1-minute intervals

**Total free tier:** Adequate for small to medium applications

---

## Next Steps

1. Install Sentry and configure error tracking
2. Enable Vercel Analytics
3. Set up uptime monitoring
4. Configure alerts
5. Create monitoring dashboard
6. Test all integrations
7. Document monitoring runbook
8. Train team on monitoring tools

---

## Resources

- **Sentry Docs:** https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Vercel Analytics:** https://vercel.com/docs/analytics
- **UptimeRobot:** https://uptimerobot.com/docs/
- **Web Vitals:** https://web.dev/vitals/
- **Next.js Monitoring:** https://nextjs.org/docs/advanced-features/measuring-performance

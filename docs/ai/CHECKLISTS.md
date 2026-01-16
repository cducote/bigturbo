# Project Checklists

Stack-specific checklists for Clerk and Next.js to catch common issues.

---

## Clerk Checklist

### Authentication & Middleware

- [ ] **Middleware configured** — `middleware.ts` protects routes correctly
- [ ] **Public routes explicit** — Only intended routes are public
- [ ] **API routes protected** — All API routes check auth
- [ ] **Server components auth** — Use `auth()` from `@clerk/nextjs/server`

### Authorization

- [ ] **Org vs user scope** — Correctly using organization or user context
- [ ] **Role checks server-side** — Never trust client-side role claims alone
- [ ] **Permission checks** — Using Clerk's permission system correctly
- [ ] **JWT claims validated** — Custom claims validated on server

### Common Mistakes to Avoid

```typescript
// ❌ BAD: Trusting client-provided org ID
const orgId = request.body.orgId;

// ✅ GOOD: Get org from authenticated session
const { orgId } = auth();
```

```typescript
// ❌ BAD: Client-side only role check
if (user.publicMetadata.role === 'admin') { ... }

// ✅ GOOD: Server-side role verification
const { sessionClaims } = auth();
if (sessionClaims?.metadata?.role === 'admin') { ... }
```

### Clerk Security Checklist

- [ ] Session tokens validated server-side
- [ ] Webhook signatures verified (if using Clerk webhooks)
- [ ] User metadata not blindly trusted
- [ ] Organization membership verified before data access

---

## Next.js Checklist

### Server Actions vs Route Handlers

| Use Case | Recommendation |
|----------|---------------|
| Form submissions | Server Actions |
| Data mutations from UI | Server Actions |
| Third-party webhooks | Route Handlers |
| External API endpoints | Route Handlers |
| File uploads | Route Handlers |

### Caching & Revalidation

- [ ] **Cache strategy defined** — Know what's cached and for how long
- [ ] **Revalidation triggers** — `revalidatePath` / `revalidateTag` on mutations
- [ ] **Dynamic rendering** — Using `dynamic = 'force-dynamic'` when needed
- [ ] **Unstable cache** — Using `unstable_cache` for expensive operations

```typescript
// Revalidate after data mutation
'use server';

import { revalidatePath } from 'next/cache';

export async function updateProject(id: string, data: ProjectData) {
  await db.projects.update({ where: { id }, data });
  revalidatePath('/projects');
  revalidatePath(`/projects/${id}`);
}
```

### Error Handling

- [ ] **Error boundaries** — `error.tsx` at appropriate route levels
- [ ] **Not found handling** — `not-found.tsx` for 404 states
- [ ] **Loading states** — `loading.tsx` for Suspense boundaries
- [ ] **Server action errors** — Return structured errors, don't throw

```typescript
// ✅ GOOD: Structured error returns from server actions
'use server';

export async function createProject(data: FormData) {
  try {
    const project = await db.projects.create({ ... });
    return { success: true, data: project };
  } catch (error) {
    return { success: false, error: 'Failed to create project' };
  }
}
```

### Environment Variables

| Type | Prefix | Available In |
|------|--------|-------------|
| Server-only | (none) | Server Components, Route Handlers, Server Actions |
| Client-exposed | `NEXT_PUBLIC_` | Client Components, Browser |

- [ ] **Secrets server-only** — No `NEXT_PUBLIC_` for API keys/secrets
- [ ] **Build-time vs runtime** — Understanding when vars are embedded
- [ ] **Env validation** — Validate required vars at startup

### Logging & Observability

- [ ] **Structured logging** — JSON logs for production
- [ ] **No secrets in logs** — PII and secrets filtered
- [ ] **Error tracking** — Sentry or similar configured
- [ ] **Request tracing** — Correlation IDs for debugging

---

## Quick Reference Card

### Before Every PR

```markdown
## Clerk
- [ ] Auth checked server-side
- [ ] Org/user scope correct
- [ ] Middleware protecting routes

## Next.js
- [ ] Cache/revalidation strategy clear
- [ ] Error boundaries in place
- [ ] Env vars correctly scoped
```

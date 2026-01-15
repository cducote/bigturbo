import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/about(.*)',
  '/pricing(.*)',
  '/docs(.*)',
  '/blog(.*)',
  '/api/webhooks(.*)',
]);

// Define protected audit routes
const isAuditRoute = createRouteMatcher(['/audit(.*)']);

// Helper to check if route requires authentication
const requiresAuth = (req: NextRequest) => isAuditRoute(req) && !isPublicRoute(req);

export default clerkMiddleware(async (auth, req) => {
  // Protect all audit routes - requires authentication
  if (requiresAuth(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

/**
 * GET /api/audit/traces/stream
 *
 * Server-Sent Events endpoint for real-time trace updates.
 * Clients connect and receive trace updates as they occur.
 */

import { NextRequest } from 'next/server';
import { listTraces } from '@/lib/langfuse/client';

export const dynamic = 'force-dynamic';

// Store connected clients for broadcasting
const clients = new Set<ReadableStreamDefaultController>();

export async function GET(request: NextRequest): Promise<Response> {
  const encoder = new TextEncoder();
  let pollInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      clients.add(controller);

      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)
      );

      // Send current traces as initial data
      try {
        const { traces } = await listTraces({ limit: 10 });
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'initial', traces })}\n\n`)
        );
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Failed to fetch initial traces' })}\n\n`)
        );
      }

      // Set up polling for new traces (every 5 seconds)
      pollInterval = setInterval(async () => {
        try {
          const { traces } = await listTraces({ limit: 5 });
          const runningTraces = traces.filter((t) => t.status === 'running');

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'update',
              runningCount: runningTraces.length,
              latestTraces: traces.slice(0, 3),
              timestamp: new Date().toISOString()
            })}\n\n`)
          );
        } catch {
          // Silently handle polling errors
        }
      }, 5000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        if (pollInterval) clearInterval(pollInterval);
        clients.delete(controller);
      });
    },

    cancel() {
      if (pollInterval) clearInterval(pollInterval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

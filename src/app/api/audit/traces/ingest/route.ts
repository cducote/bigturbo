/**
 * POST /api/audit/traces/ingest
 *
 * Webhook endpoint for ingesting trace and span events.
 * Supports both single events and batch ingestion.
 *
 * Headers:
 *   - X-Webhook-Secret: Webhook authentication secret (required)
 *   - Content-Type: application/json
 *
 * Request Body (single event):
 *   {
 *     "type": "trace.create" | "trace.update" | "span.create" | "span.update",
 *     "payload": { ... }
 *   }
 *
 * Request Body (batch):
 *   {
 *     "batchId": "optional-batch-id",
 *     "events": [
 *       { "type": "trace.create", "payload": { ... } },
 *       { "type": "span.create", "payload": { ... } },
 *       ...
 *     ]
 *   }
 *
 * Response (single): { success: boolean, traceId?: string, spanId?: string, errors?: string[] }
 * Response (batch): { success: boolean, batchId: string, processed: number, failed: number, errors?: [...] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { processEvent, processBatch } from '@/lib/langfuse';
import type {
  IngestEvent,
  BatchIngestPayload,
  IngestResponse,
  BatchIngestResponse,
} from '@/lib/langfuse';

export const dynamic = 'force-dynamic';

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

const WEBHOOK_SECRET = process.env.TRACE_WEBHOOK_SECRET;

/**
 * Verify the webhook secret from request headers.
 */
function verifyWebhookSecret(request: NextRequest): boolean {
  // In development, allow requests without secret if not configured
  if (!WEBHOOK_SECRET && process.env.NODE_ENV === 'development') {
    return true;
  }

  const providedSecret = request.headers.get('X-Webhook-Secret');
  return providedSecret === WEBHOOK_SECRET;
}

/**
 * Check if the payload is a batch request.
 */
function isBatchPayload(body: unknown): body is BatchIngestPayload {
  return (
    typeof body === 'object' &&
    body !== null &&
    'events' in body &&
    Array.isArray((body as BatchIngestPayload).events)
  );
}

/**
 * Check if the payload is a single event.
 */
function isSingleEvent(body: unknown): body is IngestEvent {
  return (
    typeof body === 'object' &&
    body !== null &&
    'type' in body &&
    'payload' in body &&
    typeof (body as IngestEvent).type === 'string'
  );
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<IngestResponse | BatchIngestResponse | ErrorResponse>> {
  try {
    // Verify webhook secret
    if (!verifyWebhookSecret(request)) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Invalid or missing webhook secret',
          statusCode: 401,
        },
        { status: 401 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid JSON body',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // Process batch request
    if (isBatchPayload(body)) {
      const result = await processBatch(body);
      return NextResponse.json(result, {
        status: result.success ? 200 : 207, // 207 Multi-Status for partial failures
      });
    }

    // Process single event
    if (isSingleEvent(body)) {
      const result = await processEvent(body);
      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
      });
    }

    // Invalid payload format
    return NextResponse.json(
      {
        error: 'Bad Request',
        message: 'Invalid payload format. Expected single event or batch payload.',
        statusCode: 400,
      },
      { status: 400 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: errorMessage,
      statusCode: 500,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET /api/audit/traces/ingest
 *
 * Health check endpoint for the webhook.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/audit/traces/ingest',
    methods: ['POST'],
    authentication: WEBHOOK_SECRET ? 'X-Webhook-Secret header required' : 'disabled (dev mode)',
  });
}

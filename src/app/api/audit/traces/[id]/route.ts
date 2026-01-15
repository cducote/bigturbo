/**
 * GET /api/audit/traces/[id]
 *
 * Retrieves a single trace by ID with all spans and decisions.
 *
 * Path Parameters:
 *   - id: Trace ID (either trace_id or database UUID)
 *
 * Response: { trace: LangfuseTrace }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTraceById } from '@/lib/langfuse';
import type { TraceDetailResponse } from '@/lib/langfuse';

export const dynamic = 'force-dynamic';

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<TraceDetailResponse | ErrorResponse>> {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Trace ID is required',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    const trace = await getTraceById(id);

    if (!trace) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: `Trace not found: ${id}`,
          statusCode: 404,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { trace },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
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

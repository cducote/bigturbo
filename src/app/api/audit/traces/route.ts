/**
 * GET /api/audit/traces
 *
 * Lists all traces with filtering, search, and pagination.
 *
 * Query Parameters:
 *   - agentName: Filter by agent name (optional)
 *   - workflowName: Filter by workflow name (optional)
 *   - commandName: Filter by command name (optional)
 *   - status: Filter by status (optional, comma-separated for multiple)
 *   - startDate: Filter by start date (ISO 8601) (optional)
 *   - endDate: Filter by end date (ISO 8601) (optional)
 *   - search: Search in trace names (optional)
 *   - limit: Maximum number of results (optional, default: 50, max: 100)
 *   - offset: Pagination offset (optional, default: 0)
 *   - sortBy: Sort field (optional, default: startedAt)
 *   - sortOrder: Sort direction (optional, default: desc)
 *
 * Response: { traces: LangfuseTrace[], count: number, hasMore: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { listTraces } from '@/lib/langfuse';
import type { TraceFilters, TraceStatus, TracesListResponse } from '@/lib/langfuse';

export const dynamic = 'force-dynamic';

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<TracesListResponse | ErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const filters: TraceFilters = {};

    const agentName = searchParams.get('agentName');
    if (agentName) filters.agentName = agentName;

    const workflowName = searchParams.get('workflowName');
    if (workflowName) filters.workflowName = workflowName;

    const commandName = searchParams.get('commandName');
    if (commandName) filters.commandName = commandName;

    const status = searchParams.get('status');
    if (status) {
      const statuses = status.split(',') as TraceStatus[];
      filters.status = statuses.length === 1 ? statuses[0] : statuses;
    }

    const startDate = searchParams.get('startDate');
    if (startDate) filters.startDate = startDate;

    const endDate = searchParams.get('endDate');
    if (endDate) filters.endDate = endDate;

    const search = searchParams.get('search');
    if (search) filters.search = search;

    const limit = searchParams.get('limit');
    filters.limit = Math.min(parseInt(limit || '50', 10), 100);

    const offset = searchParams.get('offset');
    filters.offset = parseInt(offset || '0', 10);

    const sortBy = searchParams.get('sortBy') as TraceFilters['sortBy'];
    if (sortBy && ['startedAt', 'durationMs', 'totalTokens', 'name'].includes(sortBy)) {
      filters.sortBy = sortBy;
    }

    const sortOrder = searchParams.get('sortOrder') as TraceFilters['sortOrder'];
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      filters.sortOrder = sortOrder;
    }

    // Fetch traces
    const result = await listTraces(filters);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
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

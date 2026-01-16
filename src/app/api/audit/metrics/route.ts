/**
 * GET /api/audit/metrics
 *
 * Returns dashboard metrics and analytics data.
 */

import { NextResponse } from 'next/server';
import { getDashboardMetrics, getTracesOverTime } from '@/lib/audit/metrics';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const [metrics, timeSeriesData] = await Promise.all([
      getDashboardMetrics(),
      getTracesOverTime(7),
    ]);

    return NextResponse.json({
      ...metrics,
      timeSeries: timeSeriesData,
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      error: 'Internal Server Error',
      message: errorMessage,
      statusCode: 500,
    }, { status: 500 });
  }
}

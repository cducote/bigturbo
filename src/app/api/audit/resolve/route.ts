import { NextRequest, NextResponse } from 'next/server';
import { resolveTraceId, buildAndPersistSummary } from '@/lib/audit/summaries';

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: 'Bad Request', message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selector = searchParams.get('q');

    if (!selector) {
      return badRequest('Missing q param (trace id, last, or sample:N)');
    }

    const traceId = await resolveTraceId(selector);
    if (!traceId) {
      return NextResponse.json({ error: 'Trace not found', selector }, { status: 404 });
    }

    const { summary, summaryPath } = await buildAndPersistSummary(traceId);

    return NextResponse.json({ traceId, summaryPath, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

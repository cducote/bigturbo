import { NextRequest, NextResponse } from 'next/server';
import { getTraceById, listTraces } from '@/lib/langfuse';
import type { TraceFilters } from '@/lib/langfuse';
import { normalizeTrace, writeSummary } from '@/lib/audit/traceSummary';

export const dynamic = 'force-dynamic';

async function pickTraceId(idParam: string): Promise<string | null> {
  if (idParam === 'last') {
    const { traces } = await listTraces({ limit: 1 } satisfies TraceFilters);
    return traces[0]?.id || null;
  }

  if (idParam.startsWith('sample:')) {
    const n = Number(idParam.split(':')[1] || '1');
    const sampleSize = Number.isFinite(n) && n > 0 ? Math.min(n, 20) : 1;
    const { traces } = await listTraces({ limit: sampleSize } satisfies TraceFilters);
    return traces[0]?.id || null;
  }

  return idParam;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const traceId = await pickTraceId(id);

    if (!traceId) {
      return NextResponse.json({ error: 'Trace not found' }, { status: 404 });
    }

    const trace = await getTraceById(traceId);
    if (!trace) {
      return NextResponse.json({ error: 'Trace not found' }, { status: 404 });
    }

    const summary = normalizeTrace(trace);
    const filePath = await writeSummary(summary);

    return NextResponse.json({ summary, persisted: filePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

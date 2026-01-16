import { NextRequest, NextResponse } from 'next/server';
import { resolveTraceId, buildAndPersistSummary } from '@/lib/audit/summaries';

export const dynamic = 'force-dynamic';

function badRequest(message: string) {
  return NextResponse.json({ error: 'Bad Request', message }, { status: 400 });
}

function parseCommand(input: string): { selector: string } | null {
  const trimmed = (input || '').trim();
  if (!trimmed.startsWith('/audit')) return null;
  const parts = trimmed.split(/\s+/);
  // /audit <trace_id|last|sample:N>
  const selector = parts[1] || 'last';
  return { selector };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const command = typeof body.command === 'string' ? body.command : request.nextUrl.searchParams.get('command') || '';

    const parsed = parseCommand(command);
    if (!parsed) {
      return badRequest('Expected command starting with /audit');
    }

    const traceId = await resolveTraceId(parsed.selector);
    if (!traceId) {
      return NextResponse.json({ error: 'Trace not found', selector: parsed.selector }, { status: 404 });
    }

    const { summary, summaryPath } = await buildAndPersistSummary(traceId);

    return NextResponse.json({
      traceId,
      selector: parsed.selector,
      summaryPath,
      summary,
      next: {
        promptEngineer: 'Run prompt-engineer on the summary JSON and produce diagnosis.issues[].',
        refactoringSpecialist: 'Run refactoring-specialist on the diagnosis and emit files_to_change/new_constraints.',
        plan: 'POST /api/audit/plan with { summary, diagnosis, translation } to write docs/audit/IMPLEMENTATION_PLAN.md',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

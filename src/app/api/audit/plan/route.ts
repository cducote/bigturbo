import { NextRequest, NextResponse } from 'next/server';
import { IMPLEMENTATION_PLAN_MD_PATH, synthesizeImplementationPlan, writeImplementationPlan } from '@/lib/audit/planSynthesizer';
import type { TraceAuditSummary } from '@/lib/audit/traceSummary';

interface PromptIssue {
  symptom?: string;
  root_cause?: string;
  recommendation?: string;
}

interface PromptDiagnosis {
  issues: PromptIssue[];
}

interface RefactorTranslation {
  files_to_change: string[];
  new_constraints: string[];
}

function badRequest(message: string) {
  return NextResponse.json({ error: 'Bad Request', message }, { status: 400 });
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { summary, diagnosis, translation, generatedAt } = body as {
      summary: TraceAuditSummary;
      diagnosis: PromptDiagnosis;
      translation: RefactorTranslation;
      generatedAt?: string;
    };

    if (!summary || !summary.trace_id) {
      return badRequest('summary.trace_id is required');
    }

    const markdown = synthesizeImplementationPlan({
      traceSummary: {
        trace_id: summary.trace_id,
        goal: summary.goal,
        date: (summary as { startedAt?: string }).startedAt || generatedAt,
      },
      diagnosis: diagnosis || { issues: [] },
      translation: translation || { files_to_change: [], new_constraints: [] },
      generatedAt,
    });

    const persistedPath = await writeImplementationPlan(markdown);

    return NextResponse.json({ planPath: IMPLEMENTATION_PLAN_MD_PATH, persistedPath, markdown });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { listTraces, getTraceById } from '@/lib/langfuse';
import type { TraceFilters, LangfuseTrace } from '@/lib/langfuse';
import { normalizeTrace, writeSummary, type TraceAuditSummary } from './traceSummary';

function parseSample(selector: string): number | null {
  const match = selector.match(/^sample:(\d+)$/i);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(n, 20);
}

async function pickLatestTraceId(limit = 1): Promise<string | null> {
  const { traces } = await listTraces({ limit } satisfies TraceFilters);
  return traces[0]?.id || null;
}

async function pickSampleTraceId(sampleSize: number): Promise<string | null> {
  const { traces } = await listTraces({ limit: sampleSize } satisfies TraceFilters);
  if (!traces.length) return null;
  const idx = traces.length === 1 ? 0 : Math.floor(Math.random() * traces.length);
  return traces[idx]?.id || null;
}

export async function resolveTraceId(selector: string): Promise<string | null> {
  if (!selector) return null;

  const sampleSize = parseSample(selector);
  if (sampleSize) {
    return pickSampleTraceId(sampleSize);
  }

  if (selector === 'last') {
    return pickLatestTraceId(1);
  }

  return selector;
}

export async function buildAndPersistSummary(traceId: string): Promise<{ summary: TraceAuditSummary; summaryPath: string }> {
  const trace = await getTraceById(traceId);
  if (!trace) {
    throw new Error(`Trace not found: ${traceId}`);
  }

  const summary = normalizeTrace(trace as LangfuseTrace);
  const summaryPath = await writeSummary(summary);
  return { summary, summaryPath };
}

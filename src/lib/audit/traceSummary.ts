import fs from 'fs/promises';
import path from 'path';
import type { LangfuseSpan, LangfuseTrace } from '@/lib/langfuse';

export interface TraceAuditSummary {
  trace_id: string;
  goal: string;
  duration_ms: number | null;
  tasks: number;
  subagents: string[];
  tool_usage: Record<string, number>;
  notable_patterns: string[];
  outcome: 'success' | 'partial_success' | 'failed' | 'unknown';
}

function collectToolUsage(spans: LangfuseSpan[]): Record<string, number> {
  const counts: Record<string, number> = {
    read: 0,
    grep: 0,
    write: 0,
    edit: 0,
    search: 0,
    command: 0,
    subagent: 0,
  };

  spans.forEach(span => {
    switch (span.operationType) {
      case 'file_read':
        counts.read += 1;
        break;
      case 'file_write':
        counts.write += 1;
        break;
      case 'file_edit':
        counts.edit += 1;
        break;
      case 'search':
        counts.grep += 1;
        counts.search += 1;
        break;
      case 'command_execution':
        counts.command += 1;
        break;
      case 'subagent_launch':
      case 'subagent_completion':
        counts.subagent += 1;
        break;
      default:
        break;
    }
  });

  return counts;
}

function collectSubagents(spans: LangfuseSpan[]): string[] {
  const names = new Set<string>();
  spans.forEach(span => {
    if (span.operationType === 'subagent_launch' || span.operationType === 'subagent_completion') {
      if (span.metadata && typeof span.metadata.subagentType === 'string') {
        names.add(span.metadata.subagentType);
      } else if (span.agentName && span.agentName !== 'command') {
        names.add(span.agentName);
      }
    }
  });
  return Array.from(names);
}

function detectPatterns(spans: LangfuseSpan[], toolUsage: Record<string, number>): string[] {
  const patterns: string[] = [];

  if (toolUsage.read >= 20) patterns.push('repeated_file_reads');
  if (toolUsage.search >= 20 || toolUsage.grep >= 20) patterns.push('tool_thrash');
  if (spans.length >= 30) patterns.push('late_planning');

  return patterns;
}

function deriveOutcome(trace: LangfuseTrace): TraceAuditSummary['outcome'] {
  if (trace.status === 'completed') return 'success';
  if (trace.status === 'failed') return 'failed';
  if (trace.output) return 'partial_success';
  return 'unknown';
}

export function normalizeTrace(trace: LangfuseTrace): TraceAuditSummary {
  const toolUsage = collectToolUsage(trace.spans || []);
  const patterns = detectPatterns(trace.spans || [], toolUsage);
  const subagents = collectSubagents(trace.spans || []);

  return {
    trace_id: trace.id,
    goal: typeof trace.input?.prompt === 'string' ? (trace.input.prompt as string) : trace.name,
    duration_ms: trace.durationMs || null,
    tasks: trace.spans?.length || 0,
    subagents,
    tool_usage: toolUsage,
    notable_patterns: patterns,
    outcome: deriveOutcome(trace),
  };
}

export async function writeSummary(summary: TraceAuditSummary): Promise<string> {
  const summariesDir = path.join(process.cwd(), 'docs', 'audit', 'summaries');
  await fs.mkdir(summariesDir, { recursive: true });
  const filePath = path.join(summariesDir, `${summary.trace_id}.json`);
  await fs.writeFile(filePath, JSON.stringify(summary, null, 2), 'utf-8');
  return filePath;
}

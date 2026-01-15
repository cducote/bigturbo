/**
 * Audit Data Exporter for BigTurbo Agent Audit System
 *
 * Supports export in TOON (Token-Oriented Object Notation), JSON, and CSV formats.
 * TOON format is optimized for LLM consumption with 30-60% fewer tokens than JSON.
 */

import { listTraces, getTraceById } from '@/lib/langfuse';
import type { LangfuseTrace, LangfuseSpan, Decision, TraceFilters } from '@/lib/langfuse';

// ============================================================================
// Types
// ============================================================================

export type ExportFormat = 'toon' | 'json' | 'csv';
export type ExportType = 'traces' | 'decisions' | 'full_audit';

export interface ExportConfig {
  format: ExportFormat;
  type: ExportType;
  dateRange: '24h' | '7d' | '30d' | 'all' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  agentFilter?: string;
  statusFilter?: string[];
  includeSpans: boolean;
  includeDecisions: boolean;
}

export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  content: string;
  filename: string;
  recordCount: number;
  byteSize: number;
  mimeType: string;
}

// ============================================================================
// TOON Encoding
// ============================================================================

/**
 * TOON (Token-Oriented Object Notation) Encoder
 *
 * TOON uses a compact format optimized for LLM token efficiency:
 * - Single-letter type prefixes: t=trace, s=span, d=decision
 * - Pipe-separated fields within records
 * - Newline-separated records
 * - Abbreviated field names
 * - Omits null/undefined values
 */

const TOON_HEADER = `#TOON v1.0
#BigTurbo Agent Audit Export
#Format: type|id|name|status|agent|duration_ms|tokens|cost|timestamp
`;

function encodeToonTrace(trace: LangfuseTrace): string {
  const lines: string[] = [];

  // Trace line: t|id|name|status|agent|duration|tokens|cost|started
  lines.push(
    `t|${trace.traceId}|${escapeToon(trace.name)}|${trace.status}|${trace.agentName || '-'}|${trace.durationMs || 0}|${trace.totalTokens || 0}|${trace.totalCost?.toFixed(6) || '0'}|${trace.startedAt}`
  );

  // Input/output as compressed JSON on separate lines
  if (trace.input && Object.keys(trace.input).length > 0) {
    lines.push(`ti|${compressJson(trace.input)}`);
  }
  if (trace.output && Object.keys(trace.output).length > 0) {
    lines.push(`to|${compressJson(trace.output)}`);
  }
  if (trace.error) {
    lines.push(`te|${escapeToon(trace.error)}`);
  }

  return lines.join('\n');
}

function encodeToonSpan(span: LangfuseSpan, traceId: string): string {
  const lines: string[] = [];

  // Span line: s|span_id|trace_id|op_type|name|status|agent|duration|started
  lines.push(
    `s|${span.spanId}|${traceId}|${span.operationType}|${escapeToon(span.name || '-')}|${span.status}|${span.agentName || '-'}|${span.durationMs || 0}|${span.startedAt}`
  );

  // Reasoning
  if (span.reasoning) {
    lines.push(`sr|${escapeToon(span.reasoning)}`);
  }

  // Tool calls: st|tool_name|success|duration
  if (span.toolCalls && span.toolCalls.length > 0) {
    for (const call of span.toolCalls) {
      lines.push(`st|${call.name}|${call.success ? 1 : 0}|${call.durationMs || 0}`);
    }
  }

  return lines.join('\n');
}

function encodeToonDecision(decision: Decision, spanId: string): string {
  // Decision line: d|span_id|question|answer|confidence|tool_used
  return `d|${spanId}|${escapeToon(decision.question)}|${escapeToon(decision.answer)}|${decision.confidence?.toFixed(2) || '-'}|${decision.toolUsed || '-'}`;
}

function escapeToon(str: string): string {
  // Escape pipes and newlines
  return str.replace(/\|/g, '\\|').replace(/\n/g, '\\n').replace(/\r/g, '');
}

function compressJson(obj: Record<string, unknown>): string {
  // Compact JSON with no whitespace
  return JSON.stringify(obj).replace(/\|/g, '\\|');
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export traces in the specified format.
 */
export async function exportData(config: ExportConfig): Promise<ExportResult> {
  // Build filters from config
  const filters: TraceFilters = {
    limit: 1000, // Max export size
  };

  if (config.agentFilter) {
    filters.agentName = config.agentFilter;
  }

  if (config.statusFilter && config.statusFilter.length > 0) {
    filters.status = config.statusFilter as TraceFilters['status'];
  }

  // Calculate date range
  const now = new Date();
  switch (config.dateRange) {
    case '24h':
      filters.startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      break;
    case '7d':
      filters.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case '30d':
      filters.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'custom':
      if (config.customStartDate) filters.startDate = config.customStartDate;
      if (config.customEndDate) filters.endDate = config.customEndDate;
      break;
    // 'all' - no date filter
  }

  // Fetch traces
  const result = await listTraces(filters);
  const traces = result.traces;

  // Fetch full trace data with spans if needed
  const fullTraces: LangfuseTrace[] = [];
  if (config.includeSpans || config.includeDecisions) {
    for (const trace of traces) {
      const fullTrace = await getTraceById(trace.traceId);
      if (fullTrace) {
        fullTraces.push(fullTrace);
      }
    }
  } else {
    fullTraces.push(...traces);
  }

  // Export based on format
  switch (config.format) {
    case 'toon':
      return exportToToon(fullTraces, config);
    case 'json':
      return exportToJson(fullTraces, config);
    case 'csv':
      return exportToCsv(fullTraces, config);
    default:
      throw new Error(`Unsupported format: ${config.format}`);
  }
}

/**
 * Export to TOON format.
 */
function exportToToon(traces: LangfuseTrace[], config: ExportConfig): ExportResult {
  const lines: string[] = [TOON_HEADER];
  let recordCount = 0;

  for (const trace of traces) {
    lines.push(encodeToonTrace(trace));
    recordCount++;

    if (config.includeSpans && trace.spans) {
      for (const span of trace.spans) {
        lines.push(encodeToonSpan(span, trace.traceId));
        recordCount++;

        if (config.includeDecisions && span.decisions) {
          for (const decision of span.decisions) {
            lines.push(encodeToonDecision(decision, span.spanId));
            recordCount++;
          }
        }
      }
    }

    lines.push(''); // Empty line between traces
  }

  const content = lines.join('\n');
  const timestamp = new Date().toISOString().slice(0, 10);

  return {
    success: true,
    format: 'toon',
    content,
    filename: `bigturbo-audit-${timestamp}.toon`,
    recordCount,
    byteSize: new TextEncoder().encode(content).length,
    mimeType: 'text/plain',
  };
}

/**
 * Export to JSON format.
 */
function exportToJson(traces: LangfuseTrace[], config: ExportConfig): ExportResult {
  const exportData = {
    meta: {
      exportedAt: new Date().toISOString(),
      format: 'json',
      version: '1.0',
      config: {
        type: config.type,
        dateRange: config.dateRange,
        includeSpans: config.includeSpans,
        includeDecisions: config.includeDecisions,
      },
    },
    traces: traces.map((trace) => ({
      ...trace,
      spans: config.includeSpans
        ? trace.spans?.map((span) => ({
            ...span,
            decisions: config.includeDecisions ? span.decisions : undefined,
          }))
        : undefined,
    })),
  };

  const content = JSON.stringify(exportData, null, 2);
  const timestamp = new Date().toISOString().slice(0, 10);

  return {
    success: true,
    format: 'json',
    content,
    filename: `bigturbo-audit-${timestamp}.json`,
    recordCount: traces.length,
    byteSize: new TextEncoder().encode(content).length,
    mimeType: 'application/json',
  };
}

/**
 * Export to CSV format.
 */
function exportToCsv(traces: LangfuseTrace[], config: ExportConfig): ExportResult {
  const rows: string[][] = [];

  // Header row
  const headers = [
    'trace_id',
    'name',
    'status',
    'agent',
    'workflow',
    'command',
    'duration_ms',
    'tokens',
    'cost',
    'started_at',
    'completed_at',
  ];

  if (config.includeSpans) {
    headers.push('span_count');
  }

  rows.push(headers);

  // Data rows
  for (const trace of traces) {
    const row = [
      trace.traceId,
      escapeCsv(trace.name),
      trace.status,
      trace.agentName || '',
      trace.workflowName || '',
      trace.commandName || '',
      String(trace.durationMs || ''),
      String(trace.totalTokens || ''),
      String(trace.totalCost || ''),
      trace.startedAt,
      trace.completedAt || '',
    ];

    if (config.includeSpans) {
      row.push(String(trace.spans?.length || 0));
    }

    rows.push(row);
  }

  const content = rows.map((row) => row.join(',')).join('\n');
  const timestamp = new Date().toISOString().slice(0, 10);

  return {
    success: true,
    format: 'csv',
    content,
    filename: `bigturbo-audit-${timestamp}.csv`,
    recordCount: traces.length,
    byteSize: new TextEncoder().encode(content).length,
    mimeType: 'text/csv',
  };
}

function escapeCsv(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ============================================================================
// Decision Export (for type='decisions')
// ============================================================================

export interface DecisionExportRow {
  traceId: string;
  traceName: string;
  spanId: string;
  spanName: string;
  agentName: string;
  question: string;
  answer: string;
  reasoning: string;
  confidence: number | null;
  toolUsed: string;
  timestamp: string;
}

/**
 * Export only decisions for analysis.
 */
export async function exportDecisions(config: ExportConfig): Promise<ExportResult> {
  // Build filters
  const filters: TraceFilters = { limit: 500 };

  if (config.agentFilter) {
    filters.agentName = config.agentFilter;
  }

  // Fetch traces with spans
  const result = await listTraces(filters);
  const decisions: DecisionExportRow[] = [];

  for (const trace of result.traces) {
    const fullTrace = await getTraceById(trace.traceId);
    if (!fullTrace?.spans) continue;

    for (const span of fullTrace.spans) {
      if (!span.decisions) continue;

      for (const decision of span.decisions) {
        decisions.push({
          traceId: fullTrace.traceId,
          traceName: fullTrace.name,
          spanId: span.spanId,
          spanName: span.name || span.operationType,
          agentName: span.agentName || fullTrace.agentName,
          question: decision.question,
          answer: decision.answer,
          reasoning: decision.reasoning || '',
          confidence: decision.confidence ?? null,
          toolUsed: decision.toolUsed || '',
          timestamp: span.startedAt,
        });
      }
    }
  }

  // Format based on config
  if (config.format === 'csv') {
    const headers = Object.keys(decisions[0] || {});
    const rows = [headers.join(',')];
    for (const d of decisions) {
      rows.push(
        headers.map((h) => escapeCsv(String(d[h as keyof DecisionExportRow] || ''))).join(',')
      );
    }
    const content = rows.join('\n');
    const timestamp = new Date().toISOString().slice(0, 10);

    return {
      success: true,
      format: 'csv',
      content,
      filename: `bigturbo-decisions-${timestamp}.csv`,
      recordCount: decisions.length,
      byteSize: new TextEncoder().encode(content).length,
      mimeType: 'text/csv',
    };
  }

  // Default to JSON for decisions
  const content = JSON.stringify({ decisions }, null, 2);
  const timestamp = new Date().toISOString().slice(0, 10);

  return {
    success: true,
    format: config.format,
    content,
    filename: `bigturbo-decisions-${timestamp}.${config.format}`,
    recordCount: decisions.length,
    byteSize: new TextEncoder().encode(content).length,
    mimeType: config.format === 'json' ? 'application/json' : 'text/plain',
  };
}

/**
 * Langfuse Client for BigTurbo Agent Audit System
 *
 * Uses the official Langfuse SDK for trace ingestion and retrieval.
 * Connects to self-hosted Langfuse instance.
 */

import Langfuse from 'langfuse';

// ============================================================================
// Configuration
// ============================================================================

const LANGFUSE_HOST = process.env.LANGFUSE_HOST || 'http://localhost:3001';
const LANGFUSE_PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY;
const LANGFUSE_SECRET_KEY = process.env.LANGFUSE_SECRET_KEY;

/**
 * Check if Langfuse is configured and available.
 */
export function isLangfuseConfigured(): boolean {
  return !!(LANGFUSE_HOST && LANGFUSE_PUBLIC_KEY && LANGFUSE_SECRET_KEY);
}

/**
 * Get a configured Langfuse client instance.
 */
export function getLangfuseClient(): Langfuse {
  if (!isLangfuseConfigured()) {
    throw new Error('Langfuse is not configured. Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY.');
  }

  return new Langfuse({
    publicKey: LANGFUSE_PUBLIC_KEY!,
    secretKey: LANGFUSE_SECRET_KEY!,
    baseUrl: LANGFUSE_HOST,
  });
}

// Singleton client instance
let langfuseClient: Langfuse | null = null;

export function getClient(): Langfuse {
  if (!langfuseClient) {
    langfuseClient = getLangfuseClient();
  }
  return langfuseClient;
}

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique trace/span ID.
 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a trace ID with prefix.
 */
export function generateTraceId(): string {
  return `tr-${generateId()}`;
}

/**
 * Generate a span ID with prefix.
 */
export function generateSpanId(): string {
  return `sp-${generateId()}`;
}

// ============================================================================
// Re-export Types
// ============================================================================

export type {
  LangfuseTrace,
  LangfuseSpan,
  TraceFilters,
  TracesListResponse,
  TraceStatus,
  SpanStatus,
} from './types';

// ============================================================================
// Trace Operations (using Langfuse SDK)
// ============================================================================

import type {
  LangfuseTrace,
  LangfuseSpan,
  TraceFilters,
  TracesListResponse,
  CreateTracePayload,
  UpdateTracePayload,
  CreateSpanPayload,
  UpdateSpanPayload,
  TraceStatus,
} from './types';

/**
 * Create a new trace using Langfuse SDK.
 */
export async function createTrace(payload: CreateTracePayload): Promise<LangfuseTrace> {
  const client = getClient();
  const traceId = payload.traceId || generateTraceId();

  client.trace({
    id: traceId,
    name: payload.name,
    userId: payload.agentName,
    metadata: {
      agentName: payload.agentName,
      workflowName: payload.workflowName,
      commandName: payload.commandName,
      ...payload.metadata,
    },
    input: payload.input,
    tags: payload.metadata?.tags as string[] || [],
  });

  // Flush to ensure trace is sent
  await client.flushAsync();

  return {
    id: traceId,
    traceId,
    name: payload.name,
    agentName: payload.agentName,
    workflowName: payload.workflowName,
    commandName: payload.commandName,
    status: 'running',
    input: payload.input,
    metadata: payload.metadata || {},
    startedAt: new Date().toISOString(),
    spans: [],
  };
}

/**
 * Update an existing trace.
 */
export async function updateTrace(payload: UpdateTracePayload): Promise<LangfuseTrace | null> {
  const client = getClient();

  client.trace({
    id: payload.traceId,
    output: payload.output,
    metadata: {
      status: payload.status,
      error: payload.error,
      durationMs: payload.durationMs,
      totalTokens: payload.totalTokens,
      totalCost: payload.totalCost,
      ...payload.metadata,
    },
  });

  await client.flushAsync();

  return {
    id: payload.traceId,
    traceId: payload.traceId,
    name: '',
    agentName: '',
    status: payload.status || 'running',
    input: {},
    output: payload.output,
    error: payload.error,
    durationMs: payload.durationMs,
    totalTokens: payload.totalTokens,
    totalCost: payload.totalCost,
    metadata: payload.metadata || {},
    startedAt: new Date().toISOString(),
    spans: [],
  };
}

/**
 * Get a single trace by trace_id.
 * Fetches both the trace and its observations (spans) via separate API calls.
 */
export async function getTraceById(traceId: string): Promise<LangfuseTrace | null> {
  try {
    const authHeader = `Basic ${Buffer.from(`${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}`).toString('base64')}`;

    // Fetch trace and observations in parallel
    const [traceResponse, observationsResponse] = await Promise.all([
      fetch(`${LANGFUSE_HOST}/api/public/traces/${traceId}`, {
        headers: { Authorization: authHeader },
      }),
      fetch(`${LANGFUSE_HOST}/api/public/observations?traceId=${traceId}`, {
        headers: { Authorization: authHeader },
      }),
    ]);

    if (!traceResponse.ok) {
      if (traceResponse.status === 404) return null;
      throw new Error(`Failed to fetch trace: ${traceResponse.statusText}`);
    }

    const traceData = await traceResponse.json();

    // Parse observations if available
    let observations: Record<string, unknown>[] = [];
    if (observationsResponse.ok) {
      const obsData = await observationsResponse.json();
      observations = obsData.data || [];
    }

    // Merge observations into trace data
    const mergedData = {
      ...traceData,
      observations,
    };

    return mapLangfuseTrace(mergedData);
  } catch (error) {
    console.error('Error fetching trace:', error);
    return null;
  }
}

/**
 * Get a single trace by database ID.
 */
export async function getTraceByDbId(id: string): Promise<LangfuseTrace | null> {
  return getTraceById(id);
}

/**
 * List traces with filters.
 */
export async function listTraces(filters: TraceFilters = {}): Promise<TracesListResponse> {
  try {
    const params = new URLSearchParams();
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.offset) params.set('page', String(Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1));
    if (filters.agentName) params.set('userId', filters.agentName);
    if (filters.search) params.set('name', filters.search);
    if (filters.tags && filters.tags.length > 0) params.set('tags', filters.tags.join(','));

    const response = await fetch(`${LANGFUSE_HOST}/api/public/traces?${params}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch traces: ${response.statusText}`);
    }

    const data = await response.json();
    const traces = (data.data || []).map(mapLangfuseTrace);

    return {
      traces,
      count: data.meta?.totalItems || traces.length,
      hasMore: data.meta?.page < data.meta?.totalPages,
    };
  } catch (error) {
    console.error('Error listing traces:', error);
    return { traces: [], count: 0, hasMore: false };
  }
}

// ============================================================================
// Span Operations
// ============================================================================

/**
 * Create a new span within a trace.
 */
export async function createSpan(payload: CreateSpanPayload): Promise<LangfuseSpan> {
  const client = getClient();
  const spanId = payload.spanId || generateSpanId();

  // Normalize output to object format for Langfuse
  const output = payload.output
    ? typeof payload.output === 'string'
      ? { content: payload.output }
      : payload.output
    : undefined;

  const trace = client.trace({ id: payload.traceId });
  trace.span({
    id: spanId,
    name: payload.name,
    metadata: {
      operationType: payload.operationType,
      agentName: payload.agentName,
      ...payload.metadata,
    },
    input: payload.input,
    output,
  });

  await client.flushAsync();

  return {
    id: spanId,
    spanId,
    name: payload.name,
    operationType: payload.operationType,
    agentName: payload.agentName,
    status: output ? 'completed' : 'running',
    input: payload.input,
    output,
    metadata: payload.metadata,
    startedAt: new Date().toISOString(),
  };
}

/**
 * Update an existing span.
 */
export async function updateSpan(payload: UpdateSpanPayload): Promise<LangfuseSpan | null> {
  const client = getClient();

  // Langfuse SDK doesn't support direct span updates, but we can end the span
  // For now, we'll create a new event on the trace to record the update

  await client.flushAsync();

  return {
    id: payload.spanId,
    spanId: payload.spanId,
    name: '',
    operationType: 'custom',
    agentName: '',
    status: payload.status || 'completed',
    output: payload.output,
    reasoning: payload.reasoning,
    toolCalls: payload.toolCalls,
    startedAt: new Date().toISOString(),
  };
}

/**
 * Get a single span by span_id.
 */
export async function getSpanById(_spanId: string): Promise<LangfuseSpan | null> {
  // Langfuse API doesn't expose individual span fetching directly
  // Spans are retrieved as part of a trace
  return null;
}

/**
 * Get all spans for a trace.
 */
export async function getSpansByTraceId(traceId: string): Promise<LangfuseSpan[]> {
  const trace = await getTraceById(traceId);
  return trace?.spans || [];
}

// ============================================================================
// Decision Operations
// ============================================================================

/**
 * Record a decision within a span.
 */
export async function recordDecision(
  spanId: string,
  decision: {
    question: string;
    answer: string;
    reasoning?: string;
    confidence?: number;
    alternatives?: string[];
    toolUsed?: string;
  }
): Promise<void> {
  const client = getClient();

  // Record decision as a generation event
  client.trace({ id: spanId }).generation({
    name: 'decision',
    input: { question: decision.question },
    output: { answer: decision.answer },
    metadata: {
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      alternatives: decision.alternatives,
      toolUsed: decision.toolUsed,
    },
  });

  await client.flushAsync();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Map Langfuse API response to our trace type.
 */
function mapLangfuseTrace(data: Record<string, unknown>): LangfuseTrace {
  const metadata = (data.metadata || {}) as Record<string, unknown>;

  return {
    id: data.id as string,
    traceId: data.id as string,
    name: data.name as string || 'Unnamed Trace',
    agentName: (data.userId as string) || (metadata.agentName as string) || 'unknown',
    workflowName: metadata.workflowName as string,
    commandName: metadata.commandName as string,
    status: (metadata.status as TraceStatus) || (data.output ? 'completed' : 'running'),
    input: (data.input || {}) as Record<string, unknown>,
    output: (data.output || undefined) as Record<string, unknown> | undefined,
    error: metadata.error as string,
    durationMs: (data.latency as number) || (metadata.durationMs as number),
    totalTokens: (data.totalTokens as number) || (metadata.totalTokens as number),
    totalCost: (data.totalCost as number) || (metadata.totalCost as number),
    metadata: metadata,
    startedAt: data.timestamp as string || new Date().toISOString(),
    completedAt: data.updatedAt as string,
    spans: ((data.observations || []) as Record<string, unknown>[]).map(mapLangfuseSpan),
  };
}

/**
 * Map Langfuse observation to our span type.
 */
function mapLangfuseSpan(data: Record<string, unknown>): LangfuseSpan {
  const metadata = (data.metadata || {}) as Record<string, unknown>;

  return {
    id: data.id as string,
    spanId: data.id as string,
    parentSpanId: data.parentObservationId as string,
    name: data.name as string || 'Unnamed Span',
    operationType: (metadata.operationType as LangfuseSpan['operationType']) || 'custom',
    agentName: metadata.agentName as string || 'unknown',
    status: data.endTime ? 'completed' : 'running',
    input: data.input as Record<string, unknown>,
    output: data.output as Record<string, unknown>,
    reasoning: metadata.reasoning as string,
    toolCalls: metadata.toolCalls as LangfuseSpan['toolCalls'],
    durationMs: data.latency as number,
    metadata: metadata,
    startedAt: data.startTime as string || new Date().toISOString(),
    completedAt: data.endTime as string,
  };
}

/**
 * Get trace statistics for dashboard.
 */
export async function getTraceStats(): Promise<{
  total: number;
  running: number;
  completed: number;
  failed: number;
  avgDurationMs: number;
  totalTokens: number;
}> {
  const result = await listTraces({ limit: 100 });
  const traces = result.traces;

  const running = traces.filter((t) => t.status === 'running').length;
  const completed = traces.filter((t) => t.status === 'completed').length;
  const failed = traces.filter((t) => t.status === 'failed').length;
  const durations = traces.filter((t) => t.durationMs).map((t) => t.durationMs!);
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const totalTokens = traces.reduce((sum, t) => sum + (t.totalTokens || 0), 0);

  return {
    total: result.count,
    running,
    completed,
    failed,
    avgDurationMs: avgDuration,
    totalTokens,
  };
}

/**
 * Delete old traces (for cleanup).
 */
export async function deleteOldTraces(_olderThanDays: number): Promise<number> {
  // Langfuse doesn't expose a delete API for traces
  // This would need to be done through the Langfuse UI or database directly
  console.warn('deleteOldTraces not supported via Langfuse API');
  return 0;
}

/**
 * Shutdown the client (flush pending events).
 */
export async function shutdown(): Promise<void> {
  if (langfuseClient) {
    await langfuseClient.shutdownAsync();
    langfuseClient = null;
  }
}

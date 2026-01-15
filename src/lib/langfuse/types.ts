/**
 * Langfuse Type Definitions for BigTurbo Agent Audit System
 *
 * OpenTelemetry-compatible trace and span types for agent observability.
 */

// ============================================================================
// Core Trace Types
// ============================================================================

/**
 * Trace status values aligned with OpenTelemetry conventions.
 */
export type TraceStatus = 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Span status for individual operations within a trace.
 */
export type SpanStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Types of operations an agent can perform.
 */
export type OperationType =
  | 'llm_call'
  | 'tool_use'
  | 'decision'
  | 'file_read'
  | 'file_write'
  | 'file_edit'
  | 'search'
  | 'validation'
  | 'handoff'
  | 'custom';

/**
 * Main trace record representing an agent execution session.
 */
export interface LangfuseTrace {
  /** Unique trace identifier */
  id: string;
  /** External trace ID for correlation with other systems */
  traceId: string;
  /** Name of the trace (usually the command or task) */
  name: string;
  /** Agent that initiated this trace */
  agentName: string;
  /** Associated workflow name (if any) */
  workflowName?: string;
  /** Command that triggered this trace */
  commandName?: string;
  /** Current status */
  status: TraceStatus;
  /** Input provided to the agent */
  input: Record<string, unknown>;
  /** Final output from the agent */
  output?: Record<string, unknown>;
  /** Error message if failed */
  error?: string;
  /** Total duration in milliseconds */
  durationMs?: number;
  /** Total tokens consumed */
  totalTokens?: number;
  /** Estimated cost in USD */
  totalCost?: number;
  /** Additional metadata */
  metadata: TraceMetadata;
  /** When the trace started */
  startedAt: string;
  /** When the trace completed */
  completedAt?: string;
  /** Nested spans within this trace */
  spans: LangfuseSpan[];
}

/**
 * Span record representing a single operation within a trace.
 */
export interface LangfuseSpan {
  /** Unique span identifier */
  id: string;
  /** External span ID for correlation */
  spanId: string;
  /** Parent span ID for nested operations */
  parentSpanId?: string;
  /** Name of the operation */
  name: string;
  /** Type of operation */
  operationType: OperationType;
  /** Agent performing this operation */
  agentName: string;
  /** Current status */
  status: SpanStatus;
  /** Input to the operation */
  input?: Record<string, unknown>;
  /** Output from the operation */
  output?: Record<string, unknown>;
  /** Tool calls made during this span */
  toolCalls?: ToolCall[];
  /** Reasoning or thought process */
  reasoning?: string;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Tokens used in this span */
  tokens?: TokenUsage;
  /** Cost for this span */
  cost?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** When the span started */
  startedAt: string;
  /** When the span completed */
  completedAt?: string;
  /** Decisions made during this span */
  decisions?: Decision[];
}

// ============================================================================
// Supporting Types
// ============================================================================

/**
 * Tool call record within a span.
 */
export interface ToolCall {
  /** Tool name (e.g., "Read", "Write", "Edit", "Bash") */
  name: string;
  /** Arguments passed to the tool */
  arguments: Record<string, unknown>;
  /** Result returned by the tool */
  result?: unknown;
  /** Duration of the tool call */
  durationMs?: number;
  /** Whether the tool call succeeded */
  success: boolean;
  /** Error if failed */
  error?: string;
}

/**
 * Decision point within a span.
 */
export interface Decision {
  /** Question or choice being decided */
  question: string;
  /** Selected answer or choice */
  answer: string;
  /** Reasoning behind the decision */
  reasoning?: string;
  /** Confidence score (0.0 to 1.0) */
  confidence?: number;
  /** Alternative options considered */
  alternatives?: string[];
  /** Tool used to make the decision (if any) */
  toolUsed?: string;
}

/**
 * Token usage breakdown.
 */
export interface TokenUsage {
  /** Prompt/input tokens */
  prompt: number;
  /** Completion/output tokens */
  completion: number;
  /** Total tokens */
  total: number;
}

/**
 * Trace metadata for categorization and filtering.
 */
export interface TraceMetadata {
  /** Session or conversation ID */
  sessionId?: string;
  /** User who initiated the trace */
  userId?: string;
  /** Environment (development, staging, production) */
  environment?: string;
  /** Version of the agent */
  agentVersion?: string;
  /** Git commit hash */
  commitHash?: string;
  /** Custom tags for filtering */
  tags?: string[];
  /** Additional custom metadata */
  [key: string]: unknown;
}

// ============================================================================
// Ingestion Types
// ============================================================================

/**
 * Payload for creating a new trace via webhook.
 */
export interface CreateTracePayload {
  /** Optional trace ID (generated if not provided) */
  traceId?: string;
  /** Trace name */
  name: string;
  /** Agent name */
  agentName: string;
  /** Workflow name (optional) */
  workflowName?: string;
  /** Command name (optional) */
  commandName?: string;
  /** Initial input */
  input: Record<string, unknown>;
  /** Metadata */
  metadata?: Partial<TraceMetadata>;
}

/**
 * Payload for creating a span within a trace.
 */
export interface CreateSpanPayload {
  /** Trace ID this span belongs to */
  traceId: string;
  /** Optional span ID (generated if not provided) */
  spanId?: string;
  /** Parent span ID (optional) */
  parentSpanId?: string;
  /** Span name */
  name: string;
  /** Operation type */
  operationType: OperationType;
  /** Agent name */
  agentName: string;
  /** Input to the operation */
  input?: Record<string, unknown>;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Payload for updating/completing a trace.
 */
export interface UpdateTracePayload {
  /** Trace ID to update */
  traceId: string;
  /** New status */
  status?: TraceStatus;
  /** Output data */
  output?: Record<string, unknown>;
  /** Error message */
  error?: string;
  /** Total tokens used */
  totalTokens?: number;
  /** Total cost */
  totalCost?: number;
  /** Additional metadata to merge */
  metadata?: Partial<TraceMetadata>;
}

/**
 * Payload for updating/completing a span.
 */
export interface UpdateSpanPayload {
  /** Span ID to update */
  spanId: string;
  /** New status */
  status?: SpanStatus;
  /** Output data */
  output?: Record<string, unknown>;
  /** Reasoning text */
  reasoning?: string;
  /** Tool calls made */
  toolCalls?: ToolCall[];
  /** Decisions made */
  decisions?: Decision[];
  /** Token usage */
  tokens?: TokenUsage;
  /** Cost */
  cost?: number;
  /** Error message */
  error?: string;
}

/**
 * Batch ingestion payload for multiple events.
 */
export interface BatchIngestPayload {
  /** Batch identifier */
  batchId?: string;
  /** Events to ingest */
  events: IngestEvent[];
}

/**
 * Single ingestion event (trace or span operation).
 */
export type IngestEvent =
  | { type: 'trace.create'; payload: CreateTracePayload }
  | { type: 'trace.update'; payload: UpdateTracePayload }
  | { type: 'span.create'; payload: CreateSpanPayload }
  | { type: 'span.update'; payload: UpdateSpanPayload };

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response from trace list endpoint.
 */
export interface TracesListResponse {
  traces: LangfuseTrace[];
  count: number;
  hasMore: boolean;
}

/**
 * Response from single trace endpoint.
 */
export interface TraceDetailResponse {
  trace: LangfuseTrace;
}

/**
 * Response from ingestion endpoint.
 */
export interface IngestResponse {
  success: boolean;
  traceId?: string;
  spanId?: string;
  errors?: string[];
}

/**
 * Response from batch ingestion endpoint.
 */
export interface BatchIngestResponse {
  success: boolean;
  batchId: string;
  processed: number;
  failed: number;
  errors?: Array<{ index: number; error: string }>;
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Filters for querying traces.
 */
export interface TraceFilters {
  /** Filter by agent name */
  agentName?: string;
  /** Filter by workflow name */
  workflowName?: string;
  /** Filter by command name */
  commandName?: string;
  /** Filter by status */
  status?: TraceStatus | TraceStatus[];
  /** Filter by date range start */
  startDate?: string;
  /** Filter by date range end */
  endDate?: string;
  /** Filter by tags */
  tags?: string[];
  /** Search in trace names */
  search?: string;
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
  /** Sort field */
  sortBy?: 'startedAt' | 'durationMs' | 'totalTokens' | 'name';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

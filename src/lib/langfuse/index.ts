/**
 * Langfuse Module Index
 *
 * Re-exports all Langfuse client, ingestion, and type utilities.
 */

// Client functions
export {
  isLangfuseConfigured,
  generateId,
  generateTraceId,
  generateSpanId,
  createTrace,
  updateTrace,
  getTraceById,
  getTraceByDbId,
  listTraces,
  createSpan,
  updateSpan,
  getSpanById,
  getSpansByTraceId,
  recordDecision,
  getTraceStats,
  deleteOldTraces,
} from './client';

// Ingestion functions
export {
  processEvent,
  processBatch,
  startTrace,
  completeTrace,
  failTrace,
  addSpan,
  completeSpan,
  failSpan,
} from './ingest';

// Types
export type {
  TraceStatus,
  SpanStatus,
  OperationType,
  LangfuseTrace,
  LangfuseSpan,
  ToolCall,
  Decision,
  TokenUsage,
  TraceMetadata,
  CreateTracePayload,
  CreateSpanPayload,
  UpdateTracePayload,
  UpdateSpanPayload,
  BatchIngestPayload,
  IngestEvent,
  TracesListResponse,
  TraceDetailResponse,
  IngestResponse,
  BatchIngestResponse,
  TraceFilters,
} from './types';

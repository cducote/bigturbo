/**
 * Trace Ingestion Logic for BigTurbo Agent Audit System
 *
 * Handles batch and single-event ingestion with validation.
 */

import {
  createTrace,
  updateTrace,
  createSpan,
  updateSpan,
} from './client';
import type {
  IngestEvent,
  BatchIngestPayload,
  BatchIngestResponse,
  IngestResponse,
  CreateTracePayload,
  CreateSpanPayload,
  UpdateTracePayload,
  UpdateSpanPayload,
} from './types';

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate a trace creation payload.
 */
function validateCreateTrace(payload: CreateTracePayload): string[] {
  const errors: string[] = [];

  if (!payload.name || typeof payload.name !== 'string') {
    errors.push('name is required and must be a string');
  }

  if (!payload.agentName || typeof payload.agentName !== 'string') {
    errors.push('agentName is required and must be a string');
  }

  if (!payload.input || typeof payload.input !== 'object') {
    errors.push('input is required and must be an object');
  }

  return errors;
}

/**
 * Validate a span creation payload.
 */
function validateCreateSpan(payload: CreateSpanPayload): string[] {
  const errors: string[] = [];

  if (!payload.traceId || typeof payload.traceId !== 'string') {
    errors.push('traceId is required and must be a string');
  }

  if (!payload.name || typeof payload.name !== 'string') {
    errors.push('name is required and must be a string');
  }

  if (!payload.operationType || typeof payload.operationType !== 'string') {
    errors.push('operationType is required and must be a string');
  }

  if (!payload.agentName || typeof payload.agentName !== 'string') {
    errors.push('agentName is required and must be a string');
  }

  const validOperationTypes = [
    'llm_call',
    'tool_use',
    'decision',
    'file_read',
    'file_write',
    'file_edit',
    'search',
    'validation',
    'handoff',
    'custom',
  ];

  if (!validOperationTypes.includes(payload.operationType)) {
    errors.push(`operationType must be one of: ${validOperationTypes.join(', ')}`);
  }

  return errors;
}

/**
 * Validate a trace update payload.
 */
function validateUpdateTrace(payload: UpdateTracePayload): string[] {
  const errors: string[] = [];

  if (!payload.traceId || typeof payload.traceId !== 'string') {
    errors.push('traceId is required and must be a string');
  }

  const validStatuses = ['running', 'completed', 'failed', 'cancelled'];
  if (payload.status && !validStatuses.includes(payload.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }

  return errors;
}

/**
 * Validate a span update payload.
 */
function validateUpdateSpan(payload: UpdateSpanPayload): string[] {
  const errors: string[] = [];

  if (!payload.spanId || typeof payload.spanId !== 'string') {
    errors.push('spanId is required and must be a string');
  }

  const validStatuses = ['pending', 'running', 'completed', 'failed'];
  if (payload.status && !validStatuses.includes(payload.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }

  return errors;
}

// ============================================================================
// Single Event Ingestion
// ============================================================================

/**
 * Process a single ingestion event.
 */
export async function processEvent(event: IngestEvent): Promise<IngestResponse> {
  try {
    switch (event.type) {
      case 'trace.create': {
        const errors = validateCreateTrace(event.payload);
        if (errors.length > 0) {
          return { success: false, errors };
        }
        const trace = await createTrace(event.payload);
        return { success: true, traceId: trace.traceId };
      }

      case 'trace.update': {
        const errors = validateUpdateTrace(event.payload);
        if (errors.length > 0) {
          return { success: false, errors };
        }
        const trace = await updateTrace(event.payload);
        if (!trace) {
          return { success: false, errors: ['Trace not found'] };
        }
        return { success: true, traceId: trace.traceId };
      }

      case 'span.create': {
        const errors = validateCreateSpan(event.payload);
        if (errors.length > 0) {
          return { success: false, errors };
        }
        const span = await createSpan(event.payload);
        return { success: true, spanId: span.spanId };
      }

      case 'span.update': {
        const errors = validateUpdateSpan(event.payload);
        if (errors.length > 0) {
          return { success: false, errors };
        }
        const span = await updateSpan(event.payload);
        if (!span) {
          return { success: false, errors: ['Span not found'] };
        }
        return { success: true, spanId: span.spanId };
      }

      default:
        return {
          success: false,
          errors: [`Unknown event type: ${(event as { type: string }).type}`],
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, errors: [message] };
  }
}

// ============================================================================
// Batch Ingestion
// ============================================================================

/**
 * Process a batch of ingestion events.
 */
export async function processBatch(payload: BatchIngestPayload): Promise<BatchIngestResponse> {
  const batchId = payload.batchId || `batch-${Date.now().toString(36)}`;
  const errors: Array<{ index: number; error: string }> = [];
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < payload.events.length; i++) {
    const event = payload.events[i];
    const result = await processEvent(event);

    if (result.success) {
      processed++;
    } else {
      failed++;
      errors.push({
        index: i,
        error: result.errors?.join('; ') || 'Unknown error',
      });
    }
  }

  return {
    success: failed === 0,
    batchId,
    processed,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Start a new trace with minimal required fields.
 */
export async function startTrace(
  name: string,
  agentName: string,
  input: Record<string, unknown>,
  options?: {
    workflowName?: string;
    commandName?: string;
    sessionId?: string;
    tags?: string[];
  }
): Promise<{ traceId: string }> {
  const result = await processEvent({
    type: 'trace.create',
    payload: {
      name,
      agentName,
      input,
      workflowName: options?.workflowName,
      commandName: options?.commandName,
      metadata: {
        sessionId: options?.sessionId,
        tags: options?.tags,
      },
    },
  });

  if (!result.success || !result.traceId) {
    throw new Error(`Failed to start trace: ${result.errors?.join(', ')}`);
  }

  return { traceId: result.traceId };
}

/**
 * Complete a trace with output.
 */
export async function completeTrace(
  traceId: string,
  output: Record<string, unknown>,
  options?: {
    totalTokens?: number;
    totalCost?: number;
  }
): Promise<void> {
  const result = await processEvent({
    type: 'trace.update',
    payload: {
      traceId,
      status: 'completed',
      output,
      totalTokens: options?.totalTokens,
      totalCost: options?.totalCost,
    },
  });

  if (!result.success) {
    throw new Error(`Failed to complete trace: ${result.errors?.join(', ')}`);
  }
}

/**
 * Fail a trace with error.
 */
export async function failTrace(traceId: string, error: string): Promise<void> {
  const result = await processEvent({
    type: 'trace.update',
    payload: {
      traceId,
      status: 'failed',
      error,
    },
  });

  if (!result.success) {
    throw new Error(`Failed to fail trace: ${result.errors?.join(', ')}`);
  }
}

/**
 * Add a span to an existing trace.
 */
export async function addSpan(
  traceId: string,
  name: string,
  operationType: CreateSpanPayload['operationType'],
  agentName: string,
  options?: {
    parentSpanId?: string;
    input?: Record<string, unknown>;
  }
): Promise<{ spanId: string }> {
  const result = await processEvent({
    type: 'span.create',
    payload: {
      traceId,
      name,
      operationType,
      agentName,
      parentSpanId: options?.parentSpanId,
      input: options?.input,
    },
  });

  if (!result.success || !result.spanId) {
    throw new Error(`Failed to add span: ${result.errors?.join(', ')}`);
  }

  return { spanId: result.spanId };
}

/**
 * Complete a span with output.
 */
export async function completeSpan(
  spanId: string,
  output: Record<string, unknown>,
  options?: {
    reasoning?: string;
    toolCalls?: UpdateSpanPayload['toolCalls'];
    tokens?: UpdateSpanPayload['tokens'];
    cost?: number;
  }
): Promise<void> {
  const result = await processEvent({
    type: 'span.update',
    payload: {
      spanId,
      status: 'completed',
      output,
      reasoning: options?.reasoning,
      toolCalls: options?.toolCalls,
      tokens: options?.tokens,
      cost: options?.cost,
    },
  });

  if (!result.success) {
    throw new Error(`Failed to complete span: ${result.errors?.join(', ')}`);
  }
}

/**
 * Fail a span with error.
 */
export async function failSpan(spanId: string, error: string): Promise<void> {
  const result = await processEvent({
    type: 'span.update',
    payload: {
      spanId,
      status: 'failed',
      output: { error },
    },
  });

  if (!result.success) {
    throw new Error(`Failed to fail span: ${result.errors?.join(', ')}`);
  }
}

// ============================================================================
// Export Index
// ============================================================================

export {
  validateCreateTrace,
  validateCreateSpan,
  validateUpdateTrace,
  validateUpdateSpan,
};

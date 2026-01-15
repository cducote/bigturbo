'use client';

import { useState } from 'react';
import type { LangfuseTrace, LangfuseSpan } from '@/lib/langfuse';
import { AgentBadge } from './AgentBadge';

// ============================================================================
// Types
// ============================================================================

interface TraceViewerProps {
  trace: LangfuseTrace;
}

interface SpanNodeProps {
  span: LangfuseSpan;
  depth: number;
  isLast: boolean;
}

// ============================================================================
// Status Badge Component
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const statusStyles: Record<string, string> = {
    running: 'bg-[#fef3c7] text-[#92400e] border-[#f59e0b]',
    completed: 'bg-[#d1fae5] text-[#065f46] border-[#10b981]',
    failed: 'bg-[#fee2e2] text-[#991b1b] border-[#ef4444]',
    cancelled: 'bg-[#e5e7eb] text-[#374151] border-[#6b7280]',
    pending: 'bg-[#e0e7ff] text-[#3730a3] border-[#6366f1]',
  };

  return (
    <span
      className={`inline-block border px-2 py-0.5 text-xs font-mono ${statusStyles[status] || statusStyles.pending}`}
    >
      {status}
    </span>
  );
}

// ============================================================================
// Duration Display Component
// ============================================================================

function DurationDisplay({ ms }: { ms?: number }) {
  if (ms === undefined || ms === null) return <span className="text-[#64748b]">--</span>;

  if (ms < 1000) {
    return <span className="text-[#0f172a]">{ms.toFixed(0)}ms</span>;
  } else if (ms < 60000) {
    return <span className="text-[#0f172a]">{(ms / 1000).toFixed(2)}s</span>;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return (
      <span className="text-[#0f172a]">
        {minutes}m {seconds}s
      </span>
    );
  }
}

// ============================================================================
// Span Node Component
// ============================================================================

function SpanNode({ span, depth, isLast: _isLast }: SpanNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasDetails =
    span.input || span.output || span.reasoning || (span.toolCalls && span.toolCalls.length > 0);

  return (
    <div className="relative">
      {/* Connector lines */}
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 h-full border-l border-dashed border-[#1e293b]"
          style={{ marginLeft: `${(depth - 1) * 24 + 8}px` }}
        />
      )}

      <div
        className="relative border-b border-[#1e293b] bg-[#fefcf3] py-2"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {/* Horizontal connector */}
        {depth > 0 && (
          <div
            className="absolute top-1/2 h-px w-4 border-t border-dashed border-[#1e293b]"
            style={{ left: `${(depth - 1) * 24 + 8}px` }}
          />
        )}

        {/* Span header */}
        <div className="flex items-center gap-3">
          {hasDetails && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex h-5 w-5 items-center justify-center border border-[#1e293b] bg-[#fffef5] text-xs font-mono text-[#0f172a] hover:bg-[#fefce8]"
            >
              {isExpanded ? '-' : '+'}
            </button>
          )}

          <div className="flex flex-1 items-center gap-3 font-mono text-sm">
            <span className="text-[#64748b]">{span.operationType}</span>
            <span className="font-medium text-[#0f172a]">{span.name || span.spanId}</span>
            {span.agentName && (
              <AgentBadge agentId={span.agentName} />
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <StatusBadge status={span.status} />
            <span className="font-mono text-[#64748b]">
              <DurationDisplay ms={span.durationMs} />
            </span>
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && hasDetails && (
          <div className="mt-3 space-y-3 border-t border-dashed border-[#1e293b] pt-3">
            {/* Input */}
            {span.input && Object.keys(span.input).length > 0 && (
              <div>
                <span className="text-xs text-[#64748b]">input:</span>
                <pre className="mt-1 overflow-x-auto bg-[#fffef5] p-2 text-xs text-[#0f172a]">
                  {JSON.stringify(span.input, null, 2)}
                </pre>
              </div>
            )}

            {/* Reasoning */}
            {span.reasoning && (
              <div>
                <span className="text-xs text-[#64748b]">reasoning:</span>
                <p className="mt-1 text-sm text-[#1e293b]">{span.reasoning}</p>
              </div>
            )}

            {/* Tool Calls */}
            {span.toolCalls && span.toolCalls.length > 0 && (
              <div>
                <span className="text-xs text-[#64748b]">
                  tool_calls: ({span.toolCalls.length})
                </span>
                <div className="mt-1 space-y-1">
                  {span.toolCalls.map((call, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-[#fffef5] p-2 text-xs font-mono"
                    >
                      <span className={call.success ? 'text-[#065f46]' : 'text-[#991b1b]'}>
                        {call.success ? '\u2713' : '\u2717'}
                      </span>
                      <span className="font-medium text-[#0f172a]">{call.name}</span>
                      {call.durationMs && (
                        <span className="text-[#64748b]">{call.durationMs}ms</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Output */}
            {span.output && Object.keys(span.output).length > 0 && (
              <div>
                <span className="text-xs text-[#64748b]">output:</span>
                <pre className="mt-1 overflow-x-auto bg-[#fffef5] p-2 text-xs text-[#0f172a]">
                  {JSON.stringify(span.output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Trace Header Component
// ============================================================================

function TraceHeader({ trace }: { trace: LangfuseTrace }) {
  return (
    <div className="border-b border-[#1e293b] bg-[#fefcf3] p-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-mono text-xl font-bold text-[#0f172a]">{trace.name}</h2>
          <div className="mt-1 flex items-center gap-3 text-sm">
            <span className="font-mono text-[#64748b]">{trace.traceId}</span>
            {trace.agentName && (
              <AgentBadge agentId={trace.agentName} />
            )}
            {trace.workflowName && (
              <span className="text-xs text-[#64748b]">{'\u2192'} {trace.workflowName}</span>
            )}
          </div>
        </div>
        <StatusBadge status={trace.status} />
      </div>

      {/* Metrics row */}
      <div className="mt-4 flex gap-6 border-t border-dashed border-[#1e293b] pt-3">
        <div>
          <span className="text-xs text-[#64748b]">duration</span>
          <p className="font-mono text-sm font-medium text-[#0f172a]">
            <DurationDisplay ms={trace.durationMs} />
          </p>
        </div>
        <div>
          <span className="text-xs text-[#64748b]">tokens</span>
          <p className="font-mono text-sm font-medium text-[#0f172a]">
            {trace.totalTokens?.toLocaleString() || '--'}
          </p>
        </div>
        <div>
          <span className="text-xs text-[#64748b]">cost</span>
          <p className="font-mono text-sm font-medium text-[#0f172a]">
            {trace.totalCost ? `$${trace.totalCost.toFixed(4)}` : '--'}
          </p>
        </div>
        <div>
          <span className="text-xs text-[#64748b]">spans</span>
          <p className="font-mono text-sm font-medium text-[#0f172a]">{trace.spans?.length || 0}</p>
        </div>
        <div>
          <span className="text-xs text-[#64748b]">started</span>
          <p className="font-mono text-sm font-medium text-[#0f172a]">
            {new Date(trace.startedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Trace Input/Output Panel
// ============================================================================

function TraceIOPanel({ trace }: { trace: LangfuseTrace }) {
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');

  return (
    <div className="border-b border-[#1e293b]">
      <div className="flex border-b border-[#1e293b]">
        <button
          onClick={() => setActiveTab('input')}
          className={`px-4 py-2 font-mono text-sm ${
            activeTab === 'input'
              ? 'bg-[#fefcf3] font-medium text-[#0f172a]'
              : 'bg-[#fffef5] text-[#64748b] hover:bg-[#fefce8]'
          }`}
        >
          input
        </button>
        <button
          onClick={() => setActiveTab('output')}
          className={`px-4 py-2 font-mono text-sm ${
            activeTab === 'output'
              ? 'bg-[#fefcf3] font-medium text-[#0f172a]'
              : 'bg-[#fffef5] text-[#64748b] hover:bg-[#fefce8]'
          }`}
        >
          output
        </button>
      </div>
      <div className="bg-[#fffef5] p-4">
        <pre className="overflow-x-auto font-mono text-xs text-[#0f172a]">
          {activeTab === 'input'
            ? JSON.stringify(trace.input, null, 2)
            : trace.output
              ? JSON.stringify(trace.output, null, 2)
              : trace.error || 'No output yet'}
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// Main TraceViewer Component
// ============================================================================

export function TraceViewer({ trace }: TraceViewerProps) {
  // Build span tree from flat list
  const buildSpanTree = (spans: LangfuseSpan[]): LangfuseSpan[] => {
    // For now, return flat list - tree building can be enhanced later
    return spans || [];
  };

  const spanTree = buildSpanTree(trace.spans);

  return (
    <div className="border border-[#1e293b]">
      <TraceHeader trace={trace} />
      <TraceIOPanel trace={trace} />

      {/* Spans section */}
      <div>
        <div className="border-b border-[#1e293b] bg-[#fefce8] px-4 py-2">
          <span className="font-mono text-sm font-medium text-[#0f172a]">
            spans ({spanTree.length})
          </span>
        </div>
        {spanTree.length > 0 ? (
          <div>
            {spanTree.map((span, index) => (
              <SpanNode
                key={span.id || span.spanId}
                span={span}
                depth={0}
                isLast={index === spanTree.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#fefcf3] p-4 text-center font-mono text-sm text-[#64748b]">
            No spans recorded
          </div>
        )}
      </div>
    </div>
  );
}

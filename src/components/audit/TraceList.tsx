'use client';

import Link from 'next/link';
import type { LangfuseTrace, TraceStatus } from '@/lib/langfuse';
import { AgentBadge } from './AgentBadge';

// ============================================================================
// Types
// ============================================================================

interface TraceListProps {
  traces: LangfuseTrace[];
  totalCount: number;
  hasMore: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

// ============================================================================
// Status Badge Component
// ============================================================================

function StatusBadge({ status }: { status: TraceStatus }) {
  const statusStyles: Record<TraceStatus, string> = {
    running: 'bg-[#fef3c7] text-[#92400e] border-[#f59e0b]',
    completed: 'bg-[#d1fae5] text-[#065f46] border-[#10b981]',
    failed: 'bg-[#fee2e2] text-[#991b1b] border-[#ef4444]',
    cancelled: 'bg-[#e5e7eb] text-[#374151] border-[#6b7280]',
  };

  return (
    <span
      className={`inline-block border px-2 py-0.5 text-xs font-mono ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

// ============================================================================
// Duration Display Component
// ============================================================================

function DurationDisplay({ ms }: { ms?: number }) {
  if (ms === undefined || ms === null) return <span className="text-[#94a3b8]">--</span>;

  if (ms < 1000) {
    return <span className="text-[#0f172a]">{ms.toFixed(0)}ms</span>;
  } else if (ms < 60000) {
    return <span className="text-[#0f172a]">{(ms / 1000).toFixed(1)}s</span>;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return <span className="text-[#0f172a]">{minutes}m {seconds}s</span>;
  }
}

// ============================================================================
// Trace Row Component
// ============================================================================

function TraceRow({ trace }: { trace: LangfuseTrace }) {
  const startTime = new Date(trace.startedAt);
  const timeAgo = getTimeAgo(startTime);

  return (
    <Link
      href={`/audit/traces/${trace.traceId || trace.id}`}
      className="block border-b border-[#1e293b] bg-[#fefcf3] p-4 font-mono transition-colors hover:bg-[#fefce8]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-[#0f172a]">{trace.name}</span>
            <StatusBadge status={trace.status} />
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-[#64748b]">
            <span className="truncate">{trace.traceId}</span>
            {trace.agentName && (
              <>
                <span>{'\u2022'}</span>
                <AgentBadge agentId={trace.agentName} />
              </>
            )}
            {trace.commandName && (
              <>
                <span>{'\u2022'}</span>
                <span>/{trace.commandName}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-6 text-xs">
          <div className="text-right">
            <span className="text-[#94a3b8]">duration</span>
            <p className="text-[#0f172a]">
              <DurationDisplay ms={trace.durationMs} />
            </p>
          </div>
          <div className="text-right">
            <span className="text-[#94a3b8]">tokens</span>
            <p className="text-[#0f172a]">
              {trace.totalTokens?.toLocaleString() || '--'}
            </p>
          </div>
          <div className="w-20 text-right">
            <span className="text-[#94a3b8]">time</span>
            <p className="text-[#0f172a]">{timeAgo}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// Empty State Component
// ============================================================================

function EmptyState() {
  return (
    <div className="border border-dashed border-[#1e293b] bg-[#fffef5] p-12 text-center">
      <div className="font-mono text-5xl text-[#cbd5e1]">{'\u2205'}</div>
      <p className="mt-4 font-mono text-lg text-[#64748b]">No traces found</p>
      <p className="mt-2 text-sm text-[#94a3b8]">
        Traces will appear here when agents execute commands
      </p>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// ============================================================================
// Main TraceList Component
// ============================================================================

export function TraceList({
  traces,
  totalCount,
  hasMore,
  onLoadMore,
  isLoading,
}: TraceListProps) {
  if (traces.length === 0 && !isLoading) {
    return <EmptyState />;
  }

  return (
    <div className="border border-[#1e293b]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#fefce8] px-4 py-3">
        <div>
          <span className="font-mono text-sm font-medium text-[#0f172a]">
            traces
          </span>
          <span className="ml-2 text-xs text-[#64748b]">
            ({totalCount.toLocaleString()} total)
          </span>
        </div>
        <div className="flex gap-4 text-xs font-mono text-[#64748b]">
          <span>name</span>
          <span>duration</span>
          <span>tokens</span>
          <span>time</span>
        </div>
      </div>

      {/* Trace rows */}
      <div>
        {traces.map((trace) => (
          <TraceRow key={trace.id || trace.traceId} trace={trace} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && onLoadMore && (
        <div className="border-t border-[#1e293b] bg-[#fefcf3] p-4 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="border border-[#1e293b] bg-[#fffef5] px-4 py-2 font-mono text-sm text-[#0f172a] hover:bg-[#fefce8] disabled:opacity-50"
          >
            {isLoading ? 'loading...' : `load more (${totalCount - traces.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}

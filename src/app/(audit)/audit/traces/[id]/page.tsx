'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { TraceViewer } from '@/components/audit/TraceViewer';
import { DecisionTree } from '@/components/audit/DecisionTree';
import type { LangfuseTrace } from '@/lib/langfuse';

// ============================================================================
// Types
// ============================================================================

interface TraceDetailPageProps {
  params: Promise<{ id: string }>;
}

// ============================================================================
// Loading State Component
// ============================================================================

function LoadingState() {
  return (
    <div className="flex min-h-[400px] items-center justify-center border border-dashed border-[#1e293b] bg-[#fffef5]">
      <div className="text-center">
        <div className="font-mono text-2xl text-[#cbd5e1]">{'\u22EF'}</div>
        <p className="mt-2 font-mono text-sm text-[#64748b]">loading trace...</p>
      </div>
    </div>
  );
}

// ============================================================================
// Error State Component
// ============================================================================

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="border border-[#ef4444] bg-[#fee2e2] p-8 text-center">
      <div className="font-mono text-3xl text-[#ef4444]">{'\u2717'}</div>
      <p className="mt-2 font-mono text-lg text-[#991b1b]">Error loading trace</p>
      <p className="mt-1 text-sm text-[#991b1b]">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 border border-[#991b1b] px-4 py-2 font-mono text-sm text-[#991b1b] hover:bg-[#fecaca]"
      >
        retry
      </button>
    </div>
  );
}

// ============================================================================
// Not Found State Component
// ============================================================================

function NotFoundState({ id }: { id: string }) {
  return (
    <div className="border border-dashed border-[#1e293b] bg-[#fffef5] p-8 text-center">
      <div className="font-mono text-4xl text-[#cbd5e1]">{'\u2205'}</div>
      <p className="mt-2 font-mono text-lg text-[#64748b]">Trace not found</p>
      <p className="mt-1 font-mono text-xs text-[#94a3b8]">{id}</p>
      <Link
        href="/audit/traces"
        className="mt-4 inline-block font-mono text-sm text-[#0f172a] underline"
      >
        {'\u2190'} back to traces
      </Link>
    </div>
  );
}

// ============================================================================
// Tab Navigation Component
// ============================================================================

function TabNav({
  activeTab,
  onTabChange,
  spanCount,
  decisionCount,
}: {
  activeTab: 'viewer' | 'decisions';
  onTabChange: (tab: 'viewer' | 'decisions') => void;
  spanCount: number;
  decisionCount: number;
}) {
  return (
    <div className="flex border-b border-[#1e293b]">
      <button
        onClick={() => onTabChange('viewer')}
        className={`px-6 py-3 font-mono text-sm ${
          activeTab === 'viewer'
            ? 'border-b-2 border-[#1e293b] bg-[#fefcf3] font-medium text-[#0f172a]'
            : 'bg-[#fffef5] text-[#64748b] hover:bg-[#fefce8]'
        }`}
      >
        trace viewer
        <span className="ml-2 text-xs text-[#94a3b8]">({spanCount} spans)</span>
      </button>
      <button
        onClick={() => onTabChange('decisions')}
        className={`px-6 py-3 font-mono text-sm ${
          activeTab === 'decisions'
            ? 'border-b-2 border-[#1e293b] bg-[#fefcf3] font-medium text-[#0f172a]'
            : 'bg-[#fffef5] text-[#64748b] hover:bg-[#fefce8]'
        }`}
      >
        decision tree
        <span className="ml-2 text-xs text-[#94a3b8]">({decisionCount})</span>
      </button>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function TraceDetailPage({ params }: TraceDetailPageProps) {
  const { id } = use(params);
  const [trace, setTrace] = useState<LangfuseTrace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'viewer' | 'decisions'>('viewer');

  const fetchTrace = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/audit/traces/${encodeURIComponent(id)}`);

      if (response.status === 404) {
        setTrace(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch trace');
      }

      const data = await response.json();
      setTrace(data.trace);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrace();
  }, [id]);

  // Calculate decision count
  const decisionCount = trace?.spans?.reduce(
    (sum, span) => sum + (span.decisions?.length || 0),
    0
  ) || 0;

  return (
    <div className="min-h-screen bg-[#fffef5]">
      {/* Page Header */}
      <div className="border-b border-[#1e293b] bg-[#fefcf3] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/audit/traces"
            className="font-mono text-sm text-[#64748b] hover:text-[#0f172a]"
          >
            {'\u2190'} traces
          </Link>
          <span className="text-[#cbd5e1]">/</span>
          <span className="font-mono text-sm text-[#0f172a]">
            {trace?.name || id}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchTrace} />
        ) : !trace ? (
          <NotFoundState id={id} />
        ) : (
          <div>
            {/* Tab Navigation */}
            <TabNav
              activeTab={activeTab}
              onTabChange={setActiveTab}
              spanCount={trace.spans?.length || 0}
              decisionCount={decisionCount}
            />

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === 'viewer' ? (
                <TraceViewer trace={trace} />
              ) : (
                <DecisionTree trace={trace} />
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex gap-4 border-t border-[#1e293b] pt-6">
              <button
                onClick={() => {
                  const json = JSON.stringify(trace, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `trace-${trace.traceId}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="border border-[#1e293b] bg-[#fffef5] px-4 py-2 font-mono text-sm text-[#0f172a] hover:bg-[#fefce8]"
              >
                export as JSON
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(trace.traceId);
                }}
                className="border border-[#1e293b] bg-[#fffef5] px-4 py-2 font-mono text-sm text-[#0f172a] hover:bg-[#fefce8]"
              >
                copy trace ID
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

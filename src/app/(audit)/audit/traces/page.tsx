'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TraceList } from '@/components/audit/TraceList';
import { ExportPanel } from '@/components/audit/ExportPanel';
import type { LangfuseTrace } from '@/lib/langfuse';

// ============================================================================
// Types
// ============================================================================

interface TracesResponse {
  traces: LangfuseTrace[];
  count: number;
  hasMore: boolean;
}

// ============================================================================
// Filter Bar Component
// ============================================================================

function FilterBar({
  filters,
  onFilterChange,
}: {
  filters: {
    status: string;
    search: string;
    agentName: string;
  };
  onFilterChange: (key: string, value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-4 border-b border-[#1e293b] bg-[#fefce8] p-4">
      {/* Search */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="search traces..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="w-full border border-[#1e293b] bg-[#fffef5] px-3 py-2 font-mono text-sm text-[#0f172a] placeholder:text-[#94a3b8]"
        />
      </div>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) => onFilterChange('status', e.target.value)}
        className="border border-[#1e293b] bg-[#fffef5] px-3 py-2 font-mono text-sm text-[#0f172a]"
      >
        <option value="">all statuses</option>
        <option value="running">running</option>
        <option value="completed">completed</option>
        <option value="failed">failed</option>
        <option value="cancelled">cancelled</option>
      </select>

      {/* Agent filter */}
      <input
        type="text"
        placeholder="agent name..."
        value={filters.agentName}
        onChange={(e) => onFilterChange('agentName', e.target.value)}
        className="w-40 border border-[#1e293b] bg-[#fffef5] px-3 py-2 font-mono text-sm text-[#0f172a] placeholder:text-[#94a3b8]"
      />
    </div>
  );
}

// ============================================================================
// Stats Bar Component
// ============================================================================

function StatsBar({ stats }: { stats: { total: number; running: number; completed: number; failed: number } }) {
  return (
    <div className="flex gap-6 border-b border-[#1e293b] bg-[#fefcf3] px-4 py-3">
      <div>
        <span className="text-xs text-[#64748b]">total</span>
        <p className="font-mono text-lg font-bold text-[#0f172a]">{stats.total}</p>
      </div>
      <div>
        <span className="text-xs text-[#64748b]">running</span>
        <p className="font-mono text-lg font-bold text-[#f59e0b]">{stats.running}</p>
      </div>
      <div>
        <span className="text-xs text-[#64748b]">completed</span>
        <p className="font-mono text-lg font-bold text-[#10b981]">{stats.completed}</p>
      </div>
      <div>
        <span className="text-xs text-[#64748b]">failed</span>
        <p className="font-mono text-lg font-bold text-[#ef4444]">{stats.failed}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function TracesPage() {
  const [traces, setTraces] = useState<LangfuseTrace[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const [filters, setFilters] = useState({
    status: '',
    search: '',
    agentName: '',
  });

  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    completed: 0,
    failed: 0,
  });

  const [isLive, setIsLive] = useState(false);

  // Track current traces length for append mode
  const tracesLengthRef = useRef(0);
  tracesLengthRef.current = traces.length;

  // Fetch traces - wrapped in useCallback with proper dependencies
  const fetchTraces = useCallback(async (append = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      if (filters.agentName) params.set('agentName', filters.agentName);
      params.set('limit', '50');
      if (append) params.set('offset', String(tracesLengthRef.current));

      const response = await fetch(`/api/audit/traces?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch traces');
      }

      const data: TracesResponse = await response.json();

      if (append) {
        setTraces((prev) => [...prev, ...data.traces]);
      } else {
        setTraces(data.traces);
      }

      setTotalCount(data.count);
      setHasMore(data.hasMore);

      // Calculate stats from all traces (simplified)
      if (!append) {
        const running = data.traces.filter((t) => t.status === 'running').length;
        const completed = data.traces.filter((t) => t.status === 'completed').length;
        const failed = data.traces.filter((t) => t.status === 'failed').length;
        setStats({
          total: data.count,
          running,
          completed,
          failed,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [filters.status, filters.search, filters.agentName]);

  // Initial fetch and refetch on filter change
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTraces();
    }, 300); // Debounce

    return () => clearTimeout(timeout);
  }, [fetchTraces]);

  // SSE connection for live updates
  useEffect(() => {
    if (!isLive) return;

    const eventSource = new EventSource('/api/audit/traces/stream');

    eventSource.onopen = () => {
      console.log('SSE connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'update' && data.latestTraces) {
          // Refresh traces when we get an update
          fetchTraces();
        }
      } catch {
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      console.log('SSE error, reconnecting...');
    };

    return () => {
      eventSource.close();
    };
  }, [isLive, fetchTraces]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleLoadMore = () => {
    fetchTraces(true);
  };

  return (
    <div className="min-h-screen bg-[#fffef5]">
      {/* Page Header */}
      <div className="border-b border-[#1e293b] bg-[#fefcf3] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-bold text-[#0f172a]">traces</h1>
              {isLive && (
                <span className="flex items-center gap-1.5 border border-[#10b981] bg-[#d1fae5] px-2 py-0.5 text-xs text-[#065f46]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#10b981]" />
                  live
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#64748b]">
              Agent execution traces and conversation logs
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`border px-4 py-2 font-mono text-sm ${
                isLive
                  ? 'border-[#10b981] bg-[#d1fae5] text-[#065f46]'
                  : 'border-[#1e293b] bg-[#fffef5] text-[#0f172a] hover:bg-[#fefce8]'
              }`}
            >
              {isLive ? 'live on' : 'go live'}
            </button>
            <button
              onClick={() => setShowExport(!showExport)}
              className="border border-[#1e293b] bg-[#fffef5] px-4 py-2 font-mono text-sm text-[#0f172a] hover:bg-[#fefce8]"
            >
              {showExport ? 'hide export' : 'export data'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Stats */}
          <div className="mb-6 border border-[#1e293b]">
            <StatsBar stats={stats} />
            <FilterBar filters={filters} onFilterChange={handleFilterChange} />
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 border border-[#ef4444] bg-[#fee2e2] p-4">
              <p className="font-mono text-sm text-[#991b1b]">
                {'\u2717'} Error: {error}
              </p>
              <button
                onClick={() => fetchTraces()}
                className="mt-2 text-xs text-[#991b1b] underline"
              >
                retry
              </button>
            </div>
          )}

          {/* Trace List */}
          <TraceList
            traces={traces}
            totalCount={totalCount}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            isLoading={isLoading}
          />
        </div>

        {/* Export Panel (Sidebar) */}
        {showExport && (
          <div className="w-80 border-l border-[#1e293b] bg-[#fefcf3] p-6">
            <ExportPanel />
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import type { TraceRecord, LangfuseDocument } from '@evilmartians/agent-prism-types';
import { langfuseSpanAdapter } from '@evilmartians/agent-prism-data';
import { TraceViewer } from '@/components/agent-prism/TraceViewer/TraceViewer';
import type { TraceViewerData } from '@/components/agent-prism/TraceViewer/TraceViewer';
import '@/components/agent-prism/theme/theme.css';

const PAGE_SIZE = 8;

interface LangfuseTraceResponse {
  id: string;
  name: string;
  agentName?: string;
  commandName?: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  spans?: Array<{
    id: string;
    traceId: string;
    name?: string;
    operationType: string;
    agentName?: string;
    startedAt?: string;
    endedAt?: string;
    durationMs?: number;
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    parentSpanId?: string | null;
  }>;
}

/**
 * Convert our Langfuse trace format to AgentPrism's expected LangfuseDocument format
 * Enhanced with rich attributes for better visualization
 */
function convertToLangfuseDocument(trace: LangfuseTraceResponse): LangfuseDocument {
  const observations = (trace.spans || []).map(span => {
    // Extract rich metadata for GenAI semantic conventions
    const metadata = span.metadata || {};
    const toolInput = span.input || {};
    const toolOutput = span.output || {};
    
    // Build enhanced metadata with GenAI attributes
    const enhancedMetadata: Record<string, unknown> = {
      ...metadata,
      // Agent info
      'agent.name': span.agentName || metadata.agent,
      // Tool info
      'tool.name': span.name || span.operationType,
      // Reasoning/thinking captured
      'gen_ai.reasoning': metadata.reasoning,
    };

    // Add status based on output
    let status: 'success' | 'error' | 'pending' = 'success';
    if (toolOutput.error || metadata.error) {
      status = 'error';
    }

    return {
      id: span.id,
      traceId: span.traceId,
      projectId: 'bigturbo',
      environment: 'production',
      parentObservationId: span.parentSpanId || null,
      startTime: span.startedAt || new Date().toISOString(),
      endTime: span.endedAt || new Date().toISOString(),
      name: formatSpanName(span),
      metadata: JSON.stringify(enhancedMetadata),
      type: mapOperationTypeToLangfuseType(span.operationType),
      input: JSON.stringify(toolInput),
      output: JSON.stringify(toolOutput),
      createdAt: span.startedAt || new Date().toISOString(),
      updatedAt: span.endedAt || new Date().toISOString(),
      latency: span.durationMs,
      level: (status === 'error' ? 'ERROR' : 'DEFAULT') as 'ERROR' | 'DEFAULT',
      statusMessage: status === 'error' ? (toolOutput.error as string) : undefined,
    };
  });

  return {
    trace: {
      id: trace.id,
      projectId: 'bigturbo',
      name: trace.name,
      timestamp: trace.startedAt || new Date().toISOString(),
      environment: 'production',
      tags: trace.agentName ? [trace.agentName] : [],
      bookmarked: false,
      release: null,
      version: null,
      public: false,
      input: trace.input ? JSON.stringify(trace.input) : undefined,
      output: trace.output ? JSON.stringify(trace.output) : undefined,
      metadata: trace.metadata ? JSON.stringify(trace.metadata) : undefined,
      createdAt: trace.startedAt || new Date().toISOString(),
      updatedAt: trace.endedAt || new Date().toISOString(),
      scores: [],
      latency: trace.durationMs,
    },
    observations,
  };
}

/**
 * Format span name to be more readable
 */
function formatSpanName(span: NonNullable<LangfuseTraceResponse['spans']>[number]): string {
  const name = span.name || span.operationType;
  const agentName = span.agentName;
  
  // If we have an agent, show it with the operation
  if (agentName && agentName !== 'command') {
    return `${name} (${agentName})`;
  }
  
  return name;
}

function mapOperationTypeToLangfuseType(operationType: string): 'SPAN' | 'GENERATION' | 'EVENT' | 'TOOL' | 'AGENT' {
  switch (operationType) {
    case 'llm_call':
      return 'GENERATION';
    case 'tool_use':
    case 'file_read':
    case 'file_write':
    case 'file_edit':
    case 'search':
    case 'command_execution':
      return 'TOOL';
    case 'subagent_launch':
    case 'subagent_completion':
      return 'AGENT';
    case 'decision':
    case 'validation':
    case 'handoff':
    case 'planning':
      return 'EVENT';
    default:
      return 'SPAN';
  }
}

export default function PrismPage() {
  const [traces, setTraces] = useState<LangfuseTraceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function fetchTraces() {
      setLoading(true);
      setError(null);
      try {
        // Fetch paginated traces list
        const listRes = await fetch(`/api/audit/traces?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`);
        if (!listRes.ok) throw new Error('Failed to fetch traces');
        const listData = await listRes.json();

        // Fetch full details for each trace (including spans)
        const fullTraces = await Promise.all(
          listData.traces.map(async (trace: { id: string }) => {
            const detailRes = await fetch(`/api/audit/traces/${trace.id}`);
            if (!detailRes.ok) return null;
            const data = await detailRes.json();
            return data.trace; // API returns { trace: ... }
          })
        );

        setTraces(fullTraces.filter(Boolean));
        setTotalCount(listData.count || fullTraces.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchTraces();
  }, [page]);

  const prismData: TraceViewerData[] = useMemo(() => {
    return traces.map(trace => {
      const langfuseDoc = convertToLangfuseDocument(trace);
      const spans = langfuseSpanAdapter.convertRawDocumentsToSpans([langfuseDoc]);

      // Calculate total duration for the trace
      const totalDuration = trace.durationMs || spans.reduce((sum, s) => sum + (s.duration || 0), 0);
      
      const traceRecord: TraceRecord = {
        id: trace.id,
        name: trace.name,
        spansCount: trace.spans?.length || 0,
        durationMs: totalDuration,
        agentDescription: (trace.agentName && trace.agentName !== 'command')
          ? trace.agentName 
          : '',
        startTime: trace.startedAt ? new Date(trace.startedAt).getTime() : Date.now(),
      };

      // Build badges - claude badge + agent badge if different
      const badges: Array<{ label: string; unstyled?: boolean; className?: string }> = [
        { 
          label: 'claude',
          unstyled: true,
          className: 'bg-[#E57B3A]/15 text-[#D4652D] border border-[#E57B3A]/30'
        }
      ];
      
      // Add specific agent badge if not "command"
      if (trace.agentName && trace.agentName !== 'command') {
        badges.push({
          label: trace.agentName,
          unstyled: true,
          className: 'bg-indigo-50 text-indigo-600 border border-indigo-200'
        });
      }

      return {
        traceRecord,
        spans,
        badges,
        spanCardViewOptions: {
          withStatus: true,
          expandButton: 'inside' as const,
        },
      };
    });
  }, [traces]);

  const canPrev = page > 0;
  const canNext = (page + 1) * PAGE_SIZE < totalCount;
  const rangeStart = page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(totalCount || rangeStart + prismData.length - 1, page * PAGE_SIZE + prismData.length);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#fffef5] font-mono">
        <div className="text-center">
          <div className="mb-4 text-4xl">{'\u2B21'}</div>
          <p className="text-[#64748b]">Loading traces...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-[#fffef5] font-mono">
        <div className="text-center">
          <div className="mb-4 text-4xl text-red-500">{'\u26A0'}</div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (prismData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[#fffef5] font-mono">
        <div className="text-center">
          <div className="mb-4 text-4xl text-[#cbd5e1]">{'\u2205'}</div>
          <p className="text-[#64748b]">No traces found</p>
          <p className="mt-2 text-sm text-[#94a3b8]">
            Run some /commands to generate traces
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ colorScheme: 'light' }}>
      <div className="flex-1 overflow-hidden">
        <TraceViewer data={prismData} />
      </div>
      <div className="border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <div className="flex items-center justify-between gap-3">
          <div>
            Showing {rangeStart}–{rangeEnd} of {totalCount || prismData.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`rounded border px-3 py-1 text-sm ${canPrev ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'}`}
              onClick={() => canPrev && setPage(prev => Math.max(0, prev - 1))}
              disabled={!canPrev}
            >
              Previous
            </button>
            <button
              type="button"
              className={`rounded border px-3 py-1 text-sm ${canNext ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'}`}
              onClick={() => canNext && setPage(prev => prev + 1)}
              disabled={!canNext}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

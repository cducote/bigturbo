/**
 * Metrics and Analytics for BigTurbo Agent Audit System
 *
 * Performance queries and statistics for agent monitoring.
 */

import { listTraces, getTraceStats } from '@/lib/langfuse/client';
import { parseAllAgents, extractAgentMetadata } from './parser';

// ============================================================================
// Types
// ============================================================================

export interface AgentMetrics {
  agentId: string;
  humanName: string;
  color: string;
  totalTraces: number;
  successRate: number;
  avgDurationMs: number;
  totalTokens: number;
  lastActive: string | null;
}

export interface ToolUsageMetrics {
  toolName: string;
  usageCount: number;
  successRate: number;
  avgDurationMs: number;
}

export interface WorkflowMetrics {
  workflowName: string;
  totalRuns: number;
  successRate: number;
  avgDurationMs: number;
  bottleneckAgent: string | null;
}

export interface DashboardMetrics {
  overview: {
    totalTraces: number;
    runningTraces: number;
    completedTraces: number;
    failedTraces: number;
    avgDurationMs: number;
    totalTokens: number;
  };
  agentMetrics: AgentMetrics[];
  toolUsage: ToolUsageMetrics[];
  recentActivity: {
    timestamp: string;
    agentId: string;
    action: string;
    status: string;
  }[];
}

// ============================================================================
// Agent Metrics
// ============================================================================

/**
 * Get metrics for all agents.
 */
export async function getAgentMetrics(): Promise<AgentMetrics[]> {
  const [{ agents }, { traces }] = await Promise.all([
    parseAllAgents(),
    listTraces({ limit: 100 }),
  ]);

  const agentStats = new Map<string, {
    total: number;
    success: number;
    failed: number;
    durations: number[];
    tokens: number;
    lastActive: string | null;
  }>();

  // Initialize stats for all agents
  for (const agent of agents) {
    const metadata = extractAgentMetadata(agent);
    agentStats.set(metadata.name, {
      total: 0,
      success: 0,
      failed: 0,
      durations: [],
      tokens: 0,
      lastActive: null,
    });
  }

  // Aggregate trace data by agent
  for (const trace of traces) {
    if (trace.agentName && agentStats.has(trace.agentName)) {
      const stats = agentStats.get(trace.agentName)!;
      stats.total++;

      if (trace.status === 'completed') stats.success++;
      if (trace.status === 'failed') stats.failed++;
      if (trace.durationMs) stats.durations.push(trace.durationMs);
      if (trace.totalTokens) stats.tokens += trace.totalTokens;

      if (!stats.lastActive || trace.startedAt > stats.lastActive) {
        stats.lastActive = trace.startedAt;
      }
    }
  }

  // Build metrics array
  const metrics: AgentMetrics[] = [];

  for (const agent of agents) {
    const metadata = extractAgentMetadata(agent);
    const stats = agentStats.get(metadata.name);

    if (stats) {
      const avgDuration = stats.durations.length > 0
        ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
        : 0;

      metrics.push({
        agentId: metadata.name,
        humanName: metadata.humanName || metadata.name,
        color: metadata.color || '#64748b',
        totalTraces: stats.total,
        successRate: stats.total > 0 ? stats.success / stats.total : 0,
        avgDurationMs: avgDuration,
        totalTokens: stats.tokens,
        lastActive: stats.lastActive,
      });
    }
  }

  // Sort by total traces descending
  return metrics.sort((a, b) => b.totalTraces - a.totalTraces);
}

// ============================================================================
// Tool Usage Metrics
// ============================================================================

/**
 * Get tool usage statistics.
 */
export async function getToolUsageMetrics(): Promise<ToolUsageMetrics[]> {
  const { traces } = await listTraces({ limit: 100 });

  const toolStats = new Map<string, {
    count: number;
    success: number;
    durations: number[];
  }>();

  // Aggregate tool calls from spans
  for (const trace of traces) {
    if (trace.spans) {
      for (const span of trace.spans) {
        if (span.toolCalls) {
          for (const call of span.toolCalls) {
            if (!toolStats.has(call.name)) {
              toolStats.set(call.name, { count: 0, success: 0, durations: [] });
            }

            const stats = toolStats.get(call.name)!;
            stats.count++;
            if (call.success) stats.success++;
            if (call.durationMs) stats.durations.push(call.durationMs);
          }
        }
      }
    }
  }

  // Build metrics array
  const metrics: ToolUsageMetrics[] = [];

  for (const [toolName, stats] of toolStats) {
    const avgDuration = stats.durations.length > 0
      ? stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length
      : 0;

    metrics.push({
      toolName,
      usageCount: stats.count,
      successRate: stats.count > 0 ? stats.success / stats.count : 0,
      avgDurationMs: avgDuration,
    });
  }

  // Sort by usage count descending
  return metrics.sort((a, b) => b.usageCount - a.usageCount);
}

// ============================================================================
// Dashboard Overview
// ============================================================================

/**
 * Get complete dashboard metrics.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [overview, agentMetrics, toolUsage, { traces }] = await Promise.all([
    getTraceStats(),
    getAgentMetrics(),
    getToolUsageMetrics(),
    listTraces({ limit: 10 }),
  ]);

  // Build recent activity from latest traces
  const recentActivity = traces.slice(0, 5).map((trace) => ({
    timestamp: trace.startedAt,
    agentId: trace.agentName || 'unknown',
    action: trace.name,
    status: trace.status,
  }));

  return {
    overview: {
      totalTraces: overview.total,
      runningTraces: overview.running,
      completedTraces: overview.completed,
      failedTraces: overview.failed,
      avgDurationMs: overview.avgDurationMs,
      totalTokens: overview.totalTokens,
    },
    agentMetrics,
    toolUsage,
    recentActivity,
  };
}

// ============================================================================
// Time-Series Data (for charts)
// ============================================================================

/**
 * Get traces over time for charting.
 */
export async function getTracesOverTime(days: number = 7): Promise<{
  date: string;
  total: number;
  success: number;
  failed: number;
}[]> {
  const { traces } = await listTraces({ limit: 500 });

  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Group by date
  const byDate = new Map<string, { total: number; success: number; failed: number }>();

  // Initialize all dates
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().split('T')[0];
    byDate.set(key, { total: 0, success: 0, failed: 0 });
  }

  // Aggregate traces
  for (const trace of traces) {
    const date = new Date(trace.startedAt).toISOString().split('T')[0];
    if (byDate.has(date)) {
      const stats = byDate.get(date)!;
      stats.total++;
      if (trace.status === 'completed') stats.success++;
      if (trace.status === 'failed') stats.failed++;
    }
  }

  // Convert to array
  return Array.from(byDate.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { AgentBadge } from '@/components/audit';

// ============================================================================
// Types
// ============================================================================

interface AgentMetrics {
  agentId: string;
  humanName: string;
  color: string;
  totalTraces: number;
  successRate: number;
  avgDurationMs: number;
  totalTokens: number;
}

interface ToolUsageMetrics {
  toolName: string;
  usageCount: number;
  successRate: number;
}

interface DashboardData {
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
  timeSeries: { date: string; total: number; success: number; failed: number }[];
}

// ============================================================================
// Stat Card Component
// ============================================================================

function StatCard({ label, value, subValue }: { label: string; value: string | number; subValue?: string }) {
  return (
    <div className="border border-[#1e293b] bg-[#fefcf3] p-4">
      <span className="text-xs text-[#64748b]">{label}</span>
      <p className="font-mono text-2xl font-bold text-[#0f172a]">{value}</p>
      {subValue && <p className="text-xs text-[#64748b]">{subValue}</p>}
    </div>
  );
}

// ============================================================================
// Main Metrics Page
// ============================================================================

export default function MetricsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/audit/metrics');
        if (!res.ok) throw new Error('Failed to fetch metrics');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-[#1e293b] pb-4">
          <h1 className="text-2xl font-bold text-[#0f172a]">Metrics</h1>
          <p className="text-sm text-[#64748b] mt-1">Agent performance analytics</p>
        </header>
        <div className="border border-[#1e293b] p-8 text-center">
          <p className="text-[#64748b] font-mono">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-[#1e293b] pb-4">
          <h1 className="text-2xl font-bold text-[#0f172a]">Metrics</h1>
        </header>
        <div className="border border-[#1e293b] p-8 text-center">
          <p className="text-[#ef4444] font-mono">Error: {error || 'No data'}</p>
        </div>
      </div>
    );
  }

  const { overview, agentMetrics, toolUsage, timeSeries } = data;

  // Status breakdown for pie chart
  const statusData = [
    { name: 'Completed', value: overview.completedTraces, color: '#10b981' },
    { name: 'Running', value: overview.runningTraces, color: '#f59e0b' },
    { name: 'Failed', value: overview.failedTraces, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 border-b border-[#1e293b] pb-4">
        <h1 className="text-2xl font-bold text-[#0f172a]">Metrics</h1>
        <p className="text-sm text-[#64748b] mt-1">Agent performance analytics and insights</p>
      </header>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="total traces" value={overview.totalTraces} />
        <StatCard
          label="success rate"
          value={`${overview.totalTraces > 0 ? ((overview.completedTraces / overview.totalTraces) * 100).toFixed(0) : 0}%`}
        />
        <StatCard
          label="avg duration"
          value={overview.avgDurationMs > 0 ? `${(overview.avgDurationMs / 1000).toFixed(1)}s` : '--'}
        />
        <StatCard
          label="total tokens"
          value={overview.totalTokens.toLocaleString()}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Traces Over Time */}
        <div className="border border-[#1e293b] bg-[#fefcf3] p-4">
          <h3 className="font-mono text-sm font-bold text-[#0f172a] mb-4">traces over time</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fefcf3',
                    border: '1px solid #1e293b',
                    fontFamily: 'monospace',
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="total" stroke="#1e293b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={1} dot={false} />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={1} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="border border-[#1e293b] bg-[#fefcf3] p-4">
          <h3 className="font-mono text-sm font-bold text-[#0f172a] mb-4">status breakdown</h3>
          <div className="h-48 flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fefcf3',
                      border: '1px solid #1e293b',
                      fontFamily: 'monospace',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-[#64748b] font-mono text-sm">No trace data</p>
            )}
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2" style={{ backgroundColor: d.color }} />
                <span className="text-[#0f172a]">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="border border-[#1e293b] bg-[#fefcf3] mb-8">
        <div className="border-b border-[#1e293b] bg-[#fefce8] px-4 py-3">
          <h3 className="font-mono text-sm font-bold text-[#0f172a]">agent performance</h3>
        </div>
        <div className="p-4">
          {agentMetrics.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentMetrics.slice(0, 8)} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="humanName"
                    tick={{ fontSize: 10, fill: '#0f172a' }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fefcf3',
                      border: '1px solid #1e293b',
                      fontFamily: 'monospace',
                      fontSize: 12,
                    }}
                    formatter={(value, name) => {
                      const numValue = typeof value === 'number' ? value : 0;
                      if (name === 'totalTraces') return [numValue, 'Traces'];
                      if (name === 'successRate') return [`${(numValue * 100).toFixed(0)}%`, 'Success'];
                      return [numValue, String(name)];
                    }}
                  />
                  <Bar dataKey="totalTraces" fill="#1e293b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-[#64748b] font-mono py-8">No agent data available</p>
          )}
        </div>
      </div>

      {/* Agent Details Table */}
      <div className="border border-[#1e293b] bg-[#fefcf3] mb-8">
        <div className="border-b border-[#1e293b] bg-[#fefce8] px-4 py-3">
          <h3 className="font-mono text-sm font-bold text-[#0f172a]">agent details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-sm">
            <thead>
              <tr className="border-b border-[#1e293b] bg-[#fffef5]">
                <th className="px-4 py-2 text-left text-xs text-[#64748b]">agent</th>
                <th className="px-4 py-2 text-left text-xs text-[#64748b]">id</th>
                <th className="px-4 py-2 text-right text-xs text-[#64748b]">traces</th>
                <th className="px-4 py-2 text-right text-xs text-[#64748b]">success</th>
                <th className="px-4 py-2 text-right text-xs text-[#64748b]">avg time</th>
                <th className="px-4 py-2 text-right text-xs text-[#64748b]">tokens</th>
              </tr>
            </thead>
            <tbody>
              {agentMetrics.map((agent) => (
                <tr key={agent.agentId} className="border-b border-[#e2e8f0]">
                  <td className="px-4 py-2">
                    <AgentBadge agentId={agent.agentId} showHumanName />
                  </td>
                  <td className="px-4 py-2 text-left text-xs">
                    <span style={{ color: agent.color }}>{agent.agentId}</span>
                  </td>
                  <td className="px-4 py-2 text-right text-[#0f172a]">{agent.totalTraces}</td>
                  <td className="px-4 py-2 text-right text-[#0f172a]">
                    {(agent.successRate * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-2 text-right text-[#0f172a]">
                    {agent.avgDurationMs > 0 ? `${(agent.avgDurationMs / 1000).toFixed(1)}s` : '--'}
                  </td>
                  <td className="px-4 py-2 text-right text-[#0f172a]">
                    {agent.totalTokens.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tool Usage */}
      <div className="border border-[#1e293b] bg-[#fefcf3]">
        <div className="border-b border-[#1e293b] bg-[#fefce8] px-4 py-3">
          <h3 className="font-mono text-sm font-bold text-[#0f172a]">tool usage</h3>
        </div>
        <div className="p-4">
          {toolUsage.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {toolUsage.slice(0, 8).map((tool) => (
                <div
                  key={tool.toolName}
                  className="border border-[#1e293b] bg-[#fffef5] px-3 py-2"
                >
                  <p className="font-mono text-sm font-medium text-[#0f172a]">{tool.toolName}</p>
                  <p className="text-xs text-[#64748b]">
                    {tool.usageCount} calls | {(tool.successRate * 100).toFixed(0)}% success
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[#64748b] font-mono py-4">No tool usage data</p>
          )}
        </div>
      </div>
    </div>
  );
}

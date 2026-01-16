import Link from 'next/link';
import { StatCard, AgentBadge } from '@/components/audit';

export const dynamic = 'force-dynamic';

async function getStats() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const [agentsRes, workflowsRes, commandsRes, tracesRes] = await Promise.all([
      fetch(`${baseUrl}/api/audit/agents`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/audit/workflows`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/audit/commands`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/audit/traces?limit=10`, { cache: 'no-store' }),
    ]);

    const [agentsData, workflowsData, commandsData, tracesData] = await Promise.all([
      agentsRes.ok ? agentsRes.json() : { count: 0 },
      workflowsRes.ok ? workflowsRes.json() : { workflows: [] },
      commandsRes.ok ? commandsRes.json() : { commands: [] },
      tracesRes.ok ? tracesRes.json() : { traces: [], count: 0 },
    ]);

    const runningTraces = (tracesData.traces || []).filter((t: { status: string }) => t.status === 'running');

    return {
      agentCount: agentsData.count || 0,
      workflowCount: workflowsData.workflows?.length || 0,
      commandCount: commandsData.commands?.length || 0,
      traceCount: tracesData.count || 0,
      activeAgents: runningTraces.length,
      recentTraces: tracesData.traces || [],
    };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return {
      agentCount: 0,
      workflowCount: 0,
      commandCount: 0,
      traceCount: 0,
      activeAgents: 0,
      recentTraces: [],
    };
  }
}

export default async function AuditDashboardPage() {
  const stats = await getStats();

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 border-b border-[#1e293b] pb-4">
        <h1 className="text-2xl font-bold text-[#1e293b]">Agent Audit Dashboard</h1>
        <p className="text-sm text-[#1e293b]/70 mt-1">
          Monitor and inspect your BigTurbo agent system
        </p>
      </header>

      <section className="mb-8">
        <h2 className="text-sm text-[#1e293b]/50 uppercase tracking-wide mb-4">
          System Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="Agents"
            value={stats.agentCount}
            subtitle="Defined agents"
          />
          <StatCard
            label="Active"
            value={stats.activeAgents}
            subtitle="Running now"
          />
          <StatCard
            label="Traces"
            value={stats.traceCount}
            subtitle="Total recorded"
          />
          <StatCard
            label="Workflows"
            value={stats.workflowCount}
            subtitle="Defined workflows"
          />
          <StatCard
            label="Commands"
            value={stats.commandCount}
            subtitle="Available commands"
          />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm text-[#1e293b]/50 uppercase tracking-wide mb-4">
          Quick Links
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/audit/agents"
            className="group block border border-[#1e293b] p-4 hover:bg-[#1e293b] transition-colors"
          >
            <span className="text-sm font-bold text-[#1e293b] group-hover:text-[#fefcf3]">View Agent Roster</span>
            <p className="text-sm mt-1 text-[#1e293b]/70 group-hover:text-[#fefcf3]/70">Browse all agents</p>
          </Link>
          <Link
            href="/audit/workflows"
            className="group block border border-[#1e293b] p-4 hover:bg-[#1e293b] transition-colors"
          >
            <span className="text-sm font-bold text-[#1e293b] group-hover:text-[#fefcf3]">Workflow Visualizer</span>
            <p className="text-sm mt-1 text-[#1e293b]/70 group-hover:text-[#fefcf3]/70">View agent workflows</p>
          </Link>
          <Link
            href="/audit/prompts"
            className="group block border border-[#1e293b] p-4 hover:bg-[#1e293b] transition-colors"
          >
            <span className="text-sm font-bold text-[#1e293b] group-hover:text-[#fefcf3]">Prompt Browser</span>
            <p className="text-sm mt-1 text-[#1e293b]/70 group-hover:text-[#fefcf3]/70">Inspect raw prompts</p>
          </Link>
          <Link
            href="/audit/traces"
            className="group block border border-[#1e293b] p-4 hover:bg-[#1e293b] transition-colors"
          >
            <span className="text-sm font-bold text-[#1e293b] group-hover:text-[#fefcf3]">View Traces</span>
            <p className="text-sm mt-1 text-[#1e293b]/70 group-hover:text-[#fefcf3]/70">Execution logs</p>
          </Link>
          <Link
            href="/audit/metrics"
            className="group block border border-[#1e293b] p-4 hover:bg-[#1e293b] transition-colors"
          >
            <span className="text-sm font-bold text-[#1e293b] group-hover:text-[#fefcf3]">Metrics</span>
            <p className="text-sm mt-1 text-[#1e293b]/70 group-hover:text-[#fefcf3]/70">Performance stats</p>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-sm text-[#1e293b]/50 uppercase tracking-wide mb-4">
          Recent Activity
        </h2>
        <div className="border border-[#1e293b]">
          {stats.recentTraces.length > 0 ? (
            <div>
              {stats.recentTraces.slice(0, 5).map((trace: { id: string; traceId: string; name: string; agentName?: string; status: string; startedAt: string }) => (
                <Link
                  key={trace.id || trace.traceId}
                  href={`/audit/traces/${trace.traceId || trace.id}`}
                  className="flex items-center justify-between border-b border-[#e2e8f0] p-4 hover:bg-[#fefce8] last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    {trace.agentName && <AgentBadge agentId={trace.agentName} />}
                    <span className="font-mono text-sm text-[#0f172a]">{trace.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={`px-2 py-0.5 border ${
                      trace.status === 'completed' ? 'border-[#10b981] bg-[#d1fae5] text-[#065f46]' :
                      trace.status === 'running' ? 'border-[#f59e0b] bg-[#fef3c7] text-[#92400e]' :
                      'border-[#ef4444] bg-[#fee2e2] text-[#991b1b]'
                    }`}>
                      {trace.status}
                    </span>
                    <span className="text-[#64748b]">
                      {new Date(trace.startedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-[#64748b]">No recent activity</p>
              <p className="text-xs text-[#94a3b8] mt-1">Traces will appear here as agents execute</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

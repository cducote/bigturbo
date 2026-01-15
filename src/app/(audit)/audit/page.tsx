import Link from 'next/link';
import { StatCard } from '@/components/audit';

export const dynamic = 'force-dynamic';

async function getStats() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const [agentsRes, workflowsRes, commandsRes] = await Promise.all([
      fetch(`${baseUrl}/api/audit/agents`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/audit/workflows`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/audit/commands`, { cache: 'no-store' }),
    ]);

    const [agentsData, workflowsData, commandsData] = await Promise.all([
      agentsRes.ok ? agentsRes.json() : { count: 0 },
      workflowsRes.ok ? workflowsRes.json() : { workflows: [] },
      commandsRes.ok ? commandsRes.json() : { commands: [] },
    ]);

    return {
      agentCount: agentsData.count || 0,
      workflowCount: workflowsData.workflows?.length || 0,
      commandCount: commandsData.commands?.length || 0,
    };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return {
      agentCount: 0,
      workflowCount: 0,
      commandCount: 0,
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Agents"
            value={stats.agentCount}
            subtitle="Active agents in system"
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
            href="/api/audit/sync"
            className="group block border border-[#1e293b] p-4 hover:bg-[#1e293b] transition-colors"
          >
            <span className="text-sm font-bold text-[#1e293b] group-hover:text-[#fefcf3]">Sync Data</span>
            <p className="text-sm mt-1 text-[#1e293b]/70 group-hover:text-[#fefcf3]/70">Refresh from files</p>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-sm text-[#1e293b]/50 uppercase tracking-wide mb-4">
          Recent Activity
        </h2>
        <div className="border border-[#1e293b] p-6">
          <p className="text-sm text-[#1e293b]/70 text-center">
            Activity tracking coming soon
          </p>
          <p className="text-sm text-[#1e293b]/70 text-center mt-2">
            This section will display recent agent invocations and workflow executions
          </p>
        </div>
      </section>
    </div>
  );
}

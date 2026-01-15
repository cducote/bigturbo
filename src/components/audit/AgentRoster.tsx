'use client';

import { AgentCard } from './AgentCard';

export interface AgentRosterAgent {
  name: string;
  humanName?: string | null;
  color?: string | null;
  description: string | null;
  tools?: string[];
  capabilities: string[];
}

export interface AgentRosterProps {
  agents: AgentRosterAgent[];
}

export function AgentRoster({ agents }: AgentRosterProps) {
  if (agents.length === 0) {
    return (
      <div className="border border-[#1e293b] bg-[#fefcf3] p-8 text-center font-mono">
        <div className="text-[#1e293b] opacity-60">
          <div className="mb-2 text-2xl">{'\u00f8'}</div>
          <div className="text-sm">no agents found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <AgentCard key={agent.name} agent={agent} />
      ))}
    </div>
  );
}

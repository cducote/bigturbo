'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar, AgentRoster } from '@/components/audit';
import type { AgentRosterAgent } from '@/components/audit/AgentRoster';

export default function AgentsPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [searchValue, setSearchValue] = useState(searchQuery);
  const [agents, setAgents] = useState<AgentRosterAgent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<AgentRosterAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/audit/agents');
        if (!res.ok) {
          throw new Error('Failed to fetch agents');
        }
        const data = await res.json();
        setAgents(data.agents || []);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    fetchAgents();
  }, []);

  const filterAgents = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredAgents(agents);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(lowerQuery) ||
        (agent.description?.toLowerCase().includes(lowerQuery) ?? false) ||
        agent.capabilities.some((cap) => cap.toLowerCase().includes(lowerQuery))
    );
    setFilteredAgents(filtered);
  }, [agents]);

  useEffect(() => {
    filterAgents(searchValue);
  }, [searchValue, filterAgents]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-[#1e293b] pb-4">
          <h1 className="text-2xl font-bold text-[#1e293b]">Agent Roster</h1>
          <p className="text-sm text-[#1e293b]/70 mt-1">
            Browse and inspect all available agents
          </p>
        </header>
        <div className="border border-[#1e293b] p-8 text-center">
          <p className="text-[#1e293b]/70">Loading agents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-[#1e293b] pb-4">
          <h1 className="text-2xl font-bold text-[#1e293b]">Agent Roster</h1>
          <p className="text-sm text-[#1e293b]/70 mt-1">
            Browse and inspect all available agents
          </p>
        </header>
        <div className="border border-[#1e293b] p-8 text-center">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 border-b border-[#1e293b] pb-4">
        <h1 className="text-2xl font-bold text-[#1e293b]">Agent Roster</h1>
        <p className="text-sm text-[#1e293b]/70 mt-1">
          Browse and inspect all available agents
        </p>
      </header>

      <div className="mb-6">
        <SearchBar
          value={searchValue}
          onChange={handleSearchChange}
          placeholder="search agents by name, description, or capability..."
        />
      </div>

      <div className="mb-4">
        <p className="text-xs text-[#1e293b]/50">
          Showing {filteredAgents.length} of {agents.length} agents
          {searchValue && ` matching "${searchValue}"`}
        </p>
      </div>

      <AgentRoster agents={filteredAgents} />
    </div>
  );
}

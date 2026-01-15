import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PromptViewer } from '@/components/audit';
import type { Agent } from '@/types/audit';

export const dynamic = 'force-dynamic';

interface AgentDetailPageProps {
  params: Promise<{
    name: string;
  }>;
}

async function getAgent(name: string): Promise<Agent | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/audit/agents/${encodeURIComponent(name)}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch agent');
    }

    const data = await res.json();
    return data.agent;
  } catch (error) {
    console.error('Error fetching agent:', error);
    return null;
  }
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { name } = await params;
  const agent = await getAgent(name);

  if (!agent) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/audit/agents"
          className="text-sm text-[#1e293b]/70 hover:text-[#1e293b] transition-colors"
        >
          &larr; Back to Agent Roster
        </Link>
      </div>

      <header className="mb-8 border-b border-[#1e293b] pb-4">
        <h1 className="text-2xl font-bold text-[#1e293b]">{agent.name}</h1>
        <p className="text-sm text-[#1e293b]/70 mt-1">{agent.filePath}</p>
      </header>

      <section className="mb-8">
        <h2 className="text-sm text-[#1e293b]/50 uppercase tracking-wide mb-4">
          Description
        </h2>
        <div className="border border-[#1e293b] p-4">
          <p className="text-[#1e293b]">
            {agent.description || 'No description available'}
          </p>
        </div>
      </section>

      {agent.capabilities.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm text-[#1e293b]/50 uppercase tracking-wide mb-4">
            Capabilities ({agent.capabilities.length})
          </h2>
          <div className="border border-[#1e293b] p-4">
            <ul className="space-y-2">
              {agent.capabilities.map((cap, i) => (
                <li key={i} className="flex items-start gap-2 text-[#1e293b]">
                  <span className="text-[#1e293b]/50">&bull;</span>
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {agent.collaborators.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm text-[#1e293b]/50 uppercase tracking-wide mb-4">
            Collaborates With ({agent.collaborators.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {agent.collaborators.map((collab, i) => (
              <Link
                key={i}
                href={`/audit/agents/${encodeURIComponent(collab)}`}
                className="px-3 py-1 text-sm border border-[#1e293b] text-[#1e293b] hover:bg-[#1e293b] hover:text-[#fefcf3] transition-colors"
              >
                {collab}
              </Link>
            ))}
          </div>
        </section>
      )}

      {agent.rawContent && (
        <section className="mb-8">
          <h2 className="text-sm text-[#1e293b]/50 uppercase tracking-wide mb-4">
            Raw Prompt Content
          </h2>
          <PromptViewer
            title={`${agent.name} Prompt`}
            content={agent.rawContent}
          />
        </section>
      )}

      <footer className="border-t border-[#1e293b] pt-4 text-xs text-[#1e293b]/50">
        <p>Agent ID: {agent.id}</p>
        <p>Last synced: {new Date(agent.lastSynced).toLocaleString()}</p>
      </footer>
    </div>
  );
}

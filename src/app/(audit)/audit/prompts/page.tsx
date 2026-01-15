import { PromptViewer } from '@/components/audit';
import type { Agent } from '@/types/audit';

export const dynamic = 'force-dynamic';

interface AgentWithContent extends Agent {
  rawContent?: string;
}

async function getAgentsWithContent(): Promise<AgentWithContent[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    // First get the list of agents
    const listRes = await fetch(`${baseUrl}/api/audit/agents`, {
      cache: 'no-store',
    });

    if (!listRes.ok) {
      throw new Error('Failed to fetch agents list');
    }

    const listData = await listRes.json();
    const agents: Agent[] = listData.agents || [];

    // Then fetch each agent's full content
    const agentsWithContent = await Promise.all(
      agents.map(async (agent) => {
        try {
          const detailRes = await fetch(
            `${baseUrl}/api/audit/agents/${encodeURIComponent(agent.name)}`,
            { cache: 'no-store' }
          );

          if (!detailRes.ok) {
            return { ...agent, rawContent: undefined };
          }

          const detailData = await detailRes.json();
          return detailData.agent as AgentWithContent;
        } catch {
          return { ...agent, rawContent: undefined };
        }
      })
    );

    return agentsWithContent;
  } catch (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
}

export default async function PromptsPage() {
  const agents = await getAgentsWithContent();

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 border-b border-[#1e293b] pb-4">
        <h1 className="text-2xl font-bold text-[#1e293b]">Prompt Browser</h1>
        <p className="text-sm text-[#1e293b]/70 mt-1">
          View and inspect raw agent prompt configurations
        </p>
      </header>

      {agents.length === 0 ? (
        <div className="border border-[#1e293b] p-8 text-center">
          <p className="text-[#1e293b]/70">No prompts found</p>
          <p className="text-xs text-[#1e293b]/50 mt-2">
            Agent prompts are loaded from .claude/agents/*.md files
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-xs text-[#1e293b]/50">
              {agents.length} agent prompt{agents.length !== 1 ? 's' : ''} available
            </p>
          </div>

          <div className="space-y-6">
            {agents.map((agent) =>
              agent.rawContent ? (
                <PromptViewer
                  key={agent.id}
                  title={agent.name}
                  content={agent.rawContent}
                />
              ) : (
                <div
                  key={agent.id}
                  className="border border-[#1e293b] p-4"
                >
                  <h3 className="font-bold text-[#1e293b]">{agent.name}</h3>
                  <p className="text-sm text-[#1e293b]/50 mt-1">
                    Raw content not available
                  </p>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

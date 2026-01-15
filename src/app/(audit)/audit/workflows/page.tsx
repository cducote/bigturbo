import { WorkflowDiagram } from '@/components/audit';
import type { WorkflowData } from '@/components/audit/WorkflowDiagram';

export const dynamic = 'force-dynamic';

interface ApiWorkflow {
  id: string;
  name: string;
  description: string;
  agents: string[];
  steps: Array<{
    order: number;
    agent: string;
    action: string;
    output?: string;
  }>;
  lastSynced: string;
}

async function getWorkflows(): Promise<WorkflowData[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/audit/workflows`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch workflows');
    }

    const data = await res.json();
    const apiWorkflows: ApiWorkflow[] = data.workflows || [];

    // Transform API workflow to WorkflowData format
    return apiWorkflows.map((w) => ({
      name: w.name,
      description: w.description,
      agents: w.agents,
      steps: w.steps,
    }));
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return [];
  }
}

export default async function WorkflowsPage() {
  const workflows = await getWorkflows();

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 border-b border-[#1e293b] pb-4">
        <h1 className="text-2xl font-bold text-[#1e293b]">Workflows</h1>
        <p className="text-sm text-[#1e293b]/70 mt-1">
          Visualize agent orchestration workflows
        </p>
      </header>

      {workflows.length === 0 ? (
        <div className="border border-[#1e293b] p-8 text-center">
          <p className="text-[#1e293b]/70">No workflows found</p>
          <p className="text-xs text-[#1e293b]/50 mt-2">
            Workflows are extracted from command files that define agent sequences
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-xs text-[#1e293b]/50">
              {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} defined
            </p>
          </div>

          <div className="space-y-6">
            {workflows.map((workflow, index) => (
              <WorkflowDiagram key={`${workflow.name}-${index}`} workflow={workflow} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

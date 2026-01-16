import { WorkflowsClient } from '@/components/audit';
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
      id: w.id,
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

      <WorkflowsClient workflows={workflows} />
    </div>
  );
}

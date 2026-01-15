/**
 * GET /api/audit/workflows
 *
 * Lists all workflows that orchestrate multiple agents.
 * Workflows are extracted from command files that define agent sequences.
 *
 * Response: { workflows: Workflow[] }
 */

import { NextResponse } from 'next/server';
import { parseAllWorkflows } from '@/lib/audit/parser';
import type { Workflow, WorkflowsListResponse, ErrorResponse } from '@/types/audit';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<WorkflowsListResponse | ErrorResponse>> {
  try {
    // Parse all workflows from command files
    const parsedWorkflows = await parseAllWorkflows();

    // Transform parsed workflows to API response format
    const workflows: Workflow[] = parsedWorkflows.map((parsed) => ({
      id: parsed.id,
      name: parsed.name,
      description: parsed.description,
      agents: parsed.agents,
      steps: parsed.steps,
      lastSynced: parsed.lastSynced,
    }));

    const response: WorkflowsListResponse = {
      workflows,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: errorMessage,
      statusCode: 500,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

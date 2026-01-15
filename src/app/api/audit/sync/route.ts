/**
 * POST /api/audit/sync
 *
 * Re-parses all .claude/ markdown files to synchronize the system state.
 * This endpoint scans the .claude/agents/ and .claude/commands/ directories
 * and updates the internal registry with the latest configurations.
 *
 * Request Body: None required (empty body or {})
 *
 * Response: { synced: number, agents: number, commands: number, workflows: number, timestamp: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncLegacy } from '@/lib/audit/parser';
import type { SyncResponse, ErrorResponse } from '@/types/audit';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest): Promise<NextResponse<SyncResponse | ErrorResponse>> {
  try {
    // Parse and sync all .claude/ files
    const syncResult = await syncLegacy();

    // Calculate totals
    const agentCount = syncResult.agents.length;
    const commandCount = syncResult.commands.length;
    const workflowCount = syncResult.workflows.length;
    const totalSynced = agentCount + commandCount;

    const response: SyncResponse = {
      synced: totalSynced,
      agents: agentCount,
      commands: commandCount,
      workflows: workflowCount,
      timestamp: syncResult.timestamp,
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
      message: `Sync operation failed: ${errorMessage}`,
      statusCode: 500,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

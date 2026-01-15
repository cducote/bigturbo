/**
 * GET /api/audit/agents
 *
 * Lists all agents with optional search and filter capabilities.
 *
 * Query Parameters:
 *   - search: Filter agents by name or description (optional)
 *   - capability: Filter agents by capability (optional)
 *   - limit: Maximum number of results (optional, default: 50)
 *   - offset: Pagination offset (optional, default: 0)
 *
 * Response: { agents: Agent[], count: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseAllAgents, extractAgentMetadata } from '@/lib/audit/parser';
import type { Agent, AgentsListResponse, ErrorResponse } from '@/types/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse<AgentsListResponse | ErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('search')?.toLowerCase();
    const capability = searchParams.get('capability')?.toLowerCase();
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Parse all agents from .claude/agents/*.md files
    const { agents: parsedAgents } = await parseAllAgents();

    // Transform parsed agents to API response format
    const agents: Agent[] = parsedAgents.map((parsed) => {
      const metadata = extractAgentMetadata(parsed);
      return {
        id: metadata.name,
        name: metadata.name,
        humanName: metadata.humanName,
        color: metadata.color,
        description: metadata.description,
        filePath: parsed.filePath,
        capabilities: metadata.capabilities,
        collaborators: metadata.collaborators,
        lastSynced: new Date().toISOString(),
      };
    });

    // Filter agents based on query parameters
    let filteredAgents = [...agents];

    if (search) {
      filteredAgents = filteredAgents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(search) ||
          agent.description.toLowerCase().includes(search)
      );
    }

    if (capability) {
      filteredAgents = filteredAgents.filter((agent) =>
        agent.capabilities.some((cap) => cap.toLowerCase().includes(capability))
      );
    }

    // Apply pagination
    const totalCount = filteredAgents.length;
    const paginatedAgents = filteredAgents.slice(offset, offset + limit);

    const response: AgentsListResponse = {
      agents: paginatedAgents,
      count: totalCount,
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

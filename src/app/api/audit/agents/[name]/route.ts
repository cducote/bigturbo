/**
 * GET /api/audit/agents/[name]
 *
 * Retrieves a single agent by name.
 *
 * Path Parameters:
 *   - name: The unique identifier/name of the agent
 *
 * Response:
 *   - 200: { agent: Agent }
 *   - 404: { error: string, message: string, statusCode: 404 }
 */

import { NextRequest, NextResponse } from 'next/server';
import { findAgentByName, extractAgentMetadata } from '@/lib/audit/parser';
import type { Agent, AgentResponse, ErrorResponse } from '@/types/audit';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    name: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AgentResponse | ErrorResponse>> {
  try {
    const { name } = await params;

    // Normalize the name for lookup (handle URL encoding)
    const normalizedName = decodeURIComponent(name);

    // Find agent by name from parsed markdown files
    const parsedAgent = await findAgentByName(normalizedName);

    if (!parsedAgent) {
      const errorResponse: ErrorResponse = {
        error: 'Not Found',
        message: `Agent '${name}' not found`,
        statusCode: 404,
      };

      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Extract metadata including humanName and color
    const metadata = extractAgentMetadata(parsedAgent);

    // Transform to API response format
    const agent: Agent = {
      id: metadata.name,
      name: metadata.name,
      humanName: metadata.humanName,
      color: metadata.color,
      description: metadata.description,
      filePath: parsedAgent.filePath,
      capabilities: metadata.capabilities,
      collaborators: metadata.collaborators,
      lastSynced: new Date().toISOString(),
      rawContent: parsedAgent.content,
    };

    const response: AgentResponse = {
      agent,
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

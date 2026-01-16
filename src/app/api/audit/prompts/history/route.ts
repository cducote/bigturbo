/**
 * GET /api/audit/prompts/history
 *
 * Returns git version history for an agent prompt file.
 *
 * Query Parameters:
 *   - agent: Agent name (required) - e.g., "fullstack-developer"
 *   - limit: Maximum number of versions (optional, default: 10)
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { isGitRepository, getFileHistory } from '@/lib/audit/git';
import type { GitCommit } from '@/lib/audit/git';

export const dynamic = 'force-dynamic';

interface VersionHistoryResponse {
  agent: string;
  filePath: string;
  isGitRepo: boolean;
  versions: Array<{
    commit: GitCommit;
    hasContent: boolean;
  }>;
}

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<VersionHistoryResponse | ErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get('agent');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    if (!agentName) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Missing required parameter: agent',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // Sanitize agent name to prevent path traversal
    const sanitizedName = agentName.replace(/[^a-zA-Z0-9-_]/g, '');
    if (sanitizedName !== agentName) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid agent name format',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), '.claude', 'agents', `${sanitizedName}.md`);

    // Check if git is available
    const isGitRepo = await isGitRepository();
    if (!isGitRepo) {
      return NextResponse.json({
        agent: sanitizedName,
        filePath,
        isGitRepo: false,
        versions: [],
      });
    }

    // Get version history
    const history = await getFileHistory(filePath, limit);

    // Mark which versions have content
    const versions = history.map((commit) => ({
      commit,
      hasContent: true, // We assume all commits have content since they're in history
    }));

    return NextResponse.json(
      {
        agent: sanitizedName,
        filePath,
        isGitRepo: true,
        versions,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: errorMessage,
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}

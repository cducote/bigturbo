/**
 * GET /api/audit/prompts/version
 *
 * Returns content of a specific version of an agent prompt file.
 *
 * Query Parameters:
 *   - agent: Agent name (required)
 *   - commit: Git commit hash (required)
 *   - diff: If "true", also returns diff from previous version
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getFileVersion, getFileHistory, getFileDiff } from '@/lib/audit/git';
import type { FileVersion, GitCommit } from '@/lib/audit/git';

export const dynamic = 'force-dynamic';

interface VersionResponse {
  agent: string;
  version: FileVersion;
  diff?: {
    additions: number;
    deletions: number;
    diff: string;
    previousCommit: GitCommit | null;
  };
}

interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<VersionResponse | ErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get('agent');
    const commitHash = searchParams.get('commit');
    const includeDiff = searchParams.get('diff') === 'true';

    if (!agentName || !commitHash) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Missing required parameters: agent, commit',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = agentName.replace(/[^a-zA-Z0-9-_]/g, '');
    const sanitizedHash = commitHash.replace(/[^a-fA-F0-9]/g, '');

    if (sanitizedName !== agentName || sanitizedHash !== commitHash) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid parameter format',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    const filePath = path.join(process.cwd(), '.claude', 'agents', `${sanitizedName}.md`);

    // Get the version content
    const version = await getFileVersion(filePath, sanitizedHash);
    if (!version) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'Version not found',
          statusCode: 404,
        },
        { status: 404 }
      );
    }

    const response: VersionResponse = {
      agent: sanitizedName,
      version,
    };

    // Get diff if requested
    if (includeDiff) {
      const history = await getFileHistory(filePath, 50);
      const currentIndex = history.findIndex(
        (c) => c.hash === sanitizedHash || c.shortHash === sanitizedHash
      );

      // Find the previous version (next in array since history is newest-first)
      const previousCommit = currentIndex >= 0 && currentIndex < history.length - 1
        ? history[currentIndex + 1]
        : null;

      const diffResult = await getFileDiff(
        filePath,
        previousCommit?.hash || null,
        sanitizedHash
      );

      if (diffResult) {
        response.diff = {
          additions: diffResult.additions,
          deletions: diffResult.deletions,
          diff: diffResult.diff,
          previousCommit,
        };
      }
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
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

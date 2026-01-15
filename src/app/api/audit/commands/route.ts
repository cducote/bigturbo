/**
 * GET /api/audit/commands
 *
 * Lists all commands defined in .claude/commands/*.md files.
 *
 * Response: { commands: Command[] }
 */

import { NextResponse } from 'next/server';
import { getAllCommandsLegacy } from '@/lib/audit/parser';
import type { Command, CommandsListResponse, ErrorResponse } from '@/types/audit';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<CommandsListResponse | ErrorResponse>> {
  try {
    // Parse all commands from .claude/commands/*.md files
    const parsedCommands = await getAllCommandsLegacy();

    // Transform parsed commands to API response format
    const commands: Command[] = parsedCommands.map((parsed) => ({
      id: parsed.id,
      name: parsed.name,
      description: parsed.description,
      filePath: parsed.filePath,
      usage: parsed.usage,
      examples: parsed.examples,
      lastSynced: parsed.lastSynced,
    }));

    const response: CommandsListResponse = {
      commands,
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

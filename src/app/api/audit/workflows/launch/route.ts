/**
 * POST /api/audit/workflows/launch
 *
 * Generates the launch command and prompt for a workflow based on user answers.
 * This endpoint takes a workflow ID and the user's configuration answers,
 * then generates a formatted prompt ready for Claude to execute.
 *
 * Request Body:
 *   {
 *     "workflowId": "spot-workflow",
 *     "answers": [
 *       { "questionId": "agents", "selectedOptions": ["api-designer", "backend-developer"] },
 *       { "questionId": "changeType", "selectedOptions": ["Feature"], "customText": "Add user auth" }
 *     ]
 *   }
 *
 * Response:
 *   {
 *     "command": "claude --plan '/spot'",
 *     "prompt": "/spot\n\nContext:\n- Change Type: Feature\n...",
 *     "copyableText": "/spot\n\nContext:\n..."
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseAllWorkflows } from '@/lib/audit/parser';
import type {
  WorkflowLaunchRequest,
  WorkflowLaunchResponse,
  WorkflowAnswer,
  ErrorResponse,
} from '@/types/audit';

export const dynamic = 'force-dynamic';

/**
 * Sanitize user input to prevent injection attacks.
 * Removes potentially dangerous characters while preserving readability.
 */
function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Remove control characters and limit length
  return input
    .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .slice(0, 2000); // Limit length to prevent abuse
}

/**
 * Sanitize an array of strings.
 */
function sanitizeArray(arr: string[]): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.map(sanitizeInput).filter(Boolean);
}

/**
 * Validate the request body structure.
 */
function isValidRequest(body: unknown): body is WorkflowLaunchRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const req = body as Record<string, unknown>;

  // Check workflowId
  if (typeof req.workflowId !== 'string' || req.workflowId.trim() === '') {
    return false;
  }

  // Check answers array
  if (!Array.isArray(req.answers)) {
    return false;
  }

  // Validate each answer
  for (const answer of req.answers) {
    if (typeof answer !== 'object' || answer === null) {
      return false;
    }
    const ans = answer as Record<string, unknown>;
    if (typeof ans.questionId !== 'string') {
      return false;
    }
    if (!Array.isArray(ans.selectedOptions)) {
      return false;
    }
    if (ans.customText !== undefined && typeof ans.customText !== 'string') {
      return false;
    }
  }

  return true;
}

/**
 * Extract the command name from workflow ID.
 * e.g., "spot-workflow" -> "spot"
 */
function extractCommandName(workflowId: string): string {
  return workflowId.replace(/-workflow$/, '');
}

/**
 * Find an answer by question ID.
 */
function findAnswer(answers: WorkflowAnswer[], questionId: string): WorkflowAnswer | undefined {
  return answers.find((a) => a.questionId === questionId);
}

/**
 * Build the context section of the prompt from answers.
 */
function buildContextSection(answers: WorkflowAnswer[]): string {
  const lines: string[] = [];

  // Change Type
  const changeTypeAnswer = findAnswer(answers, 'changeType');
  if (changeTypeAnswer && changeTypeAnswer.selectedOptions.length > 0) {
    lines.push(`- Change Type: ${sanitizeArray(changeTypeAnswer.selectedOptions).join(', ')}`);
  }

  // Affected Area
  const areaAnswer = findAnswer(answers, 'affectedArea');
  if (areaAnswer && areaAnswer.selectedOptions.length > 0) {
    lines.push(`- Affected Area: ${sanitizeArray(areaAnswer.selectedOptions).join(', ')}`);
  }

  // Description (from customText)
  const descAnswer = findAnswer(answers, 'description');
  if (descAnswer && descAnswer.customText) {
    lines.push(`- Description: ${sanitizeInput(descAnswer.customText)}`);
  }

  // Files
  const filesAnswer = findAnswer(answers, 'files');
  if (filesAnswer && filesAnswer.customText) {
    lines.push(`- Files: ${sanitizeInput(filesAnswer.customText)}`);
  }

  // Scope
  const scopeAnswer = findAnswer(answers, 'scope');
  if (scopeAnswer && scopeAnswer.selectedOptions.length > 0) {
    lines.push(`- Scope: ${sanitizeArray(scopeAnswer.selectedOptions).join(', ')}`);
  }

  // Priority
  const priorityAnswer = findAnswer(answers, 'priority');
  if (priorityAnswer && priorityAnswer.selectedOptions.length > 0) {
    lines.push(`- Priority: ${sanitizeArray(priorityAnswer.selectedOptions).join(', ')}`);
  }

  // Handle any additional custom text fields
  for (const answer of answers) {
    const knownIds = ['changeType', 'affectedArea', 'description', 'files', 'scope', 'priority', 'agents'];
    if (!knownIds.includes(answer.questionId) && answer.customText) {
      const label = answer.questionId
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
      lines.push(`- ${label}: ${sanitizeInput(answer.customText)}`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : '- No additional context provided';
}

/**
 * Build the selected agents section.
 */
function buildAgentsSection(answers: WorkflowAnswer[]): string {
  const agentsAnswer = findAnswer(answers, 'agents');
  if (agentsAnswer && agentsAnswer.selectedOptions.length > 0) {
    return sanitizeArray(agentsAnswer.selectedOptions).join(', ');
  }
  return 'Default workflow agents';
}

/**
 * Generate the full prompt for the workflow.
 */
function generatePrompt(commandName: string, answers: WorkflowAnswer[]): string {
  const contextSection = buildContextSection(answers);
  const agentsSection = buildAgentsSection(answers);

  return `/${commandName}

Context:
${contextSection}

Selected Agents: ${agentsSection}`;
}

/**
 * Generate the copyable text for easy copy-paste.
 */
function generateCopyableText(commandName: string, answers: WorkflowAnswer[]): string {
  const prompt = generatePrompt(commandName, answers);

  // Add a separator for clarity when pasting
  return `${prompt}

---
Generated workflow prompt - paste into Claude to execute`;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<WorkflowLaunchResponse | ErrorResponse>> {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid JSON body',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // Validate request structure
    if (!isValidRequest(body)) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Invalid request format. Expected { workflowId: string, answers: WorkflowAnswer[] }',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    const { workflowId, answers } = body;

    // Parse all workflows to find the requested one
    const workflows = await parseAllWorkflows();
    const workflow = workflows.find((w) => w.id === workflowId);

    if (!workflow) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: `Workflow with ID "${sanitizeInput(workflowId)}" not found`,
          statusCode: 404,
        },
        { status: 404 }
      );
    }

    // Extract command name from workflow ID
    const commandName = extractCommandName(workflowId);

    // Generate the prompt and response
    const prompt = generatePrompt(commandName, answers);
    const copyableText = generateCopyableText(commandName, answers);
    const command = `claude --plan '/${commandName}'`;

    const response: WorkflowLaunchResponse = {
      command,
      prompt,
      copyableText,
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

/**
 * GET /api/audit/workflows/launch
 *
 * Health check and documentation endpoint.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/audit/workflows/launch',
    methods: ['POST'],
    description: 'Generate launch command and prompt for a workflow',
    requestSchema: {
      workflowId: 'string - ID of the workflow to launch',
      answers: [
        {
          questionId: 'string - ID of the question being answered',
          selectedOptions: 'string[] - Selected option labels',
          customText: 'string? - Optional custom text input',
        },
      ],
    },
    responseSchema: {
      command: 'string - CLI command to execute',
      prompt: 'string - Generated prompt with context',
      copyableText: 'string - Formatted text for easy copy-paste',
    },
    knownQuestionIds: [
      'agents',
      'changeType',
      'affectedArea',
      'description',
      'files',
      'scope',
      'priority',
    ],
  });
}

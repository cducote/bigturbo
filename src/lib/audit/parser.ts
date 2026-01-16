/**
 * Markdown Parser for BigTurbo Agent Audit System
 *
 * Parses .claude/agents/*.md and .claude/commands/*.md files,
 * extracting frontmatter and structured data for the audit dashboard.
 *
 * Uses gray-matter for frontmatter parsing and provides database sync.
 */

import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { query, queryOne } from '../db';
import type {
  Agent,
  AgentInput,
  AgentFrontmatter,
  Command,
  CommandInput,
  CommandFrontmatter,
  Workflow,
  WorkflowInput,
  WorkflowGate,
  WorkflowType,
  ParsedAgentFile,
  ParsedCommandFile,
  ParseAgentsResult,
  ParseCommandsResult,
  ParseError,
  SyncResult,
  ExtractedAgentMetadata,
  ExtractedCommandMetadata,
  // Legacy types for backward compatibility
  ParsedAgent,
  ParsedCommand,
  ParsedWorkflow,
  ParsedWorkflowStep,
} from './types';

// ============================================================================
// Constants and Default Paths
// ============================================================================

/** Default base path for .claude directory */
const DEFAULT_BASE_PATH = process.cwd();

/** Get the agents directory path */
function getAgentsDir(basePath: string = DEFAULT_BASE_PATH): string {
  return path.join(basePath, '.claude', 'agents');
}

/** Get the commands directory path */
function getCommandsDir(basePath: string = DEFAULT_BASE_PATH): string {
  return path.join(basePath, '.claude', 'commands');
}

// ============================================================================
// File System Utilities
// ============================================================================

/**
 * Get all markdown files from a directory.
 *
 * @param directory - Directory path to scan
 * @returns Array of absolute file paths
 */
async function getMarkdownFiles(directory: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => path.join(directory, entry.name));
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error);
    return [];
  }
}

/**
 * Get file statistics (creation and modification times).
 *
 * @param filePath - Path to the file
 * @returns Object with createdAt and updatedAt dates
 */
async function getFileStats(filePath: string): Promise<{ createdAt: Date; updatedAt: Date }> {
  try {
    const stats = await fs.stat(filePath);
    return {
      createdAt: stats.birthtime,
      updatedAt: stats.mtime,
    };
  } catch {
    const now = new Date();
    return { createdAt: now, updatedAt: now };
  }
}

// ============================================================================
// Content Extraction Utilities
// ============================================================================

/**
 * Parse tools string from frontmatter into array.
 * Handles both comma-separated and space-separated formats.
 *
 * @param toolsStr - Tools string from frontmatter
 * @returns Array of tool names
 */
function parseToolsString(toolsStr: string | undefined): string[] {
  if (!toolsStr) return [];

  // Handle comma-separated: "Read, Write, Edit"
  if (toolsStr.includes(',')) {
    return toolsStr.split(',').map((t) => t.trim()).filter(Boolean);
  }

  // Handle space-separated: "Read Write Edit"
  return toolsStr.split(/\s+/).map((t) => t.trim()).filter(Boolean);
}

/**
 * Extract capabilities from agent markdown content.
 * Looks for checklist items and section headers.
 *
 * @param content - Markdown content
 * @returns Array of capability strings
 */
function extractCapabilities(content: string): string[] {
  const capabilities: string[] = [];

  // Look for checklist sections with patterns like:
  // "- Capability name followed by explanation"
  const checklistPattern = /^[-*]\s+([A-Z][a-zA-Z\s]+?)(?:\s*[-:>]|achieved|maintained|tracked|enabled|controlled|documented)/gm;
  let match;
  while ((match = checklistPattern.exec(content)) !== null) {
    const capability = match[1].trim();
    if (capability.length > 2 && capability.length < 60 && !capabilities.includes(capability)) {
      capabilities.push(capability);
    }
  }

  // Also extract from named sections with colon patterns:
  // "API design:" or "Database optimization:"
  const sectionPattern = /^([A-Z][a-zA-Z\s]+):$/gm;
  while ((match = sectionPattern.exec(content)) !== null) {
    const section = match[1].trim();
    if (section.length > 2 && section.length < 50 && !capabilities.includes(section)) {
      capabilities.push(section);
    }
  }

  return capabilities.slice(0, 12);
}

/**
 * Extract collaborator agent names from markdown content.
 * Looks for "Integration with other agents" section and agent name patterns.
 *
 * @param content - Markdown content
 * @returns Array of collaborator agent names
 */
function extractCollaborators(content: string): string[] {
  const collaborators: string[] = [];

  // Look for the integration section
  const integrationMatch = content.match(/Integration with other agents:[\s\S]*?(?=\n\n[A-Z]|\n##|$)/i);
  if (integrationMatch) {
    // Extract agent names from patterns like "Collaborate with backend-developer"
    const agentPattern = /(?:with|support|help|partner|coordinate|consult|sync|engage|align)\s+(?:with\s+)?([a-z]+-[a-z]+(?:-[a-z]+)?)/gi;
    let match;
    while ((match = agentPattern.exec(integrationMatch[0])) !== null) {
      const agentName = match[1].toLowerCase();
      if (!collaborators.includes(agentName)) {
        collaborators.push(agentName);
      }
    }
  }

  // Also find direct agent references throughout the document
  const agentRolePattern = /\b([a-z]+-(?:developer|designer|engineer|expert|auditor|specialist|manager|architect|pro))\b/gi;
  let match;
  while ((match = agentRolePattern.exec(content)) !== null) {
    const agentName = match[1].toLowerCase();
    if (!collaborators.includes(agentName)) {
      collaborators.push(agentName);
    }
  }

  return [...new Set(collaborators)].slice(0, 15);
}

/**
 * Extract description from command markdown (for files without frontmatter).
 *
 * @param content - Markdown content
 * @returns Description string
 */
function extractCommandDescription(content: string): string {
  // Look for first paragraph after # heading
  const headingMatch = content.match(/^#\s+[^\n]+\n+([^\n#]+)/m);
  if (headingMatch) {
    const desc = headingMatch[1].replace(/\*\*/g, '').trim();
    if (desc.length > 10) return desc;
  }

  // Fallback: find first substantive paragraph
  const paragraphs = content.split(/\n\n+/);
  for (const p of paragraphs) {
    const clean = p.replace(/^[#*\-\s]+/, '').trim();
    if (clean.length > 20 && clean.length < 300 && !clean.startsWith('|') && !clean.startsWith('[')) {
      return clean;
    }
  }

  return '';
}

/**
 * Extract workflow steps from command content.
 * Handles multiple markdown formats with intelligent prioritization:
 * - Priority 1: Numbered list "1. **agent-name** -> action" (bugfix, maintenance, migration)
 * - Priority 2: Standard Flow section (feature.md)
 * - Priority 3: ASCII diagram "Step N: description" (spot.md, feature.md fallback)
 *
 * The function uses a tiered approach: if high-priority agent-based steps are found,
 * it skips lower-priority fallback patterns to avoid duplicates.
 *
 * @param content - Markdown content
 * @returns Array of workflow step strings
 */
function extractWorkflowSteps(content: string): string[] {
  const steps: string[] = [];
  const seenSteps = new Set<string>();
  const seenAgents = new Set<string>();

  /**
   * Add a step if it's not a duplicate
   */
  const addStep = (step: string): void => {
    const normalized = step.toLowerCase().trim();
    if (!seenSteps.has(normalized) && step.length > 0) {
      seenSteps.add(normalized);
      steps.push(step);
    }
  };

  /**
   * Track agent+action combination to allow same agent with different actions
   * (e.g., qa-expert appears twice in bugfix workflow with different actions)
   */
  const trackAgentAction = (agent: string, action: string): boolean => {
    const normalized = `${agent.toLowerCase().trim()}::${action.toLowerCase().trim()}`;
    if (seenAgents.has(normalized)) return false;
    seenAgents.add(normalized);
    return true;
  };

  let match;

  // ==========================================================================
  // TIER 1: Primary agent-based workflow patterns (highest priority)
  // ==========================================================================

  // Pattern 1A: Look for "## Workflow" section first, then extract numbered agent steps
  // Used by: bugfix.md, maintenance.md, migration.md
  const workflowSection = content.match(/##\s*Workflow[\s\S]*?(?=\n##[^#]|$)/i);
  if (workflowSection) {
    // Extract numbered steps with agent names: "1. **agent-name** -> action"
    const numberedAgentPattern = /^\d+\.\s*\*\*([^*]+)\*\*\s*(?:->|→|:)\s*([^\n]+)/gm;
    while ((match = numberedAgentPattern.exec(workflowSection[0])) !== null) {
      const agentName = match[1].trim();
      const action = match[2].trim();
      if (trackAgentAction(agentName, action)) {
        addStep(`${agentName}: ${action}`);
      }
    }
  }

  // Pattern 1B: Standard Flow section (feature.md has this as the main workflow)
  // Look for "### Standard Flow" which contains the definitive agent sequence
  const standardFlowMatch = content.match(/###\s*Standard Flow[\s\S]*?(?=\n###|\n##[^#]|$)/i);
  if (standardFlowMatch) {
    const flowContent = standardFlowMatch[0];
    // Match numbered steps like "1. **api-designer** → Design API..."
    const flowStepPattern = /^\d+\.\s*\*\*([^*]+)\*\*\s*(?:->|→|:)\s*([^\n]+)/gm;
    while ((match = flowStepPattern.exec(flowContent)) !== null) {
      const agentName = match[1].trim();
      const action = match[2].trim();
      if (trackAgentAction(agentName, action)) {
        addStep(`${agentName}: ${action}`);
      }
    }
  }

  // ==========================================================================
  // TIER 2: Fallback patterns for files without numbered agent lists
  // Only used if no agent-based steps were found (e.g., spot.md)
  // ==========================================================================

  if (steps.length === 0) {
    // Pattern 2A: ASCII diagram format "Step N: description" (spot.md)
    // Matches lines like "Step 1: Select agents (AskUserQuestion with multiSelect)"
    const asciiStepPattern = /^Step\s+(\d+):\s*([^\n(]+)/gm;
    while ((match = asciiStepPattern.exec(content)) !== null) {
      const stepNum = match[1];
      const description = match[2].trim();
      // Only add if it's a meaningful step description
      if (description.length > 3) {
        addStep(`Step ${stepNum}: ${description}`);
      }
    }

    // Pattern 2B: Look for workflow characteristics in code blocks
    // spot.md uses ASCII diagrams in code blocks to describe the flow
    const blockMatch = content.match(/```[\s\S]*?```/g);
    if (blockMatch) {
      for (const block of blockMatch) {
        // Look for orchestrator mention
        if (block.match(/orchestrator/i) && !seenSteps.has('orchestrator: craft implementation plan')) {
          addStep('orchestrator: Craft implementation plan');
        }
        // Look for parallel execution mention
        if (block.match(/agents?\s+execute\s+in\s+parallel/i)) {
          addStep('parallel-execution: Selected agents run concurrently');
        }
      }
    }
  }

  return steps;
}

/**
 * Extract gates/checkpoints from command content.
 *
 * @param content - Markdown content
 * @returns Array of gate strings
 */
function extractGates(content: string): string[] {
  const gates: string[] = [];

  // Look for gate patterns with checkmarks
  const gatePattern = /[-*]\s*(?:\[[ x]\]|[*])?\s*(?:Gates?:?\s*)?(.+?)(?:\n|$)/gi;
  const gatesSection = content.match(/##\s*Gates[\s\S]*?(?=##|$)/i);

  if (gatesSection) {
    let match;
    while ((match = gatePattern.exec(gatesSection[0])) !== null) {
      const gate = match[1].trim().replace(/^[*_]+|[*_]+$/g, '');
      if (gate.length > 5 && !gates.includes(gate)) {
        gates.push(gate);
      }
    }
  }

  return gates;
}

/**
 * Extract referenced agent names from command content.
 *
 * @param content - Markdown content
 * @returns Array of agent names
 */
function extractReferencedAgents(content: string): string[] {
  const agents: string[] = [];

  // Find all agent-name patterns
  const agentPattern = /\*\*([a-z]+-[a-z]+(?:-[a-z]+)?)\*\*/gi;
  let match;
  while ((match = agentPattern.exec(content)) !== null) {
    const agent = match[1].toLowerCase();
    if (!agents.includes(agent)) {
      agents.push(agent);
    }
  }

  return agents;
}

// ============================================================================
// Single File Parsers
// ============================================================================

/**
 * Parse a single agent markdown file using gray-matter.
 *
 * @param filePath - Absolute path to the agent file
 * @returns Parsed agent file data or null on error
 */
export async function parseAgentFile(filePath: string): Promise<ParsedAgentFile | null> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const stats = await getFileStats(filePath);

    // Use gray-matter to parse frontmatter
    const { data, content } = matter(fileContent);

    // Validate and type the frontmatter
    const frontmatter: AgentFrontmatter = {
      name: data.name || path.basename(filePath, '.md'),
      humanName: data.humanName,
      color: data.color,
      description: data.description || '',
      tools: data.tools || '',
      capabilities: data.capabilities,
      collaborators: data.collaborators,
    };

    return {
      frontmatter,
      content,
      filePath,
      createdAt: stats.createdAt,
      updatedAt: stats.updatedAt,
    };
  } catch (error) {
    console.error(`Error parsing agent file ${filePath}:`, error);
    return null;
  }
}

/**
 * Parse a single command markdown file using gray-matter.
 *
 * @param filePath - Absolute path to the command file
 * @returns Parsed command file data or null on error
 */
export async function parseCommandFile(filePath: string): Promise<ParsedCommandFile | null> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const stats = await getFileStats(filePath);

    // Use gray-matter to parse frontmatter (may be empty for command files)
    const { data, content } = matter(fileContent);

    // Type the frontmatter (most fields may be undefined)
    const frontmatter: CommandFrontmatter = {
      name: data.name,
      description: data.description,
      workflowId: data.workflowId,
      minAgents: data.minAgents,
      maxAgents: data.maxAgents,
      allowsParallel: data.allowsParallel,
    };

    return {
      frontmatter,
      content: data.name ? content : fileContent, // Use full content if no frontmatter
      filePath,
      createdAt: stats.createdAt,
      updatedAt: stats.updatedAt,
    };
  } catch (error) {
    console.error(`Error parsing command file ${filePath}:`, error);
    return null;
  }
}

// ============================================================================
// Batch Parsers
// ============================================================================

/**
 * Parse all agent files in the .claude/agents/ directory.
 *
 * @param basePath - Base path to the project (defaults to cwd)
 * @returns Result with parsed agents and any errors
 */
export async function parseAllAgents(basePath?: string): Promise<ParseAgentsResult> {
  const agentsDir = getAgentsDir(basePath);
  const files = await getMarkdownFiles(agentsDir);

  const agents: ParsedAgentFile[] = [];
  const errors: ParseError[] = [];

  for (const file of files) {
    try {
      const parsed = await parseAgentFile(file);
      if (parsed) {
        agents.push(parsed);
      }
    } catch (error) {
      errors.push({
        filePath: file,
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  // Sort by name
  agents.sort((a, b) => a.frontmatter.name.localeCompare(b.frontmatter.name));

  return { agents, errors };
}

/**
 * Parse all command files in the .claude/commands/ directory.
 *
 * @param basePath - Base path to the project (defaults to cwd)
 * @returns Result with parsed commands and any errors
 */
export async function parseAllCommands(basePath?: string): Promise<ParseCommandsResult> {
  const commandsDir = getCommandsDir(basePath);
  const files = await getMarkdownFiles(commandsDir);

  const commands: ParsedCommandFile[] = [];
  const errors: ParseError[] = [];

  for (const file of files) {
    try {
      const parsed = await parseCommandFile(file);
      if (parsed) {
        commands.push(parsed);
      }
    } catch (error) {
      errors.push({
        filePath: file,
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  // Sort by name
  commands.sort((a, b) => {
    const nameA = a.frontmatter.name || path.basename(a.filePath, '.md');
    const nameB = b.frontmatter.name || path.basename(b.filePath, '.md');
    return nameA.localeCompare(nameB);
  });

  return { commands, errors };
}

// ============================================================================
// Metadata Extraction
// ============================================================================

/**
 * Extract full metadata from a parsed agent file.
 *
 * @param parsed - Parsed agent file
 * @returns Extracted metadata
 */
export function extractAgentMetadata(parsed: ParsedAgentFile): ExtractedAgentMetadata {
  return {
    name: parsed.frontmatter.name,
    humanName: parsed.frontmatter.humanName || null,
    color: parsed.frontmatter.color || null,
    description: parsed.frontmatter.description,
    tools: parseToolsString(parsed.frontmatter.tools),
    capabilities: parsed.frontmatter.capabilities || extractCapabilities(parsed.content),
    collaborators: parsed.frontmatter.collaborators || extractCollaborators(parsed.content),
  };
}

/**
 * Extract full metadata from a parsed command file.
 *
 * @param parsed - Parsed command file
 * @returns Extracted metadata
 */
export function extractCommandMetadata(parsed: ParsedCommandFile): ExtractedCommandMetadata {
  const fileName = path.basename(parsed.filePath, '.md');

  return {
    name: parsed.frontmatter.name || fileName,
    description: parsed.frontmatter.description || extractCommandDescription(parsed.content),
    workflowSteps: extractWorkflowSteps(parsed.content),
    gates: extractGates(parsed.content),
    referencedAgents: extractReferencedAgents(parsed.content),
  };
}

// ============================================================================
// Database Conversion
// ============================================================================

/**
 * Convert parsed agent file to database input format.
 *
 * @param parsed - Parsed agent file
 * @returns Agent input for database
 */
export function toAgentInput(parsed: ParsedAgentFile): AgentInput {
  const metadata = extractAgentMetadata(parsed);

  return {
    name: metadata.name,
    humanName: metadata.humanName,
    color: metadata.color,
    description: metadata.description || null,
    tools: metadata.tools,
    capabilities: metadata.capabilities,
    collaborators: metadata.collaborators,
    filePath: parsed.filePath,
    content: parsed.content,
  };
}

/**
 * Convert parsed command file to database input format.
 *
 * @param parsed - Parsed command file
 * @returns Command input for database
 */
export function toCommandInput(parsed: ParsedCommandFile): CommandInput {
  const metadata = extractCommandMetadata(parsed);

  // Determine agent count constraints from content
  const referencedCount = metadata.referencedAgents.length;

  return {
    name: metadata.name,
    description: metadata.description || null,
    workflowId: parsed.frontmatter.workflowId || null,
    minAgents: parsed.frontmatter.minAgents || Math.min(1, referencedCount),
    maxAgents: parsed.frontmatter.maxAgents || Math.max(referencedCount, 10),
    allowsParallel: parsed.frontmatter.allowsParallel ?? metadata.name === 'spot',
    content: parsed.content,
  };
}

/**
 * Create workflow from command metadata.
 *
 * @param command - Command input
 * @param metadata - Command metadata
 * @returns Workflow input or null if no workflow detected
 */
export function toWorkflowInput(
  command: CommandInput,
  metadata: ExtractedCommandMetadata
): WorkflowInput | null {
  if (metadata.workflowSteps.length === 0) {
    return null;
  }

  // Determine workflow type
  let type: WorkflowType = 'sequential';
  if (command.allowsParallel) {
    type = 'parallel';
  } else if (metadata.gates.length > 0) {
    type = 'conditional';
  }

  // Convert gates to structured format
  const gates: WorkflowGate[] = metadata.gates.map((gate) => ({
    name: gate.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    description: gate,
    required: gate.toLowerCase().includes('must') || gate.toLowerCase().includes('require'),
  }));

  return {
    name: `${command.name}-workflow`,
    type,
    description: command.description,
    agentSequence: metadata.referencedAgents,
    gates,
  };
}

// ============================================================================
// Database Sync
// ============================================================================

/**
 * Upsert an agent to the database.
 *
 * @param input - Agent input data
 * @returns Created or updated agent
 */
async function upsertAgent(input: AgentInput): Promise<Agent> {
  const existing = await queryOne<Agent>(
    'SELECT * FROM agents WHERE name = $1',
    [input.name]
  );

  if (existing) {
    // Update existing agent
    const result = await query<Agent>(
      `UPDATE agents SET
        description = $1,
        tools = $2,
        capabilities = $3,
        collaborators = $4,
        file_path = $5,
        content = $6,
        updated_at = NOW()
      WHERE name = $7
      RETURNING *`,
      [
        input.description,
        JSON.stringify(input.tools),
        JSON.stringify(input.capabilities),
        JSON.stringify(input.collaborators),
        input.filePath,
        input.content,
        input.name,
      ]
    );
    return result[0];
  }

  // Create new agent
  const result = await query<Agent>(
    `INSERT INTO agents (name, description, tools, capabilities, collaborators, file_path, content)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.name,
      input.description,
      JSON.stringify(input.tools),
      JSON.stringify(input.capabilities),
      JSON.stringify(input.collaborators),
      input.filePath,
      input.content,
    ]
  );
  return result[0];
}

/**
 * Upsert a command to the database.
 *
 * @param input - Command input data
 * @returns Created or updated command
 */
async function upsertCommand(input: CommandInput): Promise<Command> {
  const existing = await queryOne<Command>(
    'SELECT * FROM commands WHERE name = $1',
    [input.name]
  );

  if (existing) {
    // Update existing command
    const result = await query<Command>(
      `UPDATE commands SET
        description = $1,
        workflow_id = $2,
        min_agents = $3,
        max_agents = $4,
        allows_parallel = $5,
        content = $6,
        updated_at = NOW()
      WHERE name = $7
      RETURNING *`,
      [
        input.description,
        input.workflowId,
        input.minAgents,
        input.maxAgents,
        input.allowsParallel,
        input.content,
        input.name,
      ]
    );
    return result[0];
  }

  // Create new command
  const result = await query<Command>(
    `INSERT INTO commands (name, description, workflow_id, min_agents, max_agents, allows_parallel, content)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.name,
      input.description,
      input.workflowId,
      input.minAgents,
      input.maxAgents,
      input.allowsParallel,
      input.content,
    ]
  );
  return result[0];
}

/**
 * Upsert a workflow to the database.
 *
 * @param input - Workflow input data
 * @returns Created or updated workflow
 */
async function upsertWorkflow(input: WorkflowInput): Promise<Workflow> {
  const existing = await queryOne<Workflow>(
    'SELECT * FROM workflows WHERE name = $1',
    [input.name]
  );

  if (existing) {
    // Update existing workflow
    const result = await query<Workflow>(
      `UPDATE workflows SET
        type = $1,
        description = $2,
        agent_sequence = $3,
        gates = $4,
        updated_at = NOW()
      WHERE name = $5
      RETURNING *`,
      [
        input.type,
        input.description,
        JSON.stringify(input.agentSequence),
        JSON.stringify(input.gates),
        input.name,
      ]
    );
    return result[0];
  }

  // Create new workflow
  const result = await query<Workflow>(
    `INSERT INTO workflows (name, type, description, agent_sequence, gates)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      input.name,
      input.type,
      input.description,
      JSON.stringify(input.agentSequence),
      JSON.stringify(input.gates),
    ]
  );
  return result[0];
}

/**
 * Sync all parsed files to the PostgreSQL database.
 * Performs upserts for agents, commands, and workflows.
 *
 * @param basePath - Base path to the project (defaults to cwd)
 * @returns Sync result with counts and errors
 */
export async function syncToDatabase(basePath?: string): Promise<SyncResult> {
  const result: SyncResult = {
    agentsCreated: 0,
    agentsUpdated: 0,
    commandsCreated: 0,
    commandsUpdated: 0,
    workflowsCreated: 0,
    errors: [],
  };

  // Parse all files
  const [agentsResult, commandsResult] = await Promise.all([
    parseAllAgents(basePath),
    parseAllCommands(basePath),
  ]);

  // Add parse errors to result
  for (const error of [...agentsResult.errors, ...commandsResult.errors]) {
    result.errors.push({
      entityType: 'agent',
      entityName: path.basename(error.filePath, '.md'),
      message: error.message,
      cause: error.cause,
    });
  }

  // Sync agents
  for (const parsed of agentsResult.agents) {
    try {
      const input = toAgentInput(parsed);
      const existing = await queryOne<Agent>(
        'SELECT id FROM agents WHERE name = $1',
        [input.name]
      );

      await upsertAgent(input);

      if (existing) {
        result.agentsUpdated++;
      } else {
        result.agentsCreated++;
      }
    } catch (error) {
      result.errors.push({
        entityType: 'agent',
        entityName: parsed.frontmatter.name,
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  // Sync commands and workflows
  for (const parsed of commandsResult.commands) {
    try {
      const commandInput = toCommandInput(parsed);
      const metadata = extractCommandMetadata(parsed);

      const existingCommand = await queryOne<Command>(
        'SELECT id FROM commands WHERE name = $1',
        [commandInput.name]
      );

      // Create workflow if applicable
      const workflowInput = toWorkflowInput(commandInput, metadata);
      if (workflowInput) {
        const existingWorkflow = await queryOne<Workflow>(
          'SELECT id FROM workflows WHERE name = $1',
          [workflowInput.name]
        );

        const workflow = await upsertWorkflow(workflowInput);
        commandInput.workflowId = workflow.id;

        if (!existingWorkflow) {
          result.workflowsCreated++;
        }
      }

      await upsertCommand(commandInput);

      if (existingCommand) {
        result.commandsUpdated++;
      } else {
        result.commandsCreated++;
      }
    } catch (error) {
      const name = parsed.frontmatter.name || path.basename(parsed.filePath, '.md');
      result.errors.push({
        entityType: 'command',
        entityName: name,
        message: error instanceof Error ? error.message : 'Unknown error',
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  return result;
}

// ============================================================================
// Legacy API (Backward Compatibility)
// ============================================================================

/**
 * Legacy sync result format.
 */
export interface ParseSyncResult {
  agents: ParsedAgent[];
  commands: ParsedCommand[];
  workflows: ParsedWorkflow[];
  timestamp: string;
}

/**
 * @deprecated Use parseAgentFile and extractAgentMetadata instead
 */
export async function parseLegacyAgentFile(filePath: string): Promise<ParsedAgent | null> {
  const parsed = await parseAgentFile(filePath);
  if (!parsed) return null;

  const metadata = extractAgentMetadata(parsed);
  const fileName = path.basename(filePath, '.md');
  const relativePath = path.relative(process.cwd(), filePath);

  return {
    id: fileName,
    name: metadata.name,
    description: metadata.description,
    filePath: relativePath,
    capabilities: metadata.capabilities,
    collaborators: metadata.collaborators,
    tools: metadata.tools,
    rawContent: parsed.content,
    lastSynced: new Date().toISOString(),
  };
}

/**
 * @deprecated Use parseCommandFile and extractCommandMetadata instead
 */
export async function parseLegacyCommandFile(filePath: string): Promise<ParsedCommand | null> {
  const parsed = await parseCommandFile(filePath);
  if (!parsed) return null;

  const metadata = extractCommandMetadata(parsed);
  const fileName = path.basename(filePath, '.md');
  const relativePath = path.relative(process.cwd(), filePath);

  // Extract examples from content
  const examples: string[] = [];
  const codeBlocks = parsed.content.match(/```[\s\S]*?```/g) || [];
  for (const block of codeBlocks.slice(0, 3)) {
    const lines = block.split('\n').filter((l) => l.startsWith('/') || l.includes(fileName));
    examples.push(...lines.slice(0, 2));
  }

  return {
    id: fileName,
    name: metadata.name,
    description: metadata.description,
    filePath: relativePath,
    usage: `/${fileName} [options]`,
    examples: examples.slice(0, 5),
    rawContent: parsed.content,
    lastSynced: new Date().toISOString(),
  };
}

/**
 * @deprecated Use parseAllAgents with new types instead
 */
export async function getAllAgentsLegacy(basePath?: string): Promise<ParsedAgent[]> {
  const agentsDir = getAgentsDir(basePath);
  const files = await getMarkdownFiles(agentsDir);
  const agents: ParsedAgent[] = [];

  for (const file of files) {
    const agent = await parseLegacyAgentFile(file);
    if (agent) {
      agents.push(agent);
    }
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * @deprecated Use parseAllCommands with new types instead
 */
export async function getAllCommandsLegacy(basePath?: string): Promise<ParsedCommand[]> {
  const commandsDir = getCommandsDir(basePath);
  const files = await getMarkdownFiles(commandsDir);
  const commands: ParsedCommand[] = [];

  for (const file of files) {
    const command = await parseLegacyCommandFile(file);
    if (command) {
      commands.push(command);
    }
  }

  return commands.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * @deprecated Use syncToDatabase with new types instead
 */
export async function syncLegacy(basePath?: string): Promise<ParseSyncResult> {
  const [agents, commands] = await Promise.all([
    getAllAgentsLegacy(basePath),
    getAllCommandsLegacy(basePath),
  ]);

  // Extract workflows from commands
  const workflows: ParsedWorkflow[] = [];
  for (const command of commands) {
    const steps = extractWorkflowSteps(command.rawContent);
    const agentNames = extractReferencedAgents(command.rawContent);

    if (steps.length > 0) {
      const workflowSteps: ParsedWorkflowStep[] = steps.map((step, index) => {
        const [agent, action] = step.split(':').map((s) => s.trim());
        return {
          order: index + 1,
          agent: agent.toLowerCase(),
          action: action || `Execute ${agent} responsibilities`,
        };
      });

      workflows.push({
        id: `${command.id}-workflow`,
        name: command.name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Workflow',
        description: command.description,
        agents: agentNames,
        steps: workflowSteps,
        sourceFile: command.filePath,
        lastSynced: new Date().toISOString(),
      });
    }
  }

  return {
    agents,
    commands,
    workflows,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Legacy Workflow Parser (used by API routes)
// ============================================================================

/**
 * Parse all workflows from command files.
 * This is the legacy function expected by existing API routes.
 *
 * @param basePath - Base path to the project
 * @returns Array of parsed workflows
 */
export async function parseAllWorkflows(basePath?: string): Promise<ParsedWorkflow[]> {
  const commands = await getAllCommandsLegacy(basePath);
  const workflows: ParsedWorkflow[] = [];

  for (const command of commands) {
    const steps = extractWorkflowSteps(command.rawContent);
    const agentNames = extractReferencedAgents(command.rawContent);

    if (steps.length > 0) {
      const workflowSteps: ParsedWorkflowStep[] = steps.map((step, index) => {
        const [agent, action] = step.split(':').map((s) => s.trim());
        return {
          order: index + 1,
          agent: agent.toLowerCase(),
          action: action || `Execute ${agent} responsibilities`,
        };
      });

      workflows.push({
        id: `${command.id}-workflow`,
        name: command.name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Workflow',
        description: command.description,
        agents: agentNames,
        steps: workflowSteps,
        sourceFile: command.filePath,
        lastSynced: new Date().toISOString(),
      });
    }
  }

  return workflows;
}

// ============================================================================
// Finder Utilities
// ============================================================================

/**
 * Find an agent by name.
 *
 * @param name - Agent name to find
 * @param basePath - Base path to the project
 * @returns Parsed agent file or null
 */
export async function findAgentByName(
  name: string,
  basePath?: string
): Promise<ParsedAgentFile | null> {
  const { agents } = await parseAllAgents(basePath);
  const normalizedName = name.toLowerCase();

  return (
    agents.find(
      (a) =>
        a.frontmatter.name.toLowerCase() === normalizedName ||
        path.basename(a.filePath, '.md').toLowerCase() === normalizedName
    ) || null
  );
}

/**
 * Find a command by name.
 *
 * @param name - Command name to find
 * @param basePath - Base path to the project
 * @returns Parsed command file or null
 */
export async function findCommandByName(
  name: string,
  basePath?: string
): Promise<ParsedCommandFile | null> {
  const { commands } = await parseAllCommands(basePath);
  const normalizedName = name.toLowerCase();

  return (
    commands.find(
      (c) =>
        (c.frontmatter.name || '').toLowerCase() === normalizedName ||
        path.basename(c.filePath, '.md').toLowerCase() === normalizedName
    ) || null
  );
}

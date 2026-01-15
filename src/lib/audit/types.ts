/**
 * TypeScript interfaces for the BigTurbo Agent Audit System
 *
 * These types define the structure for agents, workflows, and commands
 * parsed from .claude/agents/*.md and .claude/commands/*.md files.
 */

// ============================================================================
// Parsed File Types (from markdown files)
// ============================================================================

/**
 * Frontmatter extracted from agent markdown files.
 * Agent files use YAML frontmatter with name, description, and tools.
 */
export interface AgentFrontmatter {
  name: string;
  humanName?: string;
  color?: string;
  description: string;
  tools: string;
  capabilities?: string[];
  collaborators?: string[];
}

/**
 * Frontmatter extracted from command markdown files.
 * Note: Current command files don't use frontmatter, but we support it for future use.
 */
export interface CommandFrontmatter {
  name?: string;
  description?: string;
  workflowId?: string;
  minAgents?: number;
  maxAgents?: number;
  allowsParallel?: boolean;
}

/**
 * Result of parsing an agent markdown file.
 */
export interface ParsedAgentFile {
  /** The raw frontmatter data */
  frontmatter: AgentFrontmatter;
  /** The markdown content after frontmatter */
  content: string;
  /** Original file path */
  filePath: string;
  /** File stats */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of parsing a command markdown file.
 */
export interface ParsedCommandFile {
  /** The raw frontmatter data (may be empty for files without frontmatter) */
  frontmatter: CommandFrontmatter;
  /** The markdown content (or entire file if no frontmatter) */
  content: string;
  /** Original file path */
  filePath: string;
  /** File stats */
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Database Entity Types
// ============================================================================

/**
 * Agent entity representing a Claude agent definition.
 * Stored in the agents table.
 */
export interface Agent {
  /** Unique identifier (UUID) */
  id: string;
  /** Agent name (e.g., "fullstack-developer", "api-designer") */
  name: string;
  /** Human-friendly name for the agent (e.g., "Felix", "Aria") */
  humanName: string | null;
  /** Unique color for agent badges/pills (hex code) */
  color: string | null;
  /** Brief description of the agent's purpose and expertise */
  description: string | null;
  /** List of tools the agent can use (e.g., ["Read", "Write", "Edit"]) */
  tools: string[];
  /** Agent capabilities extracted from content */
  capabilities: string[];
  /** Other agents this agent collaborates with */
  collaborators: string[];
  /** Path to the source markdown file */
  filePath: string;
  /** Full markdown content of the agent definition */
  content: string;
  /** When the agent record was created */
  createdAt: Date;
  /** When the agent record was last updated */
  updatedAt: Date;
}

/**
 * Input type for creating or updating an agent.
 */
export type AgentInput = Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Workflow type for multi-agent orchestration patterns.
 */
export type WorkflowType = 'sequential' | 'parallel' | 'conditional' | 'hybrid';

/**
 * Gate definition for workflow validation checkpoints.
 */
export interface WorkflowGate {
  /** Name of the gate (e.g., "tests-pass", "security-reviewed") */
  name: string;
  /** Description of what the gate validates */
  description: string;
  /** Whether this gate is required to proceed */
  required: boolean;
}

/**
 * Workflow entity representing a multi-agent workflow pattern.
 * Workflows define how multiple agents collaborate on complex tasks.
 */
export interface Workflow {
  /** Unique identifier (UUID) */
  id: string;
  /** Workflow name (e.g., "feature-delivery", "migration") */
  name: string;
  /** Type of workflow orchestration */
  type: WorkflowType;
  /** Description of the workflow's purpose */
  description: string | null;
  /** Ordered sequence of agent names involved in this workflow */
  agentSequence: string[];
  /** Validation gates that must be passed during workflow execution */
  gates: WorkflowGate[];
  /** When the workflow was created */
  createdAt: Date;
}

/**
 * Input type for creating a workflow.
 */
export type WorkflowInput = Omit<Workflow, 'id' | 'createdAt'>;

/**
 * Command entity representing a slash command definition.
 * Commands trigger specific workflows or agent invocations.
 */
export interface Command {
  /** Unique identifier (UUID) */
  id: string;
  /** Command name (e.g., "feature", "spot", "migration") */
  name: string;
  /** Description of what the command does */
  description: string | null;
  /** Associated workflow ID (if any) */
  workflowId: string | null;
  /** Minimum number of agents required */
  minAgents: number;
  /** Maximum number of agents allowed */
  maxAgents: number;
  /** Whether agents can run in parallel */
  allowsParallel: boolean;
  /** Full markdown content of the command definition */
  content: string;
  /** When the command was created */
  createdAt: Date;
}

/**
 * Input type for creating a command.
 */
export type CommandInput = Omit<Command, 'id' | 'createdAt'>;

// ============================================================================
// Parser Result Types
// ============================================================================

/**
 * Result of parsing all agent files.
 */
export interface ParseAgentsResult {
  /** Successfully parsed agents */
  agents: ParsedAgentFile[];
  /** Errors encountered during parsing */
  errors: ParseError[];
}

/**
 * Result of parsing all command files.
 */
export interface ParseCommandsResult {
  /** Successfully parsed commands */
  commands: ParsedCommandFile[];
  /** Errors encountered during parsing */
  errors: ParseError[];
}

/**
 * Error encountered during file parsing.
 */
export interface ParseError {
  /** Path to the file that failed to parse */
  filePath: string;
  /** Error message */
  message: string;
  /** Original error if available */
  cause?: Error;
}

// ============================================================================
// Sync Result Types
// ============================================================================

/**
 * Result of syncing parsed files to the database.
 */
export interface SyncResult {
  /** Number of agents created */
  agentsCreated: number;
  /** Number of agents updated */
  agentsUpdated: number;
  /** Number of commands created */
  commandsCreated: number;
  /** Number of commands updated */
  commandsUpdated: number;
  /** Number of workflows created */
  workflowsCreated: number;
  /** Errors encountered during sync */
  errors: SyncError[];
}

/**
 * Error encountered during database sync.
 */
export interface SyncError {
  /** Type of entity that failed to sync */
  entityType: 'agent' | 'command' | 'workflow';
  /** Name of the entity */
  entityName: string;
  /** Error message */
  message: string;
  /** Original error if available */
  cause?: Error;
}

// ============================================================================
// Extracted Metadata Types
// ============================================================================

/**
 * Metadata extracted from agent file content.
 */
export interface ExtractedAgentMetadata {
  /** Agent name from frontmatter */
  name: string;
  /** Human-friendly name for the agent (e.g., "Felix", "Aria") */
  humanName: string | null;
  /** Unique color for agent badges/pills (hex code) */
  color: string | null;
  /** Description from frontmatter */
  description: string;
  /** Tools from frontmatter (parsed into array) */
  tools: string[];
  /** Capabilities extracted from content checklists */
  capabilities: string[];
  /** Collaborators extracted from "Integration with other agents" section */
  collaborators: string[];
}

/**
 * Metadata extracted from command file content.
 */
export interface ExtractedCommandMetadata {
  /** Command name (from filename or H1 header) */
  name: string;
  /** Description from first paragraph or frontmatter */
  description: string;
  /** Workflow steps extracted from numbered lists */
  workflowSteps: string[];
  /** Gates extracted from checkboxes */
  gates: string[];
  /** Agent names referenced in the command */
  referencedAgents: string[];
}

// ============================================================================
// Legacy Types (kept for backward compatibility)
// ============================================================================

/**
 * @deprecated Use ParsedAgentFile instead
 */
export interface ParsedAgent {
  id: string;
  name: string;
  description: string;
  filePath: string;
  capabilities: string[];
  collaborators: string[];
  tools: string[];
  rawContent: string;
  lastSynced: string;
}

/**
 * @deprecated Use ParsedCommandFile instead
 */
export interface ParsedCommand {
  id: string;
  name: string;
  description: string;
  filePath: string;
  usage: string;
  examples: string[];
  rawContent: string;
  lastSynced: string;
}

/**
 * Workflow step extracted from command files.
 */
export interface ParsedWorkflowStep {
  order: number;
  agent: string;
  action: string;
  output?: string;
}

/**
 * Parsed workflow data extracted from command files.
 */
export interface ParsedWorkflow {
  id: string;
  name: string;
  description: string;
  agents: string[];
  steps: ParsedWorkflowStep[];
  sourceFile: string;
  lastSynced: string;
}

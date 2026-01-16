/**
 * Type definitions for the BigTurbo Agent Audit system.
 * These types represent agents, workflows, and commands parsed from .claude/ markdown files.
 */

/**
 * Represents an agent configuration parsed from .claude/agents/*.md files.
 */
export interface Agent {
  /** Unique identifier for the agent (derived from filename) */
  id: string;
  /** Display name of the agent (agentId like "fullstack-developer") */
  name: string;
  /** Human-friendly name for the agent (e.g., "Felix", "Aria") */
  humanName: string | null;
  /** Unique color for agent badges/pills (hex code) */
  color: string | null;
  /** Description of the agent's purpose and capabilities */
  description: string;
  /** File path to the agent's markdown configuration */
  filePath: string;
  /** List of capabilities or skills the agent possesses */
  capabilities: string[];
  /** Other agents this agent can collaborate with */
  collaborators: string[];
  /** Timestamp when the agent was last synced */
  lastSynced: string;
  /** Raw markdown content of the agent file */
  rawContent?: string;
}

/**
 * Represents a workflow that orchestrates multiple agents.
 */
export interface Workflow {
  /** Unique identifier for the workflow */
  id: string;
  /** Display name of the workflow */
  name: string;
  /** Description of what the workflow accomplishes */
  description: string;
  /** Ordered list of agent names involved in the workflow */
  agents: string[];
  /** Steps in the workflow execution */
  steps: WorkflowStep[];
  /** Timestamp when the workflow was last synced */
  lastSynced: string;
}

/**
 * Represents a single step in a workflow.
 */
export interface WorkflowStep {
  /** Step order number */
  order: number;
  /** Agent responsible for this step */
  agent: string;
  /** Action to be performed */
  action: string;
  /** Expected output from this step */
  output?: string;
}

/**
 * Represents a command defined in .claude/commands/*.md files.
 */
export interface Command {
  /** Unique identifier for the command (derived from filename) */
  id: string;
  /** Command name as invoked */
  name: string;
  /** Description of what the command does */
  description: string;
  /** File path to the command's markdown configuration */
  filePath: string;
  /** Usage pattern or syntax */
  usage: string;
  /** Example invocations */
  examples: string[];
  /** Timestamp when the command was last synced */
  lastSynced: string;
}

/**
 * Response type for listing agents.
 */
export interface AgentsListResponse {
  agents: Agent[];
  count: number;
}

/**
 * Response type for a single agent.
 */
export interface AgentResponse {
  agent: Agent;
}

/**
 * Response type for listing workflows.
 */
export interface WorkflowsListResponse {
  workflows: Workflow[];
}

/**
 * Response type for listing commands.
 */
export interface CommandsListResponse {
  commands: Command[];
}

/**
 * Response type for sync operation.
 */
export interface SyncResponse {
  synced: number;
  agents: number;
  commands: number;
  workflows: number;
  timestamp: string;
}

/**
 * Standard error response format.
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

/**
 * Query parameters for filtering agents list.
 */
export interface AgentsQueryParams {
  /** Search term to filter by name or description */
  search?: string;
  /** Filter by capability */
  capability?: string;
  /** Maximum number of results to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

// ============================================================================
// Workflow Launch Types
// ============================================================================

/**
 * Represents an option within a workflow question.
 */
export interface WorkflowQuestionOption {
  /** Display label for the option */
  label: string;
  /** Detailed description of what this option means */
  description: string;
}

/**
 * Represents a question asked during workflow configuration.
 */
export interface WorkflowQuestion {
  /** Unique identifier for this question */
  id: string;
  /** The question text to display */
  question: string;
  /** Header/title for the question section */
  header: string;
  /** Whether multiple options can be selected */
  multiSelect: boolean;
  /** Available options for this question */
  options: WorkflowQuestionOption[];
}

/**
 * Represents a user's answer to a workflow question.
 */
export interface WorkflowAnswer {
  /** ID of the question being answered */
  questionId: string;
  /** Labels of the selected options */
  selectedOptions: string[];
  /** Optional custom text input from the user */
  customText?: string;
}

/**
 * Request payload for launching a workflow.
 */
export interface WorkflowLaunchRequest {
  /** ID of the workflow to launch */
  workflowId: string;
  /** User's answers to configuration questions */
  answers: WorkflowAnswer[];
}

/**
 * Response from workflow launch generation.
 */
export interface WorkflowLaunchResponse {
  /** The command to execute (e.g., claude code command) */
  command: string;
  /** Generated prompt incorporating user's answers */
  prompt: string;
  /** Text formatted for easy copy-paste by the user */
  copyableText: string;
}

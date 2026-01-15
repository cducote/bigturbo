/**
 * Agent Audit Library
 *
 * Provides parsing and syncing functionality for .claude/ markdown files.
 */

// New API (recommended)
export {
  parseAgentFile,
  parseCommandFile,
  parseAllAgents,
  parseAllCommands,
  extractAgentMetadata,
  extractCommandMetadata,
  toAgentInput,
  toCommandInput,
  toWorkflowInput,
  syncToDatabase,
  findAgentByName,
  findCommandByName,
} from './parser';

// Legacy API (for backward compatibility with existing routes)
export {
  parseAllWorkflows,
  getAllAgentsLegacy,
  getAllCommandsLegacy,
  syncLegacy,
  parseLegacyAgentFile,
  parseLegacyCommandFile,
} from './parser';

export type { ParseSyncResult } from './parser';

// Type exports
export type {
  // New types
  Agent,
  AgentInput,
  AgentFrontmatter,
  Command,
  CommandInput,
  CommandFrontmatter,
  Workflow,
  WorkflowInput,
  WorkflowType,
  WorkflowGate,
  ParsedAgentFile,
  ParsedCommandFile,
  ParseAgentsResult,
  ParseCommandsResult,
  ParseError,
  SyncResult,
  SyncError,
  ExtractedAgentMetadata,
  ExtractedCommandMetadata,
  // Legacy types
  ParsedAgent,
  ParsedCommand,
  ParsedWorkflow,
  ParsedWorkflowStep,
} from './types';

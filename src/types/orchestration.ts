/**
 * Type definitions for the BigTurbo Orchestration system.
 * These types represent orchestration plans, phases, waves, and agent tasks
 * for coordinating multi-agent workflows.
 */

/**
 * Represents a task assigned to a specific agent within a wave.
 */
export interface AgentTask {
  /** The agent responsible for executing this task */
  agent: string;
  /** Description of the task to be performed */
  task: string;
  /** Expected deliverable from this task */
  deliverable: string;
  /** List of file paths relevant to this task */
  files: string[];
}

/**
 * Represents a wave of tasks within a phase.
 * Waves can execute tasks in parallel or sequentially.
 */
export interface OrchestrationWave {
  /** Unique identifier for this wave */
  id: string;
  /** Whether tasks in this wave can execute in parallel */
  parallel: boolean;
  /** List of agent tasks in this wave */
  tasks: AgentTask[];
  /** Wave IDs that must complete before this wave can start */
  dependencies: string[];
}

/**
 * Represents a phase in the orchestration plan.
 * Phases are major milestones that contain one or more waves.
 */
export interface OrchestrationPhase {
  /** Phase sequence number */
  number: number;
  /** Display name of the phase */
  name: string;
  /** Waves of work within this phase */
  waves: OrchestrationWave[];
}

/**
 * Represents a gate between phases or waves.
 * Gates define conditions that must be met before proceeding.
 */
export interface OrchestrationGate {
  /** Source phase or wave ID */
  from: string;
  /** Target phase or wave ID */
  to: string;
  /** Condition that must be satisfied to pass the gate */
  condition: string;
  /** Whether this gate blocks progression (true) or is advisory (false) */
  blocking: boolean;
}

/**
 * Represents a complete orchestration plan for a multi-agent workflow.
 */
export interface OrchestrationPlan {
  /** Unique identifier for this plan */
  id: string;
  /** Display name of the orchestration plan */
  name: string;
  /** Ordered list of phases in this plan */
  phases: OrchestrationPhase[];
  /** Gates controlling transitions between phases/waves */
  gates: OrchestrationGate[];
  /** Prompt template for agent handoffs */
  handoffPrompt: string;
}

/**
 * Status of a wave execution.
 */
export type WaveStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';

/**
 * Status of a phase execution.
 */
export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Runtime state of a wave during orchestration execution.
 */
export interface WaveExecutionState {
  /** Wave ID */
  waveId: string;
  /** Current execution status */
  status: WaveStatus;
  /** Timestamp when wave started */
  startedAt?: string;
  /** Timestamp when wave completed */
  completedAt?: string;
  /** Error message if wave failed */
  error?: string;
  /** Progress percentage (0-100) */
  progress: number;
}

/**
 * Runtime state of a phase during orchestration execution.
 */
export interface PhaseExecutionState {
  /** Phase number */
  phaseNumber: number;
  /** Current execution status */
  status: PhaseStatus;
  /** Execution states for waves in this phase */
  waves: WaveExecutionState[];
  /** Timestamp when phase started */
  startedAt?: string;
  /** Timestamp when phase completed */
  completedAt?: string;
}

/**
 * Complete runtime state of an orchestration plan execution.
 */
export interface OrchestrationExecutionState {
  /** Plan ID being executed */
  planId: string;
  /** Current phase number being executed */
  currentPhase: number;
  /** Current wave ID being executed */
  currentWave: string;
  /** Execution states for all phases */
  phases: PhaseExecutionState[];
  /** Overall execution status */
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  /** Timestamp when execution started */
  startedAt: string;
  /** Timestamp when execution completed */
  completedAt?: string;
}

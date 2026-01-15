/**
 * PostgreSQL Database Client for BigTurbo Agent Audit System
 *
 * Uses @vercel/postgres for NeonDB/Vercel Postgres connections
 * with built-in connection pooling.
 */

import { sql, db } from '@vercel/postgres';

// ============================================================================
// Placeholder Types (will be imported from ./audit/types.ts when created)
// ============================================================================

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  version: string;
  status: 'active' | 'inactive' | 'deprecated';
  config: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  agent_id: string;
  steps: WorkflowStep[];
  status: 'active' | 'inactive' | 'draft';
  created_at: Date;
  updated_at: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  order: number;
}

export interface Command {
  id: string;
  name: string;
  description: string | null;
  agent_id: string;
  command_type: string;
  parameters: CommandParameter[];
  created_at: Date;
  updated_at: Date;
}

export interface CommandParameter {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
  description?: string;
}

export interface Trace {
  id: string;
  agent_id: string;
  workflow_id: string | null;
  command_id: string | null;
  session_id: string;
  parent_trace_id: string | null;
  name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error: string | null;
  duration_ms: number | null;
  tokens_used: number | null;
  cost: number | null;
  metadata: Record<string, unknown>;
  started_at: Date;
  completed_at: Date | null;
  created_at: Date;
}

export interface Export {
  id: string;
  name: string;
  description: string | null;
  export_type: 'traces' | 'agents' | 'workflows' | 'analytics';
  format: 'json' | 'csv' | 'parquet';
  filters: ExportFilters;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url: string | null;
  file_size_bytes: number | null;
  record_count: number | null;
  error: string | null;
  requested_by: string;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
}

export interface ExportFilters {
  agent_ids?: string[];
  workflow_ids?: string[];
  date_from?: string;
  date_to?: string;
  status?: string[];
}

// ============================================================================
// Database Connection
// ============================================================================

/**
 * Get a pooled database client for transactions or multiple queries.
 * Remember to release the client after use.
 *
 * @example
 * const client = await getClient();
 * try {
 *   await client.sql`BEGIN`;
 *   // ... queries
 *   await client.sql`COMMIT`;
 * } catch (e) {
 *   await client.sql`ROLLBACK`;
 *   throw e;
 * }
 */
export async function getClient() {
  return await db.connect();
}

// ============================================================================
// Generic Query Functions
// ============================================================================

/**
 * Execute a raw SQL query with parameters.
 * Uses connection pooling automatically.
 *
 * @param text - SQL query string
 * @param params - Query parameters (optional)
 * @returns Array of rows
 *
 * @example
 * const users = await query<User>('SELECT * FROM users WHERE status = $1', ['active']);
 */
export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await db.connect();
  try {
    const result = params
      ? await client.query(text, params)
      : await client.query(text);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

/**
 * Execute a query and return a single row or null.
 *
 * @param text - SQL query string
 * @param params - Query parameters (optional)
 * @returns Single row or null
 */
export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

// ============================================================================
// Agent Operations
// ============================================================================

/**
 * Fetch all agents from the database.
 *
 * @param options - Optional filters
 * @returns Array of agents
 */
export async function getAgents(options?: {
  status?: Agent['status'];
  limit?: number;
  offset?: number;
}): Promise<Agent[]> {
  let queryText = 'SELECT * FROM agents';
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (options?.status) {
    conditions.push(`status = $${params.length + 1}`);
    params.push(options.status);
  }

  if (conditions.length > 0) {
    queryText += ' WHERE ' + conditions.join(' AND ');
  }

  queryText += ' ORDER BY created_at DESC';

  if (options?.limit) {
    queryText += ` LIMIT $${params.length + 1}`;
    params.push(options.limit);
  }

  if (options?.offset) {
    queryText += ` OFFSET $${params.length + 1}`;
    params.push(options.offset);
  }

  return query<Agent>(queryText, params);
}

/**
 * Fetch a single agent by name.
 *
 * @param name - Agent name
 * @returns Agent or null if not found
 */
export async function getAgentByName(name: string): Promise<Agent | null> {
  return queryOne<Agent>(
    'SELECT * FROM agents WHERE name = $1',
    [name]
  );
}

/**
 * Fetch a single agent by ID.
 *
 * @param id - Agent ID
 * @returns Agent or null if not found
 */
export async function getAgentById(id: string): Promise<Agent | null> {
  return queryOne<Agent>(
    'SELECT * FROM agents WHERE id = $1',
    [id]
  );
}

/**
 * Create a new agent.
 *
 * @param agent - Agent data
 * @returns Created agent
 */
export async function createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<Agent> {
  const result = await query<Agent>(
    `INSERT INTO agents (name, description, version, status, config)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [agent.name, agent.description, agent.version, agent.status, JSON.stringify(agent.config)]
  );
  return result[0];
}

/**
 * Update an existing agent.
 *
 * @param id - Agent ID
 * @param updates - Fields to update
 * @returns Updated agent or null
 */
export async function updateAgent(
  id: string,
  updates: Partial<Omit<Agent, 'id' | 'created_at' | 'updated_at'>>
): Promise<Agent | null> {
  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    params.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    params.push(updates.description);
  }
  if (updates.version !== undefined) {
    fields.push(`version = $${paramIndex++}`);
    params.push(updates.version);
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    params.push(updates.status);
  }
  if (updates.config !== undefined) {
    fields.push(`config = $${paramIndex++}`);
    params.push(JSON.stringify(updates.config));
  }

  if (fields.length === 0) return getAgentById(id);

  fields.push(`updated_at = NOW()`);
  params.push(id);

  const result = await query<Agent>(
    `UPDATE agents SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  return result[0] ?? null;
}

// ============================================================================
// Workflow Operations
// ============================================================================

/**
 * Fetch all workflows from the database.
 *
 * @param options - Optional filters
 * @returns Array of workflows
 */
export async function getWorkflows(options?: {
  agent_id?: string;
  status?: Workflow['status'];
  limit?: number;
  offset?: number;
}): Promise<Workflow[]> {
  let queryText = 'SELECT * FROM workflows';
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (options?.agent_id) {
    conditions.push(`agent_id = $${params.length + 1}`);
    params.push(options.agent_id);
  }

  if (options?.status) {
    conditions.push(`status = $${params.length + 1}`);
    params.push(options.status);
  }

  if (conditions.length > 0) {
    queryText += ' WHERE ' + conditions.join(' AND ');
  }

  queryText += ' ORDER BY created_at DESC';

  if (options?.limit) {
    queryText += ` LIMIT $${params.length + 1}`;
    params.push(options.limit);
  }

  if (options?.offset) {
    queryText += ` OFFSET $${params.length + 1}`;
    params.push(options.offset);
  }

  return query<Workflow>(queryText, params);
}

/**
 * Fetch a single workflow by ID.
 *
 * @param id - Workflow ID
 * @returns Workflow or null if not found
 */
export async function getWorkflowById(id: string): Promise<Workflow | null> {
  return queryOne<Workflow>(
    'SELECT * FROM workflows WHERE id = $1',
    [id]
  );
}

/**
 * Create a new workflow.
 *
 * @param workflow - Workflow data
 * @returns Created workflow
 */
export async function createWorkflow(
  workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>
): Promise<Workflow> {
  const result = await query<Workflow>(
    `INSERT INTO workflows (name, description, agent_id, steps, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      workflow.name,
      workflow.description,
      workflow.agent_id,
      JSON.stringify(workflow.steps),
      workflow.status
    ]
  );
  return result[0];
}

// ============================================================================
// Command Operations
// ============================================================================

/**
 * Fetch all commands from the database.
 *
 * @param options - Optional filters
 * @returns Array of commands
 */
export async function getCommands(options?: {
  agent_id?: string;
  command_type?: string;
  limit?: number;
  offset?: number;
}): Promise<Command[]> {
  let queryText = 'SELECT * FROM commands';
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (options?.agent_id) {
    conditions.push(`agent_id = $${params.length + 1}`);
    params.push(options.agent_id);
  }

  if (options?.command_type) {
    conditions.push(`command_type = $${params.length + 1}`);
    params.push(options.command_type);
  }

  if (conditions.length > 0) {
    queryText += ' WHERE ' + conditions.join(' AND ');
  }

  queryText += ' ORDER BY created_at DESC';

  if (options?.limit) {
    queryText += ` LIMIT $${params.length + 1}`;
    params.push(options.limit);
  }

  if (options?.offset) {
    queryText += ` OFFSET $${params.length + 1}`;
    params.push(options.offset);
  }

  return query<Command>(queryText, params);
}

/**
 * Fetch a single command by ID.
 *
 * @param id - Command ID
 * @returns Command or null if not found
 */
export async function getCommandById(id: string): Promise<Command | null> {
  return queryOne<Command>(
    'SELECT * FROM commands WHERE id = $1',
    [id]
  );
}

/**
 * Create a new command.
 *
 * @param command - Command data
 * @returns Created command
 */
export async function createCommand(
  command: Omit<Command, 'id' | 'created_at' | 'updated_at'>
): Promise<Command> {
  const result = await query<Command>(
    `INSERT INTO commands (name, description, agent_id, command_type, parameters)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      command.name,
      command.description,
      command.agent_id,
      command.command_type,
      JSON.stringify(command.parameters)
    ]
  );
  return result[0];
}

// ============================================================================
// Trace Operations
// ============================================================================

/**
 * Fetch traces from the database with optional filters.
 *
 * @param options - Optional filters
 * @returns Array of traces
 */
export async function getTraces(options?: {
  agent_id?: string;
  workflow_id?: string;
  command_id?: string;
  session_id?: string;
  status?: Trace['status'];
  date_from?: Date;
  date_to?: Date;
  limit?: number;
  offset?: number;
}): Promise<Trace[]> {
  let queryText = 'SELECT * FROM traces';
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (options?.agent_id) {
    conditions.push(`agent_id = $${params.length + 1}`);
    params.push(options.agent_id);
  }

  if (options?.workflow_id) {
    conditions.push(`workflow_id = $${params.length + 1}`);
    params.push(options.workflow_id);
  }

  if (options?.command_id) {
    conditions.push(`command_id = $${params.length + 1}`);
    params.push(options.command_id);
  }

  if (options?.session_id) {
    conditions.push(`session_id = $${params.length + 1}`);
    params.push(options.session_id);
  }

  if (options?.status) {
    conditions.push(`status = $${params.length + 1}`);
    params.push(options.status);
  }

  if (options?.date_from) {
    conditions.push(`started_at >= $${params.length + 1}`);
    params.push(options.date_from);
  }

  if (options?.date_to) {
    conditions.push(`started_at <= $${params.length + 1}`);
    params.push(options.date_to);
  }

  if (conditions.length > 0) {
    queryText += ' WHERE ' + conditions.join(' AND ');
  }

  queryText += ' ORDER BY started_at DESC';

  if (options?.limit) {
    queryText += ` LIMIT $${params.length + 1}`;
    params.push(options.limit);
  }

  if (options?.offset) {
    queryText += ` OFFSET $${params.length + 1}`;
    params.push(options.offset);
  }

  return query<Trace>(queryText, params);
}

/**
 * Fetch a single trace by ID.
 *
 * @param id - Trace ID
 * @returns Trace or null if not found
 */
export async function getTraceById(id: string): Promise<Trace | null> {
  return queryOne<Trace>(
    'SELECT * FROM traces WHERE id = $1',
    [id]
  );
}

/**
 * Create a new trace record.
 *
 * @param trace - Trace data
 * @returns Created trace
 */
export async function createTrace(
  trace: Omit<Trace, 'id' | 'created_at'>
): Promise<Trace> {
  const result = await query<Trace>(
    `INSERT INTO traces (
      agent_id, workflow_id, command_id, session_id, parent_trace_id,
      name, input, output, status, error, duration_ms, tokens_used,
      cost, metadata, started_at, completed_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *`,
    [
      trace.agent_id,
      trace.workflow_id,
      trace.command_id,
      trace.session_id,
      trace.parent_trace_id,
      trace.name,
      JSON.stringify(trace.input),
      trace.output ? JSON.stringify(trace.output) : null,
      trace.status,
      trace.error,
      trace.duration_ms,
      trace.tokens_used,
      trace.cost,
      JSON.stringify(trace.metadata),
      trace.started_at,
      trace.completed_at
    ]
  );
  return result[0];
}

/**
 * Update an existing trace (typically to mark as completed or failed).
 *
 * @param id - Trace ID
 * @param updates - Fields to update
 * @returns Updated trace or null
 */
export async function updateTrace(
  id: string,
  updates: Partial<Pick<Trace, 'output' | 'status' | 'error' | 'duration_ms' | 'tokens_used' | 'cost' | 'completed_at'>>
): Promise<Trace | null> {
  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (updates.output !== undefined) {
    fields.push(`output = $${paramIndex++}`);
    params.push(JSON.stringify(updates.output));
  }
  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    params.push(updates.status);
  }
  if (updates.error !== undefined) {
    fields.push(`error = $${paramIndex++}`);
    params.push(updates.error);
  }
  if (updates.duration_ms !== undefined) {
    fields.push(`duration_ms = $${paramIndex++}`);
    params.push(updates.duration_ms);
  }
  if (updates.tokens_used !== undefined) {
    fields.push(`tokens_used = $${paramIndex++}`);
    params.push(updates.tokens_used);
  }
  if (updates.cost !== undefined) {
    fields.push(`cost = $${paramIndex++}`);
    params.push(updates.cost);
  }
  if (updates.completed_at !== undefined) {
    fields.push(`completed_at = $${paramIndex++}`);
    params.push(updates.completed_at);
  }

  if (fields.length === 0) return getTraceById(id);

  params.push(id);

  const result = await query<Trace>(
    `UPDATE traces SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  return result[0] ?? null;
}

// ============================================================================
// Export Operations
// ============================================================================

/**
 * Fetch exports from the database with optional filters.
 *
 * @param options - Optional filters
 * @returns Array of exports
 */
export async function getExports(options?: {
  export_type?: Export['export_type'];
  status?: Export['status'];
  requested_by?: string;
  limit?: number;
  offset?: number;
}): Promise<Export[]> {
  let queryText = 'SELECT * FROM exports';
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (options?.export_type) {
    conditions.push(`export_type = $${params.length + 1}`);
    params.push(options.export_type);
  }

  if (options?.status) {
    conditions.push(`status = $${params.length + 1}`);
    params.push(options.status);
  }

  if (options?.requested_by) {
    conditions.push(`requested_by = $${params.length + 1}`);
    params.push(options.requested_by);
  }

  if (conditions.length > 0) {
    queryText += ' WHERE ' + conditions.join(' AND ');
  }

  queryText += ' ORDER BY created_at DESC';

  if (options?.limit) {
    queryText += ` LIMIT $${params.length + 1}`;
    params.push(options.limit);
  }

  if (options?.offset) {
    queryText += ` OFFSET $${params.length + 1}`;
    params.push(options.offset);
  }

  return query<Export>(queryText, params);
}

/**
 * Fetch a single export by ID.
 *
 * @param id - Export ID
 * @returns Export or null if not found
 */
export async function getExportById(id: string): Promise<Export | null> {
  return queryOne<Export>(
    'SELECT * FROM exports WHERE id = $1',
    [id]
  );
}

/**
 * Create a new export request.
 *
 * @param exportData - Export data
 * @returns Created export
 */
export async function createExport(
  exportData: Omit<Export, 'id' | 'file_url' | 'file_size_bytes' | 'record_count' | 'error' | 'started_at' | 'completed_at' | 'created_at'>
): Promise<Export> {
  const result = await query<Export>(
    `INSERT INTO exports (name, description, export_type, format, filters, status, requested_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      exportData.name,
      exportData.description,
      exportData.export_type,
      exportData.format,
      JSON.stringify(exportData.filters),
      exportData.status,
      exportData.requested_by
    ]
  );
  return result[0];
}

/**
 * Update an existing export (typically to update status or add file info).
 *
 * @param id - Export ID
 * @param updates - Fields to update
 * @returns Updated export or null
 */
export async function updateExport(
  id: string,
  updates: Partial<Pick<Export, 'status' | 'file_url' | 'file_size_bytes' | 'record_count' | 'error' | 'started_at' | 'completed_at'>>
): Promise<Export | null> {
  const fields: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (updates.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    params.push(updates.status);
  }
  if (updates.file_url !== undefined) {
    fields.push(`file_url = $${paramIndex++}`);
    params.push(updates.file_url);
  }
  if (updates.file_size_bytes !== undefined) {
    fields.push(`file_size_bytes = $${paramIndex++}`);
    params.push(updates.file_size_bytes);
  }
  if (updates.record_count !== undefined) {
    fields.push(`record_count = $${paramIndex++}`);
    params.push(updates.record_count);
  }
  if (updates.error !== undefined) {
    fields.push(`error = $${paramIndex++}`);
    params.push(updates.error);
  }
  if (updates.started_at !== undefined) {
    fields.push(`started_at = $${paramIndex++}`);
    params.push(updates.started_at);
  }
  if (updates.completed_at !== undefined) {
    fields.push(`completed_at = $${paramIndex++}`);
    params.push(updates.completed_at);
  }

  if (fields.length === 0) return getExportById(id);

  params.push(id);

  const result = await query<Export>(
    `UPDATE exports SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  return result[0] ?? null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if the database connection is healthy.
 *
 * @returns True if connection is successful
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Get database statistics for monitoring.
 *
 * @returns Object with table counts
 */
export async function getStats(): Promise<{
  agents: number;
  workflows: number;
  commands: number;
  traces: number;
  exports: number;
}> {
  const [agents, workflows, commands, traces, exports] = await Promise.all([
    queryOne<{ count: string }>('SELECT COUNT(*) as count FROM agents'),
    queryOne<{ count: string }>('SELECT COUNT(*) as count FROM workflows'),
    queryOne<{ count: string }>('SELECT COUNT(*) as count FROM commands'),
    queryOne<{ count: string }>('SELECT COUNT(*) as count FROM traces'),
    queryOne<{ count: string }>('SELECT COUNT(*) as count FROM exports'),
  ]);

  return {
    agents: parseInt(agents?.count ?? '0', 10),
    workflows: parseInt(workflows?.count ?? '0', 10),
    commands: parseInt(commands?.count ?? '0', 10),
    traces: parseInt(traces?.count ?? '0', 10),
    exports: parseInt(exports?.count ?? '0', 10),
  };
}

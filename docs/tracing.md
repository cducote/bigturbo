# Automatic Command Tracing

This document describes the automatic trace collection system for `/commands` in Claude Code, which sends trace data to the BigTurbo audit dashboard.

## 1. Overview

Automatic command tracing captures execution data when users run structured commands (like `/feature` or `/bugfix`) in Claude Code. This telemetry is invaluable for prompt engineers who need to:

- **Analyze command performance** - Identify slow commands or bottlenecks
- **Debug agent workflows** - See exactly which tools were called and in what order
- **Optimize prompts** - Understand how agents respond to different command structures
- **Track usage patterns** - Know which commands are used most frequently
- **Improve reliability** - Detect and fix recurring failures in workflows

Traces are automatically sent to the BigTurbo audit dashboard where they can be viewed, searched, and analyzed.

## 2. How It Works

The tracing system uses Claude Code hooks to intercept key lifecycle events during command execution.

### Architecture

```
                                    BigTurbo Server
                                   +----------------+
                                   |                |
+-------------------+              |  /api/audit/   |
|   Claude Code     |              |  traces/ingest |
|                   |              |                |
|  UserPromptSubmit +------------->|  trace.create  |
|       Hook        |   POST       |       |        |
|                   |              |       v        |
|   PostToolUse     +------------->|  span.create   |
|      Hook         |   POST       |       |        |
|                   |              |       v        |
|      Stop         +------------->|  trace.update  |
|      Hook         |   POST       |                |
+-------------------+              +----------------+
```

### Hook Execution Flow

```
User types: /feature add user authentication

    |
    v
+-------------------+
| UserPromptSubmit  |  1. Detects "/feature" pattern
|                   |  2. Extracts command name
|                   |  3. Creates trace via API
|                   |  4. Stores TRACE_ID in env
+-------------------+
    |
    v
+-------------------+
|   PostToolUse     |  5. Called after each tool
|   (repeated)      |  6. Creates span with tool name
|                   |  7. Captures input/output
+-------------------+
    |
    v
+-------------------+
|      Stop         |  8. Calculates duration
|                   |  9. Updates trace status
|                   | 10. Marks as "completed"
+-------------------+
```

### Hook Scripts

| Hook | Script | Purpose |
|------|--------|---------|
| UserPromptSubmit | `trace-start.sh` | Detects `/commands`, creates trace, stores trace ID |
| PostToolUse | `trace-span.sh` | Captures each tool call as a span |
| Stop | `trace-end.sh` | Completes trace with final status and duration |

Shared utilities are in `trace-utils.sh` which provides `create_trace()` and `complete_trace()` functions.

## 3. Configuration

### Hook Settings

The hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/trace-start.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/trace-end.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/trace-span.sh"
          }
        ]
      }
    ]
  }
}
```

### Matchers

The `matcher` field determines which prompts/tools trigger the hook:

| Matcher | Effect |
|---------|--------|
| `"*"` | Matches everything (current default) |
| `"/feature*"` | Only match prompts starting with `/feature` |
| `"Read"` | Only match the Read tool (for PostToolUse) |

To trace only specific commands, modify the UserPromptSubmit matcher:

```json
{
  "matcher": "/feature*",
  "hooks": [...]
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BIGTURBO_URL` | Base URL of the BigTurbo server | `http://localhost:3000` |
| `TRACE_WEBHOOK_SECRET` | Authentication secret for the ingest endpoint | (none in dev) |
| `CLAUDE_ENV_FILE` | Path to env file for cross-hook state | Set by Claude Code |
| `CLAUDE_PROJECT_DIR` | Path to the project directory | Set by Claude Code |

Set these in your shell profile or `.env` file:

```bash
export BIGTURBO_URL="https://bigturbo.example.com"
export TRACE_WEBHOOK_SECRET="your-secret-here"
```

## 4. What Gets Traced

### Traced (Structured Commands)

Commands starting with `/` are traced:

- `/feature` - Feature implementation workflows
- `/bugfix` - Bug fixing workflows
- `/refactor` - Refactoring tasks
- `/review-pr` - Pull request reviews
- Any custom command in `.claude/commands/`

Each trace captures:

- **Command name** - The slash command used
- **Input prompt** - Full text entered by user
- **Tool calls** - Each tool invocation as a span
- **Duration** - Total execution time
- **Status** - Completed or error state
- **Agents** - Referenced agents detected from command files

### Not Traced (Regular Chat)

Regular conversational prompts are NOT traced:

- "What does this function do?"
- "Explain this error"
- "How do I install this package?"

This distinction ensures traces remain focused on structured workflows that benefit from telemetry, avoiding noise from casual interactions.

### Span Data

Each tool call creates a span containing:

| Field | Description |
|-------|-------------|
| `traceId` | Parent trace identifier |
| `name` | Tool name (e.g., "Read", "Edit", "Bash") |
| `input` | Tool input parameters (JSON) |
| `output` | Tool output/result |
| `level` | Severity level (DEFAULT) |

## 5. Viewing Traces

### Trace List

Navigate to `/audit/traces` to see all collected traces:

- Filter by command name, status, or date range
- Sort by recency or duration
- Search by trace ID

### Trace Detail

Click any trace or navigate to `/audit/traces/[id]` to see:

- Full command input and context
- Timeline of all tool calls (spans)
- Duration breakdown per tool
- Metadata and agent information

### Metrics Dashboard

Visit `/audit/metrics` for aggregated statistics:

- Command frequency over time
- Average duration by command type
- Success/failure rates
- Most used tools across commands

## 6. Disabling Tracing

### Remove All Tracing

Delete or rename `.claude/settings.json`:

```bash
mv .claude/settings.json .claude/settings.json.disabled
```

### Disable Specific Hooks

Comment out individual hook entries in `.claude/settings.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      // Trace creation disabled
      // {
      //   "matcher": "*",
      //   "hooks": [...]
      // }
    ],
    "PostToolUse": [
      // Span collection disabled
    ],
    "Stop": [
      // Trace completion disabled
    ]
  }
}
```

### Temporary Disable via Environment

Set an invalid URL to silently skip tracing:

```bash
export BIGTURBO_URL=""
```

The hooks will run but API calls will fail silently.

## 7. Troubleshooting

### Traces Not Appearing

1. **Check BIGTURBO_URL**
   ```bash
   echo $BIGTURBO_URL
   # Should output your server URL
   ```

2. **Verify webhook secret matches**
   ```bash
   # On client
   echo $TRACE_WEBHOOK_SECRET

   # On server, check .env
   grep TRACE_WEBHOOK_SECRET .env
   ```

3. **Test the endpoint directly**
   ```bash
   curl -X GET "$BIGTURBO_URL/api/audit/traces/ingest"
   # Should return: {"status":"ok",...}
   ```

4. **Check server logs** for authentication errors (401) or processing errors

### Hook Script Errors

1. **Check script permissions**
   ```bash
   ls -la .claude/hooks/
   # All .sh files should be executable
   chmod +x .claude/hooks/*.sh
   ```

2. **Verify jq is installed**
   ```bash
   which jq
   jq --version
   # Install if missing: brew install jq
   ```

3. **Test scripts manually**
   ```bash
   echo '{"prompt":"/test"}' | .claude/hooks/trace-start.sh
   ```

### Duration Showing 0

The Stop hook needs `CLAUDE_ENV_FILE` to read the start time:

1. **Verify env file exists** - Check that `trace-start.sh` creates entries in `$CLAUDE_ENV_FILE`

2. **Check timing variables**
   ```bash
   cat "$CLAUDE_ENV_FILE" | grep BIGTURBO
   # Should contain BIGTURBO_TRACE_ID and BIGTURBO_TRACE_START
   ```

3. **Ensure hooks run in order** - UserPromptSubmit must complete before Stop

### Spans Not Captured

1. **Verify BIGTURBO_TRACE_ID is set** - PostToolUse hook exits early without it

2. **Check tool input format** - The hook expects `tool_name` or `toolName` in JSON input

## 8. API Reference

### Endpoint

```
POST /api/audit/traces/ingest
```

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `X-Webhook-Secret` | Production | Authentication secret |

### Event Types

#### trace.create

Creates a new trace when a command starts.

**Request:**
```json
{
  "type": "trace.create",
  "payload": {
    "name": "/feature",
    "agentName": "command",
    "commandName": "feature",
    "input": {
      "prompt": "/feature add user authentication"
    },
    "metadata": {
      "agents": ["code-architect", "test-engineer"]
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "traceId": "tr-abc123"
}
```

#### trace.update

Updates an existing trace (typically on completion).

**Request:**
```json
{
  "type": "trace.update",
  "payload": {
    "traceId": "tr-abc123",
    "status": "completed",
    "metadata": {
      "durationMs": 45000
    }
  }
}
```

**Response:**
```json
{
  "success": true
}
```

#### span.create

Creates a span within a trace for a tool call.

**Request:**
```json
{
  "type": "span.create",
  "payload": {
    "traceId": "tr-abc123",
    "name": "Read",
    "input": {
      "file_path": "/path/to/file.ts"
    },
    "output": "file contents...",
    "level": "DEFAULT"
  }
}
```

**Response:**
```json
{
  "success": true,
  "spanId": "sp-xyz789"
}
```

### Batch Ingestion

Multiple events can be sent in a single request:

**Request:**
```json
{
  "batchId": "batch-001",
  "events": [
    { "type": "trace.create", "payload": {...} },
    { "type": "span.create", "payload": {...} },
    { "type": "span.create", "payload": {...} }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "batchId": "batch-001",
  "processed": 3,
  "failed": 0
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 200 | Success |
| 207 | Partial success (batch) |
| 400 | Invalid payload format |
| 401 | Invalid or missing webhook secret |
| 500 | Server error |

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing webhook secret",
  "statusCode": 401
}
```

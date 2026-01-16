#!/bin/bash
# SubagentStop hook - captures subagent (Task tool) completions with output

set -e

source "$CLAUDE_PROJECT_DIR/.claude/hooks/trace-utils.sh"

# Source the trace state file
TRACE_STATE_FILE="/tmp/.bigturbo-trace-state"
if [ -f "$TRACE_STATE_FILE" ]; then
    source "$TRACE_STATE_FILE"
fi

# Also try CLAUDE_ENV_FILE for compatibility
if [ -z "$BIGTURBO_TRACE_ID" ] && [ -n "$CLAUDE_ENV_FILE" ] && [ -f "$CLAUDE_ENV_FILE" ]; then
    source "$CLAUDE_ENV_FILE"
fi

# Only proceed if we have an active trace
if [ -z "$BIGTURBO_TRACE_ID" ]; then
    exit 0
fi

# Read input from stdin (SubagentStop provides session info)
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')

# Extract subagent info from transcript if available
SUBAGENT_OUTPUT=""
SUBAGENT_TYPE=""
SUBAGENT_DESCRIPTION=""

if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
    # Get the last few entries to find the Task tool result
    # Look for the most recent assistant message with Task tool result
    LAST_ENTRIES=$(tail -50 "$TRANSCRIPT_PATH" 2>/dev/null || echo "")

    if [ -n "$LAST_ENTRIES" ]; then
        # Extract subagent type from Task tool call
        SUBAGENT_TYPE=$(echo "$LAST_ENTRIES" | grep -o '"subagent_type"[[:space:]]*:[[:space:]]*"[^"]*"' | tail -1 | sed 's/.*"subagent_type"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")

        # Extract description from Task tool call
        SUBAGENT_DESCRIPTION=$(echo "$LAST_ENTRIES" | grep -o '"description"[[:space:]]*:[[:space:]]*"[^"]*"' | tail -1 | sed 's/.*"description"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")

        # Try to extract the tool result content (the subagent's output)
        # This looks for content after "tool_result" or function results
        SUBAGENT_OUTPUT=$(echo "$LAST_ENTRIES" | \
            grep -A 5 '"type"[[:space:]]*:[[:space:]]*"tool_result"' | \
            grep -o '"content"[[:space:]]*:[[:space:]]*"[^"]*"' | \
            tail -1 | \
            sed 's/.*"content"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | \
            head -c 10000 || echo "")
    fi
fi

# Create span for subagent completion
PAYLOAD=$(jq -n \
    --arg traceId "$BIGTURBO_TRACE_ID" \
    --arg name "subagent:${SUBAGENT_TYPE:-unknown}" \
    --arg operationType "subagent_completion" \
    --arg agentName "${SUBAGENT_TYPE:-subagent}" \
    --arg description "$SUBAGENT_DESCRIPTION" \
    --arg output "$SUBAGENT_OUTPUT" \
    --arg sessionId "$SESSION_ID" \
    '{
        type: "span.create",
        payload: {
            traceId: $traceId,
            name: $name,
            operationType: $operationType,
            agentName: $agentName,
            input: {
                description: $description,
                sessionId: $sessionId
            },
            output: $output,
            metadata: {
                subagentType: $agentName,
                hasOutput: ($output | length > 0)
            }
        }
    }')

curl -s -X POST "$INGEST_URL" \
    -H "Content-Type: application/json" \
    -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
    -d "$PAYLOAD" > /dev/null

exit 0

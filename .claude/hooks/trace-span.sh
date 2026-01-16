#!/bin/bash
# PostToolUse hook - captures tool calls as spans with transcript context

set -e

source "$CLAUDE_PROJECT_DIR/.claude/hooks/trace-utils.sh"

# Source the trace state file (written by trace-start.sh)
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

# Read input from stdin (PostToolUse provides tool info)
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // .toolName // empty')
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // .input // "{}"')
TOOL_OUTPUT=$(echo "$INPUT" | jq -r '.tool_output // .output // ""')
TOOL_USE_ID=$(echo "$INPUT" | jq -r '.tool_use_id // empty')
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')

# Extract context from transcript if available
REASONING=""
DECISION_CONTEXT=""

if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
    # Get recent transcript entries for context (last 20 lines should be enough)
    RECENT_TRANSCRIPT=$(tail -20 "$TRANSCRIPT_PATH" 2>/dev/null || echo "")

    if [ -n "$RECENT_TRANSCRIPT" ]; then
        # Try to extract any thinking/reasoning before this tool call
        # Look for text content that precedes the tool use
        REASONING=$(echo "$RECENT_TRANSCRIPT" | \
            grep -o '"text"[[:space:]]*:[[:space:]]*"[^"]*"' | \
            tail -1 | \
            sed 's/.*"text"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' | \
            head -c 500 || echo "")

        # For Task tool calls, extract the subagent type and description
        if [ "$TOOL_NAME" = "Task" ]; then
            SUBAGENT_TYPE=$(echo "$TOOL_INPUT" | jq -r '.subagent_type // empty' 2>/dev/null || echo "")
            TASK_DESCRIPTION=$(echo "$TOOL_INPUT" | jq -r '.description // empty' 2>/dev/null || echo "")
            TASK_PROMPT=$(echo "$TOOL_INPUT" | jq -r '.prompt // empty' 2>/dev/null | head -c 1000 || echo "")

            # Store current subagent for other hooks
            if [ -n "$SUBAGENT_TYPE" ]; then
                echo "export BIGTURBO_CURRENT_AGENT=\"$SUBAGENT_TYPE\"" >> "$TRACE_STATE_FILE"
            fi
        fi
    fi
fi

if [ -n "$TOOL_NAME" ]; then
    # Map tool name to operation type
    OPERATION_TYPE="tool_use"
    case "$TOOL_NAME" in
        Read)
            OPERATION_TYPE="file_read"
            ;;
        Write)
            OPERATION_TYPE="file_write"
            ;;
        Edit)
            OPERATION_TYPE="file_edit"
            ;;
        Glob|Grep)
            OPERATION_TYPE="search"
            ;;
        Task)
            OPERATION_TYPE="subagent_launch"
            ;;
        Bash)
            OPERATION_TYPE="command_execution"
            ;;
        TodoWrite)
            OPERATION_TYPE="planning"
            ;;
    esac

    # Build metadata with transcript context
    METADATA=$(jq -n \
        --arg output "$TOOL_OUTPUT" \
        --arg reasoning "$REASONING" \
        --arg toolUseId "$TOOL_USE_ID" \
        --arg subagentType "${SUBAGENT_TYPE:-}" \
        --arg taskDescription "${TASK_DESCRIPTION:-}" \
        '{
            output: $output,
            reasoning: (if $reasoning != "" then $reasoning else null end),
            toolUseId: (if $toolUseId != "" then $toolUseId else null end),
            subagentType: (if $subagentType != "" then $subagentType else null end),
            taskDescription: (if $taskDescription != "" then $taskDescription else null end)
        } | with_entries(select(.value != null))')

    # Build input with task prompt if available
    INPUT_JSON=$(echo "$TOOL_INPUT" | jq '.' 2>/dev/null || echo '{}')
    if [ -n "$TASK_PROMPT" ] && [ "$TOOL_NAME" = "Task" ]; then
        INPUT_JSON=$(echo "$INPUT_JSON" | jq --arg prompt "$TASK_PROMPT" '. + {promptPreview: ($prompt | .[0:500])}' 2>/dev/null || echo "$INPUT_JSON")
    fi

    # Create span for this tool call
    PAYLOAD=$(jq -n \
        --arg traceId "$BIGTURBO_TRACE_ID" \
        --arg name "$TOOL_NAME" \
        --arg operationType "$OPERATION_TYPE" \
        --arg agentName "${BIGTURBO_CURRENT_AGENT:-command}" \
        --argjson input "$INPUT_JSON" \
        --argjson metadata "$METADATA" \
        '{
            type: "span.create",
            payload: {
                traceId: $traceId,
                name: $name,
                operationType: $operationType,
                agentName: $agentName,
                input: $input,
                metadata: $metadata
            }
        }')

    curl -s -X POST "$INGEST_URL" \
        -H "Content-Type: application/json" \
        -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
        -d "$PAYLOAD" > /dev/null
fi

exit 0

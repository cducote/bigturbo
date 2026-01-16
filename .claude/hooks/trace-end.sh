#!/bin/bash
# Stop hook - completes traces and captures Claude's full response

set -e
source "$CLAUDE_PROJECT_DIR/.claude/hooks/trace-utils.sh"

# Read stdin first (Claude sends event data here)
INPUT=$(cat)

# DEBUG: Capture what Claude sends at Stop
DEBUG_FILE="/tmp/debug-stop-$(date +%s).json"
echo "$INPUT" > "$DEBUG_FILE"

# Extract transcript path from the input
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')

# Source the trace state file (written by trace-start.sh)
TRACE_STATE_FILE="/tmp/.bigturbo-trace-state"
if [ -f "$TRACE_STATE_FILE" ]; then
    source "$TRACE_STATE_FILE"
fi

# Also try CLAUDE_ENV_FILE for compatibility
if [ -z "$BIGTURBO_TRACE_ID" ] && [ -n "$CLAUDE_ENV_FILE" ] && [ -f "$CLAUDE_ENV_FILE" ]; then
    source "$CLAUDE_ENV_FILE"
fi

# Check if we have an active trace
if [ -n "$BIGTURBO_TRACE_ID" ]; then
    # Calculate duration
    END_TIME=$(date +%s)
    DURATION_MS=$(( (END_TIME - BIGTURBO_TRACE_START) * 1000 ))
    
    # Extract Claude's response from transcript
    CLAUDE_OUTPUT=""
    if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
        # Parse JSONL transcript - get the last assistant message with text content
        # The transcript format: {"message": {"role": "assistant", "content": [{"type": "text", "text": "..."}]}}
        CLAUDE_OUTPUT=$(tail -50 "$TRANSCRIPT_PATH" 2>/dev/null | \
            jq -rs '[.[] | select(.message.role == "assistant") | .message.content[]? | select(.type == "text") | .text] | last // empty' 2>/dev/null | \
            head -c 5000 || echo "")
    fi

    # Complete trace with output
    complete_trace "$BIGTURBO_TRACE_ID" "completed" "$DURATION_MS" "$CLAUDE_OUTPUT"

    # Clean up state file to prevent stale state
    rm -f "$TRACE_STATE_FILE"
fi

exit 0

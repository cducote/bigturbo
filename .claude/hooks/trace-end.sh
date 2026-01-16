#!/bin/bash
# Stop hook - completes traces

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

# Check if we have an active trace
if [ -n "$BIGTURBO_TRACE_ID" ]; then
    # Calculate duration
    END_TIME=$(date +%s)
    DURATION_MS=$(( (END_TIME - BIGTURBO_TRACE_START) * 1000 ))

    # Complete trace
    complete_trace "$BIGTURBO_TRACE_ID" "completed" "$DURATION_MS"

    # Clean up state file to prevent stale state
    rm -f "$TRACE_STATE_FILE"
fi

exit 0

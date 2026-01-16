#!/bin/bash
# Shared utilities for trace hooks

# Load environment variables from .env file if not already set
load_env_file() {
    local ENV_FILE="$CLAUDE_PROJECT_DIR/.env"
    if [ -f "$ENV_FILE" ]; then
        # Read TRACE_WEBHOOK_SECRET from .env if not already set
        if [ -z "$TRACE_WEBHOOK_SECRET" ]; then
            local SECRET=$(grep -E "^TRACE_WEBHOOK_SECRET=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2-)
            if [ -n "$SECRET" ]; then
                export TRACE_WEBHOOK_SECRET="$SECRET"
            fi
        fi
        # Read BIGTURBO_URL from .env if not already set
        if [ -z "$BIGTURBO_URL" ]; then
            local URL=$(grep -E "^BIGTURBO_URL=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2-)
            if [ -n "$URL" ]; then
                export BIGTURBO_URL="$URL"
            fi
        fi
    fi
}

# Load environment on source
load_env_file

INGEST_URL="${BIGTURBO_URL:-http://localhost:3000}/api/audit/traces/ingest"
WEBHOOK_SECRET="${TRACE_WEBHOOK_SECRET:-}"

create_trace() {
    local COMMAND_NAME="$1"
    local PROMPT="$2"
    local AGENTS="${3:-}"

    local PAYLOAD
    if [ -n "$AGENTS" ]; then
        PAYLOAD=$(jq -n \
            --arg cmd "$COMMAND_NAME" \
            --arg prompt "$PROMPT" \
            --arg agents "$AGENTS" \
            '{
                type: "trace.create",
                payload: {
                    name: ("/" + $cmd),
                    agentName: "command",
                    commandName: $cmd,
                    input: { prompt: $prompt },
                    metadata: { agents: ($agents | split(",")) }
                }
            }')
    else
        PAYLOAD=$(jq -n \
            --arg cmd "$COMMAND_NAME" \
            --arg prompt "$PROMPT" \
            '{
                type: "trace.create",
                payload: {
                    name: ("/" + $cmd),
                    agentName: "command",
                    commandName: $cmd,
                    input: { prompt: $prompt }
                }
            }')
    fi

    local RESPONSE=$(curl -s -X POST "$INGEST_URL" \
        -H "Content-Type: application/json" \
        -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
        -d "$PAYLOAD")

    echo "$RESPONSE" | jq -r '.traceId // empty'
}

complete_trace() {
    local TRACE_ID="$1"
    local STATUS="$2"
    local DURATION_MS="$3"
    local OUTPUT="${4:-}"  # Optional: Claude's response output

    # Build payload with optional output field
    local PAYLOAD
    if [ -n "$OUTPUT" ]; then
        PAYLOAD=$(jq -n \
            --arg id "$TRACE_ID" \
            --arg status "$STATUS" \
            --argjson duration "$DURATION_MS" \
            --arg output "$OUTPUT" \
            '{
                type: "trace.update",
                payload: {
                    traceId: $id,
                    status: $status,
                    output: $output,
                    metadata: { durationMs: $duration }
                }
            }')
    else
        PAYLOAD=$(jq -n \
            --arg id "$TRACE_ID" \
            --arg status "$STATUS" \
            --argjson duration "$DURATION_MS" \
            '{
                type: "trace.update",
                payload: {
                    traceId: $id,
                    status: $status,
                    metadata: { durationMs: $duration }
                }
            }')
    fi

    curl -s -X POST "$INGEST_URL" \
        -H "Content-Type: application/json" \
        -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
        -d "$PAYLOAD" > /dev/null
}

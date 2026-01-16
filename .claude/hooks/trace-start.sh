#!/bin/bash
# UserPromptSubmit hook - detects /commands and creates traces

set -e
source "$CLAUDE_PROJECT_DIR/.claude/hooks/trace-utils.sh"

# Read input from stdin
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty')

# Detect @agent invocation from prompt (e.g., @.claude/agents/refactoring-specialist.md)
PROMPT_AGENT=""
if [[ "$PROMPT" =~ @\.claude/agents/([a-zA-Z0-9_-]+)\.md ]]; then
    PROMPT_AGENT="${BASH_REMATCH[1]}"
elif [[ "$PROMPT" =~ @([a-zA-Z0-9_-]+) ]]; then
    # Also match simple @agent-name patterns
    PROMPT_AGENT="${BASH_REMATCH[1]}"
fi

# Function to detect agents from command file
detect_agents() {
    local COMMAND_NAME="$1"
    local COMMAND_FILE="$CLAUDE_PROJECT_DIR/.claude/commands/${COMMAND_NAME}.md"
    local AGENTS=""

    if [ -f "$COMMAND_FILE" ]; then
        # Extract agent references (patterns like **agent-name** or agent-name in workflow lists)
        # Looks for known agent patterns in the command file
        AGENTS=$(grep -oE '\*\*[a-z]+-[a-z]+\*\*' "$COMMAND_FILE" 2>/dev/null | \
            sed 's/\*\*//g' | \
            sort -u | \
            tr '\n' ',' | \
            sed 's/,$//')

        # If no bold patterns found, try to match against known agents directory
        if [ -z "$AGENTS" ] && [ -d "$CLAUDE_PROJECT_DIR/.claude/agents" ]; then
            for AGENT_FILE in "$CLAUDE_PROJECT_DIR/.claude/agents"/*.md; do
                AGENT_NAME=$(basename "$AGENT_FILE" .md)
                if grep -q "$AGENT_NAME" "$COMMAND_FILE" 2>/dev/null; then
                    if [ -z "$AGENTS" ]; then
                        AGENTS="$AGENT_NAME"
                    else
                        AGENTS="$AGENTS,$AGENT_NAME"
                    fi
                fi
            done
        fi
    fi

    echo "$AGENTS"
}

# Check if this is a /command
if [[ "$PROMPT" =~ ^/([a-zA-Z0-9_-]+) ]]; then
    COMMAND_NAME="${BASH_REMATCH[1]}"

    # Detect agents involved in this command
    DETECTED_AGENTS=$(detect_agents "$COMMAND_NAME")

    # Create trace with agent info - pass PROMPT_AGENT as primary agent
    TRACE_ID=$(create_trace "$COMMAND_NAME" "$PROMPT" "$DETECTED_AGENTS" "$PROMPT_AGENT")

    # Store trace ID and metadata for other hooks
    # Use fixed file path since CLAUDE_ENV_FILE is not always available
    TRACE_STATE_FILE="/tmp/.bigturbo-trace-state"
    echo "export BIGTURBO_TRACE_ID=$TRACE_ID" > "$TRACE_STATE_FILE"
    echo "export BIGTURBO_TRACE_START=$(date +%s)" >> "$TRACE_STATE_FILE"
    if [ -n "$DETECTED_AGENTS" ]; then
        echo "export BIGTURBO_AGENTS=\"$DETECTED_AGENTS\"" >> "$TRACE_STATE_FILE"
    fi
    # Store prompt-detected agent as primary agent for spans
    if [ -n "$PROMPT_AGENT" ]; then
        echo "export BIGTURBO_CURRENT_AGENT=\"$PROMPT_AGENT\"" >> "$TRACE_STATE_FILE"
    elif [ -n "$DETECTED_AGENTS" ]; then
        # Use first detected agent as primary
        PRIMARY_AGENT=$(echo "$DETECTED_AGENTS" | cut -d',' -f1)
        echo "export BIGTURBO_CURRENT_AGENT=\"$PRIMARY_AGENT\"" >> "$TRACE_STATE_FILE"
    fi

    # Also write to CLAUDE_ENV_FILE if available (for compatibility)
    if [ -n "$CLAUDE_ENV_FILE" ]; then
        cat "$TRACE_STATE_FILE" >> "$CLAUDE_ENV_FILE"
    fi

    # Output context for Claude (optional)
    if [ -n "$DETECTED_AGENTS" ]; then
        echo "Trace started: $TRACE_ID (agents: $DETECTED_AGENTS)"
    else
        echo "Trace started: $TRACE_ID"
    fi
fi

exit 0

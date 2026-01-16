'use client';

/**
 * AgentBadge - Displays an agent name with their unique color.
 * Used in traces, decision trees, and anywhere agents are referenced.
 */

// Agent styling configuration
interface AgentStyle {
  humanName: string;
  color: string;
  background?: string; // 'transparent' or a color value
  borderGradient?: string; // CSS gradient for border (e.g., "linear-gradient(...)")
}

// Static color mapping for agents - must match .claude/agents/*.md frontmatter
const AGENT_COLORS: Record<string, AgentStyle> = {
  'orchestrator': {
    humanName: 'Oscar',
    color: '#000000',
    background: 'transparent',
    borderGradient: 'linear-gradient(135deg, #ff0080, #ff8c00, #40e0d0, #7b68ee, #ff0080)',
  },
  'fullstack-developer': { humanName: 'Felix', color: '#8b5cf6' },
  'api-designer': { humanName: 'Aria', color: '#0ea5e9' },
  'security-auditor': { humanName: 'Serena', color: '#ef4444' },
  'code-reviewer': { humanName: 'Cody', color: '#f59e0b' },
  'dependency-manager': { humanName: 'Derek', color: '#10b981' },
  'devops-engineer': { humanName: 'Devon', color: '#6366f1' },
  'documentation-engineer': { humanName: 'Dana', color: '#ec4899' },
  'qa-expert': { humanName: 'Quinn', color: '#14b8a6' },
  'refactoring-specialist': { humanName: 'Riley', color: '#f97316' },
  'sql-pro': { humanName: 'Sage', color: '#84cc16' },
  'prompt-engineer': { humanName: 'Penny', color: '#a855f7' },
};

// Default color for unknown agents
const DEFAULT_COLOR = '#64748b';

export interface AgentBadgeProps {
  /** Agent ID (e.g., "fullstack-developer") */
  agentId: string;
  /** Whether to show the human name instead of the agent ID */
  showHumanName?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get agent display info by ID.
 */
export function getAgentInfo(agentId: string): AgentStyle {
  const info = AGENT_COLORS[agentId];
  if (info) {
    return info;
  }
  // Fallback: generate a human-readable name from the ID
  const humanName = agentId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return { humanName, color: DEFAULT_COLOR };
}

/**
 * AgentBadge component - displays an agent with their unique color.
 */
export function AgentBadge({ agentId, showHumanName = false, className = '' }: AgentBadgeProps) {
  const { humanName, color, background, borderGradient } = getAgentInfo(agentId);
  const displayName = showHumanName ? humanName : agentId;

  // Calculate contrasting text color (white for dark backgrounds, dark for light)
  const textColor = getContrastingTextColor(color);

  // Handle gradient border styling using border-image
  if (borderGradient) {
    const bgColor = background === 'transparent' ? 'transparent' : (background || color + '20');

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono ${className}`}
        style={{
          backgroundColor: bgColor,
          border: '1px solid transparent',
          borderImage: `${borderGradient} 1`,
          color: color,
        }}
      >
        {/* Gradient dot indicator */}
        <span
          className="h-2 w-2 flex-shrink-0"
          style={{
            background: borderGradient,
          }}
        />
        {displayName}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs font-mono ${className}`}
      style={{
        backgroundColor: background === 'transparent' ? 'transparent' : (background || color + '20'),
        borderColor: color,
        color: textColor === 'white' ? color : '#0f172a',
      }}
    >
      <span
        className="h-2 w-2 flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {displayName}
    </span>
  );
}

/**
 * Get a contrasting text color (white or dark) for a given background.
 */
function getContrastingTextColor(hexColor: string): 'white' | 'dark' {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? 'dark' : 'white';
}

export default AgentBadge;
